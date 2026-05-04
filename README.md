# LuxeShop 🛍️

A full-stack e-commerce web application built with React, Node.js, MongoDB, and Razorpay payments.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Full Project Flow](#full-project-flow)
- [Pages & Features](#pages--features)
- [Redux State Management](#redux-state-management)
- [API Endpoints](#api-endpoints)

---

## Overview

LuxeShop is a modern e-commerce platform where users can browse products, manage a cart, save wishlists, apply coupons, pay securely via Razorpay, and track their orders. Admins can manage the product catalog from a dedicated dashboard.

```
Frontend (React + Vite)    ←→    Backend (Node.js + Express)
   localhost:5173                     localhost:3000
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Redux Toolkit, React Router v6 |
| Styling | CSS Modules, Google Fonts (Poppins) |
| State Management | Redux Toolkit + Redux Thunk |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Authentication | JWT (JSON Web Tokens) |
| Payments | Razorpay |
| Image Storage | Cloudinary |
| Caching | Redis |
| Notifications | React Hot Toast |

---

## Project Structure

```
api/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/              # Static images
│   ├── Components/          # Reusable UI components
│   │   ├── TopNav           # Navigation bar
│   │   ├── GetAllProducts   # Product grid with filters
│   │   ├── GetSingleProducts# Single product detail
│   │   ├── AddNewProduct    # Admin: add product form
│   │   ├── UpdateProducts   # Admin: edit product form
│   │   ├── DeleteProduct    # Admin: delete product button
│   │   └── ChatBot          # Floating chat assistant
│   ├── pages/               # Full page components
│   │   ├── Home             # Product browsing page
│   │   ├── Login            # Login page
│   │   ├── SignUp           # Registration page
│   │   ├── Cart             # Shopping cart
│   │   ├── Wishlist         # Saved products
│   │   ├── Orders           # Order history list
│   │   ├── OrderDetail      # Single order details
│   │   ├── OrderTracking    # Order tracking view
│   │   ├── Profile          # User profile & stats
│   │   ├── Address          # Delivery address manager
│   │   └── Dashboard        # Admin product dashboard
│   ├── Slices/              # Redux state slices
│   │   ├── authSlice        # Auth token & user info
│   │   ├── productSlice     # Products list & single product
│   │   ├── cartSlice        # Cart items & loading states
│   │   ├── orderSlice       # Orders & selected order
│   │   ├── paymentSlice     # Razorpay payment flow
│   │   ├── wishlistSlice    # Wishlist (localStorage)
│   │   ├── addressSlice     # Delivery addresses (backend)
│   │   └── profileSlice     # User profile data
│   ├── store.js             # Redux store configuration
│   ├── App.jsx              # Routes & route protection
│   └── main.jsx             # App entry point
├── .env                     # Environment variables
├── vite.config.js
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm or yarn
- Backend server running on `http://localhost:3000`

### Installation

```bash
# Clone the repository
git clone <your-repo-url>

# Navigate to the frontend folder
cd api

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
```

---

## Environment Variables

Create a `.env` file in the `api/` folder:

```env
VITE_API_URL=http://localhost:3000
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_here
```

> The Razorpay Key ID must match the one configured in your backend. Get it from [dashboard.razorpay.com](https://dashboard.razorpay.com) → Settings → API Keys.

---

## Full Project Flow

### 1. Sign Up / Login

- User registers with name, email, and password
- Backend validates and creates the user in MongoDB
- A **JWT token** is returned and stored in `localStorage` + Redux
- User is redirected to the Home page

```
Sign Up → POST /api/auth/register → JWT token saved → /home
Login   → POST /api/auth/login   → JWT token saved → /home
```

---

### 2. Browse Products

- Home page loads all products via `GET /api/products`
- Products display in a responsive grid
- Available filters:
  - 🔍 Search by name or description
  - 📂 Filter by category
  - 💰 Filter by price range (min / max)
  - 🔃 Sort by price (low→high, high→low) or name (A→Z, Z→A)
  - 📄 Pagination for large catalogs

---

### 3. View a Single Product

- Click "View" on any product card → `/product/:id`
- Fetches full product details via `GET /api/products/:id`
- Shows image, description, price, stock status
- Buttons: **Add to Cart** and **Buy Now** (adds to cart + goes to cart)

---

### 4. Wishlist

- Click the 🤍 heart on any product to save it
- Wishlist is stored in `localStorage` (no login required to save)
- Wishlist page (`/wishlist`) shows all saved items
- Actions available:
  - Remove individual items
  - **🛒 Add All to Cart** — adds every wishlist item to cart at once
  - 🗑️ Clear entire wishlist

---

### 5. Cart

- Products added to cart are saved in MongoDB via `POST /api/cart`
- Cart page (`/cart`) fetches items via `GET /api/cart`
- Per-item actions:
  - **+** increase quantity (adds 1 via backend)
  - **−** decrease quantity (subtracts 1, removes if qty reaches 0)
  - **Remove** — deletes item from cart
  - **🤍 Wishlist** — moves item from cart to wishlist
- Stock validation: warns if quantity exceeds available stock, blocks checkout
- **Coupon codes** (apply in Order Summary):
  - `SAVE10` → 10% discount
  - `SAVE20` → 20% discount
  - `LUXE50` → 50% discount
- Delivery address shown at bottom of summary

---

### 6. Add Delivery Address

- Go to `/address` before checking out
- Fill in: name, phone, address lines, city, state, pincode, country
- Address is saved to backend via `POST /api/addresses`
- Gets a real MongoDB `_id` — required for placing orders
- First address is automatically set as default
- Multiple addresses supported; set any as default

---

### 7. Checkout & Payment (3-Step Flow)

**Step 1 — Create App Order**
```
POST /api/orders
Body: { items: [{ product, quantity }], addressId }
→ Backend validates stock, saves order to MongoDB
→ Returns order with _id
```

**Step 2 — Create Razorpay Payment Session**
```
POST /api/payments/create-order
Body: { orderId }
→ Backend calls Razorpay API
→ Returns { razorpayOrder: { id, amount, currency } }
```

**Step 3 — User Pays in Razorpay Modal**
```
Razorpay popup opens in browser
→ User pays via card / UPI / netbanking
→ On success: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
```

**Step 4 — Verify Payment**
```
POST /api/payments/verify
→ Backend verifies Razorpay signature (security check)
→ Payment confirmed
```

**Step 5 — Cleanup**
```
Cart cleared (frontend + backend)
→ Redirect to /orders
→ Success toast shown
```

---

### 8. Orders

- `/orders` fetches all user orders via `GET /api/orders`
- Each order card shows:
  - Order ID, date placed
  - Status badge (Pending / Processing / Shipped / Delivered / Cancelled)
  - Items with images, quantities, prices
  - Order total
  - 🗺️ Track button
- Click any order to view full details

---

### 9. Order Detail

- `/orders/:id` shows the complete order breakdown
- **Progress tracker** — visual stepper: Pending → Processing → Shipped → Delivered
- Shows: items ordered, shipping address, payment method, price breakdown
- **Cancel Order** button appears for `pending` orders
  - Shows inline confirmation before cancelling
  - Calls `PATCH /api/orders/:id/cancel`

---

### 10. Order Tracking

- `/track/:id` shows a visual delivery tracking view
- Mirrors the status steps from Order Detail

---

### 11. Profile

- `/profile` shows the logged-in user's information
- Stats cards: Total Orders, Cart Items, Total Amount Spent
- Account info: name, email, role, member since date
- Recent orders (last 4) with status badges
- Quick action buttons: My Orders, My Cart, Shop Now, Logout

---

### 12. Admin Dashboard

- `/dashboard` — only accessible to users with `role: "admin"`
- Admin can:
  - ➕ Add new products (title, description, price, stock, image, category)
  - ✏️ Update existing products
  - 🗑️ Delete products
- Regular users are redirected away from this page

---

### 13. ChatBot

- Floating 💬 button visible on all pages when logged in (bottom-right)
- Opens a chat assistant panel

---

## Redux State Management

| Slice | Stored Data | Persistence |
|---|---|---|
| `authSlice` | User info, JWT token | `localStorage` |
| `productSlice` | Products list, single product, pagination | Memory |
| `cartSlice` | Cart items, per-item loading states | Backend (MongoDB) |
| `orderSlice` | Orders list, selected order | Backend (MongoDB) |
| `paymentSlice` | Payment loading, success, error | Memory |
| `wishlistSlice` | Wishlist items | `localStorage` |
| `addressSlice` | Delivery addresses | Backend (MongoDB) |
| `profileSlice` | User profile data | Backend (MongoDB) |

---

## Route Protection

All routes except `/` (SignUp) and `/login` are protected. If no JWT token is found in Redux, the user is redirected to `/login`.

```jsx
// Protected route pattern in App.jsx
<Route path="/home" element={token ? <Home /> : <Navigate to="/login" />} />
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/products` | Get all products (paginated) |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Add product (admin) |
| PUT | `/api/products/:id` | Update product (admin) |
| DELETE | `/api/products/:id` | Delete product (admin) |
| GET | `/api/cart` | Get user's cart |
| POST | `/api/cart` | Add/update cart item |
| DELETE | `/api/cart/:productId` | Remove cart item |
| DELETE | `/api/cart` | Clear entire cart |
| GET | `/api/addresses` | Get user's addresses |
| POST | `/api/addresses` | Add new address |
| PUT | `/api/addresses/:id` | Update address |
| DELETE | `/api/addresses/:id` | Delete address |
| GET | `/api/orders` | Get user's orders |
| POST | `/api/orders` | Place new order |
| GET | `/api/orders/:id` | Get order by ID |
| PATCH | `/api/orders/:id/cancel` | Cancel order |
| POST | `/api/payments/create-order` | Create Razorpay order |
| POST | `/api/payments/verify` | Verify payment signature |

---

## License

MIT
