const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'users.txt');

// Ensure data directory and file exist
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf8');
  console.log('Created fresh users.txt database.');
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper: read all users
function readUsers() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Helper: write all users
function writeUsers(users) {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2), 'utf8');
}

// POST /api/users — register a new user
app.post('/api/users', (req, res) => {
  const { name, interests, joinedAt } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required.' });
  }

  const users = readUsers();

  const newUser = {
    id: Date.now().toString(),
    name: name.trim(),
    interests: Array.isArray(interests) ? interests : [],
    joinedAt: joinedAt || new Date().toISOString(),
  };

  users.push(newUser);
  writeUsers(users);

  console.log(`[+] New user: ${newUser.name} (${newUser.id})`);
  return res.status(201).json({ success: true, user: newUser });
});

// GET /api/users — get all users (useful later for matching/browse)
app.get('/api/users', (req, res) => {
  const users = readUsers();
  return res.json(users);
});

// GET /api/users/:id — get a single user
app.get('/api/users/:id', (req, res) => {
  const users = readUsers();
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  return res.json(user);
});

app.listen(PORT, () => {
  console.log(`
  ██████╗ ██╗   ██╗██████╗ ██████╗ ██╗   ██╗
  ██╔══██╗██║   ██║██╔══██╗██╔══██╗╚██╗ ██╔╝
  ██████╔╝██║   ██║██║  ██║██║  ██║ ╚████╔╝ 
  ██╔══██╗██║   ██║██║  ██║██║  ██║  ╚██╔╝  
  ██████╔╝╚██████╔╝██████╔╝██████╔╝   ██║   
  ╚═════╝  ╚═════╝ ╚═════╝ ╚═════╝    ╚═╝   
  
  Server running → http://localhost:${PORT}
  Database file  → ${DB_FILE}
  `);
});
