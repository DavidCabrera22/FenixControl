import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';

const menuItems = [
  { name: 'Dashboard', icon: 'dashboard', path: '/' },
  { name: 'Transacciones', icon: 'receipt_long', path: '/transactions' },
  { name: 'Repartos', icon: 'account_tree', path: '/allocations' },
  { name: 'Obligaciones', icon: 'account_balance_wallet', path: '/obligations' },
  { name: 'Reportes', icon: 'bar_chart', path: '/reports' },
  { name: 'Configuración', icon: 'settings', path: '/settings' },
];

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('fenix_token');
    localStorage.removeItem('fenix_user');
    navigate('/login');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col shrink-0 z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-2xl">local_fire_department</span>
          </div>
          <div>
            <h1 className="text-primary dark:text-slate-100 font-extrabold text-lg leading-tight uppercase tracking-wider">FÉNIX</h1>
            <p className="text-xs text-slate-500 font-medium uppercase">Control de Cuentas</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition-colors',
                  isActive 
                    ? 'sidebar-active text-primary dark:text-white' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <Link
            to="/settings"
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
              location.pathname === '/settings'
                ? 'sidebar-active text-primary dark:text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold'
            )}
          >
            <span className="material-symbols-outlined">settings</span>
            <span>Configuración</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full mt-2 flex items-center gap-3 px-3 py-2.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-semibold transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 z-50">
        {[...menuItems, { icon: 'settings', name: 'Ajustes', path: '/settings' }].slice(0, 5).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors',
                isActive ? 'text-primary dark:text-white' : 'text-slate-500'
              )}
            >
              <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};
