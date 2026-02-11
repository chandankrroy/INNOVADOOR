# Raw Material Requirements Table Extraction - Solution Summary

## Overview

This solution provides a complete system to extract, parse, store, and retrieve the raw material requirements table from production papers. The table contains items with dimensions, quantities, and calculated square footage.

## Components Created

### 1. Database Model Updates
**File:** `backend/app/db/models/user.py`

- Updated `RawMaterialShutterItem` model to include:
  - `sr_no`: Serial number
  - `bldg_wings`: Building/Wings identifier
  - `updated_at`: Timestamp for updates

### 2. Schema Definitions
**File:** `backend/app/schemas/user.py`

- Updated `RMShutterItem` schema with new fields
- Added `RawMaterialTableRequest` schema for API requests
- Added `RawMaterialTableResponse` schema for API responses

### 3. Utility Functions
**File:** `backend/app/utils/raw_material_parser.py`

Core functions:
- `extract_numeric_value()`: Extracts numeric values from various formats
- `calculate_square_feet()`: Calculates SQ.FT using formula (Width × Height × Qty) / 144
- `group_measurement_items()`: Groups items by RO WIDTH, RO HEIGHT, and BLDG/Wings
- `parse_raw_material_table()`: Main parsing function
- `format_table_for_display()`: Formats data for frontend

### 4. API Endpoints
**File:** `backend/app/api/v1/endpoints/raw_material.py`

Two new endpoints:

#### a. Extract and Store Table
```
POST /api/v1/raw-material/production-papers/{paper_id}/extract-raw-material-table
```
- Extracts table from production paper measurement items
- Groups items by dimensions
- Calculates SQ.FT for each row
- Stores in database
- Returns parsed data with totals

#### b. Get Stored Table
```
GET /api/v1/raw-material/production-papers/{paper_id}/raw-material-table
```
- Retrieves stored table from database
- Returns formatted data with totals

### 5. Database Migration
**File:** `backend/add_raw_material_table_fields.py`

Script to add new columns to existing database:
- `sr_no`
- `bldg_wings`
- `updated_at`

### 6. Example Usage
**File:** `backend/example_extract_raw_material_table.py`

Complete Python example showing:
- How to extract table
- How to retrieve stored table
- How to use data for calculations

## How It Works

### Step 1: Data Extraction
1. Fetch production paper from database
2. Parse `selected_measurement_items` (supports both old and new formats)
3. Load measurement items from related measurements

### Step 2: Processing
1. **Grouping**: Items are grouped by:
   - RO WIDTH
   - RO HEIGHT
   - BLDG/WINGS
   
2. **Quantity Summing**: Items with same dimensions have quantities summed

3. **Calculation**: For each grouped item:
   ```
   SQ.FT = (RO WIDTH × RO HEIGHT × QTY) / 144
   ```

4. **Serial Numbering**: Sequential SR.NO assigned to grouped items

### Step 3: Storage
1. Delete existing items (if `overwrite_existing: true`)
2. Create new database records for each table row
3. Store all calculated values

### Step 4: Retrieval
1. Query database for stored items
2. Calculate totals
3. Return formatted response

## Table Structure

The extracted table has the following structure:

| Column | Type | Description |
|--------|------|-------------|
| SR NO | String | Serial number (1, 2, 3, ...) |
| RO WIDTH | String | Rough opening width (e.g., "34.00\"") |
| RO HEIGHT | String | Rough opening height (e.g., "92.50\"") |
| BLDG/WINGS | String | Building/Wings identifier (e.g., "A") |
| QTY | Integer | Quantity (summed for grouped items) |
| SQ.FT | Float | Square feet (calculated) |

**Totals Row:**
- Total QTY: Sum of all quantities (displayed as "NOS")
- Total SQ.FT: Sum of all square feet (displayed as "SQ.FT")

## Usage Flow

### Backend API Usage

```python
# 1. Extract and store table
POST /api/v1/raw-material/production-papers/1/extract-raw-material-table
Body: {
    "production_paper_id": 1,
    "overwrite_existing": true
}

# 2. Retrieve stored table
GET /api/v1/raw-material/production-papers/1/raw-material-table
```

### Frontend Integration

The frontend component `ViewProductionPaper.tsx` already displays this table. To integrate with the stored data:

1. Call extraction endpoint when viewing production paper
2. Store response in component state
3. Display table with calculated values
4. Use totals for reporting

## Key Features

1. **Automatic Grouping**: Items with same dimensions are automatically grouped
2. **Quantity Summing**: Quantities are summed for grouped items
3. **Precise Calculations**: All numeric values are properly extracted and calculated
4. **Format Handling**: Handles various input formats (inches with quotes, plain numbers, etc.)
5. **Database Storage**: Persistent storage for later retrieval and reporting
6. **Error Handling**: Comprehensive error handling with appropriate HTTP status codes

## Testing

To test the solution:

1. Run database migration:
   ```bash
   cd backend
   python add_raw_material_table_fields.py
   ```

2. Start backend server:
   ```bash
   python -m uvicorn app.main:app --reload
   ```

3. Test API endpoints using the example script or Postman/curl

4. Verify data in database:
   ```sql
   SELECT * FROM raw_material_shutter_items WHERE production_paper_id = 1;
   ```

## Next Steps

1. **Frontend Integration**: Update frontend to call extraction endpoint
2. **Reporting**: Use stored data for raw material requirement reports
3. **Export**: Add Excel/PDF export functionality using stored data
4. **Validation**: Add validation for extracted data
5. **Caching**: Consider caching for frequently accessed tables

## Files Modified/Created

### Modified:
- `backend/app/db/models/user.py` - Added fields to RawMaterialShutterItem
- `backend/app/schemas/user.py` - Added new schemas
- `backend/app/api/v1/endpoints/raw_material.py` - Added new endpoints

### Created:
- `backend/app/utils/raw_material_parser.py` - Utility functions
- `backend/add_raw_material_table_fields.py` - Migration script
- `backend/example_extract_raw_material_table.py` - Usage example
- `RAW_MATERIAL_TABLE_EXTRACTION.md` - API documentation
- `RAW_MATERIAL_TABLE_SOLUTION_SUMMARY.md` - This file

## Notes

- The solution handles both old format (array of indices) and new format (array of objects with measurement_id, item_index)
- All calculations preserve numeric precision
- The table can be re-extracted to update stored data
- Items are automatically deduplicated by grouping
