# Dream Institute Fee Management app
Internal app for Dream Institute

## Overview

The Dream Institute Fee Management app is a full-stack solution for managing student fee payments, reminders, and notifications. It streamlines fee collection, automates reminders via WhatsApp and email, and provides dashboards for both administrators and students.

---

## Features

### 1. Automated WhatsApp & Email Reminders
- Send individual or bulk fee reminders to students via WhatsApp (Twilio API) and email (SendGrid).
- Custom message support for special notifications.
- Progress tracking and success/failure reporting for bulk sends.

### 2. Student & Payment Management
- CRUD operations for students, payments, and invoices.
- Track outstanding balances, payment history, and invoice status.
- Admin and student dashboards for real-time data access.

### 3. Secure Authentication & Role Management
- User registration, login, and password reset.
- JWT-based authentication and role-based access control.

### 4. Dashboard & Analytics
- KPI cards for key metrics (total students, outstanding fees, etc.).
- Paginated, filterable tables for customers, invoices, and payments.
- Responsive design for desktop and mobile.

### 5. Notification System
- In-app and email notifications for important events (e.g., payment received, invoice generated).

### 6. Comprehensive Testing
- 100+ unit and integration tests for backend and frontend.
- High coverage for critical features (SMS/WhatsApp, SendGrid, models, routes).

---

## Project Structure

```
zoho-invoice-api/
│
├── backend/
│   ├── models/         # Mongoose models: User, Customer, Payment, Invoice, Notification, Token, SyncLog
│   └── routes/         # Express routes: auth, student, syncZohoToMongo
│
├── routes/             # API endpoints: sms, mongoCustomers, mongoInvoices, mongoPayments, notifications
├── services/           # Integrations: sendgridService (email), twilioService (WhatsApp/SMS)
├── scripts/            # Utility scripts: create admin, seed data, reset password
├── tests/              # Jest test suites for backend and services
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/     # Loading overlays
│   │   │   ├── grid/       # Paginated tables
│   │   │   ├── dialogs/    # Modals (AddCustomer, AddPayment, PaymentHistory, TokenManager)
│   │   │   ├── popovers/   # Contextual popovers
│   │   │   └── kpi/        # KPI cards
│   │   ├── pages/          # Main pages: AdminDashboard, StudentDashboard, Login, Register, etc.
│   │   ├── context/        # Auth context
│   │   ├── utils/          # Utility functions
│   │   └── hooks/          # Custom React hooks
│   └── public/             # Static assets
│
├── .env.example           # Example environment variables
├── README.md              # Project documentation
└── package.json           # Project dependencies
```

---

## Key API Endpoints

- `GET /api/sms/unpaid-students` — List students with outstanding fees
- `POST /api/sms/send-reminder` — Send WhatsApp/email reminder to a student
- `POST /api/sms/send-bulk-reminders` — Bulk reminders to all unpaid students
- `POST /api/sms/send-custom` — Custom WhatsApp message
- `GET /api/sms/status` — WhatsApp service status

---

## Setup & Configuration

1. **Clone the repository** and install dependencies:
   ```sh
   git clone https://github.com/digal2025/dream-institute-app.git
   cd dream-institute-app/zoho-invoice-api
   npm install
   cd client
   npm install
   ```

2. **Configure environment variables** in `.env` (see `.env.example`).

3. **Run the backend:**
   ```sh
   npm start
   ```

4. **Run the frontend:**
   ```sh
   cd client
   npm start
   ```

---

## Testing

- Run backend and service tests:
  ```sh
  npm test
  ```
- Run frontend tests:
  ```sh
  cd client
  npm test
  ```

---

## Contribution

Contributions are welcome! Please open issues or submit pull requests for improvements or bug fixes.

---

For more details, see the documentation in each subfolder and the test summaries in `COMPREHENSIVE_TEST_SUMMARY.md` and `TEST_SUMMARY.md`.
