import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../store/useAuth';
import { LogIn, LogOut, FileText } from 'lucide-react';
import NewBookingModal from './NewBookingModal';
import InvoiceModal from '../billing/InvoiceModal';
import { API_BASE_URL } from '../../config/api';

interface Booking {
  id: number;
  guest_name: string;
  status: string;
  arrival_date: string;
  departure_date: string;
  rooms: string[];
}

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoiceModalBookingId, setInvoiceModalBookingId] = useState<number | null>(null);
  const token = useAuth((state) => state.token);

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/v1/bookings/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(res.data);
    } catch (error) {
      console.error('Failed to fetch bookings', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleAction = async (id: number, action: 'check-in' | 'check-out') => {
    try {
      await axios.post(`${API_BASE_URL}/api/v1/bookings/${id}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBookings();
    } catch (error) {
      console.error(`Failed to ${action}`, error);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading stays...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Guest & Stay Register</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          + New Walk-in / Booking
        </button>
      </div>

      <NewBookingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchBookings} 
      />

      <InvoiceModal
        isOpen={!!invoiceModalBookingId}
        bookingId={invoiceModalBookingId}
        onClose={() => setInvoiceModalBookingId(null)}
      />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Stay ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Guest Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rooms</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No stays recorded yet.</td>
                </tr>
              ) : bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">#{booking.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">{booking.guest_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {booking.rooms.map(r => <span key={r} className="inline-block bg-slate-100 px-2 py-0.5 rounded text-xs mr-1 border border-slate-200">{r}</span>)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {booking.arrival_date} &rarr; {booking.departure_date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      booking.status === 'CheckedIn' ? 'bg-emerald-100 text-emerald-800' :
                      booking.status === 'Reserved' ? 'bg-blue-100 text-blue-800' :
                      booking.status === 'CheckedOut' ? 'bg-slate-100 text-slate-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    {booking.status === 'Reserved' && (
                      <button onClick={() => handleAction(booking.id, 'check-in')} className="text-emerald-600 hover:text-emerald-900 border border-emerald-200 bg-emerald-50 px-3 py-1 rounded-md inline-flex items-center">
                        <LogIn className="w-4 h-4 mr-1" /> Check-in
                      </button>
                    )}
                    {booking.status === 'CheckedIn' && (
                      <button onClick={() => handleAction(booking.id, 'check-out')} className="text-amber-600 hover:text-amber-900 border border-amber-200 bg-amber-50 px-3 py-1 rounded-md inline-flex items-center">
                        <LogOut className="w-4 h-4 mr-1" /> Check-out
                      </button>
                    )}
                    <button onClick={() => setInvoiceModalBookingId(booking.id)} className="text-slate-400 hover:text-slate-600 p-1" title="View Invoice">
                      <FileText className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
