// src/pages/CheckoutPage.tsx
import { useEffect, useState } from 'react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, subtotal, shipping, total, clearCart } = useCart();
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [loadingCash, setLoadingCash] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Leer deliveryOption, address y tableNumber del state de navegación
  const deliveryOption = location.state?.deliveryOption || null;
  const address = location.state?.address || '';
  const tableNumber = location.state?.tableNumber || '';

  // Inicializa Mercado Pago
  useEffect(() => {
    initMercadoPago('TEST-58047ae1-bb0e-4b83-bbc9-706ea25b1739', { locale: 'es-CO' });
  }, []);

  // Crear preference de Mercado Pago SOLO cuando el usuario haga clic en pagar
  // Elimina el useEffect que crea la orden automáticamente

  // Polling para saber si el pedido fue pagado
  useEffect(() => {
    if (!orderId) return;
    const interval = setInterval(async () => {
      const { data, error } = await supabase
        .from('orden')
        .select('payment_status')
        .eq('id_order', orderId)
        .single();
      if (data?.payment_status === 'Pagado') {
        clearInterval(interval);
        clearCart();
        navigate('/confirmation', { state: { orderId } });
      }
      if (error) {
        clearInterval(interval);
      }
    }, 3000); // cada 3 segundos
    return () => clearInterval(interval);
  }, [orderId, clearCart, navigate]);

  // Pagar en caja: insertar cabecera y detalle usando tablas existentes
  const handleCash = async () => {
    setLoadingCash(true);

    // 1) Obtener usuario
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert('Debes iniciar sesión para hacer un pedido en caja');
      setLoadingCash(false);
      return;
    }

    // 2) Crear orden (cabecera) usando dirección o mesa según opción
    const { data: ordenCreada, error: errorOrden } = await supabase
      .from('orden')
      .insert({
        user_id: user.id,
        total_precio: total,
        payment_status: 'Pago Pendiente',
        payment_method: 'cash',
        direccion: deliveryOption === 'delivery' ? address : '',
        mesa: deliveryOption === 'restaurant' ? tableNumber : '',
        estado: 'Pendiente',
      })
      .select('id_order')
      .single();
      console.log('🔍 Resultado orden:', ordenCreada, errorOrden);

    if (errorOrden || !ordenCreada) {
      console.error('🛑 Error al insertar en orden:', errorOrden);
      const msg =
        errorOrden?.message ||
        errorOrden?.details ||
        errorOrden?.hint ||
        'Error desconocido';
      alert(`Error al crear la orden:\n${msg}`);
      setLoadingCash(false);
      return;
    }
    const orderId = ordenCreada.id_order;

    // 3) Crear detalle (orden_item)
    const itemsPayload = cart.map(item => ({
      order_id: orderId,
      product_id: item.id_producto,
      cantidad: item.quantity,
      size: item.size,
      detalles_personalizados: JSON.stringify(item.removedIngredients || []),
      precio: item.price,
    }));

    const { error: errorItems } = await supabase
      .from('orden_item')
      .insert(itemsPayload);

    if (errorItems) {
      console.error('🛑 Error al insertar items:', errorItems);
      const msg = errorItems?.message || errorItems?.details || 'Error desconocido';
      alert(`Error al guardar los ítems:\n${msg}`);
      setLoadingCash(false);
      return;
    }

    // 4) Flujo final
    clearCart();
    navigate('/confirmation', { state: { orderId } });
  };

  // Nuevo: función para crear orden y preferencia MercadoPago
  const handleMercadoPago = async () => {
    if (!cart.length) return;
    // 1. Obtener usuario
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      setPreferenceId(null);
      alert('Debes iniciar sesión para pagar con MercadoPago');
      return;
    }
    // 2. Crear orden en Supabase con estado 'pendiente'
    const { data: ordenCreada, error: errorOrden } = await supabase
      .from('orden')
      .insert({
        user_id: user.id,
        total_precio: total,
        payment_status: 'Pago Pendiente',
        payment_method: 'mercadopago',
        direccion: deliveryOption === 'delivery' ? address : '',
        mesa: deliveryOption === 'restaurant' ? tableNumber : '',
        estado: 'Pendiente',
      })
      .select('id_order')
      .single();
    if (errorOrden || !ordenCreada) {
      console.error('🛑 Error al insertar en orden:', errorOrden);
      alert(`Error al crear la orden:\n${JSON.stringify(errorOrden, null, 2)}`);
      setPreferenceId(null);
      return;
    }
    const newOrderId = ordenCreada.id_order;
    setOrderId(newOrderId);
    // 3. Insertar ítems de la orden (igual que en efectivo)
    const itemsPayload = cart.map(item => ({
      order_id: newOrderId,
      product_id: item.id_producto,
      cantidad: item.quantity,
      size: item.size,
      detalles_personalizados: JSON.stringify(item.removedIngredients || []),
      precio: item.price,
    }));
    const { error: errorItems } = await supabase
      .from('orden_item')
      .insert(itemsPayload);
    if (errorItems) {
      console.error('🛑 Error al insertar items:', errorItems);
      alert('Error al guardar los ítems de la orden.');
      setPreferenceId(null);
      return;
    }
    // 4. Crear preferencia MercadoPago con external_reference
    const payload = {
      items: cart.map(i => ({
        title: i.name,
        quantity: Number(i.quantity),
        unit_price: Number(i.price),
        currency_id: 'COP',
      })),
      shipping_cost: Number(shipping),
      order_id: newOrderId,
    };
    try {
      const { data } = await axios.post('http://localhost:3000/create_preference', payload);
      setPreferenceId(data.preferenceId);
    } catch (err) {
      setPreferenceId(null);
      alert('Error al crear la preferencia de pago');
    }
  };

  // Determinar si es restaurante
  const isRestaurant = deliveryOption === 'restaurant';
  const isDelivery = deliveryOption === 'delivery';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-lg bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4 text-amber-600">Resumen de Pedido</h2>

        <div className="space-y-2 mb-6">
          <p className="flex justify-between">
            <span>Subtotal:</span>
            <span>${subtotal.toLocaleString()}</span>
          </p>
          {!isRestaurant && (
            <p className="flex justify-between">
              <span>Envío:</span>
              <span>${shipping.toLocaleString()}</span>
            </p>
          )}
          <p className="flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>${(isRestaurant ? subtotal : total).toLocaleString()}</span>
          </p>
        </div>

        {/* Pasarela de Mercado Pago */}
        {preferenceId ? (
          <div className="mb-4">
            <Wallet initialization={{ preferenceId }} />
          </div>
        ) : (
          <button
            onClick={handleMercadoPago}
            disabled={!cart.length}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition mb-4"
          >
            Pagar con MercadoPago
          </button>
        )}

        {/* Botón de pago en caja solo si es restaurante */}
        {isRestaurant && (
          <button
            onClick={handleCash}
            disabled={loadingCash || !cart.length}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
          >
            {loadingCash ? 'Procesando pedido...' : 'Pagar en caja (Efectivo)'}
          </button>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
