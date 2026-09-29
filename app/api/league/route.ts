import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { clearSession, session, setSession } from "@/lib/auth";
const fail = (error: string, status = 400) =>
  NextResponse.json({ error }, { status });
export async function GET() {
  try {
    const sql = db(),
      s = await session();
    const players =
      await sql`select id,username,claimed,role,team_id from players order by id`;
    const teams =
      await sql`select t.*,p1.username player1,p2.username player2 from teams t join players p1 on p1.id=t.player1_id join players p2 on p2.id=t.player2_id order by t.id`;
    const fixtures =
      await sql`select f.*,coalesce(ht.name,'USER & USER') home_name,coalesce(at.name,'USER & USER') away_name from fixtures f join teams ht on ht.id=f.home_team_id join teams at on at.id=f.away_team_id order by f.scheduled_at nulls last,f.id`;
    let me = null,
      pendingInvites: any[] = [],
      pendingNames: any[] = [];
    if (s) {
      [me] =
        await sql`select id,username,claimed,role,team_id from players where id=${s.playerId}`;
      pendingInvites =
        await sql`select r.id,p.username from_username from team_requests r join players p on p.id=r.from_player_id where r.to_player_id=${s.playerId} and r.status='pending'`;
      if (me?.team_id)
        pendingNames =
          await sql`select n.id,n.name,p.username proposed_by from name_proposals n join players p on p.id=n.proposed_by where n.team_id=${me.team_id} and n.status='pending' and n.proposed_by<>${s.playerId}`;
    }
    return NextResponse.json({
      players,
      teams,
      fixtures,
      me,
      pendingInvites,
      pendingNames,
    });
  } catch (e: any) {
    return fail(e.message, 500);
  }
}
export async function POST(req: Request) {
  try {
    const b: any = await req.json(),
      sql = db();
    if (b.action === "claim") {
      if (!b.username || String(b.password).length < 8)
        return fail("Choose a username and use at least 8 password characters");
      const [p] =
        await sql`select * from players where lower(username)=lower(${b.username})`;
      if (!p || p.claimed) return fail("That profile is unavailable");
      if (
        !p.claim_code_hash ||
        !(await bcrypt.compare(String(b.claimCode), p.claim_code_hash))
      )
        return fail("Invalid claim code");
      const hash = await bcrypt.hash(String(b.password), 12);
      await sql`update players set password_hash=${hash},claimed=true,claim_code_hash=null where id=${p.id}`;
      await setSession(p.id, p.role);
      return NextResponse.json({
        message: "Profile claimed. Welcome to the league.",
      });
    }
    if (b.action === "login") {
      const [p] =
        await sql`select * from players where lower(username)=lower(${b.username})`;
      if (
        !p?.password_hash ||
        !(await bcrypt.compare(String(b.password), p.password_hash))
      )
        return fail("Incorrect username or password", 401);
      await setSession(p.id, p.role);
      return NextResponse.json({ message: "Welcome back." });
    }
    if (b.action === "logout") {
      await clearSession();
      return NextResponse.json({ message: "Logged out." });
    }
    const s = await session();
    if (!s) return fail("Login required", 401);
    const [me] = await sql`select * from players where id=${s.playerId}`;
    if (!me) return fail("Account not found", 401);
    if (b.action === "invite") {
      const [target] =
        await sql`select * from players where id=${b.targetPlayerId}`;
      if (me.team_id || !target || target.team_id || target.id === me.id)
        return fail("That player is not available");
      await sql`insert into team_requests(from_player_id,to_player_id) values(${me.id},${target.id}) on conflict do nothing`;
      return NextResponse.json({ message: "Teammate request sent." });
    }
    if (b.action === "respondInvite") {
      const [r] =
        await sql`select * from team_requests where id=${b.requestId} and to_player_id=${me.id} and status='pending'`;
      if (!r) return fail("Request is no longer available");
      if (!b.accept) {
        await sql`update team_requests set status='rejected' where id=${r.id}`;
        return NextResponse.json({ message: "Request declined." });
      }
      const [a, c] = [
        Math.min(r.from_player_id, r.to_player_id),
        Math.max(r.from_player_id, r.to_player_id),
      ];
      const check =
        await sql`select id from players where id in (${a},${c}) and team_id is not null`;
      if (check.length) return fail("One player already joined a team");
      const [t] =
        await sql`insert into teams(player1_id,player2_id) values(${a},${c}) returning id`;
      await sql.begin(async (tx) => {
        await tx`update players set team_id=${t.id} where id in (${a},${c})`;
        await tx`update team_requests set status='cancelled' where status='pending' and (from_player_id in (${a},${c}) or to_player_id in (${a},${c}))`;
      });
      return NextResponse.json({
        message: "Team formed! You can now suggest a name.",
      });
    }
    if (b.action === "suggestName") {
      const name = String(b.name || "")
        .trim()
        .slice(0, 30);
      if (!me.team_id || name.length < 3)
        return fail("Enter a team name of at least 3 characters");
      const dupe =
        await sql`select id from teams where lower(name)=lower(${name})`;
      if (dupe.length) return fail("That team name is already taken");
      await sql`update name_proposals set status='cancelled' where team_id=${me.team_id} and status='pending'`;
      await sql`insert into name_proposals(team_id,proposed_by,name) values(${me.team_id},${me.id},${name})`;
      return NextResponse.json({ message: "Team name sent for approval." });
    }
    if (b.action === "respondName") {
      const [n] =
        await sql`select * from name_proposals where id=${b.proposalId} and team_id=${me.team_id} and proposed_by<>${me.id} and status='pending'`;
      if (!n) return fail("Proposal is unavailable");
      await sql`update name_proposals set status=${b.accept ? "accepted" : "rejected"} where id=${n.id}`;
      if (b.accept)
        await sql`update teams set name=${n.name} where id=${me.team_id}`;
      return NextResponse.json({
        message: b.accept ? "Official team name approved." : "Name declined.",
      });
    }
    if (!["admin", "owner"].includes(me.role))
      return fail("Admin access required", 403);
    if (b.action === "createFixture") {
      if (b.homeTeamId === b.awayTeamId)
        return fail("Choose two different teams");
      await sql`insert into fixtures(home_team_id,away_team_id,scheduled_at) values(${b.homeTeamId},${b.awayTeamId},${b.scheduledAt || null})`;
      return NextResponse.json({ message: "Fixture created." });
    }
    if (b.action === "setResult") {
      const [f] = await sql`select * from fixtures where id=${b.fixtureId}`;
      if (!f) return fail("Fixture not found");
      await sql.begin(async (tx) => {
        if (f.status === "completed")
          await apply(
            tx,
            f.home_team_id,
            f.away_team_id,
            -f.home_score,
            -f.away_score,
          );
        await tx`update fixtures set home_score=${b.homeScore},away_score=${b.awayScore},status='completed' where id=${f.id}`;
        await apply(
          tx,
          f.home_team_id,
          f.away_team_id,
          +b.homeScore,
          +b.awayScore,
        );
      });
      return NextResponse.json({
        message: "Result saved and table recalculated.",
      });
    }
    if (b.action === "setAdmin") {
      if (me.role !== "owner")
        return fail("Only the owner can appoint admins", 403);
      await sql`update players set role=${b.admin ? "admin" : "player"} where id=${b.playerId} and role<>'owner'`;
      return NextResponse.json({ message: "Admin role updated." });
    }
    return fail("Unknown action");
  } catch (e: any) {
    return fail(e.message, 500);
  }
}
async function apply(tx: any, h: number, a: number, hs: number, as: number) {
  const undo = hs < 0,
    H = Math.abs(hs),
    A = Math.abs(as),
    m = undo ? -1 : 1;
  await tx`update teams set rounds_for=rounds_for+${hs},rounds_against=rounds_against+${as},wins=wins+${m * (H > A ? 1 : 0)},draws=draws+${m * (H === A ? 1 : 0)},losses=losses+${m * (H < A ? 1 : 0)},points=points+${m * (H > A ? 3 : H === A ? 1 : 0)} where id=${h}`;
  await tx`update teams set rounds_for=rounds_for+${as},rounds_against=rounds_against+${hs},wins=wins+${m * (A > H ? 1 : 0)},draws=draws+${m * (H === A ? 1 : 0)},losses=losses+${m * (A < H ? 1 : 0)},points=points+${m * (A > H ? 3 : H === A ? 1 : 0)} where id=${a}`;
}
