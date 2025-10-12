import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Usuario {
  id_usuario: string;
  nombre: string;
  apellido: string;
  email: string;
  id_rol: 1 | 2 | 3;
}

const usuariosPorPagina = 10;

const UserManagement = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [error, setError] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [searchTerm, setSearchTerm] = useState(''); // 🔍 Estado de búsqueda

  useEffect(() => {
    const contarUsuarios = async () => {
      const { count, error } = await supabase
        .from('usuario')
        .select('*', { count: 'exact', head: true });

      if (!error && count !== null) {
        setTotalUsuarios(count);
      }
    };

    contarUsuarios();
  }, []);

  useEffect(() => {
    const cargarUsuarios = async () => {
      const desde = (paginaActual - 1) * usuariosPorPagina;
      const hasta = desde + usuariosPorPagina - 1;

      const { data, error } = await supabase
        .from('usuario')
        .select('id_usuario, nombre, apellido, email, id_rol')
        .range(desde, hasta);

      if (error) {
        setError('Error al obtener usuarios.');
      } else {
        setUsuarios(data || []);
      }
    };

    cargarUsuarios();
  }, [paginaActual]);

  const actualizarRol = async (id_usuario: string, nuevoRol: 1 | 2 | 3) => {
    const { error } = await supabase
      .from('usuario')
      .update({ id_rol: nuevoRol })
      .eq('id_usuario', id_usuario);

    if (!error) {
      setUsuarios((prev) =>
        prev.map((user) =>
          user.id_usuario === id_usuario ? { ...user, id_rol: nuevoRol } : user
        )
      );
    } else {
      alert('No se pudo actualizar el rol.');
    }
  };

  const eliminarUsuario = async (id_usuario: string) => {
    const { error } = await supabase
      .from('usuario')
      .delete()
      .eq('id_usuario', id_usuario);

    if (!error) {
      setUsuarios((prev) => prev.filter((u) => u.id_usuario !== id_usuario));
      setTotalUsuarios((prev) => prev - 1);
    } else {
      alert('No se pudo eliminar el usuario.');
    }
  };

  const totalPaginas = Math.ceil(totalUsuarios / usuariosPorPagina);

  // 🔍 Filtrar usuarios por búsqueda
  const usuariosFiltrados = usuarios.filter((usuario) => {
    const texto = `${usuario.nombre} ${usuario.apellido} ${usuario.email}`.toLowerCase();
    return texto.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-2xl shadow-xl">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h2 className="text-3xl font-bold text-amber-600">Gestión de Usuarios</h2>
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            className="border px-4 py-2 rounded-md w-full md:w-80"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={() => navigate('/admin')}
            className="bg-amber-600 text-white px-4 py-2 rounded-xl hover:bg-amber-700 transition"
          >
            ← Volver al Panel
          </button>
        </div>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <div className="overflow-x-auto rounded-lg">
          <table className="w-full table-auto text-sm md:text-base text-left border border-gray-200 shadow-sm">
            <thead className="bg-amber-600 text-white">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Correo</th>
                <th className="p-3">Rol</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-6 text-gray-500">
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.id_usuario} className="border-t hover:bg-gray-50">
                    <td className="p-3">{usuario.nombre} {usuario.apellido}</td>
                    <td className="p-3">{usuario.email}</td>
                    <td className="p-3">
                      <select
                        value={usuario.id_rol}
                        onChange={(e) =>
                          actualizarRol(usuario.id_usuario, parseInt(e.target.value) as 1 | 2 | 3)
                        }
                        className="border rounded-md px-2 py-1"
                      >
                        <option value={1}>Admin</option>
                        <option value={2}>Usuario</option>
                        <option value={4}>mesero</option>
                      </select>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => eliminarUsuario(usuario.id_usuario)}
                        className="text-red-600 hover:text-red-800 font-semibold"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && searchTerm.trim() === '' && (
          <div className="mt-6 flex justify-center gap-4 items-center">
            <button
              disabled={paginaActual === 1}
              onClick={() => setPaginaActual(paginaActual - 1)}
              className="bg-amber-600 text-white px-3 py-1 rounded disabled:opacity-50"
            >
              ← Anterior
            </button>
            <span className="text-gray-700 font-medium">
              Página {paginaActual} de {totalPaginas}
            </span>
            <button
              disabled={paginaActual === totalPaginas}
              onClick={() => setPaginaActual(paginaActual + 1)}
              className="bg-amber-600 text-white px-3 py-1 rounded disabled:opacity-50"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
