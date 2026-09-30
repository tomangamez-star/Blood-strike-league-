import postgres from "postgres";
import bcrypt from "bcryptjs";
import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
if (!process.env.DATABASE_URL) throw Error("Set DATABASE_URL first");
const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });
await sql.unsafe(
  await readFile(new URL("../schema.sql", import.meta.url), "utf8"),
);
const players = [
  "czarkills",
  "headshot",
  "aksenpai",
  "IAlone",
  "Deadshot",
  "aizen",
  "crisodan",
  "flamestroke",
];
for (const username of players) {
  if (username === "IAlone") {
    await sql`insert into players(username,role,claimed) values(${username},'owner',true) on conflict(username) do update set role='owner',claimed=true,claim_code=null,claim_code_hash=null`;
    continue;
  }
  const [existing] =
    await sql`select claimed,claim_code from players where username=${username}`;
  if (existing?.claimed || existing?.claim_code) continue;
  const code = `BSL-${randomBytes(3).toString("hex").toUpperCase()}`;
  const hash = await bcrypt.hash(code, 12);
  await sql`insert into players(username,role,claim_code_hash,claim_code) values(${username},'player',${hash},${code}) on conflict(username) do update set claim_code_hash=excluded.claim_code_hash,claim_code=excluded.claim_code`;
}
await sql`update players set verified=true where username in ${sql(players)}`;
console.log(
  "League accounts ready. Player codes are available in IAlone's Admin panel.",
);
await sql.end();
