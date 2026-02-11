# Production Documentation Management System

## Overview

A complete role-based access control system with a Production Paper Management portal. Users with the "Production Paper Management" role can access a professional dashboard to manage measurements, parties, and production papers.

## Features

### Role-Based Access Control
- **User Roles**: `user`, `production_manager`, `admin`
- **Production Manager Portal**: Specialized dashboard for production documentation
- **Protected Routes**: Role-based route protection on both backend and frontend

### Production Manager Dashboard Menu
1. **Dashboard** - Overview with statistics and quick actions
2. **New Measurements**
   - Create Measurements
   - View Measurements
3. **New Parties**
   - Create Party
   - View Party
4. **New Production Paper**
   - Create Production Paper
   - Production Papers (list view)

## Backend Structure

### Models
- `User` - Added `role` field
- `Measurement` - Production measurements
- `Party` - Business parties/contacts
- `ProductionPaper` - Production documentation papers

### API Endpoints

**Authentication:**
- `POST /api/v1/auth/register` - Register with role selection
- `POST /api/v1/auth/login` - Login (returns access + refresh tokens)
- `POST /api/v1/auth/refresh` - Refresh tokens
- `GET /api/v1/auth/me` - Get current user info

**Production Management (requires `production_manager` role):**
- `POST /api/v1/production/measurements` - Create measurement
- `GET /api/v1/production/measurements` - List all measurements
- `GET /api/v1/production/measurements/{id}` - Get measurement
- `POST /api/v1/production/parties` - Create party
- `GET /api/v1/production/parties` - List all parties
- `GET /api/v1/production/parties/{id}` - Get party
- `POST /api/v1/production/production-papers` - Create production paper
- `GET /api/v1/production/production-papers` - List all papers
- `GET /api/v1/production/production-papers/{id}` - Get paper
- `PUT /api/v1/production/production-papers/{id}` - Update paper

## Frontend Structure

### Components
- `Sidebar.tsx` - Professional sidebar navigation (production managers only)
- `Navbar.tsx` - Top navigation bar
- `Dashboard.tsx` - Role-based dashboard (different views per role)

### Pages
- `/dashboard` - Main dashboard
- `/measurements` - View all measurements
- `/measurements/create` - Create new measurement
- `/parties` - View all parties
- `/parties/create` - Create new party
- `/production-papers` - View all production papers
- `/production-papers/create` - Create new production paper

## How to Use

### 1. Register as Production Manager

1. Go to `/register`
2. Fill in all fields
3. **Select "Production Paper Management" from the Role dropdown**
4. Complete registration

### 2. Login

1. Login with your credentials
2. If you have `production_manager` role, you'll see the production dashboard
3. The sidebar will show all production management menu items

### 3. Using the Dashboard

- **Dashboard**: Overview with statistics and quick action buttons
- **Measurements**: Create and view production measurements
- **Parties**: Manage business parties/contacts
- **Production Papers**: Create and manage production documentation

## Database Migration

After updating the models, you need to recreate the database:

```bash
cd backend
# Delete old database
rm app.db  # or delete manually

# Reinitialize
python init_db.py
```

## Testing

1. **Register a Production Manager:**
   - Email: `manager@example.com`
   - Role: `Production Paper Management`
   
2. **Login and Access Dashboard:**
   - You should see the sidebar with all menu items
   - Dashboard shows statistics cards
   - All menu items are accessible

3. **Create Data:**
   - Create a measurement
   - Create a party
   - Create a production paper (can link to party and measurement)

## Security

- All production endpoints require `production_manager` or `admin` role
- Role-based route protection on frontend
- JWT tokens with refresh token support
- Automatic token refresh on expiry

