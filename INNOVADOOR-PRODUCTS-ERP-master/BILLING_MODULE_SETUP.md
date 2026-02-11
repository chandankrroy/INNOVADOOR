# Billing Module Setup Guide

## Overview

A comprehensive Billing module has been created following the same template as the "production documentation management system". The module includes:

- **Delivery Challan (DC)** creation and management
- **Tax Invoice** creation with GST compliance
- **Billing Request** workflow from Dispatch
- **Tally Integration** support
- **Role-based access control** for billing operations

## Features Implemented

### 1. Database Models (`backend/app/db/models/billing.py`)

- **BillingRequest**: Dispatch requests that need billing
- **DeliveryChallan**: Material movement documents
- **TaxInvoice**: GST compliant invoices
- **TallySync**: Tally integration tracking

### 2. API Endpoints (`backend/app/api/v1/endpoints/billing.py`)

**Billing Requests:**
- `GET /api/v1/billing/billing-requests` - List all billing requests
- `GET /api/v1/billing/billing-requests/{id}` - Get specific request
- `GET /api/v1/billing/pending-billing-requests` - Get QC approved papers ready for billing
- `POST /api/v1/billing/billing-requests` - Create billing request (Dispatch)

**Delivery Challans:**
- `GET /api/v1/billing/delivery-challans` - List all DCs
- `GET /api/v1/billing/delivery-challans/{id}` - Get specific DC
- `POST /api/v1/billing/delivery-challans` - Create DC
- `PUT /api/v1/billing/delivery-challans/{id}` - Update DC
- `POST /api/v1/billing/delivery-challans/{id}/approve` - Approve DC (Accounts Manager)

**Tax Invoices:**
- `GET /api/v1/billing/tax-invoices` - List all invoices
- `GET /api/v1/billing/tax-invoices/{id}` - Get specific invoice
- `POST /api/v1/billing/tax-invoices` - Create invoice
- `PUT /api/v1/billing/tax-invoices/{id}` - Update invoice
- `POST /api/v1/billing/tax-invoices/{id}/approve` - Approve invoice (Accounts Manager)
- `POST /api/v1/billing/tax-invoices/{id}/send-to-dispatch` - Send to dispatch

**Dashboard:**
- `GET /api/v1/billing/dashboard/stats` - Get dashboard statistics

### 3. User Roles

Three new roles have been added:
- **billing_executive**: Can create DC and invoices
- **accounts_manager**: Can approve DC/invoices, manage credit
- **dispatch_executive**: Can create billing requests, view DC/invoices

### 4. Frontend Components

**Components:**
- `BillingSidebar.tsx` - Sidebar navigation for billing module

**Pages:**
- `BillingDashboard.tsx` - Main billing dashboard with KPIs
- `BillingRequests.tsx` - List of billing requests

**Routes Added:**
- `/billing/dashboard` - Billing dashboard
- `/billing/requests` - Billing requests list
- `/billing/dc` - Delivery challans list
- `/billing/dc/create` - Create DC
- `/billing/invoice` - Tax invoices list
- `/billing/invoice/create` - Create invoice
- `/billing/history` - Billing history
- `/billing/tally` - Tally integration
- `/billing/credit` - Credit & payment status
- `/billing/reports` - Reports

## Setup Instructions

### 1. Database Migration

Since new models have been added, you need to recreate the database:

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

### 3. Register Billing Users

1. Go to `http://localhost:3000/register`
2. Fill in the form and select one of these roles:
   - **Billing Executive**
   - **Accounts Manager**
   - **Dispatch Executive**

### 4. Login and Access

1. Login with billing credentials
2. You'll be automatically redirected to `/billing/dashboard`
3. You should see:
   - Billing sidebar with all menu items
   - Top navbar
   - Dashboard with statistics cards

## Workflow

### Billing Request Flow

