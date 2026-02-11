import { useAuth } from '../context/AuthContext';
import { User as UserIcon } from 'lucide-react';

export default function ProductionSchedulerNavbar() {
  const { currentUser } = useAuth();

  if (currentUser?.role !== 'production_scheduler') {
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
            <div className="flex items-center justify-center w-10 h-10 ml-2 rounded-lg bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 shadow-lg">
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              Production Scheduler
            </h1>
          </div>
          <div className="flex items-center justify-end flex-1 mr-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg">
                {currentUser?.profile_image ? (
                  <img 
                    src={currentUser.profile_image} 
                    alt={currentUser.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-gray-600" />
                  </div>
                )}
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{currentUser?.username}</p>
                  <p className="text-xs text-gray-500">Production Scheduler</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}










