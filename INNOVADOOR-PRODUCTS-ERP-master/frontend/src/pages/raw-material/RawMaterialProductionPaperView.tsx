import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useSidebar } from '../../context/SidebarContext';
import RawMaterialSidebar from '../../components/RawMaterialSidebar';
import RawMaterialNavbar from '../../components/RawMaterialNavbar';
import { ArrowLeft } from 'lucide-react';

type RawMaterialItem = {
  sr_no: number;
  ro_width: number;
  ro_height: number;
  thickness: string;
  quantity: number;
  sq_ft: number;
  sq_meter: number;
  laminate_sheets: number;
};

type RawMaterialTotals = {
  quantity: number;
  sq_ft: number;
  sq_meter: number;
  total_laminate_sheets: number;
};

type RawMaterialData = {
  paper_number: string;
  items: RawMaterialItem[];
  totals: RawMaterialTotals;
};

type ProductionPaper = {
  id: number;
  paper_number: string;
  area?: string | null;
  grade?: string | null;
  side_frame?: string | null;
  filler?: string | null;
  frontside_laminate?: string | null;
  laminate?: string | null;
};

export default function RawMaterialProductionPaperView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isCollapsed, isHovered } = useSidebar();
  const [paper, setPaper] = useState<ProductionPaper | null>(null);
  const [rawMaterialData, setRawMaterialData] = useState<RawMaterialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch production paper and raw material data in parallel
      const [paperData, rawMaterialResponse] = await Promise.all([
        api.get(`/production/production-papers/${id}`, true),
        api.get(`/raw-material/generation/${id}`, true).catch(() => null)
      ]);

      setPaper({
        id: paperData.id,
        paper_number: paperData.paper_number,
        area: paperData.area,
        grade: paperData.grade,
        side_frame: paperData.side_frame,
        filler: paperData.filler,
        frontside_laminate: paperData.frontside_laminate,
        laminate: paperData.laminate,
      });

      if (rawMaterialResponse) {
        setRawMaterialData({
          paper_number: rawMaterialResponse.paper_number,
          items: rawMaterialResponse.items || [],
          totals: rawMaterialResponse.totals || {
            quantity: 0,
            sq_ft: 0,
            sq_meter: 0,
            total_laminate_sheets: 0,
          },
        });
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load raw material paper');
    } finally {
      setLoading(false);
    }
  };

  // Format number with 2 decimal places
  const formatDecimal = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    return value.toFixed(2);
  };

  // Format integer
  const formatInteger = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    return Math.round(value).toString();
  };

  // Format string or return dash
  const formatString = (value: string | null | undefined): string => {
    return value || '-';
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
              onClick={() => navigate('/raw-material/parties')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </main>
        </div>
      </div>
    );
  }

  if (!paper) {
    return null;
  }

  const productionCode = paper.paper_number || '-';
  const generalArea = formatString(paper.area);
  const grade = formatString(paper.grade);
  const sideFrame = formatString(paper.side_frame);
  const filler = formatString(paper.filler);
  const laminateCode = formatString(paper.frontside_laminate || paper.laminate);

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <RawMaterialSidebar />
      <RawMaterialNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16 print:ml-0 print:pt-0`}>
        <main className="p-8 print:p-4">
          {/* Back Button - Hidden in Print */}
          <div className="mb-6 print:hidden">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>

          {/* A4 Size Paper */}
          <div className="print-content bg-white border-2 border-gray-800 shadow-lg print:shadow-none" style={{ maxWidth: '210mm', minHeight: '297mm', margin: '0 auto', padding: '30px' }}>
            {/* Title */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-blue-600">RAW MATERIAL PAPER</h1>
            </div>

            {/* Header Table */}
            <div className="mb-6">
              <table className="w-full border-collapse border border-black">
                <tbody>
                  <tr>
                    <td className="border border-black px-3 py-2 text-sm font-bold text-center bg-gray-100">Production Code:</td>
                    <td className="border border-black px-3 py-2 text-sm text-center">{productionCode}</td>
                    <td className="border border-black px-3 py-2 text-sm font-bold text-center bg-gray-100">General Area:</td>
                    <td className="border border-black px-3 py-2 text-sm text-center">{generalArea}</td>
                    <td className="border border-black px-3 py-2 text-sm font-bold text-center bg-gray-100">Grade:</td>
                    <td className="border border-black px-3 py-2 text-sm text-center">{grade}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-3 py-2 text-sm font-bold text-center bg-gray-100">Side Frame:</td>
                    <td className="border border-black px-3 py-2 text-sm text-center">{sideFrame}</td>
                    <td className="border border-black px-3 py-2 text-sm font-bold text-center bg-gray-100">Filler:</td>
                    <td className="border border-black px-3 py-2 text-sm text-center">{filler}</td>
                    <td className="border border-black px-3 py-2 text-sm font-bold text-center bg-gray-100">Laminate Code:</td>
                    <td className="border border-black px-3 py-2 text-sm text-center">{laminateCode}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Main Table */}
            {rawMaterialData && rawMaterialData.items.length > 0 ? (
              <div className="mb-6">
                <table className="w-full border-collapse border border-black text-sm">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-black px-3 py-2 font-bold text-center">Item No</th>
                      <th className="border border-black px-3 py-2 font-bold text-center">RO Width<br />(Inch)</th>
                      <th className="border border-black px-3 py-2 font-bold text-center">RO Height<br />(Inch)</th>
                      <th className="border border-black px-3 py-2 font-bold text-center">Thickness<br />(mm)</th>
                      <th className="border border-black px-3 py-2 font-bold text-center">Quantity</th>
                      <th className="border border-black px-3 py-2 font-bold text-center">Sq.Foot</th>
                      <th className="border border-black px-3 py-2 font-bold text-center">Sq.Meter</th>
                      <th className="border border-black px-3 py-2 font-bold text-center">Laminate<br />Sheets</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawMaterialData.items.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-black px-3 py-2 text-center">{item.sr_no}</td>
                        <td className="border border-black px-3 py-2 text-center">{formatDecimal(item.ro_width)}</td>
                        <td className="border border-black px-3 py-2 text-center">{formatDecimal(item.ro_height)}</td>
                        <td className="border border-black px-3 py-2 text-center">{formatString(item.thickness)}</td>
                        <td className="border border-black px-3 py-2 text-center">{formatInteger(item.quantity)}</td>
                        <td className="border border-black px-3 py-2 text-center">{formatDecimal(item.sq_ft)}</td>
                        <td className="border border-black px-3 py-2 text-center">{formatDecimal(item.sq_meter)}</td>
                        <td className="border border-black px-3 py-2 text-center">{formatInteger(item.laminate_sheets)}</td>
                      </tr>
                    ))}
                    {/* TOTAL Row */}
                    <tr className="bg-gray-100 font-bold">
                      <td className="border border-black px-3 py-2 text-center">TOTAL</td>
                      <td className="border border-black px-3 py-2 text-center"></td>
                      <td className="border border-black px-3 py-2 text-center"></td>
                      <td className="border border-black px-3 py-2 text-center"></td>
                      <td className="border border-black px-3 py-2 text-center">{formatInteger(rawMaterialData.totals.quantity)}</td>
                      <td className="border border-black px-3 py-2 text-center">{formatDecimal(rawMaterialData.totals.sq_ft)}</td>
                      <td className="border border-black px-3 py-2 text-center">{formatDecimal(rawMaterialData.totals.sq_meter)}</td>
                      <td className="border border-black px-3 py-2 text-center">{formatInteger(rawMaterialData.totals.total_laminate_sheets)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No raw material data available
              </div>
            )}
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
            padding: 30px !important;
            background: white !important;
            box-shadow: none !important;
            visibility: visible !important;
            opacity: 1 !important;
            page-break-after: always !important;
          }
          
          .print-content,
          .print-content * {
            visibility: visible !important;
          }
          
          .print\\:bg-white {
            background: white !important;
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
          
          .text-gray-900,
          .text-gray-700,
          .text-gray-600 {
            color: #000000 !important;
          }
          
          .text-blue-600 {
            color: #2563eb !important;
          }
          
          .font-bold,
          .font-semibold {
            font-weight: bold !important;
          }
          
          .p-3,
          .p-4,
          .p-8 {
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
          
          .text-xs {
            font-size: 10px !important;
          }
          
          .text-sm {
            font-size: 12px !important;
          }
          
          .text-base {
            font-size: 14px !important;
          }
          
          .text-3xl {
            font-size: 30px !important;
          }
          
          .text-4xl {
            font-size: 36px !important;
          }

          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }

          table td,
          table th {
            border: 1px solid #000000 !important;
            padding: 8px !important;
            text-align: center !important;
          }

          table thead tr {
            background-color: #e5e7eb !important;
            font-weight: bold !important;
          }

          table tbody tr.bg-gray-100 {
            background-color: #f3f4f6 !important;
            font-weight: bold !important;
          }
        }
      `}</style>
    </div>
  );
}
