import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../store/useAuth';
import { X, Printer, IndianRupee, CreditCard, PlusCircle, ChevronDown } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number | null;
}

export default function InvoiceModal({ isOpen, onClose, bookingId }: InvoiceModalProps) {
  const token = useAuth(state => state.token);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [processing, setProcessing] = useState(false);

  // Extra Charge State
  const [chargeType, setChargeType] = useState('Custom'); // Custom, Breakfast, Lunch, Dinner
  const [chargeDesc, setChargeDesc] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeQty, setChargeQty] = useState(1);
  const [addingCharge, setAddingCharge] = useState(false);

  // Settings for prices
  const [mealRates, setMealRates] = useState({ Breakfast: 150, Lunch: 250, Dinner: 250 });

  const fetchInvoiceAndSettings = async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const [invRes, setRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/v1/billing/bookings/${bookingId}/invoice`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/api/v1/settings/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setInvoice(invRes.data);
      const total = parseFloat(invRes.data.total);
      const paid = invRes.data.payments.reduce((acc: number, p: any) => acc + parseFloat(p.amount), 0);
      setPaymentAmount((total - paid).toFixed(2));

      // Parse meal rates from settings
      if (setRes.data) {
        setMealRates({
          Breakfast: parseFloat(setRes.data.meal_breakfast_rate || '150'),
          Lunch: parseFloat(setRes.data.meal_lunch_rate || '250'),
          Dinner: parseFloat(setRes.data.meal_dinner_rate || '250'),
        });
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchInvoiceAndSettings();
    } else {
      setInvoice(null);
      setChargeType('Custom');
      setChargeDesc('');
      setChargeAmount('');
      setChargeQty(1);
    }
  }, [isOpen, bookingId, token]);

  // Auto-calculate meal prices when type or qty changes
  useEffect(() => {
    if (chargeType !== 'Custom') {
      const rate = mealRates[chargeType as keyof typeof mealRates] || 0;
      setChargeAmount((rate * chargeQty).toString());
    }
  }, [chargeType, chargeQty, mealRates]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice || !paymentAmount) return;
    setProcessing(true);
    try {
      await axios.post(`${API_BASE_URL}/api/v1/billing/invoices/${invoice.id}/pay`, {
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchInvoiceAndSettings();
    } catch (err) {
      console.error("Payment failed", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleAddCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice || !chargeAmount) return;
    setAddingCharge(true);
    
    let finalDesc = chargeDesc;
    if (chargeType !== 'Custom') {
      finalDesc = `${chargeType} (${chargeQty} ${chargeQty === 1 ? 'person' : 'persons'})`;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/v1/billing/invoices/${invoice.id}/line_items`, {
        description: finalDesc,
        amount: parseFloat(chargeAmount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChargeType('Custom');
      setChargeDesc('');
      setChargeAmount('');
      setChargeQty(1);
      await fetchInvoiceAndSettings();
    } catch (err) {
      console.error("Charge failed", err);
    } finally {
      setAddingCharge(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 print:bg-white print:p-0">
      <div id="invoice-print-area" className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-h-full print:overflow-visible">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10 print:static print:border-b-2 print:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800">
            {invoice ? `Invoice #${invoice.invoice_number}` : 'Loading Invoice...'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 no-print">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading || !invoice ? (
          <div className="p-8 text-center text-slate-500 no-print">Generating Billing Ledger...</div>
        ) : (
          <div className="p-6 space-y-8">
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Dharamshala Management</h3>
                <p className="text-sm text-slate-500">Guest: <span className="font-medium text-slate-800">{invoice.guest_name}</span></p>
                <p className="text-sm text-slate-500">Date: {new Date(invoice.issued_date).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                  invoice.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                  invoice.status === 'Draft' ? 'bg-slate-100 text-slate-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {invoice.status}
                </span>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Line Items</h4>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden mb-4 print:border-slate-400">
                <table className="min-w-full divide-y divide-slate-200 print:divide-slate-400">
                  <thead className="bg-slate-50 print:bg-white">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 print:text-slate-800">Description</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 print:text-slate-800">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200 print:divide-slate-400">
                    {invoice.line_items.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-slate-700 print:text-slate-900">{item.description}</td>
                        <td className="px-4 py-3 text-sm text-slate-900 font-medium text-right font-mono">₹{parseFloat(item.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200 print:bg-white print:border-slate-800">
                    <tr>
                      <td className="px-4 py-3 text-sm font-bold text-slate-800 text-right">Total Amount</td>
                      <td className="px-4 py-3 text-sm font-bold text-primary-700 text-right font-mono print:text-slate-900">₹{parseFloat(invoice.total).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Smart Add Charge Form */}
              {invoice.status !== 'Paid' && (
                <form onSubmit={handleAddCharge} className="flex space-x-2 items-center bg-slate-50 p-3 rounded-lg border border-slate-200 no-print">
                  
                  <div className="relative">
                    <select 
                      value={chargeType} 
                      onChange={e => setChargeType(e.target.value)}
                      className="pl-3 pr-8 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-primary-500 appearance-none bg-white font-medium text-slate-700"
                    >
                      <option value="Custom">Custom Charge</option>
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-2 top-2 text-slate-500 pointer-events-none" />
                  </div>

                  {chargeType === 'Custom' ? (
                    <input 
                      type="text" 
                      value={chargeDesc}
                      onChange={e => setChargeDesc(e.target.value)}
                      placeholder="E.g. Extra Bed, Laundry" 
                      className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-primary-500"
                      required
                    />
                  ) : (
                    <div className="flex-1 flex items-center space-x-2">
                      <span className="text-sm text-slate-500">Qty (Persons):</span>
                      <input 
                        type="number" 
                        min="1"
                        value={chargeQty}
                        onChange={e => setChargeQty(parseInt(e.target.value) || 1)}
                        className="w-20 px-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-primary-500"
                        required
                      />
                      <span className="text-xs text-slate-400 italic">(₹{mealRates[chargeType as keyof typeof mealRates]} / person)</span>
                    </div>
                  )}

                  <div className="relative w-32">
                    <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-500 text-sm">₹</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={chargeAmount}
                      onChange={e => setChargeAmount(e.target.value)}
                      placeholder="Amount" 
                      className={`w-full pl-6 pr-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-primary-500 ${chargeType !== 'Custom' ? 'bg-slate-100 font-bold' : ''}`}
                      readOnly={chargeType !== 'Custom'}
                      required
                    />
                  </div>
                  <button type="submit" disabled={addingCharge} className="bg-slate-800 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-slate-700 transition flex items-center whitespace-nowrap">
                    <PlusCircle className="w-4 h-4 mr-1" /> {addingCharge ? '...' : 'Add'}
                  </button>
                </form>
              )}
            </div>

            {/* Payments Ledger */}
            {invoice.payments.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 print:text-slate-800">Payments History</h4>
                <div className="bg-slate-50 rounded-lg p-4 space-y-2 border border-slate-200 print:border-slate-400 print:bg-white">
                  {invoice.payments.map((p: any) => (
                    <div key={p.id} className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 print:text-slate-800">{new Date(p.date).toLocaleDateString()} via {p.method}</span>
                      <span className="font-bold text-emerald-700 font-mono print:text-slate-900">₹{parseFloat(p.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Form */}
            {invoice.status !== 'Paid' && (
              <div className="bg-primary-50 rounded-xl p-5 border border-primary-100 no-print">
                <h4 className="text-sm font-bold text-primary-800 mb-3 flex items-center"><IndianRupee className="w-4 h-4 mr-1"/> Record Payment</h4>
                <form onSubmit={handlePayment} className="flex space-x-3 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-primary-700 mb-1">Amount</label>
                    <input type="number" step="0.01" required value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-primary-700 mb-1">Method</label>
                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500">
                      <option>Cash</option>
                      <option>UPI</option>
                      <option>Card</option>
                    </select>
                  </div>
                  <button type="submit" disabled={processing} className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 whitespace-nowrap flex items-center">
                    <CreditCard className="w-4 h-4 mr-2" /> {processing ? 'Processing...' : 'Pay'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-slate-200 p-4 bg-slate-50 flex justify-between rounded-b-2xl mt-4 no-print">
          <button onClick={() => window.print()} className="flex items-center text-slate-500 hover:text-slate-700 font-medium text-sm px-4 py-2">
            <Printer className="w-4 h-4 mr-2" /> Print Invoice
          </button>
          <button onClick={onClose} className="px-6 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
