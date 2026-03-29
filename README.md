# Buddy App

A social app to find people and do things together.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the server**
   ```bash
   npm start
   ```
   Or with auto-reload during development:
   ```bash
   npm run dev
   ```

3. **Open the app**
   Visit → http://localhost:3000

## How it works

- The frontend is pure HTML/CSS/JS in the `public/` folder
- The backend is a Node.js + Express server (`server.js`)
- All user data is stored in `data/users.txt` as JSON
- This file is **shared** — every user who signs up gets saved there

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/users` | Register a new user |
| GET  | `/api/users` | Get all users |
| GET  | `/api/users/:id` | Get user by ID |

## Database file (`data/users.txt`)

Each user record looks like:
```json
{
  "id": "1712345678901",
  "name": "Dia",
  "interests": ["Gaming", "Coding", "Music"],
  "joinedAt": "2026-03-28T14:00:00.000Z"
}
```

## File Structure

```
buddy/
├── public/
│   └── index.html      ← All 3 onboarding screens
├── data/
│   └── users.txt       ← Shared flat-file database (auto-created)
├── server.js           ← Express backend
├── package.json
└── README.md
```
