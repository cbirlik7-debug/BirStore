import { supabase, isDemoMode } from '../../../shared/supabase/client';
import {
  getMockStores,
  addMockStore,
  removeMockStore,
  getMockSuppliers,
  addMockSupplier,
  removeMockSupplier,
} from '../../../shared/mock/mockData';

export interface Store {
  kod: string;
  ad: string;
}

export interface Supplier {
  id: string;
  ad: string;
}

export async function listStores(): Promise<Store[]> {
  if (isDemoMode()) {
    return getMockStores();
  }

  const { data, error } = await supabase.from('magazalar').select('kod, ad').order('kod');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createStore(input: Store): Promise<void> {
  if (isDemoMode()) {
    addMockStore(input);
    return;
  }

  const { error } = await supabase.from('magazalar').insert(input);
  if (error) throw new Error(error.message);
}

export async function deleteStore(kod: string): Promise<void> {
  if (isDemoMode()) {
    removeMockStore(kod);
    return;
  }

  const { error } = await supabase.from('magazalar').delete().eq('kod', kod);
  if (error) throw new Error(error.message);
}

export async function listSuppliers(): Promise<Supplier[]> {
  if (isDemoMode()) {
    return getMockSuppliers();
  }

  const { data, error } = await supabase.from('tedarikciler').select('id, ad').order('ad');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createSupplier(ad: string): Promise<void> {
  if (isDemoMode()) {
    addMockSupplier({ id: `sup-${Date.now()}`, ad });
    return;
  }

  const { error } = await supabase.from('tedarikciler').insert({ ad });
  if (error) throw new Error(error.message);
}

export async function deleteSupplier(id: string): Promise<void> {
  if (isDemoMode()) {
    removeMockSupplier(id);
    return;
  }

  const { error } = await supabase.from('tedarikciler').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
