# Strike League

A full-stack Blood Strike community league website for eight competitors and four two-player teams.

## Included

- Guest mode with public standings, teams, fixtures and results
- `IAlone` owner login controlled by a private Render environment password
- Hardcoded competitor list with one-time profile claim codes visible only to the owner
- Password login with HTTP-only sessions
- Teammate invitations and acceptance
- Two-player approval for official team names
- Automatic league table calculation when results are saved
- Owner/admin control room for fixtures, scores and admin roles
- Responsive red-and-black esports interface
- Colourful player-first navigation: Home, League, Arena, Chat and Profile
- Public league chat and private teammate chat
- Notifications, online presence and league activity feed
- Match-ready check-ins
- Editable display name, bio, profile colour and compressed profile picture
- Player password settings and owner-safe Render password management
- Supabase Postgres persistence and Render deployment configuration

## Deploy to Render

1. Create a Supabase project and copy its **connection string** from Project Settings → Database. Use the session pooler URL if direct connections are unavailable.
2. Push this repository to GitHub.
3. In Render, choose **New → Blueprint**, connect the repository, and approve `render.yaml`.
4. Add `DATABASE_URL` and choose a private `OWNER_PASSWORD` when Render requests them. `SESSION_SECRET` is generated automatically.
5. Open the website and log in with username `IAlone` plus your `OWNER_PASSWORD`. No claim code is required for the owner.
6. Open **Admin → Player Claim Codes** to copy or regenerate each unclaimed player's code. `IAlone` can also promote claimed players from **Admin → Admin Roles**.

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
