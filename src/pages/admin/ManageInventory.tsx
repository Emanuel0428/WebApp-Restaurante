import { useEffect, useState } from 'react';
import AdminHeader from './AdminHeader';
import {
  fetchIngredients,
  fetchInventory,
  upsertInventory,
} from '../../lib/supabase-functions';

interface Ingredient {
  id_ingrediente: string;
  nombre: string;
  unidad: string;
}

interface InventoryItem {
  id_ingrediente: string;
  cantidad: number;
}

const InventoryManagement = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [quantityChanges, setQuantityChanges] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState<string>(''); // Nuevo estado para la búsqueda

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const ingredientsData = await fetchIngredients();
      const inventoryData = await fetchInventory();

      setIngredients(ingredientsData);

      const initialInventory = ingredientsData.map((ingredient: Ingredient) => {
        const found = inventoryData.find((inv: InventoryItem) => inv.id_ingrediente === ingredient.id_ingrediente);
        return {
          id_ingrediente: ingredient.id_ingrediente,
          cantidad: found ? found.cantidad : 0
        };
      });

      setInventory(initialInventory);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const handleQuantityChange = (id: string, value: number) => {
    setQuantityChanges((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const applyChange = async (id: string) => {
    const change = quantityChanges[id];
    if (change === undefined) return;

    const current = inventory.find((item) => item.id_ingrediente === id)?.cantidad || 0;
    const updated = Math.max(0, current + change);

    try {
      await upsertInventory(id, updated);
      await loadData();
      setQuantityChanges((prev) => ({ ...prev, [id]: 0 }));
    } catch (error) {
      console.error('Error al actualizar inventario:', error);
    }
  };

  // Filtro por búsqueda
  const filteredIngredients = ingredients.filter((ingredient) =>
    ingredient.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="fixed top-0 left-0 w-full z-50">
        <AdminHeader />
      </div>
      <div className="p-6 pt-20">
        <h1 className="text-2xl font-bold mb-2">Gestión de Inventario</h1>
        <input
          type="text"
          placeholder="Buscar ingrediente por nombre..."
          className="mb-6 border px-3 py-2 rounded w-full md:w-1/2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <ul className="space-y-4">
          {filteredIngredients.map((ingredient) => {
            const invItem = inventory.find((inv) => inv.id_ingrediente === ingredient.id_ingrediente);
            const cantidad = invItem ? invItem.cantidad : 0;
            const change = quantityChanges[ingredient.id_ingrediente] || 0;
            return (
              <li
                key={ingredient.id_ingrediente}
                className="flex flex-col md:flex-row md:items-center md:justify-between border p-4 rounded shadow"
              >
                <div className="mb-2 md:mb-0">
                  <p className="font-semibold">{ingredient.nombre} ({ingredient.unidad})</p>
                  <p className="text-gray-600">Cantidad actual: {cantidad}</p>
                </div>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
                  <input
                    type="number"
                    placeholder="Cantidad a modificar"
                    className="border px-3 py-2 rounded w-40"
                    value={change}
                    onChange={(e) => handleQuantityChange(ingredient.id_ingrediente, parseInt(e.target.value))}
                  />
                  <button
                    onClick={() => applyChange(ingredient.id_ingrediente)}
                    className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                  >
                    Actualizar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
};

export default InventoryManagement;
