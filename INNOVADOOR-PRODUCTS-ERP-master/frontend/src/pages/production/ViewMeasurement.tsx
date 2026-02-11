import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useSidebar } from '../../context/SidebarContext';
import Sidebar from '../../components/Sidebar';
import MeasurementCaptainSidebar from '../../components/MeasurementCaptainSidebar';
import Navbar from '../../components/Navbar';
import { ArrowLeft, FileText, Calendar, User, Package, Printer, CheckCircle, Edit } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
// @ts-ignore
import 'jspdf-autotable';

type MeasurementItem = {
  [key: string]: any;
};

type Measurement = {
  id: number;
  measurement_type: string;
  measurement_number: string;
  party_name: string | null;
  party_id: number | null;
  thickness: string | null;
  measurement_date: string | null;
  items: MeasurementItem[] | string;
  notes: string | null;
  approval_status?: string;
  created_at: string;
  updated_at: string | null;
};

export default function ViewMeasurement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isCollapsed, isHovered } = useSidebar();
  const { currentUser } = useAuth();
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const backPath = currentUser?.role === 'measurement_captain'
    ? '/measurement-captain/measurements'
    : '/measurements';

  useEffect(() => {
    if (id) {
      loadMeasurement();
    }
  }, [id]);

  const loadMeasurement = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get(`/production/measurements/${id}`, true);
      setMeasurement(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load measurement');
    } finally {
      setLoading(false);
    }
  };

  const getMeasurementTypeLabel = (type: string): string => {
    const labels: { [key: string]: string } = {
      frame_sample: 'Sample Frame',
      shutter_sample: 'Sample Shutter',
      regular_frame: 'Regular Frame',
      regular_shutter: 'Regular Shutter',
    };
    return labels[type] || type;
  };

  const getFieldLabel = (field: string, measurementType?: string): string => {
    // Conditional labels based on measurement type
    if (field === 'act_width' && measurementType && (measurementType === 'shutter_sample' || measurementType === 'regular_shutter')) {
      return 'Act Width (inch)';
    }
    if (field === 'act_height' && measurementType && (measurementType === 'shutter_sample' || measurementType === 'regular_shutter')) {
      return 'Act Height (inch)';
    }
    if (field === 'act_width' && measurementType && (measurementType === 'frame_sample' || measurementType === 'regular_frame')) {
      return 'ACT Width (MM)';
    }
    if (field === 'act_height' && measurementType && (measurementType === 'frame_sample' || measurementType === 'regular_frame')) {
      return 'ACT Height (MM)';
    }

    const labels: { [key: string]: string } = {
      sr_no: 'Sr No',
      location_of_fitting: 'Location of Fitting',
      location: 'Location',
      hinges: 'Hinges',
      bldg: 'BLDG/Wings',
      flat_no: 'Flat No',
      area: 'Area',
      act_width: 'Act Width',
      act_height: 'Act Height',
      wall: 'WALL',
      subframe_side: 'Subframe Side',
      sub_frame: 'Sub Frame',
      h: 'H',
      w: 'W',
      qty: 'QTY',
      width: 'Width',
      height: 'Height',
      minus_width: 'Act Width(mm)',
      minus_height: 'Act Height (mm)',
      weidth: 'Weidth',
      colum: 'Column',
      heigh: 'Heigh',
      column3: 'Column3',
      column4: 'Column4',
      remark: 'Remark',
      ro_width: 'ro_width',
      ro_height: 'ro_height',
      act_sq_ft: 'act_sq_ft',
    };
    return labels[field] || field;
  };

  // Preferred column order for Measurement Items table
  const MEASUREMENT_ITEMS_COLUMN_ORDER = [
    'sr_no',
    'bldg',
    'location',
    'flat_no',
    'area',
    'width',
    'height',
    'minus_width',
    'minus_height',
    'act_width',
    'act_height',
    'ro_width',
    'ro_height',
    'act_sq_ft',
  ];

  const getItems = (): MeasurementItem[] => {
    if (!measurement) return [];
    if (Array.isArray(measurement.items)) {
      return measurement.items;
    }
    if (typeof measurement.items === 'string') {
      try {
        const parsed = JSON.parse(measurement.items);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const getFieldsFromItems = (items: MeasurementItem[]): string[] => {
    if (items.length === 0) return [];
    const allFields = new Set<string>();
    items.forEach(item => {
      Object.keys(item).forEach(key => {
        if (item[key] !== null && item[key] !== undefined && item[key] !== '') {
          allFields.add(key);
        }
      });
    });
    // Use preferred column order; include only fields that exist in data, then append any extras
    const ordered: string[] = [];
    for (const key of MEASUREMENT_ITEMS_COLUMN_ORDER) {
      if (allFields.has(key)) {
        ordered.push(key);
        allFields.delete(key);
      }
    }
    const remaining = Array.from(allFields);
    remaining.sort((a, b) => a.localeCompare(b));
    return [...ordered, ...remaining];
  };

  const generatePDF = () => {
    try {
      if (!measurement) {
        alert('No measurement data available');
        return;
      }

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 0;

      // Professional Header Bar
      doc.setDrawColor(66, 139, 202);
      doc.setFillColor(66, 139, 202);
      doc.rect(0, 0, pageWidth, 30, 'F');

      // Add a subtle border line below header
      doc.setDrawColor(50, 120, 180);
      doc.setLineWidth(0.5);
      doc.line(0, 30, pageWidth, 30);

      // Company Header - White text on blue background
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Production Documentation Management System', pageWidth / 2, 12, { align: 'center' });

      // Subtitle
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('MEASUREMENT PAPER', pageWidth / 2, 20, { align: 'center' });

      // Add decorative line below header
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.3);
      doc.line(20, 25, pageWidth - 20, 25);

      yPosition = 35;
      doc.setTextColor(0, 0, 0);

      // Measurement Information Section with border
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(10, yPosition, pageWidth - 20, 50, 3, 3, 'FD');

      yPosition += 8;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Measurement Information', 15, yPosition);
      yPosition += 10;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const infoData = [
        ['Measurement Number:', measurement.measurement_number || '-'],
        ['Type:', getMeasurementTypeLabel(measurement.measurement_type)],
        ['Party Name:', measurement.party_name || '-'],
        ['Thickness:', measurement.thickness || '-'],
        ['Measurement Date:', measurement.measurement_date ? new Date(measurement.measurement_date).toLocaleString() : '-'],
        ['Created At:', new Date(measurement.created_at).toLocaleString()],
      ];

      infoData.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 15, yPosition);
        doc.setFont('helvetica', 'normal');
        const maxWidth = pageWidth - 80;
        const splitValue = doc.splitTextToSize(value || '-', maxWidth);
        doc.text(splitValue, 70, yPosition);
        yPosition += Math.max(6, splitValue.length * 6);
      });

      yPosition += 5;

      // Notes Section
      if (measurement.notes) {
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(10, yPosition, pageWidth - 20, 30, 3, 3, 'FD');
        yPosition += 8;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Notes:', 15, yPosition);
        yPosition += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const splitNotes = doc.splitTextToSize(measurement.notes, pageWidth - 30);
        doc.text(splitNotes, 15, yPosition);
        yPosition += splitNotes.length * 5 + 10;
      } else {
        yPosition += 5;
      }

      // Measurement Items Table
      const items = getItems();
      const fields = getFieldsFromItems(items);

      if (items.length > 0) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`Measurement Items (${items.length})`, 15, yPosition);
        yPosition += 8;

        // Prepare table data
        const tableData = items.map((item, index) => {
          return fields.map(field => {
            const value = item[field];
            if (field === 'sr_no') {
              return value || (index + 1).toString();
            }
            if (value === null || value === undefined || value === '') {
              return '-';
            }
            return String(value);
          });
        });

        const tableHeaders = fields.map(field => getFieldLabel(field, measurement?.measurement_type));

        // Add table with autoTable
        (doc as any).autoTable({
          head: [tableHeaders],
          body: tableData,
          startY: yPosition,
          styles: {
            fontSize: 7,
            cellPadding: 2,
            overflow: 'linebreak',
            cellWidth: 'wrap',
          },
          headStyles: {
            fillColor: [66, 139, 202],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
          },
          alternateRowStyles: {
            fillColor: [245, 247, 250],
          },
          columnStyles: {
            0: { halign: 'center', cellWidth: 15 }, // SR NO
          },
          margin: { left: 10, right: 10, top: yPosition },
          didDrawPage: function (data: any) {
            // Footer on each page
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100, 100, 100);
            doc.text(
              `Page ${data.pageNumber}`,
              pageWidth / 2,
              pageHeight - 10,
              { align: 'center' }
            );
            doc.setTextColor(0, 0, 0);
          },
        });

        const finalY = (doc as any).lastAutoTable?.finalY || yPosition;
        yPosition = finalY + 10;
      }

      // Footer
      yPosition = pageHeight - 20;
      doc.setDrawColor(200, 200, 200);
      doc.line(10, yPosition, pageWidth - 10, yPosition);
      yPosition += 5;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Generated on: ${new Date().toLocaleString()}`,
        pageWidth / 2,
        yPosition,
        { align: 'center' }
      );

      // Save PDF
      const fileName = `Measurement_${measurement.measurement_number}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF: ' + (error.message || 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <MeasurementCaptainSidebar />
        <Navbar />
        <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'md:ml-20' : 'md:ml-64'} ml-0 pt-16`}>
          <main className="p-4 md:p-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !measurement) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <MeasurementCaptainSidebar />
        <Navbar />
        <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'md:ml-20' : 'md:ml-64'} ml-0 pt-16`}>
          <main className="p-4 md:p-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error || 'Measurement not found'}
            </div>
            <Link
              to={backPath}
              className="text-blue-600 hover:text-blue-700"
            >
              ← Back to Measurements
            </Link>
          </main>
        </div>
      </div>
    );
  }

  const items = getItems();
  const fields = getFieldsFromItems(items);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <MeasurementCaptainSidebar />
      <Navbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'md:ml-20' : 'md:ml-64'} ml-0 pt-16`}>
        <main className="p-4 md:p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigate(backPath)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Measurements
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/measurements/${id}/edit`)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm hover:shadow-md"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={generatePDF}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  Print Measurement Paper
                </button>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">View Measurement</h1>
            <p className="text-gray-600 mt-2">Measurement details and items</p>
          </div>

          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Measurement Information</h2>
            </div>
            <div className="p-6 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Measurement Number</p>
                  <p className="text-lg font-semibold text-gray-900">{measurement.measurement_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="text-lg font-semibold text-gray-900">{getMeasurementTypeLabel(measurement.measurement_type)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Party Name</p>
                  <p className="text-lg font-semibold text-gray-900">{measurement.party_name || '-'}</p>
                </div>
              </div>
              {measurement.thickness && (
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Thickness</p>
                    <p className="text-lg font-semibold text-gray-900">{measurement.thickness}</p>
                  </div>
                </div>
              )}
              {measurement.measurement_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Measurement Date</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(measurement.measurement_date).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Created At</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(measurement.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            {measurement.notes && (
              <div className="p-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Notes</p>
                <p className="text-gray-900 whitespace-pre-wrap">{measurement.notes}</p>
              </div>
            )}
          </div>

          {/* Measurement Items Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Measurement Items ({items.length})</h2>
            </div>
            {items.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No measurement items found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {fields.map((field) => (
                        <th
                          key={field}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {getFieldLabel(field, measurement?.measurement_type)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {fields.map((field) => (
                          <td key={field} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {field === 'sr_no' ? (
                              <span className="inline-flex items-center justify-center w-10 h-8 rounded-md bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-200">
                                {item[field] || index + 1}
                              </span>
                            ) : (
                              item[field] || '-'
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Approve Button Section - Only show for Production Managers when measurement is not approved */}
          {currentUser?.role === 'production_manager' && measurement.approval_status !== 'approved' && (
            <div className="bg-white rounded-lg shadow mt-6 p-6">
              <div className="flex items-center justify-center">
                <button
                  onClick={async () => {
                    if (!window.confirm('Are you sure you want to approve this measurement paper?')) {
                      return;
                    }
                    try {
                      await api.post(`/production/measurements/${measurement.id}/approve`, {}, true);
                      alert('Measurement paper approved successfully!');
                      loadMeasurement(); // Reload to update the status
                    } catch (err: any) {
                      alert(err.response?.data?.detail || err.message || 'Failed to approve measurement paper');
                    }
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm hover:shadow-md font-medium"
                  title="Approve this measurement paper"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
