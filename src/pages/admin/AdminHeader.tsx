import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const AdminHeader: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log('User fetched:', user);
      if (error) {
        console.error('Error fetching user:', error);
        setUserName(null);
      } else {
        console.log('Fetching user profile with email:', user?.email);
        const { data: profile, error: profileError } = await supabase
          .from('usuario')
          .select('nombre, email')
          .eq('email', user?.email)
          .single();

        if (!profile?.email) {
          console.warn('email is empty for this user.');
        }

        console.log('Profile fetched:', profile, 'Error:', profileError);

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          setUserName('Usuario');
        } else {
          setUserName(profile?.nombre || 'Usuario');
        }
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  return (
    <header
      className={`bg-amber-900 text-white fixed top-0 left-0 w-full z-50 shadow-md transition-all duration-300 ${
        isScrolled ? 'py-0.5' : 'py-3'
      }`}
      style={{ margin: 0, padding: 0 }}
    >
      <div className="container mx-auto px-0">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/admin" className="flex items-center space-x-2">
            <img
              src="https://i.postimg.cc/mg57q6pf/Logo.webp"
              alt="Bigotes Pizzería"
              className="h-14"
              onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150x50?text=Logo')}
            />
            <span className="text-xl font-bold font-serif text-white">Bigotes</span>
          </Link>

          {/* Icono de usuario con menú desplegable */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 text-white hover:text-amber-200 transition"
            >
              <User size={24} />
              {!isScrolled && <span className="hidden sm:inline font-semibold">{userName}</span>}
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-gray-700 hover:bg-amber-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Perfil
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-amber-100 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;