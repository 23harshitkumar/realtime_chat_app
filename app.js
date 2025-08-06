// ChatFlow Application - Real Backend Integration with Fixed Permission System
class ChatApp {
    constructor() {
        this.currentUser = null;
        this.currentRoom = null;
        this.socket = null;
        this.currentPage = 'auth';
        this.initialized = false;
        this.pendingRequest = null;
        
        // Backend configuration
        this.API_BASE = 'http://localhost:5000';
        this.authToken = null;
        
        console.log('ChatApp initializing with real backend...');
        
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
        this.checkAuthentication();
        this.setupEventListeners();
        this.setupRouting();
        console.log('App initialization complete');
    }

    // Check authentication status from backend
    async checkAuthentication() {
        console.log('Checking authentication...');
        
        const token = this.getStoredToken();
        if (!token) {
            console.log('No token found, starting unauthenticated');
            this.navigateToAuth();
            return;
        }
        
        try {
            this.authToken = token;
            const response = await this.apiCall('/api/auth/me', 'GET');
            
            if (response.success) {
                this.currentUser = response.user;
                console.log('Authentication successful:', this.currentUser.username);
                this.initializeSocket();
                this.navigateToDashboard();
            } else {
                throw new Error('Invalid token');
            }
        } catch (error) {
            console.error('Authentication failed:', error);
            this.clearStoredToken();
            this.navigateToAuth();
        }
    }

    // Initialize Socket.IO connection
    initializeSocket() {
        if (this.socket && this.socket.connected) {
            return;
        }

        console.log('Initializing Socket.IO connection...');
        
        try {
            this.socket = io(this.API_BASE, {
                auth: {
                    token: this.authToken
                }
            });

            this.socket.on('connect', () => {
                console.log('Socket connected');
                this.updateConnectionStatus('connected');
            });

            this.socket.on('disconnect', () => {
                console.log('Socket disconnected');
                this.updateConnectionStatus('disconnected');
            });

            this.socket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                this.updateConnectionStatus('disconnected');
            });

            // Room permission events - THE MAIN FIX
            this.socket.on('room-request-notification', (data) => {
                console.log('Received room permission request:', data);
                this.showPermissionRequest(data);
            });

            this.socket.on('room-access-granted', (data) => {
                console.log('Room access granted:', data);
                this.handleAccessGranted(data);
            });

            this.socket.on('room-access-denied', (data) => {
                console.log('Room access denied:', data);
                this.handleAccessDenied(data);
            });

            // Chat events
            this.socket.on('receive-message', (message) => {
                console.log('Received message:', message);
                this.handleNewMessage(message);
            });

            this.socket.on('typing', (data) => {
                this.handleTyping(data);
            });

            this.socket.on('stop-typing', (data) => {
                this.handleStopTyping(data);
            });

            this.socket.on('user-joined', (data) => {
                console.log('User joined room:', data);
                this.handleUserJoined(data);
            });

