import { useAuth } from '../context/AuthContext';
import { User as UserIcon } from 'lucide-react';

export default function SalesNavbar() {
  const { currentUser } = useAuth();

  const salesRoles = ['marketing_executive', 'sales_executive', 'sales_manager', 'admin'];
  if (!currentUser || !salesRoles.includes(currentUser.role)) {
    return null;
  }

  return (
    <nav 
      className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-40"
    >
      <div className="w-full">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            {/* Gradient Logo */}
            <div className="flex items-center justify-center w-10 h-10 ml-2 rounded-lg bg-gradient-to-br from-green-600 via-teal-600 to-blue-600 shadow-lg">
              <svg 
                className="w-6 h-6 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              Sales & Marketing Management System
            </h1>
          </div>
          <div className="flex items-center justify-end flex-1 mr-4">
            <div className="flex items-center space-x-4">
              {currentUser?.profile_image ? (
                <img 
                  src={currentUser.profile_image} 
                  alt={currentUser.username}
                  className="w-8 h-8 rounded-full object-cover border-2 border-gray-300"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                  <UserIcon className="w-5 h-5 text-gray-600" />
                </div>
              )}
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{currentUser?.username}</p>
                <p className="text-xs text-gray-500 capitalize">{currentUser?.role?.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

