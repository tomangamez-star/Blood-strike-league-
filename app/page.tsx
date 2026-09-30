"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronRight,
  Crown,
  LogIn,
  Menu,
  Shield,
  Swords,
  Trophy,
  UserPlus,
  Users,
  X,
  Bell,
  MessageCircle,
  Gamepad2,
  UserRound,
  Send,
  ImagePlus,
  Activity,
  CheckCircle2,
  House,
  Radio,
  Search,
  Heart,
  MessageSquare,
  Megaphone,
  Sparkles,
  Check,
  Settings,
  Hash,
  ChevronLeft,
  Flame,
  Plus,
  Trash2,
  Clock3,
  BadgeCheck,
  UserCheck,
} from "lucide-react";
const names = [
  "czarkills",
  "headshot",
  "aksenpai",
  "IAlone",
  "Deadshot",
  "aizen",
  "crisodan",
  "flamestroke",
];
type Player = {
  id: number;
  username: string;
  claimed: boolean;
  role: string;
  team_id: number | null;
  display_name?: string;
  bio?: string;
  avatar_data?: string | null;
  accent_color?: string;
  verified?: boolean;
};
type Team = {
  id: number;
  name: string | null;
  player1: string;
  player2: string;
  wins: number;
  draws: number;
  losses: number;
  rounds_for: number;
  rounds_against: number;
  points: number;
};
type Fixture = {
  id: number;
  home_team_id: number;
  away_team_id: number;
  home_name: string;
  away_name: string;
  home_score: number | null;
  away_score: number | null;
  scheduled_at: string | null;
  status: string;
  hype_count?: number;
  hyped_by_me?: boolean;
};
type League = {
  players: Player[];
  teams: Team[];
  fixtures: Fixture[];
  me: Player | null;
  pendingInvites: any[];
  pendingNames: any[];
  claimCodes: any[];
  messages: any[];
  notifications: any[];
  activity: any[];
  onlinePlayers: any[];
  checkins: any[];
  individualFixtures: any[];
  individualStandings: any[];
  duels: any[];
};
const fallback: League = {
  players: names.map((username, i) => ({
    id: i + 1,
    username,
    claimed: false,
    role: username === "IAlone" ? "owner" : "player",
    team_id: null,
  })),
  teams: [],
  fixtures: [],
  me: null,
  pendingInvites: [],
  pendingNames: [],
  claimCodes: [],
  messages: [],
  notifications: [],
  activity: [],
  onlinePlayers: [],
  checkins: [],
  individualFixtures: [],
  individualStandings: [],
  duels: [],
};
export default function Home() {
  const [data, setData] = useState<League>(fallback),
    [view, setView] = useState("home"),
    [auth, setAuth] = useState<string | null>(null),
    [mobile, setMobile] = useState(false),
    [busy, setBusy] = useState(false),
    [toast, setToast] = useState(""),
    [notices, setNotices] = useState(false);
  const load = async () => {
    try {
      const r = await fetch("/api/league", { cache: "no-store" });
      if (r.ok) setData(await r.json());
    } catch {}
  };
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(id);
  }, [toast]);
  const act = async (action: string, payload: any = {}) => {
    setBusy(true);
    setToast("");
    try {
      const r = await fetch("/api/league", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const j: any = await r.json();
      if (!r.ok) throw Error(j.error);
      if (["login", "claim", "register", "logout"].includes(action))
        setToast(j.message || "Done");
      setAuth(null);
      await load();
      return j;
    } catch (e: any) {
      setToast(e.message || "Something went wrong");
      return null;
    } finally {
      setBusy(false);
    }
  };
  const standings = useMemo(
    () =>
      [...data.teams].sort(
        (a, b) =>
          b.points - a.points ||
          b.rounds_for - b.rounds_against - (a.rounds_for - a.rounds_against),
      ),
    [data.teams],
  );
  const nav = [
    ["home", "Home"],
    ["standings", "League"],
    ["fixtures", "Arena"],
    ...(data.me
      ? [
          ["chat", "Chat"],
          ["dashboard", "Profile"],
        ]
      : []),
    ...(["admin", "owner"].includes(data.me?.role || "")
      ? [["admin", "Admin"]]
      : []),
  ];
  return (
    <main className="app-shell">
      <header>
        <button className="hamb" onClick={() => setMobile(!mobile)}>
          <Menu />
        </button>
        <div className="brand">
          <span className="mark">BS</span>
          <div>
            <b>STRIKE LEAGUE</b>
            <small>SEASON 01</small>
          </div>
        </div>
        <nav className={mobile ? "open" : ""}>
          {nav.map(([k, l]) => (
            <button
              key={k}
              className={view === k ? "active" : ""}
              onClick={() => {
                setView(k);
                setMobile(false);
              }}
            >
              {l}
            </button>
          ))}
        </nav>
        {data.me && (
          <button className="notice-btn" onClick={() => setNotices(!notices)}>
            <Bell size={19} />
            {data.notifications.some((n: any) => !n.is_read) && <i />}
          </button>
        )}
        <button
          className="account"
          onClick={() => (data.me ? setView("dashboard") : setAuth("choice"))}
        >
          {data.me ? (
            <>
              <span className="online" />
              {data.me.display_name || data.me.username}
            </>
          ) : (
            <>
              <LogIn size={17} /> Enter league
            </>
          )}
        </button>
      </header>
      {notices && data.me && (
        <div className="notice-drawer">
          <div>
            <b>NOTIFICATIONS</b>
            <span className="notice-tools">
              <button onClick={() => act("markNotificationsRead")}>MARK READ</button>
              <button className="notice-close" onClick={() => setNotices(false)}><X /></button>
            </span>
          </div>
          {data.notifications.length ? (
            data.notifications.slice(0, 8).map((n: any) => (
              <article className={n.is_read ? "" : "unread"} key={n.id}>
                <span>{n.title}</span>
                <p>{n.body}</p>
                <small>{new Date(n.created_at).toLocaleString()}</small>
              </article>
            ))
          ) : (
            <p className="muted">Nothing new yet.</p>
          )}
        </div>
      )}
      {toast && (
        <div className="toast" onClick={() => setToast("")}>
          {toast}
          <X size={15} />
        </div>
      )}
      {view === "home" &&
        (data.me ? (
          <NetworkHome data={data} setView={setView} act={act} busy={busy} />
        ) : (
          <>
          <section className="hero">
            <div className="eyebrow">
              <span /> BLOOD STRIKE COMMUNITY LEAGUE
            </div>
            <h1>
              ENTER THE NETWORK.
              <br />
              <em>RULE THE ARENA.</em>
            </h1>
            <p>
              Join the network, fight the individual league, form a duo and
              challenge rivals whenever you&apos;re ready.
            </p>
            <div className="hero-actions">
              <button
                className="primary"
                onClick={() =>
                  data.me ? setView("dashboard") : setAuth("choice")
                }
              >
                {data.me ? "OPEN MY HQ" : "ENTER THE LEAGUE"}
                <ChevronRight />
              </button>
              <button className="ghost" onClick={() => setView("fixtures")}>
                VIEW FIXTURES
              </button>
            </div>
          </section>
          <section className="stats">
            <article>
              <small>REGISTERED</small>
              <strong>{String(data.players.filter(p => p.claimed).length).padStart(2, "0")}</strong>
              <span>PLAYERS</span>
            </article>
            <article>
              <small>TEAMS FORMED</small>
              <strong>{String(data.teams.length).padStart(2, "0")}</strong>
              <span>ACTIVE DUOS</span>
            </article>
            <article>
              <small>MATCHES PLAYED</small>
              <strong>
                {String(
                  data.fixtures.filter((f) => f.status === "completed").length,
                ).padStart(2, "0")}
              </strong>
              <span>THIS SEASON</span>
            </article>
            <article>
              <small>CURRENT LEADER</small>
              <strong className="leader">{standings[0]?.name || "—"}</strong>
              <span>
                {standings[0] ? `${standings[0].points} PTS` : "AWAITING TEAMS"}
              </span>
            </article>
          </section>
          <section className="split">
            <Panel title="NEXT ENGAGEMENTS" icon={<Swords />}>
              <FixtureList
                fixtures={data.fixtures
                  .filter((f) => f.status !== "completed")
                  .slice(0, 3)}
              />
            </Panel>
            <Panel title="TOP OF THE TABLE" icon={<Trophy />}>
              <Standings teams={standings.slice(0, 4)} />
            </Panel>
          </section>
          </>
        ))}
      {view === "standings" && <LeagueHub data={data} teamStandings={standings} />}
      {view === "fixtures" && <ArenaHub data={data} act={act} busy={busy} />}
      {view === "teams" && (
        <Page
          title="TEAM ROSTERS"
          sub="Four duos enter. One duo finishes on top"
        >
          <div className="team-grid">
            {data.teams.length ? (
              data.teams.map((t) => (
                <article className="team-card" key={t.id}>
                  <Shield />
                  <small>OFFICIAL DUO</small>
                  <h3>{t.name || "UNNAMED DUO"}</h3>
                  <div>
                    <span>{t.player1}</span>
                    <b>+</b>
                    <span>{t.player2}</span>
                  </div>
                </article>
              ))
            ) : (
              <Empty text="No teams have been formed yet." />
            )}
          </div>
        </Page>
      )}
      {view === "dashboard" && data.me && (
        <Profile data={data} act={act} busy={busy} setView={setView} />
      )}{" "}
      {view === "chat" && data.me && <Chat data={data} act={act} busy={busy} />}
      {view === "admin" && ["admin", "owner"].includes(data.me?.role || "") && (
        <Admin data={data} act={act} busy={busy} />
      )}{" "}
      {auth && (
        <AuthModal
          mode={auth}
          setMode={setAuth}
          players={data.players}
          act={act}
          busy={busy}
        />
      )}
      {data.me && (
        <div className="mobile-dock">
          {[
            ["home", "Home", <House key="h" />],
            ["fixtures", "Arena", <Swords key="a" />],
            ["chat", "Chat", <MessageCircle key="c" />],
            ["standings", "League", <Trophy key="l" />],
            ["dashboard", "Profile", <UserRound key="p" />],
          ].map(([key, label, icon]: any) => (
            <button
              key={key}
              className={view === key ? "active" : ""}
              onClick={() => setView(key)}
            >
              {icon}<span>{label}</span>
            </button>
          ))}
        </div>
      )}
      <footer>
        <b>STRIKE LEAGUE</b>
        <span>Unofficial Blood Strike community competition</span>
        <span>Season 01 · 2026</span>
      </footer>
    </main>
  );
}

