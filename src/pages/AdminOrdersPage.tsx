import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import AdminHeader from "../pages/AdminHeader"; // Importa el componente AdminHeader
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Interfaces
interface Producto {
  nombre: string;
  imagen?: string;
}

interface OrdenItem {
  cantidad: number;
  size: string;
  precio: number;
  detalles_personalizados: string;
  producto: Producto | null;
}

interface Usuario {
  nombre: string;
  apellido: string;
  email: string;
}

interface Orden {
  id_order: string;
  total_precio: number;
  estado: string;
  created_at: string;
  usuario: Usuario | null;
  orden_item: OrdenItem[];
}

function AdminOrdersPage() {
  const [orders, setOrders] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      let query = supabase
        .from("orden")
        .select(`
          id_order, total_precio, estado, created_at,
          usuario: user_id (nombre, apellido, email),
          orden_item (
            cantidad, size, precio, detalles_personalizados,
            producto: product_id (nombre, imagen)
          )
        `)
        .order("created_at", { ascending: false });
      if (startDate && endDate) {
        query = query.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
      }
      const { data, error } = await query;

      if (error) {
        setError("Error cargando pedidos");
        console.error("Error cargando pedidos:", error);
      } else {
        setOrders(
          data.map((order) => ({
            ...order,
            usuario: Array.isArray(order.usuario) ? order.usuario[0] : order.usuario,
            orden_item: order.orden_item.map((item) => ({
              ...item,
              producto: Array.isArray(item.producto) ? item.producto[0] : item.producto,
            })),
          }))
        );
      }
      setLoading(false);
    };

    fetchOrders();
  }, [startDate, endDate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-lg">Cargando pedidos...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="fixed top-0 left-0 w-full z-50">
        <AdminHeader />
      </div>
      <div className="pt-20 p-4 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-amber-700">Pedidos</h1>
        <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
          <input
            type="text"
            placeholder="Buscar por cliente, email, estado o producto..."
            className="border px-4 py-2 rounded-md w-full md:w-96"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <DatePicker
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={(update: [Date | null, Date | null]) => setDateRange(update)}
            isClearable
            className="border px-4 py-2 rounded-md w-full md:w-80"
            placeholderText="Filtrar por rango de fechas"
            dateFormat="yyyy-MM-dd"
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {orders.length === 0 ? (
            <div className="col-span-2 text-center text-gray-500 text-lg">No hay pedidos registrados.</div>
          ) : (
            orders
              .filter(order => {
                const cliente = `${order.usuario?.nombre || ''} ${order.usuario?.apellido || ''}`.toLowerCase();
                const email = (order.usuario?.email || '').toLowerCase();
                const estado = (order.estado || '').toLowerCase();
                const productos = order.orden_item.map(item => item.producto?.nombre || '').join(' ').toLowerCase();
                const busqueda = search.toLowerCase();
                return (
                  cliente.includes(busqueda) ||
                  email.includes(busqueda) ||
                  estado.includes(busqueda) ||
                  productos.includes(busqueda)
                );
              })
              .map((order) => (
                <div key={order.id_order} className="bg-white border border-amber-200 rounded-2xl shadow-lg p-6 flex flex-col gap-2">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-2">
                    <div>
                      <span className="font-bold text-amber-900">Pedido #{order.id_order}</span>
                      <span className="ml-2 text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.estado === 'entregado' ? 'bg-green-100 text-green-700' : order.estado === 'cancelado' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'}`}>{order.estado}</span>
                  </div>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                    <div>
                      <p className="font-semibold text-gray-700">Cliente: <span className="font-normal">{order.usuario?.nombre} {order.usuario?.apellido}</span></p>
                      <p className="text-gray-500 text-sm">{order.usuario?.email}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-lg text-amber-700">Total: ${order.total_precio.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="font-semibold mb-1 text-amber-900">Items:</p>
                    <ul className="divide-y divide-amber-100">
                      {order.orden_item.map((item, i) => (
                        <li key={i} className="flex items-center gap-3 py-2">
                          {item.producto?.imagen && (
                            <img src={item.producto.imagen} alt={item.producto.nombre} className="w-12 h-12 object-cover rounded border" />
                          )}
                          <div className="flex-1">
                            <span className="font-semibold text-gray-800">{item.producto?.nombre || 'Producto eliminado'}</span>
                            <span className="ml-2 text-xs text-gray-500">x{item.cantidad} {item.size && <span>({item.size})</span>}</span>
                            <div className="text-sm text-gray-600">${item.precio.toLocaleString()}</div>
                            {item.detalles_personalizados && <div className="text-xs text-gray-500 italic">{item.detalles_personalizados}</div>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminOrdersPage;
