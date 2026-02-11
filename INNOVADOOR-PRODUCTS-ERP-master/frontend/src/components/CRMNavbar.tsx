import { useAuth } from '../context/AuthContext';
import { User as UserIcon } from 'lucide-react';

export default function CRMNavbar() {
  const { currentUser } = useAuth();

  if (currentUser?.role !== 'crm_manager') {
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              Production CRM
            </h1>
          </div>
          <div className="flex items-center justify-end flex-1 mr-4">
            <div className="flex items-center space-x-3 px-4 py-2 my-2 bg-indigo-100 rounded-xl border border-indigo-200">
              {currentUser?.profile_image ? (
                <img 
                  src={currentUser.profile_image} 
                  alt={currentUser.username}
                  className="w-8 h-8 rounded-full object-cover border-2 border-indigo-300"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center border-2 border-indigo-300">
                  <UserIcon className="w-4 h-4 text-indigo-700" />
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

