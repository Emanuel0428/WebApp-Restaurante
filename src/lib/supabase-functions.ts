import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

// Tipos
export interface Ingredient {
  id_ingrediente: string;
  nombre: string;
  unidad: string;
  cantidad_usada: number;
}

export interface ProductData {
  tipo: string;
  nombre: string;
  descripcion: string;
  imagen: string;
  detalles: string;
  ingredientes: any[]; // array de ingredientes (puedes tipar mejor si tienes la estructura)
  precios_por_tamano?: any; // jsonb, puede ser un objeto o array según tu modelo
}

export interface ProductFromDB extends ProductData {
  id_producto: string;
}

// --------------------- Productos ---------------------

export async function addProduct(product: ProductData) {
  // Normalizar claves de precios_por_tamano a formato capitalizado y ordenado
  let preciosPorTamano: Record<string, number> = {};
  if (product.precios_por_tamano) {
    const orden = ["Grande", "Mediana", "Pequeña"];
    orden.forEach((key) => {
      // Buscar la clave ignorando mayúsculas/minúsculas
      const found = Object.entries(product.precios_por_tamano).find(
        ([k]) => k.toLowerCase() === key.toLowerCase()
      );
      if (found) {
        preciosPorTamano[key] = Number(found[1]);
      }
    });
  }
  const { data, error } = await supabase
    .from('productos')
    .insert([
      {
        tipo: product.tipo,
        nombre: product.nombre,
        descripcion: product.descripcion,
        imagen: product.imagen,
        detalles: product.detalles,
        ingredientes: JSON.stringify(product.ingredientes),
        precios_por_tamano: Object.keys(preciosPorTamano).length > 0 ? preciosPorTamano : null // Guardar como objeto JSON, no string
      }
    ]);

  if (error) throw error;
  return data;
}

export async function getAllProducts(): Promise<ProductFromDB[]> {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) throw error;

  return data.map((product: any) => ({
    ...product,
    ingredientes: product.ingredientes ? (typeof product.ingredientes === 'string' ? JSON.parse(product.ingredientes) : product.ingredientes) : [],
    precios_por_tamano: product.precios_por_tamano ? (typeof product.precios_por_tamano === 'string' ? JSON.parse(product.precios_por_tamano) : product.precios_por_tamano) : undefined
  }));
}

export async function updateProduct(id_producto: string, updatedProduct: ProductData) {
  const { data, error } = await supabase
    .from('productos')
    .update({
      tipo: updatedProduct.tipo,
      nombre: updatedProduct.nombre,
      descripcion: updatedProduct.descripcion,
      imagen: updatedProduct.imagen,
      detalles: updatedProduct.detalles,
      ingredientes: JSON.stringify(updatedProduct.ingredientes),
      // Guardar precios_por_tamano como objeto (no string) para jsonb
      precios_por_tamano: updatedProduct.precios_por_tamano ? updatedProduct.precios_por_tamano : null
    })
    .eq('id_producto', id_producto);

  if (error) throw error;
  return data;
}

export async function deleteProduct(id_producto: string) {
  const { error } = await supabase
    .from('productos')
    .delete()
    .eq('id_producto', id_producto);

  if (error) throw error;
  return true;
}

// --------------------- Ingredientes ---------------------

export async function fetchIngredients() {
  const { data, error } = await supabase.from('ingredientes').select('*');
  if (error) throw error;
  return data;
}

export async function addIngredient(nombre: string, unidad: string, cant_minima: number) {
  const { data, error } = await supabase
    .from('ingredientes')
    .insert([{ nombre, unidad, cant_minima }])
    .select()
    .single();

  if (error) throw error;

  // Insertar en inventario con cantidad 0
  const inventarioError = await insertEmptyInventory(data.id_ingrediente);
  if (inventarioError) throw inventarioError;

  return data;
}

export async function updateIngredient(
  id_ingrediente: string,
  nombre: string,
  unidad: string,
  cant_minima: number
) {
  const { data, error } = await supabase
    .from('ingredientes')
    .update({ nombre, unidad, cant_minima })
    .eq('id_ingrediente', id_ingrediente);

  if (error) throw error;
  return data;
}

export async function deleteIngredient(id_ingrediente: string) {
  const { error } = await supabase
    .from('ingredientes')
    .delete()
    .eq('id_ingrediente', id_ingrediente);

  if (error) throw error;

  // Eliminar del inventario también
  const invError = await supabase
    .from('inventario')
    .delete()
    .eq('id_ingrediente', id_ingrediente);

  if (invError.error) throw invError.error;
  return true;
}

// --------------------- Inventario ---------------------

export async function fetchInventory() {
  const { data, error } = await supabase.from('inventario').select('*');
  if (error) throw error;
  return data;
}

export async function upsertInventory(id_ingrediente: string, cantidad: number) {
  const { error } = await supabase
    .from('inventario')
    .upsert([{ id_ingrediente, cantidad }], { onConflict: 'id_ingrediente' });

  if (error) throw error;
}

async function insertEmptyInventory(id_ingrediente: string) {
  const { error } = await supabase
    .from('inventario')
    .insert([{ id_ingrediente, cantidad: 0 }]);

  return error;
}

// --------------------- Caja Movimientos ---------------------

export async function getAllCashMovements() {
  // Trae los movimientos y el nombre y apellido del usuario
  const { data, error } = await supabase
    .from('caja_movimientos')
    .select('*, usuario:usuario_id (nombre, apellido)')
    .order('fecha', { ascending: false });
  if (error) throw error;
  // Map usuario as a single object if array
  return (data || []).map((mov) => ({
    ...mov,
    usuario: Array.isArray(mov.usuario) ? mov.usuario[0] : mov.usuario
  }));
}

export async function insertCashMovement({ tipo, monto, detalle, usuario_id }: { tipo: string; monto: number; detalle: string; usuario_id: string; }) {
  const { data, error } = await supabase
    .from('caja_movimientos')
    .insert([
      { tipo, monto, detalle, usuario_id }
    ])
    .select()
    .single();
  if (error) throw error;
  return data;
}
