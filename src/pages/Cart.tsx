// src/pages/Cart.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import HistoryButton from './HistoryButton';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, subtotal, shipping, total } = useCart();
  const [deliveryOption, setDeliveryOption] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [addressError, setAddressError] = useState('');
  const [tableError, setTableError] = useState('');
  const navigate = useNavigate();

  const handleDeliveryOption = (option: string) => {
    setDeliveryOption(option);
  };

  const handleRestaurantConfirmation = () => {
    if (tableNumber.trim() === '') {
      setTableError('El número de mesa es obligatorio');
      return;
    }
    navigate('/checkout', { state: { deliveryOption: 'restaurant', tableNumber } });
  };

  // Address input validation
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    if (e.target.value.trim() === '') {
      setAddressError('La dirección es obligatoria');
    } else {
      setAddressError('');
    }
  };

  // Table number input validation
  const handleTableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTableNumber(e.target.value);
    if (e.target.value.trim() === '') {
      setTableError('El número de mesa es obligatorio');
    } else {
      setTableError('');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
            <ShoppingCart className="w-8 h-8" />
            Carrito de Compras
          </h1>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <p className="text-gray-500 text-center">Tu carrito está vacío</p>
            <div className="text-center mt-4">
              <Link
                to="/menu"
                className="inline-block bg-amber-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-amber-700 transition"
              >
                Volver al Menú
              </Link>
            </div>
          </div>
        </div>

        {/* Botón flotante del historial de pedidos */}
        <HistoryButton />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <ShoppingCart className="w-8 h-8" />
          Carrito de Compras
        </h1>

        {/* Lista de ítems */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {cart.map((item) => (
            <div
              key={item.id_producto}
              className="flex justify-between items-center border-b py-4 last:border-b-0"
            >
              <div>
                <h3 className="text-lg font-semibold">{item.name}</h3>
                <p className="text-gray-600">
                  ${typeof item.price === 'number' ? item.price.toLocaleString() : '0'} x {item.quantity}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id_producto, item.quantity - 1)}
                  className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-lg font-semibold">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id_producto, item.quantity + 1)}
                  className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => removeFromCart(item.id_producto)}
                  className="p-2 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={clearCart}
            className="mt-4 text-red-500 hover:underline flex items-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            Vaciar Carrito
          </button>
        </div>

        {/* Resumen del pedido */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between mb-4">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-semibold">${typeof subtotal === 'number' ? subtotal.toLocaleString() : '0'}</span>
          </div>
          {deliveryOption === 'delivery' && (
            <div className="flex justify-between mb-4">
              <span className="text-gray-600">Envío:</span>
              <span className="font-semibold">${typeof shipping === 'number' ? shipping.toLocaleString() : '0'}</span>
            </div>
          )}
          <div className="flex justify-between mb-6">
            <span className="text-gray-600">Total:</span>
            <span className="font-bold text-xl">${
              deliveryOption === 'restaurant'
                ? (typeof subtotal === 'number' ? subtotal.toLocaleString() : '0')
                : (typeof total === 'number' ? total.toLocaleString() : '0')
            }</span>
          </div>

          {/* Delivery Options */}
          <div className="mb-4">
            <p className="text-gray-600 mb-2">¿Cómo prefieres recibir tu pedido?</p>
            <div className="flex gap-4">
              <button
                onClick={() => handleDeliveryOption('delivery')}
                className={`bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded ${deliveryOption === 'delivery' ? 'bg-amber-600 text-white' : ''}`}
              >
                A Domicilio
              </button>
              <button
                onClick={() => handleDeliveryOption('restaurant')}
                className={`bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded ${deliveryOption === 'restaurant' ? 'bg-amber-600 text-white' : ''}`}
              >
                Consumir en Restaurante
              </button>
            </div>
          </div>

          {/* Address Input */}
          {deliveryOption === 'delivery' && (
            <div className="mb-4">
              <label htmlFor="address" className="block text-gray-700 text-sm font-bold mb-2">
                Dirección:
              </label>
              <input
                type="text"
                id="address"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Ingresa tu dirección"
                value={address}
                onChange={handleAddressChange}
              />
              {addressError && <p className="text-red-600 text-xs mt-1">{addressError}</p>}
            </div>
          )}

          {/* Table Number Input */}
          {deliveryOption === 'restaurant' && (
            <div className="mb-4">
              <label htmlFor="tableNumber" className="block text-gray-700 text-sm font-bold mb-2">
                Número de Mesa:
              </label>
              <input
                type="text"
                id="tableNumber"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Ingresa el número de mesa"
                value={tableNumber}
                onChange={handleTableChange}
              />
              {tableError && <p className="text-red-600 text-xs mt-1">{tableError}</p>}
            </div>
          )}

          {/* Proceed to Payment Link */}
          {deliveryOption === 'delivery' && (
            <Link
              to="/checkout"
              state={{
                deliveryOption: deliveryOption,
                address: address,
              }}
              className={`w-full block bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition text-center ${address.trim() === '' ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={e => {
                if (address.trim() === '') {
                  e.preventDefault();
                  setAddressError('La dirección es obligatoria');
                }
              }}
              tabIndex={address.trim() === '' ? -1 : 0}
            >
              Proceder al Pago
            </Link>
          )}

          {deliveryOption === 'restaurant' && (
            <button
              onClick={handleRestaurantConfirmation}
              className={`w-full block bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition text-center ${tableNumber.trim() === '' ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={tableNumber.trim() === ''}
            >
              Confirmar Mesa
            </button>
          )}
        </div>
      </div>

      {/* Botón flotante del historial de pedidos */}
      <HistoryButton />
    </div>
  );
};

export default Cart;
