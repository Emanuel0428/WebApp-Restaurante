// src/context/CartContext.tsx
import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';

export interface CartItem {
  id_producto: string;      // UUID del producto
  name: string;
  price: number;
  quantity: number;
  size: string;
  removedIngredients?: string[];
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateQuantity: (id_producto: string, quantity: number) => void;
  removeFromCart: (id_producto: string) => void;
  clearCart: () => void;
  subtotal: number;
  shipping: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (item: CartItem) => {
    setCart((prevCart) => {
      const existing = prevCart.find(ci => ci.id_producto === item.id_producto);
      if (existing) {
        return prevCart.map(ci =>
          ci.id_producto === item.id_producto
            ? { ...ci, quantity: ci.quantity + item.quantity }
            : ci
        );
      }
      return [...prevCart, item];
    });
  };

  const updateQuantity = (id_producto: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id_producto);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id_producto === id_producto ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (id_producto: string) => {
    setCart(prev => prev.filter(item => item.id_producto !== id_producto));
  };

  const clearCart = () => {
    setCart([]);
  };

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => {
      const price = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
      return sum + price * item.quantity;
    }, 0),
    [cart]
  );
  const shipping = useMemo(() => (cart.length > 0 ? 5000 : 0), [cart]);
  const total = useMemo(() => subtotal + shipping, [subtotal, shipping]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotal,
        shipping,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
