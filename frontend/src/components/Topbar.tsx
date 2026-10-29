import { Bell, UserCircle, LogOut } from 'lucide-react';
import { useAuth } from '../store/useAuth';

export default function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <div className="text-xl font-semibold text-slate-800">
        Overview
      </div>
      <div className="flex items-center space-x-4">
        <button className="text-slate-500 hover:text-slate-700 relative p-2 rounded-full hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <UserCircle className="w-8 h-8 text-slate-400" />
            <div className="hidden md:block text-sm text-left">
              <p className="font-medium text-slate-700 leading-none mb-1">{user?.username || 'Guest'}</p>
              <p className="text-xs text-slate-500 leading-none">{user?.role || 'User'}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="text-slate-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
