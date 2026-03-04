interface TopbarProps {
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
}

export const Topbar = ({ searchTerm = '', onSearchChange }: TopbarProps) => {
  return (
    <header className="h-16 md:h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 shrink-0 transition-all sticky top-0 z-10">
      {/* Mobile Title */}
      <h2 className="md:hidden text-lg font-extrabold tracking-tight text-primary dark:text-slate-100 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary dark:text-white">local_fire_department</span>
        FÉNIX
      </h2>

      {/* Desktop Global Search */}
      <div className="hidden md:flex items-center flex-1 max-w-xl">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Buscar transacciones, fuentes o reportes..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        {/* Mobile Search Icon */}
        <button className="md:hidden size-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
           <span className="material-symbols-outlined text-[20px]">search</span>
        </button>

        {/* Date Filter (hidden on mobile) */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          <span className="material-symbols-outlined text-slate-500 text-sm">calendar_today</span>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            {new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '')}
          </span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 size-2.5 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3 pl-3 md:pl-6 md:border-l border-slate-200 dark:border-slate-800">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Admin Fénix</p>
            <p className="text-xs text-slate-500 font-medium">Super Usuario</p>
          </div>
          <img 
            alt="Perfil Usuario" 
            className="size-9 rounded-full bg-primary/10 object-cover border border-slate-200 dark:border-slate-700" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkUHJLsyl5dpANr7tgzkwWtomNxtwv_ol8kaw1ERCOkmKS3Or3vKBK4TV1dodXQNuP98XgM1JJFBGTIkT30KHhMa3htxH9i3caXnKLi1DNWMk9BwX6Mu8_V18QIi8rJnrCQ-FB2x4Q1eOZMxRO0MoHXjAu2q_2t7dldGWejouNPdsazU3iZ7DvfYSAhPHjcqfNBrj3ePp9f5PmoCwXv5EkcUi7YoXzP8zt2Bu5JgGLOdN56Plt1xQEZua8TmLvDq7nofilU0_ys4oP"
          />
        </div>
      </div>
    </header>
  );
};
