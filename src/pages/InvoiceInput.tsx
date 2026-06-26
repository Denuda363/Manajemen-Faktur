import React, { useState, useRef } from 'react';
import { useApp } from '../store';
import { Plus, Trash2, Save, Building2, Upload, Download, Edit2, X } from 'lucide-react';
import { Invoice } from '../types';
import { addDays, parseISO, format } from 'date-fns';
import * as XLSX from 'xlsx';

interface InvoiceFormItem {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDateMode: 'date' | 'terms';
  dueDate: string;
  terms: number;
  subtotal: number;
  returnAmount: number;
  taxRate: number;
  paymentMethod: 'CASH' | 'TERM';
  description: string;
}

interface SupplierGroup {
  id: string;
  supplierName: string;
  invoices: InvoiceFormItem[];
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const createEmptyInvoice = (): InvoiceFormItem => ({
  id: generateId(),
  invoiceNumber: '',
  date: new Date().toISOString().split('T')[0],
  dueDateMode: 'terms',
  dueDate: '',
  terms: 30,
  subtotal: 0,
  returnAmount: 0,
  taxRate: 11,
  paymentMethod: 'TERM',
  description: ''
});

export function InvoiceInput() {
  const { invoices, addInvoices, updateInvoice, deleteInvoice, suppliers } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [groups, setGroups] = useState<SupplierGroup[]>([
    {
      id: generateId(),
      supplierName: '',
      invoices: [createEmptyInvoice()]
    }
  ]);
  
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Invoice>>({});

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ 
      supplierName: 'PT Contoh', 
      invoiceNumber: 'INV-2023-001', 
      date: '2023-10-01', 
      dueDateMode: 'terms',
      dueDate: '2023-10-31', 
      terms: 30, 
      subtotal: 1500000, 
      returnAmount: 200000,
      taxRate: 11,
      paymentMethod: 'TERM',
      description: 'Barang A' 
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoices Template");
    XLSX.writeFile(wb, "Template_Invoice.xlsx");
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

        // Group rows by supplierName
        const supplierGroups = new Map<string, InvoiceFormItem[]>();
        
        rows.forEach(row => {
          if (!row.supplierName || !row.invoiceNumber || !(row.subtotal || row.amount)) return;
          
          const sName = row.supplierName.toString();
          if (!supplierGroups.has(sName)) {
            supplierGroups.set(sName, []);
          }
          
          supplierGroups.get(sName)!.push({
            id: generateId(),
            invoiceNumber: row.invoiceNumber.toString(),
            date: row.date ? new Date(row.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            dueDateMode: row.dueDateMode === 'date' ? 'date' : 'terms',
            dueDate: row.dueDate ? new Date(row.dueDate).toISOString().split('T')[0] : '',
            terms: Number(row.terms) || 30,
            subtotal: Number(row.subtotal || row.amount) || 0,
            returnAmount: Number(row.returnAmount) || 0,
            taxRate: row.taxRate !== undefined ? Number(row.taxRate) : 11,
            paymentMethod: row.paymentMethod === 'CASH' ? 'CASH' : 'TERM',
            description: row.description || ''
          });
        });

        const newGroups: SupplierGroup[] = Array.from(supplierGroups.entries()).map(([name, invs]) => ({
          id: generateId(),
          supplierName: name,
          invoices: invs
        }));

        if (newGroups.length > 0) {
          setGroups(newGroups);
          alert(`Berhasil mengimpor ${rows.length} faktur`);
        } else {
          alert('Tidak ada data yang valid ditemukan.');
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

  const handleAddGroup = () => {
    setGroups([...groups, {
      id: generateId(),
      supplierName: '',
      invoices: [createEmptyInvoice()]
    }]);
  };

  const handleRemoveGroup = (groupId: string) => {
    setGroups(groups.filter(g => g.id !== groupId));
  };

  const handleGroupNameChange = (groupId: string, name: string) => {
    setGroups(groups.map(g => g.id === groupId ? { ...g, supplierName: name } : g));
  };

  const handleAddInvoice = (groupId: string) => {
    setGroups(groups.map(g => g.id === groupId ? {
      ...g,
      invoices: [...g.invoices, createEmptyInvoice()]
    } : g));
  };

  const handleRemoveInvoice = (groupId: string, invoiceId: string) => {
    setGroups(groups.map(g => {
      if (g.id === groupId) {
        return { ...g, invoices: g.invoices.filter(i => i.id !== invoiceId) };
      }
      return g;
    }));
  };

  const handleInvoiceChange = (groupId: string, invoiceId: string, field: keyof InvoiceFormItem, value: any) => {
    setGroups(groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          invoices: g.invoices.map(inv => inv.id === invoiceId ? { ...inv, [field]: value } : inv)
        };
      }
      return g;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const allInvoicesToSave: Omit<Invoice, 'id' | 'paidAmount' | 'status'>[] = [];
    let isValid = true;

    for (const group of groups) {
      if (!group.supplierName) {
        isValid = false;
        break;
      }
      for (const inv of group.invoices) {
        if (!inv.invoiceNumber || !inv.date || inv.subtotal <= 0) {
          isValid = false;
          break;
        }

        let finalDueDate = inv.dueDate;
        if (inv.dueDateMode === 'terms') {
          if (!inv.date) {
             isValid = false;
             break;
          }
          finalDueDate = format(addDays(parseISO(inv.date), inv.terms), 'yyyy-MM-dd');
        } else if (!inv.dueDate) {
          isValid = false;
          break;
        }
        
        const subtotal = inv.subtotal || 0;
        const returnAmt = inv.returnAmount || 0;
        const taxRate = inv.taxRate || 0;
        const taxAmount = returnAmt * (taxRate / 100);
        const finalAmount = subtotal - (returnAmt + taxAmount);

        allInvoicesToSave.push({
          invoiceNumber: inv.invoiceNumber,
          supplierName: group.supplierName,
          date: inv.date,
          dueDate: finalDueDate,
          subtotal: subtotal,
          returnAmount: returnAmt,
          taxRate: taxRate,
          taxAmount: taxAmount,
          amount: finalAmount,
          paymentMethod: inv.paymentMethod,
          description: inv.description
        });
      }
    }

    if (!isValid || allInvoicesToSave.length === 0) {
      alert("Mohon lengkapi semua data supplier dan faktur dengan valid.");
      return;
    }
    
    addInvoices(allInvoicesToSave);
    setGroups([{ id: generateId(), supplierName: '', invoices: [createEmptyInvoice()] }]);
    alert("Faktur berhasil disimpan!");
  };

  const totalInvoices = groups.reduce((acc, g) => acc + g.invoices.length, 0);

  const startEdit = (inv: Invoice) => {
    setEditingInvoiceId(inv.id);
    setEditFormData({
      invoiceNumber: inv.invoiceNumber,
      supplierName: inv.supplierName,
      date: inv.date,
      dueDate: inv.dueDate,
      subtotal: inv.subtotal || inv.amount,
      returnAmount: inv.returnAmount,
      taxRate: inv.taxRate,
      amount: inv.amount,
      description: inv.description
    });
  };

  const cancelEdit = () => {
    setEditingInvoiceId(null);
    setEditFormData({});
  };

  const saveEdit = (id: string) => {
    const subtotal = editFormData.subtotal || 0;
    const returnAmt = editFormData.returnAmount || 0;
    const taxRate = editFormData.taxRate || 0;
    const taxAmount = returnAmt * (taxRate / 100);
    const finalAmount = subtotal - (returnAmt + taxAmount);

    updateInvoice(id, {
      ...editFormData,
      taxAmount,
      amount: finalAmount
    });
    setEditingInvoiceId(null);
    setEditFormData({});
  };

  const handleDeleteInvoice = (id: string) => {
    if (window.confirm("Hapus faktur ini?")) {
      deleteInvoice(id);
    }
  };

  return (
    <div className="flex flex-col space-y-4 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Input Faktur Baru</h2>
          <p className="text-[10px] uppercase text-slate-400 font-bold mt-1">Masukkan data faktur dikelompokkan per supplier</p>
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
        <datalist id="suppliers-list">
          {suppliers.map(s => (
            <option key={s.id} value={s.name} />
          ))}
        </datalist>
        <div className="space-y-6">
          {groups.map((group, groupIndex) => (
            <div key={group.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 max-w-md">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    list="suppliers-list"
                    value={group.supplierName}
                    onChange={(e) => handleGroupNameChange(group.id, e.target.value)}
                    placeholder="Nama Supplier (mis. PT Kebayoran)"
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-slate-700 text-sm"
                  />
                </div>
                {groups.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveGroup(group.id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[900px]">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3 w-32">NO. FAKTUR</th>
                      <th className="p-3 w-32">TGL. FAKTUR</th>
                      <th className="p-3 w-40">JATUH TEMPO</th>
                      <th className="p-3 w-28">METODE</th>
                      <th className="p-3 w-32">JML FAKTUR (Rp)</th>
                      <th className="p-3 w-28">RETUR (Rp)</th>
                      <th className="p-3 w-24">PPN RETUR (%)</th>
                      <th className="p-3 w-32">TOTAL (Rp)</th>
                      <th className="p-3 w-40">KETERANGAN</th>
                      <th className="p-3 w-12 text-center">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {group.invoices.map((inv, invIndex) => {
                      const subtotal = inv.subtotal || 0;
                      const retur = inv.returnAmount || 0;
                      const ppn = inv.taxRate || 0;
                      const taxAmount = retur * (ppn / 100);
                      const total = subtotal - (retur + taxAmount);

                      return (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors bg-white">
                        <td className="p-3">
                          <input 
                            type="text" 
                            required
                            value={inv.invoiceNumber}
                            onChange={(e) => handleInvoiceChange(group.id, inv.id, 'invoiceNumber', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-indigo-600 font-bold text-xs"
                            placeholder="INV-..."
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            type="date" 
                            required
                            value={inv.date}
                            onChange={(e) => handleInvoiceChange(group.id, inv.id, 'date', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-600 text-xs"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col space-y-1">
                            <select
                              value={inv.dueDateMode}
                              onChange={(e) => handleInvoiceChange(group.id, inv.id, 'dueDateMode', e.target.value)}
                              className="px-2 py-1 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-600 text-xs w-full"
                            >
                              <option value="terms">Termin (Hari)</option>
                              <option value="date">Tgl Pasti</option>
                            </select>
                            {inv.dueDateMode === 'terms' ? (
                              <input 
                                type="number" 
                                required
                                min="0"
                                value={inv.terms}
                                onChange={(e) => handleInvoiceChange(group.id, inv.id, 'terms', Number(e.target.value))}
                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-600 text-center font-mono text-xs"
                              />
                            ) : (
                              <input 
                                type="date" 
                                required
                                value={inv.dueDate}
                                onChange={(e) => handleInvoiceChange(group.id, inv.id, 'dueDate', e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-600 text-xs"
                              />
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <select
                            value={inv.paymentMethod}
                            onChange={(e) => handleInvoiceChange(group.id, inv.id, 'paymentMethod', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 font-bold text-xs"
                          >
                            <option value="TERM">Tempo</option>
                            <option value="CASH">Tunai</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <input 
                            type="number" 
                            required
                            min="1"
                            value={inv.subtotal || ''}
                            onChange={(e) => handleInvoiceChange(group.id, inv.id, 'subtotal', Number(e.target.value))}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-800 text-xs"
                            placeholder="0"
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            type="number" 
                            min="0"
                            value={inv.returnAmount || ''}
                            onChange={(e) => handleInvoiceChange(group.id, inv.id, 'returnAmount', Number(e.target.value))}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-800 text-xs"
                            placeholder="0"
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            type="number" 
                            min="0"
                            value={inv.taxRate}
                            onChange={(e) => handleInvoiceChange(group.id, inv.id, 'taxRate', Number(e.target.value))}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-800 text-xs text-center"
                            placeholder="11"
                          />
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-800 text-right">
                          {total.toLocaleString('id-ID')}
                        </td>
                        <td className="p-3">
                          <input 
                            type="text" 
                            value={inv.description || ''}
                            onChange={(e) => handleInvoiceChange(group.id, inv.id, 'description', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-600 text-xs"
                            placeholder="Ket..."
                          />
                        </td>
                        <td className="p-3 text-center">
                          {group.invoices.length > 1 && (
                            <button 
                              type="button"
                              onClick={() => handleRemoveInvoice(group.id, inv.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
                <div className="p-2 border-t border-slate-100 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => handleAddInvoice(group.id)}
                    className="px-3 py-1.5 text-indigo-600 text-xs font-bold rounded hover:bg-indigo-50 flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Tambah Faktur untuk {group.supplierName || 'Supplier ini'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          <div>
            <button
              type="button"
              onClick={handleAddGroup}
              className="px-4 py-2 border border-dashed border-indigo-300 bg-indigo-50/50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-50 flex items-center justify-center space-x-2 w-full transition-colors"
            >
              <Building2 className="w-4 h-4" />
              <span>Tambah Supplier Lain</span>
            </button>
          </div>
        </div>

        <div className="p-4 border border-slate-200 rounded-lg bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-sm">
           <div className="text-[11px] font-medium text-slate-400">
             Menginput <span className="text-white font-bold">{totalInvoices}</span> faktur dari <span className="text-white font-bold">{groups.length}</span> supplier
           </div>
           <button
             type="submit"
             className="px-6 py-2 bg-indigo-600 text-white text-xs font-bold rounded shadow-sm hover:bg-indigo-700 flex items-center space-x-2"
           >
             <Save className="w-4 h-4" />
             <span>Simpan Semua</span>
           </button>
        </div>
      </form>

      {/* Invoice History Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-slate-800">Riwayat Faktur</h2>
        <p className="text-[10px] uppercase text-slate-400 font-bold mt-1 mb-4">Daftar faktur yang telah diinput</p>
        
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[1000px]">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 w-32">NO. FAKTUR</th>
                  <th className="p-3 w-40">SUPPLIER</th>
                  <th className="p-3 w-28">TGL</th>
                  <th className="p-3 w-32">JML FAKTUR</th>
                  <th className="p-3 w-28">RETUR</th>
                  <th className="p-3 w-24">PPN RETUR (%)</th>
                  <th className="p-3 w-32">TOTAL</th>
                  <th className="p-3 w-20 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">Belum ada faktur</td>
                  </tr>
                ) : (
                  [...invoices].reverse().slice(0, 50).map(inv => {
                    const isEditing = editingInvoiceId === inv.id;
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors bg-white">
                        <td className="p-3">
                          {isEditing ? (
                            <input 
                              type="text" 
                              value={editFormData.invoiceNumber || ''} 
                              onChange={(e) => setEditFormData({...editFormData, invoiceNumber: e.target.value})}
                              className="w-full px-2 py-1 border rounded text-xs"
                            />
                          ) : (
                            <span className="font-mono text-indigo-600 font-bold">{inv.invoiceNumber}</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <input 
                              type="text" 
                              value={editFormData.supplierName || ''} 
                              onChange={(e) => setEditFormData({...editFormData, supplierName: e.target.value})}
                              className="w-full px-2 py-1 border rounded text-xs"
                            />
                          ) : (
                            <span className="font-bold text-slate-700">{inv.supplierName}</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <input 
                              type="date" 
                              value={editFormData.date || ''} 
                              onChange={(e) => setEditFormData({...editFormData, date: e.target.value})}
                              className="w-full px-2 py-1 border rounded text-xs"
                            />
                          ) : (
                            <span className="text-slate-600">{format(parseISO(inv.date), 'dd MMM yyyy')}</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <input 
                              type="number" 
                              value={editFormData.subtotal === undefined ? '' : editFormData.subtotal} 
                              onChange={(e) => setEditFormData({...editFormData, subtotal: Number(e.target.value)})}
                              className="w-full px-2 py-1 border rounded font-mono text-xs"
                            />
                          ) : (
                            <span className="font-mono text-slate-800">{(inv.subtotal || inv.amount).toLocaleString('id-ID')}</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <input 
                              type="number" 
                              value={editFormData.returnAmount === undefined ? '' : editFormData.returnAmount} 
                              onChange={(e) => setEditFormData({...editFormData, returnAmount: Number(e.target.value)})}
                              className="w-full px-2 py-1 border rounded font-mono text-xs"
                            />
                          ) : (
                            <span className="font-mono text-slate-800">{(inv.returnAmount || 0).toLocaleString('id-ID')}</span>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <input 
                              type="number" 
                              value={editFormData.taxRate === undefined ? '' : editFormData.taxRate} 
                              onChange={(e) => setEditFormData({...editFormData, taxRate: Number(e.target.value)})}
                              className="w-full px-2 py-1 border rounded font-mono text-xs text-center"
                            />
                          ) : (
                            <span className="font-mono text-slate-800 text-center block">{(inv.taxRate || 0)}%</span>
                          )}
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-800 text-right">
                          {isEditing ? (
                            <span className="text-indigo-600 italic text-[10px]">Auto-calculated</span>
                          ) : (
                            inv.amount.toLocaleString('id-ID')
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {isEditing ? (
                            <div className="flex justify-center space-x-2">
                              <button onClick={() => saveEdit(inv.id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                                <Save className="w-4 h-4" />
                              </button>
                              <button onClick={cancelEdit} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-center space-x-2">
                              <button onClick={() => startEdit(inv)} className="p-1 text-indigo-500 hover:bg-indigo-50 rounded">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteInvoice(inv.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
