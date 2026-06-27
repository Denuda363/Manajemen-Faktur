import React, { useState, useMemo } from 'react';
import { useApp } from '../store';
import { formatCurrency } from '../lib/utils';
import { isPast, parseISO, format, differenceInDays } from 'date-fns';
import { id } from 'date-fns/locale';

export function OverdueInvoices() {
  const { invoices, addPayment } = useApp();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, number>>({});

  const overdueInvoices = useMemo(() => {
    return invoices
      .filter(inv => inv.status !== 'PAID')
      .filter(inv => isPast(parseISO(inv.dueDate)))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [invoices]);

  const groupedInvoices = useMemo(() => {
    const groups: Record<string, typeof overdueInvoices> = {};
    overdueInvoices.forEach(inv => {
      if (!groups[inv.supplierName]) groups[inv.supplierName] = [];
      groups[inv.supplierName].push(inv);
    });
    return groups;
  }, [overdueInvoices]);

  const totalAmount = overdueInvoices.reduce((sum, inv) => sum + (inv.amount - inv.paidAmount), 0);
  const totalPayment = (Object.values(paymentAmounts) as number[]).reduce((sum, val) => sum + val, 0);
  const now = new Date();

  const handleToggleSelect = (invId: string, maxAmount: number) => {
    const newSelected = new Set(selectedIds);
    const newAmounts = { ...paymentAmounts };
    
    if (newSelected.has(invId)) {
      newSelected.delete(invId);
      delete newAmounts[invId];
    } else {
      newSelected.add(invId);
      newAmounts[invId] = maxAmount;
    }
    
    setSelectedIds(newSelected);
    setPaymentAmounts(newAmounts);
  };

  const handleAmountChange = (invId: string, amount: number) => {
    setPaymentAmounts({ ...paymentAmounts, [invId]: amount });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.size === 0) return;
    
    let isValid = true;
    for (const invId of selectedIds) {
      const inv = invoices.find(i => i.id === invId);
      if (!inv || paymentAmounts[invId] <= 0 || paymentAmounts[invId] > (inv.amount - inv.paidAmount)) {
        isValid = false;
        break;
      }
    }

    if (!isValid) {
      alert("Jumlah pembayaran tidak valid. Pastikan lebih dari 0 dan tidak melebihi sisa tagihan.");
      return;
    }

    addPayment(Array.from(selectedIds), paymentAmounts);
    setSelectedIds(new Set());
    setPaymentAmounts({});
    alert("Pembayaran berhasil dicatat!");
  };

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

      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10">
            <div className="flex space-x-2">
              <button 
                type="submit" 
                disabled={selectedIds.size === 0}
                className={`px-3 py-1.5 text-xs font-bold rounded shadow-sm transition-colors
                  ${selectedIds.size > 0 ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                Bayar Terpilih ({selectedIds.size})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[900px]">
              <thead className="bg-slate-100 text-slate-500 font-bold border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="p-3 w-8 text-center">PILIH</th>
                  <th className="p-3">TGL FAKTUR</th>
                  <th className="p-3">JATUH TEMPO</th>
                  <th className="p-3 text-center">KETERLAMBATAN</th>
                  <th className="p-3">NO. FAKTUR</th>
                  <th className="p-3 text-right">TOTAL</th>
                  <th className="p-3 text-right">SISA TAGIHAN</th>
                  <th className="p-3 w-48 text-right">JUMLAH DIBAYAR (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(groupedInvoices).map(([supplierName, groupInvoices]) => (
                  <React.Fragment key={supplierName}>
                    <tr className="bg-slate-50/50 border-y border-slate-200">
                      <td colSpan={8} className="p-3 font-bold text-slate-700">
                        {supplierName}
                      </td>
                    </tr>
                    {groupInvoices.map((inv) => {
                      const dueDate = parseISO(inv.dueDate);
                      const daysLate = differenceInDays(now, dueDate);
                      const isSelected = selectedIds.has(inv.id);
                      const remaining = inv.amount - inv.paidAmount;
                      
                      return (
                        <tr key={inv.id} className={`transition-colors bg-white ${isSelected ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}>
                          <td className="p-3 text-center">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => handleToggleSelect(inv.id, remaining)}
                              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="p-3 font-medium text-slate-600">
                            {format(parseISO(inv.date), 'dd MMM yyyy', { locale: id })}
                          </td>
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
                          <td className="p-3 text-right font-mono text-slate-500">
                            {formatCurrency(inv.amount)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-800">
                            {formatCurrency(remaining)}
                          </td>
                          <td className="p-3 text-right">
                            {isSelected ? (
                              <input 
                                type="number" 
                                min="1"
                                max={remaining}
                                required
                                value={paymentAmounts[inv.id] || ''}
                                onChange={(e) => handleAmountChange(inv.id, Number(e.target.value))}
                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono text-right"
                              />
                            ) : (
                              <span className="text-slate-300 font-mono">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
                {overdueInvoices.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      Tidak ada faktur yang lewat jatuh tempo. Bagus!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-900 text-white flex items-center justify-between shrink-0 sticky bottom-0 z-10">
            <div className="text-[11px] font-medium">
              Menampilkan <span className="text-rose-400">{overdueInvoices.length}</span> faktur tertunggak
            </div>
            <div className="flex items-center space-x-6 text-[11px] font-bold">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400 font-normal uppercase">Pilihan:</span>
                <span className="text-indigo-300">{selectedIds.size} Faktur</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-400 font-normal uppercase">Estimasi Bayar:</span>
                <span className="text-emerald-400 font-mono text-xs">{formatCurrency(totalPayment)}</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
