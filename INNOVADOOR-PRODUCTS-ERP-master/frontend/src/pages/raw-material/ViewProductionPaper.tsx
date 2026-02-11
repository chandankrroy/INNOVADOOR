import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useSidebar } from '../../context/SidebarContext';
import RawMaterialSidebar from '../../components/RawMaterialSidebar';
import RawMaterialNavbar from '../../components/RawMaterialNavbar';
import { ArrowLeft, Printer, Download } from 'lucide-react';

type ProductionPaper = {
  id: number;
  paper_number: string;
  po_number: string | null;
  party_id: number | null;
  party_name: string | null;
  measurement_id: number | null;
  project_site_name: string | null;
  order_type: string;
  product_category: string;
  product_type: string | null;
  product_sub_type: string | null;
  expected_dispatch_date: string | null;
  production_start_date: string | null;
  status: string;
  title: string | null;
  description: string | null;
  remarks: string | null;
  site_name: string | null;
  site_location: string | null;
  area: string | null;
  concept: string | null;
  thickness: string | null;
  design: string | null;
  frontside_design: string | null;
  backside_design: string | null;
  gel_colour: string | null;
  laminate: string | null;
  remark: string | null;
  selected_measurement_items?: number[] | Array<{ measurement_id: number; item_index: number; item_type?: string }> | null;
  // Frame-specific fields
  total_quantity?: string | null;
  wall_type?: string | null;
  rebate?: string | null;
  sub_frame?: string | null;
  construction?: string | null;
  cover_moulding?: string | null;
  // Shutter-specific fields
  frontside_laminate?: string | null;
  backside_laminate?: string | null;
  grade?: string | null;
  side_frame?: string | null;
  filler?: string | null;
  foam_bottom?: string | null;
  frp_coating?: string | null;
  created_at: string;
  party?: {
    id: number;
    name: string;
  } | null;
  measurement?: {
    id: number;
    measurement_number: string;
    party_name: string | null;
  } | null;
};

type Design = {
  id: number;
  design_name: string;
  design_code: string;
  image: string | null;
};

