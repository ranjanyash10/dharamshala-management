import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../store/useAuth';
import { IndianRupee, Printer, TrendingUp, TrendingDown, ArrowRight, PieChart, Building2 } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function Reports() {
  const token = useAuth(state => state.token);
  
  // Default to first of current month and today
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/v1/reports/summary?start_date=${startDate}&end_date=${endDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReport(res.data);
    } catch (err) {
      console.error("Failed to load report", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <h1 className="text-2xl font-bold text-slate-900">Financial Reports</h1>
        <button 
          onClick={() => window.print()} 
          className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition"
        >
          <Printer className="w-4 h-4 mr-2" /> Print Statement
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-end space-x-4 no-print">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Start Date</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">End Date</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
          />
        </div>
        <button 
          onClick={fetchReport}
          disabled={loading}
          className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition h-[38px] flex items-center"
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {/* Printable Area */}
      <div id="print-area" className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm print:shadow-none print:border-none print:p-0">
        <div className="text-center mb-8 border-b border-slate-200 pb-6 print:border-slate-800">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Dharamshala Management</h2>
          <p className="text-slate-500 font-medium">Income & Expense Statement</p>
          <div className="mt-2 inline-flex items-center px-3 py-1 bg-slate-100 rounded-full text-sm font-bold text-slate-700">
            {new Date(startDate).toLocaleDateString()} <ArrowRight className="w-4 h-4 mx-2 text-slate-400" /> {new Date(endDate).toLocaleDateString()}
          </div>
        </div>

        {report && (
          <div className="space-y-8">
            
            {/* Top Level KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl print:border-slate-400">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center mb-1">
                  <TrendingUp className="w-4 h-4 mr-1 text-emerald-500" /> Total Revenue
                </p>
                <h3 className="text-2xl font-black text-slate-900 flex items-center font-mono">
                  <IndianRupee className="w-5 h-5 mr-1" /> {report.total_revenue.toFixed(2)}
                </h3>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl print:border-slate-400">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center mb-1">
                  <TrendingDown className="w-4 h-4 mr-1 text-rose-500" /> Total Expenses
                </p>
                <h3 className="text-2xl font-black text-slate-900 flex items-center font-mono">
                  <IndianRupee className="w-5 h-5 mr-1" /> {report.total_expenses.toFixed(2)}
                </h3>
              </div>

              <div className={`border p-5 rounded-xl ${report.net_income >= 0 ? 'bg-emerald-50 border-emerald-200 print:border-slate-400' : 'bg-rose-50 border-rose-200 print:border-slate-400'}`}>
                <p className={`text-sm font-bold uppercase tracking-wider flex items-center mb-1 ${report.net_income >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  Net Income (Profit / Loss)
                </p>
                <h3 className={`text-2xl font-black flex items-center font-mono ${report.net_income >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  <IndianRupee className="w-5 h-5 mr-1" /> {report.net_income.toFixed(2)}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Revenue Breakdown */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center border-b border-slate-200 pb-2 print:border-slate-800">
                  <PieChart className="w-4 h-4 mr-2 text-primary-500" /> Revenue by Payment Method
                </h4>
                {Object.keys(report.method_breakdown).length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No revenue recorded in this period.</p>
                ) : (
                  <table className="min-w-full">
                    <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                      {Object.entries(report.method_breakdown).map(([method, amount]: [string, any]) => (
                        <tr key={method}>
                          <td className="py-2 text-sm font-medium text-slate-700 print:text-slate-900">{method}</td>
                          <td className="py-2 text-sm font-bold text-slate-900 text-right font-mono print:text-slate-900">₹{amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-slate-200 print:border-slate-800">
                      <tr>
                        <td className="py-2 text-sm font-bold text-slate-800">Total</td>
                        <td className="py-2 text-sm font-bold text-emerald-600 text-right font-mono print:text-slate-900">₹{report.total_revenue.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>

              {/* Expense Breakdown */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center border-b border-slate-200 pb-2 print:border-slate-800">
                  <PieChart className="w-4 h-4 mr-2 text-rose-500" /> Expense Breakdown
                </h4>
                {Object.keys(report.expense_breakdown).length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No expenses recorded in this period.</p>
                ) : (
                  <table className="min-w-full">
                    <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                      {Object.entries(report.expense_breakdown).map(([cat, amount]: [string, any]) => (
                        <tr key={cat}>
                          <td className="py-2 text-sm font-medium text-slate-700 print:text-slate-900">{cat}</td>
                          <td className="py-2 text-sm font-bold text-slate-900 text-right font-mono print:text-slate-900">₹{amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t-2 border-slate-200 print:border-slate-800">
                      <tr>
                        <td className="py-2 text-sm font-bold text-slate-800">Total</td>
                        <td className="py-2 text-sm font-bold text-rose-600 text-right font-mono print:text-slate-900">₹{report.total_expenses.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </div>

            <div className="pt-12 text-center text-xs text-slate-400 print:block">
              Generated on {new Date().toLocaleString()} by Dharamshala Management System
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
