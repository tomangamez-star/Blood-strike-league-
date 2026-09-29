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
console.log("\nONE-TIME CLAIM CODES — send each player only their own code\n");
for (const username of players) {
  const [existing] = await sql`select claimed from players where username=${username}`;
  if (existing?.claimed) {
    console.log(`${username.padEnd(12)} ALREADY CLAIMED`);
    continue;
  }
  const code = `BSL-${randomBytes(3).toString("hex").toUpperCase()}`;
  const hash = await bcrypt.hash(code, 12);
  await sql`insert into players(username,role,claim_code_hash) values(${username},${username === "IAlone" ? "owner" : "player"},${hash}) on conflict(username) do update set role=excluded.role,claim_code_hash=excluded.claim_code_hash`;
  console.log(`${username.padEnd(12)} ${code}`);
}
console.log("\nSave these codes now. They are not stored in plain text.\n");
await sql.end();
