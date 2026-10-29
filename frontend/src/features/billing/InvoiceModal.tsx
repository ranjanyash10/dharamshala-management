import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../store/useAuth';
import { 
  X, 
  Printer, 
  IndianRupee, 
  CreditCard, 
  PlusCircle, 
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  BedDouble,
  Receipt,
  ShieldCheck
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { numberToWordsIndian } from '../../utils/formatters';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number | null;
}

export default function InvoiceModal({ isOpen, onClose, bookingId }: InvoiceModalProps) {
  const token = useAuth(state => state.token);
  const [invoice, setInvoice] = useState<any>(null);
  const [settings, setSettings] = useState<any>({
    dharamshala_name: 'Shree Dharamshala & Yatri Niwas',
    address: 'Temple Road, Near Main Gate, Complex Area',
    phone: '+91 98765 43210',
    email: 'contact@dharamshala.org',
    checkin_time: '12:00 PM',
    checkout_time: '11:00 AM',
    tax_rate: '0',
  });
  const [loading, setLoading] = useState(true);
  
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [processing, setProcessing] = useState(false);

  // Extra Charge State
  const [chargeType, setChargeType] = useState('Custom'); // Custom, Breakfast, Lunch, Dinner, Extra Bed, Laundry
  const [chargeDesc, setChargeDesc] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeQty, setChargeQty] = useState(1);
  const [addingCharge, setAddingCharge] = useState(false);

  // Meal rates & presets
  const [mealRates, setMealRates] = useState<Record<string, number>>({
    Breakfast: 150,
    Lunch: 250,
    Dinner: 250,
    'Extra Bed': 300,
    Laundry: 100
  });

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
      const total = parseFloat(invRes.data.total) || 0;
      const paid = invRes.data.payments.reduce((acc: number, p: any) => acc + (parseFloat(p.amount) || 0), 0);
      const balance = Math.max(0, total - paid);
      setPaymentAmount(balance > 0 ? balance.toFixed(2) : '');

      if (setRes.data && Object.keys(setRes.data).length > 0) {
        setSettings((prev: any) => ({ ...prev, ...setRes.data }));
        setMealRates(prev => ({
          ...prev,
          Breakfast: parseFloat(setRes.data.meal_breakfast_rate || '150'),
          Lunch: parseFloat(setRes.data.meal_lunch_rate || '250'),
          Dinner: parseFloat(setRes.data.meal_dinner_rate || '250'),
        }));
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

  // Auto-calculate charge prices when type or qty changes
  useEffect(() => {
    if (chargeType !== 'Custom') {
      const rate = mealRates[chargeType] || 0;
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
      alert("Payment recording failed. Please try again.");
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
      const rate = mealRates[chargeType] || 0;
      finalDesc = `${chargeType} (${chargeQty} ${chargeQty === 1 ? 'unit/person' : 'units/persons'} @ ₹${rate})`;
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
      alert("Failed to add charge. Please try again.");
    } finally {
      setAddingCharge(false);
    }
  };

  if (!isOpen) return null;

  // Financial calculations
  const total = invoice ? parseFloat(invoice.total) || 0 : 0;
  const subtotal = invoice ? parseFloat(invoice.subtotal) || total : total;
  const totalPaid = invoice && invoice.payments ? invoice.payments.reduce((acc: number, p: any) => acc + (parseFloat(p.amount) || 0), 0) : 0;
  const balanceDue = Math.max(0, total - totalPaid);
  const isFullyPaid = invoice && (invoice.status === 'Paid' || (total > 0 && balanceDue <= 0.01));
  const isPartiallyPaid = totalPaid > 0 && !isFullyPaid;

  const booking = invoice?.booking_details;
  const arrivalFormatted = booking?.arrival_date 
    ? new Date(booking.arrival_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const departureFormatted = booking?.departure_date 
    ? new Date(booking.departure_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const issueDateFormatted = invoice?.issued_date 
    ? new Date(invoice.issued_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN');

  const taxRate = parseFloat(settings.tax_rate) || 0;
  const taxAmount = (subtotal * taxRate) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:overflow-visible">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden print:shadow-none print:max-h-full print:rounded-none print:overflow-visible print:w-full">
        
        {/* Top Control Header (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white z-10 no-print">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                {invoice ? `Invoice Folio #${invoice.invoice_number}` : 'Generating Invoice...'}
              </h2>
              <p className="text-xs text-slate-400">Official Guest Bill & Receipt</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.print()}
              disabled={loading || !invoice}
              className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 print:bg-white print:p-0 print:overflow-visible">
          {loading || !invoice ? (
            <div className="py-24 text-center">
              <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 font-medium">Preparing Tax Invoice & Folio...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* THE OFFICIAL INVOICE PAPER (PRINT AREA) */}
              <div 
                id="invoice-print-area" 
                className="bg-white rounded-xl shadow-md border border-slate-200 p-8 sm:p-10 relative overflow-hidden print:p-6 print:border-none print:shadow-none"
              >
                {/* Watermark Status Stamp */}
                <div className="absolute right-8 top-28 pointer-events-none opacity-90 select-none print:opacity-100">
                  {isFullyPaid ? (
                    <div className="border-4 border-emerald-600 text-emerald-700 font-black tracking-widest text-xl sm:text-2xl px-6 py-2 rounded-xl rotate-[-12deg] uppercase flex items-center space-x-2 bg-emerald-50/70 shadow-sm print:bg-transparent">
                      <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                      <span>PAID IN FULL</span>
                    </div>
                  ) : isPartiallyPaid ? (
                    <div className="border-4 border-amber-600 text-amber-700 font-black tracking-widest text-lg sm:text-xl px-5 py-2 rounded-xl rotate-[-10deg] uppercase flex items-center space-x-2 bg-amber-50/70 shadow-sm print:bg-transparent">
                      <Clock className="w-6 h-6 text-amber-600" />
                      <span>PARTIALLY PAID</span>
                    </div>
                  ) : (
                    <div className="border-4 border-rose-600 text-rose-700 font-black tracking-widest text-lg sm:text-xl px-5 py-2 rounded-xl rotate-[-10deg] uppercase flex items-center space-x-2 bg-rose-50/70 shadow-sm print:bg-transparent">
                      <AlertCircle className="w-6 h-6 text-rose-600" />
                      <span>PAYMENT DUE</span>
                    </div>
                  )}
                </div>

                {/* 1. HEADER & BRANDING */}
                <div className="border-b-2 border-slate-800 pb-6 mb-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-1.5 max-w-md">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                          {settings.dharamshala_name || 'Shree Dharamshala & Yatri Niwas'}
                        </h1>
                      </div>
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                        Pilgrims Guest House & Religious Trust
                      </p>
                      
                      <div className="text-xs text-slate-600 space-y-0.5 pt-1">
                        <p className="flex items-center text-slate-600">
                          <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
                          <span>{settings.address || 'Temple Complex Road, Near Main Gate'}</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 text-slate-600 pt-0.5">
                          {settings.phone && (
                            <span className="flex items-center">
                              <Phone className="w-3 h-3 mr-1 text-slate-400" /> {settings.phone}
                            </span>
                          )}
                          {settings.email && (
                            <span className="flex items-center">
                              <Mail className="w-3 h-3 mr-1 text-slate-400" /> {settings.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded text-xs font-black uppercase tracking-widest mb-2 print:bg-slate-900 print:text-white">
                        TAX INVOICE & RECEIPT
                      </div>
                      <p className="text-sm font-bold text-slate-900">
                        Invoice No: <span className="font-mono text-base text-primary-700">{invoice.invoice_number}</span>
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Date of Issue: <span className="font-semibold text-slate-800">{issueDateFormatted}</span>
                      </p>
                      {booking?.booking_id && (
                        <p className="text-xs text-slate-600 mt-0.5">
                          Booking Ref: <span className="font-mono font-semibold text-slate-800">#{booking.booking_id}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. GUEST & RESERVATION DETAILS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {/* Guest Information */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 print:border-slate-300 print:bg-slate-50/50">
                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2.5 flex items-center">
                      <User className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                      Guest (Billed To)
                    </h3>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Full Name:</span>
                        <span className="font-bold text-slate-900">{booking?.guest_name || invoice.guest_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Contact Number:</span>
                        <span className="font-semibold text-slate-800">{booking?.mobile_number || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">ID Proof / Aadhaar:</span>
                        <span className="font-semibold text-slate-800">{booking?.id_details || 'Verified at Check-in'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Address:</span>
                        <span className="font-semibold text-slate-800 text-right max-w-[200px] truncate">{booking?.address || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stay & Room Details */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 print:border-slate-300 print:bg-slate-50/50">
                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2.5 flex items-center">
                      <BedDouble className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                      Stay & Accommodation Details
                    </h3>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Check-In:</span>
                        <span className="font-bold text-slate-900">
                          {arrivalFormatted} <span className="font-normal text-slate-500">({settings.checkin_time || '12:00 PM'})</span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Check-Out:</span>
                        <span className="font-bold text-slate-900">
                          {departureFormatted} <span className="font-normal text-slate-500">({settings.checkout_time || '11:00 AM'})</span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Stay Duration:</span>
                        <span className="font-bold text-primary-700">
                          {booking?.nights || 1} {booking?.nights === 1 ? 'Night' : 'Nights'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Assigned Rooms:</span>
                        <span className="font-semibold text-slate-900">
                          {booking?.rooms && booking.rooms.length > 0 ? (
                            booking.rooms.map((r: any) => `Rm ${r.room_number} (${r.type})`).join(', ')
                          ) : 'Standard Room'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. LINE ITEMS LEDGER TABLE */}
                <div className="mb-6">
                  <div className="overflow-hidden border border-slate-300 rounded-lg print:border-slate-400">
                    <table className="min-w-full divide-y divide-slate-300 print:divide-slate-400">
                      <thead className="bg-slate-100 print:bg-slate-100">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-[11px] font-black text-slate-700 uppercase tracking-wider w-12">#</th>
                          <th className="px-4 py-2.5 text-left text-[11px] font-black text-slate-700 uppercase tracking-wider">Item Description / Service</th>
                          <th className="px-4 py-2.5 text-center text-[11px] font-black text-slate-700 uppercase tracking-wider w-24">HSN / SAC</th>
                          <th className="px-4 py-2.5 text-right text-[11px] font-black text-slate-700 uppercase tracking-wider w-32">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200 print:divide-slate-300 text-xs">
                        {invoice.line_items && invoice.line_items.map((item: any, idx: number) => (
                          <tr key={item.id} className={idx % 2 === 1 ? 'bg-slate-50/50 print:bg-slate-50/30' : ''}>
                            <td className="px-4 py-3 font-semibold text-slate-500">{idx + 1}</td>
                            <td className="px-4 py-3 font-medium text-slate-800">
                              <span className="font-semibold text-slate-900">{item.description}</span>
                            </td>
                            <td className="px-4 py-3 text-center text-slate-500 font-mono text-[11px]">996311</td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                              ₹{parseFloat(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. TOTALS & SUMMARY SECTION */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start mb-6 print-page-break-inside-avoid">
                  {/* Left: Amount in Words & Notes */}
                  <div className="sm:col-span-7 space-y-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 print:bg-transparent print:border-slate-300">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Amount in Words:</p>
                      <p className="text-xs font-bold text-slate-900 mt-1 italic leading-relaxed">
                        {numberToWordsIndian(total)}
                      </p>
                    </div>

                    {/* Mode of Payment summary */}
                    {invoice.payments && invoice.payments.length > 0 && (
                      <div className="border border-slate-200 rounded-lg p-3 print:border-slate-300">
                        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center">
                          <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Payment Transactions Received:
                        </p>
                        <div className="space-y-1.5 text-xs">
                          {invoice.payments.map((p: any, i: number) => (
                            <div key={p.id || i} className="flex justify-between items-center text-slate-700 bg-white p-1.5 rounded border border-slate-100 print:border-none print:p-0">
                              <span className="font-medium">
                                {new Date(p.date).toLocaleDateString('en-IN')} via <strong className="text-slate-900">{p.method}</strong>
                              </span>
                              <span className="font-mono font-bold text-emerald-700">
                                ₹{parseFloat(p.amount).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Financial Math Box */}
                  <div className="sm:col-span-5 bg-slate-50 border border-slate-300 rounded-xl p-4 space-y-2 text-xs print:bg-white print:border-slate-400">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal Amount:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <span>Taxes / GST ({taxRate}%):</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {taxRate > 0 
                          ? `₹${taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                          : '₹0.00 (Exempt)'}
                      </span>
                    </div>

                    <div className="border-t border-slate-300 pt-2 flex justify-between items-center">
                      <span className="font-bold text-slate-900 text-sm">Grand Total:</span>
                      <span className="font-mono font-black text-slate-900 text-base">
                        ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-emerald-700 pt-1">
                      <span className="font-semibold">Total Paid:</span>
                      <span className="font-mono font-bold">
                        ₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="border-t-2 border-slate-900 pt-2.5 flex justify-between items-center">
                      <span className="font-black text-slate-900 uppercase tracking-wide">
                        {balanceDue <= 0.01 ? 'Balance Status:' : 'Balance Due:'}
                      </span>
                      <span className={`font-mono font-black text-base ${balanceDue <= 0.01 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {balanceDue <= 0.01 ? '₹0.00 (Settled)' : `₹${balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. TERMS & OFFICIAL SIGNATURE BLOCK */}
                <div className="border-t-2 border-slate-200 pt-6 mt-6 print-page-break-inside-avoid">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-end">
                    {/* Terms */}
                    <div className="text-[10px] text-slate-500 space-y-1">
                      <p className="font-bold text-slate-700 uppercase tracking-wider">Terms & Guidelines:</p>
                      <p>1. Check-out time is {settings.checkout_time || '11:00 AM'}. Extension requires prior registration desk approval.</p>
                      <p>2. Please maintain peace, cleanliness, and the sacred ambiance of the Dharamshala.</p>
                      <p>3. This is a computer-generated tax invoice and valid proof of stay.</p>
                      <p className="text-amber-800 font-semibold pt-1">
                        🙏 Thank you for staying with us. Shubh Yatra!
                      </p>
                    </div>

                    {/* Signature lines */}
                    <div className="flex justify-between sm:justify-end sm:space-x-12 text-center pt-8 sm:pt-0">
                      <div>
                        <div className="w-32 border-b border-slate-400 mb-1.5 mx-auto"></div>
                        <p className="text-[11px] font-bold text-slate-700">Guest Signature</p>
                      </div>

                      <div>
                        <div className="w-40 border-b border-slate-400 mb-1.5 mx-auto"></div>
                        <p className="text-[11px] font-bold text-slate-700">Authorized Signatory</p>
                        <p className="text-[9px] text-slate-500 uppercase">{settings.dharamshala_name || 'Management Office'}</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
              {/* END OF INVOICE PRINT AREA */}

              {/* MANAGEMENT ACTIONS (HIDDEN IN PRINT) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
                
                {/* A. Smart Add Extra Charge */}
                {!isFullyPaid && (
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center">
                        <PlusCircle className="w-4 h-4 mr-1.5 text-primary-600" />
                        Add Extra Charges / Bhojanalay
                      </h4>
                      <span className="text-xs text-slate-400 font-medium">Instant Folio Update</span>
                    </div>

                    {/* Presets Bar */}
                    <div className="flex flex-wrap gap-1.5">
                      {['Custom', 'Breakfast', 'Lunch', 'Dinner', 'Extra Bed', 'Laundry'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setChargeType(preset)}
                          className={`text-xs px-2.5 py-1 rounded-md font-medium transition ${
                            chargeType === preset 
                              ? 'bg-slate-900 text-white shadow-sm' 
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    <form onSubmit={handleAddCharge} className="space-y-3">
                      {chargeType === 'Custom' ? (
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Charge Description</label>
                          <input 
                            type="text" 
                            value={chargeDesc}
                            onChange={e => setChargeDesc(e.target.value)}
                            placeholder="E.g. Extra Blanket, Temple Pooja Contribution" 
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            required
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity / Persons</label>
                            <input 
                              type="number" 
                              min="1"
                              value={chargeQty}
                              onChange={e => setChargeQty(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Unit Rate</label>
                            <div className="px-3 py-2 text-sm border border-slate-200 bg-slate-50 rounded-lg text-slate-700 font-mono">
                              ₹{mealRates[chargeType] || 0} / unit
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-3 pt-1">
                        <div className="relative flex-1">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-sm">₹</span>
                          <input 
                            type="number" 
                            step="0.01" 
                            value={chargeAmount}
                            onChange={e => setChargeAmount(e.target.value)}
                            placeholder="0.00" 
                            className={`w-full pl-7 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono font-bold ${chargeType !== 'Custom' ? 'bg-slate-50' : ''}`}
                            readOnly={chargeType !== 'Custom'}
                            required
                          />
                        </div>
                        <button 
                          type="submit" 
                          disabled={addingCharge} 
                          className="bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition flex items-center shrink-0 disabled:opacity-50"
                        >
                          {addingCharge ? 'Adding...' : 'Add to Bill'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* B. Record Payment Form */}
                {!isFullyPaid && (
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center">
                        <CreditCard className="w-4 h-4 mr-1.5 text-emerald-600" />
                        Record Guest Payment
                      </h4>
                      <span className="text-xs text-rose-600 font-bold">Due: ₹{balanceDue.toFixed(2)}</span>
                    </div>

                    <form onSubmit={handlePayment} className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-semibold text-slate-600">Payment Amount (₹)</label>
                          <button
                            type="button"
                            onClick={() => setPaymentAmount(balanceDue.toFixed(2))}
                            className="text-[11px] text-primary-600 hover:text-primary-800 font-semibold underline"
                          >
                            Pay Full Balance (₹{balanceDue.toFixed(2)})
                          </button>
                        </div>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-mono text-sm">₹</span>
                          <input 
                            type="number" 
                            step="0.01" 
                            required 
                            max={balanceDue > 0 ? balanceDue : undefined}
                            value={paymentAmount} 
                            onChange={e => setPaymentAmount(e.target.value)} 
                            className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono text-sm font-bold" 
                            placeholder={balanceDue.toFixed(2)}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Method</label>
                        <select 
                          value={paymentMethod} 
                          onChange={e => setPaymentMethod(e.target.value)} 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                        >
                          <option value="Cash">Cash at Counter</option>
                          <option value="UPI">UPI / QR Code</option>
                          <option value="Card">Debit / Credit Card (POS)</option>
                          <option value="Net Banking">Net Banking / Direct Transfer</option>
                        </select>
                      </div>

                      <button 
                        type="submit" 
                        disabled={processing || !paymentAmount || parseFloat(paymentAmount) <= 0} 
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
                      >
                        <IndianRupee className="w-4 h-4" />
                        <span>{processing ? 'Recording Payment...' : `Receive Payment of ₹${paymentAmount || '0'}`}</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* If already fully paid */}
                {isFullyPaid && (
                  <div className="md:col-span-2 bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                    <h4 className="text-base font-bold text-emerald-900">Invoice Fully Settled</h4>
                    <p className="text-xs text-emerald-700 max-w-md mx-auto">
                      All accommodation and food charges have been paid in full. You can print the official receipt for the guest.
                    </p>
                  </div>
                )}

              </div>

            </div>
          )}
        </div>

        {/* Modal Bottom Footer (Hidden in Print) */}
        <div className="border-t border-slate-200 px-6 py-3.5 bg-white flex items-center justify-between no-print">
          <p className="text-xs text-slate-500">
            Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[11px] font-mono">Ctrl/Cmd + P</kbd> or click Print for clean A4 receipt.
          </p>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => window.print()} 
              disabled={loading || !invoice}
              className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 font-semibold text-sm px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Folio</span>
            </button>
            <button 
              onClick={onClose} 
              className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
