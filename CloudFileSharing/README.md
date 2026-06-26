# CloudVault — Premium Cloud File Sharing Platform

CloudVault is a secure, responsive, and modern cloud-based file storage and sharing application similar to Google Drive or Dropbox. Built on a premium tech stack, it features a glassmorphism dark mode UI, full JWT-based authentication, Mongoose modeling, and robust AWS S3 cloud integration.

## Key Features

- 📂 **File & Folder Management**: Create folders, upload files up to 100MB, move, rename, copy, duplicate, and delete files.
- 🔒 **Secure Public & Private Sharing**: Generate expiring share links, secure shares with passwords, and track view/download counts.
- ⭐ **Favorites & Trash**: Star important files for quick access, and soft-delete files with a 30-day auto-purge policy.
- 📊 **Storage Analytics**: Beautiful interactive dashboards detailing storage limit usage, quota breakdowns, and file type distributions.
- 🛡️ **Role-Based Admin Panel**: Control user states (active/deactive), view platform statistics, and search users.
- 🌓 **Themes & Responsiveness**: Smooth glassmorphism styling, animations via Framer Motion, and mobile-responsive dashboards.

---

## Technology Stack

### Frontend
- **React.js & Vite** for lightning-fast bundling and developer experience.
- **Tailwind CSS** for layout utility classes and premium aesthetics.
- **Framer Motion** for micro-interactions and page transitions.
- **React Router DOM** for route guarding (Private, Public, Admin).
- **Axios** for API orchestration with request/response interceptors.
- **React Hook Form** for robust and validated forms.
- **React Hot Toast** for beautiful user notifications.
- **Lucide Icons** for modern iconography.

### Backend
- **Node.js & Express.js** API framework.
- **MongoDB Atlas & Mongoose** for database management and object modeling.
- **JWT & Bcrypt** for secure registration, login, and token-based state.
- **AWS S3 SDK** for secure, high-performance cloud object storage.
- **Nodemailer** for email verifications and password reset links.
- **Helmet, CORS, Mongo-Sanitize, and Rate-Limit** for enterprise-grade security.

---

## Folder Structure

```
CloudFileSharing/
├── client/                     # Vite + React Frontend
│   ├── public/                 # Static public assets
│   └── src/
│       ├── components/         # Reusable UI & Layout Components
│       ├── context/            # Auth, Theme, Notification Contexts
│       ├── hooks/              # Custom Hooks (useAuth, useUpload, etc.)
│       ├── pages/              # Routing pages (Landing, Dashboard, etc.)
│       ├── services/           # Axios-based API services
│       ├── styles/             # Global CSS and Tailwind definitions
│       └── main.jsx / App.jsx  # App entry and Routing table
└── server/                     # Node.js + Express Backend
    ├── config/                 # DB, AWS, and SMTP Configs
    ├── controllers/            # Route handler logic
    ├── middlewares/            # Auth, RateLimiting, ErrorHandling
    ├── models/                 # Mongoose schemas
    ├── routes/                 # Express API routing tables
    ├── services/               # AWS S3 and Email service utilities
    ├── utils/                  # Cryptography and helper functions
    └── server.js               # Entry point
```

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local instance or MongoDB Atlas cluster connection URI)
- AWS S3 bucket and credentials (or mock credentials for dry run)
- SMTP Server (e.g. Gmail App Password or Mailtrap)

### Backend Setup
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Fill in the `.env` variables with your database, email host, and S3 credentials.
5. Start the server:
   - **Production**: `npm start`
   - **Development**: `npm run dev`

### Frontend Setup
1. Navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Build the application for production:
   ```bash
   npm run build
   ```

---

## API Documentation

### Auth Routes
- `POST /api/auth/register` - Create user account & send verification email.
- `POST /api/auth/login` - Authenticate credentials and return JWT.
- `POST /api/auth/logout` - Revoke current session.
- `GET /api/auth/verify/:token` - Verify email address.
- `POST /api/auth/forgot-password` - Request a password reset email.
- `POST /api/auth/reset-password/:token` - Reset user password.

### File Routes
- `POST /api/files` - Upload files (Multipart form data).
- `GET /api/files` - List paginated user files with sort/filter.
- `GET /api/files/:id` - Fetch details for a specific file.
- `PUT /api/files/:id` - Rename or move a file.
- `DELETE /api/files/:id` - Soft delete a file (moves to Trash).
- `GET /api/files/:id/download` - Fetch pre-signed download link.
- `POST /api/files/:id/favorite` - Star/unstar a file.
- `POST /api/files/:id/duplicate` - Duplicate file content in S3.
- `GET /api/files/trash` - List soft-deleted files.
- `POST /api/files/:id/restore` - Restore a file from trash.
- `DELETE /api/files/:id/permanent` - Permanently delete a file from database and S3.
- `DELETE /api/files/trash/empty` - Empty the trash bin entirely.

### Folder Routes
- `POST /api/folders` - Create a new folder.
- `GET /api/folders` - List directories.
- `DELETE /api/folders/:id` - Delete folder and nested files.

### Sharing Routes
- `POST /api/share` - Share a file (returns publicLink and token).
- `GET /api/share/:token` - Retrieve a shared file (public link landing).
- `PUT /api/share/:id` - Update permissions/password on share.
- `DELETE /api/share/:id` - Disable share link.

### Admin Routes
- `GET /api/admin/users` - Paginate/Search all registered users.
- `PUT /api/admin/users/:id/status` - Activate or deactivate a user account.
- `GET /api/admin/stats` - Fetch overall storage size and total files statistics.
