import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  TrendingUp,
  HardHat,
  Ruler,
  Hammer,
  FileText,
  Package,
  Settings,
  CheckCircle,
  Users,
  Lock,
  BarChart3,
  Briefcase,
  Layers,
  Wrench,
  ShoppingCart,
  PenTool,
  Calculator,
  CircuitBoard,
  Info
} from 'lucide-react';
import logo from '../../assets/innovadoor-logo.png';

interface Role {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  roleKey: string;
}

const roles: Role[] = [
  { id: 'admin', name: 'Admin', icon: Shield, roleKey: 'admin' },
  { id: 'sales-marketing', name: 'Sales & Marketing', icon: TrendingUp, roleKey: 'sales_manager' },
  { id: 'site-supervisor', name: 'Site Supervisor', icon: HardHat, roleKey: 'site_supervisor' },
  { id: 'measurement-captain', name: 'Measurement Captain', icon: Ruler, roleKey: 'measurement_captain' },
  { id: 'carpenter-captain', name: 'Carpenter Captain', icon: Hammer, roleKey: 'carpenter_captain' },
  { id: 'production-docs', name: 'Production Docs', icon: FileText, roleKey: 'production_manager' },
  { id: 'raw-material-checker', name: 'Raw Material Checker', icon: Package, roleKey: 'raw_material_checker' },
  { id: 'production-supervisor', name: 'Production Supervisor', icon: Settings, roleKey: 'production_supervisor' },
  { id: 'quality-control', name: 'Quality Control', icon: CheckCircle, roleKey: 'quality_checker' },
  { id: 'hr', name: 'HR', icon: Users, roleKey: 'hr' },
  { id: 'security', name: 'Security', icon: Lock, roleKey: 'security' },
  { id: 'report-analytics', name: 'Report & Analytics', icon: BarChart3, roleKey: 'admin' },
  { id: 'contractor', name: 'Contractor', icon: Briefcase, roleKey: 'contractor' },
  { id: 'laminate-veneer', name: 'Laminate & Veneer', icon: Layers, roleKey: 'laminate_veneer' },
  { id: 'maintenance-captain', name: 'Maintenance Captain', icon: Wrench, roleKey: 'maintenance_captain' },
  { id: 'purchase-management', name: 'Purchase Management', icon: ShoppingCart, roleKey: 'purchase_manager' },
  { id: 'repair', name: 'Repair', icon: PenTool, roleKey: 'repair' },
  { id: 'accounts', name: 'Accounts', icon: Calculator, roleKey: 'accounts_manager' },
  { id: 'hardware', name: 'Hardware', icon: CircuitBoard, roleKey: 'hardware' },
  { id: 'product-info', name: 'Product Info', icon: Info, roleKey: 'product_info' },
];

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRoleClick = (role: Role) => {
    setSelectedRole(role.id);
    // Store selected role in localStorage to use in login
    localStorage.setItem('selected_role', role.roleKey);
    // Navigate to login page
    navigate('/login', { state: { selectedRole: role.name } });
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Watermark */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5"
        style={{
          backgroundImage: `url(${logo})`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: '50%',
        }}
      />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <h1 className="text-center text-3xl font-bold text-white mb-12">
          Select your role to continue
        </h1>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            
            return (
              <button
                key={role.id}
                onClick={() => handleRoleClick(role)}
                className={`
                  relative bg-gray-800 rounded-lg p-6 
                  border-2 transition-all duration-200 
                  hover:border-blue-400 hover:bg-gray-700
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
                  ${isSelected ? 'border-blue-400 bg-gray-700' : 'border-gray-700'}
                `}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`
                    p-3 rounded-lg
                    ${isSelected ? 'bg-blue-500' : 'bg-blue-600'}
                  `}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-1">
                      {role.name}
                    </h3>
                    <p className="text-gray-400 text-xs">
                      Click to login
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

