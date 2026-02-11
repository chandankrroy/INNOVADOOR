import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useSidebar } from '../../context/SidebarContext';
import CarpenterCaptainSidebar from '../../components/CarpenterCaptainSidebar';
import Navbar from '../../components/Navbar';

export default function AssignedSite() {
  const { isCollapsed, isHovered } = useSidebar();
  const [siteData, setSiteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAssignedSite();
  }, []);

  const loadAssignedSite = async () => {
    try {
      setLoading(true);
      const data = await api.get('/carpenter/assigned-site');
      setSiteData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load assigned site');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CarpenterCaptainSidebar />
      <Navbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Assigned Site & Wing</h1>
            <p className="text-gray-600 mt-2">View your assigned site, wing, and flats</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">Loading site information...</p>
            </div>
          ) : siteData && siteData.site ? (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Site Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Project Name</p>
                    <p className="text-lg font-medium text-gray-900">{siteData.site.project_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="text-lg font-medium text-gray-900">{siteData.site.location || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Assigned Wings</p>
                    <p className="text-lg font-medium text-gray-900">
                      {siteData.site.assigned_wings && siteData.site.assigned_wings.length > 0
                        ? siteData.site.assigned_wings.join(', ')
                        : 'All Wings'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Flats</p>
                    <p className="text-lg font-medium text-gray-900">{siteData.site.total_flats || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Flats</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flat Number</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wing</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Floor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frame Fixed</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Door Fixed</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {siteData.flats.map((flat: any) => (
                        <tr key={flat.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {flat.flat_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{flat.wing}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{flat.floor}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {flat.frame_fixed ? (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Yes
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                No
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {flat.door_fixed ? (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Yes
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                No
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500 mb-4">{siteData?.message || "You have not been assigned to any site yet."}</p>
              <p className="text-sm text-gray-400">Please contact your administrator to get assigned to a site.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

