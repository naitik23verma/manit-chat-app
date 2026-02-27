const socket = io();

// State
let currentUser = null;
let activeChatId = null;
let currentGroups = [];
let currentUsers = [];

// DOM Elements
const loginPage = document.getElementById('login-page');
const chatPage = document.getElementById('chat-page');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const chatList = document.getElementById('chat-list');
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendMsgBtn = document.getElementById('send-msg-btn');
const newGroupBtn = document.getElementById('new-group-btn');
const groupModal = document.getElementById('group-modal');
const confirmGroupBtn = document.getElementById('confirm-group');
const cancelGroupBtn = document.getElementById('cancel-group');
const groupNameInput = document.getElementById('group-name-input');
const userAvatar = document.getElementById('user-avatar');
const avatarPlaceholder = document.getElementById('avatar-placeholder');
const activeChatName = document.getElementById('active-chat-name');
const chatHeader = document.getElementById('chat-header');
const inputArea = document.getElementById('input-area');
const memberSelector = document.getElementById('member-selector');
const mobileBackBtn = document.getElementById('mobile-back-btn');
const messageError = document.createElement('div');
messageError.style.color = 'var(--whatsapp-green)';
messageError.style.fontSize = '0.8em';
messageError.style.padding = '10px';
messageError.style.textAlign = 'center';
messageError.style.display = 'none';
inputArea.parentNode.insertBefore(messageError, inputArea);

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showChatPage();
    }

    // Toggle mobile view when back button is clicked
    if (mobileBackBtn) {
        mobileBackBtn.addEventListener('click', () => {
            document.body.classList.remove('mobile-chat-active');
        });
    }
});

const logoutBtn = document.getElementById('logout-btn');

// Login Logic
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    location.reload();
});

loginBtn.addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) return;

    loginBtn.innerText = 'Logging in...';
    loginBtn.disabled = true;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('user', JSON.stringify(currentUser));
            localStorage.setItem('token', data.token);
            showChatPage();
        } else {
            loginError.innerText = data.message || 'Invalid credentials';
            loginError.style.display = 'block';
        }
    } catch (err) {
        loginError.innerText = 'Connection error. Try again.';
        loginError.style.display = 'block';
    } finally {
        loginBtn.innerText = 'Log In';
        loginBtn.disabled = false;
    }
});

function showChatPage() {
    loginPage.style.display = 'none';
    chatPage.style.display = 'flex';

    // Set User Profile
    if (currentUser.photoUrl) {
        userAvatar.src = currentUser.photoUrl;
        userAvatar.style.display = 'block';
        avatarPlaceholder.style.display = 'none';
    } else {
        userAvatar.style.display = 'none';
        avatarPlaceholder.style.display = 'flex';
    }

    // Register user with server memory (for discovery)
    socket.emit('register-user', currentUser);

    // In case of server restart, re-register on reconnect
    socket.on('connect', () => {
        socket.emit('register-user', currentUser);
    });

    loadChats();
}

// Group Logic
newGroupBtn.addEventListener('click', () => {
    memberSelector.innerHTML = '';
    currentUsers.filter(u => u.studentId !== currentUser.studentId).forEach(user => {
        const div = document.createElement('div');
        div.style.padding = '5px 0';
        div.innerHTML = `
            <label style="display: flex; align-items: center; cursor: pointer;">
                <input type="checkbox" value="${user.studentId}" style="margin-right: 10px;">
                <span>${user.fullName}</span>
            </label>
        `;
        memberSelector.appendChild(div);
    });
    groupModal.style.display = 'flex';
});

cancelGroupBtn.addEventListener('click', () => {
    groupModal.style.display = 'none';
});

confirmGroupBtn.addEventListener('click', async () => {
    const name = groupNameInput.value;
    if (!name) return;

    const selectedMembers = Array.from(memberSelector.querySelectorAll('input:checked')).map(cb => cb.value);

    try {
        const response = await fetch('/api/groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                createdBy: currentUser.studentId,
                members: selectedMembers
            })
        });
        const group = await response.json();
        groupModal.style.display = 'none';
        groupNameInput.value = '';
        loadChats(); // Refresh list
    } catch (err) {
        console.error('Group creation error:', err);
    }
});

// Fetching Chats (Users + Groups)
async function loadChats() {
    try {
        const [groupsRes, usersRes] = await Promise.all([
            fetch('/api/groups', { headers: { 'x-user-id': currentUser.studentId } }),
            fetch('/api/users')
        ]);

        currentGroups = await groupsRes.json();
        currentUsers = await usersRes.json();

        // Update current user info if needed (for DP sync)
        const updatedSelf = currentUsers.find(u => u.studentId === currentUser.studentId);
        if (updatedSelf && updatedSelf.photoUrl && currentUser.photoUrl !== updatedSelf.photoUrl) {
            currentUser.photoUrl = updatedSelf.photoUrl;
            localStorage.setItem('user', JSON.stringify(currentUser));
            userAvatar.src = currentUser.photoUrl;
            userAvatar.style.display = 'block';
            avatarPlaceholder.style.display = 'none';
        }

        renderChatList(currentGroups, currentUsers);
    } catch (err) {
        console.error('Error fetching chats:', err);
    }
}

