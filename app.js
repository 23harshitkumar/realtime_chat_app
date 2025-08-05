// ChatFlow Application - JavaScript with SPA Routing (Completely Fixed)
class ChatApp {
    constructor() {
        this.currentUser = null;
        this.currentRoom = null;
        this.rooms = [];
        this.messages = [];
        this.users = [];
        this.typingUsers = new Set();
        this.socketSimulation = null;
        this.currentPage = 'auth';
        this.initialized = false;
        
        console.log('ChatApp initializing...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        if (this.initialized) return;
        this.initialized = true;
        
        console.log('Starting app initialization...');
        this.initializeData();
        this.checkAuthentication();
        this.setupEventListeners();
        this.setupRouting();
        console.log('App initialization complete');
    }

    // Initialize sample data
    initializeData() {
        console.log('Initializing data...');
        
        this.users = [
            {"id": "1", "username": "john_doe", "email": "john@example.com", "avatar": "JD"},
            {"id": "2", "username": "jane_smith", "email": "jane@example.com", "avatar": "JS"},
            {"id": "3", "username": "mike_wilson", "email": "mike@example.com", "avatar": "MW"},
            {"id": "4", "username": "sarah_jones", "email": "sarah@example.com", "avatar": "SJ"}
        ];

        this.rooms = [
            {
                "id": "room_1", 
                "name": "General Discussion", 
                "participants": ["1", "2", "3"], 
                "createdBy": "1",
                "createdAt": "2025-01-15T10:00:00Z",
                "link": "/room/room_1",
                "lastActivity": "2025-01-15T12:30:00Z",
                "messageCount": 15
            },
            {
                "id": "room_2", 
                "name": "Project Planning", 
                "participants": ["1", "4"], 
                "createdBy": "4",
                "createdAt": "2025-01-15T14:30:00Z",
                "link": "/room/room_2",
                "lastActivity": "2025-01-15T15:45:00Z",
                "messageCount": 8
            },
            {
                "id": "room_3", 
                "name": "Team Chat", 
                "participants": ["2", "3", "4"], 
                "createdBy": "2",
                "createdAt": "2025-01-15T16:45:00Z",
                "link": "/room/room_3",
                "lastActivity": "2025-01-15T17:20:00Z",
                "messageCount": 23
            }
        ];

        this.messages = [
            {
                "id": "msg_1",
                "roomId": "room_1",
                "userId": "1",
                "username": "john_doe",
                "text": "Hey everyone! Welcome to the general discussion room.",
                "timestamp": "2025-01-15T10:05:00Z",
                "status": "delivered"
            },
            {
                "id": "msg_2",
                "roomId": "room_1",
                "userId": "2",
                "username": "jane_smith",
                "text": "Thanks for creating this room! This will be great for team communication.",
                "timestamp": "2025-01-15T10:07:00Z",
                "status": "delivered"
            },
            {
                "id": "msg_3",
                "roomId": "room_1",
                "userId": "3",
                "username": "mike_wilson",
                "text": "Agreed! Looking forward to collaborating here.",
                "timestamp": "2025-01-15T10:10:00Z",
                "status": "delivered"
            },
            {
                "id": "msg_4",
                "roomId": "room_2",
                "userId": "4",
                "username": "sarah_jones",
                "text": "Let's discuss the upcoming project milestones here.",
                "timestamp": "2025-01-15T14:35:00Z",
                "status": "delivered"
            },
            {
                "id": "msg_5",
                "roomId": "room_2",
                "userId": "1",
                "username": "john_doe",
                "text": "Sounds good! I have some ideas to share.",
                "timestamp": "2025-01-15T14:40:00Z",
                "status": "delivered"
            }
        ];

        console.log('Data initialized with', this.users.length, 'users and', this.rooms.length, 'rooms');
    }

    // Setup event listeners with improved error handling
    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Auth tabs - using event delegation for reliability
        document.addEventListener('click', (e) => {
            if (e.target.id === 'login-tab') {
                e.preventDefault();
                console.log('Login tab clicked via delegation');
                this.switchAuthTab('login');
            } else if (e.target.id === 'register-tab') {
                e.preventDefault();
                console.log('Register tab clicked via delegation');
                this.switchAuthTab('register');
            } else if (e.target.id === 'logout-btn') {
                e.preventDefault();
                this.handleLogout();
            } else if (e.target.id === 'create-room-btn') {
                e.preventDefault();
                this.showCreateRoomModal();
            } else if (e.target.id === 'back-to-dashboard') {
                e.preventDefault();
                this.navigateToDashboard();
            } else if (e.target.id === 'send-btn') {
                e.preventDefault();
                this.sendMessage();
            } else if (e.target.id === 'copy-link-btn') {
                e.preventDefault();
                this.copyRoomLink();
            } else if (e.target.id === 'close-modal') {
                e.preventDefault();
                this.hideCreateRoomModal();
            } else if (e.target.id === 'cancel-room') {
                e.preventDefault();
                this.hideCreateRoomModal();
            } else if (e.target.classList.contains('room-card')) {
                const roomId = e.target.getAttribute('data-room-id');
                if (roomId) {
                    this.joinRoom(roomId);
                }
            }
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'login-form') {
                e.preventDefault();
                console.log('Login form submitted via delegation');
                this.handleLogin();
            } else if (e.target.id === 'register-form') {
                e.preventDefault();
                console.log('Register form submitted via delegation');
                this.handleRegister();
            } else if (e.target.id === 'create-room-form') {
                e.preventDefault();
                this.handleCreateRoom();
            }
        });

