import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useSidebar } from '../../context/SidebarContext';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { ArrowLeft, Printer, Download, Layout } from 'lucide-react';
import DoorProductionPaper from './DoorProductionPaper';
import FrameProductionPaper from './FrameProductionPaper';
import DimensionDetailsTable from '../../components/DimensionDetailsTable';

export default function ViewProductionPaper() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isCollapsed, isHovered } = useSidebar();
  const [paper, setPaper] = useState<any>(null);
  const [measurementItems, setMeasurementItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [frontsideDesign, setFrontsideDesign] = useState<any>(null);
  const [backsideDesign, setBacksideDesign] = useState<any>(null);
  const [frameDesign, setFrameDesign] = useState<any>(null);
  const [useModernLayout, setUseModernLayout] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  // Mirror RM Paper states
  const [rmItems, setRmItems] = useState<any[]>([]);
  const [rmLoading, setRmLoading] = useState(false);
  const [rmGenerated, setRmGenerated] = useState(false);

  const groupedItems = useMemo(() => {
    const groups: { [key: string]: any } = {};
    measurementItems.forEach(item => {
      const width = item.ro_width || item.width || item.w || item.act_width || '-';
      const height = item.ro_height || item.height || item.h || item.act_height || '-';
      const bldg = item.bldg || item.bldg_wing || '';
      const flat = item.flat_no || item.flat || '';
      const wall = item.wall || '';

      const key = `${width}-${height}-${bldg}-${flat}-${wall}`;

      if (groups[key]) {
        groups[key].qty = (groups[key].qty || 0) + (Number(item.qty) || Number(item.quantity) || 1);
      } else {
        const getFormatValue = (val: any, isFrame: boolean) => {
          if (!val || val === '-') return '-';
          const num = typeof val === 'string' ? parseFloat(val.replace('"', '')) : val;
          if (isNaN(num)) return val;

          if (isFrame) {
            return num < 100 ? Math.round(num * 25.4).toString() : Math.round(num).toString();
          } else {
            return num < 100 ? num.toString() : (num / 25.4).toFixed(2);
          }
        };

        groups[key] = {
          ...item,
          display_width: getFormatValue(width, paper?.product_category === 'Frame'),
          display_height: getFormatValue(height, paper?.product_category === 'Frame'),
          display_flat: flat ? `${bldg ? bldg + ' ' : ''}${flat}` : (bldg || '-'),
          display_wall: wall || '-',
          qty: (Number(item.qty) || Number(item.quantity) || 1)
        };
      }
    });
    return Object.values(groups);
  }, [measurementItems, paper?.product_category]);

  const section4DimensionItems = useMemo(() => {
    if (!measurementItems?.length || !paper?.product_category) return [];
    const isShutter = paper.product_category === 'Shutter';
    if (isShutter) {
      const toNum = (val: any) => {
        if (val == null || val === '' || val === '-') return null;
        const num = typeof val === 'string' ? parseFloat(String(val).replace('"', '')) : val;
        return isNaN(num) ? null : num;
      };
      const toMm = (val: any) => {
        const n = toNum(val);
        if (n == null) return null;
        return n < 100 ? Math.round(n * 25.4) : Math.round(n);
      };
      const toInch = (val: any) => {
        const n = toNum(val);
        if (n == null) return null;
        return n > 100 ? Number((n / 25.4).toFixed(2)) : Number(n.toFixed(2));
      };
      return measurementItems.map((item: any, idx: number) => {
        const bldg = item.bldg ?? item.bldg_wing ?? '';
        const flatNo = item.flat_no ?? item.flat ?? '';
        const areaVal = item.area ?? '';
        const location = [bldg, flatNo, areaVal].filter(Boolean).join('_') || '-';
        const widthRaw = item.width ?? item.w ?? item.ro_width;
        const heightRaw = item.height ?? item.h ?? item.ro_height;
        const actW = item.act_width ?? item.width ?? item.w;
        const actH = item.act_height ?? item.height ?? item.h;
        const widthMm = toMm(widthRaw);
        const heightMm = toMm(heightRaw);
        const actWidthMm = toMm(actW);
        const actHeightMm = toMm(actH);
        const actWidthInch = toInch(actW);
        const actHeightInch = toInch(actH);
        const roWidthInch = toInch(item.ro_width ?? widthRaw);
        const roHeightInch = toInch(item.ro_height ?? heightRaw);
        let actSqFt = 0;
        if (item.act_sq_ft != null && !isNaN(Number(item.act_sq_ft))) actSqFt = Number(item.act_sq_ft);
        else if (actWidthMm != null && actHeightMm != null) actSqFt = (actWidthMm / 25.4) * (actHeightMm / 25.4) / 144;
        const qty = Number(item.qty) ?? Number(item.quantity) ?? 1;
        return {
          srNo: idx + 1,
          user_serial: item.item_no ?? item.serial ?? item.user_serial ?? '',
          location,
          bldg_wings: bldg || '-',
          flat_no: flatNo || '-',
          area: areaVal || '-',
          width_mm: widthMm ?? '-',
          height_mm: heightMm ?? '-',
          act_width_mm: actWidthMm ?? '-',
          act_height_mm: actHeightMm ?? '-',
          act_width_inch: actWidthInch ?? '-',
          act_height_inch: actHeightInch ?? '-',
          ro_width_inches: roWidthInch ?? '-',
          ro_height_inches: roHeightInch ?? '-',
          act_sq_ft: actSqFt,
          remark: item.remark ?? '',
          qty
        };
      });
    } else {
      const getMM = (val: any) => {
        if (val == null || val === '' || val === '-') return null;
        const num = typeof val === 'string' ? parseFloat(String(val).replace('"', '')) : val;
        if (isNaN(num)) return null;
        return num < 100 ? Math.round(num * 25.4) : Math.round(num);
      };
      const groups: { [key: string]: { width: number | null; height: number | null; wall: any; location: string[]; qty: number } } = {};
      measurementItems.forEach((item: any) => {
        const w = item.act_width ?? item.width ?? item.w;
        const h = item.act_height ?? item.height ?? item.h;
        const wall = item.wall ?? '';
        const wMM = getMM(w);
        const hMM = getMM(h);
        const wallVal = getMM(wall) ?? wall;
        const key = `${wMM ?? w}-${hMM ?? h}-${wallVal ?? wall}`;
        const loc = item.bldg || item.bldg_wing || '';
        const qty = Number(item.qty) || Number(item.quantity) || 1;
        if (groups[key]) {
          groups[key].qty += qty;
          if (loc && !groups[key].location.includes(loc)) groups[key].location.push(loc);
        } else {
          groups[key] = { width: wMM, height: hMM, wall: wallVal ?? wall, location: loc ? [loc] : [], qty };
        }
      });
      const sorted = Object.values(groups).sort((a, b) => {
        const wDiff = (a.width ?? 0) - (b.width ?? 0);
        if (wDiff !== 0) return wDiff;
        return (a.height ?? 0) - (b.height ?? 0);
      });
      return sorted.map((row, idx) => ({
        srNo: idx + 1,
        width: row.width,
        height: row.height,
        wall: row.wall,
        location: row.location.length ? row.location.join(', ') : '-',
        qty: row.qty
      }));
    }
  }, [measurementItems, paper?.product_category]);

  useEffect(() => {
    if (paper?.product_category === 'Shutter' || paper?.product_category === 'Frame') {
      setUseModernLayout(true);
    }
  }, [paper?.product_category]);

  useEffect(() => {
    if (id) {
      loadPaper();
    }
  }, [id]);

  useEffect(() => {
    if (paper && paper.product_category === 'Shutter') {
      loadRMItems();
    }
  }, [paper?.id, paper?.product_category]);

  const loadPaper = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get(`/production/production-papers/${id}`, true);
      setPaper(data);

      // Prefer backend-resolved selected items (only selected measurement items on the paper)
      if (data.selected_items_data && Array.isArray(data.selected_items_data) && data.selected_items_data.length > 0) {
        setMeasurementItems(data.selected_items_data);
      } else if (data.measurement_id) {
        try {
          const measurementData = await api.get(`/production/measurements/${data.measurement_id}`, true);
          if (measurementData.items) {
            let items = typeof measurementData.items === 'string'
              ? JSON.parse(measurementData.items)
              : measurementData.items;
            if (data.selected_measurement_items && Array.isArray(data.selected_measurement_items) && data.selected_measurement_items.length > 0) {
              const first = data.selected_measurement_items[0];
              if (typeof first === 'number') {
                items = data.selected_measurement_items
                  .filter((idx: number) => Number.isInteger(idx) && idx >= 0 && idx < items.length)
                  .map((idx: number) => items[idx]);
              }
            }
            setMeasurementItems(Array.isArray(items) ? items : []);
          }
        } catch (err) {
          console.error('Failed to load measurement items:', err);
        }
      }

      let frontDesignNode = null;
      if (data.frontside_design && data.frontside_design !== 'same as front') {
        try {
          const designs = await api.get('/production/designs', true);
          frontDesignNode = designs.find((d: any) => d.design_code === data.frontside_design || d.design_name === data.frontside_design);
          if (frontDesignNode) setFrontsideDesign(frontDesignNode);
        } catch (err) {
          console.error('Failed to load frontside design details:', err);
        }
      } else if (data.design) {
        try {
          const designs = await api.get('/production/designs', true);
          frontDesignNode = designs.find((d: any) => d.design_code === data.design || d.design_name === data.design);
          if (frontDesignNode) setFrontsideDesign(frontDesignNode);
        } catch (err) {
          console.error('Failed to load default design details:', err);
        }
      }

      if (data.backside_design && data.backside_design !== 'same as front') {
        try {
          const designs = await api.get('/production/designs', true);
          const backside = designs.find((d: any) => d.design_code === data.backside_design || d.design_name === data.backside_design);
          if (backside) setBacksideDesign(backside);
        } catch (err) {
          console.error('Failed to load backside design details:', err);
        }
      } else if (data.backside_design === 'same as front' && frontDesignNode) {
        setBacksideDesign(frontDesignNode);
      }

      if (data.frame_design) {
        try {
          const designs = await api.get('/production/designs', true);
          const frame = designs.find((d: any) => d.design_code === data.frame_design || d.design_name === data.frame_design);
          if (frame) setFrameDesign(frame);
        } catch (err) {
          console.error('Failed to load frame design details:', err);
        }
      }

    } catch (err: any) {
      console.error('Error loading production paper:', err);
      setError(err.message || 'Failed to load production paper');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaperColor = () => {
    if (paper?.order_type === 'Urgent') return 'bg-pink-50';
    if (paper?.order_type === 'A Class') return 'bg-red-50';
    return 'bg-white';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsDownloadingPDF(true);
    try {
      window.print();
    } finally {
      // Small delay to let the print dialog open before resetting state
      setTimeout(() => setIsDownloadingPDF(false), 1000);
    }
  };

  // Load RM Items
  const loadRMItems = async () => {
    if (!id) return;
    try {
      setRmLoading(true);
      const data = await api.get(`/production/production-papers/${id}/rm-items`, true);
      setRmItems(data || []);
      setRmGenerated(data && data.length > 0);
    } catch (err) {
      console.error('Failed to load RM items:', err);
      setRmItems([]);
      setRmGenerated(false);
    } finally {
      setRmLoading(false);
    }
  };

  // Generate/Regenerate RM Paper
  const generateRMPaper = async () => {
    if (!id) return;
    try {
      setRmLoading(true);
      await api.post(`/production/production-papers/${id}/generate-rm`, {}, true);
      await loadRMItems();
      alert('Raw Material Paper generated successfully!');
    } catch (err: any) {
      console.error('Failed to generate RM paper:', err);
      alert(err.message || 'Failed to generate RM paper');
    } finally {
      setRmLoading(false);
    }
  };

  // Export RM Paper to Excel
  const exportRMToExcel = () => {
    if (rmItems.length === 0) {
      alert('No RM items to export');
      return;
    }

    const headers = ['Item No', 'RO Width', 'RO Height', 'Thickness', 'Quantity', 'Sq.Ft', 'Sq.Meter', 'Laminate Sheets'];
    const rows = rmItems.map(item => [
      item.item_no || '',
      item.ro_width || '',
      item.ro_height || '',
      item.thickness || '',
      item.quantity || '',
      item.sq_ft || '',
      item.sq_meter || '',
      item.laminate_sheets || ''
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${paper?.paper_number || 'RM'}-RM.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };


  const formatDateTime = (dateString: string | null | undefined) => {
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

  const getImageSrc = (imageStr: string | null | undefined) => {
    if (!imageStr) return undefined;
    if (imageStr.startsWith('data:')) return imageStr;
    return `data:image/png;base64,${imageStr}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <Navbar />
        <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'md:ml-20' : 'md:ml-64'} pt-16`}>
          <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <Navbar />
        <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'md:ml-20' : 'md:ml-64'} pt-16`}>
          <main className="p-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error! </strong>
              <span className="block sm:inline">{error || 'Production paper not found.'}</span>
            </div>
            <button
              onClick={() => navigate('/production-papers')}
              className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Production Papers
            </button>
          </main>
        </div>
      </div>
    );
  }

  const totalQty = measurementItems.reduce((sum, item) => sum + (Number(item.qty) || Number(item.quantity) || 1), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'md:ml-20' : 'md:ml-64'} pt-16 print:ml-0 print:pt-0`}>
        <main className="p-4 md:p-8 print:p-0">
          <div className="max-w-5xl mx-auto">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 print:hidden">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/production-papers')}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  title="Back"
                >
                  <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Production Paper</h1>
                  <p className="text-sm text-gray-500">{paper.paper_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(paper.status)}`}>
                  {paper.status || 'Pending'}
                </span>
                <div className="h-6 w-px bg-gray-300 mx-1"></div>
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
                {(paper.product_category === 'Shutter' || paper.product_category === 'Frame') && (
                  <button
                    onClick={() => setUseModernLayout(!useModernLayout)}
                    className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${useModernLayout
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                  >
                    <Layout className="w-4 h-4" />
                    {useModernLayout ? 'Classic View' : 'Modern View'}
                  </button>
                )}
              </div>
            </div>

            {useModernLayout && paper.product_category === 'Shutter' ? (
              <DoorProductionPaper
                paper={paper}
                measurementItems={measurementItems}
                frontsideDesign={frontsideDesign}
              />
            ) : useModernLayout && paper.product_category === 'Frame' ? (
              <FrameProductionPaper
                paper={paper}
                measurementItems={measurementItems}
                frameDesign={frameDesign}
              />
            ) : (
              <>
                <div className={`print-content ${getPaperColor()} border-2 border-gray-800 shadow-lg print:shadow-none`} style={{ maxWidth: '210mm', margin: '0 auto' }}>
                  {/* Header Section */}
                  <div className="bg-gray-100 px-6 py-4 border-b-2 border-gray-800 flex flex-col md:flex-row justify-between items-center gap-2 print:bg-gray-100">
                    <div className="text-left">
                      <h2 className="text-xl font-black text-gray-900 uppercase">Production No: {paper.paper_number}</h2>
                      <div className="text-sm font-bold text-gray-700 uppercase tracking-tight">
                        Project: {paper.site_name || 'N/A'} | Client: {paper.party_name || paper.party?.name || 'N/A'}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex gap-2 items-center">
                        {paper.order_type === 'Urgent' && (
                          <span className="px-3 py-1 bg-red-600 text-white font-black text-sm animate-pulse rounded no-break">URGENT</span>
                        )}
                        <span className="px-3 py-1 bg-gray-900 text-white font-black text-lg rounded no-break">TOTAL: {totalQty} NOS</span>
                      </div>
                      <div className="text-[10px] font-bold text-gray-500">
                        {paper.product_category} | {formatDateTime(paper.created_at)}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 1: CUTTING SIZE SUMMARY */}
                  <div className="border-b-2 border-gray-800 no-break">
                    <div className="bg-gray-800 text-white px-4 py-1 text-xs font-bold uppercase tracking-widest text-center print:bg-black">
                      CUTTING SIZE SUMMARY ({paper.product_category === 'Frame' ? 'MM' : 'INCH'})
                    </div>
                    {groupedItems.length > 0 ? (
                      <div className="w-full">
                        <div className={`grid ${paper.product_category === 'Frame' ? 'grid-cols-6' : 'grid-cols-5'} border-b-2 border-gray-800 bg-gray-200 print:bg-gray-200`}>
                          <div className="border-r-2 border-gray-800 px-2 py-3 text-center font-black text-xs text-gray-900 uppercase">SR NO</div>
                          <div className="border-r-2 border-gray-800 px-2 py-3 text-center font-black text-xs text-gray-900 uppercase">WIDTH</div>
                          <div className="border-r-2 border-gray-800 px-2 py-3 text-center font-black text-xs text-gray-900 uppercase">HEIGHT</div>
                          {paper.product_category === 'Frame' && (
                            <div className="border-r-2 border-gray-800 px-2 py-3 text-center font-black text-xs text-gray-900 uppercase">WALL</div>
                          )}
                          <div className="border-r-2 border-gray-800 px-2 py-3 text-center font-black text-xs text-gray-900 uppercase">BLDG/Wings</div>
                          <div className="px-2 py-3 text-center font-black text-xs text-gray-900 uppercase">QTY</div>
                        </div>

                        <div className="zebra-rows">
                          {groupedItems.map((item: any, index: number) => (
                            <div key={index} className={`grid ${paper.product_category === 'Frame' ? 'grid-cols-6' : 'grid-cols-5'} border-b border-gray-400`}>
                              <div className="border-r-2 border-gray-800 px-2 py-3 text-center font-bold text-sm text-gray-900">{index + 1}</div>
                              <div className="border-r-2 border-gray-800 px-2 py-3 text-center font-black text-lg text-gray-900">{item.display_width}</div>
                              <div className="border-r-2 border-gray-800 px-2 py-3 text-center font-black text-lg text-gray-900">{item.display_height}</div>
                              {paper.product_category === 'Frame' && (
                                <div className="border-r-2 border-gray-800 px-2 py-3 text-center font-bold text-sm text-gray-900">{item.display_wall}</div>
                              )}
                              <div className="border-r-2 border-gray-800 px-2 py-3 text-center font-bold text-sm text-gray-900 uppercase">{item.display_flat}</div>
                              <div className="px-2 py-3 text-center font-black text-lg text-gray-900">{item.qty}</div>
                            </div>
                          ))}
                        </div>

                        <div className={`grid ${paper.product_category === 'Frame' ? 'grid-cols-6' : 'grid-cols-5'} border-t-2 border-gray-800 bg-gray-100 print:bg-gray-100`}>
                          <div className={`${paper.product_category === 'Frame' ? 'col-span-4' : 'col-span-3'} border-r-2 border-gray-800 px-6 py-3 text-right font-black text-lg text-gray-900`}>TOTAL :-</div>
                          <div className="border-r border-gray-800 px-4 py-3 text-center font-black text-xl text-gray-900">{totalQty}</div>
                          <div className="px-4 py-3 text-left font-black text-lg text-gray-900 uppercase">{paper.product_category === 'Frame' ? 'SET' : 'NOS'}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-500 italic">No measurement items found.</div>
                    )}
                  </div>

                  {/* SECTION 2: DESIGN IMAGES */}
                  <div className="border-b-2 border-gray-800 p-6 no-break">
                    <div className="flex flex-col md:flex-row gap-8 justify-center items-start">
                      <div className="flex-1 flex flex-col items-center">
                        <div className="text-xs font-black text-gray-600 uppercase mb-2">DESIGN CODE: {paper.frontside_design || paper.design || 'N/A'}</div>
                        {frontsideDesign?.image ? (
                          <div className="border-4 border-black p-1 bg-white">
                            <img src={getImageSrc(frontsideDesign.image)} alt="Front Design" className="w-48 h-64 md:w-64 md:h-80 object-contain" />
                            <div className="mt-2 text-center text-[10px] font-bold uppercase">FRONT LAMINATE: {paper.frontside_laminate || paper.laminate || '-'}</div>
                          </div>
                        ) : (
                          <div className="w-48 h-64 border-2 border-dashed border-gray-300 flex items-center justify-center text-center p-4 text-xs text-gray-500 font-bold uppercase">NO DESIGN IMAGE</div>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col items-center">
                        <div className="text-xs font-black text-gray-600 uppercase mb-2">BACK FINISH: {paper.backside_design || 'N/A'}</div>
                        {backsideDesign?.image && paper.backside_design !== 'same as front' ? (
                          <div className="border-4 border-black p-1 bg-white">
                            <img src={getImageSrc(backsideDesign.image)} alt="Back Design" className="w-32 h-44 md:w-40 md:h-56 object-contain" />
                            <div className="mt-2 text-center text-[10px] font-bold uppercase">BACK LAMINATE: {paper.backside_laminate || '-'}</div>
                          </div>
                        ) : (
                          <div className="mt-8 p-4 border-2 border-gray-900 text-center">
                            <span className="text-xs font-black uppercase">BACKSIDE FINISH:</span>
                            <p className="text-sm font-bold mt-1 uppercase">{paper.backside_design === 'same as front' ? 'SAME AS FRONT' : (paper.backside_laminate || '-')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: PRODUCT DETAILS */}
                  <div className="p-6 no-break">
                    <div className="grid grid-cols-2 gap-x-12 gap-y-2">
                      <div className="flex justify-between border-b border-gray-300 py-1">
                        <span className="text-xs font-bold text-gray-600 uppercase">Concept</span>
                        <span className="text-sm font-black text-gray-900">{paper.concept || '-'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-300 py-1">
                        <span className="text-xs font-bold text-gray-600 uppercase">Frame Design</span>
                        <span className="text-sm font-black text-gray-900">{paper.frame_design || '-'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-300 py-1">
                        <span className="text-xs font-bold text-gray-600 uppercase">Wall Type</span>
                        <span className="text-sm font-black text-gray-900">{paper.wall_type || '-'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-300 py-1">
                        <span className="text-xs font-bold text-gray-600 uppercase">Thickness</span>
                        <span className="text-sm font-black text-gray-900">{paper.thickness || '-'}</span>
                      </div>
                      {paper.product_category === 'Shutter' && (
                        <div className="flex justify-between border-b border-gray-300 py-1">
                          <span className="text-xs font-bold text-gray-600 uppercase">CORE</span>
                          <span className="text-sm font-black text-gray-900">{paper.core || '-'}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-b border-gray-300 py-1">
                        <span className="text-xs font-bold text-gray-600 uppercase">Grade</span>
                        <span className="text-sm font-black text-gray-900">{paper.grade || '-'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-300 py-1">
                        <span className="text-xs font-bold text-gray-600 uppercase">Side Frame</span>
                        <span className="text-sm font-black text-gray-900">{paper.side_frame || '-'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-300 py-1">
                        <span className="text-xs font-bold text-gray-600 uppercase">Filler</span>
                        <span className="text-sm font-black text-gray-900">{paper.filler || '-'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-300 py-1">
                        <span className="text-xs font-bold text-gray-600 uppercase">Press Type</span>
                        <span className="text-sm font-black text-gray-900">{paper.press_type || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-300 py-1">
                        <span className="text-xs font-bold text-gray-600 uppercase">Laminate</span>
                        <span className="text-sm font-black text-gray-900">{paper.frontside_laminate || paper.laminate || '-'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-300 py-1">
                        <span className="text-xs font-bold text-gray-600 uppercase">Remark</span>
                        <span className="text-sm font-black text-gray-900 italic">{paper.remark || paper.remarks || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 text-white px-4 py-2 text-[10px] text-center uppercase tracking-widest font-bold print:bg-black">
                    End of Section 1 - Cutting Info
                  </div>
                </div>

                {/* SECTION 4: MEASUREMENT TRACEABILITY - Shutter only (not shown for Frame) */}
                {paper.product_category === 'Shutter' && section4DimensionItems.length > 0 && (
                  <div className="page-break pt-8 print:pt-0">
                    <div className="bg-gray-100 px-6 py-4 border-2 border-gray-800 mb-6 flex justify-between items-center print:bg-gray-100">
                      <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">
                        SECTION 4: MEASUREMENT TRACEABILITY ({paper.paper_number})
                      </h3>
                      <span className="text-xs font-bold text-gray-500 uppercase">Supervisor / QC COPY</span>
                    </div>

                    <DimensionDetailsTable
                      type="shutter"
                      items={section4DimensionItems}
                      variant="section4"
                    />
                  </div>
                )}

                {/* Mirror Raw Material Paper Section - Only for Shutter Category */}
                {paper?.product_category === 'Shutter' && (
                  <div className="mt-8 page-break">
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg p-4 mb-4 print-hidden">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-bold text-purple-900">Mirror Raw Material Paper</h3>
                          <p className="text-sm text-purple-700">Paper No: {paper?.paper_number}-RM</p>
                        </div>
                        <div className="flex gap-2">
                          {rmGenerated ? (
                            <>
                              <button
                                onClick={generateRMPaper}
                                disabled={rmLoading}
                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
                              >
                                {rmLoading ? 'Regenerating...' : 'Regenerate'}
                              </button>
                              </>
                          ) : (
                            <button
                              onClick={generateRMPaper}
                              disabled={rmLoading}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            >
                              {rmLoading ? 'Generating...' : 'Generate RM Paper'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {rmGenerated && rmItems.length > 0 && (
                      <div className="border-2 border-purple-300 rounded-lg overflow-hidden">
                        {/* Header Section */}
                        <div className="bg-purple-100 p-4 border-b-2 border-purple-300">
                          <h4 className="font-bold text-purple-900 mb-3">Header Details (Auto-filled from Production Paper)</h4>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-semibold text-gray-700">Production Code:</span>
                              <p className="text-gray-900">{paper?.paper_number || '-'}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-700">General Area:</span>
                              <p className="text-gray-900">{paper?.area || '-'}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-700">Grade:</span>
                              <p className="text-gray-900">{paper?.grade || '-'}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-700">Side Frame:</span>
                              <p className="text-gray-900">{paper?.side_frame || '-'}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-700">Filler:</span>
                              <p className="text-gray-900">{paper?.filler || '-'}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-700">Laminate Code:</span>
                              <p className="text-gray-900">{paper?.frontside_laminate || paper?.laminate || '-'}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-700">Thickness:</span>
                              <p className="text-gray-900">{paper?.thickness || '-'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Read-Only Mirror Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-purple-200 border-b-2 border-purple-300">
                                <th className="border-r border-purple-300 px-3 py-2 text-center font-bold text-sm text-purple-900">Item No</th>
                                <th className="border-r border-purple-300 px-3 py-2 text-center font-bold text-sm text-purple-900">RO Width</th>
                                <th className="border-r border-purple-300 px-3 py-2 text-center font-bold text-sm text-purple-900">RO Height</th>
                                <th className="border-r border-purple-300 px-3 py-2 text-center font-bold text-sm text-purple-900">Thickness</th>
                                <th className="border-r border-purple-300 px-3 py-2 text-center font-bold text-sm text-purple-900">Quantity</th>
                                <th className="border-r border-purple-300 px-3 py-2 text-center font-bold text-sm text-purple-900">Sq.Ft</th>
                                <th className="border-r border-purple-300 px-3 py-2 text-center font-bold text-sm text-purple-900">Sq.Meter</th>
                                <th className="border-purple-300 px-3 py-2 text-center font-bold text-sm text-purple-900">Laminate Sheets</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rmItems.map((item: any, index: number) => (
                                <tr key={index} className={`border-b border-purple-200 ${index % 2 === 0 ? 'bg-white' : 'bg-purple-50'}`}>
                                  <td className="border-r border-purple-200 px-3 py-2 text-center text-sm text-gray-900">{item.item_no || '-'}</td>
                                  <td className="border-r border-purple-200 px-3 py-2 text-center text-sm text-gray-900">{item.ro_width || '-'}</td>
                                  <td className="border-r border-purple-200 px-3 py-2 text-center text-sm text-gray-900">{item.ro_height || '-'}</td>
                                  <td className="border-r border-purple-200 px-3 py-2 text-center text-sm text-gray-900">{item.thickness || '-'}</td>
                                  <td className="border-r border-purple-200 px-3 py-2 text-center text-sm text-gray-900">{item.quantity || '-'}</td>
                                  <td className="border-r border-purple-200 px-3 py-2 text-center text-sm text-gray-900">{item.sq_ft ? item.sq_ft.toFixed(3) : '-'}</td>
                                  <td className="border-r border-purple-200 px-3 py-2 text-center text-sm text-gray-900">{item.sq_meter ? item.sq_meter.toFixed(3) : '-'}</td>
                                  <td className="border-purple-200 px-3 py-2 text-center text-sm text-gray-900">{item.laminate_sheets ? item.laminate_sheets.toFixed(2) : '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="bg-purple-50 p-3 text-xs text-purple-700 border-t-2 border-purple-300">
                          <p className="font-semibold">Note: This is a read-only mirror of the Production Paper. All data is auto-fetched and cannot be manually edited.</p>
                        </div>
                      </div>
                    )}

                    {rmGenerated && rmItems.length === 0 && !rmLoading && (
                      <div className="border-2 border-purple-300 rounded-lg p-8 text-center">
                        <p className="text-purple-700">No RM items found. Click "Generate RM Paper" to create the mirror.</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-4 text-xs text-gray-600 text-center border-t border-gray-300">
                  Generated on {formatDateTime(new Date().toISOString())}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { margin: 0 !important; padding: 0 !important; background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          aside, nav, header, .print-hidden { display: none !important; visibility: hidden !important; }
          .print-content { display: block !important; width: 100% !important; margin: 0 !important; padding: 0 !important; background: white !important; border: none !important; box-shadow: none !important; }
          .print-content * { color: #000 !important; text-shadow: none !important; box-shadow: none !important; border-radius: 0 !important; }
          table { width: 100% !important; border-collapse: collapse !important; border: 1.5pt solid black !important; }
          th, td { border: 1pt solid black !important; padding: 4px 6px !important; }
          .bg-yellow-200, .bg-gray-100, .bg-purple-100, .bg-blue-100 { background: #eee !important; }
          .zebra-rows div:nth-child(even) { background: #f5f5f5 !important; }
          .page-break { page-break-before: always !important; }
          .no-break { page-break-inside: avoid !important; }
          img { max-width: 100% !important; border: 2pt solid black !important; }
          .section4-measurement-traceability-table { width: 100% !important; overflow: visible !important; }
          .section4-measurement-traceability-table table { width: 100% !important; table-layout: fixed !important; font-size: 8px !important; }
          .section4-measurement-traceability-table th,
          .section4-measurement-traceability-table td { padding: 2px 4px !important; font-size: 8px !important; }
        }
      `}</style>
    </div>
  );
}
