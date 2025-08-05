// ChatFlow Application - JavaScript
class ChatApp {
    constructor() {
        this.currentUser = null;
        this.currentRoom = null;
        this.rooms = [];
        this.messages = [];
        this.users = [];
        this.typingUsers = new Set();
        this.socketSimulation = null;
        
        console.log('ChatApp initializing...');
        this.initializeData();
        this.setupEventListeners();
        this.checkAuthentication();
    }

    // Initialize sample data
    initializeData() {
        console.log('Initializing data...');
        
        // Always use fresh sample data for demo purposes
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
                "link": "/room/room_1"
            },
            {
                "id": "room_2", 
                "name": "Project Planning", 
                "participants": ["1", "4"], 
                "createdBy": "4",
                "createdAt": "2025-01-15T14:30:00Z",
                "link": "/room/room_2"
            },
            {
                "id": "room_3", 
                "name": "Team Chat", 
                "participants": ["2", "3", "4"], 
                "createdBy": "2",
                "createdAt": "2025-01-15T16:45:00Z",
                "link": "/room/room_3"
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

    // Setup event listeners
    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Auth forms
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Auth tabs
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');
        
        if (loginTab) loginTab.addEventListener('click', () => this.switchAuthTab('login'));
        if (registerTab) registerTab.addEventListener('click', () => this.switchAuthTab('register'));

        // Dashboard
        const logoutBtn = document.getElementById('logout-btn');
        const createRoomBtn = document.getElementById('create-room-btn');
        
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.handleLogout());
        if (createRoomBtn) createRoomBtn.addEventListener('click', () => this.showCreateRoomModal());

        // Chat
        const backBtn = document.getElementById('back-to-dashboard');
        const sendBtn = document.getElementById('send-btn');
        const messageInput = document.getElementById('message-input');
        const copyLinkBtn = document.getElementById('copy-link-btn');
        
