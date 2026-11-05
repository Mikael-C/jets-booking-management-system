# Orbelo Private Jet Booking Management System — Backend API

Production-ready Node.js & Express REST API for the **Orbelo Private Jet Booking Management System**, engineered for deployment on **Render.com** and connected to MongoDB Atlas.

---

## 🛩️ Core Features

- **Authentication & RBAC**: JWT Access (15m) & Refresh Tokens (7d), bcrypt password hashing, and 5 granular roles (`super_admin`, `admin`, `finance`, `operations`, `agent`).
- **Full Booking Management**: Complete state machine transitions, dispatch checklists, multi-leg flights, dynamic pricing, and card processing fee calculators.
- **Avinode Integration**: Deep integration with the Avinode charter marketplace API:
  - Flight trip availability searches
  - RFQ dispatch to network operators
  - Quote calculation and marketplace quote querying
  - Trip booking confirmation
  - Operator and aircraft database lookups
  - In-app operator-to-broker messaging threads
  - Built-in high-fidelity **Mock Mode** (`AVINODE_MOCK_MODE=true`) for seamless development without paid API credentials.
- **Jet Interior & Exterior Image Feeds**:
  - Unsplash & Pexels API integration to pull high-res exterior tarmac shots and luxury cabin interiors for any aircraft model.
  - Cloudinary upload pipeline for private fleet photography.
  - Curated high-res aviation fallbacks when external APIs are not configured.
- **Aviation PDF Engine (PDFKit)**:
  - Charter Quotation PDFs with branding and itemized breakdown
  - VAT & Tax Invoices with European aviation exemption compliance
  - Flight Briefs with crew, handling agents, and passenger manifest
  - Legally binding Charter Broker Agreements with signature blocks
  - APIS-ready Passenger Manifest documents
  - Credit Notes with accounting audit trails
- **Deterministic Pricing Service**: Exact mirror of frontend nautical mile calculations, cruise speeds, landing/handling fees, carbon offsets, and de-icing insurance.
- **Audit Logging & Security**: Automatic immutable event logging for all bookings, payments, compliance updates, and auth attempts.
- **Render.com Ready**: Pre-configured `render.yaml` for one-click deployment.

---

## 📁 Architecture Overview

