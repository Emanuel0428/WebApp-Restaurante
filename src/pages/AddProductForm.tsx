import React, { useState, useEffect } from 'react';
import { addProduct, fetchIngredients, addIngredient } from '../lib/supabase-functions';
import type { Ingredient, ProductData } from '../lib/supabase-functions';
import AdminHeader from '../pages/AdminHeader';  // Importa el header de administrador
import { supabase } from '../lib/supabase';

const AddProductForm: React.FC = () => {
  const [formData, setFormData] = useState<ProductData>({
    tipo: '',
    nombre: '',
    descripcion: '',
    imagen: '',
    detalles: '',
    ingredientes: [],
    precios_por_tamano: undefined,
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [newIngredientName, setNewIngredientName] = useState('');
  const [newIngredientUnit, setNewIngredientUnit] = useState('');
  const [ingredientQuantity, setIngredientQuantity] = useState(0);
  const [preciosPorTamano, setPreciosPorTamano] = useState<{ [size: string]: number }>({});
  const [nuevoTamano, setNuevoTamano] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState('');

  useEffect(() => {
    const loadIngredients = async () => {
      try {
        const data = await fetchIngredients();
        setIngredients(data);
      } catch (error) {
        console.error('Error al cargar ingredientes:', error);
      }
    };
    loadIngredients();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const filePath = `productos/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('productos').upload(filePath, file);
    if (error) {
      console.error('Error al subir imagen:', error.message);
      alert(`Error subiendo imagen: ${error.message}`);
      return;
    }
    const publicUrlData = supabase.storage.from('productos').getPublicUrl(filePath);
    if (!publicUrlData || !publicUrlData.data || !publicUrlData.data.publicUrl) {
      console.error('No se recibió una URL pública válida.');
      alert('Error: No se pudo obtener una URL pública válida.');
      return;
    }
    setFormData(prev => ({ ...prev, imagen: publicUrlData.data.publicUrl }));
  };

  const handleAddExistingIngredient = () => {
    const ingredient = ingredients.find(i => i.id_ingrediente === selectedIngredientId);
    if (ingredient && ingredientQuantity > 0) {
      setSelectedIngredients(prev => [
        ...prev,
        { ...ingredient, cantidad_usada: ingredientQuantity },
      ]);
      setIngredientQuantity(0);
      setSelectedIngredientId('');
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setSelectedIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddNewIngredient = async () => {
    if (!newIngredientName || !newIngredientUnit || ingredientQuantity <= 0) return;

    try {
      // Se requiere cant_minima, asumimos 0 por defecto para alta rápida
      const newIngredient = await addIngredient(newIngredientName, newIngredientUnit, 0);
      setIngredients(prev => [...prev, newIngredient]);
      setSelectedIngredients(prev => [
        ...prev,
        { ...newIngredient, cantidad_usada: ingredientQuantity },
      ]);
      setNewIngredientName('');
      setNewIngredientUnit('');
      setIngredientQuantity(0);
    } catch (error) {
      console.error('Error al agregar nuevo ingrediente:', error);
    }
  };

  const handleAddPrecioPorTamano = () => {
    if (!nuevoTamano.trim() || !nuevoPrecio || isNaN(Number(nuevoPrecio)) || Number(nuevoPrecio) <= 0) return;
    if (Object.keys(preciosPorTamano).includes(nuevoTamano)) return;
    setPreciosPorTamano(prev => ({ ...prev, [nuevoTamano]: parseFloat(nuevoPrecio) }));
    setNuevoTamano('');
    setNuevoPrecio('');
  };

  const handleRemovePrecioPorTamano = (size: string) => {
    setPreciosPorTamano(prev => {
      const copy = { ...prev };
      delete copy[size];
      return copy;
    });
  };

  const handleEditPrecioPorTamano = (size: string, newSize: string, newPrice: string) => {
    if (!newSize.trim() || !newPrice || isNaN(Number(newPrice)) || Number(newPrice) <= 0) return;
    if (newSize !== size && Object.keys(preciosPorTamano).includes(newSize)) return;
    setPreciosPorTamano(prev => {
      const copy = { ...prev };
      delete copy[size];
      copy[newSize] = parseFloat(newPrice);
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fullProduct: ProductData = {
      ...formData,
      ingredientes: selectedIngredients,
      precios_por_tamano: Object.keys(preciosPorTamano).length > 0 ? preciosPorTamano : undefined,
    };
    try {
      await addProduct(fullProduct);
      alert('Producto agregado con éxito');
      setFormData({
        tipo: '',
        nombre: '',
        descripcion: '',
        imagen: '',
        detalles: '',
        ingredientes: [],
        precios_por_tamano: undefined,
      });
      setSelectedIngredients([]);
      setPreciosPorTamano({});
    } catch (error) {
      console.error('Error al agregar producto:', error);
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 w-full z-50">
        <AdminHeader />
      </div>
      <div className="p-6 bg-gray-100 min-h-screen pt-20"> {/* pt-20 para dejar espacio al header fijo */}
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold mb-6 text-center text-amber-900 font-serif">Agregar Producto</h1>
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-lg p-6 border border-amber-200 space-y-8"
          >
            {/* Datos principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre || ''}
                  onChange={handleInputChange}
                  placeholder="Nombre"
                  required
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Tipo</label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded"
                  required
                >
                  <option value="">Selecciona un tipo</option>
                  <option value="pizza">Pizza</option>
                  <option value="bebida">Bebida</option>
                  <option value="entrada">Entrada</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block font-medium mb-1">Descripción</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion || ''}
                  onChange={handleInputChange}
                  placeholder="Descripción"
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-medium mb-1">Imagen del producto</label>
                <div className="flex flex-col gap-2 w-full">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full border px-3 py-2 rounded mb-2"
                  />
                  {formData.imagen && (
                    <img src={formData.imagen} alt="Previsualización" className="w-full max-w-xs h-32 object-cover rounded mb-2 border mx-auto" />
                  )}
                  <input
                    type="text"
                    name="imagen"
                    value={formData.imagen || ''}
                    onChange={handleInputChange}
                    placeholder="URL de imagen (opcional)"
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block font-medium mb-1">Detalles</label>
                <input
                  type="text"
                  name="detalles"
                  value={formData.detalles || ''}
                  onChange={handleInputChange}
                  placeholder="Detalles"
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
            </div>

            {/* Precios por tamaño */}
            <div className="mt-2">
              <h3 className="text-xl font-semibold mb-2 text-amber-900 font-serif">Precios por Tamaño</h3>
              <ul className="mb-4">
                {Object.entries(preciosPorTamano).map(([size, price]) => (
                  <li key={size} className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={size}
                      onChange={e => handleEditPrecioPorTamano(size, e.target.value, price.toString())}
                      className="border px-2 py-1 rounded w-32"
                    />
                    <input
                      type="number"
                      value={price}
                      onChange={e => handleEditPrecioPorTamano(size, size, e.target.value)}
                      className="border px-2 py-1 rounded w-32"
                    />
                    <button
                      type="button"
                      className="text-red-600 hover:text-red-800 text-sm"
                      onClick={() => handleRemovePrecioPorTamano(size)}
                    >Eliminar</button>
                  </li>
                ))}
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
                  type="button"
                  className="bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-700"
                  onClick={handleAddPrecioPorTamano}
                  disabled={
                    !nuevoTamano.trim() || !nuevoPrecio || isNaN(Number(nuevoPrecio)) || Number(nuevoPrecio) <= 0 ||
                    Object.keys(preciosPorTamano).includes(nuevoTamano)
                  }
                >Añadir</button>
              </div>
              {Object.keys(preciosPorTamano).length === 0 && (
                <p className="text-sm text-gray-500 mt-1">Agrega al menos un precio por tamaño para productos tipo pizza o bebida.</p>
              )}
            </div>

            {/* Ingredientes */}
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-2 text-amber-900 font-serif">Ingredientes</h3>
              <div className="mb-4">
                <h4 className="font-semibold mb-1">Agregar Ingrediente Existente</h4>
                <div className="flex gap-2 mb-2 flex-wrap">
                  <select
                    value={selectedIngredientId}
                    onChange={e => setSelectedIngredientId(e.target.value)}
                    className="border px-3 py-2 rounded w-1/2"
                  >
                    <option value="">Selecciona ingrediente</option>
                    {ingredients.map((ing) => (
                      <option key={ing.id_ingrediente} value={ing.id_ingrediente}>
                        {ing.nombre} ({ing.unidad})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Cantidad"
                    value={ingredientQuantity}
                    onChange={e => setIngredientQuantity(Number(e.target.value))}
                    className="border px-3 py-2 rounded w-1/4"
                  />
                  <button
                    type="button"
                    onClick={handleAddExistingIngredient}
                    className="bg-amber-600 text-white px-3 py-2 rounded hover:bg-amber-700"
                  >Añadir</button>
                </div>
              </div>
              <div className="mb-4">
                <h4 className="font-semibold mb-1">Agregar Nuevo Ingrediente</h4>
                <div className="flex gap-2 flex-wrap">
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={newIngredientName}
                    onChange={e => setNewIngredientName(e.target.value)}
                    className="border px-3 py-2 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Unidad"
                    value={newIngredientUnit}
                    onChange={e => setNewIngredientUnit(e.target.value)}
                    className="border px-3 py-2 rounded"
                  />
                  <input
                    type="number"
                    placeholder="Cantidad"
                    value={ingredientQuantity}
                    onChange={e => setIngredientQuantity(Number(e.target.value))}
                    className="border px-3 py-2 rounded"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewIngredient}
                    className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
                  >Añadir Ingrediente Nuevo</button>
                </div>
              </div>
              <ul className="mb-4">
                {selectedIngredients.map((ing, idx) => (
                  <li key={idx} className="flex items-center justify-between mb-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <span>{ing.nombre} - {ing.cantidad_usada} {ing.unidad}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(idx)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >Eliminar</button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <button
                type="submit"
                className="px-6 py-2 rounded bg-amber-600 text-white hover:bg-amber-700 font-bold text-lg shadow-md"
              >Guardar Producto</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddProductForm;