1. **Production Completed** → Production Paper status: `completed`
2. **QC Approved** → Production Paper status: `ready_for_dispatch`
3. **Dispatch Creates Billing Request** → Creates billing request with dispatch details
4. **Billing Creates DC** → Creates delivery challan
5. **Billing Creates Invoice** → Creates tax invoice
6. **Accounts Manager Approves** → Invoice approved
7. **Send to Dispatch** → Invoice sent to dispatch for delivery

### Status Flow

```
Billing Request: pending → dc_created → invoice_created → billing_approved → sent_to_dispatch
DC: draft → approved → sent_to_dispatch
Invoice: draft → approved → sent_to_dispatch
```

## Key Features

### ✅ Golden Rules Enforced

- ❌ No dispatch without billing approval
- ❌ Billing only after QC → Ready for Dispatch
- ❌ Billing cannot change quantity or product (from dispatch request)

### ✅ Credit Control

- Automatic credit limit checking
- Outstanding amount calculation
- Warning before invoice creation if limit exceeded

### ✅ GST Compliance

- HSN code support
- CGST/SGST/IGST calculation
- Place of supply tracking
- Tax totals auto-calculated

### ✅ Audit Trail

- Who created DC/Invoice
- Who approved
- Date & time stamps
- Linked to dispatch & production paper

## Next Steps (To Complete)

The following pages need to be fully implemented:

1. **Create DC Page** (`/billing/dc/create`) - Form to create delivery challan
2. **Create Invoice Page** (`/billing/invoice/create`) - Form to create tax invoice with GST calculation
3. **Billing History** (`/billing/history`) - View all billing transactions
4. **Tally Integration** (`/billing/tally`) - Export/Import with Tally
5. **Credit & Payment** (`/billing/credit`) - Credit limit management
6. **Reports** (`/billing/reports`) - Financial and operational reports

## API Usage Examples

### Create Billing Request (Dispatch)

```javascript
POST /api/v1/billing/billing-requests
{
  "dispatch_request_no": "DR-1023",
  "production_paper_id": 1,
  "production_paper_number": "PP-001",
  "party_id": 1,
  "party_name": "ABC Builder",
  "party_gstin": "27ABCDE1234F1Z5",
  "delivery_address": "Site Address",
  "items": [
    {
      "product_name": "Main Door",
      "door_frame_type": "Door",
      "quantity": 10,
      "uom": "Nos"
    }
  ]
}
```

### Create Delivery Challan

```javascript
POST /api/v1/billing/delivery-challans
{
  "billing_request_id": 1,
  "dispatch_request_no": "DR-1023",
  "party_id": 1,
  "party_name": "ABC Builder",
  "delivery_address": "Site Address",
  "dc_date": "2024-01-15",
  "line_items": [
    {
      "product_name": "Main Door",
      "door_frame_type": "Door",
      "quantity": 10,
      "uom": "Nos"
    }
  ]
}
```

### Create Tax Invoice

```javascript
POST /api/v1/billing/tax-invoices
{
  "billing_request_id": 1,
  "delivery_challan_id": 1,
  "dispatch_request_no": "DR-1023",
  "party_id": 1,
  "party_name": "ABC Builder",
  "party_gstin": "27ABCDE1234F1Z5",
  "place_of_supply": "Maharashtra",
  "state_code": "27",
  "invoice_date": "2024-01-15",
  "line_items": [
    {
      "product_description": "Main Door Shutter",
      "hsn_code": "4418",
      "quantity": 10,
      "rate": 5000,
      "taxable_value": 50000,
      "cgst_rate": 9,
      "sgst_rate": 9,
      "cgst_amount": 4500,
      "sgst_amount": 4500,
      "igst_amount": 0
    }
  ]
}
```

## Security

- All billing endpoints require appropriate role permissions
- Billing Executive: Can create DC and invoices
- Accounts Manager: Can approve and manage credit
- Dispatch Executive: Can create requests and view documents
- Admin: Full access

## Notes

- DC is mandatory even if invoice is created immediately
- Quantities cannot be changed in billing (from dispatch request)
- Credit limit checking is automatic
- Tally sync tracking is available for audit