export default function ViewProductionPaper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isCollapsed, isHovered } = useSidebar();
  const [paper, setPaper] = useState<ProductionPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [frontsideDesign, setFrontsideDesign] = useState<Design | null>(null);
  const [backsideDesign, setBacksideDesign] = useState<Design | null>(null);
  const [allMeasurements, setAllMeasurements] = useState<Map<number, any>>(new Map());
  const [displayItems, setDisplayItems] = useState<any[]>([]);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  useEffect(() => {
    if (id) {
      loadPaper();
    }
  }, [id]);

  const loadPaper = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get(`/production/production-papers/${id}`, true);
      setPaper(data);

      // Prefer backend-resolved measurement items when available
      if (data.selected_items_data && Array.isArray(data.selected_items_data) && data.selected_items_data.length > 0) {
        setDisplayItems(data.selected_items_data);
      }

      // Load design images if designs are specified
      let frontDesign: Design | null = null;
      let backDesign: Design | null = null;

      if (data.frontside_design) {
        try {
          const designs = await api.get('/production/designs?is_active=true', true);
          const design = designs.find((d: Design) => d.design_name === data.frontside_design);
          if (design) {
            frontDesign = design;
            setFrontsideDesign(design);
          }
        } catch (err) {
          console.error('Failed to load frontside design:', err);
        }
      }

      if (data.backside_design && data.backside_design !== 'same as front') {
        try {
          const designs = await api.get('/production/designs?is_active=true', true);
          const design = designs.find((d: Design) => d.design_name === data.backside_design);
          if (design) {
            backDesign = design;
            setBacksideDesign(design);
          }
        } catch (err) {
          console.error('Failed to load backside design:', err);
        }
      } else if (data.backside_design === 'same as front' && frontDesign) {
        setBacksideDesign(frontDesign);
      }

      // Load measurement items from selected_measurement_items only when selected_items_data not provided
      if (!(data.selected_items_data && Array.isArray(data.selected_items_data) && data.selected_items_data.length > 0) &&
          data.selected_measurement_items && Array.isArray(data.selected_measurement_items) && data.selected_measurement_items.length > 0) {
        const firstItem = data.selected_measurement_items[0];

        if (typeof firstItem === 'object' && firstItem !== null && 'measurement_id' in firstItem) {
          // New format: array of objects with measurement_id, item_index, item_type
          const measurementIds = [...new Set(data.selected_measurement_items.map((item: any) => item.measurement_id))];
          const measurementsMap = new Map<number, any>();

          for (const measurementId of measurementIds) {
            try {
              const measurement = await api.get(`/production/measurements/${measurementId}`, true);
              measurementsMap.set(measurementId, measurement);
            } catch (err) {
              console.error(`Failed to load measurement ${measurementId}:`, err);
            }
          }

          setAllMeasurements(measurementsMap);

          const selectedItems: any[] = [];
          for (const item of data.selected_measurement_items) {
            const measurement = measurementsMap.get(item.measurement_id);
            if (measurement && measurement.items && Array.isArray(measurement.items)) {
              const itemIndex = item.item_index;
              if (itemIndex >= 0 && itemIndex < measurement.items.length) {
                selectedItems.push({
                  ...measurement.items[itemIndex],
                  measurement_id: item.measurement_id,
                  measurement_number: measurement.measurement_number,
                  item_type: item.item_type || measurement.measurement_type,
                });
              }
            }
          }

          setDisplayItems(selectedItems);
        } else if (typeof firstItem === 'number' || (typeof firstItem === 'string' && !isNaN(Number(firstItem)))) {
          // Old format: array of indices [0, 2, 5]
          if (data.measurement_id) {
            try {
              const measurement = await api.get(`/production/measurements/${data.measurement_id}`, true);
              setAllMeasurements(new Map([[data.measurement_id, measurement]]));

              const selectedItems = (data.selected_measurement_items as number[])
                .map((index: number) => {
                  if (measurement.items && Array.isArray(measurement.items) && index >= 0 && index < measurement.items.length) {
                    return {
                      ...measurement.items[index],
                      measurement_id: data.measurement_id,
                      measurement_number: measurement.measurement_number,
                    };
                  }
                  return null;
                })
                .filter((item: any) => item !== null);

              setDisplayItems(selectedItems);
            } catch (err) {
              console.error('Failed to load measurement:', err);
              setDisplayItems([]);
            }
          } else {
            setDisplayItems([]);
          }
        } else {
          setDisplayItems([]);
        }
      } else if (!(data.selected_items_data && Array.isArray(data.selected_items_data) && data.selected_items_data.length > 0)) {
        setDisplayItems([]);
      }
    } catch (err: any) {
      console.error('Error loading production paper:', err);
      setError(err.message || 'Failed to load production paper');
      setDisplayItems([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Convert mm to inches (1 mm = 0.0393701 inches)
  const convertToInches = (value: string | number | null | undefined): string => {
    if (!value || value === '-' || value === '') return '-';

    // If value already contains inches symbol, return as is
    const strValue = value.toString().trim();
    if (strValue.includes('"') || strValue.includes('inch') || strValue.includes('in')) {
      return strValue;
    }

    // Try to extract numeric value (remove any non-numeric characters except decimal point)
    const numMatch = strValue.match(/[\d.]+/);
    if (!numMatch) return strValue;

    const numValue = parseFloat(numMatch[0]);
    if (isNaN(numValue)) return strValue;

    // Convert mm to inches (assuming input is in mm)
    const inches = numValue * 0.0393701;
    return inches.toFixed(2) + '"';
  };

  // Format measurement value - convert to inches if it's a number
  const formatMeasurement = (value: string | number | null | undefined): string => {
    if (!value || value === '-' || value === '') return '-';
    return convertToInches(value);
  };

  // Extract numeric value from measurement string (handles inches format like "34.00\"")
  const extractNumericValue = (value: string | number | null | undefined): number => {
    if (!value || value === '-' || value === '') return 0;
    
    const strValue = value.toString().trim();
    // Remove quotes and extract numeric value
    const numMatch = strValue.replace(/["']/g, '').match(/[\d.]+/);
    if (!numMatch) return 0;
    
    const numValue = parseFloat(numMatch[0]);
    return isNaN(numValue) ? 0 : numValue;
  };

  // Calculate square feet: (Width x Height x Qty) / 144
  const calculateSquareFeet = (width: string | number | null | undefined, height: string | number | null | undefined, qty: string | number | null | undefined): number => {
    const widthNum = extractNumericValue(width);
    const heightNum = extractNumericValue(height);
    const qtyNum = extractNumericValue(qty) || 1;
    
    if (widthNum === 0 || heightNum === 0) return 0;
    
    const sqFt = (widthNum * heightNum * qtyNum) / 144;
    return Math.round(sqFt * 100) / 100; // Round to 2 decimal places
  };

  const getLocation = () => {
    if (paper?.project_site_name) return paper.project_site_name;
    if (paper?.measurement?.site_location) return paper.measurement.site_location;
    if (paper?.party?.name) {
      // Try to extract city from party name or use default
      return 'PUNE';
    }
    return 'PUNE';
  };

  const getPartyInfo = () => {
    const partyName = paper?.party?.name || paper?.party_name || '';
    const siteLocation = paper?.measurement?.site_location || paper?.project_site_name || '';
    const measurementDate = formatDateTime(paper?.measurement?.measurement_date || paper?.created_at);
    return `${partyName}${siteLocation ? `, ${siteLocation}` : ''}${measurementDate ? `, ${measurementDate}` : ''}`;
  };

  // Grouped dimension items for the dimensions table (SR NO, WIDTH, HEIGHT, WALL, WING/BLDG, QTY)
  const groupedItems = useMemo(() => {
    if (!paper?.product_category || !displayItems?.length) return [];
    const groups: { [key: string]: any } = {};
    const isFrame = paper.product_category === 'Frame';
    displayItems.forEach((item: any) => {
      const width = item.ro_width || item.width || item.w || item.act_width || '-';
      const height = item.ro_height || item.height || item.h || item.act_height || '-';
      const bldg = item.bldg || item.bldg_wing || '';
      const flat = item.flat_no || item.flat || '';
      const wall = item.wall || '';
      const key = `${width}-${height}-${bldg}-${flat}-${wall}`;
      if (groups[key]) {
        groups[key].qty = (groups[key].qty || 0) + (Number(item.qty) || Number(item.quantity) || 1);
      } else {
        const getFormatValue = (val: any, forFrame: boolean) => {
          if (!val || val === '-') return '-';
          const num = typeof val === 'string' ? parseFloat(String(val).replace('"', '')) : val;
          if (isNaN(num)) return val;
          if (forFrame) {
            return num < 100 ? Math.round(num * 25.4).toString() : Math.round(num).toString();
          }
          return num < 100 ? num.toString() : (num / 25.4).toFixed(2);
        };
        groups[key] = {
          ...item,
          display_width: getFormatValue(width, isFrame),
          display_height: getFormatValue(height, isFrame),
          display_flat: flat ? `${bldg ? bldg + ' ' : ''}${flat}` : (bldg || '-'),
          display_wall: wall || '-',
          qty: (Number(item.qty) || Number(item.quantity) || 1),
        };
      }
    });
    return Object.values(groups);
  }, [displayItems, paper?.product_category]);

  const totalQty = groupedItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!id) return;

    try {
      setIsDownloadingPDF(true);
      setError('');

      // Get API base URL
      const API_BASE_URL = import.meta.env.DEV
        ? '/api/v1'  // Use Vite proxy
        : (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1');

      // Get access token
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      // Fetch PDF from backend
      const response = await fetch(`${API_BASE_URL}/production/production-papers/${id}/pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ProductionPaper-${paper?.paper_number || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading PDF:', err);
      setError(err.message || 'Failed to download PDF. Please try again.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <RawMaterialSidebar />
        <RawMaterialNavbar />
        <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
          <main className="p-6 lg:p-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error && !paper) {
    return (
      <div className="min-h-screen bg-gray-50">
        <RawMaterialSidebar />
        <RawMaterialNavbar />
        <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
          <main className="p-6 lg:p-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
            <button
              onClick={() => navigate('/raw-material/production-papers')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Production Papers
            </button>
          </main>
        </div>
      </div>
    );
  }

  if (!paper) {
    return null;
  }


  // Get paper color based on order type
  const getPaperColor = () => {
    const orderType = paper.order_type?.toLowerCase() || 'regular';
    if (orderType === 'urgent') {
      return 'bg-pink-50 print:bg-pink-50';
    } else if (orderType === 'sample') {
      return 'bg-red-50 print:bg-red-50';
    } else {
      return 'bg-white print:bg-white';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <RawMaterialSidebar />
      <RawMaterialNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16 print:ml-0 print:pt-0`}>
        <main className="p-8 print:p-4">
          {/* Action Buttons - Hidden in Print */}
          <div className="mb-6 print:hidden flex justify-between items-center">
            <button
              onClick={() => navigate('/raw-material/production-papers')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Production Papers
            </button>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloadingPDF}
                className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${isDownloadingPDF
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
              >
                <Download className="w-4 h-4" />
                {isDownloadingPDF ? 'Generating PDF...' : 'Download PDF'}
              </button>
            </div>
          </div>

          {/* Production Paper Document */}
          <div className={`print-content ${getPaperColor()} border-2 border-gray-800 shadow-lg print:shadow-none`} style={{ maxWidth: '210mm', margin: '0 auto' }}>
            {/* Header Section */}
            <div className="border-b-2 border-gray-800">
              {/* Top Header Row - Party Name, Site Name, Site Location, and Paper Number */}
              <div className="bg-yellow-200 px-4 py-3 border-b border-gray-800">
                <div className="text-base font-bold text-gray-900 text-center">
                  {paper.party_name || paper.party?.name || 'N/A'} - {paper.site_name || 'N/A'} - {paper.site_location || getLocation()} - {paper.paper_number}
                </div>
              </div>

              {/* Product Info Row */}
              <div className="grid grid-cols-2 border-b border-gray-800">
                {/* Left: Product Details */}
                <div className="border-r border-gray-800 p-3">
                  <div className="font-semibold text-gray-900 mb-1">
                    {paper.product_category}
                  </div>
                  {paper.po_number && (
                    <div className="text-sm text-gray-700">
                      {paper.po_number}
                    </div>
                  )}
                </div>

                {/* Right: Date */}
                <div className="p-3">
                  <div className="border border-gray-800 px-2 py-1 text-sm font-semibold text-gray-900">
                    {formatDateTime(paper.created_at)}
                  </div>
                </div>
              </div>
            </div>

            {/* First Section - Specifications */}
            <div className="border-b-2 border-gray-800 p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-900">Product Category *:</span>
                  <span className="ml-2 text-gray-700">{paper.product_category || '-'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Order Type:</span>
                  <span className="ml-2 text-gray-700">{paper.order_type || '-'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Total Quantity:</span>
                  <span className="ml-2 text-gray-700">{paper.total_quantity || '-'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Area:</span>
                  <span className="ml-2 text-gray-700">{paper.area || '-'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">Concept:</span>
                  <span className="ml-2 text-gray-700">{paper.concept || '-'}</span>
                </div>
                {paper.product_category === 'Frame' && (
                  <>
                    <div>
                      <span className="font-semibold text-gray-900">Wall Type:</span>
                      <span className="ml-2 text-gray-700">{paper.wall_type || '-'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">Rebate:</span>
                      <span className="ml-2 text-gray-700">{paper.rebate || '-'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">Sub Frame:</span>
                      <span className="ml-2 text-gray-700">{paper.sub_frame || '-'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">Construction:</span>
                      <span className="ml-2 text-gray-700">{paper.construction || '-'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">Cover Moulding:</span>
                      <span className="ml-2 text-gray-700">{paper.cover_moulding || '-'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">Laminate:</span>
                      <span className="ml-2 text-gray-700">{paper.laminate || '-'}</span>
                    </div>
                  </>
                )}
                {paper.product_category === 'Shutter' && (
                  <>
                    <div>
                      <span className="font-semibold text-gray-900">Thickness:</span>
                      <span className="ml-2 text-gray-700">{paper.thickness || paper.measurement?.thickness || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">Frontside Design:</span>
                      <span className="ml-2 text-gray-700">{paper.frontside_design || paper.design || '-'}</span>
                      {frontsideDesign?.image && (
                        <img
                          src={`data:image/png;base64,${frontsideDesign.image}`}
                          alt={frontsideDesign.design_name}
                          className="w-16 h-16 object-contain border border-gray-300 rounded cursor-pointer hover:scale-150 transition-transform"
                          onClick={() => {
                            const newWindow = window.open();
                            if (newWindow) {
                              newWindow.document.write(`<img src="data:image/png;base64,${frontsideDesign.image}" style="max-width:100%;height:auto;" />`);
                            }
                          }}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">Backside Design:</span>
                      <span className="ml-2 text-gray-700">{paper.backside_design || (paper.design ? 'same as front' : '-')}</span>
                      {backsideDesign?.image && (
                        <img
                          src={`data:image/png;base64,${backsideDesign.image}`}
                          alt={backsideDesign.design_name}
                          className="w-16 h-16 object-contain border border-gray-300 rounded cursor-pointer hover:scale-150 transition-transform"
                          onClick={() => {
                            const newWindow = window.open();
                            if (newWindow) {
                              newWindow.document.write(`<img src="data:image/png;base64,${backsideDesign.image}" style="max-width:100%;height:auto;" />`);
                            }
                          }}
                        />
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">Frontside Laminate:</span>
                      <span className="ml-2 text-gray-700">{paper.frontside_laminate || paper.laminate || '-'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">Backside Laminate:</span>
                      <span className="ml-2 text-gray-700">{paper.backside_laminate || '-'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">Gel Colour:</span>
                      <span className="ml-2 text-gray-700">{paper.gel_colour || '-'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">Grade:</span>
                      <span className="ml-2 text-gray-700">{paper.grade || '-'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">Side Frame:</span>
                      <span className="ml-2 text-gray-700">{paper.side_frame || '-'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">Filler:</span>
                      <span className="ml-2 text-gray-700">{paper.filler || '-'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">FOAM Bottom:</span>
                      <span className="ml-2 text-gray-700">{paper.foam_bottom || '-'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">FRP Coating:</span>
                      <span className="ml-2 text-gray-700">{paper.frp_coating || '-'}</span>
                    </div>
                  </>
                )}
                <div className="col-span-2">
                  <span className="font-semibold text-gray-900">Remark:</span>
                  <span className="ml-2 text-gray-700">{paper.remark || paper.remarks || '-'}</span>
                </div>
              </div>
            </div>

            {/* Dimensions Table - SR NO, WIDTH, HEIGHT, WALL, WING/BLDG, QUANTITY */}
            {(paper.product_category === 'Frame' || paper.product_category === 'Shutter') && (
              <div className="border-b-2 border-gray-800 p-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-3 print:font-bold">
                  {paper.product_category === 'Frame' ? 'Frame Dimension Details' : 'Shutter Dimension Details'}
                </h3>
                {groupedItems.length > 0 ? (
                  <div className="w-full overflow-x-auto">
                    <table className="w-full border-collapse border border-black text-sm">
                      <thead>
                        <tr className="bg-gray-200 border border-black">
                          <th className="border border-black px-2 py-2 text-center font-bold text-xs text-gray-900 uppercase">SR NO</th>
                          <th className="border border-black px-2 py-2 text-center font-bold text-xs text-gray-900 uppercase">WIDTH</th>
                          <th className="border border-black px-2 py-2 text-center font-bold text-xs text-gray-900 uppercase">HEIGHT</th>
                          {paper.product_category === 'Frame' && (
                            <th className="border border-black px-2 py-2 text-center font-bold text-xs text-gray-900 uppercase">WALL</th>
                          )}
                          <th className="border border-black px-2 py-2 text-center font-bold text-xs text-gray-900 uppercase">WING/BLDG</th>
                          <th className="border border-black px-2 py-2 text-center font-bold text-xs text-gray-900 uppercase">QUANTITY</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedItems.map((item: any, index: number) => (
                          <tr key={index} className="border border-black">
                            <td className="border border-black px-2 py-2 text-center font-medium text-gray-900">{index + 1}</td>
                            <td className="border border-black px-2 py-2 text-center text-gray-900">{item.display_width}</td>
                            <td className="border border-black px-2 py-2 text-center text-gray-900">{item.display_height}</td>
                            {paper.product_category === 'Frame' && (
                              <td className="border border-black px-2 py-2 text-center text-gray-900">{item.display_wall}</td>
                            )}
                            <td className="border border-black px-2 py-2 text-center text-gray-900">{item.display_flat}</td>
                            <td className="border border-black px-2 py-2 text-center font-medium text-gray-900">{item.qty}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-100 font-bold border border-black">
                          <td colSpan={paper.product_category === 'Frame' ? 5 : 4} className="border border-black px-2 py-2 text-right text-gray-900">TOTAL</td>
                          <td className="border border-black px-2 py-2 text-center text-gray-900">{totalQty} NOS</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-sm py-4">No dimension items available.</p>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="p-4 text-xs text-gray-600 text-center border-t border-gray-300">
              Generated on {formatDateTime(new Date().toISOString())}
            </div>
          </div>
        </main>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          aside,
          div[class*="fixed"][class*="left-0"][class*="bg-gray-900"],
          div[class*="fixed"][class*="left-0"][class*="rounded-r"],
          div[class*="bg-gray-900"][class*="fixed"][class*="left-0"],
          div[class*="fixed"][class*="left-0"][style*="top: 64px"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            width: 0 !important;
            height: 0 !important;
            overflow: hidden !important;
            position: absolute !important;
            left: -9999px !important;
          }
          
          nav[class*="fixed"][class*="top-0"],
          nav[class*="fixed"][class*="left-0"][class*="right-0"],
          header[class*="fixed"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            overflow: hidden !important;
          }
          
          [class*="fixed"][class*="left-0"]:not(.print-content):not(.print-content *) {
            display: none !important;
            visibility: hidden !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:ml-0 {
            margin-left: 0 !important;
            padding-left: 0 !important;
          }
          
          .print\\:pt-0 {
            padding-top: 0 !important;
            margin-top: 0 !important;
          }
          
          .print\\:p-4 {
            padding: 0 !important;
          }
          
          body > div,
          body > div > div {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          main {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            display: block !important;
            visibility: visible !important;
          }
          
          .print-content {
            display: block !important;
            position: relative !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: white !important;
            box-shadow: none !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          
          .print-content,
          .print-content * {
            visibility: visible !important;
          }
          
          .print\\:bg-white {
            background: white !important;
          }
          
          .print\\:bg-pink-50 {
            background: #fdf2f8 !important;
          }
          
          .print\\:bg-red-50 {
            background: #fef2f2 !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .print-content * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            font-family: Arial, Helvetica, sans-serif !important;
            color: #000000 !important;
          }
          
          .bg-yellow-200 {
            background: #fef3c7 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .border-2,
          .border-b-2,
          .border-t-2 {
            border-width: 2px !important;
            border-style: solid !important;
            border-color: #000000 !important;
          }
          
          .border,
          .border-b,
          .border-r,
          .border-t,
          .border-gray-800 {
            border-width: 1px !important;
            border-style: solid !important;
            border-color: #000000 !important;
          }
          
          .grid {
            display: grid !important;
            page-break-inside: avoid !important;
            visibility: visible !important;
          }
          
          .grid.grid-cols-6 > div,
          .grid.grid-cols-2 > div {
            border: 1px solid #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            visibility: visible !important;
          }
          
          .bg-gray-100 {
            background: #f3f4f6 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .bg-gray-50 {
            background: #f9fafb !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .text-gray-900,
          .text-gray-700,
          .text-gray-600 {
            color: #000000 !important;
          }
          
          .font-bold,
          .font-semibold {
            font-weight: bold !important;
          }
          
          .p-3,
          .p-4 {
            padding: 8px !important;
          }
          
          .px-3,
          .px-4 {
            padding-left: 8px !important;
            padding-right: 8px !important;
          }
          
          .py-2,
          .py-3 {
            padding-top: 6px !important;
            padding-bottom: 6px !important;
          }
          
          img {
            max-width: 100% !important;
            height: auto !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            display: inline-block !important;
            visibility: visible !important;
          }
          
          .text-xs {
            font-size: 10px !important;
          }
          
          .border-b-2 {
            page-break-after: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}

