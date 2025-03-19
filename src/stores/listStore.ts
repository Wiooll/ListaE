import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db } from '../lib/db';
import type { ShoppingList, ListItem, ListStats } from '../types';

interface ListState {
  lists: ShoppingList[];
  currentList: ShoppingList | null;
  items: ListItem[];
  filter: 'all' | 'active' | 'completed';
  stats: ListStats;
  isLoading: boolean;
  error: string | null;
  fetchLists: (userId: string) => Promise<void>;
  createList: (name: string, budget: number, userId: string) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  setCurrentList: (list: ShoppingList | null) => void;
  fetchItems: (listId: string) => Promise<void>;
  addItem: (item: Omit<ListItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<ListItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleItemComplete: (id: string) => Promise<void>;
  reorderItems: (items: ListItem[]) => Promise<void>;
  setFilter: (filter: 'all' | 'active' | 'completed') => void;
  exportData: () => string;
  importData: (jsonData: string) => Promise<void>;
}

export const useListStore = create<ListState>()(
  persist(
    (set, get) => ({
      lists: [],
      currentList: null,
      items: [],
      filter: 'all',
      stats: { total: 0, completed: 0, active: 0, totalSpent: 0, remainingBudget: 0 },
      isLoading: false,
      error: null,

      fetchLists: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const lists = await db.shoppingLists
            .where('user_id')
            .equals(userId)
            .reverse()
            .sortBy('created_at');
          set({ lists });
        } catch (error) {
          set({ error: (error as Error).message });
        } finally {
          set({ isLoading: false });
        }
      },

      createList: async (name: string, budget: number, userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const id = crypto.randomUUID();
          const now = new Date().toISOString();
          const newList: ShoppingList = {
            id,
            name,
            budget,
            user_id: userId,
            created_at: now,
            updated_at: now,
          };
          
          await db.shoppingLists.add(newList);
          set((state) => ({ lists: [newList, ...state.lists] }));
        } catch (error) {
          set({ error: (error as Error).message });
        } finally {
          set({ isLoading: false });
        }
      },

      deleteList: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await db.shoppingLists.delete(id);
          await db.listItems.where('list_id').equals(id).delete();
          
          set((state) => ({
            lists: state.lists.filter((list) => list.id !== id),
            currentList: state.currentList?.id === id ? null : state.currentList,
          }));
        } catch (error) {
          set({ error: (error as Error).message });
        } finally {
          set({ isLoading: false });
        }
      },

      setCurrentList: (list) => {
        set({ currentList: list });
        if (list) {
          get().fetchItems(list.id);
        }
      },

      fetchItems: async (listId: string) => {
        set({ isLoading: true, error: null });
        try {
          const items = await db.listItems
            .where('list_id')
            .equals(listId)
            .sortBy('created_at');
          
          set({ items });
          
          // Update stats
          const stats = {
            total: items.length,
            completed: items.filter((item) => item.completed).length,
            active: items.filter((item) => !item.completed).length,
            totalSpent: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            remainingBudget: (get().currentList?.budget || 0) - items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          };
          set({ stats });
        } catch (error) {
          set({ error: (error as Error).message });
        } finally {
          set({ isLoading: false });
        }
      },

      addItem: async (item) => {
        set({ isLoading: true, error: null });
        try {
          const id = crypto.randomUUID();
          const now = new Date().toISOString();
          const newItem: ListItem = {
            id,
            ...item,
            completed: false,
            created_at: now,
            updated_at: now,
          };
          
          await db.listItems.add(newItem);
          set((state) => ({ items: [...state.items, newItem] }));
          await get().fetchItems(item.list_id);
        } catch (error) {
          set({ error: (error as Error).message });
        } finally {
          set({ isLoading: false });
        }
      },

      updateItem: async (id: string, updates: Partial<ListItem>) => {
        set({ isLoading: true, error: null });
        try {
          const now = new Date().toISOString();
          await db.listItems.update(id, { ...updates, updated_at: now });
          
          const updatedItem = await db.listItems.get(id);
          if (!updatedItem) throw new Error('Item not found');
          
          set((state) => ({
            items: state.items.map((item) => (item.id === id ? updatedItem : item)),
          }));
          await get().fetchItems(updatedItem.list_id);
        } catch (error) {
          set({ error: (error as Error).message });
        } finally {
          set({ isLoading: false });
        }
      },

      deleteItem: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await db.listItems.delete(id);
          
          set((state) => ({
            items: state.items.filter((item) => item.id !== id),
          }));
          await get().fetchItems(get().currentList?.id || '');
        } catch (error) {
          set({ error: (error as Error).message });
        } finally {
          set({ isLoading: false });
        }
      },

      toggleItemComplete: async (id: string) => {
        const item = get().items.find((i) => i.id === id);
        if (item) {
          await get().updateItem(id, { completed: !item.completed });
        }
      },

      reorderItems: async (items: ListItem[]) => {
        set({ items });
      },

      setFilter: (filter) => {
        set({ filter });
      },

      exportData: () => {
        const { lists, items } = get();
        return JSON.stringify({ lists, items }, null, 2);
      },

      importData: async (jsonData: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = JSON.parse(jsonData);
          if (!data.lists || !Array.isArray(data.lists)) {
            throw new Error('Invalid data format');
          }

          // Import lists
          for (const list of data.lists) {
            await get().createList(list.name, list.budget, list.user_id);
          }

          // Refresh lists
          await get().fetchLists(data.lists[0].user_id);
        } catch (error) {
          set({ error: (error as Error).message });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'shopping-list-storage',
      partialize: (state) => ({
        filter: state.filter,
        currentList: state.currentList,
      }),
    }
  )
);