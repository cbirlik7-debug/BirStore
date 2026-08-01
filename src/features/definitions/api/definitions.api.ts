import { supabase } from '../../../shared/supabase/client';

export interface Store {
  kod: string;
  ad: string;
}

export interface Supplier {
  id: string;
  ad: string;
}

export async function listStores(): Promise<Store[]> {
  const { data, error } = await supabase.from('magazalar').select('kod, ad').order('kod');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createStore(input: Store): Promise<void> {
  const { error } = await supabase.from('magazalar').insert(input);
  if (error) throw new Error(error.message);
}

export async function deleteStore(kod: string): Promise<void> {
  const { error } = await supabase.from('magazalar').delete().eq('kod', kod);
  if (error) throw new Error(error.message);
}

export async function listSuppliers(): Promise<Supplier[]> {
  const { data, error } = await supabase.from('tedarikciler').select('id, ad').order('ad');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createSupplier(ad: string): Promise<void> {
  const { error } = await supabase.from('tedarikciler').insert({ ad });
  if (error) throw new Error(error.message);
}

export async function deleteSupplier(id: string): Promise<void> {
  const { error } = await supabase.from('tedarikciler').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
