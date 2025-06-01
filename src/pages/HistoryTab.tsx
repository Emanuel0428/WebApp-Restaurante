import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface OrdenItem {
  cantidad: number;
  size: string;
  precio: number;
  detalles_personalizados: string;
  producto: { nombre: string } | null;
}

interface Orden {
  id_order: string;
  created_at: string;
  orden_item: OrdenItem[];
}

const HistoryTab = () => {
  const { addToCart } = useCart();
  const [orders, setOrders] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setLoading(false);
      const { data, error } = await supabase
        .from('orden')
        .select(`id_order, created_at, orden_item (cantidad, size, precio, detalles_personalizados, producto:product_id (nombre))`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);
      if (!error && data) {
        // Fix: Map producto from array to single object (or null)
        const fixedOrders = data.map((order: any) => ({
          ...order,
          orden_item: order.orden_item.map((item: any) => ({
            ...item,
            producto: Array.isArray(item.producto) ? item.producto[0] ?? null : item.producto ?? null,
          })),
        }));
        setOrders(fixedOrders);
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const handleReorder = (order: Orden) => {
    order.orden_item.forEach(item => {
      if (item.producto) {
        addToCart({
          id_producto: item.producto.nombre,
          name: item.producto.nombre,
          price: item.precio,
          quantity: item.cantidad,
          size: item.size,
        });
      }
    });
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Cargando historial...</div>;
  if (!orders.length) return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex items-center justify-center">
        <div className="text-center py-10">
          <h2 className="text-xl font-bold">No tienes pedidos recientes</h2>
          <p className="text-gray-600">Explora nuestro menú y realiza tu primer pedido.</p>
          <Link to="/menu" className="mt-4 px-4 py-2 bg-orange-500 text-white rounded">Ir al Menú</Link>
        </div>
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
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow p-4">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><Clock /> Historial de Pedidos</h2>
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id_order} className="border rounded p-4 shadow bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">Pedido #{order.id_order}</p>
                  <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <button
                  className="bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-700"
                  onClick={() => handleReorder(order)}
                >Volver a pedir</button>
              </div>
              <ul className="mt-2 text-sm">
                {order.orden_item.map((item, i) => (
                  <li key={i} className="mb-1">
                    {item.producto?.nombre} x{item.cantidad} ({item.size}) - ${item.precio}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
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
    </div>
  );
};

export default HistoryTab;
