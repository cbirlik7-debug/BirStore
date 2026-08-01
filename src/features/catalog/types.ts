import type { RequiredId } from '../../shared/supabase/types';

export interface CatalogProduct {
  id: string;
  ean: string;
  articleNo: string;
  name: string;
  requiredIds: RequiredId[];
}
