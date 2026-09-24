# 🎓 NIBM Canteen-Zero: Enterprise Smart Campus Dining & Capacity Management System

> **"The Place To Be"** — A Zero-Queue, Cashless, and Atomic Smart Seating Experience for the National Institute of Business Management (Colombo Campus).

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-v20.x-green.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-v18.x-blue.svg)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20v8.0-emerald.svg)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-v4.8-black.svg)](https://socket.io/)
[![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blue.svg)](https://github.com/)

---

## 📌 Table of Contents
1. [Executive Summary](#-executive-summary)
2. [Problem Statement & Proposed Solution](#-problem-statement--proposed-solution)
3. [System Architecture & Infrastructure](#-system-architecture--infrastructure)
4. [Enterprise Security Standards](#-enterprise-security-standards)
5. [Core Innovations & Features](#-core-innovations--features)
6. [Technology Stack](#-technology-stack)
7. [RESTful API Specification](#-restful-api-specification)
8. [Real-time WebSocket Events](#-real-time-websocket-events)
9. [Scrum Sprints & Agile Traceability](#-scrum-sprints--agile-traceability)
10. [Local Development & Setup Guide](#-local-development--setup-guide)
11. [Testing & Quality Assurance](#-testing--quality-assurance)
12. [DevOps, Docker & CI/CD Deployment](#-devops-docker--cicd-deployment)
13. [Contributors & Team Allocation](#-contributors--team-allocation)

---

## 📖 Executive Summary
**NIBM Canteen-Zero** is an enterprise-grade full-stack MERN application built to solve severe physical congestion, seat overbooking, and order fulfillment delays at the NIBM Colombo (Vidya Mawatha) campus canteen. 

The system transitions the physical dining environment into a synchronized digital workflow:
* Pre-ordering from classrooms.
* Cryptographically secured banking gateway and dynamic LANKAQR payments.
* Live Kitchen Order Monitoring (FIFO pipeline with audio-visual notifications).
* Atomic seat reservation system that dynamically tracks the 40-seat canteen limit.
* Category-aware dining timers (12 minutes for snacks, 25 minutes for main meals) running via persistent database workers.
* Physical table handover verification using instant Table QR scanning.

---

## 🎯 Problem Statement & Proposed Solution

### The Problem
* **Long Peak-Hour Queues**: Students spend 20 to 30 minutes standing in order and cash-collection queues, often having their lectures delayed or missing meals.
* **Uncertain Physical Seating**: Students purchase dine-in food only to find all 40 physical seats full, resulting in cafeteria overcrowding.
* **Menu Opacity**: Students physically walk to the canteen counter without knowing what items are prepared or sold out.
* **Kitchen Desynchronization**: Kitchen staff rely on manual tickets, leading to misplaced orders and delivery confusion.

### The Solution
* **Zero-Queue Pre-Ordering**: Students browse real-time inventory, place orders, and pay online before walking to the canteen.
* **Atomic Dining Reservations**: When placing a 'Dine-In' order, the system locks a physical seat atomically. If all 40 seats are taken, 'Dine-In' is automatically disabled, forcing 'Takeaway'.
* **Autonomous Seat Management**: Background workers monitor eating durations and automatically free seats upon expiration or table QR scanning.
* **Real-time Synchronization**: Socket.IO broadcasts order state changes and occupancy metrics campus-wide in sub-100ms latency.

---

## 🏛️ System Architecture & Infrastructure

The application follows a decoupled, client-server architecture built for high availability and low latency:

```
[ React 18 SPA (Tailwind CSS, Zustand) ]
                   │
         HTTPS / WSS Connection
                   ▼
[ Express.js REST API / Socket.IO Cluster Engine ]
    ├── Security: Helmet, Rate Limiter, NoSQL Sanitizer
    ├── Authentication: HttpOnly Cookie Parser & JWT Engine
    ├── Background Worker: Autonomous Seat Monitor (10s Poll)
    └── Media Handler: Multer -> Cloudinary CDN (600x600 Crop)
                   │
      ┌────────────┴────────────┐
      ▼                         ▼
[ MongoDB Atlas ]      [ Redis Cluster (Optional) ]
(Orders, Products,      (Socket.IO Horizontal Adapter)
 Users, Capacities)
```

---

## 🔒 Enterprise Security Standards

The platform implements industry-grade zero-trust security practices:

1. **HttpOnly Cookie Authentication**:
   * Access tokens (JWT, 15-minute lifespan) and rotating refresh tokens (7-day lifespan) are delivered via `HttpOnly`, `Secure`, and `SameSite=Strict` cookies.
   * Eliminates Cross-Site Scripting (XSS) token exfiltration via `localStorage`.
2. **Server-Side Role-Based Access Control (RBAC)**:
   * Administrative endpoints (`/admin-list`, `/toggle`, `/daily-reset`, `/status`, `/collect`, `/seed`) enforce `protect` and `authorize('admin')` server middleware.
3. **NoSQL Injection & Parameter Sanitization**:
   * Custom request sanitization strips reserved MongoDB keys (e.g., `$gt`, `$ne`, `$regex`) from all incoming requests.
4. **Rate Limiting & DDoS Shield**:
   * Configured `express-rate-limit` limits clients to 300 requests per 15 minutes.
5. **Cryptographic Payment Webhooks**:
   * Central bank PayHere / LANKAQR IPN webhooks are validated using HMAC-MD5 signature checksum verification before marking orders as paid.
6. **Self-Contained Local Assets**:
   * UI audio alerts are served directly from the application origin (`public/notification.mp3`) instead of unverified third-party CDNs.

---

## ⚡ Core Innovations & Features

### 1. Atomic Seating Capacity Engine
* A singleton database model (`CanteenCapacity`) controls the 40 physical seats.
* Reservations execute conditionally through `findOneAndUpdate({ occupiedSeats: { $lt: 40 } })`. This prevents concurrency race conditions and overbooking when multiple students order simultaneously.

### 2. Category-Aware Dining Auto-Release Worker
* When kitchen staff click **Collected**, the system calculates dining time based on items:
  * **Snacks / Beverages / Desserts**: 12 Minutes
  * **Main Meals**: 25 Minutes
* The calculated expiration timestamp is stored persistently as `seatExpiresAt` in MongoDB.
* An autonomous background worker (`backend/services/seatReleaseWorker.js`) scans active orders every 10 seconds. When a dining session expires, the worker releases the seat and updates campus occupancy via WebSockets, surviving server reboots.

### 3. Early Table Exit & Session Extension Handshake
* **Seat Extension (US 20)**: When a student's countdown reaches under 3 minutes, they can request a one-time 5-minute extension.
* **Table QR Handshake (US 21)**: Students leaving early scan the physical table QR code to immediately release their seat to others.

### 4. Staff Switchboard & Live Kitchen Dashboard
* **Staff Inventory Switchboard (US 23)**: One-tap toggle buttons to immediately mark items out of stock across all student devices.
* **Kitchen Order Monitor (US 22)**: Dark-mode industrial interface designed for high readability in kitchen environments, featuring audio alerts and FIFO workflow management.

### 5. Business Intelligence & Instant PDF Export (US 25)
* Aggregates 24-hour revenue, completed order volume, average preparation time, and top-selling food items.
* Exports clean, formatted PDF executive summaries using client-side `jsPDF` and `jspdf-autotable`.

---

## 💻 Technology Stack

| Layer | Technology | Function |
| :--- | :--- | :--- |
| **Frontend UI** | **React.js 18.2** | Single Page Application framework |
| **Styling** | **Tailwind CSS v3** | Academic design system (NIBM Blue `#0b3d91`, Red `#d71920`, Gold `#ffc600`) |
| **Client State** | **Zustand** | Lightweight, reactive store with `localStorage` persistence |
| **Icons & Media** | **Lucide-React** | Consistent iconography |
| **Backend Runtime**| **Node.js LTS (v20)** | High-concurrency event-driven server runtime |
| **API Framework** | **Express.js v5** | RESTful routing engine |
| **Database** | **MongoDB Atlas** | Cloud NoSQL document database with Mongoose ORM |
| **Real-time Bus** | **Socket.IO v4.8** | Bi-directional WebSocket communication |
| **Horizontal Scaling**| **@socket.io/redis-adapter**| Multi-instance Socket.IO synchronization via Redis |
| **Asset Storage** | **Cloudinary CDN** | Cloud-based media storage with automatic image cropping |
| **Logging** | **Pino** | High-performance structured JSON logging |
| **Testing** | **Jest & Supertest** | Unit, middleware, and integration test runners |
| **DevOps** | **Docker & GitHub Actions** | Multi-stage containerization and automated CI/CD pipeline |

---

## 📡 RESTful API Specification

### Authentication & User Management (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Registers student with `@nibm.lk` email gating |
| `POST` | `/api/auth/login` | Public | Authenticates credentials, issues JWT access & refresh cookies |
| `POST` | `/api/auth/refresh` | Public | Rotates refresh token and issues new 15-min access cookie |
| `POST` | `/api/auth/logout` | Protected | Revokes refresh token and clears client authentication cookies |
| `GET` | `/api/auth/me` | Protected | Fetches currently authenticated user profile |
| `PUT` | `/api/auth/profile/:id` | Protected | Updates student phone number for order SMS/alerts |
| `PUT` | `/api/auth/change-password/:id` | Protected | Validates current password and saves newly hashed password |

### Product Catalog (`/api/products`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | Public | Fetches all available menu items for students |
| `GET` | `/api/products/admin-list` | Admin/Staff | Fetches complete inventory list including unavailable items |
| `POST` | `/api/products` | Admin Only | Uploads food image to Cloudinary and saves validated item |
| `PUT` | `/api/products/:id` | Admin Only | Updates food item details and optional replacement image |
| `DELETE`| `/api/products/:id` | Admin Only | Permanently deletes item from the catalog |
| `PATCH`| `/api/products/:id/toggle` | Admin/Staff | Flips real-time `isAvailable` stock status |
| `POST` | `/api/products/daily-reset` | Admin Only | Resets all products to available and clears canteen capacity |
| `POST` | `/api/products/seed` | Admin Only | Wipes products and inserts default menu items |

### Orders & Seat Management (`/api/orders`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/orders/occupancy` | Public | Returns occupied, total, and available canteen seating |
| `GET` | `/api/orders/active-count` | Public | Returns count of active kitchen pipeline orders |
| `POST` | `/api/orders/create` | Student | Atomically locks a seat (if Dine-In) and creates a Pending order |
| `POST` | `/api/orders/:id/payment-payload` | Student | Generates an HMAC-MD5 cryptographically signed payment payload |
| `POST` | `/api/orders/payment-ipn` | Bank / IPN | Validates bank signature, marks order Paid, generates 4-digit token |
| `PATCH`| `/api/orders/:id/status` | Admin/Staff | Transitions order state (`Preparing`, `Ready`) |
| `PATCH`| `/api/orders/:id/collect` | Admin/Staff | Sets order to `Collected` and starts dining countdown |
| `PATCH`| `/api/orders/:id/extend-seat` | Student | Extends dining session by 5 minutes (one-time limit) |
| `PATCH`| `/api/orders/:id/release-manual`| Student | Releases dining seat via table QR code |
| `GET` | `/api/orders/admin/active` | Admin/Staff | Returns all orders currently in preparation or awaiting pickup |
| `GET` | `/api/orders/admin/daily-report` | Admin Only | Computes 24-hour financial, volume, and preparation speed KPIs |
| `GET` | `/api/orders/user-history/:userId` | Student/Admin | Fetches historical order ledger for the authenticated student |
| `GET` | `/api/orders/user/:userId` | Student/Admin | Fetches active live orders for student status widgets |

---

## 🔄 Real-time WebSocket Events

| Event Channel | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `occupancyUpdate` | Server ➔ Clients | `{ occupied, available, total }` | Broadcasts seat count changes immediately |
| `orderCountUpdate`| Server ➔ Clients | `Number` (active count) | Updates badge counts on Kitchen and Admin buttons |
| `inventoryUpdate` | Server ➔ Clients | `void` | Signals client menu to refresh stock changes |
| `newOrderAlert` | Server ➔ Kitchen | `Order` object | Rings kitchen audio alert when an order is paid |
| `orderUpdate` | Server ➔ Student | `{ userId, status, tokenID }` | Triggers student status changes and pickup chimes |
| `revenueUpdate` | Server ➔ Admin | `void` | Updates administrative revenue metrics in real time |

---

## 🏃 Scrum Sprints & Agile Traceability

The project was executed across three 2-week Scrum sprints, fully satisfying all committed user stories and subtasks:

```
Sprint 1: The Foundation (Core Identity & Ordering)
 ├── US 01: Student Authentication (@nibm.lk gating)
 ├── US 04: Digital Menu Browsing (Schema & API)
 ├── US 08: Cart Management (Persistent Zustand Store)
 ├── US 11: LANKAQR Payment Gateway (Fintech integration)
 ├── US 02: User Profile Update (Contact settings)
 ├── US 03: Secure Session Logout (Token destruction)
 ├── US 05: Product Category Filtering (Dynamic food tags)
 └── US 07: Food Item Descriptions (Item metadata modals)

Sprint 2: The Fulfillment (Kitchen & Queue Management)
 ├── US 23: Staff Inventory Toggle (Live catalog management)
 ├── US 13: Unique Token Generation (Collision-proof 4-digit codes)
 ├── US 22: Kitchen Order Monitor (Live queue dashboard)
 ├── US 15: Ready Order Notifications (Audio-visual pickup alerts)
 ├── US 06: Food Discovery Search (Fuzzy text filtering)
 ├── US 09: Cart Quantity Management (Increment/decrement)
 ├── US 10: Basket Item Removal (Array filtering)
 └── US 16: Pickup Token Verification (Vendor handover confirmation)

Sprint 3: The Orchestration (Smart Seating & Analytics)
 ├── US 17: Dining Mode Selector (Dine-In vs. Takeaway)
 ├── US 18: Live Occupancy Tracker (40-seat live counter)
 ├── US 19: Smart Auto Release Timer (Persistent database timers)
 ├── US 25: Daily Revenue Report (Automated KPI calculations & PDF)
 ├── US 14: Real-time Status Tracking (Multi-stage visual pipeline)
 ├── US 12: Digital Order History (Personal historical ledger)
 ├── US 20: Seat Time Extension (5-minute extension logic)
 ├── US 21: Table Exit QR Verification (Instant seat release)
 └── US 24: Seat Counter Reset (Admin capacity override)
```

---

## 🛠️ Local Development & Setup Guide

### 1. Prerequisites
* **Node.js** (v18 or v20 LTS recommended)
* **npm** (v9 or v10)
* **MongoDB Atlas** database account or local MongoDB instance
* **Cloudinary** account (free tier works)

### 2. Backend Setup
1. Open your terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/nibm_canteen_db?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_jwt_key_here_at_least_32_characters
   CLOUDINARY_NAME=your_cloud_name
   CLOUDINARY_KEY=your_cloudinary_key
   CLOUDINARY_SECRET=your_cloudinary_secret
   BACKEND_URL=http://localhost:5000
   FRONTEND_URL=http://localhost:3000
   PAYHERE_MERCHANT_ID=1234567
   PAYHERE_SECRET=your_payhere_secret
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```
   *The API will start at `http://localhost:5000`.*

### 3. Frontend Setup
1. Open a second terminal window and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Verify your `frontend/.env` file:
   ```env
   REACT_APP_API_URL=http://localhost:5000
   ```
4. Ensure the audio chime file exists at:
   ```text
   frontend/public/notification.mp3
   ```
5. Start the React development server:
   ```bash
   npm start
   ```
   *The application will launch in your browser at `http://localhost:3000`.*

---

## 🧪 Testing & Quality Assurance

The codebase includes comprehensive automated test suites covering authentication, middleware security, business logic, and UI behavior.

### Run Backend Tests
Tests token validation, NoSQL injection sanitizers, order fulfillment calculations, and data integrity:
```bash
cd backend
npm test
```

### Run Frontend Tests
Tests Zustand stores, component rendering, and UI states:
```bash
cd frontend
npm test -- --watchAll=false
```

---

## 🚢 DevOps, Docker & CI/CD Deployment

### 1. Docker Containerization
Both services feature multi-stage Alpine Dockerfiles for minimal production footprint and high security.

Run the entire platform locally via Docker:
```bash
# Build and run backend container
docker build -t nibm-canteen-backend ./backend
docker run -p 5000:5000 --env-file ./backend/.env nibm-canteen-backend

# Build and run frontend container
docker build -t nibm-canteen-frontend ./frontend
docker run -p 80:80 nibm-canteen-frontend
```

### 2. CI/CD Automated Workflow
The repository includes `.github/workflows/ci-cd.yml`, which triggers on pushes to `main` or pull requests to perform:
1. `npm audit --audit-level=high` (Dependency security verification).
2. Backend Jest and Supertest execution against mock memory databases.
3. Frontend unit testing and production asset building.
4. Docker build verification for both backend and frontend images.

---

## 👥 Contributors & Team Allocation

Developed by **NIBM Software Engineering Group K**:

| Name | Role | Core Contributions |
| :--- | :--- | :--- |
| **Nethru Wickramasekara** | Full-Stack Architect & Scrum Master | System architecture, Agile sprint management, JWT security, Auth, Cart logic, Capacity lock |
| **Hiruni Hapuarachchi** | Full-Stack Developer | Digital menu, LANKAQR integration, Kitchen monitor, Table QR release |
| **Dilshan Sathsara** | Frontend Lead | UI components, status tracking bars, sound integration, search filter |
| **Senidu Apsara** | Backend Developer | User profile patch routes, daily revenue aggregator, transaction ledger |
| **Maithrayini Sivanesan** | Backend / QA Lead | Smart auto-release timers, product modals, Jest test coverage |
| **Tisarindi Sanduka** | Full-Stack Developer | Discovery search engine, seat time extension, reset API integration |
| **Navodya De Silva** | Product Owner | Business domain analysis, user story mapping, acceptance testing |

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

***
**NIBM Canteen-Zero** — *Engineered for efficiency. Built for Scholars.*