# Purchase Management Module Setup

## Overview

A comprehensive Purchase Management system with role-based access control. Users with Purchase Management credentials can access a professional dashboard to manage vendors, purchase requisitions, purchase orders, GRNs, purchase returns, and vendor bills.

## Features

### Role-Based Access Control
- **User Roles**: `purchase_executive`, `purchase_manager`, `store_incharge`, `admin`
- **Purchase Portal**: Specialized dashboard for purchase management
- **Protected Routes**: Role-based route protection on both backend and frontend

### Purchase Management Dashboard Menu
1. **Purchase Dashboard** - Overview with KPI cards and quick actions
2. **Material Requirement (PR)**
   - Create PR
   - View PRs
   - Pending Approval
3. **Vendor Master**
   - Create Vendor
   - View Vendors
4. **Purchase Order (PO)**
   - Create PO
   - View POs
   - Pending & Open POs
5. **Goods Receipt Note (GRN)**
   - Create GRN
   - View GRNs
6. **Purchase Returns**
   - Create Return
   - View Returns
7. **Vendor Bills**
   - Create Bill
   - View Bills
   - Pending Payment
8. **Purchase Reports**

## Backend Structure

### Models
- `Vendor` - Vendor master data
- `BOM` - Bill of Materials (links Production Papers to Material Requirements)
- `PurchaseRequisition` - Material requirement requests (PR)
- `PurchaseOrder` - Purchase orders placed to vendors (PO)
- `GRN` - Goods Receipt Note (material receipt at store)
- `PurchaseReturn` - Return of rejected/damaged material
- `VendorBill` - Bills received from vendors for payment

### API Endpoints

**Purchase Dashboard:**
- `GET /api/v1/purchase/dashboard/kpis` - Get dashboard KPIs

**Vendor Master:**
- `POST /api/v1/purchase/vendors` - Create vendor
- `GET /api/v1/purchase/vendors` - List all vendors
- `GET /api/v1/purchase/vendors/{vendor_id}` - Get vendor

**Purchase Requisition (PR):**
- `POST /api/v1/purchase/purchase-requisitions` - Create PR
- `GET /api/v1/purchase/purchase-requisitions` - List all PRs
- `GET /api/v1/purchase/purchase-requisitions/{pr_id}` - Get PR
- `PUT /api/v1/purchase/purchase-requisitions/{pr_id}/approve` - Approve PR (Purchase Manager only)

**Purchase Order (PO):**
- `POST /api/v1/purchase/purchase-orders` - Create PO
- `GET /api/v1/purchase/purchase-orders` - List all POs
- `GET /api/v1/purchase/purchase-orders/{po_id}` - Get PO
- `PUT /api/v1/purchase/purchase-orders/{po_id}/approve` - Approve PO (Purchase Manager only)
- `PUT /api/v1/purchase/purchase-orders/{po_id}/send-to-vendor` - Send PO to vendor

**GRN (Goods Receipt Note):**
- `POST /api/v1/purchase/grns` - Create GRN (Store Incharge only)
- `GET /api/v1/purchase/grns` - List all GRNs
- `GET /api/v1/purchase/grns/{grn_id}` - Get GRN
- `PUT /api/v1/purchase/grns/{grn_id}/approve` - Approve GRN

**Purchase Returns:**
- `POST /api/v1/purchase/purchase-returns` - Create purchase return
- `GET /api/v1/purchase/purchase-returns` - List all returns

**Vendor Bills:**
- `POST /api/v1/purchase/vendor-bills` - Create vendor bill
- `GET /api/v1/purchase/vendor-bills` - List all bills
- `GET /api/v1/purchase/vendor-bills/{bill_id}` - Get bill

## Frontend Structure

### Components
- `PurchaseSidebar.tsx` - Professional sidebar navigation (purchase users only)
- `PurchaseNavbar.tsx` - Top navigation bar

### Pages
- `/purchase/dashboard` - Main purchase dashboard with KPIs
- `/purchase/pr` - View all purchase requisitions
- `/purchase/pr/create` - Create new PR
- `/purchase/pr/pending` - Pending approval PRs

