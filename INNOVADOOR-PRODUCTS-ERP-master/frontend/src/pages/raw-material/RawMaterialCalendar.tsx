import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import RawMaterialSidebar from '../../components/RawMaterialSidebar';
import RawMaterialNavbar from '../../components/RawMaterialNavbar';
import { Calendar as CalendarIcon } from 'lucide-react';

export default function RawMaterialCalendar() {
  const { currentUser } = useAuth();
  const { isCollapsed, isHovered } = useSidebar();

  if (currentUser?.role !== 'raw_material_checker') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <RawMaterialSidebar />
      <RawMaterialNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
              Calendar
            </h1>
            <p className="text-gray-600 mt-2 text-lg">View and manage calendar events</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-6">
                <CalendarIcon className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Calendar View</h2>
              <p className="text-gray-500 max-w-md mx-auto">
                Calendar functionality will be available here. You can view scheduled checks, orders, and deliveries.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

