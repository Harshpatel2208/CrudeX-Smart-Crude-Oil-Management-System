# Crude Oil Management CRM & System (COG-CRM)

A modern full-stack CRM and Crude Oil Operations Management system migrated from PHP + MySQL to **React.js (Vite) + Node.js (Express) + MySQL (XAMPP)**.

---

## 🛠️ Tech Stack

### Frontend
- **React.js** (Vite build system)
- **React Router DOM** (Route protection & guards)
- **Bootstrap 5** (Layout & styling)
- **Axios** (API connection layer)
- **Chart.js & React-Chartjs-2** (Interactive dashboard graphs)
- **SweetAlert2** (Modal alerts & confirmations)

### Backend
- **Node.js & Express.js**
- **MySQL2** (Async connection pooling)
- **JWT (JSON Web Token)** (Auth session states)
- **Bcryptjs** (Password secure hashing)
- **Multer** (File upload handling)
- **Dotenv** (Environment isolation)

---

## 📁 Project Structure

```text
crm-cogr/
├── schema.sql         # Database tables and seeds schema
├── README.md          # Setup instructions & documentation
├── server/            # Node.js backend
│   ├── config/        # Connection configurations (db.js)
│   ├── controllers/   # Route controller handlers
│   ├── middleware/    # Auth and logger filters
│   ├── routes/        # Router endpoint maps
│   ├── uploads/       # Storage directory
│   ├── app.js         # Express setup
│   └── server.js      # Entrance server launcher
└── client/            # React Vite frontend
    ├── index.html     # Base html container
    ├── vite.config.js # Vite configuration
    └── src/
        ├── assets/    # Images and static assets
        ├── components/# Common reusable items (Sidebar, Navbar)
        ├── context/   # Global state handlers (AuthContext)
        ├── layouts/   # Main structural wrapper
        ├── pages/     # Module pages (Dashboard, Customers, etc.)
        ├── routes/    # Routes structure mapping
        └── services/  # API Axios connection configurations
```

---

## ⚙️ Installation & Setup

### 1. Database Setup (XAMPP MySQL)
1. Start **XAMPP Control Panel** and activate **Apache** and **MySQL**.
2. Open **phpMyAdmin** at `http://localhost/phpmyadmin/`.
3. Create a new database named `crm_cogr` with UTF-8 encoding (`utf8mb4_unicode_ci`).
4. Click on the **Import** tab, browse for `/crm-cogr/schema.sql` from this project folder, and click **Import** (or **Go**).
5. The database will be created and populated with demo accounts, oil products, agreements, and invoices.

### 2. Backend Server Configuration
1. Open terminal and navigate to the `server/` directory:
   ```bash
   cd crm-cogr/server
   ```
2. Install server node dependencies:
   ```bash
   npm install
   ```
3. A `.env` file has been pre-configured with the default settings:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=
   DB_NAME=crm_cogr
   JWT_SECRET=crude_oil_crm_secret_key_2026_super_secure
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```
   *The backend API server will listen on `http://localhost:5000`.*

### 3. Frontend Client Setup
1. Open another terminal and navigate to the `client/` directory:
   ```bash
   cd crm-cogr/client
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *The frontend application will boot and run on `http://localhost:5173`.*

---

## 🔑 Default Login Credentials

Use the following pre-seeded credentials to test different role permissions:

