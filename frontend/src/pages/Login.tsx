import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { clsx } from 'clsx';

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(" /auth/login " , {
        email,
        password
      });

      // Save token and user info
      localStorage.setItem('fenix_token', response.data.access_token);
      localStorage.setItem('fenix_user', JSON.stringify(response.data.user));

      // Redirect to dashboard
      navigate('/');
    } catch (err: any) {
      console.error('Login error', err);
      setError(err.response?.data?.message || 'Credenciales inválidas o error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center p-4">
      <div className="max-w-5xl w-full bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] animate-in fade-in duration-500">
        
        {/* Left Side: Image/Branding (Visible on MD and up) */}
        <div className="hidden md:flex md:w-1/2 bg-primary relative overflow-hidden items-center justify-center p-12">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-200 via-primary to-primary"></div>
          <div className="relative z-10 text-center">
            <div className="mb-8 flex justify-center">
              <div className="bg-white/10 p-4 rounded-full backdrop-blur-sm">
                <span className="material-symbols-outlined text-white text-6xl">account_balance</span>
              </div>
            </div>
            <h2 className="text-white text-3xl font-bold mb-4">Sistema FÉNIX</h2>
            <p className="text-slate-300 text-lg">Control de Cuentas &amp; Gestión Financiera de Alto Nivel</p>
          </div>
          <div 
            className="absolute bottom-0 left-0 w-full h-full bg-cover bg-center mix-blend-overlay opacity-30" 
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')" }}
          ></div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full md:w-1/2 p-8 lg:p-16 flex flex-col justify-center relative">
          
          <div className="mb-10 text-center md:text-left">
            <div className="flex items-center gap-2 mb-6 justify-center md:justify-start">
              <span className="material-symbols-outlined text-primary text-3xl">payments</span>
              <span className="text-primary font-bold text-xl tracking-tight">FÉNIX</span>
            </div>
            <h1 className="text-slate-900 dark:text-slate-100 text-3xl font-bold leading-tight mb-2">Bienvenido de nuevo</h1>
            <p className="text-slate-500 dark:text-slate-400 text-base">Ingresa tus credenciales para acceder al sistema</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-bold border border-red-200">
                {error}
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Correo electrónico</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">person</span>
                <input 
                  required
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@fenix.com" 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 dark:text-slate-100" 
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Contraseña</label>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                <input 
                  required
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 dark:text-slate-100" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className={clsx(
                "w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 px-4 rounded-lg shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98] flex justify-center items-center gap-2",
                loading && "opacity-70 cursor-not-allowed"
              )}
            >
              {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : null}
              {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              ¿No tienes una cuenta? <br className="md:hidden" />
              <button className="text-primary font-semibold hover:underline">Contacta al administrador</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
