# NoteApp

A full-featured note-taking app built with React, Node.js, and MongoDB.

## Features
- ✍️ Create, edit, and delete notes
- 🎤 Voice-to-text note input
- 🌙 Dark mode toggle
- 🎨 Color tags for notes (user-selectable)
- 📌 Pin/favorite notes (pinned notes appear at the top)
- 🔍 Search with keyword highlighting (title & content)
- 📝 Rich text editing (if enabled)
- 💾 Auto-save notes
- 🏷️ Animated transitions (Framer Motion)
- 🔑 Forgot password (email reset link)
- 📧 (Optional) Email verification

## Tech Stack
- **Frontend:** React, Vite, Framer Motion
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Auth:** JWT, bcryptjs
- **Email:** Nodemailer

## Getting Started

### Prerequisites
- Node.js & npm
- MongoDB (local or Atlas)

### Setup
1. **Clone the repo:**
   ```sh
   git clone https://github.com/YOUR_USERNAME/noteapp.git
   cd noteapp
   ```
2. **Install dependencies:**
   ```sh
   cd client && npm install
   cd ../server && npm install
   ```
3. **Configure environment variables:**
   - In `server/`, create a `.env` file:
     ```env
     JWT_SECRET=your_jwt_secret
     EMAIL_USER=your_email@gmail.com
     EMAIL_PASS=your_email_password_or_app_password
     BASE_URL=http://localhost:5173
     MONGODB_URI=your_mongodb_connection_string
     ```
4. **Start the app:**
   - In one terminal:
     ```sh
     cd server
     npm start
     ```
   - In another terminal:
     ```sh
     cd client
     npm run dev
     ```
5. **Visit:** [http://localhost:5173](http://localhost:5173)

## Deployment
- Push to GitHub as described above.
- Deploy frontend to Vercel/Netlify and backend to Render/Heroku or your own server.

## License
MIT
