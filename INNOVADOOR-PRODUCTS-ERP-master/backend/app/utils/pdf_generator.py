"""
PDF Generation Utility for Raw Material Papers
"""
from io import BytesIO
from typing import Dict, List, Any, Optional
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT


def generate_raw_material_pdf(
    production_code: str,
    general_area: Optional[str] = None,
    grade: Optional[str] = None,
    side_frame: Optional[str] = None,
    filler: Optional[str] = None,
    laminate_code: Optional[str] = None,
    items: List[Dict[str, Any]] = None,
    totals: Dict[str, Any] = None
) -> BytesIO:
    """
    Generate a professional Raw Material Paper PDF.
    
    Args:
        production_code: Production code (e.g., "S0030")
        general_area: General area (e.g., "MD/BED/BATH")
        grade: Grade information
        side_frame: Side frame information
        filler: Filler information
        laminate_code: Laminate code
        items: List of items with keys: sr_no, ro_width, ro_height, thickness, quantity, sq_ft, sq_meter, laminate_sheets
        totals: Dictionary with keys: quantity, sq_ft, sq_meter, total_laminate_sheets
    
    Returns:
        BytesIO: PDF file as bytes
    """
    if items is None:
        items = []
    if totals is None:
        totals = {}
    
    # Create PDF in memory
    buffer = BytesIO()
    pdf = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=30*mm,
        leftMargin=30*mm,
        topMargin=30*mm,
        bottomMargin=30*mm
    )
    
    styles = getSampleStyleSheet()
    elements = []
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=16,
        textColor=colors.HexColor('#2563eb'),
        spaceAfter=20,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    # Title
    elements.append(Paragraph("<b>RAW MATERIAL PAPER</b>", title_style))
    elements.append(Spacer(1, 15))
    
    # Header Information Table
    # Row 1: Production Code, General Area, Grade
    # Row 2: Side Frame, Filler, Laminate Code
    header_data = [
        [
            "Production Code:",
            production_code or "-",
            "General Area:",
            general_area or "-",
            "Grade:",
            grade or "-"
        ],
        [
            "Side Frame:",
            side_frame or "-",
            "Filler:",
            filler or "-",
            "Laminate Code:",
            laminate_code or "-"
        ]
    ]
    
    header_table = Table(header_data, colWidths=[90, 130, 90, 130, 70, 80])
    header_table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 1, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONT", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("FONT", (0, 0), (0, -1), "Helvetica-Bold"),  # Labels in bold
        ("FONT", (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONT", (4, 0), (4, -1), "Helvetica-Bold"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 20))
    
    # Main Table Data
    table_data = [
        [
            "Item No",
            "RO Width\n(Inch)",
            "RO Height\n(Inch)",
            "Thickness\n(mm)",
            "Quantity",
            "Sq.Foot",
            "Sq.Meter",
            "Laminate\nSheets"
        ]
    ]
    
    # Add data rows
    for item in items:
        sr_no = str(item.get('sr_no', item.get('item_no', '')))
        ro_width = item.get('ro_width', '')
        ro_height = item.get('ro_height', '')
        thickness = str(item.get('thickness', '-'))
        quantity = str(item.get('quantity', ''))
        sq_ft = item.get('sq_ft', 0)
        sq_meter = item.get('sq_meter', 0)
        laminate_sheets = item.get('laminate_sheets', 0)
        
        # Format numeric values
        ro_width_str = f"{ro_width:.2f}" if isinstance(ro_width, (int, float)) else str(ro_width)
        ro_height_str = f"{ro_height:.2f}" if isinstance(ro_height, (int, float)) else str(ro_height)
        sq_ft_str = f"{sq_ft:.2f}" if isinstance(sq_ft, (int, float)) else str(sq_ft)
        sq_meter_str = f"{sq_meter:.2f}" if isinstance(sq_meter, (int, float)) else str(sq_meter)
        laminate_sheets_str = str(int(laminate_sheets)) if isinstance(laminate_sheets, (int, float)) else str(laminate_sheets)
        
        table_data.append([
            sr_no,
            ro_width_str,
            ro_height_str,
            thickness,
            quantity,
            sq_ft_str,
            sq_meter_str,
            laminate_sheets_str
        ])
    
    # Add TOTAL row
    total_quantity = totals.get('quantity', 0)
    total_sq_ft = totals.get('sq_ft', 0)
    total_sq_meter = totals.get('sq_meter', 0)
    total_laminate_sheets = totals.get('total_laminate_sheets', totals.get('laminate_sheets', 0))
    
    total_quantity_str = str(int(total_quantity)) if isinstance(total_quantity, (int, float)) else str(total_quantity)
    total_sq_ft_str = f"{total_sq_ft:.2f}" if isinstance(total_sq_ft, (int, float)) else str(total_sq_ft)
    total_sq_meter_str = f"{total_sq_meter:.2f}" if isinstance(total_sq_meter, (int, float)) else str(total_sq_meter)
    total_laminate_sheets_str = str(int(total_laminate_sheets)) if isinstance(total_laminate_sheets, (int, float)) else str(total_laminate_sheets)
    
    table_data.append([
        "TOTAL",
        "",
        "",
        "",
        total_quantity_str,
        total_sq_ft_str,
        total_sq_meter_str,
        total_laminate_sheets_str
    ])
    
    # Create main table
    main_table = Table(
        table_data,
        repeatRows=1,
        colWidths=[50, 70, 70, 70, 60, 60, 60, 80]
    )
    
    main_table.setStyle(TableStyle([
        # Grid and borders
        ("GRID", (0, 0), (-1, -1), 1, colors.black),
        
        # Header row styling
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("FONT", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("VALIGN", (0, 0), (-1, 0), "MIDDLE"),
        
        # Data rows styling
        ("FONT", (0, 1), (-1, -2), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -2), 10),
        ("ALIGN", (0, 1), (-1, -2), "CENTER"),
        ("VALIGN", (0, 1), (-1, -2), "MIDDLE"),
        
        # TOTAL row styling
        ("FONT", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, -1), (-1, -1), 10),
        ("ALIGN", (0, -1), (-1, -1), "CENTER"),
        ("VALIGN", (0, -1), (-1, -1), "MIDDLE"),
        
        # Padding
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    
    elements.append(main_table)
    elements.append(Spacer(1, 25))
    
    # Build PDF
    pdf.build(elements)
    
    # Reset buffer position to beginning
    buffer.seek(0)
    return buffer
