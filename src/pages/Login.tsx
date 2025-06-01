import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('invalid credentials')) {
          throw new Error('Correo o contraseña incorrectos.');
        }
        throw authError;
      }

      const user = data.user;
      if (!user) {
        throw new Error('No se encontró el usuario.');
      }

      console.log('User ID from Auth:', user.id);

      const { data: perfilData, error: perfilError } = await supabase
        .from('usuario')
        .select('id_rol, id_usuario, email')
        .eq('id_usuario', user.id);

      if (perfilError) {
        throw new Error(`Error al consultar el perfil: ${perfilError.message} (Código: ${perfilError.code})`);
      }

      console.log('Perfil Data:', perfilData);

      if (!perfilData || perfilData.length === 0) {
        throw new Error('No se encontró el perfil del usuario. Verifica que el usuario esté registrado en la tabla `usuario`.');
      }

      const perfil = perfilData[0];
      if (!perfil.id_rol) {
        throw new Error('No se pudo obtener el rol del usuario.');
      }

      switch (perfil.id_rol) {
        case 1:
          navigate('/admin');
          break;
        case 2:
          navigate('/');
          break;
        case 3:
          break;
        case 4:
          navigate('/mesero');
          break;
        default:
          throw new Error('Rol no reconocido.');
      }

    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Error al iniciar sesión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <h2 className="text-3xl font-bold text-center mb-8">Iniciar Sesión</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 text-white py-2 rounded-md font-medium hover:bg-amber-700 transition disabled:opacity-50"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>

          <Link
            to="/"
            className="w-full mt-4 inline-block text-center bg-gray-100 text-gray-700 py-2 rounded-md font-medium hover:bg-gray-200 transition"
          >
            ← Volver al Inicio
          </Link>

          <p className="mt-4 text-center text-gray-600">
            ¿No tienes una cuenta?{' '}
            <Link to="/register" className="text-amber-600 hover:text-amber-700">
              Regístrate
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
