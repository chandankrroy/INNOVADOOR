"""
Utility functions for parsing and processing raw material requirements tables
from production papers.
"""
from typing import List, Dict, Any, Optional
import re


def extract_numeric_value(value: Any) -> float:
    """
    Extract numeric value from measurement string.
    Handles formats like "34.00\"", "34.00", 34.00, etc.
    """
    if value is None or value == '-' or value == '':
        return 0.0
    
    if isinstance(value, (int, float)):
        return float(value)
    
    str_value = str(value).strip()
    # Remove quotes and extract numeric value
    str_value = str_value.replace('"', '').replace("'", '')
    num_match = re.search(r'[\d.]+', str_value)
    
    if not num_match:
        return 0.0
    
    try:
        return float(num_match.group())
    except (ValueError, AttributeError):
        return 0.0


def calculate_square_feet(width: Any, height: Any, qty: Any) -> float:
    """
    Calculate square feet: (Width x Height x Qty) / 144
    """
    width_num = extract_numeric_value(width)
    height_num = extract_numeric_value(height)
    qty_num = extract_numeric_value(qty) or 1.0
    
    if width_num == 0 or height_num == 0:
        return 0.0
    
    sq_ft = (width_num * height_num * qty_num) / 144.0
    return round(sq_ft, 2)


def group_measurement_items(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Group measurement items by RO WIDTH, RO HEIGHT, and BLDG/Wings.
    Sums quantities for items with the same dimensions and building/wing.
    
    Args:
        items: List of measurement item dictionaries
        
    Returns:
        List of grouped items with summed quantities
    """
    grouped = {}
    
    for item in items:
        # Extract values
        ro_width = item.get('ro_width') or item.get('width') or item.get('w') or item.get('act_width') or ''
        ro_height = item.get('ro_height') or item.get('height') or item.get('h') or item.get('act_height') or ''
        bldg = item.get('bldg') or item.get('bldg_wing') or item.get('wall') or item.get('flat') or item.get('flat_no') or ''
        qty = extract_numeric_value(item.get('qty') or item.get('quantity') or 1)
        sr_no = item.get('sr_no') or ''
        
        # Create unique key for grouping
        key = f"{ro_width}-{ro_height}-{bldg}"
        
        if key in grouped:
            # Sum quantities for existing group
            grouped[key]['qty'] += qty
        else:
            # Create new group
            grouped[key] = {
                'sr_no': sr_no,
                'ro_width': ro_width,
                'ro_height': ro_height,
                'bldg_wings': bldg,
                'qty': qty,
                'original_item': item  # Keep reference to original item for other fields
            }
    
    # Convert to list and assign sequential SR.NO
    result = []
    for idx, (key, group) in enumerate(grouped.items(), 1):
        # Always assign sequential SR.NO starting from 1
        group['sr_no'] = str(idx)
        result.append(group)
    
    return result


def parse_raw_material_table(
    measurement_items: List[Dict[str, Any]],
    production_paper_id: int
) -> Dict[str, Any]:
    """
    Parse raw material requirements table from production paper measurement items.
    
    Args:
        measurement_items: List of measurement items from production paper
        production_paper_id: ID of the production paper
        
    Returns:
        Dictionary containing:
        - items: List of parsed table rows
        - totals: Dictionary with total_qty and total_sq_ft
    """
    # Group items by dimensions
    grouped_items = group_measurement_items(measurement_items)
    
    # Process each item and calculate SQ.FT
    table_rows = []
    total_qty = 0.0
    total_sq_ft = 0.0
    
    for idx, item in enumerate(grouped_items, 1):
        ro_width = item['ro_width']
        ro_height = item['ro_height']
        qty = item['qty']
        sq_ft = calculate_square_feet(ro_width, ro_height, qty)
        
        table_row = {
            'sr_no': str(idx),  # Ensure sequential numbering starting from 1
            'ro_width': ro_width,
            'ro_height': ro_height,
            'bldg_wings': item['bldg_wings'],
            'qty': int(qty) if isinstance(qty, (int, float)) and qty == int(qty) else qty,
            'sq_ft': round(sq_ft, 2)  # Round to 2 decimal places
        }
        
        table_rows.append(table_row)
        total_qty += qty
        total_sq_ft += sq_ft
    
    return {
        'production_paper_id': production_paper_id,
        'items': table_rows,
        'totals': {
            'total_qty': int(total_qty) if total_qty == int(total_qty) else round(total_qty, 2),
            'total_sq_ft': round(total_sq_ft, 2)
        }
    }


def format_table_for_display(parsed_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Format parsed table data for frontend display.
    
    Args:
        parsed_data: Output from parse_raw_material_table
        
    Returns:
        Formatted data with display-ready values
    """
    formatted_items = []
    
    for item in parsed_data['items']:
        formatted_item = {
            'sr_no': item['sr_no'],
            'ro_width': format_measurement_display(item['ro_width']),
            'ro_height': format_measurement_display(item['ro_height']),
            'bldg_wings': item['bldg_wings'] or '-',
            'qty': item['qty'],
            'sq_ft': f"{item['sq_ft']:.2f}"
        }
        formatted_items.append(formatted_item)
    
    return {
        'items': formatted_items,
        'totals': {
            'total_qty': f"{parsed_data['totals']['total_qty']} NOS",
            'total_sq_ft': f"{parsed_data['totals']['total_sq_ft']:.2f} SQ.FT"
        }
    }


def format_measurement_display(value: Any) -> str:
    """
    Format measurement value for display (adds inches symbol if numeric).
    """
    if not value or value == '-' or value == '':
        return '-'
    
    num_value = extract_numeric_value(value)
    if num_value == 0:
        return str(value) if value else '-'
    
    # If value already has quotes, return as is
    str_value = str(value)
    if '"' in str_value or "'" in str_value:
        return str_value
    
    return f"{num_value:.2f}\""
