import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { 
  LayoutDashboard, 
  Building2,
  Home,
  Ruler,
  Wrench,
  DoorOpen,
  FileText,
  AlertTriangle,
  Camera,
  BarChart3,
  LogOut,
  ChevronDown,
  ChevronRight,
  User as UserIcon
} from 'lucide-react';

export default function SiteSupervisorSidebar() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const { isCollapsed, isHovered, setIsHovered } = useSidebar();
  const [expandedSubmenus, setExpandedSubmenus] = useState<Set<string>>(new Set());
  
  // Force icons to have no transition
  useEffect(() => {
    const icons = document.querySelectorAll('[data-icon-fixed]');
    icons.forEach((icon) => {
      (icon as HTMLElement).style.transition = 'none';
    });
  }, [isCollapsed, isHovered]);
  
  // Show expanded content when collapsed and hovered
  const showExpanded = !isCollapsed || isHovered;

  // Collapse all submenus when sidebar collapses
  useEffect(() => {
    if (isCollapsed && !isHovered) {
      setExpandedSubmenus(new Set());
    }
  }, [isCollapsed, isHovered]);

  const toggleSubmenu = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedSubmenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const isActive = (path: string) => location.pathname === path;

  // Only show site supervisor menu for site_supervisor role
  if (currentUser?.role !== 'site_supervisor') {
    return null;
  }

  const menuItems = [
    { path: '/site-supervisor/dashboard', label: 'Site Dashboard', icon: LayoutDashboard },
    { 
      path: '/site-supervisor/sites', 
      label: 'Project / Site List', 
      icon: Building2
    },
    { 
      path: '/site-supervisor/flats', 
      label: 'Flat-wise Door & Frame Register', 
      icon: Home
    },
    { 
      path: '/site-supervisor/measurements', 
      label: 'Measurement & Requirement Entry', 
      icon: Ruler,
      submenu: [
        { path: '/site-supervisor/measurements/create', label: 'Create Measurement' },
        { path: '/site-supervisor/measurements', label: 'View Measurements' },
      ]
    },
    { 
      path: '/site-supervisor/frame-fixing', 
      label: 'Frame Fixing Status', 
      icon: Wrench
    },
    { 
      path: '/site-supervisor/door-fixing', 
      label: 'Door Fixing Status', 
      icon: DoorOpen
    },
    { 
      path: '/site-supervisor/daily-progress', 
      label: 'Daily Site Progress Report (DSP)', 
      icon: FileText,
      submenu: [
        { path: '/site-supervisor/daily-progress/create', label: 'Create DSP' },
        { path: '/site-supervisor/daily-progress', label: 'View DSP Reports' },
      ]
    },
    { 
      path: '/site-supervisor/issues', 
      label: 'Issues & Constraints', 
      icon: AlertTriangle
    },
    { 
      path: '/site-supervisor/photos', 
      label: 'Photos & Attachments', 
      icon: Camera
    },
    { 
      path: '/site-supervisor/reports', 
      label: 'Reports', 
      icon: BarChart3
    },
    { path: '/profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <div 
      className={`fixed left-0 bg-gray-900 text-white shadow-lg transition-all duration-300 ease-in-out z-50 rounded-r-2xl ${
        isCollapsed && !isHovered ? 'w-20' : 'w-64'
      }`}
      style={{ top: '64px', height: 'calc(100vh - 64px)' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <nav className="px-2 pt-2" style={{ position: 'relative' }}>
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const hasSubmenu = !!item.submenu;
          const isSubmenuExpanded = expandedSubmenus.has(item.path);
          
          return (
            <div 
              key={item.path} 
              className="mb-1"
            >
              <div className="flex items-center group" style={{ minHeight: '48px', position: 'relative' }}>
                <Link
                  to={item.path}
                  className={`flex items-center flex-1 py-3 text-sm font-medium relative rounded-lg overflow-hidden whitespace-nowrap ${
                    isCollapsed && !isHovered ? 'px-0' : 'px-6'
                  } ${
                    isActive(item.path)
                      ? (isCollapsed && !isHovered)
                        ? 'bg-white text-gray-900 shadow-none'
                        : 'bg-white text-gray-900'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                  style={{
                    justifyContent: isCollapsed && !isHovered ? 'center' : 'flex-start',
                    transition: 'background-color 300ms ease-in-out, color 300ms ease-in-out'
                  }}
                  title={isCollapsed && !isHovered ? item.label : ''}
                >
                  <IconComponent 
                    className={`flex-shrink-0 w-5 h-5 ${isActive(item.path) ? 'text-gray-900' : ''}`}
                    data-icon-fixed
                    style={{
                      position: isCollapsed && !isHovered ? 'static' : 'absolute',
                      left: isCollapsed && !isHovered ? 'auto' : '24px',
                      top: isCollapsed && !isHovered ? 'auto' : '50%',
                      transform: isCollapsed && !isHovered ? 'none' : 'translateY(-50%)',
                      margin: 0,
                      padding: 0,
                      transition: 'none'
                    }}
                  />
                  <span className={`transition-all duration-300 ease-in-out whitespace-nowrap ${
                    showExpanded 
                      ? 'opacity-100 max-w-full' 
                      : 'opacity-0 max-w-0 overflow-hidden'
                  }`}
                  style={{
                    marginLeft: isCollapsed && !isHovered ? '0' : '36px'
                  }}
                  >
                    {item.label}
                  </span>
                  {isCollapsed && !isHovered && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg">
                      {item.label}
                    </div>
                  )}
                </Link>
                {hasSubmenu && (
                  <button
                    onClick={(e) => toggleSubmenu(item.path, e)}
                    className={`px-2 py-3 transition-all duration-300 ease-in-out hover:bg-gray-800 rounded-r-md ${
                      showExpanded 
                        ? 'opacity-100 max-w-full' 
                        : 'opacity-0 max-w-0 overflow-hidden w-0 p-0'
                    }`}
                  >
                    {isSubmenuExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-300" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    )}
                  </button>
                )}
              </div>
              {hasSubmenu && isSubmenuExpanded && showExpanded && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.submenu?.map((subItem) => (
                    <Link
                      key={subItem.path}
                      to={subItem.path}
                      className={`block py-2 px-6 text-sm rounded-md transition-colors ${
                        isActive(subItem.path)
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
        <div className={`flex items-center justify-between mb-3 transition-all duration-300 ease-in-out ${
          showExpanded 
            ? 'opacity-100 max-w-full' 
            : 'opacity-0 max-w-0 mb-0 overflow-hidden'
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
          className={`w-full px-4 py-2 text-sm font-medium text-red-600 bg-white rounded-md hover:bg-gray-100 transition-all duration-300 ease-in-out flex items-center justify-center ${
            isCollapsed && !isHovered ? 'px-2' : ''
          }`}
          title={isCollapsed && !isHovered ? 'Logout' : ''}
        >
          <LogOut className={`transition-all duration-300 ease-in-out text-red-600 ${isCollapsed && !isHovered ? 'w-5 h-5' : 'w-4 h-4 mr-2'}`} />
          <span className={`transition-all duration-300 ease-in-out text-red-600 ${
            showExpanded 
              ? 'opacity-100 max-w-full ml-2' 
              : 'opacity-0 max-w-0 ml-0 overflow-hidden'
          }`}>
          Logout
          </span>
        </button>
      </div>
    </div>
  );
}

