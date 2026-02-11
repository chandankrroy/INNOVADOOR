# Sales & Marketing Module Setup

## Overview

A comprehensive Sales & Marketing module has been created following the same template as the "production documentation management system". The module includes:

- **Lead Management** - Capture and track leads
- **Customer/Party Master** - Manage customer information
- **Site & Project Management** - Track multiple sites per builder
- **Quotation Management** - Create and manage quotations
- **Order Confirmation** - Convert quotations to orders
- **Measurement Request** - Auto-trigger measurement requests
- **Follow-ups & Communication** - CRM features for tracking communications
- **Sales Reports** - Analytics and reporting

## Features Implemented

### 1. Backend Models (`backend/app/db/models/sales.py`)

- **Lead**: Lead management with conversion tracking
- **SiteProject**: Site and project management linked to parties
- **Quotation**: Quotation management with line items and discount approval
- **SalesOrder**: Sales orders that trigger production flow
- **MeasurementRequest**: Auto-created measurement requests
- **FollowUp**: Follow-up and communication tracking

### 2. Backend Schemas (`backend/app/schemas/sales.py`)

Complete Pydantic schemas for all sales entities with validation.

### 3. API Endpoints (`backend/app/api/v1/endpoints/sales.py`)

**Dashboard:**
- `GET /api/v1/sales/dashboard/stats` - Get dashboard statistics

**Lead Management:**
- `POST /api/v1/sales/leads` - Create lead
- `GET /api/v1/sales/leads` - List all leads
- `GET /api/v1/sales/leads/{id}` - Get specific lead
- `PUT /api/v1/sales/leads/{id}` - Update lead
- `POST /api/v1/sales/leads/{id}/convert` - Convert lead to party

**Site/Project Management:**
- `POST /api/v1/sales/sites` - Create site/project
- `GET /api/v1/sales/sites` - List all sites
- `GET /api/v1/sales/sites/{id}` - Get specific site
- `PUT /api/v1/sales/sites/{id}` - Update site

**Quotation Management:**
- `POST /api/v1/sales/quotations` - Create quotation
- `GET /api/v1/sales/quotations` - List all quotations
- `GET /api/v1/sales/quotations/{id}` - Get specific quotation
- `PUT /api/v1/sales/quotations/{id}` - Update quotation
- `POST /api/v1/sales/quotations/{id}/approve-discount` - Approve discount (Sales Manager)

**Sales Orders:**
- `POST /api/v1/sales/sales-orders` - Create sales order (auto-creates measurement request)
- `GET /api/v1/sales/sales-orders` - List all orders
- `GET /api/v1/sales/sales-orders/{id}` - Get specific order
- `PUT /api/v1/sales/sales-orders/{id}` - Update order

**Measurement Requests:**
- `GET /api/v1/sales/measurement-requests` - List all requests
- `GET /api/v1/sales/measurement-requests/{id}` - Get specific request
- `PUT /api/v1/sales/measurement-requests/{id}` - Update request

**Follow-ups:**
- `POST /api/v1/sales/follow-ups` - Create follow-up
- `GET /api/v1/sales/follow-ups` - List all follow-ups
- `GET /api/v1/sales/follow-ups/{id}` - Get specific follow-up
- `PUT /api/v1/sales/follow-ups/{id}` - Update follow-up

### 4. User Roles

Three new roles have been added:
- **marketing_executive**: Can create leads
- **sales_executive**: Can convert leads, create orders
- **sales_manager**: Can approve pricing & orders

### 5. Frontend Components

**Components:**
- `SalesSidebar.tsx` - Sidebar navigation for sales module
- `SalesNavbar.tsx` - Top navbar for sales module

**Pages:**
- `SalesDashboard.tsx` - Main sales dashboard with KPIs
- `Leads.tsx` - Lead management list view
- `CreateLead.tsx` - Create new lead form

**Routes Added:**
- `/sales/dashboard` - Sales dashboard
- `/sales/leads` - Lead management
- `/sales/leads/create` - Create lead

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

### 3. Register Sales Users

1. Go to `http://localhost:3000/register`
2. Fill in the form and select one of these roles:
   - **Marketing Executive**
   - **Sales Executive**
   - **Sales Manager**

### 4. Login and Access

1. Login with sales credentials
2. You'll be automatically redirected to `/sales/dashboard`
3. You should see:
   - Sales sidebar with all menu items
   - Top navbar
   - Dashboard with KPI cards

## Workflow

### Lead to Order Flow

1. **Create Lead** → Marketing Executive creates a lead
2. **Qualify Lead** → Sales Executive qualifies the lead
3. **Create Quotation** → Sales Executive creates quotation
4. **Approve Discount** → Sales Manager approves discount (if applicable)
5. **Create Order** → Sales Executive confirms order
6. **Auto-Create Measurement Request** → System automatically creates measurement request
7. **Measurement** → Measurement engineer completes measurement
8. **Production** → Production flow begins

## Dashboard KPIs

The sales dashboard displays:
- **New Leads** (30 days)
- **Active Opportunities** (Qualified, Quotation Sent)
- **Orders Confirmed**
- **Measurement Pending**
- **Sales Value (MTD)** - Month to date sales value
- **Lead Conversion Rate** - Percentage of leads converted to orders

## Lead Pipeline

The dashboard shows the lead pipeline:
- New → Qualified → Quotation → Negotiation → Order Confirmed

## Permissions

| Role | Permissions |
|------|------------|
| Marketing Exec | Create leads |
| Sales Exec | Convert leads, create orders, create quotations |
| Sales Manager | Approve pricing & orders, all sales exec permissions |
| Admin | Full access |

## Integration with Production

Once an order is confirmed:
1. Sales Order is created
2. Measurement Request is automatically created
3. When measurement is completed, it links to the order
4. Production Paper can be created from the order
5. Sales cannot edit orders after production starts

## Next Steps

The following pages need to be created (following the same pattern as Leads):

1. **Site & Project Management** (`/sales/sites`)
   - View sites
   - Create site
   - Edit site

2. **Quotation Management** (`/sales/quotations`)
   - View quotations
   - Create quotation (with line items)
   - Edit quotation
   - Approve discount (Sales Manager)

3. **Order Confirmation** (`/sales/orders`)
   - View orders
   - Create order from quotation
   - View order details

4. **Measurement Requests** (`/sales/measurement-requests`)
   - View measurement requests
   - Assign engineer
   - Track completion

5. **Follow-ups & Communication** (`/sales/follow-ups`)
   - View follow-ups
   - Create follow-up
   - Filter by lead/order

6. **Sales Reports** (`/sales/reports`)
   - Lead conversion rate
   - Builder-wise sales
   - Product-wise demand
   - Sales trends

## Notes

- All sales endpoints require appropriate role permissions
- Quotation line items are stored as JSON for flexibility
- Discount approval is required for quotations with discounts (Sales Manager)
- Measurement requests are auto-created when orders are confirmed
- Sales cannot edit orders after production has started

