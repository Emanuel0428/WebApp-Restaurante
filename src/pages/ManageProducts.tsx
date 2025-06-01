import { useEffect, useState } from 'react';
import {
  getAllProducts,
  deleteProduct,
  updateProduct,
  ProductFromDB,
  fetchIngredients
} from '../lib/supabase-functions';
import AdminHeader from '../pages/AdminHeader';

const tipoOpciones = ['pizza', 'bebida', 'postre'];

const ManageProducts = () => {
  const [products, setProducts] = useState<ProductFromDB[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductFromDB[]>([]);
  const [editingProduct, setEditingProduct] = useState<ProductFromDB | null>(null);
  const [loading, setLoading] = useState(false);
  const [ingredientsList, setIngredientsList] = useState<{ id_ingrediente: string, nombre: string, unidad: string }[]>([]);
  const [newIngredient, setNewIngredient] = useState({ nombre: '', unidad: '', cantidad_usada: 0 });
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null);
  const [selectedCantidad, setSelectedCantidad] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [nuevoTamano, setNuevoTamano] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [preciosEditTemp, setPreciosEditTemp] = useState<{ [size: string]: { size: string; price: string } }>({});

  useEffect(() => {
    loadProducts();
    loadIngredients();
  }, []);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        typeof product.nombre === 'string' && product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getAllProducts();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadIngredients = async () => {
    try {
      const data = await fetchIngredients();
      setIngredientsList(data);
    } catch (error) {
      console.error('Error al cargar ingredientes:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await deleteProduct(id);
        loadProducts();
      } catch (error) {
        console.error('Error al eliminar producto:', error);
      }
    }
  };

  const handleEdit = (product: ProductFromDB) => {
    setEditingProduct(product);
  };

  const handleChange = (field: keyof ProductFromDB, value: string | number) => {
    if (!editingProduct) return;
    setEditingProduct({ ...editingProduct, [field]: value });
  };

  const handleAddSelectedIngredient = () => {
    if (!selectedIngredient || selectedCantidad <= 0) return;

    const ingredient = ingredientsList.find(i => i.id_ingrediente === selectedIngredient);
    if (ingredient) {
      setEditingProduct({
        ...editingProduct!,
        ingredientes: [
          ...editingProduct!.ingredientes,
          { ...ingredient, cantidad_usada: selectedCantidad }
        ]
      });
      setSelectedCantidad(0);
      setSelectedIngredient(null);
    }
  };

  const handleAddNewIngredient = () => {
    if (newIngredient.nombre && newIngredient.unidad && newIngredient.cantidad_usada > 0) {
      const newIng = { ...newIngredient, id_ingrediente: `${Date.now()}` };

      setEditingProduct({
        ...editingProduct!,
        ingredientes: [...editingProduct!.ingredientes, { ...newIng, cantidad_usada: newIngredient.cantidad_usada }]
      });

      setIngredientsList((prev) => [
        ...prev,
        { id_ingrediente: newIng.id_ingrediente, nombre: newIng.nombre, unidad: newIng.unidad }
      ]);

      setNewIngredient({ nombre: '', unidad: '', cantidad_usada: 0 });
    }
  };

  const handleRemoveIngredient = (index: number) => {
    if (!editingProduct) return;
    const newIngredients = [...editingProduct.ingredientes];
    newIngredients.splice(index, 1);
    setEditingProduct({ ...editingProduct, ingredientes: newIngredients });
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <AdminHeader />

      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-center">Gestión de Productos</h1>

        <div className="mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border px-3 py-2 mb-3"
            placeholder="Buscar por nombre de producto"
          />
        </div>

        {loading ? (
          <p className="text-center">Cargando productos...</p>
        ) : (
          <ul className="space-y-4">
            {filteredProducts.map((product) => (
              <li key={product.id_producto} className="border rounded p-4 shadow-lg flex flex-col bg-white mb-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div>
                    <h2 className="text-lg font-semibold">{product.nombre}</h2>
                    <p>{product.descripcion}</p>
                    {product.precios_por_tamano && (
                      <div className="mb-2">
                        <span className="font-semibold">Precios por tamaño: </span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {Object.entries(product.precios_por_tamano).map(([size, price]) => (
                            <span
                              key={size}
                              className="inline-block bg-amber-100 border border-amber-700 rounded-lg px-3 py-1 text-sm font-serif text-amber-900 font-bold shadow-sm"
                            >
                              {size}: <span className="text-amber-800 font-normal">${Number(price).toLocaleString()}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-row sm:flex-col gap-2 sm:gap-2 items-end sm:items-end self-end sm:self-auto">
                    <button
                      onClick={() => handleEdit(product)}
                      className="bg-orange-600 text-white px-3 py-1 rounded hover:bg-orange-700 w-24"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(product.id_producto)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 w-24"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                {editingProduct && editingProduct.id_producto === product.id_producto && (
                  <div className="mt-6 bg-gray-50 p-6 rounded shadow-md">
                    <h2 className="text-2xl font-bold mb-4">Editar Producto</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-medium">Nombre</label>
                        <input
                          type="text"
                          value={editingProduct.nombre}
                          onChange={(e) => handleChange('nombre', e.target.value)}
                          className="w-full border px-3 py-2 rounded"
                        />
                      </div>
                      <div>
                        <label className="block font-medium">Tipo</label>
                        <select
                          value={editingProduct.tipo}
                          onChange={(e) => handleChange('tipo', e.target.value)}
                          className="w-full border px-3 py-2 rounded"
                        >
                          {tipoOpciones.map((tipo) => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block font-medium mb-1">Imagen del producto</label>
                      {editingProduct.imagen && (
                        <div className="mb-2 flex items-center gap-4">
                          <img src={editingProduct.imagen} alt="Previsualización" className="w-32 h-32 object-cover rounded border" />
                          <button
                            type="button"
                            className="text-red-600 hover:text-red-800 text-sm border px-2 py-1 rounded"
                            onClick={() => handleChange('imagen', '')}
                          >Eliminar Imagen</button>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const filePath = `productos/${Date.now()}_${file.name}`;
                          const { error } = await import('../lib/supabase').then(m => m.supabase.storage.from('productos').upload(filePath, file));
                          if (error) {
                            alert('Error subiendo imagen: ' + error.message);
                            return;
                          }
                          const publicUrlData = (await import('../lib/supabase')).supabase.storage.from('productos').getPublicUrl(filePath);
                          if (!publicUrlData || !publicUrlData.data || !publicUrlData.data.publicUrl) {
                            alert('Error: No se pudo obtener una URL pública válida.');
                            return;
                          }
                          handleChange('imagen', publicUrlData.data.publicUrl);
                        }}
                        className="w-full border px-3 py-2 rounded mb-2"
                      />
                      <input
                        type="text"
                        value={editingProduct.imagen || ''}
                        onChange={e => handleChange('imagen', e.target.value)}
                        placeholder="URL de imagen (opcional)"
                        className="w-full border px-3 py-2 rounded"
                      />
                    </div>
                    <div className="mt-6">
                      <h3 className="text-xl font-semibold mb-2">Precios por Tamaño</h3>
                      <ul className="mb-4">
                        {editingProduct.precios_por_tamano &&
                          Object.entries(editingProduct.precios_por_tamano).map(([size, price]) => {
                            const isEditing = preciosEditTemp[size] !== undefined;
                            return (
                              <li key={size} className="flex items-center gap-2 mb-2">
                                {isEditing ? (
                                  <>
                                    <input
                                      type="text"
                                      value={preciosEditTemp[size].size}
                                      onChange={e => {
                                        setPreciosEditTemp(prev => ({
                                          ...prev,
                                          [size]: { ...prev[size], size: e.target.value }
                                        }));
                                      }}
                                      className="border px-2 py-1 rounded w-32"
                                      autoFocus
                                    />
                                    <input
                                      type="number"
                                      value={preciosEditTemp[size].price}
                                      onChange={e => {
                                        setPreciosEditTemp(prev => ({
                                          ...prev,
                                          [size]: { ...prev[size], price: e.target.value }
                                        }));
                                      }}
                                      className="border px-2 py-1 rounded w-32"
                                    />
                                    <button
                                      className="text-green-600 hover:text-green-800 text-sm"
                                      onClick={() => {
                                        const newSize = preciosEditTemp[size].size.trim();
                                        const newPrice = parseFloat(preciosEditTemp[size].price);
                                        if (!newSize || isNaN(newPrice) || newPrice <= 0) return;
                                        if (
                                          newSize !== size &&
                                          Object.keys(editingProduct.precios_por_tamano).includes(newSize)
                                        ) {
                                          alert('Ya existe ese tamaño');
                                          return;
                                        }
                                        const newPrecios = { ...editingProduct.precios_por_tamano };
                                        delete newPrecios[size];
                                        newPrecios[newSize] = newPrice;
                                        setEditingProduct({ ...editingProduct, precios_por_tamano: newPrecios });
                                        setPreciosEditTemp(prev => {
                                          const copy = { ...prev };
                                          delete copy[size];
                                          return copy;
                                        });
                                      }}
                                    >Guardar</button>
                                    <button
                                      className="text-gray-600 hover:text-gray-800 text-sm"
                                      onClick={() => {
                                        setPreciosEditTemp(prev => {
                                          const copy = { ...prev };
                                          delete copy[size];
                                          return copy;
                                        });
                                      }}
                                    >Cancelar</button>
                                  </>
                                ) : (
                                  <>
                                    <input
                                      type="text"
                                      value={size}
                                      disabled
                                      className="border px-2 py-1 rounded w-32 bg-gray-100 text-gray-500"
                                    />
                                    <input
                                      type="number"
                                      value={typeof price === 'number' ? price : ''}
                                      disabled
                                      className="border px-2 py-1 rounded w-32 bg-gray-100 text-gray-500"
                                    />
                                    <button
                                      className="text-blue-600 hover:text-blue-800 text-sm"
                                      onClick={() => {
                                        setPreciosEditTemp(prev => ({
                                          ...prev,
                                          [size]: { size, price: String(price) }
                                        }));
                                      }}
                                    >Editar</button>
                                    <button
                                      className="text-red-600 hover:text-red-800 text-sm"
                                      onClick={() => {
                                        const newPrecios = { ...editingProduct.precios_por_tamano };
                                        delete newPrecios[size];
                                        setEditingProduct({ ...editingProduct, precios_por_tamano: newPrecios });
                                        setPreciosEditTemp(prev => {
                                          const copy = { ...prev };
                                          delete copy[size];
                                          return copy;
                                        });
                                      }}
                                    >Eliminar</button>
                                  </>
                                )}
                              </li>
                            );
                          })}
                      </ul>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Tamaño"
                          value={nuevoTamano}
                          onChange={e => setNuevoTamano(e.target.value)}
                          className="border px-2 py-1 rounded w-32"
                        />
                        <input
                          type="number"
                          placeholder="Precio"
                          value={nuevoPrecio}
                          onChange={e => setNuevoPrecio(e.target.value)}
                          className="border px-2 py-1 rounded w-32"
                        />
                        <button
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          onClick={() => {
                            if (!nuevoTamano.trim() || !nuevoPrecio || isNaN(Number(nuevoPrecio)) || Number(nuevoPrecio) <= 0) return;
                            if (editingProduct.precios_por_tamano && Object.keys(editingProduct.precios_por_tamano).includes(nuevoTamano)) return;
                            setEditingProduct({
                              ...editingProduct,
                              precios_por_tamano: {
                                ...editingProduct.precios_por_tamano,
                                [nuevoTamano]: parseFloat(nuevoPrecio)
                              }
                            });
                            setNuevoTamano('');
                            setNuevoPrecio('');
                          }}
                          disabled={
                            !nuevoTamano.trim() || !nuevoPrecio || isNaN(Number(nuevoPrecio)) || Number(nuevoPrecio) <= 0 ||
                            (editingProduct.precios_por_tamano && Object.keys(editingProduct.precios_por_tamano).includes(nuevoTamano))
                          }
                        >Añadir</button>
                      </div>
                    </div>
                    <div className="mt-6">
                      <h3 className="text-xl font-semibold mb-2">Ingredientes</h3>
                      <ul className="mb-4">
                        {editingProduct.ingredientes.map((ing, index) => (
                          <li key={index} className="flex items-center justify-between mb-2">
                            <span>{ing.nombre} - {ing.cantidad_usada} {ing.unidad}</span>
                            <button
                              onClick={() => handleRemoveIngredient(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >Eliminar</button>
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-2 mb-4">
                        <select
                          value={selectedIngredient || ''}
                          onChange={(e) => setSelectedIngredient(e.target.value)}
                          className="border px-3 py-2 rounded w-1/2"
                        >
                          <option value="">Selecciona un ingrediente</option>
                          {ingredientsList.map((ing) => (
                            <option key={ing.id_ingrediente} value={ing.id_ingrediente}>
                              {ing.nombre} ({ing.unidad})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          placeholder="Cantidad"
                          value={selectedCantidad}
                          onChange={(e) => setSelectedCantidad(parseFloat(e.target.value))}
                          className="border px-3 py-2 rounded w-1/4"
                        />
                        <button
                          onClick={handleAddSelectedIngredient}
                          className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
                        >Añadir</button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Nombre nuevo ingrediente"
                          value={newIngredient.nombre}
                          onChange={(e) => setNewIngredient({ ...newIngredient, nombre: e.target.value })}
                          className="border px-3 py-2 rounded"
                        />
                        <input
                          type="text"
                          placeholder="Unidad"
                          value={newIngredient.unidad}
                          onChange={(e) => setNewIngredient({ ...newIngredient, unidad: e.target.value })}
                          className="border px-3 py-2 rounded"
                        />
                        <input
                          type="number"
                          placeholder="Cantidad"
                          value={newIngredient.cantidad_usada}
                          onChange={(e) => setNewIngredient({ ...newIngredient, cantidad_usada: parseFloat(e.target.value) })}
                          className="border px-3 py-2 rounded"
                        />
                      </div>
                      <button
                        onClick={handleAddNewIngredient}
                        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >Añadir Ingrediente Nuevo</button>
                    </div>
                    <div className="mt-6 flex justify-end gap-4">
                      <button
                        onClick={() => setEditingProduct(null)}
                        className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                      >Cancelar</button>
                      <button
                        onClick={async () => {
                          if (!editingProduct || !editingProduct.id_producto) return;
                          let preciosPorTamano: Record<string, number> = {};
                          if (editingProduct.precios_por_tamano) {
                            const orden = ["Grande", "Mediana", "Pequeña"];
                            orden.forEach((key) => {
                              const found = Object.entries(editingProduct.precios_por_tamano).find(
                                ([k]) => k.toLowerCase() === key.toLowerCase()
                              );
                              if (found) {
                                preciosPorTamano[key] = Number(found[1]);
                              }
                            });
                          }
                          const updatedProduct = {
                            tipo: editingProduct.tipo,
                            nombre: editingProduct.nombre,
                            descripcion: editingProduct.descripcion,
                            imagen: editingProduct.imagen,
                            detalles: editingProduct.detalles,
                            ingredientes: editingProduct.ingredientes,
                            precios_por_tamano: Object.keys(preciosPorTamano).length > 0 ? preciosPorTamano : undefined
                          };
                          try {
                            await updateProduct(editingProduct.id_producto, updatedProduct);
                            setEditingProduct(null);
                            loadProducts();
                          } catch (error) {
                            let msg = 'Error al actualizar producto';
                            if (error instanceof Error) msg += ': ' + error.message;
                            else if (typeof error === 'string') msg += ': ' + error;
                            alert(msg);
                          }
                        }}
                        className="px-4 py-2 rounded bg-amber-600 text-white hover:bg-amber-700"
                      >Guardar Cambios</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ManageProducts;