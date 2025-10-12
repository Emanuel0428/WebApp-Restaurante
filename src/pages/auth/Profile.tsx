import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface UserProfile {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion: string;
  id_rol: 1 | 2 | 3;
}

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('usuario')
        .select('nombre, apellido, email, telefono, direccion, id_rol')
        .eq('id_usuario', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      setError('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
    } catch (err) {
      setError('Error al cerrar sesión');
    }
  };

  const handleBack = () => {
    if (!profile) return;
    if (profile.id_rol === 1) navigate('/admin');
    else if (profile.id_rol === 3) navigate('/usermanagement');
    else navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Mi Perfil</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Nombre</label>
            <p className="text-gray-900">{profile?.nombre} {profile?.apellido}</p>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Correo Electrónico</label>
            <p className="text-gray-900">{profile?.email}</p>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Teléfono</label>
            <p className="text-gray-900">{profile?.telefono || 'No especificado'}</p>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Dirección</label>
            <p className="text-gray-900">{profile?.direccion || 'No especificada'}</p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-2 rounded-md font-medium hover:bg-red-700 transition mb-4"
          >
            Cerrar Sesión
          </button>

          <button
            onClick={handleBack}
            className="w-full bg-amber-600 text-white py-2 rounded-md font-medium hover:bg-amber-700 transition"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
