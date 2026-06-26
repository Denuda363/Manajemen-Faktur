export interface Invoice {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  date: string;
  dueDate: string;
  subtotal?: number;
  returnAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  amount: number;
  paidAmount: number;
  description?: string;
  paymentMethod?: 'CASH' | 'TERM';
  status: 'UNPAID' | 'PARTIAL' | 'PAID';
}

export interface Payment {
  id: string;
  invoiceIds: string[];
  amount: number;
  date: string;
}

export interface CompanyProfile {
  name: string;
  address: string;
  phone: string;
  email: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  navigationPosition: 'left' | 'right' | 'top' | 'bottom';
  navigationStyle?: 'solid' | 'glass' | 'floating' | 'minimalist';
  navigationColor?: 'slate' | 'indigo' | 'rose' | 'emerald' | 'amber' | 'sky';
  backgroundUrl: string;
  companyProfile: CompanyProfile;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: 'admin' | 'user';
}

export type Page = 'dashboard' | 'input' | 'due' | 'overdue' | 'payment' | 'suppliers' | 'settings';