| Role | Email | Password | Allowed Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@crm.com` | `admin123` | Complete CRUD, User configurations, and System Activity Logs |
| **Manager** | `manager@crm.com` | `manager123` | Opportunities, Agreements, Dispatches, and Invoices logs |
| **Employee** | `employee@crm.com` | `employee123` | Customers CRUD, Lead funnel inputs, pipeline forecasts |

---

## 📡 API Endpoint Documentation

### Authentication & Profile
- `POST /api/auth/login` - Authenticates user & returns JWT token
- `POST /api/auth/register` - Registers new CRM user profile
- `GET /api/auth/profile` - Fetches authenticated user account details
- `GET /api/auth/users` - Fetches active staff list (for select dropdowns)

### Customer Accounts
- `GET /api/customers` - Lists customers with search/status filters
- `POST /api/customers` - Creates new customer card
- `PUT /api/customers/:id` - Updates customer profile details
- `DELETE /api/customers/:id` - Deletes customer card

### Leads Funnel
- `GET /api/leads` - List leads (filters: status, source, assigned_to)
- `POST /api/leads` - Log new sales lead
- `PUT /api/leads/:id` - Edit lead information
- `DELETE /api/leads/:id` - Remove lead

### Sales Opportunities
- `GET /api/opportunities` - List opportunities (filters: stage, customer)
- `POST /api/opportunities` - Create new pipeline opportunity
- `PUT /api/opportunities/:id` - Update opportunity/stage
- `DELETE /api/opportunities/:id` - Delete opportunity

### Crude Products & Inventory
- `GET /api/products` - Lists product catalog (calculates low stock warning flags)
- `POST /api/products` - Insert new crude grade or pricing
- `PUT /api/products/:id` - Edit product specifications or prices
- `DELETE /api/products/:id` - Delete product

### Supply Agreements (Contracts)
- `GET /api/contracts` - Lists contracts (filters: status)
- `POST /api/contracts` - Draft new client supply contract
- `PUT /api/contracts/:id` - Update contract details/status
- `DELETE /api/contracts/:id` - Cancel and delete contract

### Order Processing
- `GET /api/orders` - Lists orders summary details
- `GET /api/orders/:id` - Detailed view of order including line items list
- `POST /api/orders` - Books order with sub-items within database transactions
- `PUT /api/orders/:id` - Updates order status/items
- `DELETE /api/orders/:id` - Cancels order and rolls back product stock deductions

### Shipment Logistics
- `GET /api/logistics` - Lists dispatches
- `POST /api/logistics` - Adds shipping dispatch details
- `PUT /api/logistics/:id` - Update transit timeline or vehicle details
- `DELETE /api/logistics/:id` - Deletes logistics record

### Invoice Invoicing
- `GET /api/invoices` - Lists invoices summary details
- `GET /api/invoices/:id` - Fetches invoice metadata and order lines list
- `POST /api/invoices` - Generates new bill, auto-computes taxes
- `PUT /api/invoices/:id` - Update invoice status
- `DELETE /api/invoices/:id` - Deletes invoice

### Receivables Payments
- `GET /api/payments` - Lists payment transaction history log
- `GET /api/payments/outstanding` - Customer-wise outstanding credit risk summary report
- `POST /api/payments` - Records customer payment, auto-recalculates Invoice status
- `PUT /api/payments/:id` - Edit payment details
- `DELETE /api/payments/:id` - Remove payment ledger record

### Dashboard Analytics
- `GET /api/dashboard/stats` - Total summary counts (Customers, Leads, Opps, Revenue)
- `GET /api/dashboard/charts` - Line and bar chart data formats for monthly sales, stocks, and pipeline value

---

## 🚀 SaaS Multi-Tenant & Level-50 Premium Features

We have upgraded the platform to a fully-isolated SaaS application supporting multiple independent companies, complete with premium oil-industry workflows:

### 1. Row-Level Multi-Tenancy
- **Shared DB, Isolated Rows:** Every record in the database contains a `tenant_id` foreign key.
- **Self-Service Onboarding:** Users can click **"Register a New Company Workspace (SaaS)"** on the login screen to register their company (e.g. *Chevron Corp*). The system provisions their tenant space and registers the owner as `CompanyAdmin`.
- **Complete Data Isolation:** SQL queries are dynamically filtered by the logged-in user's `tenant_id`. Users from one company cannot access or view data from another.

### 2. Multi-Level Authorization & Client Portal
The system supports the following roles:
- `SuperAdmin` - Global platform administrator bypass.
- `CompanyAdmin` - Owner of the tenant company. Full access to workspace details and staff management.
- `Manager` - Access to dashboard analytics, products catalog, and can authorize pending approvals.
- `Employee` - Day-to-day operations (customer entry, pipeline, logistics, invoices).
- `Client` - Customer portal access. Clients can log in and view *only* their own order history, invoices, payments, and live shipping map track.

### 3. Dynamic Index pricing
- Products can be linked to standard oil indexes: **Brent Crude**, **WTI**, or **Dubai Crude**.
- Set a **Margin Offset** value (e.g., Brent + ₹250). The unit price auto-updates when benchmark prices fluctuate.
- Test endpoint `POST /api/products/benchmarks/fluctuate` simulates market pricing volatility.

### 4. Limit-Based Approval Gates
- Orders or Contracts exceeding **₹100,000** are automatically marked as `Pending Approval`.
- Managers or Company Admins can review pending drafts and approve them to advance them to `Active` or `Processing` status.

### 5. Simulated GIS Logistics Tracker
- Real-time tanker location coordinates can be tracked.
- Test endpoint `POST /api/logistics/:id/step` simulates coordinate increments (e.g. 25%, 50%, 75%, 100%) as tankers travel along standard routes.

### 6. Depletion Forecasts & Credit Risk Matrix
- **Stock Depletion Forecasts:** Predicts how many days of inventory remain before running out based on sales velocity.
- **Outstanding Credit Risk Matrix:** Identifies customers with high outstanding invoices and prints risk levels (Low, Medium, High).

