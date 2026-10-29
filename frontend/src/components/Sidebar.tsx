import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BedDouble, 
  Users, 
  CalendarDays, 
  CheckSquare, 
  Receipt, 
  CreditCard, 
  Wallet, 
  BarChart3, 
  Settings,
  Shield
} from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Rooms', path: '/rooms', icon: BedDouble },
  { name: 'Guests', path: '/guests', icon: Users },
  { name: 'Bookings', path: '/bookings', icon: CalendarDays },
  { name: 'Check-in/out', path: '/check-in-out', icon: CheckSquare },
  { name: 'Billing', path: '/billing', icon: Receipt },
  { name: 'Payments', path: '/payments', icon: CreditCard },
  { name: 'Expenses', path: '/expenses', icon: Wallet },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Users', path: '/users', icon: Shield },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-sidebar text-slate-300 flex flex-col">
      <div className="h-16 flex items-center px-6 bg-slate-900 border-b border-slate-800">
        <span className="text-white font-bold text-lg tracking-wide">Dharamshala OS</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors',
                    isActive 
                      ? 'bg-primary-600 text-white' 
                      : 'hover:bg-slate-800 hover:text-white'
                  )
                }
              >
                <item.icon className="w-5 h-5 mr-3 shrink-0" />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
