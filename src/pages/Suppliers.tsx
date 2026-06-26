import React, { useState, useRef } from 'react';
import { useApp } from '../store';
import { Plus, Trash2, Edit2, Download, Upload, X, Save } from 'lucide-react';
import { Supplier } from '../types';
import * as XLSX from 'xlsx';

export function Suppliers() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useApp();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Supplier, 'id'>>({ name: '', phone: '', email: '', address: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setIsEditing(supplier.id);
      setForm({ name: supplier.name, phone: supplier.phone || '', email: supplier.email || '', address: supplier.address || '' });
    } else {
      setIsEditing(null);
      setForm({ name: '', phone: '', email: '', address: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(null);
    setForm({ name: '', phone: '', email: '', address: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateSupplier(isEditing, form);
    } else {
      addSupplier(form);
    }
    handleCloseModal();
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ name: 'PT Contoh Makmur', phone: '08123456789', email: 'contoh@makmur.com', address: 'Jl. Jend. Sudirman No 1' }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Suppliers Template");
    XLSX.writeFile(wb, "Template_Supplier.xlsx");
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

        let count = 0;
        rows.forEach(row => {
          if (row.name) {
            addSupplier({
              name: row.name,
              phone: row.phone || '',
              email: row.email || '',
              address: row.address || ''
            });
            count++;
          }
        });
        alert(`Berhasil mengimpor ${count} supplier`);
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

  const filteredSuppliers = suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col space-y-4 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Daftar Supplier</h2>
          <p className="text-[10px] uppercase text-slate-400 font-bold mt-1">Kelola data supplier Anda</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenModal()}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded shadow-sm hover:bg-indigo-700 flex items-center space-x-1"
          >
            <Plus className="w-3 h-3" />
            <span>Tambah</span>
          </button>
          <button
            onClick={downloadTemplate}
            className="px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-xs font-bold rounded shadow-sm hover:bg-slate-50 flex items-center space-x-1"
          >
            <Download className="w-3 h-3" />
            <span>Template</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-xs font-bold rounded shadow-sm hover:bg-slate-50 flex items-center space-x-1"
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

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-3 border-b border-slate-100 flex items-center bg-slate-50/50 sticky top-0 z-10">
           <input
             type="text"
             placeholder="Cari nama supplier..."
             value={search}
             onChange={e => setSearch(e.target.value)}
             className="w-full max-w-sm px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
           />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[600px]">
            <thead className="bg-slate-100 text-slate-500 font-bold border-b border-slate-200 sticky top-0">
              <tr>
                <th className="p-3">NAMA SUPPLIER</th>
                <th className="p-3">TELEPON</th>
                <th className="p-3">EMAIL</th>
                <th className="p-3 w-16 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.map((s) => (
                <tr key={s.id} className="hover:bg-indigo-50/30 transition-colors bg-white">
                  <td className="p-3 font-medium text-slate-800">{s.name}</td>
                  <td className="p-3 text-slate-600">{s.phone || '-'}</td>
                  <td className="p-3 text-slate-600">{s.email || '-'}</td>
                  <td className="p-3 text-center flex items-center justify-center space-x-2">
                    <button onClick={() => handleOpenModal(s)} className="p-1 text-slate-400 hover:text-indigo-600">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { if(confirm('Hapus supplier ini?')) deleteSupplier(s.id); }} className="p-1 text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    Tidak ada data supplier.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-slate-100 bg-slate-900 text-white flex items-center justify-between shrink-0 sticky bottom-0 z-10">
          <div className="text-[11px] font-medium text-slate-400">
            Menampilkan <span className="text-white font-bold">{filteredSuppliers.length}</span> supplier
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-slate-800">{isEditing ? 'Edit Supplier' : 'Tambah Supplier'}</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <form id="supplierForm" onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Supplier</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Telepon</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Alamat</label>
                  <textarea
                    rows={3}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs resize-none"
                  />
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-slate-100 shrink-0 flex justify-end space-x-2">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded"
              >
                Batal
              </button>
              <button
                type="submit"
                form="supplierForm"
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded shadow-sm hover:bg-indigo-700 flex items-center space-x-1"
              >
                <Save className="w-4 h-4" />
                <span>Simpan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
