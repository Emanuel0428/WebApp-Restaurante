import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminHeader from './AdminHeader';
import { supabase } from '../../lib/supabase';
import { fetchIngredients, fetchInventory } from '../../lib/supabase-functions';

const AdminPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      setLoading(true);  // Establecemos loading en true mientras verificamos el rol
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Debes iniciar sesión como administrador.');
        navigate('/login');
        return;
      }

      const { data, error: roleError } = await supabase
        .from('usuario')
        .select('id_rol')
        .eq('id_usuario', user.id)
        .single();

      if (roleError || !data || data.id_rol !== 1) {
        setError('No tienes permisos de administrador.');
        navigate('/login');
        return;
      }

      setLoading(false); // Si todo está bien, cargamos los datos
    };

    checkRole();
  }, [navigate]);

  useEffect(() => {
    const loadAlerts = async () => {
      setAlertsLoading(true);
      try {
        const ingredients = await fetchIngredients();
        const inventory = await fetchInventory();
        // Map inventory by ingredient id for quick lookup
        const inventoryMap = Object.fromEntries(
          inventory.map((item: any) => [item.id_ingrediente, item.cantidad])
        );
        // Find ingredients below minimum
        const lowStock = ingredients.filter((ing: any) => {
          const cantidad = inventoryMap[ing.id_ingrediente] ?? 0;
          return Number(cantidad) < Number(ing.cant_minima);
        }).map((ing: any) => ({
          ...ing,
          cantidad_actual: inventoryMap[ing.id_ingrediente] ?? 0
        }));
        setAlerts(lowStock);
      } catch (e) {
        setAlerts([]);
      } finally {
        setAlertsLoading(false);
      }
    };
    loadAlerts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg font-semibold">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <div className="fixed top-0 left-0 w-full z-50">
        <AdminHeader />
      </div>
      <div className="flex flex-1 flex-col md:flex-row pt-20"> {/* pt-20 para dejar espacio al header fijo */}
        <aside className="w-full md:w-64 bg-white shadow-md p-4">
          <h2 className="text-xl font-bold mb-6 text-amber-600">Admin Panel</h2>
          <ul className="space-y-2">
            <li>
              <Link to="/admin/pedidos" className="text-gray-700 hover:text-amber-600">
                Pedidos
              </Link>
            </li>
            <li>
              <Link to="/admin/manage-inventory" className="text-gray-700 hover:text-amber-600">
                Inventario
              </Link>
            </li>
            <li>
              <Link to="/admin/usuarios" className="text-gray-700 hover:text-amber-600">
                Control de usuarios
              </Link>
            </li>
            <li>
              <Link to="/admin/estadisticas" className="text-gray-700 hover:text-amber-600">
                Estadísticas
              </Link>
            </li>
            <li>
              <Link to="/admin/caja-historial" className="text-gray-700 hover:text-amber-600">
                Historial de caja
              </Link>
            </li>
            <li>
              <Link to="/admin/ventas" className="text-gray-700 hover:text-amber-600">
                Gráfica de ventas
              </Link>
            </li>
          </ul>
        </aside>
        <main className="flex-1 p-6">
          <h1 className="text-3xl font-bold mb-2">Bienvenido, Administrador</h1> {/* mb-2 para menos espacio */}
          <div className="bg-white shadow rounded-lg p-4 mb-6">
            <h2 className="text-xl font-semibold mb-2">Gestión del menú</h2>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/admin/add-product')}
                className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 transition"
              >
                Agregar nuevo producto
              </button>
              <button
                onClick={() => navigate('/admin/manage-products')}
                className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 transition"
              >
                Gestión productos
              </button>
              <button
                onClick={() => navigate('/admin/manage-ingredients')}
                className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 transition"
              >
                Gestión ingredientes
              </button>
            </div>
          </div>

          {/* Alertas de productos */}
          <div className="bg-white shadow rounded-lg p-4 mb-6">
            <h2 className="text-xl font-semibold mb-2 text-red-700 flex items-center gap-2">
              <span>Alertas de productos</span>
              <span role="img" aria-label="alerta">⚠️</span>
            </h2>
            {alertsLoading ? (
              <p className="text-gray-500">Cargando alertas...</p>
            ) : alerts.length === 0 ? (
              <p className="text-green-700 font-semibold">No hay productos por debajo del mínimo.</p>
            ) : (
              <ul className="space-y-2">
                {alerts.map((ing) => (
                  <li key={ing.id_ingrediente} className="border border-red-300 bg-red-50 rounded p-3 flex flex-col md:flex-row md:items-center md:justify-between">
                    <span className="font-semibold text-red-800">{ing.nombre} ({ing.unidad})</span>
                    <span className="text-sm text-gray-700">Actual: <span className="font-bold">{ing.cantidad_actual}</span> / Mínimo: <span className="font-bold">{ing.cant_minima}</span></span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
