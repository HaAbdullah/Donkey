# Donkey Game - Setup and Run Commands

## Prerequisites
- Node.js installed on your computer
- All devices must be on the same WiFi network

## Setup (First Time Only)

### Backend Setup
```bash
cd "C:\Users\abdul\All\Donkey\server"
npm install
```

### Frontend Setup
```bash
cd "C:\Users\abdul\All\Donkey\client"
npm install
```

## Running the Game

### 1. Start the Backend Server (Required)
```bash
cd "C:\Users\abdul\All\Donkey\server"
npm start
```
- This will start the game server on port 3001
- You'll see: "Server running on port 3001"
- Leave this terminal window open while playing

### 2. Start the Frontend Client (Required)
```bash
cd "C:\Users\abdul\All\Donkey\client"
npm run dev -- --host
```
- This will start the React app with network access
- You'll see something like:
  ```
  Local:   http://localhost:5173/
  Network: http://10.0.0.75:5173/
  ```
- Leave this terminal window open while playing

## Playing the Game

### For You (Host)
- Open: http://localhost:5173/

### For Friends on Same Network
- Give them the Network URL: **http://10.0.0.75:5173/**
- (Replace 10.0.0.75 with your actual IP address shown in the terminal)

## Finding Your IP Address (If Needed)
```bash
ipconfig
```
Look for "IPv4 Address" under your WiFi adapter.

## Troubleshooting

### If Port is Already in Use
- Frontend: The system will automatically try port 5174, 5175, etc.
- Backend: Stop any other Node processes or restart your computer

### If Friends Can't Connect
1. Make sure both servers are running
2. Check that all devices are on the same WiFi
3. Try disabling Windows Firewall temporarily
4. Make sure you're using the correct IP address

### If Game Won't Load
1. Check that both terminal windows are still running
2. Try refreshing the browser page
3. Check the browser console for errors (F12)

## Stopping the Servers
- Press `Ctrl+C` in each terminal window to stop the servers
- Or just close the terminal windows

## Quick Start (Copy-Paste Commands)

**Terminal 1 (Backend):**
```bash
cd "C:\Users\abdul\All\Donkey\server" && npm start
```

**Terminal 2 (Frontend):**
```bash
cd "C:\Users\abdul\All\Donkey\client" && npm run dev -- --host
```

Then share the Network URL with your friends!