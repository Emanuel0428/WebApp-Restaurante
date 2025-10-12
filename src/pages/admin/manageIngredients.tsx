import { useEffect, useState } from 'react';
import { fetchIngredients, addIngredient, updateIngredient, deleteIngredient } from '../../lib/supabase-functions';
import AdminHeader from './AdminHeader';

const ManageIngredients = () => {
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [filteredIngredients, setFilteredIngredients] = useState<any[]>([]);
  const [newIngredient, setNewIngredient] = useState({ nombre: '', unidad: '', cant_minima: '' });
  const [editingIngredient, setEditingIngredient] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadIngredients();
  }, []);

  useEffect(() => {
    const filtered = ingredients.filter((ing) =>
      ing.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredIngredients(filtered);
  }, [ingredients, searchTerm]);

  const loadIngredients = async () => {
    try {
      const data = await fetchIngredients();
      const sorted = data.sort((a, b) => a.nombre.localeCompare(b.nombre));
      setIngredients(sorted);
    } catch (error) {
      setError('Error al cargar ingredientes.');
    }
  };

  const handleAddIngredient = async () => {
    if (!newIngredient.nombre || !newIngredient.unidad || newIngredient.cant_minima === '') {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setLoading(true);
    try {
      // Asegúrate de que addIngredient acepte el nuevo campo cant_minima
      await addIngredient(newIngredient.nombre, newIngredient.unidad, Number(newIngredient.cant_minima));
      setSuccessMessage('Ingrediente agregado correctamente.');
      setNewIngredient({ nombre: '', unidad: '', cant_minima: '' });
      setError(null);
      loadIngredients();
    } catch (error) {
      setError('Error al agregar ingrediente.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleUpdateIngredient = async () => {
    if (!editingIngredient || !editingIngredient.nombre || !editingIngredient.unidad || editingIngredient.cant_minima === '') {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setLoading(true);
    try {
      // Asegúrate de que updateIngredient acepte el nuevo campo cant_minima
      await updateIngredient(
        editingIngredient.id_ingrediente,
        editingIngredient.nombre,
        editingIngredient.unidad,
        Number(editingIngredient.cant_minima)
      );
      setSuccessMessage('Ingrediente actualizado correctamente.');
      setEditingIngredient(null);
      setError(null);
      loadIngredients();
    } catch (error) {
      setError('Error al actualizar ingrediente.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleDeleteIngredient = async (id_ingrediente: string) => {
    if (window.confirm('¿Estás seguro de eliminar este ingrediente?')) {
      try {
        await deleteIngredient(id_ingrediente);
        loadIngredients();
      } catch (error) {
        setError('Error al eliminar ingrediente.');
      }
    }
  };

  const handleEditIngredient = (ingredient: any) => {
    setEditingIngredient({ ...ingredient });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen pt-20"> {/* pt-20 para dejar espacio al header fijo */}
      <div className="fixed top-0 left-0 w-full z-50">
        <AdminHeader />
      </div>
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold mb-2 text-amber-600">Gestión de Ingredientes</h1> {/* mb-2 para menos espacio */}
        <span className="text-3xl font-bold text-white">Bigotes</span>

        {error && <div className="text-red-600 mb-4">{error}</div>}
        {successMessage && <div className="text-green-600 mb-4">{successMessage}</div>}

        {/* Buscador */}
        <div className="mb-4"> {/* mb-4 para menos espacio */}
          <input
            type="text"
            placeholder="Buscar ingrediente por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border w-full px-4 py-2 rounded-lg shadow-sm"
          />
        </div>

        {/* Nuevo ingrediente */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Nuevo Ingrediente</h2>
          <input
            type="text"
            placeholder="Nombre del ingrediente"
            value={newIngredient.nombre}
            onChange={(e) => setNewIngredient({ ...newIngredient, nombre: e.target.value })}
            className="border px-3 py-2 mb-2 w-full rounded"
          />
          <input
            type="text"
            placeholder="Unidad (ej: gramos, unidades)"
            value={newIngredient.unidad}
            onChange={(e) => setNewIngredient({ ...newIngredient, unidad: e.target.value })}
            className="border px-3 py-2 mb-2 w-full rounded"
          />
          <input
            type="number"
            placeholder="Cantidad mínima"
            value={newIngredient.cant_minima}
            onChange={(e) => setNewIngredient({ ...newIngredient, cant_minima: e.target.value })}
            className="border px-3 py-2 mb-2 w-full rounded"
            min={0}
          />
          <button
            onClick={handleAddIngredient}
            disabled={loading}
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
          >
            Agregar Ingrediente
          </button>
        </div>

        {/* Lista de ingredientes */}
        <ul className="space-y-4">
          {filteredIngredients.map((ingredient) => (
            <li key={ingredient.id_ingrediente} className="flex flex-col border p-4 rounded shadow-sm mb-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{ingredient.nombre}</p>
                  <p className="text-sm text-gray-500">Unidad: {ingredient.unidad}</p>
                  <p className="text-sm text-gray-500">Cantidad mínima: {ingredient.cant_minima}</p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => handleEditIngredient(ingredient)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteIngredient(ingredient.id_ingrediente)}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              {/* Formulario de edición justo debajo del ingrediente */}
              {editingIngredient && editingIngredient.id_ingrediente === ingredient.id_ingrediente && (
                <div className="mt-4 bg-gray-100 p-4 rounded">
                  <h2 className="text-lg font-semibold mb-2">Editar Ingrediente</h2>
                  <input
                    type="text"
                    value={editingIngredient.nombre}
                    onChange={(e) => setEditingIngredient({ ...editingIngredient, nombre: e.target.value })}
                    className="border px-3 py-2 mb-2 w-full rounded"
                  />
                  <input
                    type="text"
                    value={editingIngredient.unidad}
                    onChange={(e) => setEditingIngredient({ ...editingIngredient, unidad: e.target.value })}
                    className="border px-3 py-2 mb-2 w-full rounded"
                  />
                  <input
                    type="number"
                    value={editingIngredient.cant_minima}
                    onChange={(e) => setEditingIngredient({ ...editingIngredient, cant_minima: e.target.value })}
                    className="border px-3 py-2 mb-2 w-full rounded"
                    min={0}
                  />
                  <button
                    onClick={handleUpdateIngredient}
                    disabled={loading}
                    className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50 mr-2"
                  >
                    Guardar Cambios
                  </button>
                  <button
                    onClick={() => setEditingIngredient(null)}
                    className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ManageIngredients;