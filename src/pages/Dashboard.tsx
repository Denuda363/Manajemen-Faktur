import React, { useMemo } from 'react';
import { useApp } from '../store';
import { formatCurrency } from '../lib/utils';
import { isPast, parseISO, isBefore, addDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function Dashboard() {
  const { invoices } = useApp();

  const now = new Date();

  const totalInvoices = invoices.length;
  const unpaidInvoices = invoices.filter(inv => inv.status !== 'PAID');
  
  const overdueInvoices = unpaidInvoices.filter(inv => isPast(parseISO(inv.dueDate)));
  const dueSoonInvoices = unpaidInvoices.filter(inv => {
    const dueDate = parseISO(inv.dueDate);
    return !isPast(dueDate) && isBefore(dueDate, addDays(now, 7));
  });

  const totalUnpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + (inv.amount - inv.paidAmount), 0);
  const totalOverdueAmount = overdueInvoices.reduce((sum, inv) => sum + (inv.amount - inv.paidAmount), 0);
  const totalDueSoonAmount = dueSoonInvoices.reduce((sum, inv) => sum + (inv.amount - inv.paidAmount), 0);
  const totalPaidAmount = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

  // Generate chart data grouped by supplier
  const chartData = useMemo(() => {
    const supplierMap = new Map<string, { name: string; unpaid: number; paid: number }>();
    
    invoices.forEach(inv => {
      const existing = supplierMap.get(inv.supplierName) || { name: inv.supplierName, unpaid: 0, paid: 0 };
      existing.paid += inv.paidAmount;
      existing.unpaid += (inv.amount - inv.paidAmount);
      supplierMap.set(inv.supplierName, existing);
    });

    return Array.from(supplierMap.values())
      .sort((a, b) => b.unpaid - a.unpaid)
      .slice(0, 5); // Top 5 suppliers with most debt
  }, [invoices]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-bold text-slate-800 text-xs mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between space-x-4 text-[10px]">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-500">{entry.name}:</span>
              </div>
              <span className="font-mono font-bold text-slate-800">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col space-y-4 pb-6">
      {/* Top KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Total Tunggakan</p>
          <p className="text-xl font-mono font-bold text-slate-800">{formatCurrency(totalUnpaidAmount)}</p>
          <p className="text-[10px] text-slate-500 mt-1">{unpaidInvoices.length} Faktur Pending</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Jatuh Tempo (7 Hari)</p>
          <p className="text-xl font-mono font-bold text-amber-600">{formatCurrency(totalDueSoonAmount)}</p>
          <p className="text-[10px] text-slate-500 mt-1">{dueSoonInvoices.length} Faktur Pending</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Lewat Jatuh Tempo</p>
          <p className="text-xl font-mono font-bold text-rose-600">{formatCurrency(totalOverdueAmount)}</p>
          <p className="text-[10px] text-slate-500 mt-1">{overdueInvoices.length} Faktur Berisiko</p>
        </div>
        <div className="bg-indigo-600 p-4 rounded-lg border border-indigo-700 shadow-sm text-white">
          <p className="text-[10px] uppercase text-indigo-200 font-bold mb-1 text-center">Total Terbayar</p>
          <p className="text-xl font-mono font-bold text-white text-center">{formatCurrency(totalPaidAmount)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart Area */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm p-4 flex flex-col min-h-[300px]">
           <h3 className="text-xs font-bold text-slate-700 uppercase mb-4">Top 5 Supplier (Hutang Tertinggi)</h3>
           <div className="flex-1 w-full min-h-0">
             {chartData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                   <YAxis hide={true} />
                   <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                   <Bar dataKey="unpaid" name="Tunggakan" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                   <Bar dataKey="paid" name="Terbayar" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                 </BarChart>
               </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-xs text-slate-400">
                 Belum ada data untuk ditampilkan
               </div>
             )}
           </div>
        </div>
        
        {/* List Recent */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
            <h3 className="text-xs font-bold text-slate-700 uppercase">Faktur Terbaru</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-0">
            <ul className="divide-y divide-slate-100">
               {invoices.slice(-5).reverse().map((inv) => (
                 <li key={inv.id} className="p-3 hover:bg-slate-50 transition-colors">
                   <div className="flex items-center justify-between mb-1">
                     <span className="text-[10px] font-mono font-bold text-indigo-600">{inv.invoiceNumber}</span>
                     <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase
                        ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 
                          inv.status === 'PARTIAL' ? 'bg-amber-100 text-amber-700' : 
                          'bg-rose-100 text-rose-700'}
                      `}>
                        {inv.status === 'PAID' ? 'LUNAS' : inv.status === 'PARTIAL' ? 'SEBAGIAN' : 'BELUM BAYAR'}
                      </span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-xs font-medium text-slate-700 truncate mr-2">{inv.supplierName}</span>
                     <span className="text-xs font-mono font-bold text-slate-800 shrink-0">{formatCurrency(inv.amount)}</span>
                   </div>
                 </li>
               ))}
               {invoices.length === 0 && (
                 <li className="p-8 text-center text-xs text-slate-500">
                   Belum ada data faktur.
                 </li>
               )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
