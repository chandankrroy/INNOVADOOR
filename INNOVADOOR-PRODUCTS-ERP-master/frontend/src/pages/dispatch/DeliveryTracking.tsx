import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import DispatchSidebar from '../../components/DispatchSidebar';
import Navbar from '../../components/Navbar';
import { api } from '../../lib/api';
import { MapPin, Truck } from 'lucide-react';

export default function DeliveryTracking() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();
  const [tracking, setTracking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracking = async () => {
      if (currentUser) {
        try {
          setLoading(true);
          const data = await api.get('/dispatch/delivery-tracking');
          setTracking(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error('Error fetching tracking:', error);
          setTracking([]);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTracking();
  }, [currentUser]);

  if (!currentUser || !['dispatch_executive', 'dispatch_supervisor', 'logistics_manager', 'admin'].includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <DispatchSidebar />
      <Navbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
              Delivery Tracking
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Track delivery status and updates</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Delivery Status</h2>
              </div>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : tracking.length === 0 ? (
                <div className="text-center py-12">
                  <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No delivery tracking records found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tracking.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-900">{item.dispatch_number}</p>
                          <p className="text-sm text-gray-600 mt-1">Status: {item.status}</p>
                          {item.delivered_date && (
                            <p className="text-sm text-gray-600">Delivered: {new Date(item.delivered_date).toLocaleString()}</p>
                          )}
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          item.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          item.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                          item.status === 'delayed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

