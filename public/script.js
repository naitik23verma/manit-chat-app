// detect if we need to point to a production backend (Render)
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? ''
    : 'https://manit-chat-app.onrender.com'; // Production URL fallback

const socket = io(API_BASE);

// State
let currentUser = null;
let activeChatId = null;
let currentGroups = [];
let currentUsers = [];
let communityPosts = [];
let userFollowing = [];
let activeCommunityTab = 'global';

// DOM Elements
const loginPage = document.getElementById('login-page');
const chatPage = document.getElementById('chat-page');
const chatBackBtn = document.getElementById('chat-back-btn');
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

const landingPage = document.getElementById('landing-page');
const getStartedBtn = document.getElementById('get-started-btn');
const backToLandingBtn = document.getElementById('back-to-landing-btn');
const navLoginBtn = document.getElementById('nav-login-btn');
const navUserContainer = document.getElementById('nav-user-container');
const navUserBtn = document.getElementById('nav-user-btn');
const navLogoutMenu = document.getElementById('nav-logout-menu');
const navLogoutExecBtn = document.getElementById('nav-logout-exec-btn');
const chatSearchInput = document.getElementById('chat-search-input');

// Community Elements
const communityPage = document.getElementById('community-page');
const communityFeed = document.getElementById('community-feed');
const communityBackBtn = document.getElementById('community-back-btn');
const mobileCommunityBackBtn = document.getElementById('mobile-community-back-btn');
const commSidebarToggle = document.getElementById('comm-sidebar-toggle');
const commSidebarClose = document.getElementById('comm-sidebar-close');
const communitySidebar = document.getElementById('community-sidebar');
const joinCommunityBtn = document.getElementById('join-community-btn');
const submitPostBtn = document.getElementById('submit-post-btn');
const postContent = document.getElementById('post-content');
const postCode = document.getElementById('post-code');
const postGithub = document.getElementById('post-github');
const postDeploy = document.getElementById('post-deploy');
const codeInputArea = document.getElementById('code-input-area');
const toggleCodeBtn = document.getElementById('toggle-code-btn');
const suggestedUsers = document.getElementById('suggested-users');
const commNavItems = document.querySelectorAll('.comm-nav-item');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    }
    
    updateTopNavUI();
    initLandingAnimations();
    handleHashChange();

    // Toggle mobile view when back button is clicked
    if (mobileBackBtn) {
        mobileBackBtn.addEventListener('click', () => {
            document.body.classList.remove('mobile-chat-active');
        });
    }
});

function updateTopNavUI() {
    if (currentUser) {
        navLoginBtn.style.display = 'none';
        navUserContainer.style.display = 'block';
        navUserBtn.innerHTML = `${currentUser.fullName.split(' ')[0]}`;
    } else {
        navLoginBtn.style.display = 'block';
        navUserContainer.style.display = 'none';
    }
}

if (navUserBtn) {
    navUserBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = navLogoutMenu.style.display === 'block';
        navLogoutMenu.style.display = isOpen ? 'none' : 'block';
    });
}

if (navLogoutExecBtn) {
    navLogoutExecBtn.addEventListener('click', () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.hash = '';
        location.reload();
    });
}

// Close menu on click outside
document.addEventListener('click', () => {
    if (navLogoutMenu) navLogoutMenu.style.display = 'none';
});

// History API Routing
window.addEventListener('hashchange', handleHashChange);