```
backend/
├── src/
│   ├── config/
│   │   ├── avinode.js          # Avinode API config & mock flags
│   │   ├── cloudinary.js       # Cloudinary SDK & Multer storage
│   │   ├── database.js         # Mongoose connection with retry & event listeners
│   │   └── jwt.js              # Token signing, verification, and rotation
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication & role-based access control
│   │   ├── errorHandler.js     # Centralized error handler with Mongoose & Joi parsing
│   │   ├── logger.js           # Winston logger with colorized console output
│   │   ├── rateLimiter.js      # Express rate limiters for API, auth, and PDF routes
│   │   └── validate.js         # Joi request schema validation
│   ├── models/
│   │   ├── AgentRequest.js     # Broker RFQ & quotation requests
│   │   ├── Aircraft.js         # Fleet catalog with specs & cabin images
│   │   ├── AuditLog.js         # Immutable security & business audit trail
│   │   ├── Booking.js          # Master booking, legs, checklist, & pricing model
│   │   ├── Client.js           # HNWI & corporate client records with VIP tiers
│   │   ├── Notification.js     # Internal notifications & dispatch alerts
│   │   ├── Operator.js         # Aircraft operators & AOC compliance checklists
│   │   ├── SourcingOption.js   # Sourcing quotes per trip
│   │   └── User.js             # Team members & agents with hashed credentials
│   ├── routes/
│   │   ├── agentRequests.js    # RFQ queue, messaging, and fulfillment
│   │   ├── airports.js         # 160+ private aviation airports lookup & search
│   │   ├── auditLog.js         # System audit query API
│   │   ├── auth.js             # Login, token refresh, logout, profile
│   │   ├── avinode.js          # Avinode marketplace proxy routes
│   │   ├── bookings.js         # CRUD, status transitions, dispatch checklist
│   │   ├── clients.js          # Client CRM & booking history
│   │   ├── dashboard.js        # KPI ribbons, revenue trends, and operational alerts
│   │   ├── documents.js        # PDF generation & downloads
│   │   ├── fleet.js            # Aircraft specs, range, and image uploads
│   │   ├── jetImages.js        # Unsplash/Pexels interior & exterior photo search
│   │   ├── notifications.js    # Team notifications & unread badge counters
│   │   ├── operators.js        # Operator qualification, AOC tracking, & expiry alerts
│   │   ├── payments.js         # Payment recording, wire/card fees, receipts
│   │   ├── quotes.js           # Quote generation, revision versioning, email sending
│   │   └── sourcing.js         # Multi-operator sourcing management
│   ├── services/
│   │   ├── auditService.js     # Central audit recorder
│   │   ├── avInodeService.js   # Live API client + realistic mock fallback
│   │   ├── emailService.js     # Nodemailer HTML templates for quotes & updates
│   │   ├── jetImagesService.js # Unsplash/Pexels multi-source image resolution
│   │   ├── notificationService.js # Role-targeted dispatch alerts
│   │   ├── pdfService.js       # Production PDFKit document renderers
│   │   └── pricingService.js   # Aviation calculations (NM, flight times, taxes)
│   ├── utils/
│   │   ├── airportData.js      # Global private jet airports database (ICAO/IATA)
│   │   ├── dateUtils.js        # Aviation date/time formatters
│   │   └── generateId.js       # Trip numbers, invoice references, account IDs
│   ├── scripts/
│   │   └── seed.js             # Database seeder with sample aircraft, users & clients
│   ├── app.js                  # Express app wiring, CORS, helmet, routes
│   └── server.js               # Entry point, MongoDB connector, graceful shutdown
├── .env.example
├── package.json
└── render.yaml                 # Render infrastructure-as-code deployment blueprint
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v20/v22)
- **MongoDB** running locally or a free MongoDB Atlas connection URI

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Setup Environment Variables
A default `.env` is already created. For custom setup:
```bash
cp .env.example .env
```
Key development settings:
- `MONGODB_URI`: `mongodb://localhost:27017/orbelo` (or your MongoDB Atlas URI)
- `AVINODE_MOCK_MODE`: `true` (enables realistic mock data for all Avinode flows)
- `PORT`: `5000`

### 4. Seed the Database
Populate the database with initial fleet aircraft, clients, operators, and test users:
```bash
npm run seed
```

Default seeded accounts (password for all: `orbelo2026!`):
- **Super Admin**: `superadmin@orbelo.com`
- **Admin**: `admin@orbelo.com`
- **Finance**: `finance@orbelo.com`
- **Operations / Dispatch**: `ops@orbelo.com`
- **Broker / Agent**: `agent@orbelo.com`

### 5. Start the Server
```bash
npm run dev   # Runs with nodemon auto-reload
# or
npm start     # Runs standard node server
```
Server will be live at: `http://localhost:5000`  
Health check: `http://localhost:5000/api/health`

---

## 🌐 Deploying to Render.com

### Option A: Blueprint Deploy (Recommended)
1. Push your repository to GitHub or GitLab.
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** > **Blueprint**.
4. Connect this repository. Render will automatically detect `backend/render.yaml`.
5. Provide your `MONGODB_URI` (from MongoDB Atlas).
6. Click **Apply**. Render will build and deploy the service.

