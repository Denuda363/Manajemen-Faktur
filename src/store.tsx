import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppSettings, Invoice, Payment, Supplier, User } from './types';

const defaultSettings: AppSettings = {
  theme: 'system',
  navigationPosition: 'left',
  navigationStyle: 'solid',
  navigationColor: 'slate',
  backgroundUrl: '',
  companyProfile: {
    name: 'Perusahaan Saya',
    address: '',
    phone: '',
    email: '',
  },
};

interface AppContextType {
  invoices: Invoice[];
  payments: Payment[];
  suppliers: Supplier[];
  users: User[];
  currentUser: User | null;
  settings: AppSettings;
  addInvoices: (newInvoices: Omit<Invoice, 'id' | 'paidAmount' | 'status'>[]) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  addPayment: (invoiceIds: string[], amounts: Record<string, number>) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  login: (username: string, password?: string) => boolean;
  logout: () => void;
  importData: (data: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('faktur_invoices');
    return saved ? JSON.parse(saved) : [];
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('faktur_payments');
    return saved ? JSON.parse(saved) : [];
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('faktur_suppliers');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('faktur_users');
    return saved ? JSON.parse(saved) : [{ id: '1', username: 'admin', password: 'password', name: 'Administrator', role: 'admin' }];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('faktur_currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('faktur_settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('faktur_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('faktur_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('faktur_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);
  
  useEffect(() => {
    localStorage.setItem('faktur_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
       localStorage.setItem('faktur_currentUser', JSON.stringify(currentUser));
    } else {
       localStorage.removeItem('faktur_currentUser');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('faktur_settings', JSON.stringify(settings));
    
    // Apply theme
    if (settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  const addInvoices = (newInvoices: Omit<Invoice, 'id' | 'paidAmount' | 'status'>[]) => {
    const toAdd: Invoice[] = newInvoices.map((inv) => ({
      ...inv,
      id: Math.random().toString(36).substr(2, 9),
      paidAmount: 0,
      status: 'UNPAID',
    }));
    setInvoices((prev) => [...prev, ...toAdd]);
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    setInvoices((prev) => prev.map((inv) => {
      if (inv.id === id) {
        const updated = { ...inv, ...updates };
        // Recalculate status if amount changes
        let status: Invoice['status'] = updated.status;
        if (updated.paidAmount >= updated.amount) status = 'PAID';
        else if (updated.paidAmount > 0) status = 'PARTIAL';
        else status = 'UNPAID';
        return { ...updated, status };
      }
      return inv;
    }));
  };

  const deleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  };

  const addPayment = (invoiceIds: string[], amounts: Record<string, number>) => {
    const totalAmount = Object.values(amounts).reduce((sum, val) => sum + val, 0);
    const paymentId = Math.random().toString(36).substr(2, 9);
    
    const newPayment: Payment = {
      id: paymentId,
      invoiceIds,
      amount: totalAmount,
      date: new Date().toISOString(),
    };

    setPayments((prev) => [...prev, newPayment]);

    setInvoices((prev) =>
      prev.map((inv) => {
        if (amounts[inv.id]) {
          const newPaidAmount = inv.paidAmount + amounts[inv.id];
          let status: Invoice['status'] = inv.status;
          if (newPaidAmount >= inv.amount) status = 'PAID';
          else if (newPaidAmount > 0) status = 'PARTIAL';
          return { ...inv, paidAmount: newPaidAmount, status };
        }
        return inv;
      })
    );
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
    setSuppliers((prev) => [...prev, { ...supplier, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
  };
  
  const addUser = (user: Omit<User, 'id'>) => {
    setUsers((prev) => [...prev, { ...user, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, ...updates } : u));
    if (currentUser && currentUser.id === id) {
       setCurrentUser({ ...currentUser, ...updates });
    }
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };
  
  const login = (username: string, password?: string) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };
  
  const logout = () => {
    setCurrentUser(null);
  };
  
  const importData = (data: any) => {
     if (data.invoices) setInvoices(data.invoices);
     if (data.payments) setPayments(data.payments);
     if (data.suppliers) setSuppliers(data.suppliers);
     if (data.users) setUsers(data.users);
     if (data.settings) setSettings(data.settings);
  };

  return (
    <AppContext.Provider
      value={{ 
        invoices, payments, suppliers, users, currentUser, settings, 
        addInvoices, updateInvoice, deleteInvoice, addPayment, updateSettings, 
        addSupplier, updateSupplier, deleteSupplier,
        addUser, updateUser, deleteUser,
        login, logout, importData
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
