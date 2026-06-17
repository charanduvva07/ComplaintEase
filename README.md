# ComplaintEase – Advanced Complaint Management Platform

> A production-ready, full-stack MERN SaaS application for complaint registration, tracking, and resolution management — built for municipalities, universities, enterprises, and organizations.

[![Node.js](https://img.shields.io/badge/Node.js-v18+-brightgreen)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)](https://mongodb.com)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 🌟 Features

### For Users
- 📋 **Submit Complaints** with AI-powered auto-categorization (NLP keyword analysis)
- 📍 **Location Tagging** with urgency and category classification  
- 📎 **File Attachments** – images, PDFs, documents via Cloudinary
- 🔍 **Track Complaints** with a visual status timeline
- 💬 **Comment Thread** with real-time updates via Socket.io
- ⭐ **Rate Resolved Complaints** with satisfaction feedback
- 🔔 **Real-Time Notifications** via WebSocket
- 🌙 **Dark / Light Mode** with persistent theme preference

### For Administrators
- 📊 **Executive Dashboard** with KPIs, resolution rates, and monthly trends
- 📁 **Full Complaint Management** with advanced search, filters, and bulk actions
- 👥 **User Management** – activate, suspend, change roles
- 🏢 **Department Management** with performance leaderboard
- 📈 **Analytics** – monthly trends, category breakdown, resolution time analysis
- 📄 **Report Generation** – PDF + CSV exports
- 🕵️ **Audit Logs** – full trail of admin actions
- ⚡ **Bulk Operations** – bulk status update, priority change, assignment

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v4 |
| State Management | TanStack Query v5, React Context |
| Animations | Framer Motion |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Reports | jsPDF + AutoTable |
| Real-Time | Socket.io |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (HttpOnly cookie support) |
| File Storage | Cloudinary |
| Email | Nodemailer (SMTP) |
| Security | Helmet, CORS, Rate Limiting, Mongo Sanitize |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js v18+
- MongoDB (local) or MongoDB Atlas account
- Git

### 1. Clone
```bash
git clone https://github.com/yourusername/ComplaintEase.git
cd ComplaintEase
```

### 2. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your credentials (MongoDB URI, JWT secret, etc.)
```

### 3. Seed the Database (Recommended)
```bash
npm run seed
```
This creates sample departments, users, complaints, comments, and notifications.

**Seed credentials:**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@complaintease.com | Admin@123456 |
| Staff | john.staff@complaintease.com | Staff@123456 |
| User | bob.wilson@gmail.com | User@123456 |

### 4. Start Backend
```bash
npm run dev    # Nodemon (auto-restart)
# OR
npm start      # Production
```
API runs at: `http://localhost:5000`

### 5. Frontend Setup
```bash
cd ../client
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173`

---

## 📁 Project Structure

```
ComplaintEase/
├── server/
│   ├── config/          # DB connection
│   ├── controllers/     # Business logic
│   │   ├── authController.js
│   │   ├── complaintController.js
│   │   ├── adminController.js
│   │   └── userController.js
│   ├── middlewares/     # Auth, error handling
│   ├── models/          # Mongoose schemas
│   │   ├── User.js
│   │   ├── Complaint.js
│   │   ├── Comment.js
│   │   ├── Notification.js
│   │   ├── Department.js
│   │   ├── Report.js
│   │   └── ActivityLog.js
│   ├── routes/          # Express routers
│   ├── services/        # Email, notifications
│   ├── utils/           # Seed data
│   ├── server.js        # Entry point + Socket.io
│   └── .env.example
│
└── client/
    └── src/
        ├── components/
        │   ├── layout/  # Navbar, Sidebar, DashboardLayout
        │   └── ui/      # StatCard, CommentThread, etc.
        ├── contexts/    # Auth, Theme, Socket providers
        ├── pages/
        │   ├── auth/    # Login, Register, Forgot/Reset
        │   ├── user/    # Dashboard, Complaints, Profile
        │   └── admin/   # Dashboard, Users, Analytics, etc.
        ├── services/    # API calls (Axios)
        └── utils/       # Helpers, AI analyzer
```

---

## 🔑 Environment Variables

See [`server/.env.example`](./server/.env.example) for the full list with descriptions.

**Required variables:**
```
MONGO_URI      – MongoDB connection string
JWT_SECRET     – Minimum 32 character secret
CLIENT_URL     – Your frontend URL (CORS whitelist)
```

---

## 📡 API Reference

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password/:token` | Reset password |

### Complaints
| Method | Route | Description | Access |
|--------|-------|-------------|--------|
| POST | `/api/complaints` | Submit complaint | User |
| GET | `/api/complaints` | Get complaints (filtered) | Auth |
| GET | `/api/complaints/:id` | Get single complaint | Auth |
| PUT | `/api/complaints/:id` | Update complaint | Admin/Staff |
| DELETE | `/api/complaints/:id` | Delete complaint | Admin/Owner |
| POST | `/api/complaints/:id/comments` | Add comment | Auth |
| GET | `/api/complaints/:id/comments` | Get comments | Auth |
| POST | `/api/complaints/:id/rate` | Rate resolved complaint | User |

### Admin
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/dashboard` | Dashboard stats |
| GET | `/api/admin/analytics` | Analytics data |
| GET | `/api/admin/complaints` | All complaints with filters |
| PUT | `/api/admin/complaints/bulk` | Bulk update |
| GET | `/api/admin/users` | All users |
| PUT | `/api/admin/users/:id/status` | Toggle user status |
| PUT | `/api/admin/users/:id/role` | Change user role |
| GET/POST | `/api/admin/departments` | Manage departments |
| POST | `/api/admin/reports/generate` | Generate report |
| GET | `/api/admin/audit-logs` | Audit trail |

---

## ☁️ Deployment

### Frontend → Vercel
1. Push `client/` to GitHub
2. Import in Vercel → set framework to **Vite**
3. Set environment variable: `VITE_API_URL=https://your-backend.render.com`
4. Deploy

### Backend → Render
1. Push `server/` to GitHub (or use monorepo)
2. Create **Web Service** on Render
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `node server.js`
5. Add all environment variables from `.env.example`
6. Deploy

### Database → MongoDB Atlas
1. Create free cluster on [MongoDB Atlas](https://cloud.mongodb.com)
2. Add database user + whitelist Render's IP (or `0.0.0.0/0` for all)
3. Copy connection string to `MONGO_URI` env var

---

## 🔮 Future Roadmap

- [ ] **AI Integration**: OpenAI/Gemini for intelligent complaint routing and auto-response
- [ ] **Mobile App**: React Native companion app
- [ ] **SLA Enforcement**: Automatic escalation when SLA is breached
- [ ] **Multi-tenant**: Organization-level isolation for enterprise use
- [ ] **Public Portal**: Anonymous complaint submission with tracking ID
- [ ] **SMS Notifications**: Twilio integration for SMS alerts
- [ ] **Geolocation**: Map-based complaint visualization
- [ ] **Webhooks**: Integration with external systems (Slack, Jira, etc.)

---

## 📝 License

MIT License – feel free to use for personal and commercial projects.

---

<p align="center">Built with ❤️ using the MERN stack</p>
