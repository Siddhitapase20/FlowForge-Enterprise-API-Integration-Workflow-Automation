# ⚡ FlowForge – Enterprise API Integration & Workflow Automation Platform

A full-stack workflow automation platform built with **React.js**, **Node.js**, **Express.js** using **Event-Driven + Client-Server Architecture**.

---

## 📁 Folder Structure

```
flowforge/
├── backend/
│   ├── data/
│   │   └── store.js          # In-memory database with seed data
│   ├── engine/
│   │   └── workflowEngine.js # Event-driven workflow execution engine
│   ├── middleware/
│   │   └── auth.js           # JWT-style auth + RBAC middleware
│   ├── routes/
│   │   ├── auth.js           # Login, logout, /me
│   │   ├── workflows.js      # CRUD for workflows
│   │   ├── events.js         # Event trigger endpoint
│   │   ├── logs.js           # Execution logs
│   │   ├── integrations.js   # Integration connect/disconnect
│   │   └── analytics.js      # Summary stats + tenant management
│   ├── server.js             # Express app entry point
│   └── package.json
│
├── frontend/
│   └── index.html            # Single-file React frontend (all-in-one)
│
└── README.md
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v16+ (https://nodejs.org)
- npm (comes with Node.js)

---

### Option A – Run with Backend (Full Stack)

**Step 1: Install backend dependencies**
```bash
cd flowforge/backend
npm install
```

**Step 2: Start the backend server**
```bash
npm start
# or for auto-reload during development:
npm run dev
```

You should see:
```
✅ FlowForge backend running on http://localhost:3001
   API base: http://localhost:3001/api
   Frontend: http://localhost:3001
```

**Step 3: Open in browser**
```
http://localhost:3001
```

> The backend serves the frontend automatically from the `/frontend` folder.

---

### Option B – Frontend Only (No Backend Needed)

Just open the HTML file directly in any browser:
```
flowforge/frontend/index.html
```
Double-click it or drag it into Chrome/Firefox/Edge.

> All data is seeded in-memory. No server required.

---

## 🔐 Demo Login Credentials

| Role    | Email                    | Password     |
|---------|--------------------------|--------------|
| Admin   | admin@flowforge.io       | admin123     |
| Manager | manager@flowforge.io     | manager123   |
| User    | user@flowforge.io        | user123      |
| CEO     | ceo@globalent.io         | ceo123       |

---

## 🔌 API Endpoints (Backend)

### Auth
| Method | Endpoint           | Description         |
|--------|--------------------|---------------------|
| POST   | /api/auth/login    | Login with email+pw |
| POST   | /api/auth/logout   | Logout session      |
| GET    | /api/auth/me       | Get current user    |

### Workflows
| Method | Endpoint               | Description              |
|--------|------------------------|--------------------------|
| GET    | /api/workflows         | List all workflows       |
| GET    | /api/workflows/:id     | Get single workflow      |
| POST   | /api/workflows         | Create workflow          |
| PATCH  | /api/workflows/:id     | Update workflow          |
| DELETE | /api/workflows/:id     | Delete workflow          |

### Events
| Method | Endpoint               | Description              |
|--------|------------------------|--------------------------|
| POST   | /api/events/trigger    | Fire a trigger event     |

### Logs
| Method | Endpoint               | Description              |
|--------|------------------------|--------------------------|
| GET    | /api/logs              | Get execution logs       |
| DELETE | /api/logs              | Clear all logs (Admin)   |

### Integrations
| Method | Endpoint                       | Description           |
|--------|--------------------------------|-----------------------|
| GET    | /api/integrations              | List integrations     |
| PATCH  | /api/integrations/:id/toggle   | Connect/disconnect    |

### Analytics
| Method | Endpoint                  | Description              |
|--------|---------------------------|--------------------------|
| GET    | /api/analytics/summary    | Dashboard stats          |
| GET    | /api/analytics/tenants    | List tenants (Admin)     |

---

## ✨ Features

### Core Features
- ✅ **User Authentication** – Login/Logout with session tokens
- ✅ **Role-Based Access Control** – Admin, Manager, User roles
- ✅ **Dashboard** – Live stats, quick triggers, activity feed
- ✅ **Workflow Builder** – 3-step wizard (trigger → actions → configure)
- ✅ **Workflow Management** – List, pause, resume, delete workflows
- ✅ **Event Simulator** – Fire any trigger with one click or custom JSON payload
- ✅ **Integration Module** – 10 mock integrations (Shopify, Stripe, Slack, etc.)
- ✅ **Workflow Engine** – Executes matching workflows on trigger events
- ✅ **Notification System** – Toast notifications for all actions
- ✅ **Logs & Monitoring** – Filterable execution log with status, duration, timestamps
- ✅ **Analytics Dashboard** – Bar chart, top workflows, health matrix

### Advanced Features
- ✅ **Multi-Tenant Support** – Isolated workspaces per company
- ✅ **Error Handling with Retry** – Configurable auto-retry (1–5 attempts)
- ✅ **Event-Driven Architecture** – Parallel workflow execution on triggers
- ✅ **In-Memory Database** – No setup required, pre-seeded with demo data
- ✅ **REST API** – Full Express.js backend with proper routing
- ✅ **CORS Enabled** – Frontend and backend can run separately

---

## 🏗️ Architecture

```
[Browser / Frontend]
       ↓  HTTP REST calls
[Express.js Backend :3001]
       ↓
  ┌─────────────────────┐
  │   Route Handlers    │
  │  auth / workflows   │
  │  events / logs      │
  └─────────┬───────────┘
            ↓
  ┌─────────────────────┐
  │  Workflow Engine    │  ← Event-Driven Core
  │  triggerEvent()     │
  │  executeWorkflow()  │
  └─────────┬───────────┘
            ↓
  ┌─────────────────────┐
  │  In-Memory Store    │
  │  users / workflows  │
  │  logs / sessions    │
  └─────────────────────┘
```

**Event Flow:**
```
User fires event
    → POST /api/events/trigger
    → workflowEngine.triggerEvent()
    → Finds all matching active workflows
    → Executes each workflow (parallel)
    → Each action runs in sequence with retry
    → Logs result to store
    → Returns response to client
```

---

## 🛠️ Tech Stack

| Layer        | Technology                    |
|--------------|-------------------------------|
| Frontend     | React 18, HTML5, CSS3         |
| Backend      | Node.js, Express.js           |
| Architecture | Event-Driven + Client-Server  |
| Database     | In-Memory (JavaScript object) |
| Fonts        | Inter, JetBrains Mono         |
| Auth         | Token-based (UUID sessions)   |

---

## 📝 Notes for Academic Submission

- All mock integrations simulate real API calls with artificial delays
- The workflow engine has a ~7% simulated failure rate to demonstrate retry logic
- Multi-tenant isolation is enforced at every API endpoint
- No external database is required – everything runs in-memory
- The frontend works standalone (open index.html) or served by Express
