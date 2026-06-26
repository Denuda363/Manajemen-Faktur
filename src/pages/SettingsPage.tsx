import React, { useState, useRef } from 'react';
import { useApp } from '../store';
import { Save, Building2, Layout, Palette, Image as ImageIcon, Users, Database, Upload, Download, Plus, Trash2, Edit2, X } from 'lucide-react';
import { AppSettings, User } from '../types';

export function SettingsPage() {
  const { settings, updateSettings, users, currentUser, addUser, updateUser, deleteUser, invoices, payments, suppliers, importData } = useApp();
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User Management State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<Omit<User, 'id'>>({ username: '', name: '', role: 'user', password: '' });

  const handleChange = (field: keyof AppSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleProfileChange = (field: keyof AppSettings['companyProfile'], value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      companyProfile: { ...prev.companyProfile, [field]: value }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(localSettings);
    alert("Pengaturan berhasil disimpan!");
  };

  const handleOpenUserModal = (user?: User) => {
    if (user) {
      setEditingUser(user.id);
      setUserForm({ username: user.username, name: user.name, role: user.role, password: user.password || '' });
    } else {
      setEditingUser(null);
      setUserForm({ username: '', name: '', role: 'user', password: '' });
    }
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateUser(editingUser, userForm);
    } else {
      addUser(userForm);
    }
    setIsUserModalOpen(false);
  };

  const handleExportData = () => {
    const data = {
      invoices,
      payments,
      suppliers,
      users,
      settings
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_faktur_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (confirm('Perhatian: Mengimpor data akan menimpa data saat ini. Lanjutkan?')) {
          importData(data);
          alert('Data berhasil diimpor!');
        }
      } catch (error) {
        alert('Gagal membaca file backup. Format tidak valid.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const Section = ({ title, icon: Icon, children }: any) => (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-4 space-y-4">
      <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-2">
        <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
      </div>
      {children}
    </div>
  );

  return (
    <div className="flex flex-col space-y-4 pb-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Pengaturan</h2>
        <p className="text-[10px] uppercase text-slate-400 font-bold mt-1">Sesuaikan aplikasi dengan preferensi Anda</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        <Section title="Profil Perusahaan" icon={Building2}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Perusahaan</label>
              <input 
                type="text" 
                value={localSettings.companyProfile.name}
                onChange={(e) => handleProfileChange('name', e.target.value)}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-medium text-slate-700"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Email</label>
              <input 
                type="email" 
                value={localSettings.companyProfile.email}
                onChange={(e) => handleProfileChange('email', e.target.value)}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-medium text-slate-700"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">No. Telepon</label>
              <input 
                type="text" 
                value={localSettings.companyProfile.phone}
                onChange={(e) => handleProfileChange('phone', e.target.value)}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-medium text-slate-700"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Alamat</label>
              <textarea 
                rows={2}
                value={localSettings.companyProfile.address}
                onChange={(e) => handleProfileChange('address', e.target.value)}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-medium text-slate-700 resize-none"
              />
            </div>
          </div>
        </Section>

        <Section title="Tema & Tampilan" icon={Palette}>
          <div className="space-y-2">
            <div className="space-y-1 max-w-xs">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Mode Tema</label>
              <select 
                value={localSettings.theme}
                onChange={(e) => handleChange('theme', e.target.value)}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-medium text-slate-700"
              >
                <option value="light">Terang (Light)</option>
                <option value="dark">Gelap (Dark)</option>
                <option value="system">Sistem (System)</option>
              </select>
            </div>
          </div>
        </Section>

        <Section title="Navigasi" icon={Layout}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Posisi Navigasi</label>
              <select 
                value={localSettings.navigationPosition || 'left'}
                onChange={(e) => handleChange('navigationPosition', e.target.value)}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-medium text-slate-700"
              >
                <option value="left">Kiri (Sidebar)</option>
                <option value="right">Kanan (Sidebar)</option>
                <option value="top">Atas (Top Nav)</option>
                <option value="bottom">Bawah (Bottom Nav)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Gaya Navigasi</label>
              <select 
                value={localSettings.navigationStyle || 'solid'}
                onChange={(e) => handleChange('navigationStyle', e.target.value)}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-medium text-slate-700"
              >
                <option value="solid">Solid</option>
                <option value="glass">Glassmorphism</option>
                <option value="floating">Floating</option>
                <option value="minimalist">Minimalist</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Warna Navigasi</label>
              <select 
                value={localSettings.navigationColor || 'slate'}
                onChange={(e) => handleChange('navigationColor', e.target.value)}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-medium text-slate-700"
              >
                <option value="slate">Slate (Default)</option>
                <option value="indigo">Indigo</option>
                <option value="rose">Rose</option>
                <option value="emerald">Emerald</option>
                <option value="amber">Amber</option>
                <option value="sky">Sky</option>
              </select>
            </div>
          </div>
        </Section>

        <Section title="Background Latar" icon={ImageIcon}>
          <div className="space-y-2">
            <div className="space-y-1 max-w-lg">
              <label className="text-[10px] font-bold text-slate-500 uppercase">URL Gambar Background</label>
              <input 
                type="url" 
                value={localSettings.backgroundUrl}
                onChange={(e) => handleChange('backgroundUrl', e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-medium text-slate-700"
              />
              <p className="text-[10px] text-slate-400">Kosongkan jika ingin menggunakan warna solid</p>
            </div>
          </div>
        </Section>

        <Section title="Backup & Restore Data" icon={Database}>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={handleExportData}
              className="flex-1 px-4 py-3 border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-bold rounded-lg hover:bg-indigo-100 flex items-center justify-center space-x-2 transition-colors"
            >
              <Download className="w-5 h-5" />
              <div className="text-left">
                <div>Export Backup</div>
                <div className="text-[10px] font-normal text-indigo-500">Download data aplikasi</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 px-4 py-3 border border-slate-300 bg-white text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 flex items-center justify-center space-x-2 transition-colors"
            >
              <Upload className="w-5 h-5" />
              <div className="text-left">
                <div>Import Restore</div>
                <div className="text-[10px] font-normal text-slate-500">Pulihkan dari backup</div>
              </div>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportData} 
              accept=".json" 
              className="hidden" 
            />
          </div>
        </Section>

        {currentUser?.role === 'admin' && (
          <Section title="Manajemen Pengguna" icon={Users}>
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleOpenUserModal()}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded shadow-sm hover:bg-indigo-700 flex items-center space-x-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Tambah User</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[500px]">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">NAMA</th>
                      <th className="p-3">USERNAME</th>
                      <th className="p-3">ROLE</th>
                      <th className="p-3 w-16 text-center">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50 bg-white">
                        <td className="p-3 font-medium text-slate-800">{u.name}</td>
                        <td className="p-3 font-mono text-slate-600">{u.username}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                            ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}
                          `}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3 text-center flex items-center justify-center space-x-2">
                          <button 
                            type="button"
                            onClick={() => handleOpenUserModal(u)} 
                            className="p-1 text-slate-400 hover:text-indigo-600"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {u.id !== currentUser.id && (
                            <button 
                              type="button"
                              onClick={() => { if(confirm('Hapus user ini?')) deleteUser(u.id); }} 
                              className="p-1 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Section>
        )}

        <div className="flex pt-2 pb-8">
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded shadow-sm hover:bg-indigo-700 flex items-center space-x-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </form>

      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">{editingUser ? 'Edit User' : 'Tambah User'}</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <form id="userForm" onSubmit={handleUserSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Username</label>
                  <input
                    type="text"
                    required
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Password {editingUser && '(Kosongkan jika tidak ingin diubah)'}</label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as 'admin' | 'user' })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                  >
                    <option value="user">User Biasa</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              >
                Batal
              </button>
              <button
                type="submit"
                form="userForm"
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
