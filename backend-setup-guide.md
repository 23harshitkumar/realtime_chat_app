# MERN Stack Chat App with MongoDB Backend

## Project Structure
```
chatflow-app/
├── client/                 # React frontend (your current files)
│   ├── index.html
│   ├── style.css
│   └── app.js
├── server/                 # Node.js backend
│   ├── server.js          # Main server file
│   ├── models/            # MongoDB models
│   │   ├── User.js
│   │   ├── Room.js
│   │   ├── Message.js
│   │   └── RoomRequest.js
│   ├── routes/            # API routes
│   │   ├── auth.js
│   │   ├── rooms.js
│   │   └── messages.js
│   ├── middleware/        # Authentication middleware
│   │   └── auth.js
│   └── package.json
└── README.md
```

## Backend Setup Steps

### 1. Initialize Backend
```bash
mkdir chatflow-app
cd chatflow-app
mkdir server client
cd server
npm init -y
```

### 2. Install Dependencies
```bash
npm install express mongoose socket.io jsonwebtoken bcryptjs cors dotenv
npm install -D nodemon
```

### 3. Setup MongoDB Connection
- Create account at [MongoDB Atlas](https://cloud.mongodb.com)
- Create new cluster
- Get connection string
- Add to `.env` file

### 4. Environment Variables (.env)
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatapp
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
```

### 5. Update package.json scripts
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

## Key Features Fixed

### 1. Real Database Storage
- User accounts stored in MongoDB
- Rooms and messages persist
- Real authentication with JWT

### 2. Room Permission System
- Real-time permission requests via Socket.IO
- Host gets instant notifications
- Approve/reject functionality
- Visual notifications in chat interface

### 3. Real-time Features
- Live message updates
- Permission request notifications
- User presence indicators
- Typing indicators

## Running the Application

### Backend:
```bash
cd server
npm run dev
```

### Frontend:
Serve your HTML files via:
```bash
python -m http.server 8000
# or
npx http-server -p 8000
```

## MongoDB Schema Design

### Users Collection
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  avatar: String,
  createdAt: Date
}
```

### Rooms Collection
```javascript
{
  _id: ObjectId,
  name: String,
  createdBy: ObjectId (User ID),
  participants: [ObjectId],
  isPrivate: Boolean,
  createdAt: Date,
  lastActivity: Date
}
```

### Messages Collection
```javascript
{
  _id: ObjectId,
  roomId: ObjectId,
  userId: ObjectId,
  username: String,
  text: String,
  timestamp: Date,
  status: String
}
```

### Room Requests Collection
```javascript
{
  _id: ObjectId,
  roomId: ObjectId,
  userId: ObjectId,
  username: String,
  status: String, // 'pending', 'approved', 'rejected'
  requestedAt: Date,
  respondedAt: Date
}
```

## Socket.IO Events

### Room Permission Events
- `request-room-access` - User requests to join room
- `room-request-notification` - Notify room host of request
- `approve-room-request` - Host approves request
- `reject-room-request` - Host rejects request
- `room-access-granted` - User gets approval notification
- `room-access-denied` - User gets rejection notification

### Chat Events
- `join-room` - User joins approved room
- `leave-room` - User leaves room
- `send-message` - User sends message
- `receive-message` - Broadcast message to room
- `typing` - User typing indicator
- `stop-typing` - Stop typing indicator

This setup will give you a professional, production-ready chat application with real database persistence and working room permissions!