### Option B: Manual Web Service Setup
1. In Render Dashboard, click **New +** > **Web Service**.
2. Connect your repository.
3. Configure settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Health Check Path**: `/api/health`
4. Add the Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `MONGODB_URI` = `mongodb+srv://<user>:<password>@cluster.mongodb.net/orbelo?retryWrites=true&w=majority`
   - `JWT_SECRET` = `(generate a 32+ character random secret)`
   - `JWT_REFRESH_SECRET` = `(generate a 32+ character random secret)`
   - `FRONTEND_URL` = `https://your-frontend-app.vercel.app` (or your frontend domain)
   - `AVINODE_MOCK_MODE` = `true` (or `false` with `AVINODE_API_KEY`)
   - `AVINODE_API_KEY` = `your-live-avinode-key`
   - `UNSPLASH_ACCESS_KEY` = `your-unsplash-access-key` (optional)
   - `PEXELS_API_KEY` = `your-pexels-api-key` (optional)
   - `CLOUDINARY_CLOUD_NAME` = `your-cloudinary-name` (optional)
   - `CLOUDINARY_API_KEY` = `your-cloudinary-key` (optional)
   - `CLOUDINARY_API_SECRET` = `your-cloudinary-secret` (optional)
   - `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` = (optional for email notifications)

---

## 📡 API Reference

All protected endpoints require `Authorization: Bearer <token>`.

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user & return JWT + refresh token | Public |
| `POST` | `/api/auth/refresh` | Exchange refresh token for new access token | Public |
| `POST` | `/api/auth/logout` | Invalidate refresh token | Authenticated |
| `GET` | `/api/auth/me` | Fetch active user profile | Authenticated |

### Bookings (`/api/bookings`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/bookings` | List bookings with filters (status, date, search, agent) | Authenticated |
| `GET` | `/api/bookings/:id` | Get single booking details | Authenticated |
| `POST` | `/api/bookings` | Create charter booking | Admin, Ops, Super Admin |
| `PUT` | `/api/bookings/:id` | Update booking fields | Admin, Ops, Super Admin |
| `DELETE` | `/api/bookings/:id` | Soft delete booking | Super Admin |
| `PATCH` | `/api/bookings/:id/status` | Update booking lifecycle status | Ops, Admin, Super Admin |
| `PATCH` | `/api/bookings/:id/payment-status` | Record payment status change | Finance, Admin, Super Admin |
| `POST` | `/api/bookings/:id/convert-to-confirmed` | Convert accepted quote to confirmed flight | Ops, Admin, Super Admin |
| `GET` | `/api/bookings/:id/checklist` | Get 15-step dispatch checklist | Authenticated |
| `PATCH` | `/api/bookings/:id/checklist/:stepId` | Toggle checklist item completion | Ops, Admin, Super Admin |
| `POST` | `/api/bookings/calculate-pricing` | Calculate live quote pricing breakdown | Authenticated |

### Avinode Marketplace Integration (`/api/avinode`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/avinode/search-trips` | Search available aircraft from operators | Authenticated |
| `GET` | `/api/avinode/trip/:tripId` | Get Avinode trip status & quotes | Ops, Admin, Super Admin |
| `POST` | `/api/avinode/create-trip` | Create trip in Avinode system | Ops, Admin, Super Admin |
| `POST` | `/api/avinode/rfq` | Broadcast RFQ to Avinode operator network | Ops, Admin, Super Admin |
| `GET` | `/api/avinode/rfq/:rfqId` | Get operator bids & responses | Ops, Admin, Super Admin |
| `POST` | `/api/avinode/book-trip` | Confirm/book trip via Avinode | Admin, Super Admin |
| `GET` | `/api/avinode/operators` | Search Avinode global operator directory | Ops, Admin, Super Admin |
| `GET` | `/api/avinode/aircraft` | Query Avinode aircraft registry | Authenticated |
| `GET` | `/api/avinode/fleet-availability` | Check operator fleet calendar availability | Ops, Admin, Super Admin |
| `POST` | `/api/avinode/messaging` | Send direct dispatch message to operator | Ops, Admin, Super Admin |
| `GET` | `/api/avinode/messaging/:tripId` | Get message thread for a trip | Ops, Admin, Super Admin |
| `POST` | `/api/avinode/calculate-quote` | Automated Avinode marketplace price estimate | Authenticated |

