import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Ruler,
    ClipboardList,
    History as HistoryIcon,
    User as UserIcon
} from 'lucide-react';

export default function MeasurementCaptainBottomNav() {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

    const navItems = [
        { path: '/measurement-captain/dashboard', label: 'Home', icon: LayoutDashboard },
        { path: '/measurement-captain/tasks', label: 'Tasks', icon: ClipboardList },
        { path: '/measurement-captain/measurements', label: 'Measure', icon: Ruler },
        { path: '/measurement-captain/history', label: 'History', icon: HistoryIcon },
        { path: '/profile', label: 'Profile', icon: UserIcon },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Icon className={`w-6 h-6 ${active ? 'fill-current' : ''}`} strokeWidth={active ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
