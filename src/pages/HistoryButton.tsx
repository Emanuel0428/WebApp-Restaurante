import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';

const HistoryButton = () => {
  const navigate = useNavigate();

  return (
    <button
      className="fixed bottom-28 right-8 bg-amber-500 text-white rounded-full shadow-lg hover:bg-amber-600 transition transform hover:scale-105 w-14 h-14 flex items-center justify-center z-50"
      aria-label="Ver historial de pedidos"
      onClick={() => navigate('/history')}
      style={{ zIndex: 51 }}
    >
      <Clock size={28} />
    </button>
  );
};

export default HistoryButton;
