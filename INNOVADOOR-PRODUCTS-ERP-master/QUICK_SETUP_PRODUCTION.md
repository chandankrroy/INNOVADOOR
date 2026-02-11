# Quick Setup for Production Docs Management

## Step 1: Reinitialize Database

Since we added new models, you need to recreate the database:

```powershell
cd backend
# Delete old database
del app.db

# Reinitialize with new models
python init_db.py
```

## Step 2: Restart Backend

```powershell
python -m uvicorn app.main:app --reload --port 8000
```

## Step 3: Register as Production Manager

1. Go to `http://localhost:3000/register`
2. Fill in the form:
   - Username: `prodmanager`
   - Organization Slug: `production-docs`
   - **Role: Select "Production Paper Management"** ⭐
   - Email: `manager@example.com`
   - Password: (at least 8 characters)
3. Click Register

## Step 4: Login

1. Login with your credentials
2. You'll be redirected to the Production Dashboard
3. You should see:
   - Sidebar on the left with all menu items
   - Top navbar
   - Dashboard with statistics cards

## Step 5: Test the Features

### Create a Measurement:
1. Click "New Measurements" → "Create Measurements"
2. Fill in: Name, Value, Unit (optional), Description
3. Click "Create Measurement"

### Create a Party:
1. Click "New Parties" → "Create Party"
2. Fill in: Party Name, Contact Person, Email, Phone, Address
3. Click "Create Party"

### Create a Production Paper:
1. Click "New Production Paper" → "Create Production Paper"
2. Fill in: Paper Number, Title, Status
3. Optionally link to a Party and Measurement
4. Click "Create Production Paper"

## Menu Structure

```
Dashboard
├── New Measurements
│   ├── Create Measurements
│   └── View Measurements
├── New Parties
│   ├── Create Party
│   └── View Party
└── New Production Paper
    ├── Create Production Paper
    └── Production Papers
```

## Troubleshooting

- **Can't see sidebar**: Make sure you registered with "Production Paper Management" role
- **403 Forbidden**: Your user doesn't have the `production_manager` role
- **Database errors**: Make sure you reinitialized the database after model changes

