import { useReducer } from 'react';
import type { PendingItem } from '../types';

type Action =
  | {
      type: 'ADD_OR_INCREMENT';
      item: { productId: string; ean: string; articleNo: string; name: string };
      maxQuantity?: number;
    }
  | {
      type: 'ADD_WITH_QTY';
      item: { productId: string; ean: string; articleNo: string; name: string };
      quantity: number;
      maxQuantity?: number;
    }
  | { type: 'SET_QTY'; productId: string; quantity: number }
  | { type: 'REMOVE'; productId: string }
  | { type: 'CLEAR' };

function clamp(value: number, min: number, max?: number): number {
  const clamped = Math.max(min, value);
  return max !== undefined && max > 0 ? Math.min(clamped, max) : clamped;
}

function reducer(state: PendingItem[], action: Action): PendingItem[] {
  switch (action.type) {
    case 'ADD_OR_INCREMENT': {
      const existing = state.find((i) => i.productId === action.item.productId);
      if (existing) {
        const newQty = clamp(existing.quantity + 1, 1, existing.maxQuantity);
        return state.map((i) =>
          i.productId === action.item.productId ? { ...i, quantity: newQty } : i,
        );
      }
      return [
        ...state,
        {
          ...action.item,
          quantity: 1,
          maxQuantity: action.maxQuantity,
        },
      ];
    }
    case 'ADD_WITH_QTY': {
      const existing = state.find((i) => i.productId === action.item.productId);
      const max = action.maxQuantity ?? existing?.maxQuantity;
      const addQty = clamp(action.quantity, 1, max);
      if (existing) {
        const newQty = clamp(existing.quantity + addQty, 1, max);
        return state.map((i) =>
          i.productId === action.item.productId
            ? { ...i, quantity: newQty, maxQuantity: max }
            : i,
        );
      }
      return [...state, { ...action.item, quantity: addQty, maxQuantity: max }];
    }
    case 'SET_QTY':
      return state.map((i) =>
        i.productId === action.productId
          ? { ...i, quantity: clamp(action.quantity, 1, i.maxQuantity) }
          : i,
      );
    case 'REMOVE':
      return state.filter((i) => i.productId !== action.productId);
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}

export function usePendingShelvingList() {
  const [items, dispatch] = useReducer(reducer, []);

  return {
    items,
    addOrIncrement: (
      item: { productId: string; ean: string; articleNo: string; name: string },
      maxQuantity?: number,
    ) => dispatch({ type: 'ADD_OR_INCREMENT', item, maxQuantity }),
    addWithQuantity: (
      item: { productId: string; ean: string; articleNo: string; name: string },
      quantity: number,
      maxQuantity?: number,
    ) => dispatch({ type: 'ADD_WITH_QTY', item, quantity, maxQuantity }),
    setQuantity: (productId: string, quantity: number) =>
      dispatch({ type: 'SET_QTY', productId, quantity }),
    remove: (productId: string) => dispatch({ type: 'REMOVE', productId }),
    clear: () => dispatch({ type: 'CLEAR' }),
  };
}