### Jet Images API (`/api/jet-images`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/jet-images/search?query=...` | Search jet photos across Unsplash/Pexels | Authenticated |
| `GET` | `/api/jet-images/aircraft/:model` | Get interior and exterior photos for aircraft | Authenticated |
| `GET` | `/api/jet-images/interior` | Curated cabin interior photos | Authenticated |
| `GET` | `/api/jet-images/exterior` | Curated aircraft tarmac & exterior photos | Authenticated |

### Document Generation (`/api/documents`)
Returns binary PDF with `Content-Type: application/pdf`.
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/documents/quotation/:bookingId` | Generate branded Quote PDF | Authenticated |
| `POST` | `/api/documents/invoice/:bookingId` | Generate Official Invoice PDF | Finance, Admin, Super Admin |
| `POST` | `/api/documents/flight-brief/:bookingId` | Generate Flight Dispatch Brief PDF | Ops, Admin, Super Admin |
| `POST` | `/api/documents/charter-agreement/:bookingId` | Generate Legal Charter Agreement PDF | Ops, Admin, Super Admin |
| `POST` | `/api/documents/passenger-manifest/:bookingId` | Generate APIS Passenger Manifest PDF | Ops, Admin, Super Admin |
| `POST` | `/api/documents/credit-note/:bookingId` | Generate Credit Note PDF | Finance, Admin, Super Admin |

### Quotes Management (`/api/quotes`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/quotes/generate` | Generate quote from agent RFQ | Ops, Admin, Super Admin |
| `POST` | `/api/quotes/:id/send` | Email quote PDF directly to client | Ops, Admin, Super Admin |
| `PATCH` | `/api/quotes/:id/status` | Mark quote accepted/declined/expired | Authenticated |
| `POST` | `/api/quotes/:id/version` | Fork quote into a new revision version | Ops, Admin, Super Admin |

### Agent Requests (`/api/agent-requests`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/agent-requests` | List broker requests (filtered by agent role) | Authenticated |
| `GET` | `/api/agent-requests/:id` | Request details and message thread | Authenticated |
| `POST` | `/api/agent-requests` | Submit new charter quote request | Authenticated |
| `PATCH` | `/api/agent-requests/:id/status` | Update RFQ status (in_sourcing, processing) | Ops, Admin, Super Admin |
| `POST` | `/api/agent-requests/:id/messages` | Post message to broker-admin thread | Authenticated |
| `POST` | `/api/agent-requests/:id/fulfill` | Convert fulfilled request into a live booking | Ops, Admin, Super Admin |

### Fleet (`/api/fleet`), Clients (`/api/clients`), & Operators (`/api/operators`)
- `/api/fleet`: Full CRUD for aircraft with cruise speeds, range, interior/exterior images, and Cloudinary upload.
- `/api/clients`: Client management with VIP tiers (`Ultra HNWI`, `Corporate Executive`, etc.), spend tracking, and booking history.
- `/api/operators`: Operator records with AOC verification, 9-point safety qualification checklist, and `/api/operators/expiry-alerts` for automated license expiration notifications.

### Dashboard & Analytics (`/api/dashboard`)
- `GET /api/dashboard/kpis`: Revenue MTD, growth percentage, active trips, conversion rates.
- `GET /api/dashboard/bookings-summary`: Breakdown by booking status.
- `GET /api/dashboard/revenue-chart`: Monthly historical revenue trend.
- `GET /api/dashboard/upcoming-flights`: Upcoming departures in the next 7 days.
- `GET /api/dashboard/agent-performance`: Broker league table by charter volume.
- `GET /api/dashboard/alerts`: AOC expirations, overdue invoices, expiring quotes.

---

## 🔒 Security Best Practices
- **Helmet**: Secures HTTP response headers against clickjacking, MIME-type sniffing, and XSS.
- **CORS Whitelisting**: Strict origin matching against `FRONTEND_URL`.
- **Express Rate Limiting**: Defense against brute-force attacks on auth and PDF generation endpoints.
- **Input Sanitization**: Joi schema validation strips unknown malicious fields before controller execution.
- **Auditing**: Every mutation logs IP address, user agent, actor email, and state diff.
