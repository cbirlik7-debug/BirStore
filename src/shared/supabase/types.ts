import type { Role } from '../permissions/types';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string | null; role: Role; created_at: string };
        Insert: { id: string; full_name?: string | null; role?: Role };
        Update: { full_name?: string | null; role?: Role };
        Relationships: [];
      };
      products: {
        Row: { id: string; ean: string; article_no: string; name: string; created_at: string };
        Insert: { ean: string; article_no: string; name: string };
        Update: { ean?: string; article_no?: string; name?: string };
        Relationships: [];
      };
      shelves: {
        Row: {
          id: string;
          barcode: string;
          name: string | null;
          location: string | null;
          created_at: string;
        };
        Insert: { barcode: string; name?: string | null; location?: string | null };
        Update: { barcode?: string; name?: string | null; location?: string | null };
        Relationships: [];
      };
      shelf_stock: {
        Row: {
          id: string;
          product_id: string;
          shelf_id: string;
          quantity: number;
          placed_at: string;
          updated_at: string;
        };
        Insert: { product_id: string; shelf_id: string; quantity: number };
        Update: { quantity?: number };
        Relationships: [
          {
            foreignKeyName: 'shelf_stock_shelf_id_fkey';
            columns: ['shelf_id'];
            isOneToOne: false;
            referencedRelation: 'shelves';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'shelf_stock_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      commit_shelving: {
        Args: { p_shelf_id: string; p_items: { product_id: string; qty: number }[] };
        Returns: void;
      };
    };
    Enums: {
      app_role: Role;
    };
    CompositeTypes: Record<string, never>;
  };
}
