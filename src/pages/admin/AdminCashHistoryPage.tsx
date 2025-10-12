import React, { useEffect, useState } from 'react';
import AdminHeader from './AdminHeader';
import { getAllCashMovements } from '../../lib/supabase-functions';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Search, ArrowDownCircle, ArrowUpCircle, User as UserIcon, FileText } from 'lucide-react';

interface Movimiento {
  id: string;
  tipo: string;
  monto: number;
  detalle: string;
  fecha: string;
  usuario_id: string;
  usuario?: {
    nombre?: string;
    apellido?: string;
  };
}

const AdminCashHistoryPage: React.FC = () => {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [filtered, setFiltered] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;

  useEffect(() => {
    const fetchMovimientos = async () => {
      setLoading(true);
      const data = await getAllCashMovements();
      setMovimientos(data || []);
      setLoading(false);
    };
    fetchMovimientos();
  }, []);

  useEffect(() => {
    let filteredMovs = movimientos;
    if (startDate && endDate) {
      filteredMovs = filteredMovs.filter(mov => {
        const movDate = new Date(mov.fecha);
        return movDate >= startDate && movDate <= endDate;
      });
    }
    if (search.trim()) {
      const s = search.toLowerCase().trim();
      filteredMovs = filteredMovs.filter(mov => {
        const nombre = mov.usuario?.nombre?.toLowerCase() || '';
        const apellido = mov.usuario?.apellido?.toLowerCase() || '';
        const usuarioId = mov.usuario_id?.toLowerCase() || '';
        const tipo = mov.tipo?.toLowerCase() || '';
        const detalle = mov.detalle?.toLowerCase() || '';
        return (
          nombre.includes(s) ||
          apellido.includes(s) ||
          `${nombre} ${apellido}`.trim().includes(s) ||
          usuarioId.includes(s) ||
          tipo.includes(s) ||
          detalle.includes(s)
        );
      });
    }
    setFiltered(filteredMovs);
  }, [movimientos, search, startDate, endDate]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="fixed top-0 left-0 w-full z-50">
        <AdminHeader />
      </div>
      <div className="pt-20 max-w-5xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6 text-amber-700 flex items-center gap-2">
          <FileText className="w-7 h-7" /> Historial de Movimientos de Caja
        </h1>
        <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por usuario, tipo o detalle..."
              className="pl-10 pr-4 py-2 border rounded-md w-full"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
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
        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <span className="text-lg text-gray-500 animate-pulse">Cargando movimientos...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[200px]">
            <FileText className="w-12 h-12 text-gray-300 mb-2" />
            <span className="text-gray-500 text-lg">No hay movimientos registrados.</span>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filtered.map((mov) => (
              <div
                key={mov.id}
                className="bg-white border border-amber-200 rounded-2xl shadow-lg p-6 flex flex-col gap-2 hover:shadow-xl transition"
              >
                <div className="flex items-center gap-3 mb-2">
                  {mov.tipo.toLowerCase() === 'ingreso' ? (
                    <ArrowDownCircle className="w-7 h-7 text-green-600" />
                  ) : (
                    <ArrowUpCircle className="w-7 h-7 text-red-600" />
                  )}
                  <span className={`font-bold text-lg ${mov.tipo.toLowerCase() === 'ingreso' ? 'text-green-700' : 'text-red-700'}`}>{mov.tipo}</span>
                  <span className="ml-auto text-xs text-gray-400">{new Date(mov.fecha).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-2xl ${mov.tipo.toLowerCase() === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>{mov.tipo.toLowerCase() === 'ingreso' ? '+' : '-'}${mov.monto.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <UserIcon className="w-5 h-5 text-amber-700" />
                  <span className="font-medium">{mov.usuario && (mov.usuario.nombre || mov.usuario.apellido) ? `${mov.usuario.nombre} ${mov.usuario.apellido}` : mov.usuario_id}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <span>{mov.detalle}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCashHistoryPage;