function handleHashChange() {
    const isUserLoggedIn = !!localStorage.getItem('user');
    
    // Hide all main views initially
    landingPage.style.display = 'none';
    loginPage.style.display = 'none';
    chatPage.style.display = 'none';
    communityPage.style.display = 'none';

    if (window.location.hash === '#login') {
        if (isUserLoggedIn) { window.location.hash = ''; return; }
        loginPage.style.display = 'flex';
        gsap.fromTo(".login-card", {opacity: 0, y: 30, scale: 0.9}, {opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.5)"});
    } 
    else if (window.location.hash === '#chat') {
        if (!isUserLoggedIn) { window.location.hash = '#login'; return; }
        showChatPage();
    }
    else if (window.location.hash === '#community') {
        if (!isUserLoggedIn) { window.location.hash = '#login'; return; }
        showCommunityPage();
    }
    else {
        // Landing View (Home)
        landingPage.style.display = 'flex';
        // (Animations already triggered by initLandingAnimations if it's the first visit)
    }
}

function initLandingAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    gsap.to(".landing-text", { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.2 });
    gsap.to(".landing-animation", { opacity: 1, duration: 1, ease: "power3.out", delay: 0.5 });
    
    gsap.to(".blob-1", {
        x: "random(-50, 50)",
        y: "random(-50, 50)",
        duration: 5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
    });
    gsap.to(".blob-2", {
        x: "random(-50, 50)",
        y: "random(-50, 50)",
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
    });

    // Animate feature cards on scroll
    gsap.to(".feature-card", {
        scrollTrigger: {
            trigger: ".features-section",
            scroller: "#landing-page", // The scrollable container
            start: "top 80%",
        },
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.2,
        ease: "power2.out"
    });

    lottie.loadAnimation({
        container: document.getElementById('lottie-container'),
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'https://assets2.lottiefiles.com/packages/lf20_puciaact.json' 
    });
}

if (getStartedBtn) {
    getStartedBtn.addEventListener('click', () => {
        if (localStorage.getItem('user')) {
            window.location.hash = 'chat';
        } else {
            window.location.hash = 'login';
        }
    });
}

if (navLoginBtn) {
    navLoginBtn.addEventListener('click', () => {
        if (!localStorage.getItem('user')) {
            window.location.hash = 'login';
        }
    });
}

if (backToLandingBtn) {
    backToLandingBtn.addEventListener('click', () => {
        window.location.hash = ''; // Clear hash triggers handleHashChange
    });
}

const logoutBtn = document.getElementById('logout-btn');

// Login Logic
// Logic for Chat "Back" button
if (chatBackBtn) {
    chatBackBtn.addEventListener('click', () => {
        window.location.hash = ''; // Return to landing
    });
}