            this.socket.on('user-left', (data) => {
                console.log('User left room:', data);
                this.handleUserLeft(data);
            });
        } catch (error) {
            console.error('Socket initialization error:', error);
            this.updateConnectionStatus('disconnected');
        }
    }

    // Setup event listeners - FIXED
    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Direct event listeners - no event delegation to fix interaction issues
        
        // Auth tabs - Direct listeners
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');
        
        if (loginTab) {
            loginTab.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Login tab clicked directly');
                this.switchAuthTab('login');
            });
        }
        
        if (registerTab) {
            registerTab.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Register tab clicked directly');
                this.switchAuthTab('register');
            });
        }

        // Form submissions - Direct listeners
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const createRoomForm = document.getElementById('create-room-form');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Login form submitted directly');
                this.handleLogin();
            });
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Register form submitted directly');
                this.handleRegister();
            });
        }
        
        if (createRoomForm) {
            createRoomForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleCreateRoom();
            });
        }

        // Button clicks - Direct listeners
        const buttons = [
            { id: 'logout-btn', handler: () => this.handleLogout() },
            { id: 'create-room-btn', handler: () => this.showCreateRoomModal() },
            { id: 'back-to-dashboard', handler: () => this.navigateToDashboard() },
            { id: 'send-btn', handler: () => this.sendMessage() },
            { id: 'copy-link-btn', handler: () => this.copyRoomLink() },
            { id: 'close-modal', handler: () => this.hideModals() },
            { id: 'cancel-room', handler: () => this.hideModals() },
            { id: 'cancel-join', handler: () => this.hideModals() },
            { id: 'approve-request', handler: () => this.approvePermissionRequest() },
            { id: 'reject-request', handler: () => this.rejectPermissionRequest() },
            { id: 'quick-approve', handler: () => this.quickApproveRequest() },
            { id: 'quick-reject', handler: () => this.quickRejectRequest() }
        ];

        buttons.forEach(({ id, handler }) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`Button ${id} clicked directly`);
                    handler();
                });
            }
        });

        // Message input events
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.sendMessage();
                } else {
                    this.handleTypingStart();
                }
            });
        }

        // Room cards - Use event delegation for dynamic content
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('room-card') || e.target.closest('.room-card')) {
                e.preventDefault();
                const roomCard = e.target.closest('.room-card') || e.target;
                const roomId = roomCard.getAttribute('data-room-id');
                if (roomId) {
                    console.log('Room card clicked:', roomId);
                    this.joinRoom(roomId);
                }
            }
        });

        // Modal backdrop clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                this.hideModals();
            }
        });
    }

    // Setup routing system
    setupRouting() {
        console.log('Setting up routing...');
        
        window.addEventListener('popstate', () => {
            this.handleRouteChange();
        });
        
        this.handleRouteChange();
    }

    // Handle route changes
    handleRouteChange() {
        const hash = window.location.hash;
        console.log('Route change:', hash);
        
        if (hash.startsWith('#room/')) {
            const roomId = hash.replace('#room/', '');
            if (this.currentUser) {
                this.handleSharedRoomLink(roomId);
            } else {
                // Store the intended room for after authentication
                this.intendedRoom = roomId;
                this.navigateToAuth();
            }
        } else if (hash.startsWith('#chat/')) {
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
        } else {
            if (this.currentUser) {
                this.navigateToPage('dashboard');
            } else {
                this.navigateToAuth();
            }
        }
    }

    // Handle shared room links - FIXED PERMISSION SYSTEM
    async handleSharedRoomLink(roomId) {
        console.log('Handling shared room link:', roomId);
        
        try {
            // Check if user already has access
            const response = await this.apiCall(`/api/rooms/${roomId}`, 'GET');
            
            if (response.success) {
                // User has access, navigate to chat
                this.navigateToChat(roomId);
            } else {
                // User needs permission, request access
                this.requestRoomAccess(roomId);
            }
        } catch (error) {
            console.error('Error checking room access:', error);
            
            if (error.message.includes('403') || error.message.includes('Unauthorized')) {
                // Request permission
                this.requestRoomAccess(roomId);
            } else {
                this.showToast('Room not found or error occurred', 'error');
                this.navigateToDashboard();
            }
        }
    }

    // Request room access - FIXED
    async requestRoomAccess(roomId) {
        console.log('Requesting room access for:', roomId);
        
        try {
            const response = await this.apiCall(`/api/rooms/${roomId}/request-access`, 'POST');
            
            if (response.success) {
                // Show waiting modal
                this.showJoinRoomModal(roomId, response.room.name);
                
                // Send socket event to room owner
                if (this.socket) {
                    this.socket.emit('request-room-access', {
                        roomId: roomId,
                        requester: this.currentUser
                    });
                }
                
                this.showToast('Permission request sent to room owner', 'info');
            } else {
                throw new Error(response.message || 'Failed to request access');
            }
        } catch (error) {
            console.error('Error requesting room access:', error);
            this.showToast('Failed to request room access', 'error');
            this.navigateToDashboard();
        }
    }

    // Show permission request notification to room host - FIXED
    showPermissionRequest(data) {
        console.log('Showing permission request notification:', data);
        
        this.pendingRequest = data;
        
        // Show modal
        const modal = document.getElementById('permission-request-modal');
        const requesterName = document.getElementById('requester-name');
        const roomName = document.getElementById('request-room-name');
        
        if (modal && requesterName && roomName) {
            requesterName.textContent = data.requester.username;
            roomName.textContent = data.roomName;
            modal.classList.remove('hidden');
        }
        
        // Show notification popup
        const notification = document.getElementById('permission-notification');
        const notificationRequester = document.getElementById('notification-requester');
        
        if (notification && notificationRequester) {
            notificationRequester.textContent = data.requester.username;
            notification.classList.remove('hidden');
            setTimeout(() => notification.classList.add('show'), 100);
        }
        
        // Auto-hide notification after 10 seconds
        setTimeout(() => {
            if (notification) {
                notification.classList.remove('show');
                setTimeout(() => notification.classList.add('hidden'), 300);
            }
        }, 10000);
    }

    // Approve permission request
    async approvePermissionRequest() {
        if (!this.pendingRequest) return;
        
        console.log('Approving permission request:', this.pendingRequest);
        
        try {
            const response = await this.apiCall('/api/rooms/approve-request', 'POST', {
                roomId: this.pendingRequest.roomId,
                userId: this.pendingRequest.requester._id
            });
            
            if (response.success) {
                // Send socket event to requester
                if (this.socket) {
                    this.socket.emit('approve-room-request', {
                        roomId: this.pendingRequest.roomId,
                        userId: this.pendingRequest.requester._id,
                        roomName: this.pendingRequest.roomName
                    });
                }
                
                this.showToast(`Approved ${this.pendingRequest.requester.username}'s request`, 'success');
                this.hideModals();
                this.hidePermissionNotification();
            } else {
                throw new Error(response.message || 'Failed to approve request');
            }
        } catch (error) {
            console.error('Error approving request:', error);
            this.showToast('Failed to approve request', 'error');
        }
        
        this.pendingRequest = null;
    }

    // Reject permission request
    async rejectPermissionRequest() {
        if (!this.pendingRequest) return;
        
        console.log('Rejecting permission request:', this.pendingRequest);
        
        try {
            const response = await this.apiCall('/api/rooms/reject-request', 'POST', {
                roomId: this.pendingRequest.roomId,
                userId: this.pendingRequest.requester._id
            });
            
            if (response.success) {
                // Send socket event to requester
                if (this.socket) {
                    this.socket.emit('reject-room-request', {
                        roomId: this.pendingRequest.roomId,
                        userId: this.pendingRequest.requester._id,
                        roomName: this.pendingRequest.roomName
                    });
                }
                
                this.showToast(`Rejected ${this.pendingRequest.requester.username}'s request`, 'info');
                this.hideModals();
                this.hidePermissionNotification();
            } else {
                throw new Error(response.message || 'Failed to reject request');
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            this.showToast('Failed to reject request', 'error');
        }
        
        this.pendingRequest = null;
    }

    // Quick approve from notification
    quickApproveRequest() {
        this.hidePermissionNotification();
        this.approvePermissionRequest();
    }

    // Quick reject from notification
    quickRejectRequest() {
        this.hidePermissionNotification();
        this.rejectPermissionRequest();
    }

    // Hide permission notification
    hidePermissionNotification() {
        const notification = document.getElementById('permission-notification');
        if (notification) {
            notification.classList.remove('show');
            setTimeout(() => notification.classList.add('hidden'), 300);
        }
    }

    // Handle access granted
    handleAccessGranted(data) {
        console.log('Access granted:', data);
        
        this.hideModals();
        this.showToast(`Access granted to ${data.roomName}!`, 'success');
        
        // Navigate to the room
        setTimeout(() => {
            this.navigateToChat(data.roomId);
        }, 1000);
    }

    // Handle access denied
    handleAccessDenied(data) {
        console.log('Access denied:', data);
        
        this.hideModals();
        this.showToast(`Access denied to ${data.roomName}`, 'error');
        
        // Navigate back to dashboard
        setTimeout(() => {
            this.navigateToDashboard();
        }, 2000);
    }

    // Navigate to a specific page
    navigateToPage(pageName, updateUrl = true) {
        console.log('Navigating to page:', pageName);
        
        if (this.currentPage === pageName) return;

        // Hide all pages
        const allPages = document.querySelectorAll('.page');
        allPages.forEach(page => page.classList.remove('active'));

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
                'chat': `#chat/${this.currentRoom ? this.currentRoom._id : ''}`
            };
            
            if (urlMap[pageName]) {
                window.history.pushState(null, null, urlMap[pageName]);
            }
        }

        // Show target page
        setTimeout(() => {
            targetPageEl.classList.add('active');
            this.currentPage = pageName;
            this.onPageEnter(pageName);
        }, 50);
    }

    // Handle page enter events
    async onPageEnter(pageName) {
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
                await this.loadRooms();
                
                // Check if we have an intended room from shared link
                if (this.intendedRoom) {
                    const roomId = this.intendedRoom;
                    this.intendedRoom = null;
                    this.handleSharedRoomLink(roomId);
                }
                break;
                
            case 'chat':
                this.updateChatHeader();
                await this.loadMessages();
                this.loadParticipants();
                
                // Join the room via socket
                if (this.socket && this.currentRoom) {
                    this.socket.emit('join-room', this.currentRoom._id);
                }
                
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
    async navigateToChat(roomId) {
        try {
            const response = await this.apiCall(`/api/rooms/${roomId}`, 'GET');
            
            if (response.success) {
                this.currentRoom = response.room;
                this.navigateToPage('chat');
            } else {
                throw new Error(response.message || 'Room not found');
            }
        } catch (error) {
            console.error('Error loading room:', error);
            this.showToast('Failed to load room', 'error');
            this.navigateToDashboard();
        }
    }

    // Switch auth tabs - FIXED
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

        // Reset forms and errors
        loginForm.reset();
        registerForm.reset();
        this.hideError('login-error');
        this.hideError('register-error');

        // Remove active states
        loginTab.classList.remove('active');
        registerTab.classList.remove('active');
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

    // Handle login - FIXED VALIDATION
    async handleLogin() {
        console.log('Handling login...');
        
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        
        if (!emailInput || !passwordInput) {
            this.showError('login-error', 'Form elements not found');
            return;
        }
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Clear previous errors
        this.hideError('login-error');

        // Client-side validation - FIXED
        if (!email || !password) {
            this.showError('login-error', 'Please fill in all fields');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showError('login-error', 'Please enter a valid email address');
            return;
        }

        if (password.length < 6) {
            this.showError('login-error', 'Password must be at least 6 characters');
            return;
        }

        this.showLoading();

        try {
            const response = await this.apiCall('/api/auth/login', 'POST', {
                email,
                password
            });

            if (response.success) {
                this.authToken = response.token;
                this.currentUser = response.user;
                this.storeToken(response.token);
                
                console.log('Login successful:', this.currentUser.username);
                
                this.hideLoading();
                this.showToast(`Welcome back, ${this.currentUser.username}!`, 'success');
                
                // Initialize socket and navigate
                this.initializeSocket();
                
                setTimeout(() => {
                    this.navigateToDashboard();
                }, 800);
                
            } else {
                throw new Error(response.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.hideLoading();
            
            // Better error handling
            let errorMessage = 'Login failed. Please try again.';
            
            if (error.message.includes('Invalid credentials') || error.message.includes('401')) {
                errorMessage = 'Invalid email or password. Please check your credentials.';
            } else if (error.message.includes('Network') || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
                errorMessage = 'Cannot connect to server. Please check if the backend is running on http://localhost:5000';
            } else if (error.message.includes('CORS')) {
                errorMessage = 'CORS error. Please ensure the backend allows requests from this domain.';
            }
            
            this.showError('login-error', errorMessage);
        }
    }

    // Handle registration - FIXED VALIDATION
    async handleRegister() {
        console.log('Handling registration...');
        
        const usernameInput = document.getElementById('register-username');
        const emailInput = document.getElementById('register-email');
        const passwordInput = document.getElementById('register-password');
        
        if (!usernameInput || !emailInput || !passwordInput) {
            this.showError('register-error', 'Form elements not found');
            return;
        }
        
        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Clear previous errors
        this.hideError('register-error');

        // Client-side validation - FIXED
        if (!username || !email || !password) {
            this.showError('register-error', 'Please fill in all fields');
            return;
        }

        if (username.length < 3) {
            this.showError('register-error', 'Username must be at least 3 characters');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showError('register-error', 'Please enter a valid email address');
            return;
        }

        if (password.length < 6) {
            this.showError('register-error', 'Password must be at least 6 characters');
            return;
        }

        this.showLoading();

        try {
            const response = await this.apiCall('/api/auth/register', 'POST', {
                username,
                email,
                password
            });

            if (response.success) {
                this.authToken = response.token;
                this.currentUser = response.user;
                this.storeToken(response.token);
                
                console.log('Registration successful:', this.currentUser.username);
                
                this.hideLoading();
                this.showToast(`Welcome, ${this.currentUser.username}!`, 'success');
                
                // Initialize socket and navigate
                this.initializeSocket();
                
                setTimeout(() => {
                    this.navigateToDashboard();
                }, 800);
                
            } else {
                throw new Error(response.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.hideLoading();
            
            // Better error handling
            let errorMessage = 'Registration failed. Please try again.';
            
            if (error.message.includes('already exists') || error.message.includes('duplicate')) {
                errorMessage = 'An account with this email already exists. Please use a different email or try logging in.';
            } else if (error.message.includes('Network') || error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
                errorMessage = 'Cannot connect to server. Please check if the backend is running on http://localhost:5000';
            } else if (error.message.includes('CORS')) {
                errorMessage = 'CORS error. Please ensure the backend allows requests from this domain.';
            }
            
            this.showError('register-error', errorMessage);
        }
    }

    // Handle logout
    handleLogout() {
        console.log('Logging out...');
        
        this.currentUser = null;
        this.currentRoom = null;
        this.authToken = null;
        this.clearStoredToken();
        
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        
        this.navigateToAuth();
        this.showToast('Logged out successfully!', 'info');
    }

    // Update user info
    updateUserInfo() {
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        
        if (userAvatar && userName && this.currentUser) {
            userAvatar.textContent = this.currentUser.username.substring(0, 2).toUpperCase();
            userName.textContent = this.currentUser.username;
        }
    }

    // Load rooms from backend
    async loadRooms() {
        console.log('Loading rooms...');
        
        const roomsList = document.getElementById('rooms-list');
        if (!roomsList) return;

        try {
            const response = await this.apiCall('/api/rooms', 'GET');
            
            if (response.success) {
                this.renderRooms(response.rooms);
            } else {
                throw new Error(response.message || 'Failed to load rooms');
            }
        } catch (error) {
            console.error('Error loading rooms:', error);
            roomsList.innerHTML = `
                <div class="card" style="text-align: center; padding: 2rem; color: var(--color-error);">
                    <h3>Error Loading Rooms</h3>
                    <p>Please check your connection and ensure the backend is running.</p>
                    <p style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">
                        Expected backend: http://localhost:5000
                    </p>
                </div>
            `;
        }
    }

    // Render rooms
    renderRooms(rooms) {
        console.log('Rendering rooms:', rooms.length);
        
        const roomsList = document.getElementById('rooms-list');
        if (!roomsList) return;

        if (rooms.length === 0) {
            roomsList.innerHTML = `
                <div class="card" style="text-align: center; padding: 2rem;">
                    <h3>No rooms yet</h3>
                    <p>Create your first room to start chatting!</p>
                </div>
            `;
            return;
        }

        roomsList.innerHTML = rooms.map(room => {
            const participantCount = room.participants ? room.participants.length : 0;
            const createdDate = new Date(room.createdAt).toLocaleDateString();
            const messageCount = room.messageCount || 0;
            
            return `
                <div class="room-card" data-room-id="${room._id}">
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
    }

    // Join room
    joinRoom(roomId) {
        console.log('Joining room:', roomId);
        this.navigateToChat(roomId);
    }

    // Show create room modal
    showCreateRoomModal() {
        const modal = document.getElementById('create-room-modal');
        if (modal) {
            modal.classList.remove('hidden');
            setTimeout(() => {
                const roomNameInput = document.getElementById('room-name-input');
                if (roomNameInput) roomNameInput.focus();
            }, 100);
        }
    }

    // Show join room modal
    showJoinRoomModal(roomId, roomName) {
        const modal = document.getElementById('join-room-modal');
        const roomNameEl = document.getElementById('join-room-name');
        
        if (modal && roomNameEl) {
            roomNameEl.textContent = roomName;
            modal.classList.remove('hidden');
        }
    }

    // Hide all modals
    hideModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.classList.add('hidden'));
        
        // Reset forms
        const forms = document.querySelectorAll('form');
        forms.forEach(form => form.reset());
    }

    // Handle create room
    async handleCreateRoom() {
        console.log('Creating room...');
        
        const roomNameInput = document.getElementById('room-name-input');
        if (!roomNameInput) return;
        
        const roomName = roomNameInput.value.trim();
        
        if (!roomName) {
            this.showToast('Please enter a room name', 'error');
            return;
        }

        this.showLoading();
        
        try {
            const response = await this.apiCall('/api/rooms', 'POST', {
                name: roomName
            });

            if (response.success) {
                console.log('Room created:', response.room.name);
                
                this.hideLoading();
                this.hideModals();
                this.showToast(`Room "${roomName}" created successfully!`, 'success');
                
                // Refresh rooms list
                await this.loadRooms();
            } else {
                throw new Error(response.message || 'Failed to create room');
            }
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
            roomLinkEl.value = `${window.location.origin}#room/${this.currentRoom._id}`;
        }
    }

    // Load messages
    async loadMessages() {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages || !this.currentRoom) return;
        
        try {
            const response = await this.apiCall(`/api/rooms/${this.currentRoom._id}/messages`, 'GET');
            
            if (response.success) {
                this.renderMessages(response.messages);
            } else {
                throw new Error(response.message || 'Failed to load messages');
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            chatMessages.innerHTML = `
                <div style="text-align: center; color: var(--color-error); padding: 2rem;">
                    Error loading messages
                </div>
            `;
        }
    }

    // Render messages
    renderMessages(messages) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        if (messages.length === 0) {
            chatMessages.innerHTML = `
                <div style="text-align: center; color: var(--color-text-secondary); padding: 2rem;">
                    No messages yet. Start the conversation!
                </div>
            `;
            return;
        }

        chatMessages.innerHTML = messages.map(message => {
            const isSent = message.sender._id === this.currentUser._id;
            const messageClass = isSent ? 'sent' : 'received';
            const timestamp = new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            const avatar = message.sender.username.substring(0, 2).toUpperCase();
            
            return `
                <div class="message ${messageClass}">
                    <div class="message-avatar">${avatar}</div>
                    <div class="message-content">
                        <div class="message-bubble">${this.escapeHtml(message.content)}</div>
                        <div class="message-meta">
                            <span class="message-time">${timestamp}</span>
                            ${isSent ? '<span class="message-status">✓ sent</span>' : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 50);
    }

    // Load participants
    loadParticipants() {
        const participantsList = document.getElementById('participants-list');
        if (!participantsList || !this.currentRoom) return;
        
        const participants = this.currentRoom.participants || [];

        participantsList.innerHTML = participants.map(user => {
            const avatar = user.username.substring(0, 2).toUpperCase();
            return `
                <div class="participant">
                    <div class="participant-avatar">${avatar}</div>
                    <span class="participant-name">${this.escapeHtml(user.username)}</span>
                </div>
            `;
        }).join('');
    }

    // Send message
    sendMessage() {
        const input = document.getElementById('message-input');
        if (!input || !this.currentRoom || !this.socket) return;
        
        const text = input.value.trim();
        if (!text) return;

        // Send via socket
        this.socket.emit('send-message', {
            roomId: this.currentRoom._id,
            content: text
        });

        input.value = '';
        console.log('Message sent:', text);
    }

    // Handle new message from socket
    handleNewMessage(message) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        const isSent = message.sender._id === this.currentUser._id;
        const messageClass = isSent ? 'sent' : 'received';
        const timestamp = new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const avatar = message.sender.username.substring(0, 2).toUpperCase();
        
        const messageHtml = `
            <div class="message ${messageClass}">
                <div class="message-avatar">${avatar}</div>
                <div class="message-content">
                    <div class="message-bubble">${this.escapeHtml(message.content)}</div>
                    <div class="message-meta">
                        <span class="message-time">${timestamp}</span>
                        ${isSent ? '<span class="message-status">✓ sent</span>' : ''}
                    </div>
                </div>
            </div>
        `;

        chatMessages.insertAdjacentHTML('beforeend', messageHtml);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Handle typing start
    handleTypingStart() {
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        if (this.socket && this.currentRoom) {
            this.socket.emit('typing', {
                roomId: this.currentRoom._id,
                username: this.currentUser.username
            });

            this.typingTimeout = setTimeout(() => {
                this.socket.emit('stop-typing', {
                    roomId: this.currentRoom._id,
                    username: this.currentUser.username
                });
            }, 2000);
        }
    }

    // Handle typing indicator
    handleTyping(data) {
        if (data.username === this.currentUser.username) return;
        
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.textContent = `${data.username} is typing...`;
        }
    }

    // Handle stop typing
    handleStopTyping(data) {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator && typingIndicator.textContent.includes(data.username)) {
            typingIndicator.textContent = '';
        }
    }

    // Handle user joined
    handleUserJoined(data) {
        this.showToast(`${data.username} joined the room`, 'info');
        // Refresh participants if we're in the same room
        if (this.currentRoom && this.currentRoom._id === data.roomId) {
            this.loadParticipants();
        }
    }

    // Handle user left
    handleUserLeft(data) {
        this.showToast(`${data.username} left the room`, 'info');
        // Refresh participants if we're in the same room
        if (this.currentRoom && this.currentRoom._id === data.roomId) {
            this.loadParticipants();
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
            console.error('Copy failed:', err);
            this.showToast('Failed to copy link', 'error');
        }
    }

    // Update connection status
    updateConnectionStatus(status) {
        let statusEl = document.getElementById('connection-status');
        
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.id = 'connection-status';
            statusEl.className = 'connection-status';
            document.body.appendChild(statusEl);
        }

        statusEl.className = `connection-status ${status}`;
        
        switch (status) {
            case 'connected':
                statusEl.textContent = '● Connected';
                break;
            case 'connecting':
                statusEl.textContent = '● Connecting...';
                break;
            case 'disconnected':
                statusEl.textContent = '● Disconnected';
                break;
        }
    }

    // API call helper
    async apiCall(endpoint, method = 'GET', data = null) {
        const url = `${this.API_BASE}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (this.authToken) {
            options.headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }

        console.log(`API ${method} ${endpoint}`, data || '');

        const response = await fetch(url, options);
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `HTTP ${response.status}`;
            
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            
            throw new Error(errorMessage);
        }

        const result = await response.json();
        return result;
    }

    // Token management
    storeToken(token) {
        // In a real app, use httpOnly cookies for security
        // For demo purposes, using sessionStorage
        sessionStorage.setItem('chatflow_token', token);
    }

    getStoredToken() {
        return sessionStorage.getItem('chatflow_token');
    }

    clearStoredToken() {
        sessionStorage.removeItem('chatflow_token');
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

    showError(elementId, message) {
        console.log('Showing error:', elementId, message);
        const errorEl = document.getElementById(elementId);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.remove('hidden');
        }
    }

    hideError(elementId) {
        const errorEl = document.getElementById(elementId);
        if (errorEl) {
            errorEl.classList.add('hidden');
            errorEl.textContent = '';
        }
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
console.log('Creating ChatApp instance with real backend integration...');
const chatApp = new ChatApp();
window.chatApp = chatApp;