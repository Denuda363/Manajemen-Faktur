import React, { useMemo } from 'react';
import { useApp } from '../store';
import { formatCurrency } from '../lib/utils';
import { isPast, parseISO, format, differenceInDays } from 'date-fns';
import { id } from 'date-fns/locale';

export function OverdueInvoices() {
  const { invoices } = useApp();

  const overdueInvoices = useMemo(() => {
    return invoices
      .filter(inv => inv.status !== 'PAID')
      .filter(inv => isPast(parseISO(inv.dueDate)))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [invoices]);

  const totalAmount = overdueInvoices.reduce((sum, inv) => sum + (inv.amount - inv.paidAmount), 0);
  const now = new Date();

  return (
    <div className="flex flex-col space-y-4 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Faktur Lewat Jatuh Tempo</h2>
          <p className="text-[10px] uppercase text-slate-400 font-bold mt-1">Daftar faktur yang sudah melewati tanggal jatuh tempo</p>
        </div>
        <div className="bg-rose-50 text-rose-800 px-4 py-3 rounded-lg border border-rose-200 shadow-sm flex items-center space-x-4">
          <p className="text-[10px] uppercase font-bold text-rose-600/70">Total Tagihan Tertunggak</p>
          <p className="text-xl font-mono font-bold">{formatCurrency(totalAmount)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-100 text-slate-500 font-bold border-b border-slate-200 sticky top-0">
              <tr>
                <th className="p-3">JATUH TEMPO</th>
                <th className="p-3 text-center">KETERLAMBATAN</th>
                <th className="p-3">NO. FAKTUR</th>
                <th className="p-3">SUPPLIER</th>
                <th className="p-3 text-right">SISA TAGIHAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {overdueInvoices.map((inv) => {
                const dueDate = parseISO(inv.dueDate);
                const daysLate = differenceInDays(now, dueDate);
                
                return (
                  <tr key={inv.id} className="hover:bg-indigo-50/30 transition-colors bg-white">
                    <td className="p-3 font-bold text-rose-500 italic">
                      {format(dueDate, 'dd MMM yyyy', { locale: id })}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-[10px] font-bold uppercase">
                        {daysLate} Hari
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-indigo-600">
                      {inv.invoiceNumber}
                    </td>
                    <td className="p-3 font-medium text-slate-700">
                      {inv.supplierName}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-800">
                      {formatCurrency(inv.amount - inv.paidAmount)}
                    </td>
                  </tr>
                );
              })}
              {overdueInvoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Tidak ada faktur yang lewat jatuh tempo. Bagus!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
