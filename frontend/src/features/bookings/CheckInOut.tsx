import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../store/useAuth';
import { LogIn, LogOut, CalendarDays, ArrowRight, UserCircle, Phone, BedDouble } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function CheckInOut() {
  const token = useAuth(state => state.token);
  const [arrivals, setArrivals] = useState<any[]>([]);
  const [departures, setDepartures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgenda = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/v1/bookings/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setArrivals(res.data.arrivals);
      setDepartures(res.data.departures);
    } catch (err) {
      console.error("Failed to load today's agenda", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgenda();
  }, [token]);

  const handleCheckIn = async (bookingId: number) => {
    try {
      await axios.post(`${API_BASE_URL}/api/v1/bookings/${bookingId}/check-in`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAgenda(); // Refresh lists
    } catch (err) {
      alert("Failed to check in guest.");
    }
  };

  const handleCheckOut = async (bookingId: number) => {
    if (window.confirm("Are you sure you want to check out this guest? Please ensure their bill is settled.")) {
      try {
        await axios.post(`${API_BASE_URL}/api/v1/bookings/${bookingId}/check-out`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchAgenda(); // Refresh lists
      } catch (err) {
        alert("Failed to check out guest.");
      }
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading today's agenda...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Check-in / Check-out</h1>
          <p className="text-slate-500 text-sm mt-1 flex items-center">
            <CalendarDays className="w-4 h-4 mr-1.5" /> Agenda for Today ({new Date().toLocaleDateString()})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Arrivals Column */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
          <div className="bg-emerald-50 border-b border-emerald-100 p-4 flex items-center justify-between">
            <h2 className="font-bold text-emerald-800 flex items-center text-lg">
              <LogIn className="w-5 h-5 mr-2 text-emerald-600" /> Expected Arrivals
            </h2>
            <span className="bg-emerald-200 text-emerald-800 px-2.5 py-0.5 rounded-full text-sm font-bold">
              {arrivals.length}
            </span>
          </div>
          
          <div className="p-4 flex-1 bg-slate-50">
            {arrivals.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                <CalendarDays className="w-12 h-12 mb-3 opacity-20" />
                <p>No arrivals scheduled for today.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {arrivals.map(b => (
                  <div key={b.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 flex items-center">
                          <UserCircle className="w-4 h-4 mr-1.5 text-slate-400" /> {b.guest_name}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center mt-1">
                          <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" /> {b.mobile_number || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-500 uppercase">Rooms</span>
                        <p className="font-bold text-emerald-600 flex items-center justify-end mt-0.5">
                          <BedDouble className="w-4 h-4 mr-1" /> {b.rooms.join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-3 mt-1 flex justify-between items-center">
                      <div className="text-xs text-slate-500">
                        Stay: {new Date(b.arrival_date).toLocaleDateString()} <ArrowRight className="inline w-3 h-3 mx-1"/> {new Date(b.departure_date).toLocaleDateString()}
                      </div>
                      <button 
                        onClick={() => handleCheckIn(b.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
                      >
                        Check In Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Departures Column */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
          <div className="bg-rose-50 border-b border-rose-100 p-4 flex items-center justify-between">
            <h2 className="font-bold text-rose-800 flex items-center text-lg">
              <LogOut className="w-5 h-5 mr-2 text-rose-600" /> Expected Departures
            </h2>
            <span className="bg-rose-200 text-rose-800 px-2.5 py-0.5 rounded-full text-sm font-bold">
              {departures.length}
            </span>
          </div>
          
          <div className="p-4 flex-1 bg-slate-50">
            {departures.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                <CalendarDays className="w-12 h-12 mb-3 opacity-20" />
                <p>No departures scheduled for today.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {departures.map(b => (
                  <div key={b.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 flex items-center">
                          <UserCircle className="w-4 h-4 mr-1.5 text-slate-400" /> {b.guest_name}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center mt-1">
                          <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" /> {b.mobile_number || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-500 uppercase">Rooms</span>
                        <p className="font-bold text-rose-600 flex items-center justify-end mt-0.5">
                          <BedDouble className="w-4 h-4 mr-1" /> {b.rooms.join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-3 mt-1 flex justify-between items-center">
                      <div className="text-xs text-slate-500">
                        Stay: {new Date(b.arrival_date).toLocaleDateString()} <ArrowRight className="inline w-3 h-3 mx-1"/> {new Date(b.departure_date).toLocaleDateString()}
                      </div>
                      <button 
                        onClick={() => handleCheckOut(b.id)}
                        className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
                      >
                        Check Out
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
