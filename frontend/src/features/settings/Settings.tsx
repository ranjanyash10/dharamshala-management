import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../store/useAuth';
import { Save, Building2, Phone, Mail, MapPin, Clock, Percent, Coffee, Utensils, UtensilsCrossed, BedDouble } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function Settings() {
  const token = useAuth(state => state.token);
  const [settings, setSettings] = useState({
    dharamshala_name: '',
    address: '',
    email: '',
    phone: '',
    checkin_time: '12:00 PM',
    checkout_time: '11:00 AM',
    tax_rate: '0',
    room_rate_Standard: '1500',
    room_rate_Deluxe: '2500',
    room_rate_Suite: '4500',
    meal_breakfast_rate: '150',
    meal_lunch_rate: '250',
    meal_dinner_rate: '250'
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/v1/settings`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      if (Object.keys(res.data).length > 0) {
        setSettings(prev => ({ ...prev, ...res.data }));
      }
    })
    .catch(err => console.error("Failed to load settings", err));
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await axios.post(`${API_BASE_URL}/api/v1/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error("Failed to save settings", err);
      setMessage('Error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">General Configuration</h2>
          <p className="text-sm text-slate-500">Manage the core details of the Dharamshala.</p>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                <Building2 className="w-4 h-4 mr-1.5 text-slate-400" /> Dharamshala Name
              </label>
              <input type="text" name="dharamshala_name" value={settings.dharamshala_name} onChange={handleChange} placeholder="Shri Ram Dharamshala" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                <MapPin className="w-4 h-4 mr-1.5 text-slate-400" /> Complete Address
              </label>
              <input type="text" name="address" value={settings.address} onChange={handleChange} placeholder="123 Temple Road, City" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                <Phone className="w-4 h-4 mr-1.5 text-slate-400" /> Contact Phone
              </label>
              <input type="text" name="phone" value={settings.phone} onChange={handleChange} placeholder="+91 98765 43210" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                <Mail className="w-4 h-4 mr-1.5 text-slate-400" /> Contact Email
              </label>
              <input type="email" name="email" value={settings.email} onChange={handleChange} placeholder="contact@dharamshala.org" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          <hr className="border-slate-200" />

          <h3 className="text-md font-bold text-slate-800">Room Pricing (Per Night)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                <BedDouble className="w-4 h-4 mr-1.5 text-slate-400" /> Standard Room
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">₹</span>
                <input type="number" name="room_rate_Standard" value={settings.room_rate_Standard} onChange={handleChange} className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                <BedDouble className="w-4 h-4 mr-1.5 text-slate-400" /> Deluxe Room
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">₹</span>
                <input type="number" name="room_rate_Deluxe" value={settings.room_rate_Deluxe} onChange={handleChange} className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                <BedDouble className="w-4 h-4 mr-1.5 text-slate-400" /> Suite Room
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">₹</span>
                <input type="number" name="room_rate_Suite" value={settings.room_rate_Suite} onChange={handleChange} className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
          </div>

          <hr className="border-slate-200" />

          <h3 className="text-md font-bold text-slate-800">Meal Pricing (Per Thali/Person)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                <Coffee className="w-4 h-4 mr-1.5 text-slate-400" /> Breakfast
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">₹</span>
                <input type="number" name="meal_breakfast_rate" value={settings.meal_breakfast_rate} onChange={handleChange} className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                <Utensils className="w-4 h-4 mr-1.5 text-slate-400" /> Lunch (Bhojanalay)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">₹</span>
                <input type="number" name="meal_lunch_rate" value={settings.meal_lunch_rate} onChange={handleChange} className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                <UtensilsCrossed className="w-4 h-4 mr-1.5 text-slate-400" /> Dinner (Bhojanalay)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">₹</span>
                <input type="number" name="meal_dinner_rate" value={settings.meal_dinner_rate} onChange={handleChange} className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
          </div>

          <hr className="border-slate-200" />

          <h3 className="text-md font-bold text-slate-800">Operational Defaults</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-slate-400" /> Default Check-in Time
              </label>
              <input type="text" name="checkin_time" value={settings.checkin_time} onChange={handleChange} placeholder="12:00 PM" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-slate-400" /> Default Checkout Time
              </label>
              <input type="text" name="checkout_time" value={settings.checkout_time} onChange={handleChange} placeholder="11:00 AM" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                <Percent className="w-4 h-4 mr-1.5 text-slate-400" /> Default Tax / GST Rate (%)
              </label>
              <input type="number" name="tax_rate" value={settings.tax_rate} onChange={handleChange} placeholder="0" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          <div className="pt-6 flex items-center justify-between border-t border-slate-200">
            <div>
              {message && (
                <span className={`text-sm font-medium ${message.includes('Error') ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {message}
                </span>
              )}
            </div>
            <button type="submit" disabled={saving} className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition flex items-center shadow-sm disabled:opacity-50">
              <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
