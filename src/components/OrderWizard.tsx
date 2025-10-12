import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface Ingredient {
  id_ingrediente: string;
  nombre: string;
  unidad?: string;
  cant_minima?: number;
  cantidad_usada?: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  size: string;
  price: number;
  category: string;
  ingredients: Ingredient[];
  image: string | undefined;
  precios_por_tamano?: { [key: string]: number };
}

interface OrderWizardProps {
  product: Product | null;
  onClose: () => void;
  onAdd: (item: any) => void;
}

const OrderWizard: React.FC<OrderWizardProps> = ({ product, onClose, onAdd }) => {
  const [step, setStep] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const { cart } = useCart();

  const totalSteps = product?.category === 'pizza' ? 4 : 3;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleAddToCart();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onClose();
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    let finalPrice = 0;
    if (product.precios_por_tamano && selectedSize) {
      finalPrice = product.precios_por_tamano[selectedSize];
    } else {
      finalPrice = product.price;
    }

    onAdd({
      id_producto: product.id,
      name: product.name,
      size: selectedSize || product.size,
      quantity,
      price: finalPrice,
      removedIngredients,
      detalles_personalizados: specialInstructions
    });
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-amber-800 text-white p-4 flex justify-between items-center">
          <button onClick={handleBack} className="p-2 hover:bg-amber-700 rounded-full">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-bold">{product.name}</h2>
          <div className="relative">
            <ShoppingCart size={24} />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cart.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-2">
          <div 
            className="bg-amber-600 h-2 transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-48 h-48 object-cover rounded-lg mx-auto"
              />
              <p className="text-gray-600 text-center">{product.description}</p>
              {product.precios_por_tamano && (
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(product.precios_por_tamano).map(([size, price]) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`p-4 rounded-lg border-2 ${
                        selectedSize === size 
                          ? 'border-amber-600 bg-amber-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="text-lg font-bold">{size}</div>
                      <div className="text-amber-800">${price.toLocaleString()}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-center">Cantidad</h3>
              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                  className="p-3 rounded-full bg-gray-200 hover:bg-gray-300"
                >
                  <ChevronLeft size={24} />
                </button>
                <span className="text-3xl font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 rounded-full bg-gray-200 hover:bg-gray-300"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-center">Personalización</h3>
              <div className="grid grid-cols-2 gap-4">
                {Array.isArray(product.ingredients) && product.ingredients.map((ingredient: Ingredient) => (
                  <button
                    key={ingredient.id_ingrediente}
                    onClick={() => {
                      setRemovedIngredients(prev => 
                        prev.includes(ingredient.nombre)
                          ? prev.filter(i => i !== ingredient.nombre)
                          : [...prev, ingredient.nombre]
                      );
                    }}
                    className={`p-3 rounded-lg border-2 ${
                      removedIngredients.includes(ingredient.nombre)
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200'
                    }`}
                  >
                    {removedIngredients.includes(ingredient.nombre) 
                      ? `Sin ${ingredient.nombre}` 
                      : ingredient.nombre}
                  </button>
                ))}
                {(!Array.isArray(product.ingredients) || product.ingredients.length === 0) && (
                  <p className="text-gray-500 col-span-2 text-center">
                    No hay ingredientes disponibles para personalizar
                  </p>
                )}
              </div>
            </div>
          )}

          {step === (product.category === 'pizza' ? 4 : 3) && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-center">Instrucciones Especiales</h3>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Agrega instrucciones especiales para tu pedido..."
                className="w-full p-3 border-2 border-gray-200 rounded-lg h-32"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-between items-center bg-gray-50">
          <div>
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-2xl font-bold text-amber-800">
              ${((product.precios_por_tamano && selectedSize 
                ? product.precios_por_tamano[selectedSize] 
                : product.price) * quantity).toLocaleString()}
            </div>
          </div>
          <button
            onClick={handleNext}
            className="bg-amber-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-700 transition"
          >
            {step === totalSteps ? 'Agregar al Carrito' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderWizard; 