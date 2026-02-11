import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { 
  LayoutDashboard, 
  Users,
  Building2,
  BookOpen,
  Receipt,
  CreditCard,
  FileText,
  TrendingUp,
  RefreshCw,
  FileBarChart,
  LogOut,
  ChevronDown,
  ChevronRight,
  User as UserIcon,
  DollarSign,
  HandCoins,
  Calculator
} from 'lucide-react';

export default function AccountsSidebar() {
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

  const accountsRoles = ['accounts_manager', 'accounts_executive', 'finance_head', 'auditor', 'admin'];
  if (!currentUser || !accountsRoles.includes(currentUser.role)) {
    return null;
  }

  const menuItems = useMemo(() => [
    { path: '/accounts/dashboard', label: 'Accounts Dashboard', icon: LayoutDashboard },
    { 
      path: '/accounts/receivables', 
      label: 'Customer Receivables', 
      icon: Users,
    },
    { 
      path: '/accounts/payables', 
      label: 'Vendor Payables', 
      icon: Building2,
    },
    { 
      path: '/accounts/ledger', 
      label: 'Ledger Management', 
      icon: BookOpen,
      submenu: [
        { path: '/accounts/ledger/customer', label: 'Customer Ledger' },
        { path: '/accounts/ledger/vendor', label: 'Vendor Ledger' },
        { path: '/accounts/ledger/expense', label: 'Expense Ledger' },
        { path: '/accounts/ledger/asset', label: 'Asset Ledger' },
      ]
    },
    { 
      path: '/accounts/payments', 
      label: 'Payments & Receipts', 
      icon: Receipt,
      submenu: [
        { path: '/accounts/payments/receipts', label: 'Receipts' },
        { path: '/accounts/payments/payments', label: 'Payments' },
        { path: '/accounts/payments/create-receipt', label: 'Create Receipt' },
        { path: '/accounts/payments/create-payment', label: 'Create Payment' },
      ]
    },
    { 
      path: '/accounts/credit', 
      label: 'Credit Control', 
      icon: CreditCard,
    },
    { 
      path: '/accounts/tax', 
      label: 'Tax & GST', 
      icon: FileText,
      submenu: [
        { path: '/accounts/tax/gst-returns', label: 'GST Returns' },
        { path: '/accounts/tax/hsn-mapping', label: 'HSN Mapping' },
      ]
    },
    { 
      path: '/accounts/costing', 
      label: 'Costing & Profitability', 
      icon: Calculator,
      submenu: [
        { path: '/accounts/costing/order-wise', label: 'Order-wise Costing' },
        { path: '/accounts/costing/profitability', label: 'Profitability Reports' },
      ]
    },
    { 
      path: '/accounts/contractor', 
      label: 'Contractor Management', 
      icon: HandCoins,
      submenu: [
        { path: '/accounts/contractor/master', label: 'Contractor Master' },
        { path: '/accounts/contractor/output', label: 'Contractor Output' },
        { path: '/accounts/contractor/payments', label: 'Contractor Payments' },
      ]
    },
    { path: '/accounts/tally', label: 'Tally Integration', icon: RefreshCw },
    { path: '/accounts/reports', label: 'Financial Reports', icon: FileBarChart },
    { path: '/profile', label: 'Profile', icon: UserIcon },
  ], []);

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

  const isActive = (path: string) => {
    // Check exact match
    if (location.pathname === path) return true;
    // For parent items with submenus, check if any submenu item is active
    const menuItem = menuItems.find(item => item.path === path);
    if (menuItem?.submenu) {
      return menuItem.submenu.some(subItem => location.pathname === subItem.path);
    }
    return false;
  };

  // Auto-expand submenus if any submenu item is active
  useEffect(() => {
    const newExpanded = new Set<string>();
    menuItems.forEach(item => {
      if (item.submenu && item.submenu.some(subItem => location.pathname === subItem.path)) {
        newExpanded.add(item.path);
      }
    });
    if (newExpanded.size > 0) {
      setExpandedSubmenus(prev => new Set([...prev, ...newExpanded]));
    }
  }, [location.pathname, menuItems]);

  return (
    <div 
      className={`fixed left-0 bg-gray-900 text-white shadow-lg transition-all duration-300 ease-in-out z-50 rounded-r-2xl ${
        isCollapsed && !isHovered ? 'w-20' : 'w-64'
      }`}
      style={{ top: '64px', height: 'calc(100vh - 64px)' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <nav className="px-2 pt-2" style={{ position: 'relative', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
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
                {hasSubmenu ? (
                  <button
                    onClick={(e) => toggleSubmenu(item.path, e)}
                    className={`flex items-center flex-1 py-3 text-sm font-medium relative rounded-lg overflow-hidden whitespace-nowrap ${
                      isCollapsed && !isHovered ? 'px-0' : 'px-6'
                    } ${
                      isSubmenuExpanded
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                    style={{
                      justifyContent: isCollapsed && !isHovered ? 'center' : 'flex-start',
                      transition: 'background-color 300ms ease-in-out, color 300ms ease-in-out'
                    }}
                    title={isCollapsed && !isHovered ? item.label : ''}
                  >
                    <IconComponent 
                      className="flex-shrink-0 w-5 h-5"
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
                    {showExpanded && (
                      <div className="ml-auto">
                        {isSubmenuExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                    )}
                  </button>
                ) : (
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
                )}
              </div>
              {hasSubmenu && showExpanded && isSubmenuExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.submenu.map((subItem) => (
                    <Link
                      key={subItem.path}
                      to={subItem.path}
                      className={`block px-4 py-2 text-xs transition-all duration-300 ease-in-out rounded-md ${
                        isActive(subItem.path)
                          ? 'text-blue-400 font-semibold bg-blue-600/20'
                          : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
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

