# BizDirectory - Business Directory Web Application

A complete, scalable, production-ready **Business Directory Web Application** built with Node.js, Express, MongoDB, Next.js, and Tailwind CSS. Runs entirely on free-tier services.

---

## Features

### For Users
- Register and login with secure JWT + HttpOnly cookies
- Browse and search businesses (keyword, category, city)
- View detailed business profiles with images, contact info, and directions
- Create, edit, and delete your own business listings
- Upload business images (via Cloudinary)
- Leave reviews and ratings (1-5 stars)
- Manage profile and avatar

### For Admins
- Admin dashboard with application statistics
- Approve, reject, or delete business listings
- Manage all users (view, change roles, delete)
- Remove inappropriate reviews
- View all pending businesses

---

## Technology Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express.js | API framework |
| MongoDB (Atlas Free) | Database |
| Mongoose | ODM |
| JWT + bcryptjs | Authentication |
| Cloudinary (Free) | Image storage |
| multer + multer-storage-cloudinary | File upload |
| helmet, cors, rate-limit | Security |
| express-mongo-sanitize | NoSQL injection prevention |
| sanitize-html | XSS prevention |
| express-validator | Input validation |

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 14+ (App Router) | React framework |
| Tailwind CSS | Styling |
| lucide-react | Icons |
| react-hot-toast | Notifications |

---

## Folder Structure

```
website/
├── backend/
│   ├── config/
│   │   ├── db.js                # MongoDB connection
│   │   └── cloudinary.js        # Cloudinary config
│   ├── controllers/
│   │   ├── authController.js    # Register, login, etc.
│   │   ├── businessController.js# Business CRUD
│   │   ├── reviewController.js  # Reviews CRUD
│   │   └── adminController.js   # Admin operations
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── Business.js          # Business model
│   │   └── Review.js            # Review model
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── businessRoutes.js
│   │   ├── reviewRoutes.js
│   │   └── adminRoutes.js
│   ├── middlewares/
│   │   ├── auth.js              # JWT verification
│   │   ├── authorize.js         # Role-based access
│   │   ├── upload.js            # Multer/Cloudinary
│   │   └── errorHandler.js      # Central error handler
│   ├── utils/
│   │   ├── asyncHandler.js
│   │   ├── generateToken.js     # JWT + cookie
│   │   ├── validators.js        # Input validation rules
│   │   └── seedAdmin.js         # Admin seeder script
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── app/
    │   ├── page.tsx             # Home
    │   ├── businesses/
    │   │   ├── page.tsx         # Directory
    │   │   └── [id]/page.tsx    # Business details
    │   ├── categories/page.tsx
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   ├── register/page.tsx
    │   │   ├── forgot-password/page.tsx
    │   │   └── reset-password/page.tsx
    │   ├── add-business/page.tsx
    │   ├── dashboard/
    │   │   ├── page.tsx
    │   │   ├── profile/page.tsx
    │   │   └── businesses/[id]/page.tsx
    │   └── admin/page.tsx
    ├── components/
    │   ├── layout/              # Navbar, Footer
    │   ├── ui/                  # Forms, dashboard
    │   ├── business/            # Cards, forms, detail
    │   └── admin/               # Admin dashboard
    ├── contexts/
    │   └── AuthContext.jsx      # Auth state
    ├── lib/
    │   └── api.js               # API client
    └── .env.local
```

---

## Installation & Setup

### Prerequisites
- Node.js >= 18
- npm
- A MongoDB Atlas account (free tier)
- A Cloudinary account (free tier)

### 1. Clone or setup

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Backend Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
NODE_ENV=development
PORT=5000

# MongoDB Atlas free tier
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/business-directory

