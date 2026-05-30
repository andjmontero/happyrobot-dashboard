# HappyRobot Dashboard

Frontend dashboard for the HappyRobot Inbound Carrier Sales automation system. Built with React, TypeScript, and Vite. Deployed on Firebase Hosting.

## Live Demo

```
https://happyrobot-dashboard-ee212.web.app
```

## Overview

This dashboard provides visibility into the AI-driven inbound carrier sales agent. It displays:

- Call volume and outcomes
- Carrier sentiment analysis
- Negotiation results and accepted rates
- Load booking metrics

## Running Locally

### Prerequisites

- Node.js 18+
- npm

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/andjmontero/happyrobot-dashboard.git
cd happyrobot-dashboard

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

## Deploying to Firebase Hosting

### Prerequisites

- Firebase CLI: `npm install -g firebase-tools`
- Access to the Firebase project

### Steps

```bash
# 1. Build the project
npm run build

# 2. Login to Firebase
firebase login

# 3. Deploy
firebase deploy
```

## Tech Stack

- **Framework:** React + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Hosting:** Firebase Hosting
- **Backend API:** [happyrobot-api](https://github.com/andjmontero/happyrobot-api)
