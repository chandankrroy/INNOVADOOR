import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import {
  LayoutDashboard,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  LogOut,
  User as UserIcon,
  PlayCircle,
  Eye,
  Wrench,
  Flag
} from 'lucide-react';

export default function SupervisorSidebar() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const { isCollapsed, isHovered, setIsHovered, isMobileOpen, setIsMobileOpen } = useSidebar();

  // Force icons to have no transition
  useEffect(() => {
    const icons = document.querySelectorAll('[data-icon-fixed]');
    icons.forEach((icon) => {
      (icon as HTMLElement).style.transition = 'none';
    });
  }, [isCollapsed, isHovered]);

  // Show expanded content when collapsed and hovered
  const showExpanded = !isCollapsed || isHovered;

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      setIsMobileOpen(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  // Only show supervisor menu for production_supervisor role
  if (currentUser?.role !== 'production_supervisor') {
    return null;
  }

  const menuItems = [
    { path: '/supervisor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      path: '/supervisor/tasks/new',
      label: 'New Tasks',
      icon: PlayCircle
    },
    {
      path: '/supervisor/tasks',
      label: 'View Tasks',
      icon: Eye
    },
    {
      path: '/supervisor/tasks/wip',
      label: 'Work In Progress',
      icon: Wrench
    },
    {
      path: '/supervisor/tasks/completed',
      label: 'Completed Tasks',
      icon: CheckCircle2
    },
    {
      path: '/supervisor/issues/report',
      label: 'Report Issue',
      icon: AlertCircle
    },
    {
      path: '/supervisor/reports/summary',
      label: 'Report Summary',
      icon: BarChart3
    },
    {
      path: '/supervisor/issues',
      label: 'Issue Details',
      icon: Flag
    },
    { path: '/profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden glass-effect"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div
        className={`fixed left-0 bg-gray-900 text-white shadow-lg transition-all duration-300 ease-in-out z-50 md:rounded-r-2xl
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${(isCollapsed && !isHovered) ? 'md:w-20' : 'md:w-64'}
          w-64
        `}
        style={{ top: '64px', height: 'calc(100vh - 64px)' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <nav className="px-2 pt-2" style={{ position: 'relative' }}>
          {menuItems.map((item) => {
            const IconComponent = item.icon;

            return (
              <div
                key={item.path}
                className="mb-1"
              >
                <div className="flex items-center group" style={{ minHeight: '48px', position: 'relative' }}>
                  <Link
                    to={item.path}
                    onClick={handleLinkClick}
                    className={`flex items-center flex-1 py-3 text-sm font-medium relative rounded-lg overflow-hidden whitespace-nowrap justify-start ${isCollapsed && !isHovered ? 'md:px-0 px-6 md:justify-center' : 'px-6 md:justify-start'
                      } ${isActive(item.path)
                        ? (isCollapsed && !isHovered)
                          ? 'md:bg-white md:text-gray-900 md:shadow-none bg-white text-gray-900'
                          : 'bg-white text-gray-900'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    style={{
                      transition: 'background-color 300ms ease-in-out, color 300ms ease-in-out'
                    }}
                    title={isCollapsed && !isHovered ? item.label : ''}
                  >
                    <IconComponent
                      className={`flex-shrink-0 w-5 h-5 ${isActive(item.path) ? 'text-gray-900' : ''} transition-none absolute left-6 top-1/2 -translate-y-1/2 ${isCollapsed && !isHovered ? 'md:static md:translate-y-0 md:left-auto' : ''
                        }`}
                    />
                    <span className={`transition-all duration-300 ease-in-out whitespace-nowrap ml-9 ${showExpanded
                      ? 'opacity-100 max-w-full'
                      : 'md:opacity-0 md:max-w-0 md:overflow-hidden opacity-100 max-w-full'
                      }`}
                    >
                      {item.label}
                    </span>
                    {isCollapsed && !isHovered && (
                      <div className="hidden md:block absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                        {item.label}
                      </div>
                    )}
                  </Link>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
          <div className={`flex items-center justify-between mb-3 transition-all duration-300 ease-in-out ${showExpanded
            ? 'opacity-100 max-w-full'
            : 'md:opacity-0 md:max-w-0 md:mb-0 md:overflow-hidden opacity-100 max-w-full'
            }`}>
            <div className="flex items-center space-x-3">
              {currentUser?.profile_image ? (
                <img
                  src={currentUser.profile_image}
                  alt={currentUser.username}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-600"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center border-2 border-gray-600">
                  <UserIcon className="w-5 h-5 text-gray-300" />
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase mb-1">{currentUser?.role || 'user'}</p>
                <p className="text-sm font-medium text-white">{currentUser?.username}</p>
                <p className="text-xs text-gray-400">{currentUser?.email}</p>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className={`w-full px-4 py-2 text-sm font-medium text-red-600 bg-white rounded-md hover:bg-gray-100 transition-all duration-300 ease-in-out flex items-center justify-center ${isCollapsed && !isHovered ? 'md:px-2' : ''
              }`}
            title={isCollapsed && !isHovered ? 'Logout' : ''}
          >
            <LogOut className={`transition-all duration-300 ease-in-out text-red-600 ${isCollapsed && !isHovered ? 'md:w-5 md:h-5' : 'w-4 h-4 mr-2'}`} />
            <span className={`transition-all duration-300 ease-in-out text-red-600 ${showExpanded
              ? 'opacity-100 max-w-full ml-2'
              : 'md:opacity-0 md:max-w-0 md:ml-0 md:overflow-hidden opacity-100 max-w-full ml-2'
              }`}>
              Logout
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
