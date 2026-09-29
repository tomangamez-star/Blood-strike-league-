# Strike League

A full-stack Blood Strike community league website for eight competitors and four two-player teams.

## Included

- Guest mode with public standings, teams, fixtures and results
- Hardcoded competitor list with secure one-time profile claim codes
- Password login with HTTP-only sessions
- Teammate invitations and acceptance
- Two-player approval for official team names
- Automatic league table calculation when results are saved
- Owner/admin control room for fixtures, scores and admin roles
- Responsive red-and-black esports interface
- Supabase Postgres persistence and Render deployment configuration

## Deploy to Render

1. Create a Supabase project and copy its **connection string** from Project Settings → Database. Use the session pooler URL if direct connections are unavailable.
2. Push this repository to GitHub.
3. In Render, choose **New → Blueprint**, connect the repository, and approve `render.yaml`.
4. Add `DATABASE_URL` when Render requests it. `SESSION_SECRET` is generated automatically.
5. Open the first deployment logs and find **ONE-TIME CLAIM CODES**. Copy the eight codes printed beneath it. Send each competitor only their own code. Codes for unclaimed accounts are refreshed during a redeploy; claimed accounts remain untouched.
6. Open the website. `IAlone` is the permanent owner and can promote other claimed players from **Admin → Admin Roles**.

## Local development

Copy `.env.example` to `.env.local`, add your Supabase connection string, then run:

```bash
npm install
npm run setup-db
npm run dev
```

Open `http://localhost:3000`.

## League rules implemented

- Win: 3 points
- Draw: 1 point
- Loss: 0 points
- Tiebreaker: round difference
- Players cannot update fixtures, results or standings
- Admins can create fixtures and record/correct results
- Only the owner can appoint or remove admins
- A player cannot join more than one team
- Both teammates must approve a proposed team name
- Unnamed teams display as **USER & USER**
