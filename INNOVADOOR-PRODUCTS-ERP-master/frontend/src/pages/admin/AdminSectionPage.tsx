import AdminSidebar from '../../components/AdminSidebar';
import AdminNavbar from '../../components/AdminNavbar';
import { useSidebar } from '../../context/SidebarContext';
import { LucideIcon } from 'lucide-react';

interface AdminSectionPageProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export default function AdminSectionPage({ title, description, icon: Icon }: AdminSectionPageProps) {
  const { isCollapsed, isHovered } = useSidebar();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <AdminSidebar />
      <AdminNavbar />
      <div className={`transition-all duration-300 ${isCollapsed && !isHovered ? 'ml-20' : 'ml-64'} pt-16`}>
        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              {Icon && (
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  {title}
                </h1>
                <p className="text-gray-600 mt-2 text-lg">{description}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-12">
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 mb-6">
                  {Icon ? (
                    <Icon className="w-12 h-12 text-indigo-600" />
                  ) : (
                    <div className="w-12 h-12 bg-indigo-600 rounded-full"></div>
                  )}
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h2>
                <p className="text-gray-500 max-w-md mx-auto mb-4">{description}</p>
                <p className="text-sm text-gray-400">System settings for {title}. Configuration options will be added soon.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

