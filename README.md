# ASVILLA — Luxury Hotel Booking Platform (Enhanced)

> **"Your Stay, Your Comfort, Your Way."**

ASVILLA is a full-stack luxury hotel reservation platform. This enhanced release introduces **Pay at Hotel (Cash on Delivery / COD)** payment workflows, official **MongoDB Atlas** Mongoose schemas and connection management, resolved booking validation pipelines, and an organized codebase split between `frontend/` and `backend/`.

---

## 🌟 Key Updates in this Release

1. **Browser Back Button, Forward Button & Page Refresh Resilience**:
   - Implemented a seamless URL hash-based router synchronizer in `src/App.tsx`.
   - Browser Back and Forward buttons navigate between views (`#/`, `#/explore`, `#/hotel/:id`, `#/my-bookings`, `#/profile`, `#/admin`, `#/about`, `#/contact`, `#/policy/:type`) without exiting or breaking the application.
   - Page refresh (F5 / Cmd+R) preserves the active page, hotel details ID, search query filters, and itinerary state without resetting to home.
   - Resolved duplicate booking risks: confirmed bookings immediately synchronize URL to `#/my-bookings`, preventing duplicate form submissions upon browser refresh.

2. **Verified Property Host & Owner Details**:
   - Every ASVILLA property now features comprehensive, verified property host & management credentials (General Manager / Estate Director name, verified badge, direct mobile number, reception desk extension, official property email, languages, years of luxury hospitality experience, and bespoke check-in arrival notes).
   - Displayed on **Hotel Details Page**, **Printable Voucher Modal**, **My Bookings reservation cards**, and included in API responses and database models.
   - Clickable `tel:` and `mailto:` links allow guests to reach their host directly upon arrival.

3. **Luxury Automated Email Notifications & Digital Previews**:
   - Implemented `backend/services/emailService.ts` providing responsive, branded HTML email templates for all reservations.
   - Automatically dispatches confirmation notifications upon reservation creation (both COD Pay at Hotel and Razorpay Online).
   - Real-time in-app **Confirmation Email Preview Modal** (`EmailPreviewModal.tsx`) allowing guests to inspect the exact email delivered to their inbox.
   - **On-Demand Email Resend**: `POST /api/bookings/:id/resend-email` with 1-click resend actions available on vouchers and booking cards.
   - Cancellation notifications with automated refund updates.

4. **Cash on Delivery / Pay at Hotel (COD) & Razorpay Online**:
   - Preserved and enhanced dual payment methods: **Option A (COD / Pay at Hotel)** with pending confirmation status and zero upfront charge, and **Option B (Pay Online via Razorpay)** with cryptographic HMAC SHA-256 signature verification.

5. **MongoDB Atlas Integration with Resilient Fallback**:
   - Complete Mongoose schemas for `Hotel`, `Room`, `Booking`, and `User`.
   - Connects to MongoDB Atlas via `MONGODB_URI`, with automatic failover to the persistent document store (`.data/asvilla_db.json`).

---

## 📁 Project Architecture

```
ASVILLA/
├── backend/
│   ├── config/
│   │   └── db.ts                # MongoDB Atlas & resilient document store connection
│   ├── controllers/
│   │   ├── authController.ts    # User register, login, profile management
│   │   ├── bookingController.ts # COD & online booking creation, cancellation
│   │   └── hotelController.ts   # Hotel queries, room enrichment, availability
│   ├── middleware/
│   │   ├── authMiddleware.ts    # JWT token verification & role enforcement
│   │   └── errorHandler.ts      # Centralized error handler & structured logging
│   ├── models/
│   │   ├── Booking.ts           # Mongoose Booking schema (COD, Online, items)
│   │   ├── Hotel.ts             # Mongoose Hotel & Room schemas
│   │   └── User.ts              # Mongoose User schema with role-based auth
│   ├── routes/
│   │   ├── authRoutes.ts        # /api/auth endpoints
│   │   ├── bookingRoutes.ts     # /api/bookings & cancellation endpoints
│   │   └── hotelRoutes.ts       # /api/hotels & room queries
│   ├── server.ts                # Standalone backend server entry point
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── frontend/
│   ├── package.json
│   └── .env.example
├── src/                         # Full React 19 + Tailwind CSS frontend
│   ├── components/
│   │   ├── BookingModal.tsx     # Booking wizard with COD & Online selector
│   │   ├── RazorpayModal.tsx    # Razorpay online payment checkout
│   │   ├── VoucherModal.tsx     # Printable PDF confirmation voucher
│   │   ├── HotelCard.tsx        # Luxury property cards
│   │   ├── Navbar.tsx           # Sticky luxury header with demo quick-logins
│   │   └── Footer.tsx           # Policies, contacts & quick links
│   ├── pages/
│   │   ├── HomePage.tsx         # Hero search, destinations, featured hotels
│   │   ├── ExplorePage.tsx      # Comprehensive multi-filter search
│   │   ├── HotelDetailsPage.tsx # Gallery, suite types, reviews, policies
│   │   ├── MyBookingsPage.tsx   # Guest reservation management & cancellation
│   │   ├── ProfilePage.tsx      # Guest profile & security
│   │   ├── AdminDashboardPage.tsx # Executive metrics & hotel management
│   │   ├── AboutPage.tsx        # Brand philosophy & standards
│   │   └── ContactPage.tsx      # Persistent concierge messaging
│   ├── services/
│   │   └── api.ts               # Typed client API with JWT auth headers
│   ├── context/
│   │   └── AuthContext.tsx      # Global authentication state
│   └── types/
│       └── index.ts             # Shared TypeScript interfaces
├── server.ts                    # Root full-stack Express + Vite dev server
├── package.json
└── README.md
```

---

## 🔑 Demo Credentials

| Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Guest Member** | `guest@asvilla.com` | `guest123` | Personal bookings, Pay at Hotel, Voucher printing |
| **Administrator** | `admin@asvilla.com` | `admin123` | Executive Dashboard, Catalog Management, Revenue Reports |

*Tip: Click `[Demo Guest]` or `[Demo Admin]` in the top header for instant 1-click test credentials.*

---

## 💳 Payment Options

### 1. Pay at Hotel (Cash on Delivery / COD)
- **Workflow**: The guest reserves a suite immediately without making an online transaction.
- **Booking Status**: `pending_confirmation`
- **Payment Status**: `unpaid`
- **Settlement**: Settle in Cash, Card, or UPI upon physical check-in at the hotel desk.

### 2. Pay Online (Razorpay Gateway)
- **Workflow**: Creates a cryptographically verified order and confirms booking upon HMAC SHA-256 digital signature validation.
- **Booking Status**: `confirmed`
- **Payment Status**: `paid` / `success`

---

## 🛠️ API Endpoints

- `GET /api/health` — Check backend and database status (MongoDB Atlas vs fallback).
- `GET /api/hotels` — List hotels with enriched room objects, search, filter, and pagination.
- `GET /api/hotels/:id` — Retrieve one hotel with rooms and reviews.
- `POST /api/bookings` — Validate and create a booking (`paymentMethod: 'COD' | 'ONLINE'`).
- `GET /api/bookings/:id` — Retrieve a single booking with authorization.
- `GET /api/my-bookings` — Retrieve the authenticated user's bookings.
- `PATCH /api/bookings/:id/cancel` — Cancel an eligible booking according to policy.
- `POST /api/payments/create-order` — Create Razorpay order (Online mode).
- `POST /api/payments/verify` — Verify Razorpay HMAC signature and confirm booking.
- `GET /api/availability` — Real-time room availability calculation for dates.
