# SANMART Full-stack store

React/Vite storefront + Express API + MongoDB/Mongoose + customer accounts + admin product CRUD + Razorpay Checkout.

## Setup on Windows (PowerShell)
1. Install Node.js LTS and MongoDB Community Server, or create a MongoDB Atlas database.
2. Open this folder in VS Code (the folder that contains `package.json`).
3. Run `npm install`.
4. Copy `.env.example` to `.env` and edit it. Set a long random `JWT_SECRET`, your `MONGODB_URI`, admin credentials, and Razorpay **Test Mode** keys.
5. Ensure MongoDB is running, then run `npm run dev`.
6. Open `http://localhost:5173`. API status: `http://localhost:5000/api/health`.

The initial admin is created from `ADMIN_EMAIL` / `ADMIN_PASSWORD` when the server starts. Change the sample credentials before use. Sample products are inserted when the product collection is empty.

## Razorpay
Get test keys from your Razorpay dashboard and add them to `.env`. Never put `RAZORPAY_KEY_SECRET` in frontend code, commit `.env`, or share the keys. Payments are verified server-side using the Razorpay signature. Use Test Mode first.

## Included
- Product search/category filter and cart persisted in browser
- Customer register/login (bcrypt password hashes, JWT)
- Admin-only create/edit/delete product API and admin UI
- Customer order history and admin recent orders
- MongoDB users/products/orders
- Razorpay order creation and signature verification

## Before production
This is a learning starter, not a production-audited commerce platform. Add rate limiting, security headers, robust request validation, secure auth storage, HTTPS, strict CORS, Razorpay webhooks and refund handling, inventory reservation/transactions, shipping/tax policies, backups, monitoring, privacy/terms pages, and deployment testing. The sample stock/payment flow needs further hardening against concurrent orders. Never store card details yourself; Razorpay Checkout handles them.