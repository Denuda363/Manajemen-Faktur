import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../store';
import { formatCurrency } from '../lib/utils';
import { CheckCircle2, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export function Payments() {
  const { invoices, addPayment } = useApp();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const unpaidInvoices = useMemo(() => {
    return invoices.filter(inv => inv.status !== 'PAID');
  }, [invoices]);

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ 
      invoiceNumber: 'INV-2023-001', 
      amount: 1500000
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments Template");
    XLSX.writeFile(wb, "Template_Pembayaran.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any>(ws);

        const newSelectedIds = new Set(selectedIds);
        const newPaymentAmounts = { ...paymentAmounts };
        
        let count = 0;
        let notFound = 0;

        rows.forEach(row => {
          if (!row.invoiceNumber || !row.amount) return;
          
          const invNumber = row.invoiceNumber.toString();
          const amount = Number(row.amount);
          
          const invoice = unpaidInvoices.find(i => i.invoiceNumber === invNumber);
          
          if (invoice && amount > 0 && amount <= (invoice.amount - invoice.paidAmount)) {
            newSelectedIds.add(invoice.id);
            newPaymentAmounts[invoice.id] = amount;
            count++;
          } else {
            notFound++;
          }
        });

        setSelectedIds(newSelectedIds);
        setPaymentAmounts(newPaymentAmounts);

        if (count > 0) {
          alert(`Berhasil memilih ${count} faktur untuk dibayar.` + (notFound > 0 ? ` (${notFound} baris tidak valid atau sudah lunas)` : ''));
        } else {
          alert('Tidak ada data pembayaran yang valid ditemukan.');
        }
      } catch (error) {
        console.error(error);
        alert('Gagal membaca file Excel. Pastikan format sesuai template.');
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleToggleSelect = (id: string, maxAmount: number) => {
    const newSelected = new Set(selectedIds);
    const newAmounts = { ...paymentAmounts };
    
    if (newSelected.has(id)) {
      newSelected.delete(id);
      delete newAmounts[id];
    } else {
      newSelected.add(id);
      newAmounts[id] = maxAmount;
    }
    
    setSelectedIds(newSelected);
    setPaymentAmounts(newAmounts);
  };

  const handleAmountChange = (id: string, amount: number) => {
    setPaymentAmounts({ ...paymentAmounts, [id]: amount });
  };

  const totalPayment = (Object.values(paymentAmounts) as number[]).reduce((sum, val) => sum + val, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.size === 0) return;
    
    // Validate amounts
    let isValid = true;
    for (const id of selectedIds) {
      const inv = invoices.find(i => i.id === id);
      if (!inv || paymentAmounts[id] <= 0 || paymentAmounts[id] > (inv.amount - inv.paidAmount)) {
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
          <h2 className="text-xl font-bold text-slate-800">Pembayaran Faktur</h2>
          <p className="text-[10px] uppercase text-slate-400 font-bold mt-1">Pilih faktur dan masukkan jumlah yang akan dibayar</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={downloadTemplate}
            className="px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-xs font-bold rounded shadow-sm hover:bg-slate-50 flex items-center space-x-1 transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>Template</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-bold rounded shadow-sm hover:bg-indigo-100 flex items-center space-x-1 transition-colors"
          >
            <Upload className="w-3 h-3" />
            <span>Import</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".xlsx, .xls" 
            className="hidden" 
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col">
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

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[800px]">
              <thead className="bg-slate-100 text-slate-500 font-bold border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="p-3 w-8 text-center">PILIH</th>
                  <th className="p-3">NO. FAKTUR</th>
                  <th className="p-3">SUPPLIER</th>
                  <th className="p-3 text-right">TOTAL</th>
                  <th className="p-3 text-right">SISA TAGIHAN</th>
                  <th className="p-3 w-48 text-right">JUMLAH DIBAYAR (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unpaidInvoices.map((inv) => {
                  const isSelected = selectedIds.has(inv.id);
                  const remaining = inv.amount - inv.paidAmount;
                  
                  return (
                    <tr 
                      key={inv.id} 
                      className={`transition-colors bg-white
                        ${isSelected ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}
                      `}
                    >
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => handleToggleSelect(inv.id, remaining)}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="p-3 font-mono font-bold text-indigo-600">
                        {inv.invoiceNumber}
                      </td>
                      <td className="p-3 font-medium text-slate-700">
                        {inv.supplierName}
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
                {unpaidInvoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Tidak ada faktur yang belum dibayar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Summary Bar */}
          <div className="p-3 border-t border-slate-100 bg-slate-900 text-white flex items-center justify-between shrink-0 sticky bottom-0 z-10">
            <div className="text-[11px] font-medium">
              Menampilkan <span className="text-indigo-300">{unpaidInvoices.length}</span> faktur belum lunas
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
