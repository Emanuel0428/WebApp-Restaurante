import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Facebook, Instagram, User, Sun, Moon, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';

const Layout: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const { cart } = useCart();
  const totalCartItems = cart.reduce((acc, item) => acc + (item.quantity || 0), 0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setIsLogged(!!session);
          if (session?.user) {
            const { data: profile } = await supabase
              .from('usuario')
              .select('nombre')
              .eq('email', session.user.email)
              .single();
            
            if (mounted) {
              setUserName(profile?.nombre || 'Usuario');
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    const authListener = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        setIsLogged(!!session);
        if (session?.user) {
          const { data: profile } = await supabase
            .from('usuario')
            .select('nombre')
            .eq('email', session.user.email)
            .single();
          
          if (mounted) {
            setUserName(profile?.nombre || 'Usuario');
          }
        } else {
          setUserName(null);
        }
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      authListener.data.subscription.unsubscribe();
    };
  }, []);

  const isProfilePage = location.pathname === '/profile'; // Verificar si estamos en la página de perfil

  return (
    <div className={`flex flex-col min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-stone-50'}`}>
      <header
        className={`bg-amber-900 text-white dark:bg-gray-800 dark:text-gray-200 sticky top-0 z-50 shadow-lg transition-all duration-300 ${
          isScrolled ? 'py-1' : 'py-2'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <img src="https://i.postimg.cc/mg57q6pf/Logo.webp" alt="Bigotes" className="h-14" />
              <span className="text-white font-bold text-xl tracking-wide">BigoteS</span>
            </Link>

            {/* Si no estamos en la página de perfil, mostramos el ícono de usuario */}
            {!isProfilePage && (
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 bg-amber-900 text-white rounded-full hover:bg-amber-800 transition dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  {darkMode ? <Sun size={24} /> : <Moon size={24} />}
                </button>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-amber-300 transition">
                  <Facebook size={24} />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-amber-300 transition">
                  <Instagram size={24} />
                </a>
                {/* Ícono de usuario: si está logueado, muestra el nombre; si no, va a login */}
                <div className="flex items-center space-x-2">
                  <Link to={isLogged ? "/profile" : "/login"} className="text-white hover:text-amber-300 transition">
                    <User size={24} />
                  </Link>
                  {isLogged ? (
                    <Link to="/profile" className="text-white hover:text-amber-300 transition">
                      {userName}
                    </Link>
                  ) : (
                    <Link to="/login" className="text-white hover:text-amber-300 transition">
                      Inicia Sesión
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <Outlet /> {/* RENDERIZA LAS RUTAS HIJAS */}
      </main>

      <footer className="bg-amber-900 text-white dark:bg-gray-800 dark:text-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4 text-amber-300">Horarios</h3>
              <p>Lunes a Domingo</p>
              <p>12:00 PM - 10:00 PM</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4 text-amber-300">Contacto</h3>
              <p>Teléfono: (123) 456-7890</p>
              <p>Email: info@bigotespizzeria.com</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4 text-amber-300">Ubicación</h3>
              <p>Calle Principal #123</p>
              <p>Ciudad, País</p>
              <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-amber-200 hover:text-amber-100 transition dark:text-amber-300 dark:hover:text-amber-400">
                Ver en Google Maps
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Si no estamos en la página de perfil, mostramos el carrito flotante con badge */}
      {!isProfilePage && (
        <Link
          to="/cart"
          className="fixed bottom-8 right-8 bg-amber-600 text-white rounded-full shadow-lg hover:bg-amber-700 transition transform hover:scale-105 dark:bg-amber-500 dark:hover:bg-amber-600 w-14 h-14 flex items-center justify-center z-50"
          aria-label="Ver carrito"
        >
          <ShoppingCart size={28} />
          {totalCartItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold border-2 border-white">
              {totalCartItems}
            </span>
          )}
        </Link>
      )}
    </div>
  );
};

export default Layout;
