import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchableSelect = ({ options, value, onChange, placeholder = 'Seleccionar...', className }: SearchableSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={wrapperRef} className={clsx('relative', className)}>
      <div
        className="flex items-center justify-between w-full h-11 px-4 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 cursor-pointer focus-within:ring-2 focus-within:ring-primary/20 transition-all border"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setSearchTerm('');
        }}
      >
        <span className={clsx("truncate", !selectedOption && "text-slate-500 dark:text-slate-400")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="material-symbols-outlined text-slate-400 text-lg transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
          expand_more
        </span>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
            <input
              type="text"
              autoFocus
              className="w-full bg-transparent text-sm outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <ul className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-500 text-center">No hay resultados</li>
            ) : (
              filteredOptions.map((opt) => (
                <li
                  key={opt.value}
                  className={clsx(
                    "px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors",
                    opt.value === value
                      ? "bg-primary text-white font-medium"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  {opt.label}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
