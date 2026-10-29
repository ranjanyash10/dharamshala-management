import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../store/useAuth';
import { X } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

interface Room {
  id: number;
  room_number: string;
  type: string;
  status: string;
}

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialRoomIds?: number[];
}

export default function NewBookingModal({ isOpen, onClose, onSuccess, initialRoomIds = [] }: NewBookingModalProps) {
  const token = useAuth(state => state.token);
  const [rooms, setRooms] = useState<Room[]>([]);
  
  // Form state
  const [guestName, setGuestName] = useState('');
  const [mobile, setMobile] = useState('');
  const [idDetails, setIdDetails] = useState('');
  const [address, setAddress] = useState('');
  const [arrival, setArrival] = useState('');
  const [departure, setDeparture] = useState('');
  const [selectedRooms, setSelectedRooms] = useState<number[]>([]);
  const [occupants, setOccupants] = useState(1);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Set initial rooms
      setSelectedRooms(initialRoomIds);
      
      // Set default dates (Today to Tomorrow)
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      setArrival(today.toISOString().split('T')[0]);
      setDeparture(tomorrow.toISOString().split('T')[0]);
      
      // Fetch available rooms
      axios.get(`${API_BASE_URL}/api/v1/rooms/`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setRooms(res.data.filter((r: Room) => r.status === 'Available' || r.status === 'Cleaning'));
      }).catch(err => console.error("Failed to load rooms", err));
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (selectedRooms.length === 0) {
      setError("Please select at least one room.");
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/v1/bookings/`, {
        guest_name: guestName,
        mobile_number: mobile,
        id_details: idDetails,
        address,
        arrival_date: arrival,
        departure_date: departure,
        room_ids: selectedRooms,
        occupant_count: occupants,
        source: 'Walk-in'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      onSuccess(); // Refresh parent
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const toggleRoom = (id: number) => {
    setSelectedRooms(prev => 
      prev.includes(id) ? prev.filter(rId => rId !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-slate-800">New Walk-in / Booking</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">{error}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Guest Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Guest Details</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Representative Name *</label>
                <input type="text" required value={guestName} onChange={e => setGuestName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
                <input type="text" value={mobile} onChange={e => setMobile(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ID Details (Optional)</label>
                <input type="text" placeholder="e.g. Aadhar / Passport" value={idDetails} onChange={e => setIdDetails(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <textarea value={address} onChange={e => setAddress(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none" rows={2}></textarea>
              </div>
            </div>

            {/* Stay Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Stay & Allocation</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Arrival *</label>
                  <input type="date" required value={arrival} onChange={e => setArrival(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Departure *</label>
                  <input type="date" required value={departure} onChange={e => setDeparture(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total Occupants *</label>
                <input type="number" min="1" required value={occupants} onChange={e => setOccupants(parseInt(e.target.value) || 1)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Rooms *</label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50 grid grid-cols-3 gap-2">
                  {rooms.length === 0 ? (
                    <div className="col-span-3 text-sm text-slate-500 text-center py-4">No available rooms found.</div>
                  ) : (
                    rooms.map(room => (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => toggleRoom(room.id)}
                        className={`p-2 text-xs font-medium rounded-md border text-center transition-colors ${
                          selectedRooms.includes(room.id) 
                            ? 'bg-primary-600 text-white border-primary-600' 
                            : 'bg-white text-slate-700 border-slate-300 hover:border-primary-400'
                        }`}
                      >
                        {room.room_number} <br/><span className="opacity-75 text-[10px]">{room.type}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-70">
              {loading ? 'Saving...' : 'Confirm Stay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
