import React, { useMemo } from 'react';
import { useApp } from '../store';
import { formatCurrency } from '../lib/utils';
import { isPast, parseISO, isBefore, addDays, format } from 'date-fns';
import { id } from 'date-fns/locale';

export function DueInvoices() {
  const { invoices } = useApp();

  const dueInvoices = useMemo(() => {
    const now = new Date();
    return invoices
      .filter(inv => inv.status !== 'PAID')
      .filter(inv => {
        const dueDate = parseISO(inv.dueDate);
        return !isPast(dueDate) && isBefore(dueDate, addDays(now, 14));
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [invoices]);

  const totalAmount = dueInvoices.reduce((sum, inv) => sum + (inv.amount - inv.paidAmount), 0);

  return (
    <div className="flex flex-col space-y-4 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Faktur Akan Jatuh Tempo</h2>
          <p className="text-[10px] uppercase text-slate-400 font-bold mt-1">Daftar faktur jatuh tempo dalam 14 hari</p>
        </div>
        <div className="bg-amber-50 text-amber-800 px-4 py-3 rounded-lg border border-amber-200 shadow-sm flex items-center space-x-4">
          <p className="text-[10px] uppercase font-bold text-amber-600/70">Total Tagihan Mendatang</p>
          <p className="text-xl font-mono font-bold">{formatCurrency(totalAmount)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead className="bg-slate-100 text-slate-500 font-bold border-b border-slate-200 sticky top-0">
              <tr>
                <th className="p-3">JATUH TEMPO</th>
                <th className="p-3">NO. FAKTUR</th>
                <th className="p-3">SUPPLIER</th>
                <th className="p-3 text-right">SISA TAGIHAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dueInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-indigo-50/30 transition-colors bg-white">
                  <td className="p-3 font-medium text-amber-600">
                    {format(parseISO(inv.dueDate), 'dd MMM yyyy', { locale: id })}
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
              ))}
              {dueInvoices.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    Tidak ada faktur yang akan jatuh tempo dalam waktu dekat.
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
