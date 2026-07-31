import { useReducer } from 'react';
import type { PendingItem } from '../types';

type Action =
  | { type: 'ADD_OR_INCREMENT'; item: { productId: string; ean: string; articleNo: string; name: string } }
  | { type: 'SET_QTY'; productId: string; quantity: number }
  | { type: 'REMOVE'; productId: string }
  | { type: 'CLEAR' };

function reducer(state: PendingItem[], action: Action): PendingItem[] {
  switch (action.type) {
    case 'ADD_OR_INCREMENT': {
      const existing = state.find((i) => i.productId === action.item.productId);
      if (existing) {
        return state.map((i) =>
          i.productId === action.item.productId ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...state, { ...action.item, quantity: 1 }];
    }
    case 'SET_QTY':
      return state.map((i) =>
        i.productId === action.productId ? { ...i, quantity: Math.max(1, action.quantity) } : i,
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
    addOrIncrement: (item: { productId: string; ean: string; articleNo: string; name: string }) =>
      dispatch({ type: 'ADD_OR_INCREMENT', item }),
    setQuantity: (productId: string, quantity: number) =>
      dispatch({ type: 'SET_QTY', productId, quantity }),
    remove: (productId: string) => dispatch({ type: 'REMOVE', productId }),
    clear: () => dispatch({ type: 'CLEAR' }),
  };
}
