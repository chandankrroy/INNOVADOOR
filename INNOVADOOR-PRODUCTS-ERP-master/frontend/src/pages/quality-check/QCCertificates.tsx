import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import QualityCheckSidebar from '../../components/QualityCheckSidebar';
import QualityCheckNavbar from '../../components/QualityCheckNavbar';
import { api } from '../../lib/api';
import { FileText, Download } from 'lucide-react';

export default function QCCertificates() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      if (currentUser?.role === 'quality_checker') {
        try {
          setLoading(true);
          const data = await api.get('/quality-check/qc-certificates');
          setCertificates(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error('Error fetching certificates:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCertificates();
  }, [currentUser?.role]);

  if (currentUser?.role !== 'quality_checker') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20">
      <QualityCheckSidebar />
      <QualityCheckNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-green-800 to-emerald-800 bg-clip-text text-transparent">
              QC Certificates
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Quality check certificates</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Certificate Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Production Paper</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inspector</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center">Loading...</td>
                    </tr>
                  ) : certificates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No certificates found</td>
                    </tr>
                  ) : (
                    certificates.map((cert) => (
                      <tr key={cert.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{cert.certificate_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{cert.production_paper_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{cert.inspector_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {cert.inspection_date ? new Date(cert.inspection_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {cert.certificate_pdf_path && (
                            <button className="text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                              <Download className="w-4 h-4" />
                              <span>Download</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

