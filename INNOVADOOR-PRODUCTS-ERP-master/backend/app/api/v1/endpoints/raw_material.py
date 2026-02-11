from fastapi import APIRouter, Depends, HTTPException, status, Body, Response
from sqlalchemy.orm import Session, joinedload
from typing import List, Any
from datetime import datetime
import json
import re
import math

from app.schemas.user import (
    Supplier, SupplierCreate,
    RawMaterialCheck, RawMaterialCheckCreate,
    Order, OrderCreate,
    ProductSupplierMapping, ProductSupplierMappingCreate,
    RawMaterialCategory, RawMaterialCategoryCreate, RawMaterialCategoryUpdate,
    RawMaterialTableRequest, RawMaterialTableResponse, RMShutterItem
)
from app.db.models.raw_material import (
    Supplier as DBSupplier,
    RawMaterialCheck as DBRawMaterialCheck,
    Order as DBOrder,
    ProductSupplierMapping as DBProductSupplierMapping,
    RawMaterialCategory as DBRawMaterialCategory
)
from app.db.models.user import (
    ProductionPaper as DBProductionPaper,
    Measurement as DBMeasurement,
    ProductionShutterItem,
    RawMaterialShutterItem as DBRawMaterialShutterItem
)
from app.api.deps import get_db, get_raw_material_checker, get_production_access
from app.utils.raw_material_parser import parse_raw_material_table
from app.utils.pdf_generator import generate_raw_material_pdf

router = APIRouter()


def generate_next_check_number(db: Session) -> str:
    """Generate the next raw material check number in format RMC001, RMC002, etc."""
    checks = db.query(DBRawMaterialCheck.check_number).filter(
        DBRawMaterialCheck.check_number.like('RMC%')
    ).all()
    
    max_num = 0
    for check in checks:
        match = re.match(r'RMC(\d+)', check.check_number)
        if match:
            num = int(match.group(1))
            if num > max_num:
                max_num = num
    
    next_num = max_num + 1
    return f"RMC{next_num:03d}"


def generate_next_order_number(db: Session) -> str:
    """Generate the next order number in format ORD001, ORD002, etc."""
    orders = db.query(DBOrder.order_number).filter(
        DBOrder.order_number.like('ORD%')
    ).all()
    
    max_num = 0
    for order in orders:
        match = re.match(r'ORD(\d+)', order.order_number)
        if match:
            num = int(match.group(1))
            if num > max_num:
                max_num = num
    
    next_num = max_num + 1
    return f"ORD{next_num:03d}"


def generate_next_supplier_code(db: Session) -> str:
    """Generate the next supplier code in format SUP001, SUP002, etc."""
    suppliers = db.query(DBSupplier.code).filter(
        DBSupplier.code.like('SUP%')
    ).all()
    
    max_num = 0
    for supplier in suppliers:
        if supplier.code:
            match = re.match(r'SUP(\d+)', supplier.code)
            if match:
                num = int(match.group(1))
                if num > max_num:
                    max_num = num
    
    next_num = max_num + 1
    return f"SUP{next_num:03d}"