        // Message input
        document.addEventListener('keypress', (e) => {
            if (e.target.id === 'message-input' && e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            } else if (e.target.id === 'message-input') {
                this.handleTyping();
            }
        });

        // Modal backdrop clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop') || e.target.id === 'create-room-modal') {
                this.hideCreateRoomModal();
            }
        });
        
        console.log('Event listeners set up successfully using delegation');
    }

    // Setup routing system
    setupRouting() {
        console.log('Setting up routing...');
        
        // Handle browser navigation
        window.addEventListener('popstate', () => {
            this.handleRouteChange();
        });
        
        // Handle initial route
        this.handleRouteChange();
    }

    // Handle route changes
    handleRouteChange() {
        const hash = window.location.hash;
        console.log('Route change:', hash);
        
        if (hash.startsWith('#chat/')) {
            const roomId = hash.replace('#chat/', '');
            if (this.currentUser) {
                this.navigateToChat(roomId);
            } else {
                this.navigateToAuth();
            }
        } else if (hash === '#dashboard') {
            if (this.currentUser) {
                this.navigateToPage('dashboard');
            } else {
                this.navigateToAuth();
            }
        } else if (hash === '#login' || hash === '#register') {
            this.navigateToAuth();
        } else {
            // Default route based on auth status
            if (this.currentUser) {
                this.navigateToPage('dashboard');
            } else {
                this.navigateToAuth();
            }
        }
    }

    // Navigate to a specific page
    navigateToPage(pageName, updateUrl = true) {
        console.log('Navigating to page:', pageName);
        
        if (this.currentPage === pageName) {
            console.log('Already on page:', pageName);
            return;
        }

        // Hide all pages first
        const allPages = document.querySelectorAll('.page');
        allPages.forEach(page => {
            page.classList.remove('active');
        });

        const targetPageEl = document.getElementById(`${pageName}-page`);
        if (!targetPageEl) {
            console.error('Target page not found:', pageName);
            return;
        }

        // Update URL
        if (updateUrl) {
            const urlMap = {
                'auth': '#login',
                'dashboard': '#dashboard',
                'chat': `#chat/${this.currentRoom ? this.currentRoom.id : ''}`
            };
            
            if (urlMap[pageName]) {
                window.history.pushState(null, null, urlMap[pageName]);
            }
        }

        // Show target page with transition
        setTimeout(() => {
            targetPageEl.classList.add('active');
            this.currentPage = pageName;
            
            // Page-specific initialization
            this.onPageEnter(pageName);
        }, 50);
    }

    // Handle page enter events
    onPageEnter(pageName) {
        console.log('Entered page:', pageName);
        
        switch (pageName) {
            case 'auth':
                setTimeout(() => {
                    const emailInput = document.getElementById('login-email');
                    if (emailInput) emailInput.focus();
                }, 200);
                break;
                
            case 'dashboard':
                this.updateUserInfo();
                this.renderRooms();
                break;
                
            case 'chat':
                this.updateChatHeader();
                this.renderParticipants();
                this.renderMessages();
                this.startSocketSimulation();
                setTimeout(() => {
                    const messageInput = document.getElementById('message-input');
                    if (messageInput) messageInput.focus();
                }, 200);
                break;
        }
    }

    // Navigate to auth page
    navigateToAuth() {
        this.navigateToPage('auth');
    }

    // Navigate to dashboard
    navigateToDashboard() {
        this.navigateToPage('dashboard');
    }

    // Navigate to chat
    navigateToChat(roomId) {
        const room = this.rooms.find(r => r.id === roomId);
        if (!room) {
            console.error('Room not found:', roomId);
            this.navigateToDashboard();
            return;
        }

        if (!room.participants.includes(this.currentUser.id)) {
            room.participants.push(this.currentUser.id);
        }

        this.currentRoom = room;
        this.navigateToPage('chat');
    }

    // Check authentication status
    checkAuthentication() {
        console.log('Checking authentication...');
        // For demo purposes, don't auto-login
        this.currentUser = null;
        console.log('Starting with no authentication');
    }

    // Switch auth tabs - Completely fixed
    switchAuthTab(tab) {
        console.log('Switching to', tab, 'tab');
        
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        if (!loginTab || !registerTab || !loginForm || !registerForm) {
            console.error('Auth tab elements not found');
            return;
        }

        // Remove active class from both tabs
        loginTab.classList.remove('active');
        registerTab.classList.remove('active');
        
        // Hide both forms
        loginForm.classList.add('hidden');
        registerForm.classList.add('hidden');

        if (tab === 'login') {
            loginTab.classList.add('active');
            loginForm.classList.remove('hidden');
            window.history.replaceState(null, null, '#login');
            
            setTimeout(() => {
                const emailInput = document.getElementById('login-email');
                if (emailInput) emailInput.focus();
            }, 100);
        } else if (tab === 'register') {
            registerTab.classList.add('active');
            registerForm.classList.remove('hidden');
            window.history.replaceState(null, null, '#register');
            
            setTimeout(() => {
                const usernameInput = document.getElementById('register-username');
                if (usernameInput) usernameInput.focus();
            }, 100);
        }
        
        console.log('Tab switched successfully to:', tab);
    }

    // Handle login - Completely fixed
    async handleLogin() {
        console.log('Handling login...');
        
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        
        if (!emailInput || !passwordInput) {
            console.error('Login form elements not found');
            this.showToast('Login form error', 'error');
            return;
        }
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        console.log('Login attempt for email:', email);

        if (!email || !password) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        // Show loading
        this.showLoading();

        try {
            // Simulate API delay
            await this.delay(1000);

            const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
            console.log('User lookup result:', user ? user.username : 'not found');
            
            if (user) {
                this.currentUser = user;
                console.log('Login successful for:', this.currentUser.username);
                
                this.hideLoading();
                this.showToast('Welcome back, ' + user.username + '!', 'success');
                
                // Clear form
                emailInput.value = '';
                passwordInput.value = '';
                
                // Navigate to dashboard after a short delay
                setTimeout(() => {
                    this.navigateToDashboard();
                }, 800);
                
            } else {
                this.hideLoading();
                this.showToast('Invalid email or password. Try: john@example.com', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.hideLoading();
            this.showToast('Login failed. Please try again.', 'error');
        }
    }

    // Handle registration - Completely fixed
    async handleRegister() {
        console.log('Handling registration...');
        
        const usernameInput = document.getElementById('register-username');
        const emailInput = document.getElementById('register-email');
        const passwordInput = document.getElementById('register-password');
        
        if (!usernameInput || !emailInput || !passwordInput) {
            console.error('Register form elements not found');
            this.showToast('Registration form error', 'error');
            return;
        }
        
        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !email || !password) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }

        this.showLoading();

        try {
            await this.delay(1000);

            const existingUser = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (existingUser) {
                this.hideLoading();
                this.showToast('User with this email already exists!', 'error');
                return;
            }

            const newUser = {
                id: Date.now().toString(),
                username: username,
                email: email,
                avatar: username.substring(0, 2).toUpperCase()
            };

            this.users.push(newUser);
            this.currentUser = newUser;
            
            console.log('Registration successful:', newUser.username);
            
            this.hideLoading();
            this.showToast('Welcome, ' + newUser.username + '!', 'success');
            
            // Clear form
            usernameInput.value = '';
            emailInput.value = '';
            passwordInput.value = '';
            
            setTimeout(() => {
                this.navigateToDashboard();
            }, 800);
            
        } catch (error) {
            console.error('Registration error:', error);
            this.hideLoading();
            this.showToast('Registration failed. Please try again.', 'error');
        }
    }

    // Handle logout
    handleLogout() {
        console.log('Logging out...');
        
        this.currentUser = null;
        this.currentRoom = null;
        
        if (this.socketSimulation) {
            clearInterval(this.socketSimulation);
            this.socketSimulation = null;
        }
        
        this.navigateToAuth();
        this.showToast('Logged out successfully!', 'info');
    }

    // Update user info
    updateUserInfo() {
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        
        if (userAvatar && userName && this.currentUser) {
            userAvatar.textContent = this.currentUser.avatar;
            userName.textContent = this.currentUser.username;
            console.log('User info updated:', this.currentUser.username);
        }
    }

    // Render rooms
    renderRooms() {
        console.log('Rendering rooms...');
        
        const roomsList = document.getElementById('rooms-list');
        if (!roomsList) {
            console.error('Rooms list element not found');
            return;
        }

        const userRooms = this.rooms.filter(room => 
            room.participants.includes(this.currentUser.id)
        );

        console.log('User rooms found:', userRooms.length);

        if (userRooms.length === 0) {
            roomsList.innerHTML = `
                <div class="card" style="text-align: center; padding: 2rem;">
                    <h3>No rooms yet</h3>
                    <p>Create your first room to start chatting!</p>
                </div>
            `;
            return;
        }

        roomsList.innerHTML = userRooms.map(room => {
            const participantCount = room.participants.length;
            const createdDate = new Date(room.createdAt).toLocaleDateString();
            const messageCount = room.messageCount || 0;
            
            return `
                <div class="room-card" data-room-id="${room.id}">
                    <h3>${this.escapeHtml(room.name)}</h3>
                    <div class="room-meta">
                        <span class="participants-count">
                            👥 ${participantCount} participants
                        </span>
                        <span>${messageCount} messages</span>
                    </div>
                    <div class="room-meta" style="margin-top: 8px;">
                        <span style="font-size: 11px; color: var(--color-text-secondary);">
                            Created ${createdDate}
                        </span>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('Rooms rendered successfully');
    }

    // Join room
    joinRoom(roomId) {
        console.log('Joining room:', roomId);
        this.navigateToChat(roomId);
    }

    // Show create room modal
    showCreateRoomModal() {
        console.log('Showing create room modal...');
        const modal = document.getElementById('create-room-modal');
        if (modal) {
            modal.classList.remove('hidden');
            setTimeout(() => {
                const roomNameInput = document.getElementById('room-name-input');
                if (roomNameInput) roomNameInput.focus();
            }, 100);
        }
    }

    // Hide create room modal
    hideCreateRoomModal() {
        console.log('Hiding create room modal...');
        const modal = document.getElementById('create-room-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        const form = document.getElementById('create-room-form');
        if (form) form.reset();
    }

    // Handle create room
    async handleCreateRoom() {
        console.log('Creating room...');
        
        const roomNameInput = document.getElementById('room-name-input');
        if (!roomNameInput) {
            this.showToast('Room name input not found', 'error');
            return;
        }
        
        const roomName = roomNameInput.value.trim();
        
        if (!roomName) {
            this.showToast('Please enter a room name', 'error');
            return;
        }

        this.showLoading();
        
        try {
            await this.delay(500);

            const newRoom = {
                id: `room_${Date.now()}`,
                name: roomName,
                participants: [this.currentUser.id],
                createdBy: this.currentUser.id,
                createdAt: new Date().toISOString(),
                link: `/room/room_${Date.now()}`,
                lastActivity: new Date().toISOString(),
                messageCount: 0
            };

            this.rooms.push(newRoom);
            
            console.log('Room created:', newRoom.name);
            
            this.hideLoading();
            this.hideCreateRoomModal();
            this.showToast('Room "' + roomName + '" created successfully!', 'success');
            this.renderRooms();
            
        } catch (error) {
            console.error('Create room error:', error);
            this.hideLoading();
            this.showToast('Failed to create room. Please try again.', 'error');
        }
    }

    // Update chat header
    updateChatHeader() {
        const roomNameEl = document.getElementById('room-name');
        const roomLinkEl = document.getElementById('room-link-input');
        
        if (roomNameEl && this.currentRoom) {
            roomNameEl.textContent = this.currentRoom.name;
        }
        if (roomLinkEl && this.currentRoom) {
            roomLinkEl.value = window.location.origin + this.currentRoom.link;
        }
    }

    // Render participants
    renderParticipants() {
        const participantsList = document.getElementById('participants-list');
        if (!participantsList || !this.currentRoom) return;
        
        const participants = this.currentRoom.participants.map(userId => {
            return this.users.find(u => u.id === userId);
        }).filter(Boolean);

        participantsList.innerHTML = participants.map(user => `
            <div class="participant">
                <div class="participant-avatar">${user.avatar}</div>
                <span class="participant-name">${this.escapeHtml(user.username)}</span>
            </div>
        `).join('');
    }

    // Render messages
    renderMessages() {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages || !this.currentRoom) return;
        
        const roomMessages = this.messages.filter(msg => msg.roomId === this.currentRoom.id);
        
        chatMessages.innerHTML = roomMessages.map(message => {
            const user = this.users.find(u => u.id === message.userId);
            const isSent = message.userId === this.currentUser.id;
            const messageClass = isSent ? 'sent' : 'received';
            const timestamp = new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            return `
                <div class="message ${messageClass}">
                    <div class="message-avatar">${user ? user.avatar : '??'}</div>
                    <div class="message-content">
                        <div class="message-bubble">${this.escapeHtml(message.text)}</div>
                        <div class="message-meta">
                            <span class="message-time">${timestamp}</span>
                            ${isSent ? `<span class="message-status">✓ ${message.status}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 50);
    }

    // Send message
    sendMessage() {
        const input = document.getElementById('message-input');
        if (!input || !this.currentRoom) return;
        
        const text = input.value.trim();
        if (!text) return;

        const message = {
            id: `msg_${Date.now()}`,
            roomId: this.currentRoom.id,
            userId: this.currentUser.id,
            username: this.currentUser.username,
            text: text,
            timestamp: new Date().toISOString(),
            status: 'sent'
        };

        this.messages.push(message);
        input.value = '';
        this.renderMessages();

        setTimeout(() => {
            message.status = 'delivered';
            this.renderMessages();
        }, 1000);
        
        console.log('Message sent:', text);
    }

    // Handle typing
    handleTyping() {
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator && this.currentUser) {
            typingIndicator.textContent = `${this.currentUser.username} is typing...`;

            this.typingTimeout = setTimeout(() => {
                typingIndicator.textContent = '';
            }, 2000);
        }
    }

    // Copy room link
    copyRoomLink() {
        const input = document.getElementById('room-link-input');
        if (!input) return;
        
        input.select();
        input.setSelectionRange(0, 99999);
        
        try {
            document.execCommand('copy');
            this.showToast('Room link copied to clipboard!', 'success');
        } catch (err) {
            this.showToast('Failed to copy link', 'error');
        }
    }

    // Start socket simulation
    startSocketSimulation() {
        if (this.socketSimulation) {
            clearInterval(this.socketSimulation);
        }

        this.socketSimulation = setInterval(() => {
            if (Math.random() < 0.1 && this.currentRoom) {
                const otherUsers = this.currentRoom.participants
                    .filter(id => id !== this.currentUser.id)
                    .map(id => this.users.find(u => u.id === id))
                    .filter(Boolean);
                
                if (otherUsers.length > 0) {
                    const randomUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];
                    const typingIndicator = document.getElementById('typing-indicator');
                    
                    if (typingIndicator && !typingIndicator.textContent.includes('typing')) {
                        typingIndicator.textContent = `${randomUser.username} is typing...`;
                        
                        setTimeout(() => {
                            if (typingIndicator.textContent.includes(randomUser.username)) {
                                typingIndicator.textContent = '';
                            }
                        }, 3000);
                    }
                }
            }
        }, 12000);
    }

    // Utility functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.classList.remove('hidden');
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.classList.add('hidden');
    }

    showToast(message, type = 'info') {
        console.log('Toast:', type, message);
        
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize app
console.log('Creating ChatApp instance...');
const chatApp = new ChatApp();
window.chatApp = chatApp;