function renderChatList(groups, users) {
    chatList.innerHTML = '';

    // Render Groups
    groups.forEach(chat => {
        const div = document.createElement('div');
        div.className = `chat-item ${activeChatId === chat._id ? 'active' : ''}`;
        div.innerHTML = `
            <div class="avatar" style="display:flex; justify-content:center; align-items:center; background:#202c33; margin-right:12px;">
                <i class="fas fa-users" style="color:#8696a0;"></i>
            </div>
            <div class="chat-info">
                <div class="chat-header">
                    <span class="chat-name">${chat.name}</span>
                </div>
                <div class="last-msg">Group Chat</div>
            </div>
        `;
        div.onclick = () => selectChat(chat, true);
        chatList.appendChild(div);
    });

    // Render Users
    users.filter(u => u.studentId !== currentUser.studentId).forEach(user => {
        const div = document.createElement('div');
        const chatId = [currentUser.studentId, user.studentId].sort().join('--');
        div.className = `chat-item ${activeChatId === chatId ? 'active' : ''}`;
        div.innerHTML = `
            <div class="user-profile" style="margin-right:12px;">
                ${user.photoUrl ? `<img src="${user.photoUrl}" class="avatar">` : `
                <div class="avatar" style="display:flex; justify-content:center; align-items:center; background:#6a7175;">
                    <i class="fas fa-user" style="color:white;"></i>
                </div>`}
            </div>
            <div class="chat-info">
                <div class="chat-header">
                    <span class="chat-name">${user.fullName}</span>
                </div>
                <div class="last-msg">${user.department || 'Student'}</div>
            </div>
        `;
        div.onclick = () => selectChat({ _id: chatId, name: user.fullName }, false);
        chatList.appendChild(div);
    });
}

// Messaging Logic
async function selectChat(chat, isGroup) {
    activeChatId = chat._id;
    renderChatList(currentGroups, currentUsers);

    // Switch to chat view on mobile
    document.body.classList.add('mobile-chat-active');

    chatHeader.style.display = 'flex';
    activeChatName.innerText = chat.name;

    // Check membership for group chats
    const isMember = !isGroup || chat._id === 'manit-lounge' || chat.members.includes(currentUser.studentId);

    if (isMember) {
        inputArea.style.display = 'flex';
        messageError.style.display = 'none';
    } else {
        inputArea.style.display = 'none';
        messageError.innerText = "Only members can send messages in this group.";
        messageError.style.display = 'block';
    }

    // Join Socket Room
    socket.emit('join-chat', activeChatId);

    // Load history
    try {
        const response = await fetch(`/api/messages/${activeChatId}`, {
            headers: { 'x-user-id': currentUser.studentId }
        });
        const messages = await response.json();
        messagesContainer.innerHTML = '';
        messages.forEach(msg => appendMessage(msg));
        scrollToBottom();
    } catch (err) {
        console.error('Error loading history:', err);
    }
}

function appendMessage(msg) {
    const isOutgoing = msg.sender === currentUser.studentId;
    const div = document.createElement('div');
    div.className = `message ${isOutgoing ? 'outgoing' : 'incoming'}`;

    div.innerHTML = `
        ${!isOutgoing ? `<div class="msg-sender">${msg.senderName || msg.sender}</div>` : ''}
        <div class="msg-content">${msg.content}</div>
        <div style="font-size: 0.7em; color: var(--text-secondary); text-align: right; margin-top: 4px;">
            ${new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
    `;

    messagesContainer.appendChild(div);
    scrollToBottom();
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

sendMsgBtn.onclick = sendMessage;
messageInput.onkeypress = (e) => {
    if (e.key === 'Enter') sendMessage();
};

function sendMessage() {
    const content = messageInput.value.trim();
    if (!content || !activeChatId) return;

    const data = {
        chatId: activeChatId,
        sender: currentUser.studentId,
        senderName: currentUser.fullName,
        content: content
    };

    socket.emit('send-message', data);
    messageInput.value = '';
}

// Real-time listener
socket.on('receive-message', (msg) => {
    if (msg.chatId === activeChatId) {
        appendMessage(msg);
    } else {
        // Refresh sidebar for background messages to update last-msg or visibility
        loadChats();
    }
});

socket.on('update-chat-list', () => {
    loadChats();
});