# JWT
JWT_SECRET=your_super_strong_jwt_secret_at_least_32_characters
JWT_EXPIRE=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Cloudinary free tier
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Admin seed (never hardcoded in source)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourStrongPassword123!
ADMIN_NAME=Super Admin
```

### 3. Frontend Environment

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Seed Admin User

```bash
cd backend
npm run seed:admin
```

### 5. Run Development Servers

**Backend** (Terminal 1):
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Frontend** (Terminal 2):
```bash
cd frontend
npm run dev
# App runs on http://localhost:3000
```

---

## MongoDB Atlas Setup (Free)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) → Create free account
2. Create a free M0 cluster
3. Create a database user
4. Whitelist your IP (0.0.0.0/0 for development)
5. Get the connection string and put it in `MONGO_URI`

> **Free tier limit**: 512MB storage, shared RAM. Sufficient for development and small production workloads.

---

## Cloudinary Setup (Free)

1. Go to [cloudinary.com](https://cloudinary.com) → Create free account
2. Find your Cloud Name, API Key, API Secret in the dashboard
3. Add them to `.env`

> **Free tier limit**: 25 credits/month (~25,000 image transformations or ~25GB bandwidth). Sufficient for development.

---

## API Routes

### Authentication
```
POST   /api/auth/register       Register new user
POST   /api/auth/login          Login
POST   /api/auth/logout         Logout (clears cookie)
GET    /api/auth/me             Get current user
POST   /api/auth/forgot-password  Request reset link
POST   /api/auth/reset-password   Reset with token
PATCH  /api/auth/change-password  Change password (auth required)
PATCH  /api/auth/update-profile   Update name/avatar (auth required)
```

### Businesses
```
GET    /api/businesses          List approved businesses (search, filter, paginate)
GET    /api/businesses/:id      Single business details + reviews
GET    /api/businesses/my       My businesses (auth required)
POST   /api/businesses          Create business (auth required)
PATCH  /api/businesses/:id      Update business (owner/admin)
DELETE /api/businesses/:id      Delete business (owner/admin)
DELETE /api/businesses/:id/images/:publicId  Delete image
```

### Reviews
```
GET    /api/businesses/:id/reviews   Get reviews for business
POST   /api/businesses/:id/reviews   Create review (auth required)
PATCH  /api/reviews/:id              Update own review (auth required)
DELETE /api/reviews/:id              Delete review (author/admin)
```

### Admin (Admin role required)
```
GET    /api/admin/dashboard                  Statistics
GET    /api/admin/users                      All users
GET    /api/admin/businesses                 All businesses
GET    /api/admin/businesses/pending         Pending businesses
PATCH  /api/admin/businesses/:id/approve     Approve
PATCH  /api/admin/businesses/:id/reject      Reject
DELETE /api/admin/businesses/:id             Delete
PATCH  /api/admin/users/:id/role             Change user role
DELETE /api/admin/users/:id                  Delete user
GET    /api/admin/reviews                    All reviews
```

---

## Security Architecture

- **Passwords**: bcryptjs with 12 salt rounds
- **JWT**: HttpOnly secure cookies — never localStorage
- **JWT payload**: Only `{ id, role }` — no sensitive data
- **Role verification**: Always from DB (`req.user.role`), never from request body
- **Input validation**: express-validator on all endpoints
- **NoSQL injection**: express-mongo-sanitize
- **XSS prevention**: sanitize-html
- **Rate limiting**: Separate limits for general, auth, and password reset
- **CORS**: Restricted to configured frontend URL only
- **Helmet**: Secure HTTP headers
- **Body limit**: 10kb max request body

---

## Deployment (Free Tier)

### Frontend → Vercel
1. Push frontend to GitHub
2. Connect to [vercel.com](https://vercel.com) (free)
3. Set environment variable: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api`

### Backend → Render / Railway
1. Push backend to GitHub
2. Connect to [render.com](https://render.com) (free tier available - check current limits)
3. Set all environment variables in the dashboard
4. Set `FRONTEND_URL` to your Vercel URL
5. Set `NODE_ENV=production`

> ⚠️ **Free tier warning**: Free hosting platforms may spin down inactive services. Check current availability and limits at deployment time.

### Database → MongoDB Atlas (Free M0)
- Already covered above
- Whitelist your backend host IP in MongoDB Atlas Network Access

### Images → Cloudinary (Free)
- Already covered above

---

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` (32+ characters)
- [ ] Set correct `FRONTEND_URL` for CORS
- [ ] Enable HTTPS on backend (handled by Render/Railway)
- [ ] Set MongoDB Atlas network access correctly
- [ ] Configure Cloudinary folder names
- [ ] Run `npm run seed:admin` to create first admin

---

## License

MIT License — Free to use and modify.
