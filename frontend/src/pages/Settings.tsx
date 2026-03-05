import { useState, useEffect } from 'react';
import axios from 'axios';
import { useOutletContext } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';
import { AccountModal } from '../components/AccountModal';
import { SourceModal } from '../components/SourceModal';
import { CategoryModal } from '../components/CategoryModal';
import { PartnerModal } from '../components/PartnerModal';

interface Account {
  id: string;
  name: string;
  type: string;
  initialBalance: number;
  currentBalance: number;
}

interface Source {
  id: string;
  name: string;
  type: string;
  initialBalance: number;
  currentBalance: number;
  partner?: { name: string };
  partnerId?: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

interface Partner {
  id: string;
  name: string;
  document: string;
}

export const Settings = () => {
  const { globalSearch } = useOutletContext<{ globalSearch: string }>();
  // Active Tab: 'cuentas' | 'fuentes' | 'categorias' | 'socios'
  const [activeTab, setActiveTab] = useState<'cuentas' | 'fuentes' | 'categorias' | 'socios'>('cuentas');

  // Accounts Data
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isAccountsLoading, setIsAccountsLoading] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Sources Data
  const [sourcesState, setSourcesState] = useState<Source[]>([]);
  const [isSourcesLoading, setIsSourcesLoading] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);

  // Categories Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Partners Data
  const [partnersState, setPartnersState] = useState<Partner[]>([]);
  const [isPartnersLoading, setIsPartnersLoading] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  // Basic Stats for cards
  const [stats, setStats] = useState({
    sources: 0,
    categories: 0,
    partners: 0
  });

  useEffect(() => {
    fetchStats();
    if (activeTab === 'cuentas') {
      fetchAccounts();
    }
    if (activeTab === 'fuentes') {
      fetchSources();
    }
    if (activeTab === 'categorias') {
      fetchCategories();
    }
    if (activeTab === 'socios') {
      fetchPartners();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const [srcRes, catRes, partRes] = await Promise.all([
        axios.get("/sources"),
        axios.get("/categories"),
        axios.get("/partners"),
      ]);
      setStats({
        sources: srcRes.data.length,
        categories: catRes.data.length,
        partners: partRes.data.length
      });
    } catch (err) {
      console.error("Error fetching settings stats", err);
    }
  };

  const fetchAccounts = async () => {
    setIsAccountsLoading(true);
    try {
      const res = await axios.get("/accounts");
      setAccounts(res.data);
    } catch (err) {
      console.error("Error fetching accounts", err);
    } finally {
      setIsAccountsLoading(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar esta cuenta? Se perderán las referencias si hay transacciones asociadas.")) return;
    try {
      await axios.delete(`/accounts/${id}`);
      fetchAccounts();
    } catch (err) {
      console.error("Error deleting account", err);
      alert("No se pudo eliminar la cuenta. Verifica que no tenga transacciones asociadas.");
    }
  }; // Closing brace for handleDeleteAccount

  const fetchSources = async () => {
    setIsSourcesLoading(true);
    try {
      // Need expanded view to get partner name if available, but backend might just return partnerId
      // For simplicity we just map data
      const res = await axios.get("/sources");
      setSourcesState(res.data);
    } catch (err) {
      console.error("Error fetching sources", err);
    } finally {
      setIsSourcesLoading(false);
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar esta fuente? Se perderán las referencias si hay transacciones asociadas.")) return;
    try {
      await axios.delete(`/sources/${id}`);
      fetchSources();
      fetchStats(); 
    } catch (err) {
      console.error("Error deleting source", err);
      alert("No se pudo eliminar la fuente. Verifica que no tenga transacciones asociadas.");
    }
  };

  const fetchCategories = async () => {
    setIsCategoriesLoading(true);
    try {
      const res = await axios.get("/categories");
      setCategories(res.data);
    } catch (err) {
      console.error("Error fetching categories", err);
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar esta categoría? Se perderán las referencias si hay transacciones asociadas.")) return;
    try {
      await axios.delete(`/categories/${id}`);
      fetchCategories();
      fetchStats(); 
    } catch (err) {
      console.error("Error deleting category", err);
      alert("No se pudo eliminar la categoría. Verifica que no tenga transacciones asociadas.");
    }
  };

  const fetchPartners = async () => {
    setIsPartnersLoading(true);
    try {
      const res = await axios.get("/partners");
      setPartnersState(res.data);
    } catch (err) {
      console.error("Error fetching partners", err);
    } finally {
      setIsPartnersLoading(false);
    }
  };

  const handleDeletePartner = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar este socio? Se perderán las referencias si hay transacciones o fuentes asociadas.")) return;
    try {
      await axios.delete(`/partners/${id}`);
      fetchPartners();
      fetchStats(); 
    } catch (err) {
      console.error("Error deleting partner", err);
      alert("No se pudo eliminar el socio. Verifica que no tenga transacciones o fuentes asociadas.");
    }
  };

  // Filtered Data
  const searchLower = globalSearch?.toLowerCase() || '';

  const filteredAccounts = accounts.filter(acc => 
    !searchLower || 
    acc.name.toLowerCase().includes(searchLower) || 
    (acc.type === 'CASH' ? 'caja' : acc.type === 'BANK' ? 'bancaria' : 'bolsillo').includes(searchLower)
  );

  const filteredSources = sourcesState.filter(src => 
    !searchLower || 
    src.name.toLowerCase().includes(searchLower) || 
    (src.partner?.name?.toLowerCase().includes(searchLower)) ||
    (src.type === 'INCOME' ? 'ingreso' : 'gasto').includes(searchLower)
  );

  const filteredCategories = categories.filter(cat => 
    !searchLower || 
    cat.name.toLowerCase().includes(searchLower) ||
    (cat.type === 'EXPENSE' ? 'gasto' : 'ingreso').includes(searchLower)
  );

  const filteredPartners = partnersState.filter(part => 
    !searchLower || 
    part.name.toLowerCase().includes(searchLower) || 
    (part.document.toLowerCase().includes(searchLower))
  );

  return (
    <div className="p-4 md:p-8 flex-1 overflow-y-auto w-full max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <section>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-3xl font-black text-primary dark:text-slate-100 tracking-tight">Configuración</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Crea y administra los parámetros globales del sistema FÉNIX.</p>
          </div>
        </div>
      </section>

      {/* Info Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-primary">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
             <span className="material-symbols-outlined">info</span>
          </div>
          <div>
            <p className="font-bold text-sm">Recomendación del Sistema</p>
            <p className="text-sm opacity-80">Completa Cuentas, Fuentes y Categorías antes de registrar cualquier movimiento financiero.</p>
          </div>
        </div>
        <button className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary border border-primary/30 rounded-lg hover:bg-primary hover:text-white transition-all whitespace-nowrap">
           Guía de Inicio
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-8 overflow-x-auto scrollbar-hide">
        <button 
           onClick={() => setActiveTab('cuentas')}
           className={`pb-4 px-1 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'cuentas' ? 'border-primary text-primary dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          Cuentas
        </button>
        <button 
           onClick={() => setActiveTab('fuentes')}
           className={`pb-4 px-1 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'fuentes' ? 'border-primary text-primary dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          Fuentes
        </button>
        <button 
           onClick={() => setActiveTab('categorias')}
           className={`pb-4 px-1 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'categorias' ? 'border-primary text-primary dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          Categorías
        </button>
        <button 
           onClick={() => setActiveTab('socios')}
           className={`pb-4 px-1 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'socios' ? 'border-primary text-primary dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
        >
          Socios
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-6 min-h-[400px]">
         {activeTab === 'cuentas' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Listado de Cuentas</h3>
                  <p className="text-sm text-slate-500">Administra tus cuentas bancarias y cajas de efectivo.</p>
                </div>
                <button 
                   onClick={() => { setEditingAccount(null); setShowAccountModal(true); }}
                   className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Nueva Cuenta
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Nombre de la Cuenta</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Tipo</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Saldo Inicial</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Saldo Actual</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right whitespace-nowrap">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {isAccountsLoading ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Cargando cuentas...</td>
                        </tr>
                      ) : filteredAccounts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No se encontraron cuentas con la búsqueda actual.</td>
                        </tr>
                      ) : (
                        filteredAccounts.map(acc => (
                          <tr key={acc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${acc.type === 'CASH' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' : acc.type === 'BANK' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30'}`}>
                                  <span className="material-symbols-outlined">
                                    {acc.type === 'CASH' ? 'payments' : acc.type === 'BANK' ? 'account_balance' : 'savings'}
                                  </span>
                                </div>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{acc.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${acc.type === 'CASH' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50' : acc.type === 'BANK' ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50' : 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/50'}`}>
                                {acc.type === 'CASH' ? 'Caja' : acc.type === 'BANK' ? 'Bancaria' : 'Bolsillo'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-mono font-bold text-slate-500 dark:text-slate-400">{formatCurrency(Number(acc.initialBalance))}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{formatCurrency(Number(acc.currentBalance))}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingAccount(acc); setShowAccountModal(true); }} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors" title="Editar cuenta">
                                  <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                                <button onClick={() => handleDeleteAccount(acc.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors" title="Eliminar cuenta">
                                  <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
         )}
         {activeTab === 'fuentes' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Listado de Fuentes</h3>
                  <p className="text-sm text-slate-500">Administra las fuentes de ingreso y gasto del sistema.</p>
                </div>
                <button 
                   onClick={() => { setEditingSource(null); setShowSourceModal(true); }}
                   className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Nueva Fuente
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Nombre de la Fuente</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Tipo</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Socio</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Saldo Actual</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right whitespace-nowrap">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {isSourcesLoading ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Cargando fuentes...</td>
                        </tr>
                      ) : filteredSources.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No se encontraron fuentes con la búsqueda actual.</td>
                        </tr>
                      ) : (
                        filteredSources.map(src => (
                          <tr key={src.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${src.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30'}`}>
                                  <span className="material-symbols-outlined">
                                    {src.type === 'INCOME' ? 'arrow_downward' : 'arrow_upward'}
                                  </span>
                                </div>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{src.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${src.type === 'INCOME' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50' : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/50'}`}>
                                {src.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-medium text-slate-600 dark:text-slate-400">{src.partner?.name || 'Varios/No asignado'}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{formatCurrency(Number(src.currentBalance))}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingSource(src); setShowSourceModal(true); }} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors" title="Editar fuente">
                                  <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                                <button onClick={() => handleDeleteSource(src.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors" title="Eliminar fuente">
                                  <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
         )}
         {activeTab === 'categorias' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Listado de Categorías</h3>
                  <p className="text-sm text-slate-500">Agrupa tus movimientos para reportes detallados.</p>
                </div>
                <button 
                   onClick={() => { setEditingCategory(null); setShowCategoryModal(true); }}
                   className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Nueva Categoría
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Nombre de la Categoría</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Tipo</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right whitespace-nowrap">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {isCategoriesLoading ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-slate-500">Cargando categorías...</td>
                        </tr>
                      ) : filteredCategories.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-slate-500">No se encontraron categorías con la búsqueda actual.</td>
                        </tr>
                      ) : (
                        filteredCategories.map(cat => (
                          <tr key={cat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{cat.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${cat.type === 'INCOME' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50' : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/50'}`}>
                                {cat.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingCategory(cat); setShowCategoryModal(true); }} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors" title="Editar categoría">
                                  <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                                <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors" title="Eliminar categoría">
                                  <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
         )}
         {activeTab === 'socios' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Listado de Socios</h3>
                  <p className="text-sm text-slate-500">Administra los socios de capital del sistema.</p>
                </div>
                <button 
                   onClick={() => { setEditingPartner(null); setShowPartnerModal(true); }}
                   className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Nuevo Socio
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Nombre del Socio</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Email / Contacto</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right whitespace-nowrap">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {isPartnersLoading ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-slate-500">Cargando socios...</td>
                        </tr>
                      ) : filteredPartners.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-8 text-center text-slate-500">No se encontraron socios con la búsqueda actual.</td>
                        </tr>
                      ) : (
                        filteredPartners.map(part => (
                          <tr key={part.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{part.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                               <span className="text-sm text-slate-500 dark:text-slate-400">{part.document}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingPartner(part); setShowPartnerModal(true); }} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors" title="Editar socio">
                                  <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                                <button onClick={() => handleDeletePartner(part.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors" title="Eliminar socio">
                                  <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
         )}
      </div>

      <AccountModal 
        isOpen={showAccountModal} 
        onClose={() => setShowAccountModal(false)}
        onSaved={fetchAccounts}
        initialData={editingAccount}
      />

      <SourceModal
        isOpen={showSourceModal}
        onClose={() => setShowSourceModal(false)}
        onSaved={fetchSources}
        initialData={editingSource}
      />

      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSaved={fetchCategories}
        initialData={editingCategory}
      />

      <PartnerModal
        isOpen={showPartnerModal}
        onClose={() => setShowPartnerModal(false)}
        onSaved={fetchPartners}
        initialData={editingPartner}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-500 uppercase tracking-widest">Fuentes Config</h4>
            <span className="material-symbols-outlined text-primary">source</span>
          </div>
          <p className="text-2xl font-black text-primary dark:text-slate-100">{stats.sources}</p>
          <p className="text-xs text-slate-400 italic">Fuentes de ingreso activas</p>
          <button onClick={() => setActiveTab('fuentes')} className="w-full text-center py-2 text-primary font-bold text-sm border-t border-slate-100 dark:border-slate-800 mt-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Gestionar fuentes</button>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-500 uppercase tracking-widest">Categorías</h4>
            <span className="material-symbols-outlined text-primary">category</span>
          </div>
          <p className="text-2xl font-black text-primary dark:text-slate-100">{stats.categories}</p>
          <p className="text-xs text-slate-400 italic">Categorías de gasto e ingreso</p>
          <button onClick={() => setActiveTab('categorias')} className="w-full text-center py-2 text-primary font-bold text-sm border-t border-slate-100 dark:border-slate-800 mt-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Gestionar categorías</button>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-500 uppercase tracking-widest">Socios</h4>
            <span className="material-symbols-outlined text-primary">groups</span>
          </div>
          <p className="text-2xl font-black text-primary dark:text-slate-100">{stats.partners}</p>
          <p className="text-xs text-slate-400 italic">Socios de capital registrados</p>
          <button onClick={() => setActiveTab('socios')} className="w-full text-center py-2 text-primary font-bold text-sm border-t border-slate-100 dark:border-slate-800 mt-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Gestionar socios</button>
        </div>
      </div>

    </div>
  );
};
