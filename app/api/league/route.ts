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
      await sql`select id,username,coalesce(display_name,username) display_name,bio,avatar_data,accent_color,claimed,verified,role,team_id,last_seen from players order by id`;
    const teams =
      await sql`select t.*,p1.username player1,p2.username player2 from teams t join players p1 on p1.id=t.player1_id join players p2 on p2.id=t.player2_id order by t.id`;
    const fixtures =
      await sql`select f.*,coalesce(ht.name,'UNNAMED DUO') home_name,coalesce(at.name,'UNNAMED DUO') away_name,(select count(*)::int from match_hypes h where h.match_kind='team' and h.match_id=f.id) hype_count,exists(select 1 from match_hypes h where h.match_kind='team' and h.match_id=f.id and h.player_id=${s?.playerId || 0}) hyped_by_me from fixtures f join teams ht on ht.id=f.home_team_id join teams at on at.id=f.away_team_id order by f.scheduled_at nulls last,f.id`;
    const individualFixtures =
      await sql`select f.*,coalesce(h.display_name,h.username) home_name,h.username home_username,h.avatar_data home_avatar,h.accent_color home_accent,coalesce(a.display_name,a.username) away_name,a.username away_username,a.avatar_data away_avatar,a.accent_color away_accent,(select count(*)::int from match_hypes x where x.match_kind='individual' and x.match_id=f.id) hype_count,exists(select 1 from match_hypes x where x.match_kind='individual' and x.match_id=f.id and x.player_id=${s?.playerId || 0}) hyped_by_me from individual_fixtures f join players h on h.id=f.home_player_id join players a on a.id=f.away_player_id order by f.scheduled_at nulls last,f.id`;
    const individualStandings =
      await sql`select p.id,p.username,coalesce(p.display_name,p.username) display_name,p.avatar_data,p.accent_color,count(f.id) filter(where f.status='completed')::int played,count(f.id) filter(where f.status='completed' and ((f.home_player_id=p.id and f.home_score>f.away_score) or (f.away_player_id=p.id and f.away_score>f.home_score)))::int wins,count(f.id) filter(where f.status='completed' and f.home_score=f.away_score)::int draws,count(f.id) filter(where f.status='completed' and ((f.home_player_id=p.id and f.home_score<f.away_score) or (f.away_player_id=p.id and f.away_score<f.home_score)))::int losses,coalesce(sum(case when f.status='completed' and f.home_player_id=p.id then f.home_score when f.status='completed' and f.away_player_id=p.id then f.away_score else 0 end),0)::int rounds_for,coalesce(sum(case when f.status='completed' and f.home_player_id=p.id then f.away_score when f.status='completed' and f.away_player_id=p.id then f.home_score else 0 end),0)::int rounds_against,coalesce(sum(case when f.status='completed' and ((f.home_player_id=p.id and f.home_score>f.away_score) or (f.away_player_id=p.id and f.away_score>f.home_score)) then 3 when f.status='completed' and f.home_score=f.away_score then 1 else 0 end),0)::int points from players p left join individual_fixtures f on f.home_player_id=p.id or f.away_player_id=p.id where p.claimed=true group by p.id order by points desc,(coalesce(sum(case when f.status='completed' and f.home_player_id=p.id then f.home_score-f.away_score when f.status='completed' and f.away_player_id=p.id then f.away_score-f.home_score else 0 end),0)) desc,wins desc,p.id`;
    const duels =
      await sql`select d.*,coalesce(c.display_name,c.username) challenger_name,c.username challenger_username,c.avatar_data challenger_avatar,c.accent_color challenger_accent,coalesce(o.display_name,o.username) opponent_name,o.username opponent_username,o.avatar_data opponent_avatar,o.accent_color opponent_accent,(select count(*)::int from match_hypes x where x.match_kind='duel' and x.match_id=d.id) hype_count,exists(select 1 from match_hypes x where x.match_kind='duel' and x.match_id=d.id and x.player_id=${s?.playerId || 0}) hyped_by_me from community_duels d join players c on c.id=d.challenger_id left join players o on o.id=d.opponent_id where d.status<>'cancelled' and (d.status<>'pending' or d.challenger_id=${s?.playerId || 0} or d.opponent_id=${s?.playerId || 0} or ${["admin","owner"].includes(s?.role || "")}) order by coalesce(d.scheduled_at,d.created_at) desc`;
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
        await sql`select id,username,coalesce(display_name,username) display_name,bio,avatar_data,accent_color,claimed,verified,role,team_id,last_seen from players where id=${s.playerId}`;
      pendingInvites =
        await sql`select r.id,p.username from_username from team_requests r join players p on p.id=r.from_player_id where r.to_player_id=${s.playerId} and r.status='pending'`;
      if (me?.team_id)
        pendingNames =
          await sql`select n.id,n.name,p.username proposed_by from name_proposals n join players p on p.id=n.proposed_by where n.team_id=${me.team_id} and n.status='pending' and n.proposed_by<>${s.playerId}`;
      if (me?.role === "owner")
        claimCodes =
          await sql`select id,username,claimed,claim_code from players where role<>'owner' order by id`;
      messages = me?.team_id
        ? await sql`select m.*,coalesce(p.display_name,p.username) sender_name,p.username,p.avatar_data,p.accent_color,(select count(*)::int from message_reactions r where r.message_id=m.id) reaction_count,exists(select 1 from message_reactions r where r.message_id=m.id and r.player_id=${me.id}) reacted_by_me from messages m join players p on p.id=m.sender_id where m.channel='public' or (m.channel='team' and m.team_id=${me.team_id}) order by m.created_at desc limit 80`
        : await sql`select m.*,coalesce(p.display_name,p.username) sender_name,p.username,p.avatar_data,p.accent_color,(select count(*)::int from message_reactions r where r.message_id=m.id) reaction_count,exists(select 1 from message_reactions r where r.message_id=m.id and r.player_id=${me.id}) reacted_by_me from messages m join players p on p.id=m.sender_id where m.channel='public' order by m.created_at desc limit 80`;
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
      individualFixtures,
      individualStandings,
      duels,
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
    if (b.action === "register") {
      const username = String(b.username || "").trim(),
        displayName = String(b.displayName || username).trim().slice(0, 24),
        password = String(b.password || "");
      if (!/^[A-Za-z0-9_.-]{3,20}$/.test(username))
        return fail("Username must be 3–20 letters, numbers, dots, dashes or underscores");
      if (displayName.length < 2) return fail("Enter a display name");
      if (password.length < 8) return fail("Password must have at least 8 characters");
      const taken = await sql`select 1 from players where lower(username)=lower(${username})`;
      if (taken.length) return fail("That Blood Strike username is already registered");
      const hash = await bcrypt.hash(password, 12),
        colours = ["#37a8ff", "#a970ff", "#ffb020", "#27d69b", "#ff5db1"],
        accent = colours[Math.floor(Math.random() * colours.length)];
      const [p] = await sql`insert into players(username,display_name,password_hash,claimed,verified,accent_color) values(${username},${displayName},${hash},true,false,${accent}) returning id,role`;
      await sql`insert into notifications(player_id,title,body,kind) values(${p.id},'Welcome to Strike Network','Your account is live. Build your profile and enter the arena.','welcome')`;
      await sql`insert into activity(actor_id,text,kind) values(${p.id},${displayName + " joined Strike Network"},'member')`;
      await setSession(p.id, p.role);
      return NextResponse.json({ message: "Welcome to Strike Network." });
    }
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
      await sql`insert into notifications(player_id,title,body,kind) values(${me.id},'Profile updated','Your new profile details are now live.','profile')`;
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
      await sql`insert into notifications(player_id,title,body,kind) values(${me.id},'Password changed','Your account password was updated successfully.','security')`;
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
    if (b.action === "toggleReaction") {
      const [message] = await sql`select * from messages where id=${b.messageId}`;
      if (!message || (message.channel === "team" && message.team_id !== me.team_id)) return fail("Message unavailable", 404);
      const existing = await sql`select 1 from message_reactions where message_id=${message.id} and player_id=${me.id}`;
      if (existing.length) await sql`delete from message_reactions where message_id=${message.id} and player_id=${me.id}`;
      else await sql`insert into message_reactions(message_id,player_id) values(${message.id},${me.id})`;
      return NextResponse.json({ message: existing.length ? "Reaction removed." : "Reacted." });
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
      await sql`insert into notifications(player_id,title,body,kind) values(${me.id},'Match check-in confirmed','You are marked ready for your upcoming battle.','fixture')`;
      return NextResponse.json({ message: "You are marked ready." });
    }
    if (b.action === "invite") {
      const [target] =
        await sql`select * from players where id=${b.targetPlayerId}`;
      if (me.team_id || !target || target.team_id || target.id === me.id)
        return fail("That player is not available");
      await sql`insert into team_requests(from_player_id,to_player_id) values(${me.id},${target.id}) on conflict do nothing`;
      await sql`insert into notifications(player_id,title,body,kind) values(${target.id},'New teammate request',${me.username + " wants to form a duo with you"},'team')`;
      await sql`insert into notifications(player_id,title,body,kind) values(${me.id},'Request sent',${"Your teammate request was sent to " + target.username + "."},'team')`;
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
      await sql`insert into notifications(player_id,title,body,kind) values(${me.id},'Team name proposed',${name + " is waiting for your teammate's approval."},'team')`;
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
    if (b.action === "toggleMatchHype") {
      const kind = ["individual", "team", "duel"].includes(b.kind) ? b.kind : null,
        id = Number(b.matchId);
      if (!kind || !id) return fail("Invalid match");
      const found = kind === "individual"
        ? await sql`select 1 from individual_fixtures where id=${id}`
        : kind === "team"
          ? await sql`select 1 from fixtures where id=${id}`
          : await sql`select 1 from community_duels where id=${id} and status<>'cancelled'`;
      if (!found.length) return fail("Match unavailable", 404);
      const existing = await sql`select 1 from match_hypes where match_kind=${kind} and match_id=${id} and player_id=${me.id}`;
      if (existing.length) await sql`delete from match_hypes where match_kind=${kind} and match_id=${id} and player_id=${me.id}`;
      else await sql`insert into match_hypes(match_kind,match_id,player_id) values(${kind},${id},${me.id})`;
      return NextResponse.json({ message: existing.length ? "Hype removed." : "Match hyped!" });
    }
    if (b.action === "createDuel") {
      const opponentId = b.opponentId ? Number(b.opponentId) : null,
        mode = String(b.mode || "1v1").trim().slice(0, 30),
        message = String(b.message || "").trim().slice(0, 160);
      if (opponentId === me.id) return fail("You cannot challenge yourself");
      if (opponentId) {
        const [opponent] = await sql`select id,username from players where id=${opponentId} and claimed=true`;
        if (!opponent) return fail("Player unavailable");
        const [duel] = await sql`insert into community_duels(challenger_id,opponent_id,status,mode,message) values(${me.id},${opponent.id},'pending',${mode || "1v1"},${message}) returning id`;
        await sql`insert into notifications(player_id,title,body,kind) values(${opponent.id},'New 1v1 challenge',${me.username + " challenged you to " + (mode || "1v1") + "."},'duel')`;
        return NextResponse.json({ message: "Challenge sent.", duelId: duel.id });
      }
      const [duel] = await sql`insert into community_duels(challenger_id,status,mode,message) values(${me.id},'open',${mode || "1v1"},${message}) returning id`;
      await sql`insert into activity(actor_id,text,kind) values(${me.id},${me.username + " posted an open 1v1 challenge"},'duel')`;
      return NextResponse.json({ message: "Open challenge posted.", duelId: duel.id });
    }
    if (b.action === "respondDuel") {
      const [duel] = await sql`select * from community_duels where id=${Number(b.duelId)} and status in('open','pending')`;
      if (!duel) return fail("Challenge is no longer available");
      if (duel.challenger_id === me.id) return fail("Another player must accept your challenge");
      if (duel.opponent_id && duel.opponent_id !== me.id) return fail("This challenge was sent to another player");
      if (!b.accept) {
        if (!duel.opponent_id) return fail("Open challenges can only be accepted");
        await sql`update community_duels set status='declined' where id=${duel.id}`;
        await sql`insert into notifications(player_id,title,body,kind) values(${duel.challenger_id},'Challenge declined',${me.username + " declined your 1v1 challenge."},'duel')`;
        return NextResponse.json({ message: "Challenge declined." });
      }
      await sql`update community_duels set opponent_id=${me.id},status='accepted' where id=${duel.id}`;
      await sql`insert into notifications(player_id,title,body,kind) values(${duel.challenger_id},'Challenge accepted',${me.username + " accepted. Choose a time for the duel."},'duel')`;
      await sql`insert into notifications(player_id,title,body,kind) values(${me.id},'Duel accepted','Choose a time with your opponent to make it official.','duel')`;
      return NextResponse.json({ message: "Challenge accepted. Now choose a time." });
    }
    if (b.action === "proposeDuelTime") {
      const [duel] = await sql`select * from community_duels where id=${Number(b.duelId)} and status in('accepted','scheduling','scheduled')`;
      if (!duel || ![duel.challenger_id, duel.opponent_id].includes(me.id)) return fail("Duel unavailable");
      const when = new Date(String(b.scheduledAt || ""));
      if (!Number.isFinite(when.getTime()) || when.getTime() < Date.now()) return fail("Choose a future date and time");
      await sql`update community_duels set proposed_at=${when.toISOString()},proposed_by=${me.id},status='scheduling' where id=${duel.id}`;
      const other = duel.challenger_id === me.id ? duel.opponent_id : duel.challenger_id;
      await sql`insert into notifications(player_id,title,body,kind) values(${other},'Duel time proposed',${me.username + " proposed " + when.toLocaleString() + "."},'duel')`;
      return NextResponse.json({ message: "Time sent for approval." });
    }
    if (b.action === "confirmDuelTime") {
      const [duel] = await sql`select * from community_duels where id=${Number(b.duelId)} and status='scheduling'`;
      if (!duel || ![duel.challenger_id, duel.opponent_id].includes(me.id) || duel.proposed_by === me.id) return fail("Time proposal unavailable");
      await sql`update community_duels set scheduled_at=proposed_at,status='scheduled' where id=${duel.id}`;
      await sql`insert into notifications(player_id,title,body,kind) select id,'Official duel scheduled',${"The exhibition duel is confirmed for " + new Date(duel.proposed_at).toLocaleString() + "."},'duel' from players where id in (${duel.challenger_id},${duel.opponent_id})`;
      return NextResponse.json({ message: "Duel time confirmed." });
    }
    if (b.action === "cancelDuel") {
      const [duel] = await sql`select * from community_duels where id=${Number(b.duelId)}`;
      if (!duel || ![duel.challenger_id, duel.opponent_id].includes(me.id)) return fail("Duel unavailable");
      await sql`update community_duels set status='cancelled' where id=${duel.id}`;
      return NextResponse.json({ message: "Duel cancelled." });
    }
    if (!["admin", "owner"].includes(me.role))
      return fail("Admin access required", 403);
    if (b.action === "createIndividualFixture") {
      const home = Number(b.homePlayerId), away = Number(b.awayPlayerId);
      if (!home || !away || home === away) return fail("Choose two different players");
      const eligible = await sql`select id from players where id in (${home},${away}) and claimed=true`;
      if (eligible.length !== 2) return fail("Both players must be registered");
      const [fixture] = await sql`insert into individual_fixtures(home_player_id,away_player_id,scheduled_at,created_by) values(${home},${away},${b.scheduledAt || null},${me.id}) returning id`;
      await sql`insert into notifications(player_id,title,body,kind) select id,'Official league fixture','A new individual league match has been scheduled.','fixture' from players where id in (${home},${away})`;
      await sql`insert into activity(actor_id,text,kind) values(${me.id},'A new individual league fixture was scheduled','fixture')`;
      return NextResponse.json({ message: "Individual fixture created.", fixtureId: fixture.id });
    }
    if (b.action === "setIndividualResult") {
      const hs = Number(b.homeScore), as = Number(b.awayScore);
      if (!Number.isInteger(hs) || !Number.isInteger(as) || hs < 0 || as < 0) return fail("Enter valid non-negative scores");
      const [f] = await sql`select * from individual_fixtures where id=${Number(b.fixtureId)}`;
      if (!f) return fail("Fixture not found");
      await sql`update individual_fixtures set home_score=${hs},away_score=${as},status='completed' where id=${f.id}`;
      await sql`insert into notifications(player_id,title,body,kind) select id,'League result confirmed',${"Final score: " + hs + "–" + as},'result' from players where id in (${f.home_player_id},${f.away_player_id})`;
      await sql`insert into activity(actor_id,text,kind) values(${me.id},${"Individual result confirmed: " + hs + "–" + as},'result')`;
      return NextResponse.json({ message: "Individual result saved." });
    }
    if (b.action === "updateMatch") {
      const kind = b.kind, id = Number(b.matchId), status = ["scheduled", "postponed"].includes(b.status) ? b.status : "scheduled";
      if (!id || !["individual", "team", "duel"].includes(kind)) return fail("Invalid match");
      if (kind === "individual") await sql`update individual_fixtures set scheduled_at=${b.scheduledAt || null},status=case when status='completed' then status else ${status} end where id=${id}`;
      if (kind === "team") await sql`update fixtures set scheduled_at=${b.scheduledAt || null},status=case when status='completed' then status else ${status} end where id=${id}`;
      if (kind === "duel") await sql`update community_duels set scheduled_at=${b.scheduledAt || null},status=case when status='completed' then status when ${Boolean(b.scheduledAt)} then 'scheduled' else 'accepted' end where id=${id}`;
      return NextResponse.json({ message: "Match schedule updated." });
    }
    if (b.action === "deleteMatch") {
      const kind = b.kind, id = Number(b.matchId);
      if (!id || !["individual", "team", "duel"].includes(kind)) return fail("Invalid match");
      if (kind === "individual") await sql`delete from individual_fixtures where id=${id}`;
      if (kind === "duel") await sql`delete from community_duels where id=${id}`;
      if (kind === "team") {
        const [f] = await sql`select * from fixtures where id=${id}`;
        if (f) await sql.begin(async tx => {
          if (f.status === "completed") await apply(tx,f.home_team_id,f.away_team_id,-f.home_score,-f.away_score);
          await tx`delete from fixtures where id=${id}`;
        });
      }
      await sql`delete from match_hypes where match_kind=${kind} and match_id=${id}`;
      return NextResponse.json({ message: "Match removed." });
    }
    if (b.action === "setDuelResult") {
      const hs = Number(b.homeScore), as = Number(b.awayScore);
      if (!Number.isInteger(hs) || !Number.isInteger(as) || hs < 0 || as < 0) return fail("Enter valid scores");
      await sql`update community_duels set challenger_score=${hs},opponent_score=${as},status='completed' where id=${Number(b.duelId)} and opponent_id is not null`;
      return NextResponse.json({ message: "Exhibition result saved. Standings were not affected." });
    }
    if (b.action === "setVerified") {
      await sql`update players set verified=${Boolean(b.verified)} where id=${Number(b.playerId)} and role<>'owner'`;
      return NextResponse.json({ message: b.verified ? "Member verified." : "Verification removed." });
    }
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
