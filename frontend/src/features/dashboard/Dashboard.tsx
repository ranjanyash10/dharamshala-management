import { Activity, DoorOpen, IndianRupee, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../store/useAuth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { API_BASE_URL } from '../../config/api';

export default function Dashboard() {
  const token = useAuth(state => state.token);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [stats, setStats] = useState({
    available_rooms: 0,
    occupied_rooms: 0,
    active_bookings: 0,
    reserved_rooms: 0,
    occupancy_rate: 0,
    today_revenue: 0,
    today_expenses: 0,
    monthly_revenue: 0,
    monthly_expenses: 0,
    chart_data: []
  });

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/v1/health`)
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'));

    if (token) {
      axios.get(`${API_BASE_URL}/api/v1/reports/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setStats(res.data))
      .catch(err => console.error("Failed to fetch dashboard stats", err));
    }
  }, [token]);

  const statCards = [
    { label: 'Available Rooms', value: stats.available_rooms.toString(), icon: DoorOpen, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Occupancy Rate', value: `${stats.occupancy_rate}%`, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Today Revenue', value: `₹${stats.today_revenue.toFixed(0)}`, icon: IndianRupee, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Today Expenses', value: `₹${stats.today_expenses.toFixed(0)}`, icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-100' },
  ];

  return (
    <div className="space-y-6">
      
      {apiStatus !== 'online' && (
        <div className={`p-4 rounded-lg flex items-center space-x-3 ${apiStatus === 'offline' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
          <Activity className={`w-5 h-5 ${apiStatus === 'checking' ? 'animate-pulse' : ''}`} />
          <div>
            <h3 className="font-semibold text-sm">System Status</h3>
            <p className="text-xs opacity-90">
              {apiStatus === 'offline' ? 'Connection Error - Check backend server' : 'Checking connection...'}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className={`p-4 rounded-xl ${stat.bg}`}>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-900 leading-none">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts & Monthly Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue vs Expenses (Last 7 Days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chart_data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(value) => `₹${value}`} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#e11d48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Monthly Overview</h3>
            <div className="space-y-6 mt-6">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Monthly Income</p>
                <p className="text-3xl font-bold text-emerald-600">₹{stats.monthly_revenue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Monthly Expenses</p>
                <p className="text-3xl font-bold text-rose-600">₹{stats.monthly_expenses.toFixed(2)}</p>
              </div>
              <div className="pt-6 border-t border-slate-200">
                <p className="text-sm font-medium text-slate-500 mb-1">Net Income (Month)</p>
                <p className={`text-3xl font-bold ${stats.monthly_revenue - stats.monthly_expenses >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                  ₹{(stats.monthly_revenue - stats.monthly_expenses).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