function NetworkHome({ data, setView, act, busy }: any) {
  const [post, setPost] = useState("");
  const [feed, setFeed] = useState("all");
  const myTeam = data.teams.find((t: Team) => t.id === data.me.team_id);
  const posts = data.messages
    .filter((m: any) => feed === "team" ? m.channel === "team" : m.channel === "public")
    .slice(0, 8);
  const send = () => {
    if (!post.trim()) return;
    act("sendMessage", { channel: feed === "team" ? "team" : "public", content: post });
    setPost("");
  };
  return (
    <section className="network-shell">
      <div className="network-main">
        <div className="network-welcome">
          <div><small>CONNECTED TO STRIKE NETWORK</small><h1>Good evening, <em>{data.me.display_name || data.me.username}</em></h1></div>
          <button aria-label="Search"><Search /></button>
        </div>

        <MatchCarousel data={data} act={act} setView={setView} />

        <div className="quick-post">
          <Avatar player={data.me} size={44} />
          <button onClick={() => setView("chat")}>What&apos;s on your mind, striker?</button>
          <ImagePlus />
        </div>

        <div className="feed-tabs">
          {[["all", "All posts"], ["team", "My team"], ["league", "League"]].map(([k,l]) => <button key={k} className={feed === k ? "active" : ""} onClick={() => setFeed(k)}>{l}</button>)}
        </div>

        <div className="network-feed">
          {feed === "all" && data.duels.filter((d:any)=>d.status === "open" || d.status === "scheduled").slice(0,2).map((d:any)=><FeedDuel key={d.id} duel={d} me={data.me} act={act} setView={setView}/>)}
          {feed === "league" ? <LeaguePost data={data} setView={setView} /> : posts.length ? posts.map((m: any) => (
            <article className="feed-post" key={m.id}>
              <Avatar player={m} size={43} />
              <div className="post-body">
                <div className="post-head"><b>{m.sender_name}</b><span>@{m.username} · {new Date(m.created_at).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}</span><i /></div>
                <p>{m.content}</p>
                <div className="post-actions"><button className={m.reacted_by_me ? "reacted" : ""} onClick={() => act("toggleReaction", { messageId: m.id })}><Heart /> {m.reaction_count || "React"}</button><button onClick={() => setView("chat")}><MessageSquare /> Reply</button><span className="delivered"><Check /> Delivered</span></div>
              </div>
            </article>
          )) : <LeaguePost data={data} setView={setView} />}
        </div>

        <div className="inline-composer">
          <input value={post} onChange={e => setPost(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder={feed === "team" ? "Message your duo..." : "Post to the league..."} />
          <button disabled={busy || !post.trim()} onClick={send}><Send /></button>
        </div>
      </div>

      <aside className="network-rail">
        <RailTitle icon={<Bell />} title="Notifications" action={() => {}} />
        <div className="rail-list">
          {data.notifications.slice(0, 3).map((n: any) => <article key={n.id} className={!n.is_read ? "new" : ""}><span className="rail-icon"><Megaphone /></span><div><b>{n.title}</b><p>{n.body}</p><small>{new Date(n.created_at).toLocaleDateString()}</small></div></article>)}
          {!data.notifications.length && <p className="rail-empty">You&apos;re all caught up.</p>}
        </div>
        <RailTitle icon={<Users />} title="Online now" action={() => setView("chat")} />
        <div className="online-grid">{data.onlinePlayers.slice(0, 6).map((p: any) => <button key={p.id} onClick={() => setView("chat")}><Avatar player={p} size={38} /><span><b>{p.display_name || p.username}</b><small>Online</small></span><i /></button>)}</div>
        <div className="duo-card"><small>YOUR DUO</small><h3>{myTeam?.name || "Find your teammate"}</h3><p>{myTeam ? `${myTeam.player1} + ${myTeam.player2}` : "The arena is better with backup."}</p><button onClick={() => setView("dashboard")}>{myTeam ? "TEAM HQ" : "BUILD A TEAM"}<ChevronRight /></button></div>
        <div className="challenge-card"><Swords /><div><small>FEELING DANGEROUS?</small><b>CALL OUT A RIVAL</b></div><button onClick={() => setView("fixtures")}>CHALLENGE <ChevronRight /></button></div>
      </aside>
    </section>
  );
}

function MatchCarousel({ data, act, setView }: any) {
  const rail = useRef<HTMLDivElement>(null), [active, setActive] = useState(0);
  const all = [
    ...data.individualFixtures.map((m: any) => ({ ...m, kind: "individual", label: "OFFICIAL 1V1", home: m.home_name, away: m.away_name, date: m.scheduled_at })),
    ...data.fixtures.map((m: any) => ({ ...m, kind: "team", label: "DUO LEAGUE", home: m.home_name, away: m.away_name, date: m.scheduled_at })),
    ...data.duels.filter((m: any) => m.status === "scheduled" || m.status === "completed").map((m: any) => ({ ...m, kind: "duel", label: "EXHIBITION", home: m.challenger_name, away: m.opponent_name, date: m.scheduled_at, home_score: m.challenger_score, away_score: m.opponent_score })),
  ].filter((m: any) => m.date && m.status !== "postponed").sort((a: any,b: any) => +new Date(a.date)-+new Date(b.date));
  const today = new Date().toDateString(), todayMatches = all.filter((m: any) => new Date(m.date).toDateString() === today), upcoming = all.filter((m: any) => m.status !== "completed" && +new Date(m.date) >= Date.now());
  const matches = todayMatches.length ? todayMatches : upcoming.slice(0, 5);
  const move = (direction: number) => rail.current?.scrollBy({ left: rail.current.clientWidth * direction, behavior: "smooth" });
  if (!matches.length) return <article className="next-battle"><div className="battle-noise" /><div className="battle-label"><Radio /> MATCH CENTER</div><div className="battle-empty"><Sparkles /><b>The arena is waiting</b><span>Upcoming official fixtures will appear here.</span></div><button className="battle-open" onClick={() => setView("fixtures")}>OPEN ARENA <ChevronRight /></button></article>;
  return <div className="match-carousel-wrap">
    <div className="carousel-title"><span><Radio /> {todayMatches.length ? `${matches.length} MATCH${matches.length === 1 ? "" : "ES"} TODAY` : "NEXT MATCHES"}</span><div><button onClick={() => move(-1)}><ChevronLeft /></button><b>{active + 1} / {matches.length}</b><button onClick={() => move(1)}><ChevronRight /></button></div></div>
    <div className="match-carousel" ref={rail} onScroll={e => setActive(Math.round(e.currentTarget.scrollLeft / Math.max(1,e.currentTarget.clientWidth)))}>
      {matches.map((m: any) => <article className={`next-battle match-slide ${m.kind}`} key={`${m.kind}-${m.id}`}>
        <div className="battle-noise" /><div className="battle-label"><span>{m.label}</span><i className={m.status}>{m.status}</i></div>
        <div className="battle-clash"><div><MatchAvatar name={m.home} src={m.home_avatar} accent={m.home_accent} /><span>{m.home}</span><small>{m.kind === "team" ? "HOME DUO" : "HOME"}</small></div><strong>{m.status === "completed" ? `${m.home_score}—${m.away_score}` : "VS"}</strong><div><MatchAvatar name={m.away} src={m.away_avatar} accent={m.away_accent} /><span>{m.away}</span><small>{m.kind === "team" ? "AWAY DUO" : "AWAY"}</small></div></div>
        <div className="battle-meta"><Countdown date={m.date} /><span>{new Date(m.date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span></div>
        <div className="battle-actions"><button className={m.hyped_by_me ? "hyped" : ""} onClick={() => act("toggleMatchHype", { kind: m.kind, matchId: m.id })}><Flame /> {m.hype_count || 0} HYPE</button><button onClick={() => setView("fixtures")}>MATCH CENTER <ChevronRight /></button></div>
      </article>)}
    </div><div className="carousel-dots">{matches.map((_: any,i: number) => <i key={i} className={i === active ? "active" : ""} />)}</div>
  </div>;
}
function MatchAvatar({ name, src, accent }: any) { return src ? <img className="match-avatar" src={src} alt="" style={{borderColor:accent}} /> : <span className="match-avatar fallback" style={{borderColor:accent,color:accent}}>{String(name || "?").slice(0,2).toUpperCase()}</span>; }

function Countdown({ date }: { date: string | null }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(id); }, []);
  if (!date) return <b>TBA</b>;
  const diff = Math.max(0, new Date(date).getTime() - now), days = Math.floor(diff / 86400000), hours = Math.floor(diff % 86400000 / 3600000), mins = Math.floor(diff % 3600000 / 60000);
  return <b>{String(days).padStart(2,"0")}D&nbsp; {String(hours).padStart(2,"0")}H&nbsp; {String(mins).padStart(2,"0")}M</b>;
}
function LeaguePost({ data, setView }: any) {
  return <article className="feed-post league-post"><span className="league-badge"><Trophy /></span><div className="post-body"><div className="post-head"><b>Strike League</b><span>Official transmission</span><i /></div><h3>SEASON 01 IS LIVE</h3><p>Form your duo, get match-ready and climb the table. Every battle writes the story.</p><button className="post-cta" onClick={() => setView("standings")}>VIEW LEAGUE TABLE <ChevronRight /></button></div></article>;
}
function FeedDuel({ duel:d, me, act, setView }:any){const canAccept=d.status==="open"&&d.challenger_id!==me.id;return <article className="feed-post feed-duel"><span className="duel-feed-icon"><Swords/></span><div className="post-body"><div className="post-head"><b>{d.challenger_name}</b><span>posted a {d.status === "open" ? "challenge" : "confirmed duel"}</span><i/></div><h3>{d.challenger_name} <em>VS</em> {d.opponent_name||"WHO WANTS IT?"}</h3><p>{d.message||`${d.mode} — step into the arena.`}</p><div className="feed-duel-actions"><button className={d.hyped_by_me?"hyped":""} onClick={()=>act("toggleMatchHype",{kind:"duel",matchId:d.id})}><Flame/>{d.hype_count||0} HYPE</button>{canAccept&&<button className="accept" onClick={()=>act("respondDuel",{duelId:d.id,accept:true})}>ACCEPT CHALLENGE</button>}<button onClick={()=>setView("fixtures")}>OPEN MATCH <ChevronRight/></button></div></div></article>}
function RailTitle({ icon, title, action }: any) { return <div className="rail-title"><span>{icon}{title}</span><button onClick={action}>VIEW ALL</button></div>; }
function Page({ title, sub, children }: any) {
  return (
    <section className="page">
      <div className="page-head">
        <span>SEASON 01</span>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
      {children}
    </section>
  );
}
function Panel({ title, icon, children }: any) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>
          {icon}
          {title}
        </h2>
        <span>SEASON 01</span>
      </div>
      {children}
    </div>
  );
}
function Empty({ text }: any) {
  return (
    <div className="empty">
      <Shield />
      <b>AWAITING DEPLOYMENT</b>
      <span>{text}</span>
    </div>
  );
}
function FixtureList({
  fixtures,
  large = false,
}: {
  fixtures: Fixture[];
  large?: boolean;
}) {
  return (
    <div className={large ? "fixtures large" : "fixtures"}>
      {fixtures.length ? (
        fixtures.map((f) => (
          <article key={f.id}>
            <div>
              <small>
                {f.scheduled_at
                  ? new Date(f.scheduled_at).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "DATE TBA"}
              </small>
              <b>
                {f.home_name || "UNNAMED DUO"}{" "}
                <em>
                  {f.status === "completed"
                    ? `${f.home_score} — ${f.away_score}`
                    : "VS"}
                </em>{" "}
                {f.away_name || "UNNAMED DUO"}
              </b>
            </div>
            <span className={f.status}>{f.status}</span>
          </article>
        ))
      ) : (
        <Empty text="Fixtures will appear when an admin schedules them." />
      )}
    </div>
  );
}
function Standings({ teams, full = false }: { teams: Team[]; full?: boolean }) {
  return (
    <div className="standings">
      <div className="tr th">
        <span>#</span>
        <span>TEAM</span>
        <span>P</span>
        <span>W</span>
        {full && (
          <>
            <span>D</span>
            <span>L</span>
            <span>RD</span>
          </>
        )}
        <span>PTS</span>
      </div>
      {teams.length ? (
        teams.map((t, i) => (
          <div className="tr" key={t.id}>
            <span>{i + 1}</span>
            <span>
              <i>{t.name?.slice(0, 2).toUpperCase() || "UU"}</i>
              {t.name || "UNNAMED DUO"}
            </span>
            <span>{t.wins + t.draws + t.losses}</span>
            <span>{t.wins}</span>
            {full && (
              <>
                <span>{t.draws}</span>
                <span>{t.losses}</span>
                <span>{t.rounds_for - t.rounds_against}</span>
              </>
            )}
            <strong>{t.points}</strong>
          </div>
        ))
      ) : (
        <Empty text="The table activates when teams are formed." />
      )}
    </div>
  );
}
function LeagueHub({ data, teamStandings }: any) {
  const [tab, setTab] = useState("individual");
  return <Page title="LEAGUE TABLES" sub="Official results only · Win: 3 points · Draw: 1 point">
    <div className="league-switch"><button className={tab === "individual" ? "active" : ""} onClick={() => setTab("individual")}><UserRound />INDIVIDUAL LEAGUE<span>{data.individualStandings.length} players</span></button><button className={tab === "duo" ? "active" : ""} onClick={() => setTab("duo")}><Users />DUO LEAGUE<span>{data.teams.length} teams</span></button></div>
    {tab === "individual" ? <IndividualTable players={data.individualStandings} /> : <><div className="table-card"><Standings teams={teamStandings} full /></div><div className="team-grid league-teams">{data.teams.map((t: Team) => <article className="team-card" key={t.id}><Shield /><small>OFFICIAL DUO</small><h3>{t.name || "UNNAMED DUO"}</h3><div><span>{t.player1}</span><b>+</b><span>{t.player2}</span></div></article>)}</div></>}
  </Page>;
}
function IndividualTable({ players }: any) {
  return <div className="individual-table table-card"><div className="iplayer-row ihead"><span>#</span><span>PLAYER</span><span>P</span><span>W</span><span>D</span><span>L</span><span>RD</span><span>PTS</span></div>{players.length ? players.map((p: any,i: number) => <div className="iplayer-row" key={p.id}><strong>{i+1}</strong><span className="iplayer"><Avatar player={p} size={34} /><span><b>{p.display_name}</b><small>@{p.username}</small></span></span><span>{p.played}</span><span>{p.wins}</span><span>{p.draws}</span><span>{p.losses}</span><span>{p.rounds_for-p.rounds_against > 0 ? "+" : ""}{p.rounds_for-p.rounds_against}</span><b className="points">{p.points}</b></div>) : <Empty text="The individual table activates after players join." />}</div>;
}
function ArenaHub({ data, act, busy }: any) {
  const [tab, setTab] = useState("individual"), [challenge, setChallenge] = useState(false);
  const individual = [...data.individualFixtures].sort(matchSort), teams = [...data.fixtures].sort(matchSort), duels = [...data.duels].sort(matchSort);
  return <Page title="MATCH CENTER" sub="Official fixtures, results and community challenges">
    <div className="arena-command"><div><small>STRIKE NETWORK</small><b>Choose your battlefield</b></div>{data.me && <button onClick={() => setChallenge(true)}><Plus /> CREATE 1V1 CHALLENGE</button>}</div>
    <div className="arena-tabs">{[["individual","1V1 League"],["duo","Duo League"],["duels","Community Duels"]].map(([k,l]) => <button key={k} className={tab===k?"active":""} onClick={()=>setTab(k)}>{k === "individual" ? <UserRound/> : k === "duo" ? <Users/> : <Swords/>}<span>{l}<small>{k === "individual" ? individual.length : k === "duo" ? teams.length : duels.length} matches</small></span></button>)}</div>
    <div className="match-section-head"><span>{tab === "duels" ? "EXHIBITION — DOES NOT AFFECT TABLES" : "OFFICIAL SEASON 01 FIXTURES"}</span><i>{tab === "duels" ? "SOCIAL" : "RANKED"}</i></div>
    <div className="match-center-grid">{tab === "individual" ? individual.length ? individual.map((m:any)=><OfficialMatchCard key={m.id} match={m} kind="individual" act={act}/>) : <Empty text="No individual fixtures have been scheduled."/> : tab === "duo" ? teams.length ? teams.map((m:any)=><OfficialMatchCard key={m.id} match={m} kind="team" act={act}/>) : <Empty text="No duo fixtures have been scheduled."/> : duels.length ? duels.map((d:any)=><DuelCard key={d.id} duel={d} data={data} act={act}/>) : <Empty text="No challenges yet. Call out the first rival."/>}</div>
    {challenge && <ChallengeModal data={data} act={act} busy={busy} close={() => setChallenge(false)} />}
  </Page>;
}
function matchSort(a:any,b:any){ if(a.status === "completed" && b.status !== "completed") return 1;if(b.status === "completed" && a.status !== "completed") return -1;return +(new Date(a.scheduled_at || a.created_at || 8640000000000000)) - +(new Date(b.scheduled_at || b.created_at || 8640000000000000)); }
function OfficialMatchCard({ match:m, kind, act }: any) {
  const home = m.home_name || "UNNAMED DUO", away = m.away_name || "UNNAMED DUO";
  return <article className={`official-match ${kind}`}><div className="official-top"><span>{kind === "individual" ? "OFFICIAL 1V1" : "DUO LEAGUE"}</span><i className={m.status}>{m.status}</i></div><div className="official-versus"><div><MatchAvatar name={home} src={m.home_avatar} accent={m.home_accent}/><b>{home}</b></div><strong>{m.status === "completed" ? `${m.home_score} — ${m.away_score}` : "VS"}</strong><div><MatchAvatar name={away} src={m.away_avatar} accent={m.away_accent}/><b>{away}</b></div></div><div className="official-info"><span><CalendarDays />{m.scheduled_at ? new Date(m.scheduled_at).toLocaleString([], {dateStyle:"medium",timeStyle:"short"}) : "TIME TBA"}</span><button className={m.hyped_by_me ? "hyped" : ""} onClick={() => act("toggleMatchHype",{kind,matchId:m.id})}><Flame />{m.hype_count || 0}</button></div></article>;
}
function DuelCard({ duel:d, data, act }: any) {
  const [when,setWhen]=useState(""); const mine = data.me && [d.challenger_id,d.opponent_id].includes(data.me.id), canAnswer = data.me && data.me.id !== d.challenger_id && (d.status === "open" || (d.status === "pending" && d.opponent_id === data.me.id)), canConfirm = mine && d.status === "scheduling" && d.proposed_by !== data.me.id;
  return <article className="duel-match"><div className="official-top"><span>COMMUNITY EXHIBITION</span><i className={d.status}>{d.status}</i></div><div className="duel-people"><div><MatchAvatar name={d.challenger_name} src={d.challenger_avatar} accent={d.challenger_accent}/><span><b>{d.challenger_name}</b><small>CHALLENGER</small></span></div><strong>{d.status === "completed" ? `${d.challenger_score}—${d.opponent_score}` : "VS"}</strong><div><MatchAvatar name={d.opponent_name || "OPEN"} src={d.opponent_avatar} accent={d.opponent_accent}/><span><b>{d.opponent_name || "OPEN SLOT"}</b><small>{d.opponent_name ? "OPPONENT" : "ACCEPT TO ENTER"}</small></span></div></div><div className="duel-mode"><Gamepad2 />{d.mode}<span>{d.message || "No trash talk. Just business."}</span></div>{d.scheduled_at && <div className="duel-time"><Clock3 />{new Date(d.scheduled_at).toLocaleString([], {dateStyle:"medium",timeStyle:"short"})}</div>}{d.proposed_at && d.status === "scheduling" && <div className="time-proposal"><b>PROPOSED TIME</b><span>{new Date(d.proposed_at).toLocaleString()}</span></div>}<div className="duel-actions"><button className={d.hyped_by_me?"hyped":""} onClick={()=>act("toggleMatchHype",{kind:"duel",matchId:d.id})}><Flame />{d.hype_count || 0} HYPE</button>{canAnswer && <button className="accept" onClick={()=>act("respondDuel",{duelId:d.id,accept:true})}>ACCEPT</button>}{data.me && d.status === "pending" && d.opponent_id === data.me.id && <button onClick={()=>act("respondDuel",{duelId:d.id,accept:false})}>DECLINE</button>}{canConfirm && <button className="accept" onClick={()=>act("confirmDuelTime",{duelId:d.id})}>CONFIRM TIME</button>}</div>{mine && ["accepted","scheduling","scheduled"].includes(d.status) && <div className="duel-schedule"><input type="datetime-local" value={when} onChange={e=>setWhen(e.target.value)}/><button disabled={!when} onClick={()=>act("proposeDuelTime",{duelId:d.id,scheduledAt:when})}>{d.status === "scheduled" ? "PROPOSE NEW TIME" : "PROPOSE TIME"}</button></div>}{mine && !["completed","declined"].includes(d.status) && <button className="cancel-duel" onClick={()=>act("cancelDuel",{duelId:d.id})}>CANCEL CHALLENGE</button>}</article>;
}
function ChallengeModal({ data, act, busy, close }: any) {
  const [target,setTarget]=useState(""),[mode,setMode]=useState("1v1 — Squad Fight"),[message,setMessage]=useState("");
  const submit=async()=>{const done=await act("createDuel",{opponentId:target?+target:null,mode,message});if(done)close();};
  return <Modal close={close}><div className="auth-title challenge-title"><Swords/><h2>CREATE A CHALLENGE</h2><p>Call out one player or leave it open to the network.</p></div><label>Opponent<select value={target} onChange={e=>setTarget(e.target.value)}><option value="">Open challenge — anyone can accept</option>{data.players.filter((p:Player)=>p.claimed&&p.id!==data.me.id).map((p:Player)=><option key={p.id} value={p.id}>{p.display_name||p.username}</option>)}</select></label><label>Mode<input value={mode} maxLength={30} onChange={e=>setMode(e.target.value)}/></label><label>Callout message<textarea value={message} maxLength={160} placeholder="Optional rules or trash talk..." onChange={e=>setMessage(e.target.value)}/></label><button className="primary wide" disabled={busy||!mode.trim()} onClick={submit}>{target?"SEND DIRECT CHALLENGE":"POST OPEN CHALLENGE"}</button><p className="exhibition-note">Exhibition matches never affect official league points.</p></Modal>;
}
function AuthModal({ mode, setMode, players, act, busy }: any) {
  const [u, setU] = useState(""),
    [p, setP] = useState(""),
    [code, setCode] = useState(""),
    [display, setDisplay] = useState("");
  if (mode === "choice")
    return (
      <Modal close={() => setMode(null)}>
        <div className="auth-title">
          <Crown />
          <h2>ENTER THE ARENA</h2>
          <p>Join the growing Blood Strike network or return to your account.</p>
        </div>
        <button className="primary wide" onClick={() => setMode("register")}>
          CREATE MY ACCOUNT
        </button>
        <button className="ghost wide" onClick={() => setMode("login")}>
          PLAYER LOGIN
        </button>
        <button className="ghost wide subtle" onClick={() => setMode(null)}>
          CONTINUE AS GUEST
        </button>
        <button className="text-btn" onClick={() => setMode("claim")}>
          Original eight? Claim your reserved profile
        </button>
      </Modal>
    );
  return (
    <Modal close={() => setMode(null)}>
      <div className="auth-title">
        <Shield />
        <h2>{mode === "claim" ? "CLAIM YOUR PROFILE" : mode === "register" ? "JOIN STRIKE NETWORK" : "PLAYER LOGIN"}</h2>
      </div>
      {mode === "register" && <label>Display name<input value={display} maxLength={24} onChange={e => setDisplay(e.target.value)} placeholder="What everyone will see" /></label>}
      <label>
        Blood Strike username
        {mode === "claim" ? <select value={u} onChange={(e) => setU(e.target.value)}>
          <option value="">Select username</option>
          {players
            .filter((x: Player) => !x.claimed)
            .map((x: Player) => (
              <option key={x.id}>{x.username}</option>
            ))}
        </select> : <input value={u} maxLength={20} autoCapitalize="none" onChange={e => setU(e.target.value)} placeholder="Your exact in-game username" />}
      </label>
      {mode === "claim" && (
        <label>
          One-time claim code
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Supplied by IAlone"
          />
        </label>
      )}
      <label>
        Password
        <input
          type="password"
          value={p}
          onChange={(e) => setP(e.target.value)}
          placeholder="Minimum 8 characters"
        />
      </label>
      <button
        disabled={busy}
        className="primary wide"
        onClick={() => act(mode, { username: u, displayName: display, password: p, claimCode: code })}
      >
        {busy ? "PLEASE WAIT..." : mode === "claim" ? "CLAIM PROFILE" : mode === "register" ? "CREATE ACCOUNT" : "LOGIN"}
      </button>
      <button
        className="text-btn"
        onClick={() => setMode(mode === "login" ? "register" : "login")}
      >
        {mode === "login" ? "New here? Create an account" : "Already registered? Login"}
      </button>
    </Modal>
  );
}
function Modal({ children, close }: any) {
  return (
    <div className="modal-back">
      <div className="modal">
        <button className="modal-x" onClick={close}>
          <X />
        </button>
        {children}
      </div>
    </div>
  );
}
function PlayerHQ({ data, act, busy }: any) {
  const me = data.me,
    available = data.players.filter(
      (p: Player) => !p.team_id && p.id !== me.id,
    ),
    [target, setTarget] = useState(""),
    [name, setName] = useState("");
  return (
    <Page
      title={`WELCOME, ${me.username.toUpperCase()}`}
      sub="Your competitor headquarters"
    >
      <div className="hq-grid">
        <Panel title="TEAM STATUS" icon={<Users />}>
          {me.team_id ? (
            <div className="status-ok">
              <Shield />
              <b>TEAM FORMED</b>
              <span>View your duo on the Teams page.</span>
            </div>
          ) : (
            <>
              <p className="muted">
                Choose one available competitor. They must accept before your
                duo is formed.
              </p>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              >
                <option value="">Choose teammate</option>
                {available.map((p: Player) => (
                  <option key={p.id} value={p.id}>
                    {p.username}
                  </option>
                ))}
              </select>
              <button
                disabled={busy || !target}
                className="primary wide"
                onClick={() => act("invite", { targetPlayerId: +target })}
              >
                <UserPlus />
                SEND TEAM REQUEST
              </button>
            </>
          )}
        </Panel>
        <Panel title="REQUESTS" icon={<Swords />}>
          {data.pendingInvites.length ? (
            data.pendingInvites.map((r: any) => (
              <article className="request" key={r.id}>
                <span>
                  <b>{r.from_username}</b> wants to team up
                </span>
                <div>
                  <button
                    onClick={() =>
                      act("respondInvite", { requestId: r.id, accept: true })
                    }
                  >
                    ACCEPT
                  </button>
                  <button
                    onClick={() =>
                      act("respondInvite", { requestId: r.id, accept: false })
                    }
                  >
                    DECLINE
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="muted">No pending teammate requests.</p>
          )}
        </Panel>
        <Panel title="TEAM NAME" icon={<Crown />}>
          <p className="muted">
            Both teammates must approve a name before it becomes official.
          </p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Suggest a team name"
          />
          <button
            disabled={busy || !name || !me.team_id}
            className="ghost wide"
            onClick={() => act("suggestName", { name })}
          >
            SUBMIT NAME
          </button>
          {data.pendingNames.map((n: any) => (
            <article className="request" key={n.id}>
              <span>
                <b>{n.name}</b> suggested by {n.proposed_by}
              </span>
              <div>
                <button
                  onClick={() =>
                    act("respondName", { proposalId: n.id, accept: true })
                  }
                >
                  ACCEPT
                </button>
                <button
                  onClick={() =>
                    act("respondName", { proposalId: n.id, accept: false })
                  }
                >
                  DECLINE
                </button>
              </div>
            </article>
          ))}
        </Panel>
        <Panel title="ACCOUNT" icon={<Shield />}>
          <p className="muted">
            Role: <b>{me.role.toUpperCase()}</b>
          </p>
          <button className="danger" onClick={() => act("logout")}>
            LOG OUT
          </button>
        </Panel>
      </div>
    </Page>
  );
}
function Avatar({ player, size = 42 }: any) {
  const name =
    player?.display_name || player?.sender_name || player?.username || "?";
  return player?.avatar_data ? (
    <img
      className="avatar"
      style={{ width: size, height: size, borderColor: player.accent_color }}
      src={player.avatar_data}
      alt=""
    />
  ) : (
    <span
      className="avatar avatar-fallback"
      style={{
        width: size,
        height: size,
        borderColor: player?.accent_color,
        background: `${player?.accent_color || "#ff3347"}22`,
        color: player?.accent_color || "#ff3347",
      }}
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}
function SocialStrip({ data, setView }: any) {
  return (
    <section className="social-strip">
      <div className="live-card">
        <span className="pulse" />
        <div>
          <small>PLAYERS ONLINE</small>
          <strong>{data.onlinePlayers.length}</strong>
        </div>
        <div className="avatar-stack">
          {data.onlinePlayers.slice(0, 5).map((p: any) => (
            <Avatar key={p.id} player={p} size={36} />
          ))}
        </div>
      </div>
      <button className="social-action blue" onClick={() => setView("chat")}>
        <MessageCircle />
        <span>
          <b>LEAGUE CHAT</b>
          <small>Talk, plan and challenge</small>
        </span>
      </button>
      <div className="activity-mini">
        <Activity />
        <span>
          <b>LATEST ACTIVITY</b>
          <small>{data.activity[0]?.text || "The league is warming up"}</small>
        </span>
      </div>
    </section>
  );
}
function ArenaList({ fixtures, data, act }: any) {
  const checked = new Set(data.checkins.map((x: any) => x.fixture_id));
  return (
    <div className="arena-list">
      {fixtures.length ? (
        fixtures.map((f: Fixture) => (
          <article className="battle-card" key={f.id}>
            <div className="battle-date">
              {f.scheduled_at
                ? new Date(f.scheduled_at).toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "DATE TBA"}
            </div>
            <div className="battle-versus">
              <strong>{f.home_name}</strong>
              <em>
                {f.status === "completed"
                  ? `${f.home_score} : ${f.away_score}`
                  : "VS"}
              </em>
              <strong>{f.away_name}</strong>
            </div>
            <div className="battle-foot">
              <span className={f.status}>{f.status}</span>
              {data.me &&
                data.me.team_id &&
                [f.home_team_id, f.away_team_id].includes(data.me.team_id) &&
                f.status !== "completed" && (
                  <button
                    disabled={checked.has(f.id)}
                    onClick={() => act("checkIn", { fixtureId: f.id })}
                  >
                    <CheckCircle2 />
                    {checked.has(f.id) ? "READY" : "CHECK IN"}
                  </button>
                )}
            </div>
          </article>
        ))
      ) : (
        <Empty text="Fixtures will appear when an admin schedules them." />
      )}
    </div>
  );
}
function Chat({ data, act, busy }: any) {
  const [channel, setChannel] = useState("public"),
    [message, setMessage] = useState(""),
    [sending, setSending] = useState(false);
  const list = data.messages.filter((m: any) => m.channel === channel);
  const send = async () => {
    if (message.trim()) {
      setSending(true);
      const result = await act("sendMessage", { channel, content: message });
      if (!result) { setSending(false); return; }
      setMessage("");
      setSending(false);
    }
  };
  return (
    <section className="chat-page">
      <div className="chat-stage">
        <div className="chat-topbar">
          <div><span className="chat-symbol"><Hash /></span><div><small>STRIKE NETWORK</small><h1>{channel === "team" ? "Team room" : "Public arena"}</h1><p><i /> {data.onlinePlayers.length} strikers online</p></div></div>
          <div className="chat-avatars">{data.onlinePlayers.slice(0, 4).map((p: any) => <Avatar key={p.id} player={p} size={34} />)}</div>
        </div>
        <div className="channel-switch">
          <button
            className={channel === "public" ? "active" : ""}
            onClick={() => setChannel("public")}
          >
            <MessageCircle />
            <span><b>Public arena</b><small>Everyone in the league</small></span>
          </button>
          <button
            disabled={!data.me.team_id}
            className={channel === "team" ? "active" : ""}
            onClick={() => setChannel("team")}
          >
            <Shield />
            <span><b>Team room</b><small>{data.me.team_id ? "Private duo channel" : "Form a duo to unlock"}</small></span>
          </button>
        </div>
        <div className="chat-conversation">
          <div className="chat-day"><span>TODAY</span></div>
            {list.length ? (
              list.map((m: any) => (
                <article
                  className={`chat-message ${m.sender_id === data.me.id ? "mine" : ""}`}
                  key={m.id}
                >
                  <Avatar player={m} size={38} />
                  <div className="message-wrap">
                    <div className="message-name"><b>{m.sender_name}</b><small>@{m.username}</small></div>
                    <div className="message-bubble"><p>{m.content}</p></div>
                    <div className="message-meta"><time>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>{m.sender_id === data.me.id && <span><Check /> Sent</span>}<button className={m.reacted_by_me ? "reacted" : ""} onClick={() => act("toggleReaction", { messageId: m.id })}><Heart />{m.reaction_count || ""}</button></div>
                  </div>
                </article>
              ))
            ) : (
              <Empty
                text={
                  channel === "team"
                    ? "Your private team room is ready."
                    : "Start the first league conversation."
                }
              />
            )}
        </div>
          <div className="chat-composer">
            <button className="chat-add"><ImagePlus /></button>
            <input
              value={message}
              maxLength={300}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={
                channel === "team"
                  ? "Message your teammate..."
                  : "Message the league..."
              }
            />
            <button className="chat-send" disabled={busy || sending || !message.trim()} onClick={send}>
              {sending ? <span className="sending-dot" /> : <Send />}
            </button>
          </div>
      </div>
    </section>
  );
}
function Profile({ data, act, busy, setView }: any) {
  const me = data.me,
    [displayName, setDisplayName] = useState(me.display_name || me.username),
    [bio, setBio] = useState(me.bio || ""),
    [accent, setAccent] = useState(me.accent_color || "#ff3347"),
    [avatar, setAvatar] = useState(me.avatar_data || null),
    [oldPass, setOldPass] = useState(""),
    [newPass, setNewPass] = useState("");
  const readImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas"),
          ctx = c.getContext("2d")!;
        c.width = 256;
        c.height = 256;
        const side = Math.min(img.width, img.height),
          sx = (img.width - side) / 2,
          sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, 256, 256);
        setAvatar(c.toDataURL("image/jpeg", 0.78));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };
  return (
    <Page title="MY PROFILE" sub="Your identity inside the Strike League">
      {["admin", "owner"].includes(me.role) && (
        <button className="admin-launch" onClick={() => setView("admin")}>
          <span><Settings /><b>LEAGUE CONTROL</b><small>Fixtures, results, claim codes and admin roles</small></span><ChevronRight />
        </button>
      )}
      <section className="profile-hero" style={{ "--accent": accent } as any}>
        <div className="profile-glow" />
        <label className="avatar-edit">
          <Avatar
            player={{
              ...me,
              avatar_data: avatar,
              display_name: displayName,
              accent_color: accent,
            }}
            size={112}
          />
          <span>
            <ImagePlus />
            CHANGE
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              e.target.files?.[0] && readImage(e.target.files[0])
            }
          />
        </label>
        <div>
          <small className="profile-role">{me.role.toUpperCase()} {me.verified && <BadgeCheck />}</small>
          <h2>{displayName}</h2>
          <p>@{me.username}</p>
          <span className="status-pill">
            <i /> ONLINE
          </span>
        </div>
      </section>
      <div className="profile-grid">
        <Panel title="ACCOUNT SETTINGS" icon={<UserRound />}>
          <label>
            Display name
            <input
              value={displayName}
              maxLength={24}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
          <label>
            Bio
            <textarea
              value={bio}
              maxLength={120}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the league about yourself"
            />
          </label>
          <label>
            Profile colour
            <div className="color-row">
              {[
                "#ff3347",
                "#37a8ff",
                "#a970ff",
                "#ffb020",
                "#27d69b",
                "#ff5db1",
              ].map((c) => (
                <button
                  key={c}
                  className={accent === c ? "selected" : ""}
                  style={{ background: c }}
                  onClick={() => setAccent(c)}
                />
              ))}
            </div>
          </label>
          <button
            className="primary wide"
            disabled={busy}
            onClick={() =>
              act("updateProfile", {
                displayName,
                bio,
                accentColor: accent,
                avatarData: avatar,
              })
            }
          >
            SAVE PROFILE
          </button>
        </Panel>
        <Panel title="TEAM & REQUESTS" icon={<Users />}>
          <TeamControls data={data} act={act} busy={busy} />
        </Panel>
        <Panel title="SECURITY" icon={<Shield />}>
          {me.role === "owner" ? (
            <p className="muted">
              Your owner password is managed securely from Render Environment as{" "}
              <b>OWNER_PASSWORD</b>.
            </p>
          ) : (
            <>
              <label>
                Current password
                <input
                  type="password"
                  value={oldPass}
                  onChange={(e) => setOldPass(e.target.value)}
                />
              </label>
              <label>
                New password
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                />
              </label>
              <button
                className="ghost wide"
                onClick={() =>
                  act("changePassword", {
                    currentPassword: oldPass,
                    newPassword: newPass,
                  })
                }
              >
                CHANGE PASSWORD
              </button>
            </>
          )}
          <button className="danger wide" onClick={() => act("logout")}>
            LOG OUT
          </button>
        </Panel>
        <Panel title="RECENT ACTIVITY" icon={<Activity />}>
          <ActivityFeed
            items={data.activity
              .filter((a: any) => a.actor_id === me.id)
              .slice(0, 6)}
          />
        </Panel>
      </div>
    </Page>
  );
}
function TeamControls({ data, act, busy }: any) {
  const me = data.me,
    available = data.players.filter(
      (p: Player) => !p.team_id && p.id !== me.id,
    ),
    [target, setTarget] = useState(""),
    [name, setName] = useState("");
  return (
    <>
      {me.team_id ? (
        <p className="status-ok">
          <Shield />
          <b>DUO FORMED</b>
        </p>
      ) : (
        <>
          <select value={target} onChange={(e) => setTarget(e.target.value)}>
            <option value="">Choose teammate</option>
            {available.map((p: Player) => (
              <option key={p.id} value={p.id}>
                {p.display_name || p.username}
              </option>
            ))}
          </select>
          <button
            disabled={busy || !target}
            className="primary wide"
            onClick={() => act("invite", { targetPlayerId: +target })}
          >
            <UserPlus />
            SEND REQUEST
          </button>
        </>
      )}
      {data.pendingInvites.map((r: any) => (
        <article className="request" key={r.id}>
          <span>
            <b>{r.from_username}</b> wants to team up
          </span>
          <div>
            <button
              onClick={() =>
                act("respondInvite", { requestId: r.id, accept: true })
              }
            >
              ACCEPT
            </button>
            <button
              onClick={() =>
                act("respondInvite", { requestId: r.id, accept: false })
              }
            >
              DECLINE
            </button>
          </div>
        </article>
      ))}
      {me.team_id && (
        <>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Suggest a team name"
          />
          <button
            disabled={!name}
            className="ghost wide"
            onClick={() => act("suggestName", { name })}
          >
            SUGGEST NAME
          </button>
        </>
      )}
      {data.pendingNames.map((n: any) => (
        <article className="request" key={n.id}>
          <span>
            <b>{n.name}</b>
          </span>
          <div>
            <button
              onClick={() =>
                act("respondName", { proposalId: n.id, accept: true })
              }
            >
              ACCEPT
            </button>
            <button
              onClick={() =>
                act("respondName", { proposalId: n.id, accept: false })
              }
            >
              DECLINE
            </button>
          </div>
        </article>
      ))}
    </>
  );
}
function ActivityFeed({ items }: any) {
  return (
    <div className="activity-feed">
      {items.length ? (
        items.map((a: any) => (
          <article key={a.id}>
            <span className={`activity-icon ${a.kind}`}>
              <Activity />
            </span>
            <div>
              <b>{a.text}</b>
              <small>{new Date(a.created_at).toLocaleString()}</small>
            </div>
          </article>
        ))
      ) : (
        <p className="muted">No activity yet.</p>
      )}
    </div>
  );
}
function Admin({ data, act, busy }: any) {
  const [h, setH] = useState(""),
    [a, setA] = useState(""),
    [date, setDate] = useState(""),
    [ph, setPh] = useState(""),
    [pa, setPa] = useState(""),
    [pdate, setPdate] = useState("");
  return (
    <Page title="LEAGUE CONTROL" sub="Owner and administrator operations">
      <div className="admin-summary"><article><UserRound/><span><b>{data.players.filter((p:Player)=>p.claimed).length}</b>MEMBERS</span></article><article><Swords/><span><b>{data.individualFixtures.length}</b>1V1 FIXTURES</span></article><article><Users/><span><b>{data.fixtures.length}</b>DUO FIXTURES</span></article><article><Radio/><span><b>{data.duels.length}</b>EXHIBITIONS</span></article></div>
      <div className="admin-grid">
        <Panel title="CREATE 1V1 FIXTURE" icon={<UserRound />}>
          <div className="form-row">
            <select value={ph} onChange={(e) => setPh(e.target.value)}><option value="">Home player</option>{data.players.filter((p:Player)=>p.claimed).map((p:Player)=><option value={p.id} key={p.id}>{p.display_name||p.username}</option>)}</select>
            <select value={pa} onChange={(e) => setPa(e.target.value)}><option value="">Away player</option>{data.players.filter((p:Player)=>p.claimed).map((p:Player)=><option value={p.id} key={p.id}>{p.display_name||p.username}</option>)}</select>
            <input type="datetime-local" value={pdate} onChange={e=>setPdate(e.target.value)}/>
          </div>
          <button className="primary" disabled={busy||!ph||!pa||ph===pa} onClick={()=>act("createIndividualFixture",{homePlayerId:+ph,awayPlayerId:+pa,scheduledAt:pdate||null})}>ADD OFFICIAL 1V1</button>
        </Panel>
        <Panel title="CREATE DUO FIXTURE" icon={<CalendarDays />}>
          <div className="form-row">
            <select value={h} onChange={(e) => setH(e.target.value)}>
              <option value="">Home team</option>
              {data.teams.map((t: Team) => (
                <option value={t.id} key={t.id}>
                  {t.name || "UNNAMED DUO"}
                </option>
              ))}
            </select>
            <select value={a} onChange={(e) => setA(e.target.value)}>
              <option value="">Away team</option>
              {data.teams.map((t: Team) => (
                <option value={t.id} key={t.id}>
                  {t.name || "UNNAMED DUO"}
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <button
            className="primary"
            disabled={busy || !h || !a || h === a}
            onClick={() =>
              act("createFixture", {
                homeTeamId: +h,
                awayTeamId: +a,
                scheduledAt: date || null,
              })
            }
          >
            ADD DUO FIXTURE
          </button>
        </Panel>
        <Panel title="MANAGE 1V1 FIXTURES" icon={<Trophy />}>
          {data.individualFixtures.length ? data.individualFixtures.map((f:any)=><AdminMatchRow key={f.id} f={f} kind="individual" act={act}/>) : <p className="muted">No individual fixtures yet.</p>}
        </Panel>
        <Panel title="MANAGE DUO FIXTURES" icon={<Users />}>
          {data.fixtures.length ? data.fixtures.map((f:any)=><AdminMatchRow key={f.id} f={f} kind="team" act={act}/>) : <p className="muted">No duo fixtures yet.</p>}
        </Panel>
        <Panel title="COMMUNITY DUELS" icon={<Swords />}>
          {data.duels.length ? data.duels.map((f:any)=><AdminMatchRow key={f.id} f={{...f,home_name:f.challenger_name,away_name:f.opponent_name,home_score:f.challenger_score,away_score:f.opponent_score}} kind="duel" act={act}/>) : <p className="muted">No exhibition duels yet.</p>}
        </Panel>
        <Panel title="MEMBER VERIFICATION" icon={<UserCheck />}>
          <p className="muted">New accounts can enter immediately. Verification marks trusted league members.</p>
          {data.players.filter((p:Player)=>p.claimed&&p.role!=="owner").map((p:Player)=><article className="role" key={p.id}><span><b>{p.display_name||p.username}</b><small>@{p.username} · {p.verified?"VERIFIED":"NEW MEMBER"}</small></span><button onClick={()=>act("setVerified",{playerId:p.id,verified:!p.verified})}>{p.verified?"REMOVE BADGE":"VERIFY"}</button></article>)}
        </Panel>
        {data.me.role === "owner" && (
          <Panel title="PLAYER CLAIM CODES" icon={<Shield />}>
            <p className="muted">
              Send each unclaimed player only the code beside their username.
            </p>
            {data.claimCodes.map((p: any) => (
              <article className="role" key={p.id}>
                <span>
                  <b>{p.username}</b>
                  <small>{p.claimed ? "ACCOUNT CLAIMED" : p.claim_code}</small>
                </span>
                {!p.claimed && (
                  <button
                    onClick={() =>
                      act("regenerateClaimCode", { playerId: p.id })
                    }
                  >
                    NEW CODE
                  </button>
                )}
              </article>
            ))}
          </Panel>
        )}
        {data.me.role === "owner" && (
          <Panel title="ADMIN ROLES" icon={<Crown />}>
            {data.players
              .filter((p: Player) => p.role !== "owner")
              .map((p: Player) => (
                <article className="role" key={p.id}>
                  <span>
                    <b>{p.username}</b>
                    <small>{p.role}</small>
                  </span>
                  <button
                    onClick={() =>
                      act("setAdmin", {
                        playerId: p.id,
                        admin: p.role !== "admin",
                      })
                    }
                  >
                    {p.role === "admin" ? "REMOVE ADMIN" : "MAKE ADMIN"}
                  </button>
                </article>
              ))}
          </Panel>
        )}
      </div>
    </Page>
  );
}
function AdminMatchRow({ f, act, kind }: any) {
  const [h, setH] = useState(f.home_score ?? ""),
    [a, setA] = useState(f.away_score ?? ""),
    [date,setDate]=useState(f.scheduled_at ? new Date(f.scheduled_at).toISOString().slice(0,16) : "");
  const resultAction=kind==="individual"?"setIndividualResult":kind==="duel"?"setDuelResult":"setResult";
  return (
    <article className="admin-match-row">
      <div className="admin-match-name"><b>{f.home_name} <em>vs</em> {f.away_name||"OPEN"}</b><small>{String(f.status).toUpperCase()}</small></div>
      <div className="admin-time-edit"><input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)}/><button onClick={()=>act("updateMatch",{kind,matchId:f.id,scheduledAt:date||null,status:"scheduled"})}><Clock3/>TIME</button></div>
      {f.away_name && <div className="admin-score-edit">
        <input
          type="number"
          min="0"
          value={h}
          onChange={(e) => setH(e.target.value)}
        />
        <span>—</span>
        <input
          type="number"
          min="0"
          value={a}
          onChange={(e) => setA(e.target.value)}
        />
        <button
          onClick={() =>
            act(resultAction, kind==="duel" ? {duelId:f.id,homeScore:+h,awayScore:+a} : { fixtureId: f.id, homeScore: +h, awayScore: +a })
          }
        >
          SAVE SCORE
        </button>
      </div>}
      <div className="admin-row-actions"><button onClick={()=>act("updateMatch",{kind,matchId:f.id,scheduledAt:date||null,status:"postponed"})}>POSTPONE</button><button className="remove" onClick={()=>{if(confirm("Remove this match permanently?"))act("deleteMatch",{kind,matchId:f.id})}}><Trash2/>REMOVE</button></div>
    </article>
  );
}