## How to Use

### 1. Reinitialize Database

Since we added new models, you need to recreate the database:

```powershell
cd backend
# Delete old database
del app.db

# Reinitialize with new models
python init_db.py
```

### 2. Restart Backend

```powershell
python -m uvicorn app.main:app --reload --port 8000
```

### 3. Register as Purchase User

1. Go to `http://localhost:3000/register`
2. Fill in the form:
   - Username: `purchaseexec`
   - Organization Slug: `purchase-mgmt`
   - **Role: Select one of:**
     - `Purchase Executive` (create PR & PO)
     - `Purchase Manager` (approve PO)
     - `Store Incharge` (GRN & QC)
   - Email: `purchase@example.com`
   - Password: (at least 8 characters)
3. Click Register

### 4. Login

1. Login with your credentials
2. If you have a purchase role, you'll be redirected to the Purchase Dashboard
3. The sidebar will show all purchase management menu items

## Roles & Permissions

| Role | Permissions |
|------|-------------|
| Purchase Exec | Create PR & PO |
| Purchase Manager | Approve PO |
| Store Incharge | GRN & QC |
| Admin | Full access |

## Golden Rules

✅ **No purchase without approved requirement**
- PR must be approved before PO creation

✅ **No payment without GRN**
- Vendor bill requires approved GRN reference

## Purchase Flow

```
Sales Order
   ↓
Measurement
   ↓
Production Paper
   ↓
Material Requirement (BOM)
   ↓
Purchase Management
   ├── Purchase Requisition (PR)
   ├── Purchase Order (PO)
   ├── Goods Receipt Note (GRN)
   ├── Purchase Returns
   └── Vendor Bills
   ↓
Store / Inventory
   ↓
Production
```

## Dashboard KPIs

The Purchase Dashboard displays:
- 🧾 PR Pending Approval
- 📦 Open Purchase Orders
- 🚚 Material In Transit
- ❌ Shortage / Rejection
- 💰 Payables Due
- 💰 Payables Amount

## Integration Points

### Production Paper Integration
- PRs can be auto-generated from Production Papers via BOM
- POs are linked to Production Papers
- Material availability affects production schedule

### Accounts Integration
- Vendor bills link to Accounts module for payment processing
- Payment status tracked in vendor bills

### Inventory Integration
- GRN approval auto-updates inventory
- Purchase returns update stock

## Testing

1. **Create a Vendor:**
   - Go to Vendor Master → Create Vendor
   - Fill in vendor details
   - Save

2. **Create a PR:**
   - Go to Material Requirement → Create PR
   - Fill in material details
   - Link to Production Paper (optional)
   - Submit for approval

3. **Approve PR (as Purchase Manager):**
   - Go to PR → Pending Approval
   - Review and approve

4. **Create PO:**
   - Go to Purchase Order → Create PO
   - Select approved PR
   - Select vendor
   - Add line items
   - Submit for approval

5. **Create GRN (as Store Incharge):**
   - Go to GRN → Create GRN
   - Link to PO (mandatory)
   - Enter received quantities
   - Perform QC
   - Approve

6. **Create Vendor Bill:**
   - Go to Vendor Bills → Create Bill
   - Link to approved GRN (mandatory)
   - Enter bill details
   - Submit for payment

## Security

- All purchase endpoints require appropriate purchase roles
- PR approval requires `purchase_manager` role
- PO approval requires `purchase_manager` role
- GRN creation requires `store_incharge` role
- No GRN without PO
- No payment without GRN

## Next Steps

To complete the module, you may want to add:
1. Create PR form page
2. Create PO form page
3. Create GRN form page with QC parameters
4. Create Vendor form page
5. Create Vendor Bill form page
6. Purchase Reports page
7. Tally Integration endpoints
8. BOM auto-generation from Production Papers

## Troubleshooting

- **Can't see sidebar**: Make sure you registered with a purchase role
- **403 Forbidden**: Your user doesn't have the required purchase role
- **Database errors**: Make sure you reinitialized the database after adding models

