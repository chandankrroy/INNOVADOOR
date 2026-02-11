# Fix Empty Production Paper Fields

## Overview
The production paper is showing empty fields for: Frontside Design, Backside Design, Frontside Laminate, Backside Laminate, Gel Colour, Grade, Side Frame, Filler, FOAM Bottom, FRP Coating, and Remark. These fields are being sent from the frontend but are not being saved/retrieved because they don't exist in the database model.

## Root Cause
- The database model (`ProductionPaper` in `backend/app/db/models/user.py`) is missing these columns
- The backend uses `getattr()` to access them (indicating they may not exist)
- The frontend sends these fields when creating a paper, but they're not persisted
- The schema (`ProductionPaperBase`) also doesn't include all these fields

## Missing Fields
1. `frontside_design` - String, nullable
2. `backside_design` - String, nullable  
3. `frontside_laminate` - String, nullable
4. `backside_laminate` - String, nullable
5. `grade` - String, nullable
6. `side_frame` - String, nullable
7. `filler` - String, nullable
8. `foam_bottom` - String, nullable
9. `frp_coating` - String, nullable

## Implementation Steps

### 1. Add Fields to Database Model
- **File**: `backend/app/db/models/user.py`
- **Location**: In `ProductionPaper` class (after line 275)
- **Action**: Add Column definitions for all missing fields

### 2. Update Schema
- **File**: `backend/app/schemas/user.py`
- **Location**: In `ProductionPaperBase` class (after line 375)
- **Action**: Add field definitions for all missing fields

### 3. Create Migration Script
- **File**: `backend/migrate_add_shutter_fields_to_production_papers.py`
- **Action**: Create migration to add these columns to the database

### 4. Update Backend Endpoint
- **File**: `backend/app/api/v1/endpoints/production.py`
- **Location**: In `create_production_paper` and `get_production_paper` functions
- **Action**: Ensure these fields are properly saved and retrieved (remove getattr, use direct access)

## Files to Modify
1. `backend/app/db/models/user.py` - Add column definitions
2. `backend/app/schemas/user.py` - Add schema fields
3. `backend/migrate_add_shutter_fields_to_production_papers.py` - Create migration (new file)
4. `backend/app/api/v1/endpoints/production.py` - Update field access

## Notes
- These fields are Shutter-specific (except frontside_design, backside_design, gel_colour which are common)
- Fields should be nullable since they're optional
- Migration should check if columns exist before adding them
- Test with existing production papers to ensure backward compatibility








