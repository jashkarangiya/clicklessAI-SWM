/**
 * ClickLess AI – Order Store (Zustand)
 *
 * Persists orders placed through the app to localStorage.
 * Orders are added when the backend emits a `success` WebSocket event.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OrderRecord } from '@/contracts/purchase';

interface OrderState {
    orders: OrderRecord[];
    addOrder: (order: OrderRecord) => void;
    clearOrders: () => void;
}

export const useOrderStore = create<OrderState>()(
    persist(
        (set) => ({
            orders: [],
            addOrder: (order) =>
                set((s) => ({
                    orders: [order, ...s.orders.filter((o) => o.order_id !== order.order_id)],
                })),
            clearOrders: () => set({ orders: [] }),
        }),
        {
            name: 'clickless-orders',
        },
    ),
);
