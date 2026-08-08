import type { Role } from '../permissions/types';

export type RequiredId = 'IMEI1' | 'IMEI2' | 'SERIAL';
export type IdentifierValues = Partial<Record<RequiredId, string>>;

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
      koliler: {
        Row: {
          id: string;
          barkod: string;
          tip: string;
          siparis_id: string | null;
          magaza_kodu: string | null;
          durum: string;
          uyari: string | null;
          reopen_log: { at: string }[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          barkod: string;
          tip: string;
          siparis_id?: string | null;
          magaza_kodu?: string | null;
          durum?: string;
          uyari?: string | null;
          reopen_log?: { at: string }[];
        };
        Update: {
          durum?: string;
          reopen_log?: { at: string }[];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'koliler_siparis_id_fkey';
            columns: ['siparis_id'];
            isOneToOne: false;
            referencedRelation: 'siparisler';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'koliler_magaza_kodu_fkey';
            columns: ['magaza_kodu'];
            isOneToOne: false;
            referencedRelation: 'magazalar';
            referencedColumns: ['kod'];
          },
        ];
      };
      koli_urunler: {
        Row: {
          id: string;
          koli_id: string;
          product_id: string | null;
          raw_barkod: string | null;
          identifiers: IdentifierValues;
          beklenmeyen: boolean;
          created_at: string;
        };
        Insert: {
          koli_id: string;
          product_id?: string | null;
          raw_barkod?: string | null;
          identifiers?: IdentifierValues;
          beklenmeyen?: boolean;
        };
        Update: { product_id?: string | null; beklenmeyen?: boolean };
        Relationships: [
          {
            foreignKeyName: 'koli_urunler_koli_id_fkey';
            columns: ['koli_id'];
            isOneToOne: false;
            referencedRelation: 'koliler';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'koli_urunler_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
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
      tutanaklar: {
        Row: {
          id: string;
          siparis_id: string | null;
          tutanak_no: string;
          created_at: string;
        };
        Insert: { siparis_id?: string | null; tutanak_no: string };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: 'tutanaklar_siparis_id_fkey';
            columns: ['siparis_id'];
            isOneToOne: false;
            referencedRelation: 'siparisler';
            referencedColumns: ['id'];
          },
        ];
      };
      tutanak_satirlari: {
        Row: {
          id: string;
          tutanak_id: string;
          product_id: string | null;
          durum: string;
          adet: number;
          aciklama: string | null;
          foto_url: string | null;
          created_at: string;
        };
        Insert: {
          tutanak_id: string;
          product_id?: string | null;
          durum: string;
          adet: number;
          aciklama?: string | null;
          foto_url?: string | null;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: 'tutanak_satirlari_tutanak_id_fkey';
            columns: ['tutanak_id'];
            isOneToOne: false;
            referencedRelation: 'tutanaklar';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tutanak_satirlari_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      product_ean_aliases: {
        Row: { ean: string; product_id: string; created_at: string };
        Insert: { ean: string; product_id: string };
        Update: { product_id?: string };
        Relationships: [
          {
            foreignKeyName: 'product_ean_aliases_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      depo_kodlari: {
        Row: { kod: string; ad: string };
        Insert: { kod: string; ad: string };
        Update: { ad?: string };
        Relationships: [];
      };
      transfer_siparisleri: {
        Row: {
          id: string;
          transfer_no: string;
          kaynak_depo_kodu: string;
          hedef_depo_kodu: string;
          tip: string;
          aciklama: string | null;
          created_at: string;
        };
        Insert: {
          transfer_no: string;
          kaynak_depo_kodu: string;
          hedef_depo_kodu: string;
          tip: string;
          aciklama?: string | null;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: 'transfer_siparisleri_kaynak_depo_kodu_fkey';
            columns: ['kaynak_depo_kodu'];
            isOneToOne: false;
            referencedRelation: 'depo_kodlari';
            referencedColumns: ['kod'];
          },
          {
            foreignKeyName: 'transfer_siparisleri_hedef_depo_kodu_fkey';
            columns: ['hedef_depo_kodu'];
            isOneToOne: false;
            referencedRelation: 'depo_kodlari';
            referencedColumns: ['kod'];
          },
        ];
      };
      transfer_urunler: {
        Row: {
          id: string;
          transfer_id: string;
          product_id: string | null;
          raw_barkod: string | null;
          identifiers: IdentifierValues;
          beklenmeyen: boolean;
          created_at: string;
        };
        Insert: {
          transfer_id: string;
          product_id?: string | null;
          raw_barkod?: string | null;
          identifiers?: IdentifierValues;
          beklenmeyen?: boolean;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: 'transfer_urunler_transfer_id_fkey';
            columns: ['transfer_id'];
            isOneToOne: false;
            referencedRelation: 'transfer_siparisleri';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transfer_urunler_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      sayimlar: {
        Row: { id: string; ad: string; baslangic: string; bitis: string | null; durum: string };
        Insert: { ad: string; durum?: string };
        Update: { durum?: string; bitis?: string | null };
        Relationships: [];
      };
      sayim_kilitleri: {
        Row: { shelf_id: string; sayim_id: string; kilitleyen_user_id: string; kilitlendi_at: string };
        Insert: { shelf_id: string; sayim_id: string; kilitleyen_user_id: string };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: 'sayim_kilitleri_shelf_id_fkey';
            columns: ['shelf_id'];
            isOneToOne: true;
            referencedRelation: 'shelves';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sayim_kilitleri_sayim_id_fkey';
            columns: ['sayim_id'];
            isOneToOne: false;
            referencedRelation: 'sayimlar';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sayim_kilitleri_kilitleyen_user_id_fkey';
            columns: ['kilitleyen_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      sayim_satirlari: {
        Row: {
          id: string;
          sayim_id: string;
          shelf_id: string;
          product_id: string;
          sayilan_adet: number;
          user_id: string;
          created_at: string;
        };
        Insert: {
          sayim_id: string;
          shelf_id: string;
          product_id: string;
          sayilan_adet: number;
          user_id: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: 'sayim_satirlari_sayim_id_fkey';
            columns: ['sayim_id'];
            isOneToOne: false;
            referencedRelation: 'sayimlar';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sayim_satirlari_shelf_id_fkey';
            columns: ['shelf_id'];
            isOneToOne: false;
            referencedRelation: 'shelves';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sayim_satirlari_product_id_fkey';
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
      find_duplicate_identifiers: {
        Args: Record<string, never>;
        Returns: {
          identifier_value: string;
          koli_urun_id: string;
          koli_id: string;
          koli_barkod: string;
          siparis_no: string | null;
          created_at: string;
        }[];
      };
    };
    Enums: {
      app_role: Role;
    };
    CompositeTypes: Record<string, never>;
  };
}
