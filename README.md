# 🎓 MANIT Messenger - WhatsApp for Students

A premium, real-time messaging platform designed specifically for the students of **Maulana Azad National Institute of Technology (MANIT), Bhopal**. This app integrates directly with the MANIT ERP system for seamless authentication and profile synchronization.

![MANIT Chat App](https://raw.githubusercontent.com/naitik23verma/manit-chat-app/main/public/index.html) *(Replace with actual screenshot link after deployment)*

## 🚀 Key Features

- **🔐 ERP Authentication**: Secure login using MANIT scholar numbers and ERP passwords via a backend proxy.
- **🖼️ Profile Sync**: Automatically fetches and serves student profile pictures (DPs) through a backend proxy to solve SSL/CORS issues.
- **💬 Real-Time Messaging**: Built with **Socket.io** for instant communication with zero latency.
- **👥 Private & Public Groups**:
  - **Public Lounge**: An open space for all students to connect.
  - **Private Teams**: Create restricted groups by selecting specific members. Groups are only visible to their participants.
- **📱 Ultra-Responsive UI**: A sleek, dark-themed experience inspired by WhatsApp, optimized for desktop, tablets, and mobile devices.
- **🔄 Session Persistence**:
  - **MongoDB Integration**: Robust storage for messages, users, and groups.
  - **Demo Fallback**: A local JSON persistence layer (`demo_persistence.json`) ensures data survives server restarts even without a live DB connection.
- **🚪 Logout & Account Switching**: Easily switch between identities to manage different student profiles.

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, Socket.io, Mongoose, Axios, JWT.
- **Frontend**: Vanilla JavaScript, HTML5, CSS3 (Custom Design System).
- **Database**: MongoDB (with local JSON fallback).
- **Icons**: FontAwesome 6.0.

## ⚙️ Local Setup

1. **Clone the repo**:
   ```bash
   git clone https://github.com/naitik23verma/manit-chat-app.git
   cd manit-chat-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Create a `.env` file in the root directory:
   ```env
   PORT=9000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   ```

4. **Start the server**:
   ```bash
   node index.js
   ```

5. **Visit the app**:
   Open [http://localhost:9000](http://localhost:9000) in your browser.

## 📤 Deployment

This app is designed to be deployed on **Render** (monolith) or **Vercel + Render** (split).

- **Continuous Running**: Use a keep-alive service (like Cron-job.org) to ping your Render URL every 10 minutes to prevent the free tier from sleeping.
- **Build Command**: `npm install`
- **Start Command**: `node index.js`

---
**Created with ❤️ by Naitik Verma**
