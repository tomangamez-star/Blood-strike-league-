import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { clearSession, session, setSession } from "@/lib/auth";
const fail = (error: string, status = 400) =>
  NextResponse.json({ error }, { status });
export async function GET() {
  try {
    const sql = db(),
      s = await session();
    const players =
      await sql`select id,username,coalesce(display_name,username) display_name,bio,avatar_data,accent_color,claimed,role,team_id,last_seen from players order by id`;
    const teams =
      await sql`select t.*,p1.username player1,p2.username player2 from teams t join players p1 on p1.id=t.player1_id join players p2 on p2.id=t.player2_id order by t.id`;
    const fixtures =
      await sql`select f.*,coalesce(ht.name,'USER & USER') home_name,coalesce(at.name,'USER & USER') away_name from fixtures f join teams ht on ht.id=f.home_team_id join teams at on at.id=f.away_team_id order by f.scheduled_at nulls last,f.id`;
    const onlinePlayers =
      await sql`select id,username,coalesce(display_name,username) display_name,avatar_data,accent_color from players where last_seen>now()-interval '5 minutes' order by display_name`;
    const activity =
      await sql`select a.*,coalesce(p.display_name,p.username) actor_name,p.avatar_data from activity a left join players p on p.id=a.actor_id order by a.created_at desc limit 20`;
    let me = null,
      pendingInvites: any[] = [],
      pendingNames: any[] = [],
      claimCodes: any[] = [],
      messages: any[] = [],
      notifications: any[] = [],
      checkins: any[] = [];
    if (s) {
      await sql`update players set last_seen=now() where id=${s.playerId}`;
      [me] =
        await sql`select id,username,coalesce(display_name,username) display_name,bio,avatar_data,accent_color,claimed,role,team_id,last_seen from players where id=${s.playerId}`;
      pendingInvites =
        await sql`select r.id,p.username from_username from team_requests r join players p on p.id=r.from_player_id where r.to_player_id=${s.playerId} and r.status='pending'`;
      if (me?.team_id)
        pendingNames =
          await sql`select n.id,n.name,p.username proposed_by from name_proposals n join players p on p.id=n.proposed_by where n.team_id=${me.team_id} and n.status='pending' and n.proposed_by<>${s.playerId}`;
      if (me?.role === "owner")
        claimCodes =
          await sql`select id,username,claimed,claim_code from players where role<>'owner' order by id`;
      messages = me?.team_id
        ? await sql`select m.*,coalesce(p.display_name,p.username) sender_name,p.username,p.avatar_data,p.accent_color from messages m join players p on p.id=m.sender_id where m.channel='public' or (m.channel='team' and m.team_id=${me.team_id}) order by m.created_at desc limit 80`
        : await sql`select m.*,coalesce(p.display_name,p.username) sender_name,p.username,p.avatar_data,p.accent_color from messages m join players p on p.id=m.sender_id where m.channel='public' order by m.created_at desc limit 80`;
      messages.reverse();
      notifications =
        await sql`select * from notifications where player_id=${me.id} order by created_at desc limit 30`;
      checkins =
        await sql`select fixture_id,player_id from fixture_checkins where player_id=${me.id}`;
    }
    return NextResponse.json({
      players,
      teams,
      fixtures,
      me,
      pendingInvites,
      pendingNames,
      claimCodes,
      messages,
      notifications,
      activity,
      onlinePlayers,
      checkins,
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
      await sql`update players set password_hash=${hash},claimed=true,claim_code_hash=null,claim_code=null where id=${p.id}`;
      await setSession(p.id, p.role);
      return NextResponse.json({
        message: "Profile claimed. Welcome to the league.",
      });
    }
    if (b.action === "login") {
      const [p] =
        await sql`select * from players where lower(username)=lower(${b.username})`;
      if (
        p?.role === "owner" &&
        p.username === "IAlone" &&
        process.env.OWNER_PASSWORD &&
        String(b.password) === process.env.OWNER_PASSWORD
      ) {
        await sql`update players set claimed=true,last_seen=now() where id=${p.id}`;
        await setSession(p.id, p.role);
        return NextResponse.json({ message: "Owner access granted." });
      }
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
    await sql`update players set last_seen=now() where id=${me.id}`;
    if (b.action === "updateProfile") {
      const displayName = String(b.displayName || "")
          .trim()
          .slice(0, 24),
        bio = String(b.bio || "")
          .trim()
          .slice(0, 120),
        allowed = [
          "#ff3347",
          "#37a8ff",
          "#a970ff",
          "#ffb020",
          "#27d69b",
          "#ff5db1",
        ],
        accent = allowed.includes(b.accentColor) ? b.accentColor : "#ff3347",
        avatar = b.avatarData == null ? me.avatar_data : String(b.avatarData);
      if (displayName.length < 2)
        return fail("Display name must be at least 2 characters");
      if (
        avatar &&
        (!avatar.startsWith("data:image/") || avatar.length > 500000)
      )
        return fail("Profile picture is too large");
      await sql`update players set display_name=${displayName},bio=${bio},accent_color=${accent},avatar_data=${avatar} where id=${me.id}`;
      await sql`insert into activity(actor_id,text,kind) values(${me.id},${displayName + " updated their profile"},'profile')`;
      return NextResponse.json({ message: "Profile updated." });
    }
    if (b.action === "changePassword") {
      if (me.role === "owner")
        return fail("Change OWNER_PASSWORD from Render Environment");
      if (String(b.newPassword || "").length < 8)
        return fail("New password must have at least 8 characters");
      if (
        !me.password_hash ||
        !(await bcrypt.compare(String(b.currentPassword), me.password_hash))
      )
        return fail("Current password is incorrect");
      const hash = await bcrypt.hash(String(b.newPassword), 12);
      await sql`update players set password_hash=${hash} where id=${me.id}`;
      return NextResponse.json({ message: "Password changed." });
    }
    if (b.action === "sendMessage") {
      const content = String(b.content || "")
          .trim()
          .slice(0, 300),
        channel = b.channel === "team" ? "team" : "public";
      if (!content) return fail("Write a message first");
      if (channel === "team" && !me.team_id)
        return fail("Join a team to use team chat");
      await sql`insert into messages(sender_id,channel,team_id,content) values(${me.id},${channel},${channel === "team" ? me.team_id : null},${content})`;
      return NextResponse.json({ message: "Message sent." });
    }
    if (b.action === "markNotificationsRead") {
      await sql`update notifications set is_read=true where player_id=${me.id}`;
      return NextResponse.json({ message: "Notifications cleared." });
    }
    if (b.action === "checkIn") {
      const [f] = await sql`select * from fixtures where id=${b.fixtureId}`;
      if (
        !f ||
        !me.team_id ||
        ![f.home_team_id, f.away_team_id].includes(me.team_id)
      )
        return fail("This is not your fixture");
      await sql`insert into fixture_checkins(fixture_id,player_id) values(${f.id},${me.id}) on conflict do nothing`;
      await sql`insert into activity(actor_id,text,kind) values(${me.id},${me.username + " is ready for the next match"},'ready')`;
      return NextResponse.json({ message: "You are marked ready." });
    }
    if (b.action === "invite") {
      const [target] =
        await sql`select * from players where id=${b.targetPlayerId}`;
      if (me.team_id || !target || target.team_id || target.id === me.id)
        return fail("That player is not available");
      await sql`insert into team_requests(from_player_id,to_player_id) values(${me.id},${target.id}) on conflict do nothing`;
      await sql`insert into notifications(player_id,title,body,kind) values(${target.id},'New teammate request',${me.username + " wants to form a duo with you"},'team')`;
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
        ],
        check =
          await sql`select id from players where id in (${a},${c}) and team_id is not null`;
      if (check.length) return fail("One player already joined a team");
      const [t] =
        await sql`insert into teams(player1_id,player2_id) values(${a},${c}) returning id`;
      await sql.begin(async (tx) => {
        await tx`update players set team_id=${t.id} where id in (${a},${c})`;
        await tx`update team_requests set status='cancelled' where status='pending' and (from_player_id in (${a},${c}) or to_player_id in (${a},${c}))`;
        await tx`insert into activity(actor_id,text,kind) values(${me.id},${me.username + " formed a new duo"},'team')`;
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
      if (
        (await sql`select id from teams where lower(name)=lower(${name})`)
          .length
      )
        return fail("That team name is already taken");
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
      await sql`insert into notifications(player_id,title,body,kind) select id,'New fixture','A new league fixture has been scheduled','fixture' from players where claimed=true`;
      await sql`insert into activity(actor_id,text,kind) values(${me.id},'A new fixture was scheduled','fixture')`;
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
      await sql`insert into activity(actor_id,text,kind) values(${me.id},${"Result confirmed: " + b.homeScore + "–" + b.awayScore},'result')`;
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
    if (b.action === "regenerateClaimCode") {
      if (me.role !== "owner") return fail("Owner access required", 403);
      const [target] =
        await sql`select id,claimed,role from players where id=${b.playerId}`;
      if (!target || target.role === "owner" || target.claimed)
        return fail("That player's account cannot receive a new code");
      const code = `BSL-${randomBytes(3).toString("hex").toUpperCase()}`,
        hash = await bcrypt.hash(code, 12);
      await sql`update players set claim_code=${code},claim_code_hash=${hash} where id=${target.id}`;
      return NextResponse.json({ message: `New code created: ${code}` });
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
