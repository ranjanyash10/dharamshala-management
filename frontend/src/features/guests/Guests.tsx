import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../store/useAuth';
import { Search, UserCircle, MapPin, Phone, Hash, Upload, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function Guests() {
  const token = useAuth(state => state.token);
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [expandedGuest, setExpandedGuest] = useState<number | null>(null);
  const [guestDocs, setGuestDocs] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchGuests();
  }, [token]);

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/v1/guests/`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setGuests(res.data);
    } catch (err) {
      console.error("Failed to load guests", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocs = async (guestId: number) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/v1/guests/${guestId}/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGuestDocs(res.data);
    } catch (err) {
      console.error("Failed to load documents", err);
    }
  };

  const handleExpand = (guestId: number) => {
    if (expandedGuest === guestId) {
      setExpandedGuest(null);
    } else {
      setExpandedGuest(guestId);
      fetchDocs(guestId);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, guestId: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    // Default to 'ID Proof' for now
    formData.append('document_type', 'ID Proof');
    
    setUploading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/v1/guests/${guestId}/documents`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      // Refresh docs
      fetchDocs(guestId);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
      e.target.value = ''; // reset input
    }
  };

  const filteredGuests = guests.filter(g => 
    g.full_name.toLowerCase().includes(search.toLowerCase()) || 
    (g.mobile_number && g.mobile_number.includes(search)) ||
    (g.id_details && g.id_details.toLowerCase().includes(search.toLowerCase())) ||
    (g.room_numbers && g.room_numbers.some((rn: string) => rn.includes(search)))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Guest Register</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, phone, ID, or Room #..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div className="text-sm font-medium text-slate-500">
            Total Records: {filteredGuests.length}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading guest directory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-10"></th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Guest Details</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Contact & Address</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">ID Details</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Stays & Rooms</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">First Registered</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredGuests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      No guests found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredGuests.map((g) => (
                    <React.Fragment key={g.id}>
                      <tr 
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => handleExpand(g.id)}
                      >
                        <td className="px-4 py-4 text-slate-400">
                          {expandedGuest === g.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <UserCircle className="h-6 w-6 text-primary-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-bold text-slate-900">{g.full_name}</div>
                              <div className="text-xs text-slate-500">ID: #{g.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-700 flex items-center mb-1">
                            <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> {g.mobile_number || '-'}
                          </div>
                          <div className="text-xs text-slate-500 flex items-start">
                            <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400 mt-0.5" /> 
                            <span className="truncate max-w-[200px]">{g.address || '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          <div className="flex items-center">
                            <Hash className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                            {g.id_details || 'Not Provided'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {g.total_stays} {g.total_stays === 1 ? 'Stay' : 'Stays'}
                            </span>
                          </div>
                          {g.room_numbers && g.room_numbers.length > 0 && (
                            <div className="text-xs text-slate-500 mt-1.5 space-y-0.5">
                              <div>Rooms: {g.room_numbers.join(', ')}</div>
                              <div>Occupants: {g.total_occupants}</div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right">
                          {new Date(g.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                      {/* Expanded Row for Documents */}
                      {expandedGuest === g.id && (
                        <tr>
                          <td colSpan={6} className="bg-slate-50 px-10 py-6 border-b border-slate-200">
                            <div className="flex justify-between items-start mb-4">
                              <h3 className="text-sm font-bold text-slate-800 flex items-center">
                                <FileText className="w-4 h-4 mr-2 text-primary-600" /> Scanned ID Documents
                              </h3>
                              <div>
                                <label className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer flex items-center transition">
                                  <Upload className="w-4 h-4 mr-2" />
                                  {uploading ? 'Uploading...' : 'Upload ID'}
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    onChange={(e) => handleFileUpload(e, g.id)}
                                    accept="image/*,.pdf"
                                    disabled={uploading}
                                  />
                                </label>
                              </div>
                            </div>
                            
                            {guestDocs.length === 0 ? (
                              <div className="text-sm text-slate-500 italic bg-white p-4 rounded border border-dashed border-slate-300 text-center">
                                No documents uploaded for this guest yet.
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {guestDocs.map(doc => (
                                  <div key={doc.id} className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col items-center shadow-sm">
                                    <div className="w-full h-32 bg-slate-100 rounded mb-2 flex items-center justify-center overflow-hidden border border-slate-200">
                                      {doc.file_url.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                                        <img src={`${API_BASE_URL}${doc.file_url}`} alt={doc.person_name} className="object-cover w-full h-full" />
                                      ) : (
                                        <FileText className="w-8 h-8 text-slate-400" />
                                      )}
                                    </div>
                                    <div className="text-xs font-bold text-slate-800 text-center w-full truncate" title={doc.person_name}>
                                      {doc.person_name}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5">{doc.document_type}</div>
                                    <a href={`${API_BASE_URL}${doc.file_url}`} target="_blank" rel="noopener noreferrer" className="mt-2 text-xs text-primary-600 font-medium hover:underline">
                                      View File
                                    </a>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
