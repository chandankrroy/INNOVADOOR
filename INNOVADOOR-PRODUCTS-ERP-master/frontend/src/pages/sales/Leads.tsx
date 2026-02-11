import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSidebar } from '../../context/SidebarContext';
import SalesSidebar from '../../components/SalesSidebar';
import SalesNavbar from '../../components/SalesNavbar';
import { api } from '../../lib/api';

type Lead = {
  id: number;
  lead_number: string;
  lead_type: string;
  customer_name: string;
  contact_person: string | null;
  mobile: string | null;
  lead_status: string;
  created_at: string;
};

export default function Leads() {
  const { isCollapsed, isHovered } = useSidebar();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await api.get('/sales/leads');
      setLeads(data);
    } catch (err: any) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SalesSidebar />
      <SalesNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lead Management</h1>
              <p className="text-gray-600 mt-2">View and manage all leads</p>
            </div>
            <Link
              to="/sales/leads/create"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              + Create Lead
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow">
            {loading ? (
              <div className="p-8 text-center">Loading leads...</div>
            ) : leads.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">No leads found</p>
                <Link to="/sales/leads/create" className="text-green-600 hover:text-green-700">
                  Create your first lead
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leads.map((lead) => (
                      <tr key={lead.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lead.lead_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lead.customer_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.lead_type}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            lead.lead_status === 'Won' ? 'bg-green-100 text-green-800' :
                            lead.lead_status === 'Lost' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {lead.lead_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.mobile || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link to={`/sales/leads/${lead.id}`} className="text-green-600 hover:text-green-700">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

