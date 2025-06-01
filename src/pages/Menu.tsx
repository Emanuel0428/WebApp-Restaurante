import Slider from 'react-slick'; // Importamos el tipo Slider
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { supabase } from '../lib/supabase.ts';
import { useCart } from '../context/CartContext.tsx';
import { Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import pizzaImage from '../assets/gallery1.webp';
import NavigationBar from './NavigationBar.tsx';
import { useState, useEffect, useRef } from 'react'; // Restaurar importaciones necesarias para hooks de React
import HistoryButton from './HistoryButton';

interface Product {
  id: string;
  name: string;
  description: string;
  size: string;
  price: number;
  category: string;
  ingredients: any[];
  image?: string;
  malFormateado?: boolean;
  precios_por_tamano?: { [key: string]: number };
}

// Flechas personalizadas para el slider (abajo a la derecha)
const CustomPrevArrow = (props: any) => {
  const { className, style, onClick } = props;
  return (
    <div
      className={`${className} !flex !items-center !justify-center !bg-amber-800 !rounded-full !p-4 opacity-40 hover:opacity-100 transition-opacity duration-200 !cursor-pointer`}
      style={{ ...style, display: "block", left: 16, zIndex: 2 }}
      onClick={onClick}
      aria-label="Anterior"
    >
      <ChevronLeft width={40} height={40} className="stroke-white fill-white" />
    </div>
  );
};

const CustomNextArrow = (props: any) => {
  const { className, style, onClick } = props;
  return (
    <div
      className={`${className} !flex !items-center !justify-center !bg-amber-800 !rounded-full !p-4 opacity-40 hover:opacity-100 transition-opacity duration-200 !cursor-pointer`}
      style={{ ...style, display: "block", right: 16, zIndex: 2 }}
      onClick={onClick}
      aria-label="Siguiente"
    >
      <ChevronRight width={40} height={40} className="stroke-white fill-white" />
    </div>
  );
};

// Importa todas las imágenes de la carpeta pizzas
const pizzaImages = import.meta.glob('../assets/pizzas/*.{jpg,png,jpeg,webp}', { eager: true, as: 'url' });
// Importa todas las imágenes de la carpeta entradas
const entradasImages = import.meta.glob('../assets/entradas/*.{jpg,png,jpeg,webp}', { eager: true, as: 'url' });
// Importa todas las imágenes de la carpeta bebidas
const bebidasImages = import.meta.glob('../assets/bebidas/*.{jpg,png,jpeg,webp}', { eager: true, as: 'url' });

// Imágenes por defecto para cada categoría
const defaultImages = {
  pizza: pizzaImage,
  entrada: entradasImages['../assets/entradas/pan-ajo.jpg'] || pizzaImage,
  bebida: bebidasImages['../assets/cocacola.jpg'] || pizzaImage
};

// Modal reutilizable para agregar productos al carrito
interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: any) => void;
  type: string;
}
const ProductModal = ({ product, isOpen, onClose, onAdd, type }: ProductModalProps) => {
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [details, setDetails] = useState('');
  useEffect(() => {
    if (isOpen && product) {
      setSize(product.size || 'Mediana');
      setQuantity(1);
      setDetails('');
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-red-500">✕</button>
        <h2 className="text-xl font-bold mb-2 text-amber-900">{product.name}</h2>
        <img src={product.image} alt={product.name} className="w-32 h-32 object-cover rounded-full mx-auto mb-2" />
        <p className="text-gray-600 mb-2 text-center">{product.description}</p>
        {(type === 'pizza' || (type === 'bebida' && product.precios_por_tamano && Object.keys(product.precios_por_tamano).length > 0)) && (
          <div className="mb-2">
            <label className="block text-gray-700 mb-1">Tamaño:</label>
            <select
              value={size}
              onChange={e => setSize(e.target.value)}
              className="w-full p-2 border-2 border-amber-700 rounded-lg bg-amber-50"
            >
              {product.precios_por_tamano && Object.keys(product.precios_por_tamano).map(sz => (
                <option key={sz} value={sz}>{sz}</option>
              ))}
            </select>
          </div>
        )}
        <div className="mb-2">
          <label className="block text-gray-700 mb-1">Cantidad:</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={e => setQuantity(Number(e.target.value))}
            className="w-full p-2 border-2 border-amber-700 rounded-lg bg-amber-50"
          />
        </div>
        <div className="mb-2">
          <label className="block text-gray-700 mb-1">Detalles del pedido:</label>
          {type === 'bebida' ? (
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Ej: en vaso, con hielo, sin hielo"
              className="w-full p-2 border-2 border-amber-700 rounded-lg bg-amber-50"
            />
          ) : (
            <input
              type="text"
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Ej: sin cebolla, extra queso"
              className="w-full p-2 border-2 border-amber-700 rounded-lg bg-amber-50"
            />
          )}
        </div>
        <button
          className="w-full bg-amber-800 text-white py-2 rounded-lg font-semibold hover:bg-amber-900 transition mt-2"
          onClick={() => {
            onAdd({
              ...product,
              size,
              quantity,
              detalles_personalizados: details,
            });
            onClose();
          }}
        >Agregar al carrito</button>
      </div>
    </div>
  );
};

const Menu = () => {
  const [activeCategory, setActiveCategory] = useState<string>('Entradas');
  const categories = ['Entradas', 'Platos Fuertes', 'Bebidas'];
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { cart, addToCart, updateQuantity } = useCart();
  const [currentPage, setCurrentPage] = useState<{ [key: string]: number }>({});
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  // Referencia al slider con el tipo correcto
  const sliderRef = useRef<any>(null); 
  // Mapear categorías a índices del slider
  const categoryToSlideIndex: { [key: string]: number } = {
    'Entradas': 0, // Índice 0: Sección de Entradas
    'Platos Fuertes': 1, // Índice 1: Sección de Platos Fuertes
    'Bebidas': 2, // Índice 2: Sección de Bebidas
  };
  const slideIndexToCategory: { [key: number]: string } = {
    0: 'Entradas',
    1: 'Platos Fuertes',
    2: 'Bebidas',
  };

  // Configuración del slider
  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    prevArrow: <CustomPrevArrow />,
    nextArrow: <CustomNextArrow />,
    afterChange: (current: number) => {
      setActiveCategory(slideIndexToCategory[current]);
    },
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

        // Si no hay datos en Supabase, mostramos mensaje y no usamos mock
        if (!data || data.length === 0) {
          setProducts([]);
        } else {
          // Log para ver los datos de los productos
          console.log('Productos desde Supabase:', data.map(item => ({
            nombre: item.nombre,
            tipo: item.tipo,
            imagen: item.imagen,
            precio: item.precio,
            precios_por_tamano: item.precios_por_tamano
          })));
          
          // Mapeamos los datos de Supabase y aseguramos la categoría
          const mappedProducts: Product[] = data.map((item: any) => {
            let ingredientes = [];
            let malFormateado = false;
            try {
              ingredientes = item.ingredientes ? JSON.parse(item.ingredientes) : [];
            } catch (e) {
              ingredientes = [];
              malFormateado = true;
              console.error('Ingrediente mal formateado en producto:', item.nombre, item.ingredientes);
            }
            let image = defaultImages[item.tipo as keyof typeof defaultImages] || pizzaImage;
            // Si la imagen es una URL pública (de Supabase Storage), úsala directamente
            if (item.imagen && typeof item.imagen === 'string' && item.imagen.startsWith('http')) {
              image = item.imagen;
            } else if (item.tipo === 'pizza') {
              const imagePath = `../assets/pizzas/${item.imagen}`;
              image = item.imagen && pizzaImages[imagePath] ? pizzaImages[imagePath] : defaultImages.pizza;
            } else if (item.tipo === 'entrada') {
              const imagePath = `../assets/entradas/${item.imagen}`;
              image = item.imagen && entradasImages[imagePath] ? entradasImages[imagePath] : defaultImages.entrada;
            } else if (item.tipo === 'bebida') {
              const imagePath = `../assets/bebidas/${item.imagen}`;
              image = item.imagen && bebidasImages[imagePath] ? bebidasImages[imagePath] : defaultImages.bebida;
            }

            // Asegurarnos de que el precio sea un número válido
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
        setProducts([]); // No usar mock
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Obtener la cantidad de un producto en el carrito
  const getQuantityInCart = (productId: string) => {
    const item = cart.find((cartItem) => cartItem.id_producto === productId);
    return item ? item.quantity : 0;
  };

  // Paginación
  const itemsPerPage = 9;
  const paginateItems = (category: string, items: Product[]) => {
    const page = currentPage[category] || 1;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  const handlePageChange = (category: string, page: number) => {
    setCurrentPage((prev) => ({ ...prev, [category]: page }));
  };

  const getTotalPages = (items: Product[]) => Math.ceil(items.length / itemsPerPage);

  // Filtrar productos por categoría
  const pizzas = products.filter((p) => p.category === 'pizza' && !p.malFormateado);
  const entradas = products.filter((p) => p.category === 'entrada' && !p.malFormateado);
  const bebidas = products.filter((p) => p.category === 'bebida' && !p.malFormateado);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    const slideIndex = categoryToSlideIndex[category];
    if (sliderRef.current) {
      sliderRef.current.slickGoTo(slideIndex);
    }
  };

  // Mostrar mensaje si hay error o no hay productos
  if (!loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow text-center">
          <h2 className="text-2xl font-bold mb-4 text-amber-900 dark:text-amber-300">No hay productos disponibles</h2>
          <p className="text-gray-600 dark:text-gray-200">Verifica la conexión con la base de datos o agrega productos en el panel de administración.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: 'url("https://www.transparenttextures.com/patterns/wood-pattern.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <NavigationBar
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        currentPage={currentPage['pizza'] || 1}
        totalPages={getTotalPages(pizzas)}
        onPageChange={(page) => handlePageChange('pizza', page)}
      />
      {/* Contenido del menú que ocupa toda la página */}
      <div className="flex-1 flex items-left justify-center py-8">
        <div className="w-full px-4">
          <Slider {...sliderSettings} ref={sliderRef}>
            {/* Entradas */}
            <div className="px-4">
              <h2 className="text-2xl font-bold mb-2 text-amber-900 text-center font-serif">Entradas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {entradas.map((product: Product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl shadow-lg p-4 border border-amber-700 flex flex-col items-center hover:shadow-amber-200 transition-all duration-200"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-24 h-24 object-cover rounded-lg mb-2 border-2 border-amber-200"
                    />
                    <h3 className="text-lg font-bold mb-1 text-amber-900 font-serif text-center">{product.name}</h3>
                    <p className="text-gray-600 mb-2 text-center text-sm">{product.description}</p>
                    {product.precios_por_tamano && Object.keys(product.precios_por_tamano).length > 0 ? (
                      <div className="mb-2 w-full flex flex-col items-center">
                        <span className="block text-gray-700 mb-1 font-serif text-center font-semibold">Precios por tamaño:</span>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {Object.entries(product.precios_por_tamano).map(([size, price]) => (
                            <div key={size} className="bg-amber-100 border border-amber-700 rounded-lg px-3 py-1 text-sm font-serif flex flex-col items-center shadow-sm">
                              <span className="font-bold text-amber-900">{size}</span>
                              <span className="text-amber-800">${price.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-lg font-bold text-amber-900 mb-2">${product.price.toLocaleString()}</p>
                    )}
                    <button
                      onClick={() => setModalProduct(product)}
                      className="w-full bg-amber-800 text-white py-2 rounded-lg font-semibold hover:bg-amber-900 transition font-serif mt-2"
                    >Agregar al Carrito</button>
                  </div>
                ))}
              </div>
            </div>
            {/* Platos Fuertes (solo Pizzas) */}
            <div className="px-4">
              <h2 className="text-2xl font-bold mb-2 text-amber-900 text-center font-serif">Platos Fuertes</h2>
              {loading ? (
                <p className="text-center text-gray-500">Cargando pizzas...</p>
              ) : pizzas.length === 0 ? (
                <p className="text-center text-gray-500">No se encontraron pizzas.</p>
              ) : (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                    {paginateItems('pizza', pizzas).map((product) => {
                      const quantity = getQuantityInCart(product.id);
                      return (
                        <div
                          key={product.id}
                          className="bg-white rounded-lg shadow-md p-4 border border-amber-700 flex flex-col items-center"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-32 h-32 object-cover rounded-full mb-2"
                          />
                          <h3 className="text-xl font-semibold mb-1 font-serif text-center">{product.name}</h3>
                          <p className="text-gray-600 mb-2 text-center text-sm">{product.description}</p>
                          {/* En Platos Fuertes (Pizzas), mostrar los precios por tamaño de forma visual y estética */}
                          {product.precios_por_tamano && (
                            <div className="mb-2 w-full flex flex-col items-center">
                              <span className="block text-gray-700 mb-1 font-serif text-center font-semibold">Precios por tamaño:</span>
                              <div className="flex flex-wrap gap-2 justify-center">
                                {Object.entries(product.precios_por_tamano).map(([size, price]) => (
                                  <div key={size} className="bg-amber-100 border border-amber-700 rounded-lg px-3 py-1 text-sm font-serif flex flex-col items-center shadow-sm">
                                    <span className="font-bold text-amber-900">{size}</span>
                                    <span className="text-amber-800">${price.toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="mt-2">
                            {quantity === 0 ? (
                              <button
                                onClick={() => setModalProduct(product)}
                                className="w-full bg-amber-800 text-white py-2 rounded-lg font-semibold hover:bg-amber-900 transition font-serif"
                              >
                                Agregar al Carrito
                              </button>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => updateQuantity(product.id, quantity - 1)}
                                  className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"
                                >
                                  <Minus className="w-5 h-5" />
                                </button>
                                <span className="text-lg font-semibold">{quantity}</span>
                                <button
                                  onClick={() => updateQuantity(product.id, quantity + 1)}
                                  className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"
                                >
                                  <Plus className="w-5 h-5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            {/* Bebidas */}
            <div className="px-4">
              <h2 className="text-2xl font-bold mb-2 text-amber-900 text-center font-serif">Bebidas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bebidas.map((product: Product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl shadow-lg p-4 border border-amber-700 flex flex-col items-center hover:shadow-amber-200 transition-all duration-200"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-24 h-24 object-cover rounded-lg mb-2 border-2 border-amber-200"
                    />
                    <h3 className="text-lg font-bold mb-1 text-amber-900 font-serif text-center">{product.name}</h3>
                    <p className="text-gray-600 mb-2 text-center text-sm">{product.description}</p>
                    {product.precios_por_tamano && Object.keys(product.precios_por_tamano).length > 0 ? (
                      <div className="mb-2 w-full flex flex-col items-center">
                        <span className="block text-gray-700 mb-1 font-serif text-center font-semibold">Precios por tamaño:</span>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {Object.entries(product.precios_por_tamano).map(([size, price]) => (
                            <div key={size} className="bg-amber-100 border border-amber-700 rounded-lg px-3 py-1 text-sm font-serif flex flex-col items-center shadow-sm">
                              <span className="font-bold text-amber-900">{size}</span>
                              <span className="text-amber-800">${price.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-lg font-bold text-amber-900 mb-2">${product.price.toLocaleString()}</p>
                    )}
                    <button
                      onClick={() => setModalProduct(product)}
                      className="w-full bg-amber-800 text-white py-2 rounded-lg font-semibold hover:bg-amber-900 transition font-serif mt-2"
                    >Agregar al Carrito</button>
                  </div>
                ))}
              </div>
            </div>
          </Slider>
        </div>
      </div>
      <HistoryButton />
      <ProductModal
        product={modalProduct}
        isOpen={!!modalProduct}
        onClose={() => setModalProduct(null)}
        onAdd={(item) => {
          let price = 0;
          if (item.precios_por_tamano && Object.keys(item.precios_por_tamano).length > 0) {
            if (item.size && item.precios_por_tamano[item.size]) {
              price = item.precios_por_tamano[item.size];
            } else {
              const firstKey = Object.keys(item.precios_por_tamano)[0];
              price = item.precios_por_tamano[firstKey] || 0;
            }
          } else if (typeof item.price === 'number' && !isNaN(item.price)) {
            price = item.price;
          }
          addToCart({
            id_producto: item.id,
            name: item.name,
            price,
            quantity: item.quantity,
            size: item.size,
            removedIngredients: [],
            // detalles_personalizados no se guarda en el carrito, solo para backend
          });
        }}
        type={modalProduct?.category || ''}
      />
    </div>
  );
};

export default Menu;