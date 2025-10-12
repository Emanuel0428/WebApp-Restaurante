import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.ts';
import { useCart } from '../context/CartContext.tsx';
import pizzaImage from '../assets/gallery1.webp';
import { Link } from 'react-router-dom';
import OrderWizard from '../components/OrderWizard';

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
  malFormateado?: boolean;
  precios_por_tamano?: { [key: string]: number };
}

const Menu = () => {
  const [activeCategory, setActiveCategory] = useState<string>('Entradas');
  const categories = ['Entradas', 'Platos Fuertes', 'Bebidas'];
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { cart, addToCart } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Importa todas las imágenes de la carpeta pizzas
  const pizzaImages = import.meta.glob('../assets/pizzas/*.{jpg,png,jpeg,webp}', { eager: true, query: '?url', import: 'default' });
  // Importa todas las imágenes de la carpeta entradas
  const entradasImages = import.meta.glob('../assets/entradas/*.{jpg,png,jpeg,webp}', { eager: true, query: '?url', import: 'default' });
  // Importa todas las imágenes de la carpeta bebidas
  const bebidasImages = import.meta.glob('../assets/bebidas/*.{jpg,png,jpeg,webp}', { eager: true, query: '?url', import: 'default' });

  // Imágenes por defecto para cada categoría
  const defaultImages: { [key: string]: string } = {
    pizza: pizzaImage as string,
    entrada: (entradasImages['../assets/entradas/pan-ajo.jpg'] as string) || pizzaImage as string,
    bebida: (bebidasImages['../assets/cocacola.jpg'] as string) || pizzaImage as string
  };

  // Obtener productos desde Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('productos')
          .select('*')
          .order('nombre', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
          setProducts([]);
        } else {
          const mappedProducts: Product[] = data.map((item: any) => {
            let ingredientes = [];
            let malFormateado = false;
            try {
              ingredientes = item.ingredientes ? JSON.parse(item.ingredientes) : [];
            } catch (e) {
              ingredientes = [];
              malFormateado = true;
            }
            let image: string = defaultImages[item.tipo as keyof typeof defaultImages] || pizzaImage;
            if (item.imagen && typeof item.imagen === 'string' && item.imagen.startsWith('http')) {
              image = item.imagen;
            } else if (item.tipo === 'pizza') {
              const imagePath = `../assets/pizzas/${item.imagen}`;
              image = item.imagen && pizzaImages[imagePath] ? (pizzaImages[imagePath] as string) : defaultImages.pizza;
            } else if (item.tipo === 'entrada') {
              const imagePath = `../assets/entradas/${item.imagen}`;
              image = item.imagen && entradasImages[imagePath] ? (entradasImages[imagePath] as string) : defaultImages.entrada;
            } else if (item.tipo === 'bebida') {
              const imagePath = `../assets/bebidas/${item.imagen}`;
              image = item.imagen && bebidasImages[imagePath] ? (bebidasImages[imagePath] as string) : defaultImages.bebida;
            }

            const precio = typeof item.precio === 'number' ? item.precio : 
                          typeof item.precio === 'string' ? parseFloat(item.precio) : 0;

            return {
              id: item.id_producto,
              name: item.nombre,
              description: item.descripcion,
              size: item.tamano || 'Mediana',
              price: precio,
              category: item.tipo,
              ingredients: ingredientes,
              image,
              malFormateado,
              precios_por_tamano: item.precios_por_tamano || {},
            };
          });
          setProducts(mappedProducts);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filtrar productos por categoría
  const getProductsByCategory = (category: string) => {
    switch (category) {
      case 'Entradas':
        return products.filter((p) => p.category === 'entrada' && !p.malFormateado);
      case 'Platos Fuertes':
        return products.filter((p) => p.category === 'pizza' && !p.malFormateado);
      case 'Bebidas':
        return products.filter((p) => p.category === 'bebida' && !p.malFormateado);
      default:
        return [];
    }
  };

  if (!loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <h2 className="text-2xl font-bold mb-4 text-amber-900">No hay productos disponibles</h2>
          <p className="text-gray-600">Verifica la conexión con la base de datos o agrega productos en el panel de administración.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header con categorías */}
      <div className="bg-amber-800 text-white sticky top-0 z-10 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex space-x-4">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeCategory === category
                      ? 'bg-amber-600 font-bold'
                      : 'hover:bg-amber-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid de productos */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {getProductsByCategory(activeCategory).map((product) => (
            <button
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 text-left group relative hover:border-2 hover:border-amber-800"
            >
              <div className="relative h-64">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.precios_por_tamano ? (
                  <div className="absolute bottom-4 right-4 bg-amber-800 text-white px-4 py-2 rounded-lg font-semibold shadow-lg">
                    Desde ${Math.min(...Object.values(product.precios_por_tamano)).toLocaleString()}
                  </div>
                ) : (
                  <div className="absolute bottom-4 right-4 bg-amber-800 text-white px-4 py-2 rounded-lg font-semibold shadow-lg">
                    ${product.price.toLocaleString()}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-amber-900 mb-2 group-hover:text-amber-800 transition-colors duration-300">
                  {product.name}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                  {product.description}
                </p>
                <div className="mt-4 flex justify-end">
                  <span className="inline-flex items-center justify-center px-4 py-2 bg-amber-100 text-amber-800 rounded-lg font-semibold group-hover:bg-amber-800 group-hover:text-white transition-colors duration-300">
                    Personalizar
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Order Wizard Modal */}
      {selectedProduct && (
        <OrderWizard
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={(item) => {
            addToCart(item);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
};

export default Menu;