loginBtn.addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) return;

    loginBtn.innerText = 'Logging in...';
    loginBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('user', JSON.stringify(currentUser));
            localStorage.setItem('token', data.token);
            
            updateTopNavUI();
            
            // Redirect based on previous intent or to chat by default
            window.location.hash = 'chat';
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
    landingPage.style.display = 'none';
    loginPage.style.display = 'none';
    communityPage.style.display = 'none';
    chatPage.style.display = 'flex';
    gsap.fromTo("#chat-page", {opacity: 0}, {opacity: 1, duration: 0.5, ease: "power2.out"});

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
        const response = await fetch(`${API_BASE}/api/groups`, {
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
            fetch(`${API_BASE}/api/groups`, { headers: { 'x-user-id': currentUser.studentId } }),
            fetch(`${API_BASE}/api/users`)
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

// Search Logic
if (chatSearchInput) {
    chatSearchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        
        let filteredGroups = currentGroups;
        let filteredUsers = currentUsers;

        if (term) {
            filteredGroups = currentGroups.filter(g => g.name.toLowerCase().includes(term));
            filteredUsers = currentUsers.filter(u => u.fullName.toLowerCase().includes(term));
            
            // Name Ranker
            const rank = (name) => {
               let lower = name.toLowerCase();
               if (lower.startsWith(term)) return -1;
               return 0;
            };
            
            filteredGroups.sort((a,b) => rank(a.name) - rank(b.name));
            filteredUsers.sort((a,b) => rank(a.fullName) - rank(b.fullName));
        }

        renderChatList(filteredGroups, filteredUsers);
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
        const response = await fetch(`${API_BASE}/api/messages/${activeChatId}`, {
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

// --- Coding Community Implementation ---

if (joinCommunityBtn) {
    joinCommunityBtn.addEventListener('click', () => {
        window.location.hash = 'community';
    });
}

if (chatBackBtn) {
    chatBackBtn.addEventListener('click', () => {
        window.location.hash = ''; // Return to landing
    });
}

if (communityBackBtn) {
    communityBackBtn.addEventListener('click', () => {
        window.location.hash = '';
    });
}

async function showCommunityPage() {
    communityPage.style.display = 'flex';
    const compAvatar = document.getElementById('composer-avatar');
    
    if (currentUser && currentUser.photoUrl) {
        compAvatar.src = currentUser.photoUrl;
        compAvatar.style.display = 'block';
    } else {
        compAvatar.style.display = 'none';
        if (!compAvatar.parentElement.querySelector('.avatar-placeholder')) {
            const ph = document.createElement('div');
            ph.className = 'avatar-placeholder';
            ph.innerHTML = '<i class="fas fa-user"></i>';
            compAvatar.parentElement.prepend(ph);
        }
    }
    
    // Initial Load
    await Promise.all([
        loadFollowingStatus(),
        loadCommunityFeed(),
        loadSuggestedUsers()
    ]);
}

async function loadFollowingStatus() {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_BASE}/api/community/following/${currentUser.studentId}`);
        userFollowing = await res.json();
    } catch (e) {}
}

async function loadCommunityFeed() {
    communityFeed.innerHTML = '<div class="loader">Loading feed...</div>';
    try {
        const res = await fetch(`${API_BASE}/api/community/posts`);
        communityPosts = await res.json();
        renderFeed();
    } catch (e) {
        communityFeed.innerHTML = 'Error loading posts.';
    }
}

function renderFeed() {
    communityFeed.innerHTML = '';
    let filtered = communityPosts;
    
    if (activeCommunityTab === 'following') {
        filtered = communityPosts.filter(p => userFollowing.includes(p.authorId) || p.authorId === currentUser.studentId);
    }

    if (filtered.length === 0) {
        communityFeed.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-secondary);">No posts yet. Be the first!</div>`;
        return;
    }

    filtered.forEach(post => {
        const div = document.createElement('div');
        div.className = 'post-card';
        const isLiked = post.likes.includes(currentUser.studentId);
        const isFollowing = userFollowing.includes(post.authorId);

        div.innerHTML = `
            <div class="post-header">
                <div class="post-author">
                    <div class="avatar-container">
                        ${post.authorPhoto ? `<img src="${post.authorPhoto}" class="avatar-small" onerror="this.parentElement.innerHTML='<div class=\'avatar-placeholder\'><i class=\'fas fa-user\'></i></div>'">` : `<div class="avatar-placeholder"><i class="fas fa-user"></i></div>`}
                    </div>
                    <div>
                        <div style="font-weight:600;">${post.authorName}</div>
                        <div style="font-size:0.8em; color:var(--text-secondary);">${new Date(post.createdAt).toLocaleDateString()}</div>
                    </div>
                </div>
                ${post.authorId !== currentUser.studentId ? `
                    <button class="btn-follow ${isFollowing ? 'following' : ''}" onclick="toggleFollow('${post.authorId}')">
                        ${isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                ` : ''}
            </div>
            <div class="post-content">${post.content}</div>
            
            ${(post.githubLink || post.deploymentLink) ? `
                <div class="post-links">
                    ${post.githubLink ? `<a href="${post.githubLink}" target="_blank" class="post-link-btn github"><i class="fab fa-github"></i> GitHub Repo</a>` : ''}
                    ${post.deploymentLink ? `<a href="${post.deploymentLink}" target="_blank" class="post-link-btn deploy"><i class="fas fa-external-link-alt"></i> Live Demo</a>` : ''}
                </div>
            ` : ''}

            ${post.codeSnippet ? `
                <div class="code-block">
                    <div style="position:absolute; right:10px; top:10px; font-size:0.7em; color:#8696a0; text-transform:uppercase;">${post.language}</div>
                    <pre><code>${post.codeSnippet.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>
                </div>
            ` : ''}
            <div class="post-actions">
                <button class="action-btn ${isLiked ? 'active' : ''}" onclick="toggleLike('${post._id}')">
                    <i class="${isLiked ? 'fas' : 'far'} fa-thumbs-up"></i> ${post.likes.length}
                </button>
            </div>
        `;
        communityFeed.appendChild(div);
    });
}

// Composer Logic
if (toggleCodeBtn) {
    toggleCodeBtn.addEventListener('click', () => {
        const isVisible = codeInputArea.style.display !== 'none';
        codeInputArea.style.display = isVisible ? 'none' : 'block';
        toggleCodeBtn.innerHTML = isVisible ? '<i class="fas fa-code"></i> Add Code' : '<i class="fas fa-times"></i> Hide Code';
    });
}

if (submitPostBtn) {
    submitPostBtn.addEventListener('click', async () => {
        const content = postContent.value.trim();
        const code = postCode.value.trim();
        const github = postGithub.value.trim();
        const deploy = postDeploy.value.trim();

        if (!content) {
            alert("Text content is required!");
            return;
        }

        submitPostBtn.disabled = true;
        submitPostBtn.innerText = 'Posting...';

        try {
            const res = await fetch(`${API_BASE}/api/community/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    authorId: currentUser.studentId,
                    authorName: currentUser.fullName,
                    authorPhoto: currentUser.photoUrl,
                    content,
                    codeSnippet: code || null,
                    language: document.getElementById('code-lang').value,
                    githubLink: github || null,
                    deploymentLink: deploy || null
                })
            });
            
            if (res.ok) {
                // To maintain ranking, we re-fetch the feed after posting
                await loadCommunityFeed();
                
                // Clear inputs
                postContent.value = '';
                postCode.value = '';
                postGithub.value = '';
                postDeploy.value = '';
                codeInputArea.style.display = 'none';
                toggleCodeBtn.innerHTML = '<i class="fas fa-code"></i> Add Code';
            } else {
                alert("Failed to post. Please try again.");
            }
        } catch (e) {
            console.error(e);
            alert("Connection error.");
        } finally {
            submitPostBtn.disabled = false;
            submitPostBtn.innerText = 'Post';
        }
    });
}

async function toggleLike(postId) {
    try {
        const res = await fetch(`${API_BASE}/api/community/posts/${postId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.studentId })
        });
        const data = await res.json();
        const post = communityPosts.find(p => p._id === postId);
        if (post) {
            post.likes = data.likes;
            renderFeed();
        }
    } catch (e) {}
}

async function toggleFollow(targetId) {
    const isFollowing = userFollowing.includes(targetId);
    const api = isFollowing ? 'unfollow' : 'follow';
    try {
        await fetch(`${API_BASE}/api/community/${api}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ followerId: currentUser.studentId, followingId: targetId })
        });
        if (isFollowing) userFollowing = userFollowing.filter(id => id !== targetId);
        else userFollowing.push(targetId);
        renderFeed();
        loadSuggestedUsers();
    } catch (e) {}
}

async function loadSuggestedUsers() {
    suggestedUsers.innerHTML = '';
    const nonFollowed = currentUsers.filter(u => u.studentId !== currentUser.studentId && !userFollowing.includes(u.studentId)).slice(0, 5);
    
    if (nonFollowed.length === 0) {
        suggestedUsers.innerHTML = '<div style="font-size:0.8em; color:var(--text-secondary);">No more suggestions.</div>';
        return;
    }

    nonFollowed.forEach(user => {
        const div = document.createElement('div');
        div.className = 'suggested-user';
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
                <div class="avatar-container">
                    ${user.photoUrl ? `<img src="${user.photoUrl}" class="avatar-small" onerror="this.parentElement.innerHTML='<div class=\'avatar-placeholder\'><i class=\'fas fa-user\'></i></div>'">` : `<div class="avatar-placeholder"><i class="fas fa-user"></i></div>`}
                </div>
                <span style="font-size:0.9em;">${user.fullName}</span>
            </div>
            <button class="btn-follow" onclick="toggleFollow('${user.studentId}')">Follow</button>
        `;
        suggestedUsers.appendChild(div);
    });
}

// Community Mobile Sidebar Toggle
if (commSidebarToggle) {
    commSidebarToggle.addEventListener('click', () => {
        communitySidebar.classList.add('active');
    });
}

if (commSidebarClose) {
    commSidebarClose.addEventListener('click', () => {
        communitySidebar.classList.remove('active');
    });
}

if (mobileCommunityBackBtn) {
    mobileCommunityBackBtn.addEventListener('click', () => {
        window.location.hash = '';
    });
}

// Tab Switching
commNavItems.forEach(btn => {
    btn.addEventListener('click', () => {
        commNavItems.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCommunityTab = btn.getAttribute('data-tab');
        
        // Auto-close sidebar on mobile after selection
        if (window.innerWidth <= 768) {
            communitySidebar.classList.remove('active');
        }
        
        renderFeed();
    });
});
