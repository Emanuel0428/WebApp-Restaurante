// src/pages/Cart.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
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
    // Reset errors when changing delivery option
    setAddressError('');
    setTableError('');
  };

  const handleRestaurantConfirmation = () => {
    if (tableNumber.trim() === '') {
      setTableError('El número de mesa es obligatorio');
      return;
    }
    navigate('/checkout', { state: { deliveryOption: 'restaurant', tableNumber } });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    if (e.target.value.trim() === '') {
      setAddressError('La dirección es obligatoria');
    } else {
      setAddressError('');
    }
  };

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
      <div className="min-h-screen bg-stone-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/menu" className="inline-flex items-center text-amber-800 hover:text-amber-600 mb-6">
            <ArrowLeft className="mr-2" size={20} />
            Volver al Menú
          </Link>
          
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-12 h-12 text-amber-800" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Tu carrito está vacío</h1>
            <p className="text-gray-600 mb-8">¡Agrega algunos productos deliciosos para comenzar!</p>
            <Link
              to="/menu"
              className="inline-block bg-amber-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-amber-700 transition transform hover:scale-105"
            >
              Ver Menú
            </Link>
          </div>
        </div>
        <HistoryButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link to="/menu" className="inline-flex items-center text-amber-800 hover:text-amber-600 mb-6">
          <ArrowLeft className="mr-2" size={20} />
          Volver al Menú
        </Link>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-amber-800 text-white p-6">
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <ShoppingCart size={28} />
              Tu Pedido
            </h1>
          </div>

          {/* Cart Items */}
          <div className="divide-y divide-gray-200">
            {cart.map((item) => (
              <div key={item.id_producto} className="p-6 hover:bg-amber-50 transition">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">{item.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {item.size && `Tamaño: ${item.size}`}
                      {item.removedIngredients && item.removedIngredients.length > 0 && (
                        <span className="block text-red-500">
                          Sin: {item.removedIngredients.join(', ')}
                        </span>
                      )}
                      {item.detalles_personalizados && (
                        <span className="block italic">
                          Nota: {item.detalles_personalizados}
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id_producto, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-amber-100 hover:bg-amber-200 flex items-center justify-center text-amber-800"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id_producto, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-amber-100 hover:bg-amber-200 flex items-center justify-center text-amber-800"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="w-24 text-right font-semibold">
                      ${(item.price * item.quantity).toLocaleString()}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id_producto)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Clear Cart Button */}
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <button
              onClick={clearCart}
              className="text-red-500 hover:text-red-700 flex items-center gap-2 text-sm"
            >
              <Trash2 size={16} />
              Vaciar Carrito
            </button>
          </div>

          {/* Order Summary */}
          <div className="p-6 bg-white border-t border-gray-200">
            <h2 className="text-xl font-bold mb-4">Resumen del Pedido</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              {deliveryOption === 'delivery' && (
                <div className="flex justify-between text-gray-600">
                  <span>Envío</span>
                  <span>${shipping.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-amber-800 pt-3 border-t">
                <span>Total</span>
                <span>
                  ${(deliveryOption === 'delivery' ? total : subtotal).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Delivery Options */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">¿Cómo prefieres recibir tu pedido?</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleDeliveryOption('delivery')}
                  className={`p-4 rounded-lg border-2 text-left ${
                    deliveryOption === 'delivery'
                      ? 'border-amber-600 bg-amber-50'
                      : 'border-gray-200 hover:border-amber-300'
                  }`}
                >
                  <div className="font-semibold mb-1">A Domicilio</div>
                  <div className="text-sm text-gray-600">Entrega en tu dirección</div>
                </button>
                <button
                  onClick={() => handleDeliveryOption('restaurant')}
                  className={`p-4 rounded-lg border-2 text-left ${
                    deliveryOption === 'restaurant'
                      ? 'border-amber-600 bg-amber-50'
                      : 'border-gray-200 hover:border-amber-300'
                  }`}
                >
                  <div className="font-semibold mb-1">En Restaurante</div>
                  <div className="text-sm text-gray-600">Servido en tu mesa</div>
                </button>
              </div>
            </div>

            {/* Delivery Address */}
            {deliveryOption === 'delivery' && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección de Entrega
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={handleAddressChange}
                  placeholder="Ingresa tu dirección completa"
                  className={`w-full p-3 border-2 rounded-lg ${
                    addressError ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                {addressError && (
                  <p className="mt-1 text-sm text-red-500">{addressError}</p>
                )}
              </div>
            )}

            {/* Table Number */}
            {deliveryOption === 'restaurant' && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Mesa
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={handleTableChange}
                  placeholder="Ingresa el número de tu mesa"
                  className={`w-full p-3 border-2 rounded-lg ${
                    tableError ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                {tableError && (
                  <p className="mt-1 text-sm text-red-500">{tableError}</p>
                )}
              </div>
            )}

            {/* Proceed Button */}
            {deliveryOption === 'delivery' && (
              <Link
                to="/checkout"
                state={{ deliveryOption, address }}
                className={`mt-6 block w-full bg-amber-600 text-white py-4 rounded-lg font-semibold text-center hover:bg-amber-700 transition ${
                  !address.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={(e) => {
                  if (!address.trim()) {
                    e.preventDefault();
                    setAddressError('La dirección es obligatoria');
                  }
                }}
              >
                Proceder al Pago
              </Link>
            )}

            {deliveryOption === 'restaurant' && (
              <button
                onClick={handleRestaurantConfirmation}
                className={`mt-6 w-full bg-amber-600 text-white py-4 rounded-lg font-semibold hover:bg-amber-700 transition ${
                  !tableNumber.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={!tableNumber.trim()}
              >
                Confirmar Pedido
              </button>
            )}
          </div>
        </div>
      </div>

      <HistoryButton />
    </div>
  );
};

export default Cart;
