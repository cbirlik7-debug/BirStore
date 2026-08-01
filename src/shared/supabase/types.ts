import type { Role } from '../permissions/types';

export type RequiredId = 'IMEI1' | 'IMEI2' | 'SERIAL';

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
        Row: {
          id: string;
          ean: string;
          article_no: string;
          name: string;
          required_ids: RequiredId[];
          created_at: string;
        };
        Insert: {
          ean: string;
          article_no: string;
          name: string;
          required_ids?: RequiredId[];
        };
        Update: {
          ean?: string;
          article_no?: string;
          name?: string;
          required_ids?: RequiredId[];
        };
        Relationships: [];
      };
      magazalar: {
        Row: { kod: string; ad: string };
        Insert: { kod: string; ad: string };
        Update: { ad?: string };
        Relationships: [];
      };
      tedarikciler: {
        Row: { id: string; ad: string };
        Insert: { ad: string };
        Update: { ad?: string };
        Relationships: [];
      };
      siparisler: {
        Row: {
          id: string;
          siparis_no: string;
          tedarikci_id: string | null;
          irsaliye_no: string | null;
          created_at: string;
        };
        Insert: { siparis_no: string; tedarikci_id?: string | null; irsaliye_no?: string | null };
        Update: { siparis_no?: string; tedarikci_id?: string | null; irsaliye_no?: string | null };
        Relationships: [
          {
            foreignKeyName: 'siparisler_tedarikci_id_fkey';
            columns: ['tedarikci_id'];
            isOneToOne: false;
            referencedRelation: 'tedarikciler';
            referencedColumns: ['id'];
          },
        ];
      };
      siparis_kalemleri: {
        Row: { id: string; siparis_id: string; product_id: string; beklenen: number };
        Insert: { siparis_id: string; product_id: string; beklenen: number };
        Update: { beklenen?: number };
        Relationships: [
          {
            foreignKeyName: 'siparis_kalemleri_siparis_id_fkey';
            columns: ['siparis_id'];
            isOneToOne: false;
            referencedRelation: 'siparisler';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'siparis_kalemleri_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      koli_tanimlari: {
        Row: {
          barkod: string;
          tip: string;
          siparis_id: string | null;
          magaza_kodu: string | null;
          uyari: string | null;
        };
        Insert: {
          barkod: string;
          tip: string;
          siparis_id?: string | null;
          magaza_kodu?: string | null;
          uyari?: string | null;
        };
        Update: {
          tip?: string;
          siparis_id?: string | null;
          magaza_kodu?: string | null;
          uyari?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'koli_tanimlari_siparis_id_fkey';
            columns: ['siparis_id'];
            isOneToOne: false;
            referencedRelation: 'siparisler';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'koli_tanimlari_magaza_kodu_fkey';
            columns: ['magaza_kodu'];
            isOneToOne: false;
            referencedRelation: 'magazalar';
            referencedColumns: ['kod'];
          },
        ];
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
