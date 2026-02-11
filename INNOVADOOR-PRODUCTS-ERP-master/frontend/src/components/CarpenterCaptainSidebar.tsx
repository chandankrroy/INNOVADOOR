import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { 
  LayoutDashboard, 
  Building2,
  ClipboardList,
  Hammer,
  DoorOpen,
  Users,
  AlertCircle,
  Camera,
  FileCheck,
  BarChart3,
  User as UserIcon,
  LogOut
} from 'lucide-react';

export default function CarpenterCaptainSidebar() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const { isCollapsed, isHovered, setIsHovered } = useSidebar();
  const [expandedSubmenus, setExpandedSubmenus] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    const icons = document.querySelectorAll('[data-icon-fixed]');
    icons.forEach((icon) => {
      (icon as HTMLElement).style.transition = 'none';
    });
  }, [isCollapsed, isHovered]);
  
  const showExpanded = !isCollapsed || isHovered;

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

  if (currentUser?.role !== 'carpenter_captain') {
    return null;
  }

  const menuItems = [
    { path: '/carpenter/dashboard', label: 'Captain Dashboard', icon: LayoutDashboard },
    { path: '/carpenter/assigned-site', label: 'Assigned Site & Wing', icon: Building2 },
    { path: '/carpenter/work-allocation', label: 'Daily Work Allocation', icon: ClipboardList },
    { path: '/carpenter/door-fixing', label: 'Door Fixing Record', icon: DoorOpen },
    { path: '/carpenter/frame-fixing', label: 'Frame Fixing Record', icon: Hammer },
    { path: '/carpenter/attendance', label: 'Carpenter Attendance', icon: Users },
    { path: '/carpenter/issues', label: 'Issues & Constraints', icon: AlertCircle },
    { path: '/carpenter/photos', label: 'Photos & Proof', icon: Camera },
    { path: '/carpenter/work-completion', label: 'Work Completion Summary', icon: FileCheck },
    { path: '/carpenter/reports', label: 'Reports', icon: BarChart3 },
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
                    }}
                  />
                  {(showExpanded) && (
                    <span 
                      className="ml-10"
                      style={{
                        opacity: isCollapsed && !isHovered ? 0 : 1,
                        transition: 'opacity 300ms ease-in-out'
                      }}
                    >
                      {item.label}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          );
        })}
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
        <button
          onClick={logout}
          className={`flex items-center w-full py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors ${
            isCollapsed && !isHovered ? 'justify-center px-0' : 'px-6'
          }`}
          title={isCollapsed && !isHovered ? 'Logout' : ''}
        >
          <LogOut className="w-5 h-5" />
          {(showExpanded) && (
            <span 
              className="ml-3"
              style={{
                opacity: isCollapsed && !isHovered ? 0 : 1,
                transition: 'opacity 300ms ease-in-out'
              }}
            >
              Logout
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

