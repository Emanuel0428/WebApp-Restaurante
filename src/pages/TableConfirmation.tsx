// src/pages/TableConfirmation.tsx
import { useLocation, Link } from 'react-router-dom';

const TableConfirmation = () => {
  const location = useLocation();
  const tableNumber = location.state?.tableNumber;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4">Confirmación de Mesa</h1>
          <p className="text-gray-700 mb-4">
            Mesa número: <span className="font-semibold">{tableNumber}</span>
          </p>
          <p className="text-gray-700 mb-4">
            En un momento el mesero llegará con el código de aprobación.
          </p>
          <label htmlFor="approvalCode" className="block text-gray-700 text-sm font-bold mb-2">
            Código de Aprobación:
          </label>
          <input
            type="text"
            id="approvalCode"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4"
            placeholder="Ingresa el código de aprobación"
          />
          <Link
            to="/checkout"
            state={{
              deliveryOption: 'restaurant',
              tableNumber: tableNumber
            }}
            className="w-full block bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition text-center"
          >
            Proceder al Pago
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TableConfirmation;