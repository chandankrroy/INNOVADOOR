"""
Example script showing how to use the raw material table extraction API.

This demonstrates:
1. How to extract the table from a production paper
2. How to retrieve the stored table
3. How to use the parsed data for calculations
"""
import requests
import json

# API Configuration
BASE_URL = "http://localhost:8000/api/v1"
TOKEN = "your_access_token_here"  # Replace with actual token

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}


def extract_raw_material_table(paper_id: int, overwrite: bool = False):
    """
    Extract and store raw material requirements table from a production paper.
    
    Args:
        paper_id: ID of the production paper
        overwrite: If True, delete existing items before creating new ones
    """
    url = f"{BASE_URL}/raw-material/production-papers/{paper_id}/extract-raw-material-table"
    
    payload = {
        "production_paper_id": paper_id,
        "overwrite_existing": overwrite
    }
    
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Successfully extracted table for paper {paper_id}")
        print(f"  Items: {len(data['items'])}")
        print(f"  Total QTY: {data['totals']['total_qty']} NOS")
        print(f"  Total SQ.FT: {data['totals']['total_sq_ft']} SQ.FT")
        return data
    else:
        print(f"✗ Error: {response.status_code}")
        print(f"  {response.text}")
        return None


def get_raw_material_table(paper_id: int):
    """
    Retrieve stored raw material requirements table for a production paper.
    """
    url = f"{BASE_URL}/raw-material/production-papers/{paper_id}/raw-material-table"
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Retrieved table for paper {paper_id}")
        print(f"  Items: {len(data['items'])}")
        print(f"  Total QTY: {data['totals']['total_qty']} NOS")
        print(f"  Total SQ.FT: {data['totals']['total_sq_ft']} SQ.FT")
        
        # Print table
        print("\nTable:")
        print(f"{'SR NO':<8} {'RO WIDTH':<12} {'RO HEIGHT':<12} {'BLDG/WINGS':<15} {'QTY':<8} {'SQ.FT':<10}")
        print("-" * 75)
        for item in data['items']:
            print(f"{item['sr_no']:<8} {item['ro_width']:<12} {item['ro_height']:<12} "
                  f"{item.get('bldg_wings', '-'):<15} {item['quantity']:<8} {item['sq_ft']:<10.2f}")
        
        return data
    else:
        print(f"✗ Error: {response.status_code}")
        print(f"  {response.text}")
        return None


def calculate_material_requirements(table_data: dict):
    """
    Example: Use the extracted table data for material requirement calculations.
    """
    items = table_data['items']
    totals = table_data['totals']
    
    print("\n=== Material Requirements Summary ===")
    print(f"Total Items: {len(items)}")
    print(f"Total Quantity: {totals['total_qty']} NOS")
    print(f"Total Square Feet: {totals['total_sq_ft']} SQ.FT")
    
    # Group by dimensions for material planning
    dimension_groups = {}
    for item in items:
        key = f"{item['ro_width']} x {item['ro_height']}"
        if key not in dimension_groups:
            dimension_groups[key] = {
                'qty': 0,
                'sq_ft': 0.0,
                'items': []
            }
        dimension_groups[key]['qty'] += item['quantity']
        dimension_groups[key]['sq_ft'] += item['sq_ft']
        dimension_groups[key]['items'].append(item)
    
    print("\n=== Grouped by Dimensions ===")
    for dim, group in dimension_groups.items():
        print(f"{dim}: QTY={group['qty']}, SQ.FT={group['sq_ft']:.2f}")
    
    return dimension_groups


# Example usage
if __name__ == "__main__":
    # Replace with actual production paper ID
    paper_id = 1
    
    print("=" * 75)
    print("Raw Material Table Extraction Example")
    print("=" * 75)
    
    # Step 1: Extract table from production paper
    print("\n1. Extracting raw material table...")
    table_data = extract_raw_material_table(paper_id, overwrite=True)
    
    if table_data:
        # Step 2: Retrieve stored table
        print("\n2. Retrieving stored table...")
        stored_table = get_raw_material_table(paper_id)
        
        if stored_table:
            # Step 3: Use data for calculations
            print("\n3. Calculating material requirements...")
            calculate_material_requirements(stored_table)
