/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './store';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { InvoiceInput } from './pages/InvoiceInput';
import { DueInvoices } from './pages/DueInvoices';
import { OverdueInvoices } from './pages/OverdueInvoices';
import { Payments } from './pages/Payments';
import { Suppliers } from './pages/Suppliers';
import { SettingsPage } from './pages/SettingsPage';
import { Login } from './pages/Login';
import { Page } from './types';

function MainApp() {
  const { currentUser } = useApp();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  if (!currentUser) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'input': return <InvoiceInput />;
      case 'due': return <DueInvoices />;
      case 'overdue': return <OverdueInvoices />;
      case 'payment': return <Payments />;
      case 'suppliers': return <Suppliers />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

