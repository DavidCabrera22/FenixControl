import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';

export const MainLayout = () => {
  const [globalSearch, setGlobalSearch] = useState('');

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased font-display overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative pb-16 md:pb-0">
        <Topbar searchTerm={globalSearch} onSearchChange={setGlobalSearch} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-full">
          <Outlet context={{ globalSearch }} />
        </main>
      </div>
    </div>
  );
};