# Supplier endpoints
@router.post("/suppliers", response_model=Supplier, status_code=status.HTTP_201_CREATED)
def create_supplier(
    *,
    db: Session = Depends(get_db),
    supplier_in: SupplierCreate,
    current_user = Depends(get_raw_material_checker)
) -> Any:
    """Create a new supplier"""
    existing_supplier = db.query(DBSupplier).filter(DBSupplier.name == supplier_in.name).first()
    if existing_supplier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supplier with this name already exists"
        )
    
    supplier_data = supplier_in.model_dump()
    
    # Auto-generate supplier code if not provided
    if not supplier_data.get('code'):
        supplier_data['code'] = generate_next_supplier_code(db)
    
    db_supplier = DBSupplier(**supplier_data)
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@router.get("/suppliers", response_model=List[Supplier])
def get_suppliers(
    db: Session = Depends(get_db),
    current_user = Depends(get_raw_material_checker),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """Get all suppliers"""
    suppliers = db.query(DBSupplier).offset(skip).limit(limit).all()
    return suppliers


@router.get("/suppliers/{supplier_id}", response_model=Supplier)
def get_supplier(
    *,
    db: Session = Depends(get_db),
    supplier_id: int,
    current_user = Depends(get_raw_material_checker)
) -> Any:
    """Get a specific supplier"""
    supplier = db.query(DBSupplier).filter(DBSupplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.put("/suppliers/{supplier_id}", response_model=Supplier)
def update_supplier(
    *,
    db: Session = Depends(get_db),
    supplier_id: int,
    supplier_in: SupplierCreate,
    current_user = Depends(get_raw_material_checker)
) -> Any:
    """Update a supplier"""
    db_supplier = db.query(DBSupplier).filter(DBSupplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    for field, value in supplier_in.model_dump().items():
        setattr(db_supplier, field, value)
    
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@router.delete("/suppliers/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(
    *,
    db: Session = Depends(get_db),
    supplier_id: int,
    current_user = Depends(get_raw_material_checker)
):
    """Delete a supplier"""
    db_supplier = db.query(DBSupplier).filter(DBSupplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    db.delete(db_supplier)
    db.commit()
    # No return statement for 204 status code


# Raw Material Category endpoints
def generate_next_category_code(db: Session) -> str:
    """Generate the next category code in format CAT001, CAT002, etc."""
    categories = db.query(DBRawMaterialCategory.code).filter(
        DBRawMaterialCategory.code.like('CAT%')
    ).all()
    
    max_num = 0
    for category in categories:
        if category.code:
            match = re.match(r'CAT(\d+)', category.code)
            if match:
                num = int(match.group(1))
                if num > max_num:
                    max_num = num
    
    next_num = max_num + 1
    return f"CAT{next_num:03d}"


@router.post("/categories", response_model=RawMaterialCategory, status_code=status.HTTP_201_CREATED)
def create_category(
    *,
    db: Session = Depends(get_db),
    category_in: RawMaterialCategoryCreate,
    current_user = Depends(get_raw_material_checker)
) -> Any:
    """Create a new raw material category"""
    # Check if category name already exists
    existing = db.query(DBRawMaterialCategory).filter(DBRawMaterialCategory.name == category_in.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists"
        )
    
    category_data = category_in.model_dump()
    
    # Auto-generate code if not provided
    if not category_data.get('code'):
        category_data['code'] = generate_next_category_code(db)
    else:
        # Check if code already exists
        existing_code = db.query(DBRawMaterialCategory).filter(DBRawMaterialCategory.code == category_data['code']).first()
        if existing_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category with this code already exists"
            )
    
    db_category = DBRawMaterialCategory(**category_data, created_by=current_user.id)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@router.get("/categories", response_model=List[RawMaterialCategory])
def get_categories(
    db: Session = Depends(get_db),
    current_user = Depends(get_raw_material_checker),
    active_only: bool = False
) -> Any:
    """Get all raw material categories"""
    query = db.query(DBRawMaterialCategory)
    
    if active_only:
        query = query.filter(DBRawMaterialCategory.is_active == True)
    
    categories = query.order_by(DBRawMaterialCategory.name).all()
    return categories


@router.get("/categories/{category_id}", response_model=RawMaterialCategory)
def get_category(
    *,
    db: Session = Depends(get_db),
    category_id: int,
    current_user = Depends(get_raw_material_checker)
) -> Any:
    """Get a single raw material category"""
    category = db.query(DBRawMaterialCategory).filter(DBRawMaterialCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.put("/categories/{category_id}", response_model=RawMaterialCategory)
def update_category(
    *,
    db: Session = Depends(get_db),
    category_id: int,
    category_in: RawMaterialCategoryUpdate,
    current_user = Depends(get_raw_material_checker)
) -> Any:
    """Update a raw material category"""
    category = db.query(DBRawMaterialCategory).filter(DBRawMaterialCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data = category_in.model_dump(exclude_unset=True)
    
    # Check if name is being updated and if it conflicts
    if 'name' in update_data and update_data['name'] != category.name:
        existing = db.query(DBRawMaterialCategory).filter(DBRawMaterialCategory.name == update_data['name']).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category with this name already exists"
            )
    
    # Check if code is being updated and if it conflicts
    if 'code' in update_data and update_data['code'] != category.code:
        existing_code = db.query(DBRawMaterialCategory).filter(DBRawMaterialCategory.code == update_data['code']).first()
        if existing_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category with this code already exists"
            )
    
    for field, value in update_data.items():
        setattr(category, field, value)
    
    db.commit()
    db.refresh(category)
    return category


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    *,
    db: Session = Depends(get_db),
    category_id: int,
    current_user = Depends(get_raw_material_checker)
):
    """Delete a raw material category"""
    category = db.query(DBRawMaterialCategory).filter(DBRawMaterialCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if category is in use
    checks_count = db.query(DBRawMaterialCheck).filter(DBRawMaterialCheck.category_id == category_id).count()
    orders_count = db.query(DBOrder).filter(DBOrder.category_id == category_id).count()
    
    if checks_count > 0 or orders_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete category. It is used in {checks_count} check(s) and {orders_count} order(s). Consider deactivating it instead."
        )
    
    db.delete(category)
    db.commit()
    # No return statement for 204 status code


# Raw Material Check endpoints
@router.get("/raw-material-checks/next-number")
def get_next_check_number(
    db: Session = Depends(get_db),
    current_user = Depends(get_raw_material_checker)
) -> Any:
    """Get the next auto-generated check number"""
    next_number = generate_next_check_number(db)
    return {"check_number": next_number}


@router.post("/raw-material-checks", response_model=RawMaterialCheck, status_code=status.HTTP_201_CREATED)
def create_raw_material_check(
    *,
    db: Session = Depends(get_db),
    check_in: RawMaterialCheckCreate,
    current_user = Depends(get_raw_material_checker)
) -> Any:
    """Create a new raw material check"""
    check_data = check_in.model_dump()
    
    # Auto-generate check number if not provided
    if not check_data.get('check_number'):
        check_data['check_number'] = generate_next_check_number(db)
    
    db_check = DBRawMaterialCheck(
        **check_data,
        created_by=current_user.id
    )
    db.add(db_check)
    db.commit()
    db.refresh(db_check)
    return db_check


@router.get("/raw-material-checks", response_model=List[RawMaterialCheck])
def get_raw_material_checks(
    db: Session = Depends(get_db),
    current_user = Depends(get_raw_material_checker),
    status: str = None,
    skip: int = 0,
    limit: int = 100
) -> Any:
    """Get all raw material checks, optionally filtered by status"""
    query = db.query(DBRawMaterialCheck).options(joinedload(DBRawMaterialCheck.category))
    if status:
        query = query.filter(DBRawMaterialCheck.status == status)
    checks = query.offset(skip).limit(limit).all()
    return checks


@router.get("/raw-material-checks/{check_id}", response_model=RawMaterialCheck)
def get_raw_material_check(
    *,
    db: Session = Depends(get_db),
    check_id: int,
    current_user = Depends(get_raw_material_checker)
) -> Any:
    """Get a specific raw material check"""
    check = db.query(DBRawMaterialCheck).options(joinedload(DBRawMaterialCheck.category)).filter(DBRawMaterialCheck.id == check_id).first()
    if not check:
        raise HTTPException(status_code=404, detail="Raw material order not found")
    return check


@router.put("/raw-material-checks/{check_id}", response_model=RawMaterialCheck)
def update_raw_material_check(
    *,
    db: Session = Depends(get_db),
    check_id: int,
    check_in: RawMaterialCheckCreate,
    current_user = Depends(get_raw_material_checker)
) -> Any:
    """Update a raw material check"""
    db_check = db.query(DBRawMaterialCheck).filter(DBRawMaterialCheck.id == check_id).first()
    if not db_check:
        raise HTTPException(status_code=404, detail="Raw material order not found")
    
    for field, value in check_in.model_dump().items():
        setattr(db_check, field, value)
    
    db.commit()
    db.refresh(db_check)
    return db_check


@router.patch("/raw-material-checks/{check_id}/status")
def update_check_status(
    *,
    db: Session = Depends(get_db),
    check_id: int,
    new_status: str,
    current_user = Depends(get_raw_material_checker)
) -> Any:
    """Update the status of a raw material check"""
    db_check = db.query(DBRawMaterialCheck).filter(DBRawMaterialCheck.id == check_id).first()
    if not db_check:
        raise HTTPException(status_code=404, detail="Raw material order not found")
    
    if new_status not in ["pending", "work_in_progress", "approved"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    db_check.status = new_status
    if new_status == "work_in_progress":
        db_check.checked_by = current_user.id
        db_check.checked_at = datetime.now()
    elif new_status == "approved":
        db_check.approved_by = current_user.id
        db_check.approved_at = datetime.now()
    
    db.commit()
    db.refresh(db_check)
    return db_check


# Order endpoints
@router.get("/orders/next-number")
def get_next_order_number(
    db: Session = Depends(get_db),
    current_user = Depends(get_raw_material_checker)
) -> Any:
    """Get the next auto-generated order number"""
    next_number = generate_next_order_number(db)
    return {"order_number": next_number}


@router.post("/orders", response_model=Order, status_code=status.HTTP_201_CREATED)
def create_order(
    *,
    db: Session = Depends(get_db),
    order_in: OrderCreate,
    current_user = Depends(get_raw_material_checker)
) -> Any:
    """Create a new order"""
    order_data = order_in.model_dump()
    
    # Auto-generate order number if not provided
    if not order_data.get('order_number'):
        order_data['order_number'] = generate_next_order_number(db)
    
    # Calculate total amount if unit_price is provided
    if order_data.get('unit_price') and order_data.get('quantity'):
        order_data['total_amount'] = order_data['unit_price'] * order_data['quantity']
    
    db_order = DBOrder(
        **order_data,
        created_by=current_user.id
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


@router.get("/orders", response_model=List[Order])
def get_orders(
    db: Session = Depends(get_db),
    current_user = Depends(get_raw_material_checker),
    status: str = None,
    skip: int = 0,
    limit: int = 100
) -> Any:
    """Get all orders, optionally filtered by status"""
    query = db.query(DBOrder).options(joinedload(DBOrder.category))
    if status:
        query = query.filter(DBOrder.status == status)
    orders = query.offset(skip).limit(limit).all()
    return orders


@router.get("/orders/completed", response_model=List[Order])
def get_completed_orders(
    db: Session = Depends(get_db),
    current_user = Depends(get_raw_material_checker),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """Get all completed orders"""
    orders = db.query(DBOrder).options(joinedload(DBOrder.category)).filter(DBOrder.status == "completed").offset(skip).limit(limit).all()
    return orders


@router.get("/orders/{order_id}", response_model=Order)
def get_order(
    *,
    db: Session = Depends(get_db),
    order_id: int,
    current_user = Depends(get_raw_material_checker)
) -> Any:
    """Get a specific order"""
    order = db.query(DBOrder).filter(DBOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.put("/orders/{order_id}", response_model=Order)
def update_order(
    *,
    db: Session = Depends(get_db),
    order_id: int,
    order_in: OrderCreate,
    current_user = Depends(get_raw_material_checker)
) -> Any:
    """Update an order"""
    db_order = db.query(DBOrder).filter(DBOrder.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    for field, value in order_in.model_dump().items():
        setattr(db_order, field, value)
    
    # Recalculate total amount if unit_price or quantity changed
    if db_order.unit_price and db_order.quantity:
        db_order.total_amount = db_order.unit_price * db_order.quantity
    
    db.commit()
    db.refresh(db_order)
    return db_order


# Product-Supplier Mapping endpoints
@router.post("/product-supplier-mappings", response_model=ProductSupplierMapping, status_code=status.HTTP_201_CREATED)
def create_product_supplier_mapping(
    *,
    db: Session = Depends(get_db),
    mapping_in: ProductSupplierMappingCreate,
    current_user = Depends(get_raw_material_checker)
) -> Any:
    """Create a new product-supplier mapping"""
    db_mapping = DBProductSupplierMapping(**mapping_in.model_dump())
    db.add(db_mapping)
    db.commit()
    db.refresh(db_mapping)
    return db_mapping


@router.get("/product-supplier-mappings", response_model=List[ProductSupplierMapping])
def get_product_supplier_mappings(
    db: Session = Depends(get_db),
    current_user = Depends(get_raw_material_checker),
    product_name: str = None,
    skip: int = 0,
    limit: int = 100
) -> Any:
    """Get all product-supplier mappings, optionally filtered by product name"""
    query = db.query(DBProductSupplierMapping)
    if product_name:
        query = query.filter(DBProductSupplierMapping.product_name == product_name)
    mappings = query.offset(skip).limit(limit).all()
    return mappings


@router.get("/product-supplier-mappings/{mapping_id}", response_model=ProductSupplierMapping)
def get_product_supplier_mapping(
    *,
    db: Session = Depends(get_db),
    mapping_id: int,
    current_user = Depends(get_raw_material_checker)
) -> Any:
    """Get a specific product-supplier mapping"""
    mapping = db.query(DBProductSupplierMapping).filter(DBProductSupplierMapping.id == mapping_id).first()
    if not mapping:
        raise HTTPException(status_code=404, detail="Product-supplier mapping not found")
    return mapping


@router.delete("/product-supplier-mappings/{mapping_id}")
def delete_product_supplier_mapping(
    *,
    db: Session = Depends(get_db),
    mapping_id: int,
    current_user = Depends(get_raw_material_checker)
) -> Any:
    """Delete a product-supplier mapping"""
    mapping = db.query(DBProductSupplierMapping).filter(DBProductSupplierMapping.id == mapping_id).first()
    if not mapping:
        raise HTTPException(status_code=404, detail="Product-supplier mapping not found")
    
    db.delete(mapping)
    db.commit()
    return {"message": "Product-supplier mapping deleted successfully"}


@router.get("/generation/{paper_id}")
def get_raw_material_data(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_production_access)
):
    """
    Get auto-generated Raw Material data for a Production Paper.
    Calculates SQ.FT and SQ.METER based on RO Width and RO Height.
    """
    paper = db.query(DBProductionPaper).filter(DBProductionPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Production Paper not found")

    if not paper.measurement_id:
        # Fallback if paper doesn't have measurement_id but has selected items in JSON or elsewhere
        # However, usually it should have measurement_id
        raise HTTPException(status_code=400, detail="Production Paper has no associated measurement")

    measurement = db.query(DBMeasurement).filter(DBMeasurement.id == paper.measurement_id).first()
    if not measurement:
        raise HTTPException(status_code=404, detail="Associated Measurement not found")

    # Parse measurement items
    try:
        all_items = []
        if measurement.items:
            all_items = json.loads(measurement.items) if isinstance(measurement.items, str) else measurement.items
        if not isinstance(all_items, list):
            all_items = []
    except:
        all_items = []

    # Parse selected indices/items - handle both single measurement and multiple measurements
    selected_items = []
    try:
        selection = json.loads(paper.selected_measurement_items) if isinstance(paper.selected_measurement_items, str) else paper.selected_measurement_items
        if isinstance(selection, list):
            # Build a map of all measurements that might be referenced
            measurements_map = {measurement.id: all_items}
            
            for s in selection:
                item_to_add = None
                if isinstance(s, int):
                    # Simple index format - use current measurement
                    if 0 <= s < len(all_items):
                        item_to_add = all_items[s]
                elif isinstance(s, dict):
                    # Handle multiple measurements format
                    m_id = s.get('measurement_id')
                    idx = s.get('item_index')
                    
                    # Get items for this measurement
                    if m_id in measurements_map:
                        m_items = measurements_map[m_id]
                    else:
                        # Fetch measurement if not in map
                        other_m = db.query(DBMeasurement).filter(DBMeasurement.id == m_id).first()
                        if other_m:
                            other_items = json.loads(other_m.items) if isinstance(other_m.items, str) else other_m.items
                            if not isinstance(other_items, list):
                                other_items = []
                            measurements_map[m_id] = other_items
                            m_items = other_items
                        else:
                            m_items = []
                    
                    # Get item by index
                    if m_items and idx is not None and 0 <= idx < len(m_items):
                        item_to_add = m_items[idx]
                
                if item_to_add:
                    selected_items.append(item_to_add)
    except Exception as e:
        print(f"Error parsing selected items: {e}")
        import traceback
        traceback.print_exc()

    def get_num(val):
        if not val or val == '-': return 0.0
        try:
            return float(str(val).replace('"', '').strip())
        except: return 0.0
    
    def convert_to_inches_string(val):
        """Convert dimension to inches format string, EXACTLY matching Production Paper frontend convertToInches logic"""
        if not val or val == '-' or val == '': return ''
        try:
            # Remove quotes and clean the string
            clean_val = str(val).replace('"', '').strip()
            if not clean_val:
                return ''
            num = float(clean_val)
            if num == 0:
                return ''
            # If value is > 100, it's likely MM. Else it's likely already inches.
            if num > 100:
                return f"{(num / 25.4):.2f}\""
            return f"{num:.2f}\""
        except:
            return str(val) if val else ''

    # Group items by ro_width and ro_height in inches, summing quantities (matching Production Paper grouping logic EXACTLY)
    grouped_items = {}
    for item in selected_items:
        # Use EXACT same field priority as frontend DoorProductionPaper: ro_width || width || w
        raw_width = item.get('ro_width') or item.get('width') or item.get('w') or ''
        raw_height = item.get('ro_height') or item.get('height') or item.get('h') or ''
        
        # Skip items with missing or invalid dimensions
        if not raw_width or not raw_height or raw_width == '-' or raw_height == '-':
            continue
        
        # Validate that dimensions are numeric (not text codes like "10478")
        width_num_test = get_num(raw_width)
        height_num_test = get_num(raw_height)
        
        # Skip if dimensions are clearly wrong (e.g., > 10000 is likely a code, not a dimension)
        if width_num_test > 10000 or height_num_test > 10000:
            continue
        
        # Skip if dimensions are 0 or invalid
        if width_num_test == 0 or height_num_test == 0:
            continue
        
        # Convert to inches string format (matching frontend convertToInches EXACTLY)
        width_inches_str = convert_to_inches_string(raw_width)
        height_inches_str = convert_to_inches_string(raw_height)
        
        # Skip if conversion failed or returned empty
        if not width_inches_str or not height_inches_str or width_inches_str == '' or height_inches_str == '':
            continue
        
        # Create grouping key using string format (matching frontend key format)
        key = f"{width_inches_str}-{height_inches_str}"
        
        # Extract numeric values for calculations (parse from the inches string)
        try:
            width_num = float(width_inches_str.replace('"', ''))
            height_num = float(height_inches_str.replace('"', ''))
        except:
            # Fallback: use the test values we already calculated
            width_num = width_num_test
            height_num = height_num_test
            if width_num > 100:
                width_num = width_num / 25.4
            if height_num > 100:
                height_num = height_num / 25.4
        
        # Get quantity (matching frontend: parseInt(item.qty || item.quantity) || 1)
        qty_val = item.get('qty') or item.get('quantity')
        try:
            qty = int(float(qty_val)) if qty_val is not None and qty_val != '' else 1
        except:
            qty = 1
        
        if key in grouped_items:
            # If this dimension combination already exists, add to quantity (matching frontend logic)
            grouped_items[key]['quantity'] += qty
        else:
            # First occurrence of this dimension combination
            grouped_items[key] = {
                'item': item,
                'ro_width': width_num,  # Store numeric value for calculations
                'ro_height': height_num,  # Store numeric value for calculations
                'ro_width_display': width_inches_str,  # Store formatted string for display
                'ro_height_display': height_inches_str,  # Store formatted string for display
                'quantity': qty
            }
    
    rm_items = []
    total_qty = 0
    total_sq_ft = 0.0
    total_sq_meter = 0.0
    total_laminate_sq_ft = 0.0
    total_laminate_sheets = 0

    # Sort grouped items by width then height (matching Production Paper sorting)
    sorted_groups = sorted(grouped_items.items(), key=lambda x: (x[1]['ro_width'], x[1]['ro_height']))
    
    for i, (key, grouped) in enumerate(sorted_groups):
        item = grouped['item']
        ro_w = grouped['ro_width']
        ro_h = grouped['ro_height']
        ro_w_display = grouped.get('ro_width_display', '')
        ro_h_display = grouped.get('ro_height_display', '')
        qty = grouped['quantity']
        
        # Calculation logic: (RO_WIDTH × RO_HEIGHT × QTY) / 144 (single side only - unchanged)
        sq_ft = (ro_w * ro_h * qty) / 144.0
        sq_meter = sq_ft * 0.092903
        
        # New laminate calculation: Both sides + 20% wastage
        # Laminate SQ.FT = SQ.FT × 2 × 1.20
        laminate_sq_ft = sq_ft * 2.0 * 1.20
        
        # Laminate Sheets = CEILING(Laminate SQ.FT ÷ 32) - rounded up, no decimals
        laminate_sheets = math.ceil(laminate_sq_ft / 32.0)

        thickness = item.get('thickness') or paper.thickness or '-'
        laminate_code = paper.frontside_laminate or paper.laminate or '-'
        grade = paper.grade or '-'
        side_frame = paper.side_frame or '-'
        filler = paper.filler or '-'
        
        # Format dimensions for display (remove quotes, show as number)
        ro_w_display_clean = ro_w_display.replace('"', '') if isinstance(ro_w_display, str) and ro_w_display else str(ro_w)
        ro_h_display_clean = ro_h_display.replace('"', '') if isinstance(ro_h_display, str) and ro_h_display else str(ro_h)
        
        rm_items.append({
            "sr_no": i + 1,
            "thickness": thickness,
            "grade": grade,
            "side_frame": side_frame,
            "filler": filler,
            "production_code": paper.paper_number,
            "laminate_code": laminate_code,
            "ro_width": float(ro_w_display_clean) if ro_w_display_clean else ro_w,
            "ro_height": float(ro_h_display_clean) if ro_h_display_clean else ro_h,
            "quantity": qty,
            "sq_ft": round(sq_ft, 3),
            "sq_meter": round(sq_meter, 4),
            "laminate_sq_ft": round(laminate_sq_ft, 3),
            "laminate_sheets": laminate_sheets
        })
        
        total_qty += qty
        total_sq_ft += sq_ft
        total_sq_meter += sq_meter
        total_laminate_sq_ft += laminate_sq_ft
        total_laminate_sheets += laminate_sheets

    return {
        "paper_number": paper.paper_number,
        "product_category": paper.product_category,
        "rm_type": paper.product_category,
        "items": rm_items,
        "totals": {
            "quantity": total_qty,
            "sq_ft": round(total_sq_ft, 3),
            "sq_meter": round(total_sq_meter, 4),
            "total_laminate_sq_ft": round(total_laminate_sq_ft, 3),
            "total_laminate_sheets": total_laminate_sheets
        }
    }


@router.get("/production-papers/{paper_id}/pdf")
def get_raw_material_pdf(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_production_access)
):
    """
    Generate and return a PDF for Raw Material Paper.
    Returns a professional PDF document with header information and raw material table.
    """
    try:
        # Get production paper
        paper = db.query(DBProductionPaper).filter(DBProductionPaper.id == paper_id).first()
        if not paper:
            raise HTTPException(status_code=404, detail="Production Paper not found")

        if not paper.measurement_id:
            raise HTTPException(status_code=400, detail="Production Paper has no associated measurement")

        measurement = db.query(DBMeasurement).filter(DBMeasurement.id == paper.measurement_id).first()
        if not measurement:
            raise HTTPException(status_code=404, detail="Associated Measurement not found")

        # Parse measurement items (reuse logic from get_raw_material_data)
        try:
            all_items = []
            if measurement.items:
                all_items = json.loads(measurement.items) if isinstance(measurement.items, str) else measurement.items
            if not isinstance(all_items, list):
                all_items = []
        except:
            all_items = []

        # Parse selected indices/items
        selected_items = []
        try:
            selection = json.loads(paper.selected_measurement_items) if isinstance(paper.selected_measurement_items, str) else paper.selected_measurement_items
            if isinstance(selection, list):
                measurements_map = {measurement.id: all_items}
                
                for s in selection:
                    item_to_add = None
                    if isinstance(s, int):
                        if 0 <= s < len(all_items):
                            item_to_add = all_items[s]
                    elif isinstance(s, dict):
                        m_id = s.get('measurement_id')
                        idx = s.get('item_index')
                        
                        if m_id in measurements_map:
                            m_items = measurements_map[m_id]
                        else:
                            other_m = db.query(DBMeasurement).filter(DBMeasurement.id == m_id).first()
                            if other_m:
                                other_items = json.loads(other_m.items) if isinstance(other_m.items, str) else other_m.items
                                if not isinstance(other_items, list):
                                    other_items = []
                                measurements_map[m_id] = other_items
                                m_items = other_items
                            else:
                                m_items = []
                        
                        if m_items and idx is not None and 0 <= idx < len(m_items):
                            item_to_add = m_items[idx]
                    
                    if item_to_add:
                        selected_items.append(item_to_add)
        except Exception as e:
            print(f"Error parsing selected items: {e}")

        def get_num(val):
            if not val or val == '-': return 0.0
            try:
                return float(str(val).replace('"', '').strip())
            except: return 0.0
        
        def convert_to_inches_string(val):
            if not val or val == '-' or val == '': return ''
            try:
                clean_val = str(val).replace('"', '').strip()
                if not clean_val:
                    return ''
                num = float(clean_val)
                if num == 0:
                    return ''
                if num > 100:
                    return f"{(num / 25.4):.2f}\""
                return f"{num:.2f}\""
            except:
                return str(val) if val else ''

        # Group items by ro_width and ro_height
        grouped_items = {}
        for item in selected_items:
            raw_width = item.get('ro_width') or item.get('width') or item.get('w') or ''
            raw_height = item.get('ro_height') or item.get('height') or item.get('h') or ''
            
            if not raw_width or not raw_height or raw_width == '-' or raw_height == '-':
                continue
            
            width_num_test = get_num(raw_width)
            height_num_test = get_num(raw_height)
            
            if width_num_test > 10000 or height_num_test > 10000:
                continue
            
            if width_num_test == 0 or height_num_test == 0:
                continue
            
            width_inches_str = convert_to_inches_string(raw_width)
            height_inches_str = convert_to_inches_string(raw_height)
            
            if not width_inches_str or not height_inches_str or width_inches_str == '' or height_inches_str == '':
                continue
            
            key = f"{width_inches_str}-{height_inches_str}"
            
            try:
                width_num = float(width_inches_str.replace('"', ''))
                height_num = float(height_inches_str.replace('"', ''))
            except:
                width_num = width_num_test
                height_num = height_num_test
                if width_num > 100:
                    width_num = width_num / 25.4
                if height_num > 100:
                    height_num = height_num / 25.4
            
            qty_val = item.get('qty') or item.get('quantity')
            try:
                qty = int(float(qty_val)) if qty_val is not None and qty_val != '' else 1
            except:
                qty = 1
            
            if key in grouped_items:
                grouped_items[key]['quantity'] += qty
            else:
                grouped_items[key] = {
                    'item': item,
                    'ro_width': width_num,
                    'ro_height': height_num,
                    'ro_width_display': width_inches_str,
                    'ro_height_display': height_inches_str,
                    'quantity': qty
                }
        
        # Prepare items for PDF
        pdf_items = []
        total_qty = 0
        total_sq_ft = 0.0
        total_sq_meter = 0.0
        total_laminate_sheets = 0

        sorted_groups = sorted(grouped_items.items(), key=lambda x: (x[1]['ro_width'], x[1]['ro_height']))
        
        for i, (key, grouped) in enumerate(sorted_groups):
            item = grouped['item']
            ro_w = grouped['ro_width']
            ro_h = grouped['ro_height']
            ro_w_display = grouped.get('ro_width_display', '')
            ro_h_display = grouped.get('ro_height_display', '')
            qty = grouped['quantity']
            
            sq_ft = (ro_w * ro_h * qty) / 144.0
            sq_meter = sq_ft * 0.092903
            laminate_sq_ft = sq_ft * 2.0 * 1.20
            laminate_sheets = math.ceil(laminate_sq_ft / 32.0)

            ro_w_display_clean = ro_w_display.replace('"', '') if isinstance(ro_w_display, str) and ro_w_display else str(ro_w)
            ro_h_display_clean = ro_h_display.replace('"', '') if isinstance(ro_h_display, str) and ro_h_display else str(ro_h)
            
            pdf_items.append({
                "sr_no": i + 1,
                "ro_width": float(ro_w_display_clean) if ro_w_display_clean else ro_w,
                "ro_height": float(ro_h_display_clean) if ro_h_display_clean else ro_h,
                "thickness": item.get('thickness') or paper.thickness or '-',
                "quantity": qty,
                "sq_ft": round(sq_ft, 3),
                "sq_meter": round(sq_meter, 4),
                "laminate_sheets": laminate_sheets
            })
            
            total_qty += qty
            total_sq_ft += sq_ft
            total_sq_meter += sq_meter
            total_laminate_sheets += laminate_sheets

        # Prepare totals
        pdf_totals = {
            "quantity": total_qty,
            "sq_ft": round(total_sq_ft, 3),
            "sq_meter": round(total_sq_meter, 4),
            "total_laminate_sheets": total_laminate_sheets
        }

        # Generate PDF
        pdf_buffer = generate_raw_material_pdf(
            production_code=paper.paper_number or "-",
            general_area=paper.area or "-",
            grade=paper.grade or "-",
            side_frame=paper.side_frame or "-",
            filler=paper.filler or "-",
            laminate_code=paper.frontside_laminate or paper.laminate or "-",
            items=pdf_items,
            totals=pdf_totals
        )

        # Return PDF as response
        return Response(
            content=pdf_buffer.read(),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'inline; filename="Raw_Material_Paper_{paper.paper_number}.pdf"'
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating PDF: {str(e)}"
        )


@router.post("/production-papers/{paper_id}/extract-raw-material-table", response_model=RawMaterialTableResponse)
def extract_and_store_raw_material_table(
    *,
    db: Session = Depends(get_db),
    paper_id: int,
    request: RawMaterialTableRequest = Body(...),
    current_user = Depends(get_production_access)
) -> Any:
    """
    Extract raw material requirements table from production paper and store it in database.
    
    This endpoint:
    1. Fetches the production paper and its measurement items
    2. Groups items by RO WIDTH, RO HEIGHT, and BLDG/Wings
    3. Calculates SQ.FT for each row
    4. Stores the table in raw_material_shutter_items table
    5. Returns the parsed table with totals
    """
    try:
        # Use paper_id from path, or from request if provided
        actual_paper_id = request.production_paper_id if request.production_paper_id else paper_id
        
        # Get production paper
        paper = db.query(DBProductionPaper).filter(DBProductionPaper.id == actual_paper_id).first()
        if not paper:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Production paper with ID {actual_paper_id} not found"
            )
        
        # Get measurement items
        measurement_items = []
        if paper.selected_measurement_items:
            try:
                selected_items = json.loads(paper.selected_measurement_items) if isinstance(paper.selected_measurement_items, str) else paper.selected_measurement_items
                
                # Handle new format: array of objects with measurement_id, item_index
                if selected_items and isinstance(selected_items[0], dict) and 'measurement_id' in selected_items[0]:
                    measurement_ids = list(set([item['measurement_id'] for item in selected_items]))
                    
                    for measurement_id in measurement_ids:
                        measurement = db.query(DBMeasurement).filter(DBMeasurement.id == measurement_id).first()
                        if measurement and measurement.items:
                            items = json.loads(measurement.items) if isinstance(measurement.items, str) else measurement.items
                            
                            # Get items for this measurement
                            for selected_item in selected_items:
                                if selected_item['measurement_id'] == measurement_id:
                                    item_index = selected_item.get('item_index', 0)
                                    if isinstance(items, list) and 0 <= item_index < len(items):
                                        measurement_items.append(items[item_index])
                
                # Handle old format: array of indices
                elif selected_items and isinstance(selected_items[0], (int, str)):
                    if paper.measurement_id:
                        measurement = db.query(DBMeasurement).filter(DBMeasurement.id == paper.measurement_id).first()
                        if measurement and measurement.items:
                            items = json.loads(measurement.items) if isinstance(measurement.items, str) else measurement.items
                            if isinstance(items, list):
                                for index in selected_items:
                                    idx = int(index) if isinstance(index, str) else index
                                    if 0 <= idx < len(items):
                                        measurement_items.append(items[idx])
            except (json.JSONDecodeError, TypeError, KeyError, IndexError) as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Error parsing measurement items: {str(e)}"
                )
        
        if not measurement_items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No measurement items found in production paper"
            )
        
        # Parse raw material table
        parsed_data = parse_raw_material_table(measurement_items, actual_paper_id)
        
        # Delete existing items if overwrite is requested
        if request.overwrite_existing:
            db.query(DBRawMaterialShutterItem).filter(
                DBRawMaterialShutterItem.production_paper_id == actual_paper_id
            ).delete()
            db.commit()
        
        # Store items in database
        stored_items = []
        for idx, item_data in enumerate(parsed_data['items'], 1):
            # Ensure sr_no is properly set (sequential from 1)
            sr_no = str(item_data.get('sr_no', idx))
            # If sr_no is "0" or empty, use index
            if not sr_no or sr_no == '0' or sr_no == '':
                sr_no = str(idx)
            
            db_item = DBRawMaterialShutterItem(
                production_paper_id=actual_paper_id,
                sr_no=sr_no,
                ro_width=str(item_data['ro_width']) if item_data.get('ro_width') else '',
                ro_height=str(item_data['ro_height']) if item_data.get('ro_height') else '',
                bldg_wings=item_data.get('bldg_wings', ''),
                quantity=int(item_data['qty']) if isinstance(item_data['qty'], (int, float)) and item_data['qty'] == int(item_data['qty']) else item_data['qty'],
                sq_ft=round(item_data.get('sq_ft', 0.0), 2),
                thickness=paper.thickness,
                created_at=datetime.now()
            )
            db.add(db_item)
            stored_items.append(db_item)
        
        db.commit()
        
        # Refresh items to get IDs
        for item in stored_items:
            db.refresh(item)
        
        # Convert to response format
        response_items = [
            RMShutterItem(
                id=item.id,
                sr_no=item.sr_no,
                ro_width=item.ro_width,
                ro_height=item.ro_height,
                bldg_wings=item.bldg_wings,
                quantity=item.quantity,
                sq_ft=item.sq_ft,
                thickness=item.thickness,
                production_paper_id=item.production_paper_id,
                created_at=item.created_at
            )
            for item in stored_items
        ]
        
        return RawMaterialTableResponse(
            production_paper_id=actual_paper_id,
            items=response_items,
            totals=parsed_data['totals'],
            message=f"Successfully extracted and stored {len(stored_items)} raw material items"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error extracting raw material table: {str(e)}"
        )


@router.get("/production-papers/{paper_id}/raw-material-table", response_model=RawMaterialTableResponse)
def get_raw_material_table(
    *,
    db: Session = Depends(get_db),
    paper_id: int,
    current_user = Depends(get_production_access)
) -> Any:
    """
    Get stored raw material requirements table for a production paper.
    """
    # Get production paper
    paper = db.query(DBProductionPaper).filter(DBProductionPaper.id == paper_id).first()
    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Production paper with ID {paper_id} not found"
        )
    
    # Get stored items
    db_items = db.query(DBRawMaterialShutterItem).filter(
        DBRawMaterialShutterItem.production_paper_id == paper_id
    ).order_by(DBRawMaterialShutterItem.sr_no).all()
    
    if not db_items:
        # If no stored items, extract from production paper on-the-fly
        measurement_items = []
        if paper.selected_measurement_items:
            try:
                selected_items = json.loads(paper.selected_measurement_items) if isinstance(paper.selected_measurement_items, str) else paper.selected_measurement_items
                
                # Handle new format: array of objects with measurement_id, item_index
                if selected_items and isinstance(selected_items[0], dict) and 'measurement_id' in selected_items[0]:
                    measurement_ids = list(set([item['measurement_id'] for item in selected_items]))
                    
                    for measurement_id in measurement_ids:
                        measurement = db.query(DBMeasurement).filter(DBMeasurement.id == measurement_id).first()
                        if measurement and measurement.items:
                            items = json.loads(measurement.items) if isinstance(measurement.items, str) else measurement.items
                            
                            for selected_item in selected_items:
                                if selected_item['measurement_id'] == measurement_id:
                                    item_index = selected_item.get('item_index', 0)
                                    if isinstance(items, list) and 0 <= item_index < len(items):
                                        measurement_items.append(items[item_index])
                
                # Handle old format: array of indices
                elif selected_items and isinstance(selected_items[0], (int, str)):
                    if paper.measurement_id:
                        measurement = db.query(DBMeasurement).filter(DBMeasurement.id == paper.measurement_id).first()
                        if measurement and measurement.items:
                            items = json.loads(measurement.items) if isinstance(measurement.items, str) else measurement.items
                            if isinstance(items, list):
                                for index in selected_items:
                                    idx = int(index) if isinstance(index, str) else index
                                    if 0 <= idx < len(items):
                                        measurement_items.append(items[idx])
            except (json.JSONDecodeError, TypeError, KeyError, IndexError) as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Error parsing measurement items: {str(e)}"
                )
        
        if not measurement_items:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No raw material table found and no measurement items available to extract."
            )
        
        # Parse and return data directly from production paper
        parsed_data = parse_raw_material_table(measurement_items, paper_id)
        
        response_items = [
            RMShutterItem(
                id=None,
                sr_no=item['sr_no'],
                ro_width=item['ro_width'],
                ro_height=item['ro_height'],
                bldg_wings=item.get('bldg_wings', ''),
                quantity=int(item['qty']) if isinstance(item['qty'], (int, float)) and item['qty'] == int(item['qty']) else item['qty'],
                sq_ft=item['sq_ft'],
                thickness=paper.thickness,
                production_paper_id=paper_id,
                created_at=None
            )
            for item in parsed_data['items']
        ]
        
        return RawMaterialTableResponse(
            production_paper_id=paper_id,
            items=response_items,
            totals=parsed_data['totals'],
            message=f"Generated from production paper ({len(response_items)} items)"
        )
    
    # Convert stored items to response format with proper SR NO
    response_items = []
    for idx, item in enumerate(db_items, 1):
        # Ensure sr_no is sequential (fix any "0" values)
        sr_no = item.sr_no
        if not sr_no or sr_no == '0' or sr_no == 0:
            sr_no = str(idx)
        
        response_items.append(
            RMShutterItem(
                id=item.id,
                sr_no=sr_no,
                ro_width=item.ro_width,
                ro_height=item.ro_height,
                bldg_wings=item.bldg_wings,
                quantity=item.quantity,
                sq_ft=item.sq_ft,
                thickness=item.thickness,
                production_paper_id=item.production_paper_id,
                created_at=item.created_at
            )
        )
    
    # Calculate totals
    total_qty = sum(item.quantity or 0 for item in db_items)
    total_sq_ft = sum(item.sq_ft or 0.0 for item in db_items)
    
    return RawMaterialTableResponse(
        production_paper_id=paper_id,
        items=response_items,
        totals={
            'total_qty': int(total_qty) if total_qty == int(total_qty) else round(total_qty, 2),
            'total_sq_ft': round(total_sq_ft, 2)
        },
        message=f"Found {len(db_items)} raw material items"
    )
