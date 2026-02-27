require('dotenv').config();
const http = require('http');
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');
const https = require('https');
const fs = require('fs');

const User = require('./models/User');
const Message = require('./models/Message');
const Group = require('./models/Group');

const DATA_FILE = './demo_persistence.json';
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.resolve('./public')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error: Running in Demo Mode (In-Memory)'));

// In-memory fallback for Demo Mode
let memUsers = [];
let memGroups = [{ _id: 'manit-lounge', name: '🏢 MANIT Public Lounge', createdBy: 'system', members: [] }];
let memMessages = [];

// Load from file on start
if (fs.existsSync(DATA_FILE)) {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    memUsers = data.users || [];
    memGroups = data.groups || memGroups;
    memMessages = data.messages || [];
    console.log('Demo data loaded from persistence file');
  } catch (e) { console.log('Error loading demo data'); }
}

function saveToDemoFile() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ users: memUsers, groups: memGroups, messages: memMessages }));
  } catch (e) { console.error('Persistence Save Error:', e.message); }
}

// Helper to update memUsers
function syncMemUser(userData) {
  const idx = memUsers.findIndex(u => u.studentId === userData.studentId);
  if (idx > -1) memUsers[idx] = userData;
  else memUsers.push(userData);
  saveToDemoFile();
}

// MANIT ERP Login Proxy
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const response = await axios.post('https://erpapi.manit.ac.in/api/login', {
      username,
      password
    }, { httpsAgent });

    if (response.data && response.data.userInfo) {
      const info = response.data.userInfo;
      const studentData = info.studentInfo[0] || {};

      const userData = {
        studentId: info.uid,
        fullName: studentData.full_name || info.givenName + ' ' + info.sn,
        rollNo: studentData.roll_no || info.uid,
        email: info.mail,
        department: studentData.program_name || info.departmentNumber,
      };

      // Fetch profile photo
      try {
        const photoResp = await axios.get('https://erpapi.manit.ac.in/api/student_profile', {
          headers: { 'Authorization': `Bearer ${response.data.token}` },
          httpsAgent
        });
        if (photoResp.data && photoResp.data.image) {
          // Wrap in proxy to bypass browser SSL/CORS issues
          userData.photoUrl = `/api/proxy-image?url=${encodeURIComponent(photoResp.data.image)}`;
        }
      } catch (photoErr) {
        console.log('Error fetching photo:', photoErr.response ? photoErr.response.data : photoErr.message);
        console.log('Token used:', response.data.token.substring(0, 10) + '...');
      }

      // Sync with MongoDB (if connected) or In-Memory (Fallback)
      let user = userData;
      try {
        const dbUser = await User.findOneAndUpdate(
          { studentId: info.uid },
          userData,
          { upsert: true, new: true, maxTimeMS: 2000 }
        );
        if (dbUser) user = dbUser;
      } catch (dbErr) {
        console.log('Using In-Memory Fallback');
        syncMemUser(userData);
      }

      const localToken = jwt.sign({ studentId: user.studentId }, process.env.JWT_SECRET);

      // Notify all connected clients to refresh their list
      io.emit('update-chat-list');

      res.json({ success: true, token: localToken, user: user });
    } else {
      res.status(401).json({ success: false, message: 'Invalid Credentials' });
    }
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// API Routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().maxTimeMS(2000);
    res.json(users);
  } catch (err) {
    res.json(memUsers); // Fallback
  }
});

app.get('/api/groups', async (req, res) => {
  const userId = req.headers['x-user-id'];
  try {
    let groups;
    try {
      // Find groups where members array contains userId OR it's a public group
      groups = await Group.find({
        $or: [
          { members: userId },
          { _id: 'manit-lounge' }
        ]
      }).maxTimeMS(2000);
    } catch (dbErr) {
      groups = memGroups.filter(g => g._id === 'manit-lounge' || g.members.includes(userId));
    }
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/groups', async (req, res) => {
  try {
    const { name, createdBy, members } = req.body;
    // Ensure creator is always a member
    const groupMembers = Array.from(new Set([createdBy, ...(members || [])]));
    const groupData = {
      _id: Date.now().toString(),
      name,
      createdBy,
      members: groupMembers
    };
    try {
      const dbGroup = new Group(groupData);
      await dbGroup.save();
      io.emit('update-chat-list');
      res.json(dbGroup);
    } catch (dbErr) {
      memGroups.push(groupData);
      saveToDemoFile();
      io.emit('update-chat-list');
      res.json(groupData);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/messages/:chatId', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const chatId = req.params.chatId;

  // Membership check for groups
  if (!chatId.includes('--') && chatId !== 'manit-lounge') {
    const group = memGroups.find(g => g._id === chatId);
    // Note: If DB is connected, we should check there too, but memGroups is a reliable mirror in demo mode
    if (group && !group.members.includes(userId)) {
      return res.status(403).json({ error: 'Not a member' });
    }
  }

  try {
    const messages = await Message.find({ chatId }).sort({ createdAt: 1 }).maxTimeMS(2000);
    res.json(messages);
  } catch (err) {
    const filtered = memMessages.filter(m => m.chatId === chatId);
    res.json(filtered);
  }
});

// Image Proxy to solve SSL/CORS issues
app.get('/api/proxy-image', async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).send('No URL provided');

  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      httpsAgent
    });
    const contentType = response.headers['content-type'] || 'image/jpeg';
    res.set('Content-Type', contentType);
    res.send(response.data);
  } catch (error) {
    console.error('Proxy Error:', error.message);
    res.status(500).send('Error proxying image');
  }
});

// Socket.io
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('register-user', (userData) => {
    syncMemUser(userData);
    console.log('User registered in memory:', userData.fullName);
    io.emit('update-chat-list');
  });

  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
    console.log(`User joined room: ${chatId}`);
  });

  socket.on('send-message', async (data) => {
    const { chatId, sender, senderName, content } = data;

    // Check membership for group chats (Except public lounge and private chats)
    if (chatId.includes('--')) {
      // Private chat, allow
    } else if (chatId !== 'manit-lounge') {
      const isMem = memGroups.find(g => g._id === chatId && g.members.includes(sender));
      if (!isMem) {
        // Double check DB
        try {
          const dbGroup = await Group.findOne({ _id: chatId, members: sender }).maxTimeMS(1000);
          if (!dbGroup) return; // Not a member
        } catch (e) {
          if (!isMem) return;
        }
      }
    }

    const msgData = { chatId, sender, senderName, content, createdAt: new Date() };
    try {
      const msg = new Message(msgData);
      await msg.save();
    } catch (dbErr) {
      memMessages.push(msgData);
      saveToDemoFile();
    }
    io.to(chatId).emit('receive-message', msgData);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.resolve('./public/index.html'));
});

const PORT = process.env.PORT || 9000;
server.listen(PORT, () => console.log(`Server started at Port: ${PORT}`));