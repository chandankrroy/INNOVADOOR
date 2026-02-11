# Raw Material Requirements Table Extraction

This document describes how to extract, store, and use the raw material requirements table from production papers.

## Overview

The raw material requirements table contains items with the following columns:
- **SR NO**: Serial number
- **RO WIDTH**: Rough opening width (in inches)
- **RO HEIGHT**: Rough opening height (in inches)
- **BLDG/WINGS**: Building/Wings identifier
- **QTY**: Quantity
- **SQ.FT**: Square feet (calculated as: Width × Height × Qty / 144)

## Database Schema

The table is stored in `raw_material_shutter_items` with the following fields:

```sql
CREATE TABLE raw_material_shutter_items (
    id INTEGER PRIMARY KEY,
    production_paper_id INTEGER NOT NULL,
    sr_no VARCHAR,
    ro_width VARCHAR,
    ro_height VARCHAR,
    bldg_wings VARCHAR,
    quantity INTEGER,
    sq_ft FLOAT,
    sq_meter FLOAT,
    laminate_sheets FLOAT,
    thickness VARCHAR,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (production_paper_id) REFERENCES production_papers(id)
);
```

## API Endpoints

### 1. Extract and Store Table

**POST** `/api/v1/raw-material/production-papers/{paper_id}/extract-raw-material-table`

Extracts the raw material requirements table from a production paper and stores it in the database.

**Request Body:**
```json
{
  "production_paper_id": 1,
  "overwrite_existing": false
}
```

**Response:**
```json
{
  "production_paper_id": 1,
  "items": [
    {
      "id": 1,
      "sr_no": "1",
      "ro_width": "34.00\"",
      "ro_height": "92.50\"",
      "bldg_wings": "A",
      "quantity": 5,
      "sq_ft": 109.20,
      "thickness": "35MM",
      "production_paper_id": 1
    }
  ],
  "totals": {
    "total_qty": 20,
    "total_sq_ft": 466.62
  },
  "message": "Successfully extracted and stored 9 raw material items"
}
```

### 2. Get Stored Table

**GET** `/api/v1/raw-material/production-papers/{paper_id}/raw-material-table`

Retrieves the stored raw material requirements table for a production paper.

**Response:** Same format as extraction endpoint.

## Usage Examples

### Python Example

```python
import requests

BASE_URL = "http://localhost:8000/api/v1"
TOKEN = "your_access_token"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# Extract table
response = requests.post(
    f"{BASE_URL}/raw-material/production-papers/1/extract-raw-material-table",
    headers=headers,
    json={"production_paper_id": 1, "overwrite_existing": True}
)

data = response.json()
print(f"Total QTY: {data['totals']['total_qty']} NOS")
print(f"Total SQ.FT: {data['totals']['total_sq_ft']} SQ.FT")
```

### JavaScript/TypeScript Example

```typescript
const extractRawMaterialTable = async (paperId: number) => {
  const response = await fetch(
    `/api/v1/raw-material/production-papers/${paperId}/extract-raw-material-table`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        production_paper_id: paperId,
        overwrite_existing: true
      })
    }
  );
  
  const data = await response.json();
  console.log(`Total QTY: ${data.totals.total_qty} NOS`);
  console.log(`Total SQ.FT: ${data.totals.total_sq_ft} SQ.FT`);
  return data;
};
```

## Processing Logic

### Grouping

Items are automatically grouped by:
- RO WIDTH
- RO HEIGHT
- BLDG/WINGS

Items with the same dimensions and building/wing have their quantities summed together.

### Calculation

**Square Feet Formula:**
```
SQ.FT = (RO WIDTH × RO HEIGHT × QTY) / 144
```

All values are extracted as numeric values (handles formats like "34.00\"", "34.00", etc.)

### Totals

- **Total QTY**: Sum of all quantities (displayed as "NOS")
- **Total SQ.FT**: Sum of all square feet values (displayed as "SQ.FT")

## Database Migration

Run the migration script to add new fields:

```bash
cd backend
python add_raw_material_table_fields.py
```

This will add:
- `sr_no` column
- `bldg_wings` column
- `updated_at` column

## Utility Functions

The `raw_material_parser.py` module provides utility functions:

- `extract_numeric_value(value)`: Extracts numeric value from measurement strings
- `calculate_square_feet(width, height, qty)`: Calculates square feet
- `group_measurement_items(items)`: Groups items by dimensions
- `parse_raw_material_table(items, paper_id)`: Main parsing function
- `format_table_for_display(parsed_data)`: Formats data for frontend display

## Integration with Frontend

The frontend component `ViewProductionPaper.tsx` already displays this table. To use the stored data:

1. Call the extraction endpoint when viewing a production paper
2. Store the response in component state
3. Display the table with calculated values
4. Use totals for reporting

## Error Handling

The API returns appropriate HTTP status codes:
- `200`: Success
- `400`: Bad request (invalid data, no measurement items)
- `404`: Production paper not found
- `500`: Internal server error

## Notes

- Items are automatically grouped to avoid duplicates
- Quantities are summed for items with same dimensions
- All calculations preserve numeric precision
- The table can be re-extracted with `overwrite_existing: true` to update stored data
