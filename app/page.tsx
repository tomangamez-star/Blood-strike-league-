"use client";
import { useEffect, useMemo, useState } from "react";
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
      setToast(j.message || "Saved");
      setAuth(null);
      await load();
    } catch (e: any) {
      setToast(e.message || "Something went wrong");
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
            <button onClick={() => act("markNotificationsRead")}>
              MARK READ
            </button>
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
      {view === "home" && (
        <>
          <section className="hero">
            <div className="eyebrow">
              <span /> BLOOD STRIKE COMMUNITY LEAGUE
            </div>
            <h1>
              FORM YOUR DUO.
              <br />
              <em>RULE THE LEAGUE.</em>
            </h1>
            <p>
              Eight contenders. Four teams. One table. Choose your teammate,
              forge a name and fight your way to the top.
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
              <strong>08</strong>
              <span>PLAYERS</span>
            </article>
            <article>
              <small>TEAMS FORMED</small>
              <strong>{String(data.teams.length).padStart(2, "0")}</strong>
              <span>OF 04</span>
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
          {data.me && <SocialStrip data={data} setView={setView} />}
        </>
      )}
      {view === "standings" && (
        <Page
          title="LEAGUE STANDINGS"
          sub="Every round matters. Win: 3 points · Draw: 1 point"
        >
          <div className="table-card">
            <Standings teams={standings} full />
          </div>
          <div className="team-grid league-teams">
            {data.teams.map((t) => (
              <article className="team-card" key={t.id}>
                <Shield />
                <small>DUO</small>
                <h3>{t.name || "USER & USER"}</h3>
                <div>
                  <span>{t.player1}</span>
                  <b>+</b>
                  <span>{t.player2}</span>
                </div>
              </article>
            ))}
          </div>
        </Page>
      )}
      {view === "fixtures" && (
        <Page
          title="FIXTURES & RESULTS"
          sub="Scheduled battles and confirmed scores"
        >
          <div className="fixture-grid">
            <ArenaList fixtures={data.fixtures} data={data} act={act} />
          </div>
        </Page>
      )}
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
                  <h3>{t.name || "USER & USER"}</h3>
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
        <Profile data={data} act={act} busy={busy} />
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
      <footer>
        <b>STRIKE LEAGUE</b>
        <span>Unofficial Blood Strike community competition</span>
        <span>Season 01 · 2026</span>
      </footer>
    </main>
  );
}
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
                {f.home_name || "USER & USER"}{" "}
                <em>
                  {f.status === "completed"
                    ? `${f.home_score} — ${f.away_score}`
                    : "VS"}
                </em>{" "}
                {f.away_name || "USER & USER"}
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
              {t.name || "USER & USER"}
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
function AuthModal({ mode, setMode, players, act, busy }: any) {
  const [u, setU] = useState(""),
    [p, setP] = useState(""),
    [code, setCode] = useState("");
  if (mode === "choice")
    return (
      <Modal close={() => setMode(null)}>
        <div className="auth-title">
          <Crown />
          <h2>ENTER THE ARENA</h2>
          <p>Competitors sign in. Everyone else enters as a guest.</p>
        </div>
        <button className="primary wide" onClick={() => setMode("login")}>
          PLAYER LOGIN
        </button>
        <button className="ghost wide" onClick={() => setMode(null)}>
          CONTINUE AS GUEST
        </button>
        <button className="text-btn" onClick={() => setMode("claim")}>
          First time? Claim your player profile
        </button>
      </Modal>
    );
  return (
    <Modal close={() => setMode(null)}>
      <div className="auth-title">
        <Shield />
        <h2>{mode === "claim" ? "CLAIM YOUR PROFILE" : "PLAYER LOGIN"}</h2>
      </div>
      <label>
        Blood Strike username
        <select value={u} onChange={(e) => setU(e.target.value)}>
          <option value="">Select username</option>
          {players
            .filter((x: Player) => (mode === "login" ? x.claimed : !x.claimed))
            .map((x: Player) => (
              <option key={x.id}>{x.username}</option>
            ))}
        </select>
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
        onClick={() => act(mode, { username: u, password: p, claimCode: code })}
      >
        {busy ? "PLEASE WAIT..." : mode === "claim" ? "CLAIM PROFILE" : "LOGIN"}
      </button>
      <button
        className="text-btn"
        onClick={() => setMode(mode === "claim" ? "login" : "claim")}
      >
        {mode === "claim"
          ? "Already claimed? Login"
          : "First time? Claim profile"}
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
    [message, setMessage] = useState("");
  const list = data.messages.filter((m: any) => m.channel === channel);
  const send = () => {
    if (message.trim()) {
      act("sendMessage", { channel, content: message });
      setMessage("");
    }
  };
  return (
    <Page
      title="LEAGUE CHAT"
      sub="The live room for challenges, reactions and team plans"
    >
      <div className="chat-shell">
        <aside>
          <button
            className={channel === "public" ? "active" : ""}
            onClick={() => setChannel("public")}
          >
            <MessageCircle />
            Public arena
          </button>
          <button
            disabled={!data.me.team_id}
            className={channel === "team" ? "active" : ""}
            onClick={() => setChannel("team")}
          >
            <Shield />
            Team room
          </button>
          <div className="online-list">
            <small>ONLINE NOW</small>
            {data.onlinePlayers.map((p: any) => (
              <div key={p.id}>
                <Avatar player={p} size={32} />
                <span>{p.display_name}</span>
                <i />
              </div>
            ))}
          </div>
        </aside>
        <section>
          <div className="messages">
            {list.length ? (
              list.map((m: any) => (
                <article
                  className={m.sender_id === data.me.id ? "mine" : ""}
                  key={m.id}
                >
                  <Avatar player={m} size={38} />
                  <div>
                    <b>
                      {m.sender_name}
                      <small>@{m.username}</small>
                    </b>
                    <p>{m.content}</p>
                    <time>
                      {new Date(m.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
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
          <div className="composer">
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
            <button disabled={busy || !message.trim()} onClick={send}>
              <Send />
            </button>
          </div>
        </section>
      </div>
    </Page>
  );
}
function Profile({ data, act, busy }: any) {
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
          <small>{me.role.toUpperCase()}</small>
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
    [date, setDate] = useState("");
  return (
    <Page title="LEAGUE CONTROL" sub="Owner and administrator operations">
      <div className="admin-grid">
        <Panel title="CREATE FIXTURE" icon={<CalendarDays />}>
          <div className="form-row">
            <select value={h} onChange={(e) => setH(e.target.value)}>
              <option value="">Home team</option>
              {data.teams.map((t: Team) => (
                <option value={t.id} key={t.id}>
                  {t.name || "USER & USER"}
                </option>
              ))}
            </select>
            <select value={a} onChange={(e) => setA(e.target.value)}>
              <option value="">Away team</option>
              {data.teams.map((t: Team) => (
                <option value={t.id} key={t.id}>
                  {t.name || "USER & USER"}
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
            ADD FIXTURE
          </button>
        </Panel>
        <Panel title="UPDATE RESULTS" icon={<Trophy />}>
          {data.fixtures.map((f: Fixture) => (
            <ResultRow key={f.id} f={f} act={act} />
          ))}
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
function ResultRow({ f, act }: any) {
  const [h, setH] = useState(f.home_score ?? ""),
    [a, setA] = useState(f.away_score ?? "");
  return (
    <article className="result-row">
      <b>
        {f.home_name} <em>vs</em> {f.away_name}
      </b>
      <div>
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
            act("setResult", { fixtureId: f.id, homeScore: +h, awayScore: +a })
          }
        >
          SAVE
        </button>
      </div>
    </article>
  );
}