        if (backBtn) backBtn.addEventListener('click', () => this.showDashboard());
        if (sendBtn) sendBtn.addEventListener('click', () => this.sendMessage());
        if (copyLinkBtn) copyLinkBtn.addEventListener('click', () => this.copyRoomLink());
        
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                } else {
                    this.handleTyping();
                }
            });
        }

        // Modal
        const closeModal = document.getElementById('close-modal');
        const cancelRoom = document.getElementById('cancel-room');
        const createRoomForm = document.getElementById('create-room-form');
        const modal = document.getElementById('create-room-modal');
        
        if (closeModal) closeModal.addEventListener('click', () => this.hideCreateRoomModal());
        if (cancelRoom) cancelRoom.addEventListener('click', () => this.hideCreateRoomModal());
        if (createRoomForm) {
            createRoomForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreateRoom();
            });
        }
        
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-backdrop') || e.target.id === 'create-room-modal') {
                    this.hideCreateRoomModal();
                }
            });
        }
        
        console.log('Event listeners set up successfully');
    }

    // Check authentication status
    checkAuthentication() {
        console.log('Checking authentication...');
        const token = localStorage.getItem('chatapp_token');
        const userData = localStorage.getItem('chatapp_user');
        
        if (token && userData) {
            try {
                this.currentUser = JSON.parse(userData);
                console.log('User authenticated:', this.currentUser.username);
                this.showDashboard();
            } catch (error) {
                console.error('Error parsing user data:', error);
                localStorage.removeItem('chatapp_token');
                localStorage.removeItem('chatapp_user');
                this.showAuthPage();
            }
        } else {
            console.log('No authentication found, showing auth page');
            this.showAuthPage();
        }
    }

    // Switch auth tabs
    switchAuthTab(tab) {
        console.log('Switching to', tab, 'tab');
        
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        if (tab === 'login') {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        } else {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            registerForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
        }
    }

    // Handle login
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
        const password = passwordInput.value;

        console.log('Login attempt for email:', email);

        if (!email || !password) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        this.showLoading();

        try {
            // Simulate API delay
            await this.delay(500);

            // Find user
            const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
            console.log('User found:', user ? user.username : 'none');
            
            if (user) {
                // Successful login
                this.currentUser = user;
                const token = this.generateToken(user);
                
                localStorage.setItem('chatapp_token', token);
                localStorage.setItem('chatapp_user', JSON.stringify(user));
                
                console.log('Login successful, user stored:', this.currentUser.username);
                
                this.hideLoading();
                this.showToast('Welcome back, ' + user.username + '!', 'success');
                
                // Clear form
                emailInput.value = '';
                passwordInput.value = '';
                
                // Navigate to dashboard
                setTimeout(() => {
                    console.log('Navigating to dashboard...');
                    this.showDashboard();
                }, 500);
                
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

    // Handle registration
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
        const password = passwordInput.value;

        if (!username || !email || !password) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }

        this.showLoading();

        try {
            await this.delay(500);

            // Check if user already exists
            const existingUser = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (existingUser) {
                this.hideLoading();
                this.showToast('User with this email already exists!', 'error');
                return;
            }

            // Create new user
            const newUser = {
                id: Date.now().toString(),
                username: username,
                email: email,
                avatar: username.substring(0, 2).toUpperCase()
            };

            this.users.push(newUser);
            this.currentUser = newUser;
            
            const token = this.generateToken(newUser);
            localStorage.setItem('chatapp_token', token);
            localStorage.setItem('chatapp_user', JSON.stringify(newUser));
            
            console.log('Registration successful:', newUser.username);
            
            this.hideLoading();
            this.showToast('Welcome, ' + newUser.username + '!', 'success');
            
            // Clear form
            usernameInput.value = '';
            emailInput.value = '';
            passwordInput.value = '';
            
            setTimeout(() => {
                this.showDashboard();
            }, 500);
            
        } catch (error) {
            console.error('Registration error:', error);
            this.hideLoading();
            this.showToast('Registration failed. Please try again.', 'error');
        }
    }

    // Generate token
    generateToken(user) {
        return btoa(JSON.stringify({ 
            userId: user.id, 
            username: user.username,
            exp: Date.now() + 24 * 60 * 60 * 1000 
        }));
    }

    // Handle logout
    handleLogout() {
        console.log('Logging out...');
        
        localStorage.removeItem('chatapp_token');
        localStorage.removeItem('chatapp_user');
        this.currentUser = null;
        this.currentRoom = null;
        
        if (this.socketSimulation) {
            clearInterval(this.socketSimulation);
            this.socketSimulation = null;
        }
        
        this.showAuthPage();
        this.showToast('Logged out successfully!', 'info');
    }

    // Show auth page
    showAuthPage() {
        console.log('Showing auth page...');
        this.hideAllPages();
        document.getElementById('auth-page').classList.remove('hidden');
    }

    // Show dashboard
    showDashboard() {
        console.log('Showing dashboard...');
        
        if (!this.currentUser) {
            console.log('No current user, redirecting to auth');
            this.showAuthPage();
            return;
        }

        this.hideAllPages();
        document.getElementById('dashboard-page').classList.remove('hidden');
        
        this.updateUserInfo();
        this.renderRooms();
        
        console.log('Dashboard displayed for user:', this.currentUser.username);
    }

    // Show chat page
    showChatPage() {
        console.log('Showing chat page...');
        
        if (!this.currentUser || !this.currentRoom) {
            console.log('Missing user or room, redirecting to dashboard');
            this.showDashboard();
            return;
        }

        this.hideAllPages();
        document.getElementById('chat-page').classList.remove('hidden');
        
        this.updateChatHeader();
        this.renderParticipants();
        this.renderMessages();
        this.startSocketSimulation();
        
        setTimeout(() => {
            const messageInput = document.getElementById('message-input');
            if (messageInput) messageInput.focus();
        }, 100);
        
        console.log('Chat page displayed for room:', this.currentRoom.name);
    }

    // Hide all pages
    hideAllPages() {
        document.getElementById('auth-page').classList.add('hidden');
        document.getElementById('dashboard-page').classList.add('hidden');
        document.getElementById('chat-page').classList.add('hidden');
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
            
            return `
                <div class="room-card" onclick="chatApp.joinRoom('${room.id}')">
                    <h3>${room.name}</h3>
                    <div class="room-meta">
                        <span class="participants-count">
                            👥 ${participantCount} participants
                        </span>
                        <span>${createdDate}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('Rooms rendered successfully');
    }

    // Join room
    joinRoom(roomId) {
        console.log('Joining room:', roomId);
        
        const room = this.rooms.find(r => r.id === roomId);
        if (!room) {
            this.showToast('Room not found', 'error');
            return;
        }

        // Add user to participants if not already there
        if (!room.participants.includes(this.currentUser.id)) {
            room.participants.push(this.currentUser.id);
        }

        this.currentRoom = room;
        this.showChatPage();
    }

    // Show create room modal
    showCreateRoomModal() {
        console.log('Showing create room modal...');
        document.getElementById('create-room-modal').classList.remove('hidden');
        setTimeout(() => {
            const roomNameInput = document.getElementById('room-name-input');
            if (roomNameInput) roomNameInput.focus();
        }, 100);
    }

    // Hide create room modal
    hideCreateRoomModal() {
        console.log('Hiding create room modal...');
        document.getElementById('create-room-modal').classList.add('hidden');
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
            await this.delay(300);

            const newRoom = {
                id: `room_${Date.now()}`,
                name: roomName,
                participants: [this.currentUser.id],
                createdBy: this.currentUser.id,
                createdAt: new Date().toISOString(),
                link: `/room/room_${Date.now()}`
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
        
        if (roomNameEl) roomNameEl.textContent = this.currentRoom.name;
        if (roomLinkEl) roomLinkEl.value = window.location.origin + this.currentRoom.link;
    }

    // Render participants
    renderParticipants() {
        const participantsList = document.getElementById('participants-list');
        if (!participantsList) return;
        
        const participants = this.currentRoom.participants.map(userId => {
            return this.users.find(u => u.id === userId);
        }).filter(Boolean);

        participantsList.innerHTML = participants.map(user => `
            <div class="participant">
                <div class="participant-avatar">${user.avatar}</div>
                <span class="participant-name">${user.username}</span>
            </div>
        `).join('');
    }

    // Render messages
    renderMessages() {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
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

        // Scroll to bottom
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 50);
    }

    // Send message
    sendMessage() {
        const input = document.getElementById('message-input');
        if (!input) return;
        
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

        // Simulate delivery
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
        if (typingIndicator) {
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
            if (Math.random() < 0.15) {
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
        }, 10000);
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

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ChatApp...');
    window.chatApp = new ChatApp();
});

// Fallback initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!window.chatApp) {
            console.log('Fallback: DOM loaded, initializing ChatApp...');
            window.chatApp = new ChatApp();
        }
    });
} else {
    console.log('DOM already loaded, initializing ChatApp immediately...');
    window.chatApp = new ChatApp();
}

// Handle browser navigation
window.addEventListener('popstate', () => {
    if (window.chatApp) {
        window.chatApp.checkAuthentication();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.chatApp && window.chatApp.socketSimulation) {
        clearInterval(window.chatApp.socketSimulation);
    }
});