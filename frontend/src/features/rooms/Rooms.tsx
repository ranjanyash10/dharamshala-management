import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../store/useAuth';
import { clsx } from 'clsx';
import { BedDouble } from 'lucide-react';
import NewBookingModal from '../bookings/NewBookingModal';
import { API_BASE_URL } from '../../config/api';

interface Room {
  id: number;
  room_number: string;
  floor: string;
  type: string;
  capacity: number;
  status: string;
  is_active: boolean;
}

const statusColors: Record<string, string> = {
  'Available': 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:border-emerald-400',
  'Reserved': 'bg-blue-100 text-blue-800 border-blue-200',
  'Occupied': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Cleaning': 'bg-amber-100 text-amber-800 border-amber-200 hover:border-amber-400',
  'Maintenance': 'bg-red-100 text-red-800 border-red-200',
  'Inactive': 'bg-slate-100 text-slate-800 border-slate-200',
};

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const token = useAuth((state) => state.token);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/v1/rooms/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(res.data);
    } catch (error) {
      console.error('Failed to fetch rooms', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (e: React.ChangeEvent<HTMLSelectElement>, id: number) => {
    e.stopPropagation(); // Prevent clicking the room card
    try {
      await axios.patch(`${API_BASE_URL}/api/v1/rooms/${id}/status`, { status: e.target.value }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRooms(); // Refresh
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const handleRoomClick = (room: Room) => {
    if (room.status === 'Available' || room.status === 'Cleaning') {
      setSelectedRoomId(room.id);
      setIsModalOpen(true);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading rooms...</div>;

  return (
    <div className="space-y-6">
      
      <NewBookingModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRoomId(null);
        }}
        onSuccess={fetchRooms}
        initialRoomIds={selectedRoomId ? [selectedRoomId] : []}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Room Status Dashboard</h1>
        <div className="flex gap-2">
          {Object.keys(statusColors).map(status => (
            <div key={status} className="flex items-center text-sm text-slate-600">
              <span className={`w-3 h-3 rounded-full mr-2 ${statusColors[status].split(' ')[0]}`}></span>
              {status}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-10 gap-4">
        {rooms.map(room => (
          <div 
            key={room.id}
            onClick={() => handleRoomClick(room)}
            className={clsx(
              "flex flex-col rounded-xl border p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group",
              statusColors[room.status] || 'bg-white border-slate-200 text-slate-800'
            )}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-lg">{room.room_number}</span>
              <BedDouble className="w-4 h-4 opacity-70" />
            </div>
            <div className="text-xs font-medium opacity-90 truncate">{room.type}</div>
            
            {/* Hover Actions (Mock) */}
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-xl p-2 flex-col justify-center items-center gap-2 hidden group-hover:flex border border-slate-300 z-10">
              <span className="text-xs font-bold text-slate-700 mb-1">{room.room_number}</span>
              <select 
                className="text-xs w-full p-1 border rounded bg-white text-slate-900"
                value={room.status}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => updateStatus(e, room.id)}
              >
                {Object.keys(statusColors).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
