import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { User as UserIcon, Users, Menu, X } from 'lucide-react';

export default function SupervisorNavbar() {
  const { currentUser } = useAuth();
  const { isMobileOpen, setIsMobileOpen } = useSidebar();

  if (currentUser?.role !== 'production_supervisor') {
    return null;
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-40"
    >
      <div className="w-full px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2 md:space-x-3">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 focus:outline-none hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMobileOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            {/* Gradient Logo */}
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 truncate max-w-[200px] md:max-w-none">
              Production Supervisors
            </h1>
          </div>
          <div className="flex items-center justify-end flex-1 md:mr-4">
            <div className="flex items-center space-x-3 px-2 py-1 md:px-4 md:py-2 my-2 bg-sky-100 rounded-xl border border-sky-200">
              {currentUser?.profile_image ? (
                <img
                  src={currentUser.profile_image}
                  alt={currentUser.username}
                  className="w-8 h-8 rounded-full object-cover border-2 border-sky-300"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-sky-200 flex items-center justify-center border-2 border-sky-300">
                  <UserIcon className="w-4 h-4 text-sky-700" />
                </div>
              )}
              <div className="hidden md:block text-sm text-gray-600">
                <div className="font-medium">{currentUser?.username}</div>
                <div className="text-xs font-medium text-gray-500 uppercase">{currentUser?.role || 'user'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

