const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.txt');
const POSTS_FILE = path.join(DATA_DIR, 'posts.txt');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.txt');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), 'utf8');
  console.log('Created fresh users.txt database.');
}
if (!fs.existsSync(POSTS_FILE)) {
  fs.writeFileSync(POSTS_FILE, JSON.stringify([], null, 2), 'utf8');
  console.log('Created fresh posts.txt database.');
}

const DEFAULT_TASKS = [
  { id: 't1', title: 'Try a new café nearby',        emoji: '☕', distance: '0.4 mi', soloXP: 20, groupXP: 30, description: 'Visit a café you have never been to before.' },
  { id: 't2', title: 'Board game night',              emoji: '🎲', distance: '1.2 mi', soloXP: 50, groupXP: 75, description: 'Play at least one board game with others.' },
  { id: 't3', title: 'Sunset walk at the park',       emoji: '🌅', distance: '0.8 mi', soloXP: 30, groupXP: 45, description: 'Take a walk in a park during golden hour.' },
  { id: 't4', title: 'Cook a new recipe together',    emoji: '🍲', distance: '2.1 mi', soloXP: 40, groupXP: 60, description: 'Try cooking something you have never made before.' },
  { id: 't5', title: 'Explore a local bookstore',     emoji: '📚', distance: '0.6 mi', soloXP: 25, groupXP: 40, description: 'Browse a local bookstore and find a hidden gem.' },
  { id: 't6', title: 'Attend an open mic night',      emoji: '🎤', distance: '1.5 mi', soloXP: 35, groupXP: 55, description: 'Show up to a local open mic — you do not have to perform!' },
];

if (!fs.existsSync(TASKS_FILE)) {
  // Each task gets a group: [] array of users who joined
  const tasks = DEFAULT_TASKS.map(t => ({ ...t, group: [] }));
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2), 'utf8');
  console.log('Created fresh tasks.txt database.');
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return []; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// ---- USERS ----
app.post('/api/users', (req, res) => {
  const { name, interests, joinedAt } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length === 0)
    return res.status(400).json({ error: 'Name is required.' });
  const users = readJSON(USERS_FILE);
  const newUser = {
    id: Date.now().toString(),
    name: name.trim(),
    interests: Array.isArray(interests) ? interests : [],
    joinedAt: joinedAt || new Date().toISOString(),
  };
  users.push(newUser);
  writeJSON(USERS_FILE, users);
  console.log(`[+] New user: ${newUser.name} (${newUser.id})`);
  return res.status(201).json({ success: true, user: newUser });
});

app.get('/api/users', (req, res) => res.json(readJSON(USERS_FILE)));

// GET /api/users/lookup?name=Dia — find user by name (case-insensitive)
app.get('/api/users/lookup', (req, res) => {
  const name = (req.query.name || '').trim().toLowerCase();
  if (!name) return res.status(400).json({ error: 'Name is required.' });
  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.name.toLowerCase() === name);
  if (!user) return res.status(404).json({ found: false });
  return res.json({ found: true, user });
});

app.get('/api/users/:id', (req, res) => {
  const user = readJSON(USERS_FILE).find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  return res.json(user);
});

// ---- POSTS ----
app.get('/api/posts', (req, res) => {
  const posts = readJSON(POSTS_FILE);
  return res.json(posts.slice().reverse());
});

app.post('/api/posts', (req, res) => {
  const { userId, userName, content } = req.body;
  if (!content || typeof content !== 'string' || content.trim().length === 0)
    return res.status(400).json({ error: 'Post content is required.' });
  if (!userId || !userName)
    return res.status(400).json({ error: 'userId and userName are required.' });
  const posts = readJSON(POSTS_FILE);
  const newPost = {
    id: Date.now().toString(),
    userId,
    userName: userName.trim(),
    content: content.trim(),
    likes: 0,
    createdAt: new Date().toISOString(),
  };
  posts.push(newPost);
  writeJSON(POSTS_FILE, posts);
  console.log(`[+] New post by ${newPost.userName}: "${newPost.content.slice(0, 50)}"`);
  return res.status(201).json({ success: true, post: newPost });
});

app.post('/api/posts/:id/like', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required.' });
  const posts = readJSON(POSTS_FILE);
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found.' });
  if (!Array.isArray(post.likedBy)) post.likedBy = [];
  if (post.likedBy.includes(userId))
    return res.json({ success: true, likes: post.likedBy.length, alreadyLiked: true });
  post.likedBy.push(userId);
  post.likes = post.likedBy.length;
  writeJSON(POSTS_FILE, posts);
  return res.json({ success: true, likes: post.likes, alreadyLiked: false });
});

app.delete('/api/posts/:id', (req, res) => {
  const { userId } = req.body;
  let posts = readJSON(POSTS_FILE);
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found.' });
  if (post.userId !== userId) return res.status(403).json({ error: 'Not your post.' });
  posts = posts.filter(p => p.id !== req.params.id);
  writeJSON(POSTS_FILE, posts);
  return res.json({ success: true });
});


