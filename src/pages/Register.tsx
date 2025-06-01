import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error('No se pudo crear el usuario en Supabase Auth');

      const { error: insertError } = await supabase.from('usuario').insert([{
        id_usuario: user.id,
        email: formData.email,
        nombre: formData.nombre,
        apellido: formData.apellido || null,
        telefono: formData.telefono,
        direccion: formData.direccion || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        id_rol: 2,
      }]);

      if (insertError) throw insertError;

      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <h2 className="text-3xl font-bold text-center mb-8">Crear Cuenta</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
          {['nombre', 'apellido', 'email', 'telefono', 'direccion', 'password', 'confirmPassword'].map((field) => (
            <div className="mb-4" key={field}>
              <label htmlFor={field} className="block text-gray-700 font-medium mb-2">
                {field === 'email' ? 'Correo Electrónico' :
                 field === 'telefono' ? 'Teléfono' :
                 field === 'direccion' ? 'Dirección' :
                 field === 'confirmPassword' ? 'Confirmar Contraseña' :
                 field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                type={field === 'password' || field === 'confirmPassword' ? 'password' : 'text'}
                id={field}
                value={(formData as any)[field]}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                required={field !== 'direccion' && field !== 'apellido'}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 text-white py-2 rounded-md font-medium hover:bg-amber-700 transition disabled:opacity-50"
          >
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-4 w-full bg-gray-200 text-gray-700 py-2 rounded-md font-medium hover:bg-gray-300 transition"
          >
            Volver
          </button>

          <p className="mt-4 text-center text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="text-amber-600 hover:text-amber-700">
              Inicia Sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
