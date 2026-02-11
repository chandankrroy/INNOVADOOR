import { useAuth } from '../context/AuthContext';
import { User as UserIcon } from 'lucide-react';

export default function AccountsNavbar() {
  const { currentUser } = useAuth();

  const accountsRoles = ['accounts_manager', 'accounts_executive', 'finance_head', 'auditor', 'admin'];
  if (!currentUser || !accountsRoles.includes(currentUser.role)) {
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
            <div className="flex items-center justify-center w-10 h-10 ml-2 rounded-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 shadow-lg">
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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              Accounts Control Panel
            </h1>
          </div>
          <div className="flex items-center justify-end flex-1 mr-4">
            <div className="flex items-center space-x-3 px-4 py-2 my-2 bg-sky-100 rounded-xl border border-sky-200">
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
              <div className="text-sm text-gray-600">
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

