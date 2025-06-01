import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import AdminHeader from './AdminHeader';
import { insertCashMovement, getAllCashMovements } from '../lib/supabase-functions';

interface Pedido {
  id_order: string;
  usuario: { nombre: string; apellido: string } | null;
  estado: string;
  total_precio: number;
  created_at: string;
  orden_item: any[];
  payment_status?: string; // <-- Añadido para filtrar correctamente
}

const ESTADOS = ['Pendiente', 'Preparando', 'Entregado', 'Cancelado'];
const paymentMethodOptions = ['Caja', 'Datafono', 'Mercado Pago'];

const MeseroPage: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [caja, setCaja] = useState<number>(0);
  const [egreso, setEgreso] = useState<number>(0);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [movLoading, setMovLoading] = useState(true);
  const [dashboardTab, setDashboardTab] = useState<'pedidos' | 'pagos'>('pagos');
  const [pagos, setPagos] = useState<any[]>([]);
  const [pagosLoading, setPagosLoading] = useState(true);
  const [movimientoTipo, setMovimientoTipo] = useState<'ingreso' | 'egreso'>('ingreso');
  const [movimientoMonto, setMovimientoMonto] = useState<number>(0);
  const [movimientoDetalle, setMovimientoDetalle] = useState<string>('');

  useEffect(() => {
    fetchPedidos();
    fetchCaja();
    fetchMovimientos();
  }, []);

  const fetchPedidos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orden')
      .select(`
        id_order, total_precio, estado, created_at,
        usuario: user_id (nombre, apellido),
        orden_item (
          cantidad, size, precio, detalles_personalizados,
          producto: product_id (nombre)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) setError('Error al cargar pedidos');
    else setPedidos(
      (data || []).map((pedido: any) => ({
        ...pedido,
        usuario: Array.isArray(pedido.usuario) ? pedido.usuario[0] : pedido.usuario,
        orden_item: (pedido.orden_item || []).map((item: any) => ({
          ...item,
          producto: Array.isArray(item.producto) ? item.producto[0] : item.producto
        }))
      }))
    );
    setLoading(false);
  };

  const fetchCaja = async () => {
    // Obtener ingresos y egresos reales de la base de datos
    try {
      const data = await getAllCashMovements();
      let ingresos = 0;
      let egresos = 0;
      (data || []).forEach((mov: any) => {
        if (mov.tipo === 'ingreso') ingresos += Number(mov.monto);
        if (mov.tipo === 'egreso') egresos += Number(mov.monto);
      });
      setCaja(ingresos);
      setEgreso(egresos);
    } catch (e) {
      setCaja(0);
      setEgreso(0);
    }
  };

  const fetchMovimientos = async () => {
    setMovLoading(true);
    try {
      const data = await getAllCashMovements();
      setMovimientos(data || []);
    } catch (e) {
      setMovimientos([]);
    }
    setMovLoading(false);
  };

  const registrarMovimiento = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');
      // Buscar el id_usuario correspondiente al id de Auth
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuario')
        .select('id_usuario')
        .eq('id_usuario', user.id) // CAMBIO: buscar por id_usuario, que es el mismo que user.id de Supabase Auth
        .single();
      if (usuarioError || !usuarioData) throw new Error('Usuario no encontrado');
      await insertCashMovement({ tipo: movimientoTipo, monto: movimientoMonto, detalle: movimientoDetalle, usuario_id: usuarioData.id_usuario });
      setMovimientoMonto(0);
      setMovimientoDetalle('');
      fetchMovimientos();
      fetchCaja();
    } catch (e) {
      alert('Error al registrar movimiento');
    }
  };

  const fetchPagos = useCallback(async () => {
    setPagosLoading(true);
    const { data, error } = await supabase
      .from('orden')
      .select(`id_order, total_precio, created_at, payment_status, payment_method, estado, direccion, mesa, usuario: user_id (nombre, apellido)`)
      .order('created_at', { ascending: false })
      .limit(20);
    if (!error && data) {
      setPagos(
        data.map((p: any) => ({
          ...p,
          usuario: Array.isArray(p.usuario) ? p.usuario[0] : p.usuario
        }))
      );
    } else {
      setPagos([]);
    }
    setPagosLoading(false);
  }, []);

  useEffect(() => {
    if (dashboardTab === 'pagos') fetchPagos();
  }, [dashboardTab, fetchPagos]);

  const handlePagoChange = async (pago: any, newStatus: string, newMethod: string) => {
    // Solo permitir cancelar si el estado es 'Pendiente'
    if (newStatus === 'Fallido') {
      if (pago.estado !== 'Pendiente') {
        alert('Solo se puede cancelar un pedido si está en estado Pendiente.');
        return;
      }
      await supabase.from('orden').update({ estado: 'Cancelado', payment_status: 'Fallido', payment_method: newMethod }).eq('id_order', pago.id_order);
      await fetchPagos();
      await fetchPedidos();
      return;
    }
    // ...existing code for marcar como pagado...
    await supabase.from('orden').update({ payment_status: newStatus, payment_method: newMethod }).eq('id_order', pago.id_order);
    // Si se marca como pagado y el método es caja/cash, registrar movimiento en caja
    const metodoNormalizado = normalizarMetodoPago(newMethod);
    if (
      newStatus === 'Pagado' &&
      (metodoNormalizado === 'caja' || metodoNormalizado === 'cash')
    ) {
      // Obtener el id_usuario del usuario autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('No autenticado');
        return;
      }
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuario')
        .select('id_usuario')
        .eq('id_usuario', user.id)
        .single();
      if (usuarioError || !usuarioData) {
        alert('Usuario no encontrado');
        return;
      }
      await insertCashMovement({ tipo: 'ingreso', monto: pago.total_precio, detalle: `Pago de orden #${pago.id_order}`, usuario_id: usuarioData.id_usuario });
      await fetchCaja();
      await fetchMovimientos();
    }
    setPagos(prev => prev.map(p => p.id_order === pago.id_order ? { ...p, payment_status: newStatus, payment_method: newMethod } : p));
    await fetchPagos();
    setTimeout(() => {
      console.log('Pagos después de marcar como pagado:', pagos);
    }, 1000);
  };

  const avanzarEstado = async (pedido: Pedido) => {
    const idx = ESTADOS.indexOf(pedido.estado);
    if (idx < ESTADOS.length - 2) { // Solo avanza si no es 'Entregado' o 'Cancelado'
      const nuevoEstado = ESTADOS[idx + 1];
      await supabase.from('orden').update({ estado: nuevoEstado }).eq('id_order', pedido.id_order);
      fetchPedidos();
    }
  };

  const cancelarPedidoTotal = async (pedido: Pedido) => {
    await supabase.from('orden').update({ estado: 'cancelado', payment_status: 'Cancelado' }).eq('id_order', pedido.id_order);
    fetchPedidos();
  };

  // Función para normalizar el método de pago
  function normalizarMetodoPago(metodo: string | null | undefined) {
    if (!metodo) return '';
    return metodo
      .toString()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita tildes
      .replace(/\s+/g, '') // quita espacios
      .toLowerCase();
  }

  // Cálculos de totales para caja (antes del return)
  const totalEgresos = movimientos.filter(m => m.tipo === 'egreso').reduce((acc, m) => acc + Number(m.monto), 0);
  const totalIngresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((acc, m) => acc + Number(m.monto), 0);
  const pagosEfectivo = pagos.filter(p => {
    const metodo = normalizarMetodoPago(p.payment_method);
    return (
      (metodo === 'caja' || metodo === 'cash' || metodo === '') &&
      p.payment_status === 'Pagado'
    );
  });
  const pagosDigital = pagos.filter(p => {
    const metodo = normalizarMetodoPago(p.payment_method);
    return (
      metodo === 'mercadopago' || metodo === 'datafono'
    ) && p.payment_status === 'Pagado';
  });
  const totalPagosEfectivo = pagosEfectivo.reduce((acc, p) => acc + Number(p.total_precio), 0);
  const totalPagosDigital = pagosDigital.reduce((acc, p) => acc + Number(p.total_precio), 0);
  const efectivoDisponible = totalIngresos + totalPagosEfectivo - totalEgresos;
  const digitalDisponible = totalPagosDigital;

  if (loading) return <div className="p-4">Cargando pedidos...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-gray-900">
      <AdminHeader />
      <div className="container mx-auto px-4 py-8">
        {/* DASHBOARD TABS */}
        <div className="flex gap-4 mb-8 sticky top-[64px] z-20 bg-stone-50 dark:bg-gray-900 pt-4" style={{paddingTop: '1.5rem'}}>
          <button
            className={`px-6 py-2 rounded-t-lg font-bold border-b-4 transition-all ${dashboardTab === 'pagos' ? 'border-amber-600 bg-white dark:bg-gray-800 text-amber-700' : 'border-transparent bg-gray-100 dark:bg-gray-900 text-gray-500'}`}
            onClick={() => setDashboardTab('pagos')}
          >Pagos</button>
          <button
            className={`px-6 py-2 rounded-t-lg font-bold border-b-4 transition-all ${dashboardTab === 'pedidos' ? 'border-amber-600 bg-white dark:bg-gray-800 text-amber-700' : 'border-transparent bg-gray-100 dark:bg-gray-900 text-gray-500'}`}
            onClick={() => setDashboardTab('pedidos')}
          >Pedidos</button>
        </div>
        {/* VISTA DE PAGOS */}
        {dashboardTab === 'pagos' && (
          <>
            {/* Caja, ingresos, egresos */}
            <div className="mb-8 grid grid-cols-1 gap-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-amber-200 dark:border-gray-700 w-full col-span-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-amber-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold mb-6 text-amber-700 dark:text-amber-300 flex items-center gap-2">
                      <span className="inline-block w-2 h-7 bg-amber-600 rounded mr-2"></span>Caja
                    </h2>
                    <div className="mb-2">
                      <span className="text-lg font-semibold">Total egresos (efectivo): </span>
                      <span className="text-lg font-bold">${totalEgresos.toLocaleString()}</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-lg font-semibold">Total ingresos (efectivo): </span>
                      <span className="text-lg font-bold">${totalIngresos.toLocaleString()}</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-lg font-semibold">Total digital (pagado): </span>
                      <span className="text-lg font-bold">${totalPagosDigital.toLocaleString()}</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-lg font-semibold">Pagos en efectivo: </span>
                      <span className="text-lg font-bold">${totalPagosEfectivo.toLocaleString()}</span>
                    </div>
                    <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-gray-900 border border-amber-200 dark:border-gray-700">
                      <div className="mb-1">
                        <span className="font-semibold">Efectivo disponible: </span>
                        <span className="font-bold">${efectivoDisponible.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="font-semibold">Digital disponible: </span>
                        <span className="font-bold">${digitalDisponible.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  {/* Formulario unificado de ingreso/egreso */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-amber-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold mb-6 text-amber-700 dark:text-amber-300 flex items-center gap-2">
                      <span className="inline-block w-2 h-7 bg-amber-600 rounded mr-2"></span>Registrar Movimiento
                    </h2>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de movimiento</label>
                      <select
                        value={movimientoTipo}
                        onChange={e => setMovimientoTipo(e.target.value as 'ingreso' | 'egreso')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                      >
                        <option value="ingreso">Ingreso</option>
                        <option value="egreso">Egreso</option>
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monto</label>
                      <input
                        type="number"
                        value={movimientoMonto}
                        onChange={e => setMovimientoMonto(Number(e.target.value))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Detalle</label>
                      <input
                        type="text"
                        value={movimientoDetalle}
                        onChange={e => setMovimientoDetalle(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                      />
                    </div>
                    <button
                      onClick={registrarMovimiento}
                      className="bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-amber-700 transition"
                    >Registrar {movimientoTipo === 'ingreso' ? 'Ingreso' : 'Egreso'}</button>
                  </div>
                </div>
              </div>
            </div>
            {/* Pagos */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-amber-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-6 text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <span className="inline-block w-2 h-7 bg-amber-600 rounded mr-2"></span>Pagos
              </h2>
              {pagosLoading ? (
                <div className="flex justify-center items-center min-h-[120px]">
                  <span className="text-lg text-gray-500 animate-pulse">Cargando pagos...</span>
                </div>
              ) : pagos.filter(p => p.payment_status !== 'Pagado' && p.payment_status !== 'Cancelado' && p.estado && p.estado.toLowerCase() !== 'cancelado').length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[120px]">
                  <span className="text-gray-500 text-lg">No hay pagos registrados.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-amber-50 dark:bg-gray-900">
                        <th className="px-3 py-2">Orden</th>
                        <th className="px-3 py-2">Cliente</th>
                        <th className="px-3 py-2">Fecha</th>
                        <th className="px-3 py-2">Total</th>
                        <th className="px-3 py-2">Método</th>
                        <th className="px-3 py-2">Estado</th>
                        <th className="px-3 py-2">Detalles</th> {/* Nueva columna */}
                        <th className="px-3 py-2">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagos.filter(p => p.payment_status !== 'Pagado' && p.payment_status !== 'Cancelado' && p.estado && p.estado.toLowerCase() !== 'cancelado').map((pago) => (
                        <tr key={pago.id_order} className="border-b">
                          <td className="px-3 py-2 font-bold">#{pago.id_order}</td>
                          <td className="px-3 py-2">{pago.usuario ? `${pago.usuario.nombre} ${pago.usuario.apellido}` : 'Sin usuario'}</td>
                          <td className="px-3 py-2">{new Date(pago.created_at).toLocaleString()}</td>
                          <td className="px-3 py-2 font-bold">${pago.total_precio.toLocaleString()}</td>
                          <td className="px-3 py-2">
                            <select
                              className="border rounded px-2 py-1"
                              value={pago.payment_method || 'Caja'}
                              onChange={e => handlePagoChange(pago, pago.payment_status || 'Pendiente', e.target.value)}
                            >
                              {paymentMethodOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2 font-semibold text-amber-700 dark:text-amber-300">{pago.estado}</td>
                          <td className="px-3 py-2">
                            {(pago.direccion || pago.mesa) ? (
                              <DetallesPopover
                                direccion={pago.direccion}
                                mesa={pago.mesa}
                              />
                            ) : null}
                          </td>
                          <td className="px-3 py-2 flex gap-2">
                            <button
                              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 font-semibold"
                              onClick={() => handlePagoChange(pago, 'Pagado', pago.payment_method || 'Caja')}
                            >Marcar como Pagado</button>
                            {pago.estado === 'Pendiente' && (
                              <button
                                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 font-semibold"
                                onClick={() => handlePagoChange(pago, 'Fallido', pago.payment_method || 'Caja')}
                              >Cancelar Pedido</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {/* Historial de Movimientos de Caja */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-amber-200 dark:border-gray-700 mt-8">
              <h2 className="text-xl font-bold mb-6 text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <span className="inline-block w-2 h-6 bg-amber-600 rounded mr-2"></span>Historial de Movimientos de Caja
              </h2>
              {movLoading ? (
                <div className="flex justify-center items-center min-h-[120px]">
                  <span className="text-lg text-gray-500 animate-pulse">Cargando movimientos...</span>
                </div>
              ) : movimientos.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[120px]">
                  <span className="text-gray-500 text-lg">No hay movimientos registrados.</span>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {movimientos.map((mov) => (
                    <div key={mov.id} className={`rounded-xl border shadow p-4 flex flex-col gap-2 bg-white dark:bg-gray-900 border-amber-100 dark:border-gray-700 ${mov.tipo === 'ingreso' ? 'border-green-300' : 'border-red-300'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-bold text-base ${mov.tipo === 'ingreso' ? 'text-green-700' : 'text-red-700'}`}>{mov.tipo.toUpperCase()}</span>
                        <span className="ml-auto text-xs text-gray-400">{new Date(mov.fecha).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-xl ${mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>{mov.tipo === 'ingreso' ? '+' : '-'}${mov.monto.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="font-medium">{mov.detalle}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        {/* VISTA DE PEDIDOS */}
        {dashboardTab === 'pedidos' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-amber-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold mb-6 text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <span className="inline-block w-2 h-7 bg-amber-600 rounded mr-2"></span>Últimos Pedidos
              </h2>
              <ul className="divide-y divide-amber-100 dark:divide-gray-700">
                {pedidos.filter(p => p.estado !== 'Entregado' && p.estado.toLowerCase() !== 'cancelado' && p.payment_status !== 'Pagado' && p.payment_status !== 'Cancelado').length === 0 && (
                  <li className="py-8 text-center text-gray-400 dark:text-gray-500">No hay pedidos recientes.</li>
                )}
                {pedidos.filter(p => p.estado !== 'Entregado' && p.estado.toLowerCase() !== 'cancelado' && p.payment_status !== 'Pagado' && p.payment_status !== 'Cancelado').map(pedido => {
                  // Solo mostrar botones si corresponde
                  return (
                    <li key={pedido.id_order} className="py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 group hover:bg-amber-50 dark:hover:bg-gray-900 transition">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold text-amber-900 dark:text-amber-200">Pedido #{pedido.id_order}</span>
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-semibold">{pedido.usuario ? `${pedido.usuario.nombre} ${pedido.usuario.apellido}` : 'Sin usuario'}</span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{new Date(pedido.created_at).toLocaleString()}</div>
                        <div className="flex flex-wrap gap-4 mb-2">
                          <span className="text-sm">Estado: <span className="font-bold text-amber-700 dark:text-amber-300">{pedido.estado}</span></span>
                          <span className="text-sm">Total: <span className="font-bold">${pedido.total_precio.toLocaleString()}</span></span>
                        </div>
                        <ul className="ml-4 list-disc text-sm text-gray-700 dark:text-gray-200">
                          {pedido.orden_item.map((item) => (
                            <li key={item.producto?.nombre || Math.random()} className="mb-1">{item.producto?.nombre || 'Producto'} x{item.cantidad} <span className="text-xs text-gray-400">({item.size})</span></li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[180px] items-end">
                        {pedido.estado === 'Pendiente' && (
                          <button
                            onClick={() => avanzarEstado(pedido)}
                            className="bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-amber-700 transition"
                          >Pasar a Preparando</button>
                        )}
                        {pedido.estado === 'Preparando' && (
                          <button
                            onClick={() => avanzarEstado(pedido)}
                            className="bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-amber-700 transition"
                          >Pasar a Entregado</button>
                        )}
                        {/* Botón de cancelar eliminado aquí */}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const DetallesPopover: React.FC<{ direccion?: string; mesa?: string }> = ({ direccion, mesa }) => {
  const [open, setOpen] = useState(false);
  let label = '';
  if (direccion) label = 'Domicilio';
  else if (mesa) label = 'Mesa';

  return (
    <div className="relative">
      <button
        className="text-blue-700 underline font-semibold hover:text-blue-900"
        onClick={() => setOpen(o => !o)}
        type="button"
      >
        {label}
      </button>
      {open && (
        <div className="absolute z-50 left-0 mt-2 w-max bg-white dark:bg-gray-800 border border-amber-200 dark:border-gray-700 rounded shadow-lg p-3 text-sm">
          {direccion && (
            <div>
              <span className="text-blue-700 font-semibold">Domicilio: </span>
              {direccion}
            </div>
          )}
          {mesa && (
            <div>
              <span className="text-green-700 font-semibold">Mesa: </span>
              {mesa}
            </div>
          )}
          <button
            className="block mt-2 text-xs text-gray-500 hover:text-gray-700"
            onClick={() => setOpen(false)}
            type="button"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
};

export default MeseroPage;
