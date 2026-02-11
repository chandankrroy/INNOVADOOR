import { useAuth } from '../context/AuthContext';
import { User as UserIcon } from 'lucide-react';

export default function QualityCheckNavbar() {
  const { currentUser } = useAuth();

  if (currentUser?.role !== 'quality_checker') {
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
            <div className="flex items-center justify-center w-10 h-10 ml-2 rounded-lg bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 shadow-lg">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              Quality Check System
            </h1>
          </div>
          <div className="flex items-center justify-end flex-1 mr-4">
            <div className="flex items-center space-x-3 px-4 py-2 my-2 bg-green-100 rounded-xl border border-green-200">
              {currentUser?.profile_image ? (
                <img 
                  src={currentUser.profile_image} 
                  alt={currentUser.username}
                  className="w-8 h-8 rounded-full object-cover border-2 border-green-300"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center border-2 border-green-300">
                  <UserIcon className="w-4 h-4 text-green-700" />
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

