import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

const SalesChartPage = () => {
  // Estados para filtros
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [pizzaFilter, setPizzaFilter] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([]);
  const [ventas, setVentas] = useState<any[]>([]);
  const [egresos, setEgresos] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Traer ventas (orden + orden_item + productos)
      let query = supabase
        .from('orden')
        .select(`
          id_order, created_at,
          orden_item (
            cantidad, size, precio, product_id,
            producto:product_id (nombre, tipo)
          )
        `)
        .order('created_at', { ascending: false });
      if (dateRange.from && dateRange.to) {
        query = query.gte('created_at', dateRange.from).lte('created_at', dateRange.to);
      }
      const { data: ordenes } = await query;
      // 2. Traer egresos/ingresos de caja
      let cajaQuery = supabase
        .from('caja_movimientos')
        .select('*')
        .order('fecha', { ascending: false });
      if (dateRange.from && dateRange.to) {
        cajaQuery = cajaQuery.gte('fecha', dateRange.from).lte('fecha', dateRange.to);
      }
      const { data: movimientos } = await cajaQuery;
      setVentas(ordenes || []);
      setEgresos(movimientos || []);
    };
    fetchData();
  }, [dateRange]);

  // Procesamiento de datos para las gráficas
  const pizzasVendidas: Record<string, number> = {};
  ventas.forEach((orden: any) => {
    orden.orden_item.forEach((item: any) => {
      if (item.producto && item.producto.tipo === 'pizza') {
        if (!pizzaFilter || item.producto.nombre.toLowerCase().includes(pizzaFilter.toLowerCase())) {
          pizzasVendidas[item.producto.nombre] = (pizzasVendidas[item.producto.nombre] || 0) + item.cantidad;
        }
      }
    });
  });
  const pizzasVendidasArr = Object.entries(pizzasVendidas).map(([nombre, cantidad]) => ({ nombre, cantidad }));
  // Solo mostrar top 3 y bottom 3
  const masVendidas = [...pizzasVendidasArr].sort((a, b) => b.cantidad - a.cantidad).slice(0, 3);
  const menosVendidas = [...pizzasVendidasArr].sort((a, b) => a.cantidad - b.cantidad).slice(0, 3);

  // Ventas por día de la semana
  const ventasPorDia: Record<string, number> = {};
  ventas.forEach((orden: any) => {
    const dia = new Date(orden.created_at).toLocaleDateString('es-CO', { weekday: 'long' });
    if (daysOfWeek.length === 0 || daysOfWeek.map(d => d.toLowerCase()).includes(dia.toLowerCase())) {
      ventasPorDia[dia] = (ventasPorDia[dia] || 0) + 1;
    }
  });
  const ventasPorDiaArr = Object.entries(ventasPorDia).map(([dia, cantidad]) => ({ dia, cantidad }));

  // Histograma ingresos/egresos
  const ingresosEgresos: Record<string, { ingreso: number; egreso: number }> = {};
  egresos.forEach((mov: any) => {
    const fecha = mov.fecha.split('T')[0];
    if (!ingresosEgresos[fecha]) ingresosEgresos[fecha] = { ingreso: 0, egreso: 0 };
    if (mov.tipo === 'ingreso') ingresosEgresos[fecha].ingreso += Number(mov.monto);
    if (mov.tipo === 'egreso') ingresosEgresos[fecha].egreso += Number(mov.monto);
  });
  const ingresosEgresosArr = Object.entries(ingresosEgresos).map(([fecha, val]) => ({ fecha, ...val }));

  // Calcular totales generales de ingresos y egresos
  const totalIngresos = egresos.filter((mov: any) => mov.tipo === 'ingreso').reduce((acc, mov) => acc + Number(mov.monto), 0);
  const totalEgresos = egresos.filter((mov: any) => mov.tipo === 'egreso').reduce((acc, mov) => acc + Number(mov.monto), 0);
  const [showGeneral, setShowGeneral] = useState(false);

  // Cambiar filtro de día de la semana a cubos seleccionables
  const weekDays = [
    'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
  ];

  return (
    <div className="p-6 min-h-screen bg-amber-50">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-amber-700">Gráfica de Ventas</h1>
        <button
          onClick={() => window.location.hash = '#/admin'}
          className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2 rounded shadow transition"
        >
          Volver al Panel Admin
        </button>
      </div>
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block font-semibold text-amber-700">Rango de fechas:</label>
          <input type="date" value={dateRange.from} onChange={e => setDateRange({ ...dateRange, from: e.target.value })} className="border-2 border-amber-300 rounded px-2 py-1 mr-2 focus:border-amber-600 outline-none" />
          <input type="date" value={dateRange.to} onChange={e => setDateRange({ ...dateRange, to: e.target.value })} className="border-2 border-amber-300 rounded px-2 py-1 focus:border-amber-600 outline-none" />
        </div>
        <div>
          <label className="block font-semibold text-amber-700">Filtrar por pizza:</label>
          <input type="text" value={pizzaFilter} onChange={e => setPizzaFilter(e.target.value)} placeholder="Nombre de la pizza" className="border-2 border-amber-300 rounded px-2 py-1 w-full focus:border-amber-600 outline-none" />
        </div>
        <div>
          <label className="block font-semibold text-amber-700 mb-2">Día(s) de la semana:</label>
          <div className="flex flex-wrap gap-2">
            {weekDays.map((dia) => (
              <button
                key={dia}
                type="button"
                className={`px-3 py-1 rounded-lg border-2 font-semibold transition text-sm
                  ${daysOfWeek.includes(dia)
                    ? 'bg-amber-600 text-white border-amber-700 shadow'
                    : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-100'}
                `}
                onClick={() => {
                  setDaysOfWeek((prev) =>
                    prev.includes(dia)
                      ? prev.filter((d) => d !== dia)
                      : [...prev, dia]
                  );
                }}
              >
                {dia}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white shadow-lg rounded-xl p-6 border-t-4 border-amber-600">
          <h2 className="font-semibold mb-4 text-amber-700 text-lg">Pizzas más vendidas</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={masVendidas}>
              <XAxis dataKey="nombre" tick={{ fill: '#b45309', fontWeight: 600 }} />
              <YAxis tick={{ fill: '#b45309' }} />
              <Tooltip contentStyle={{ background: '#fffbe6', borderColor: '#f59e42' }} />
              <Legend wrapperStyle={{ color: '#b45309' }} />
              <Bar dataKey="cantidad" fill="#f59e42" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-6 border-t-4 border-amber-600">
          <h2 className="font-semibold mb-4 text-amber-700 text-lg">Pizzas menos vendidas</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={menosVendidas}>
              <XAxis dataKey="nombre" tick={{ fill: '#b45309', fontWeight: 600 }} />
              <YAxis tick={{ fill: '#b45309' }} />
              <Tooltip contentStyle={{ background: '#fffbe6', borderColor: '#f59e42' }} />
              <Legend wrapperStyle={{ color: '#b45309' }} />
              <Bar dataKey="cantidad" fill="#fbbf24" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-6 border-t-4 border-amber-600">
          <h2 className="font-semibold mb-4 text-amber-700 text-lg">Ventas por día de la semana</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ventasPorDiaArr}>
              <XAxis dataKey="dia" tick={{ fill: '#b45309', fontWeight: 600 }} />
              <YAxis tick={{ fill: '#b45309' }} />
              <Tooltip contentStyle={{ background: '#fffbe6', borderColor: '#f59e42' }} />
              <Legend wrapperStyle={{ color: '#b45309' }} />
              <Bar dataKey="cantidad" fill="#f59e42" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-6 border-t-4 border-amber-600">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-amber-700 text-lg">Histograma de ingresos y egresos</h2>
            <button
              onClick={() => setShowGeneral((prev) => !prev)}
              className="ml-2 px-3 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-700 font-semibold border border-amber-300 text-sm transition"
            >
              {showGeneral ? 'Ver por fecha' : 'Ver totales generales'}
            </button>
          </div>
          {showGeneral ? (
            <div className="flex flex-col items-center justify-center h-[250px]">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={[
                    { nombre: 'Ingresos', monto: totalIngresos },
                    { nombre: 'Egresos', monto: totalEgresos }
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                >
                  <XAxis dataKey="nombre" tick={{ fill: '#b45309', fontWeight: 600 }} />
                  <YAxis tick={{ fill: '#b45309' }} allowDecimals={false} />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} contentStyle={{ background: '#fffbe6', borderColor: '#f59e42' }} />
                  <Legend wrapperStyle={{ color: '#b45309' }} />
                  <Bar dataKey="monto" radius={[8,8,0,0]}
                    label={{ position: 'top', fill: '#333', fontWeight: 700, formatter: (value: number) => `$${value.toLocaleString()}` }}>
                    <Cell fill="#4caf50" />
                    <Cell fill="#f44336" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ingresosEgresosArr}>
                <XAxis dataKey="fecha" tick={{ fill: '#b45309', fontWeight: 600 }} />
                <YAxis tick={{ fill: '#b45309' }} />
                <Tooltip contentStyle={{ background: '#fffbe6', borderColor: '#f59e42' }} />
                <Legend wrapperStyle={{ color: '#b45309' }} />
                <Bar dataKey="ingreso" fill="#4caf50" name="Ingresos" radius={[8,8,0,0]} />
                <Bar dataKey="egreso" fill="#f44336" name="Egresos" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesChartPage;