// ---- TASKS ----
// GET /api/tasks — all tasks with group info
app.get('/api/tasks', (req, res) => {
  res.json(readJSON(TASKS_FILE));
});

// POST /api/tasks/:id/join — join a task group
app.post('/api/tasks/:id/join', (req, res) => {
  const { userId, userName, mode } = req.body;
  if (!userId || !userName) return res.status(400).json({ error: 'userId and userName required.' });
  const tasks = readJSON(TASKS_FILE);
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found.' });
  if (!Array.isArray(task.group)) task.group = [];
  const already = task.group.find(m => m.userId === userId);
  if (!already) {
    task.group.push({ userId, userName, joinedAt: new Date().toISOString(), mode: mode || 'solo' });
    writeJSON(TASKS_FILE, tasks);
  }
  return res.json({ success: true, task });
});

// POST /api/tasks/:id/leave — leave a task group
app.post('/api/tasks/:id/leave', (req, res) => {
  const { userId } = req.body;
  const tasks = readJSON(TASKS_FILE);
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found.' });
  task.group = (task.group || []).filter(m => m.userId !== userId);
  writeJSON(TASKS_FILE, tasks);
  return res.json({ success: true, task });
});

// POST /api/tasks/:id/complete — mark complete, adds to user log
app.post('/api/tasks/:id/complete', (req, res) => {
  const { userId, mode } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required.' });
  const tasks = readJSON(TASKS_FILE);
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found.' });

  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  if (!Array.isArray(user.completedTasks)) user.completedTasks = [];
  if (!user.completedTasks.find(c => c.taskId === task.id)) {
    const xp = mode === 'group' ? task.groupXP : task.soloXP;
    user.completedTasks.push({
      taskId: task.id,
      title: task.title,
      emoji: task.emoji,
      mode,
      xp,
      completedAt: new Date().toISOString(),
    });
    user.xp = (user.xp || 0) + xp;
    writeJSON(USERS_FILE, users);

    // Remove user from group after completion
    task.group = (task.group || []).filter(m => m.userId !== userId);
    writeJSON(TASKS_FILE, tasks);
  }

  const updatedUser = readJSON(USERS_FILE).find(u => u.id === userId);
  return res.json({ success: true, user: updatedUser });
});

// ---- CHAT (BU / DD scripted response banks) ----
const RESPONSE_BANKS = {
  BU: [
    "Hey, I'm really glad you shared that with me. How are you feeling about it?",
    "That sounds like it meant a lot. What do you think made it so special?",
    "I love hearing that. Have you thought about doing something like that again?",
    "You're doing amazing just by showing up. What's been the highlight of your week?",
    "That's really worth holding onto. Is there someone nearby you could share that experience with?",
    "I hear you. Sometimes the smallest moments are the ones that stick with us most.",
    "It sounds like you're growing a lot. What's one thing you want to do more of?",
    "That's beautiful. The Buddy community would love to hear about that — have you thought about posting it?",
    "You deserve to feel good about that. What would make tomorrow even better?",
    "I'm here for you. What's been on your mind lately?",
    "That's such a genuine thing to say. Have you connected with anyone new recently?",
    "It takes courage to put yourself out there. How did it feel afterward?",
  ],
  DD: [
    "OKAY that's actually so good, let's gooo!!",
    "Yesss!! You should totally do that, no overthinking allowed!!",
    "Okay but imagine if you just... did it? Like TODAY?",
    "That energy is EVERYTHING, keep it up bestie!",
    "Omg stop we need to make this a whole thing!!",
    "Why are you not already outside right now?? Go go go!!",
    "Okay I'm obsessed with this, tell me more!!",
    "This is giving main character energy and I am HERE for it!!",
    "Literally drop everything and do that right now, I'm serious!!",
    "You + that activity = perfect match, trust me on this!!",
    "Okay real talk, who are you bringing with you?? You need a buddy!!",
    "The vibes are immaculate, let's make it happen!!",
  ],
};

let buIndex = 0;
let ddIndex = 0;

app.post("/api/chat", (req, res) => {
  const { persona } = req.body;
  if (!persona || !["BU", "DD"].includes(persona))
    return res.status(400).json({ error: "Invalid persona." });

  let reply;
  if (persona === "BU") {
    reply = RESPONSE_BANKS.BU[buIndex % RESPONSE_BANKS.BU.length];
    buIndex++;
  } else {
    reply = RESPONSE_BANKS.DD[ddIndex % RESPONSE_BANKS.DD.length];
    ddIndex++;
  }

  return res.json({ success: true, reply });
});

app.listen(PORT, () => {
  console.log(`
  ██████╗ ██╗   ██╗██████╗ ██████╗ ██╗   ██╗
  Server running → http://localhost:${PORT}
  Users DB       → ${USERS_FILE}
  Posts DB       → ${POSTS_FILE}
  `);
});
