import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppSettings, Invoice, Payment, Supplier, User } from './types';
import { collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { db, auth } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

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
  firebaseUser: FirebaseUser | null;
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
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Use a local current user state since the UI might depend on this custom User object.
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('faktur_currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snapshot) => {
      setInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice)));
    });
    const unsubPayments = onSnapshot(collection(db, 'payments'), (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment)));
    });
    const unsubSuppliers = onSnapshot(collection(db, 'suppliers'), (snapshot) => {
      setSuppliers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier)));
    });
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
    });
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings({ ...defaultSettings, ...(docSnap.data() as AppSettings) });
      }
    });

    return () => {
      unsubInvoices();
      unsubPayments();
      unsubSuppliers();
      unsubUsers();
      unsubSettings();
    };
  }, [firebaseUser]);

  useEffect(() => {
    if (currentUser) {
       localStorage.setItem('faktur_currentUser', JSON.stringify(currentUser));
    } else {
       localStorage.removeItem('faktur_currentUser');
    }
  }, [currentUser]);

  useEffect(() => {
    // Apply theme
    if (settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  const addInvoices = async (newInvoices: Omit<Invoice, 'id' | 'paidAmount' | 'status'>[]) => {
    if (!firebaseUser) return;
    const batch = writeBatch(db);
    newInvoices.forEach(inv => {
      const id = doc(collection(db, 'invoices')).id;
      const ref = doc(db, 'invoices', id);
      batch.set(ref, {
        ...inv,
        paidAmount: 0,
        status: 'UNPAID',
      });
    });
    await batch.commit();
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    if (!firebaseUser) return;
    const inv = invoices.find(i => i.id === id);
    if (!inv) return;
    const updated = { ...inv, ...updates };
    let status: Invoice['status'] = updated.status;
    if (updated.paidAmount >= updated.amount) status = 'PAID';
    else if (updated.paidAmount > 0) status = 'PARTIAL';
    else status = 'UNPAID';
    
    await setDoc(doc(db, 'invoices', id), { ...updated, status }, { merge: true });
  };

  const deleteInvoice = async (id: string) => {
    if (!firebaseUser) return;
    await deleteDoc(doc(db, 'invoices', id));
  };

  const addPayment = async (invoiceIds: string[], amounts: Record<string, number>) => {
    if (!firebaseUser) return;
    const totalAmount = Object.values(amounts).reduce((sum, val) => sum + val, 0);
    const paymentId = doc(collection(db, 'payments')).id;
    const newPayment: Omit<Payment, 'id'> = {
      invoiceIds,
      amount: totalAmount,
      date: new Date().toISOString(),
    };

    const batch = writeBatch(db);
    batch.set(doc(db, 'payments', paymentId), newPayment);

    for (const invId of invoiceIds) {
      const inv = invoices.find(i => i.id === invId);
      if (inv && amounts[invId]) {
        const newPaidAmount = inv.paidAmount + amounts[invId];
        let status: Invoice['status'] = inv.status;
        if (newPaidAmount >= inv.amount) status = 'PAID';
        else if (newPaidAmount > 0) status = 'PARTIAL';
        batch.set(doc(db, 'invoices', invId), { paidAmount: newPaidAmount, status }, { merge: true });
      }
    }
    
    await batch.commit();
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    if (!firebaseUser) return;
    await setDoc(doc(db, 'settings', 'global'), newSettings, { merge: true });
  };

  const addSupplier = async (supplier: Omit<Supplier, 'id'>) => {
    if (!firebaseUser) return;
    const id = doc(collection(db, 'suppliers')).id;
    await setDoc(doc(db, 'suppliers', id), supplier);
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    if (!firebaseUser) return;
    await setDoc(doc(db, 'suppliers', id), updates, { merge: true });
  };

  const deleteSupplier = async (id: string) => {
    if (!firebaseUser) return;
    await deleteDoc(doc(db, 'suppliers', id));
  };
  
  const addUser = async (user: Omit<User, 'id'>) => {
    if (!firebaseUser) return;
    const id = doc(collection(db, 'users')).id;
    await setDoc(doc(db, 'users', id), user);
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    if (!firebaseUser) return;
    await setDoc(doc(db, 'users', id), updates, { merge: true });
    if (currentUser && currentUser.id === id) {
       setCurrentUser({ ...currentUser, ...updates });
    }
  };

  const deleteUser = async (id: string) => {
    if (!firebaseUser) return;
    await deleteDoc(doc(db, 'users', id));
  };
  
  const login = (username: string, password?: string) => {
    // With Google Auth, we might not use password for checking, just find by username
    const user = users.find(u => u.username === username);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };
  
  const logout = async () => {
    await auth.signOut();
    setCurrentUser(null);
  };
  
  const importData = async (data: any) => {
     if (!firebaseUser) return;
     const batch = writeBatch(db);
     
     if (data.invoices) {
       data.invoices.forEach((inv: Invoice) => {
         batch.set(doc(db, 'invoices', inv.id), inv);
       });
     }
     if (data.payments) {
       data.payments.forEach((pay: Payment) => {
         batch.set(doc(db, 'payments', pay.id), pay);
       });
     }
     if (data.suppliers) {
       data.suppliers.forEach((sup: Supplier) => {
         batch.set(doc(db, 'suppliers', sup.id), sup);
       });
     }
     if (data.users) {
       data.users.forEach((user: User) => {
         batch.set(doc(db, 'users', user.id), user);
       });
     }
     if (data.settings) {
       batch.set(doc(db, 'settings', 'global'), data.settings);
     }
     
     await batch.commit();
  };

  return (
    <AppContext.Provider
      value={{ 
        invoices, payments, suppliers, users, currentUser, firebaseUser, settings, 
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
