import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
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
  addItem: (item: Omit<ListItem, 'id' | 'created_at' | 'updated_at' | 'completed'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<ListItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleItemComplete: (id: string) => Promise<void>;
  reorderItems: (items: ListItem[]) => Promise<void>;
  setFilter: (filter: 'all' | 'active' | 'completed') => void;
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
          const { data, error } = await supabase
            .from('shopping_lists')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (error) throw error;
          set({ lists: data || [] });
        } catch (error) {
          set({ error: (error as Error).message });
        } finally {
          set({ isLoading: false });
        }
      },

      createList: async (name: string, budget: number, userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('shopping_lists')
            .insert([{ name, budget, user_id: userId }])
            .select()
            .single();

          if (error) throw error;
          set((state) => ({ lists: [data, ...state.lists] }));
        } catch (error) {
          set({ error: (error as Error).message });
        } finally {
          set({ isLoading: false });
        }
      },

      deleteList: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase
            .from('shopping_lists')
            .delete()
            .eq('id', id);

          if (error) throw error;
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
          const { data, error } = await supabase
            .from('list_items')
            .select('*')
            .eq('list_id', listId)
            .order('created_at', { ascending: true });

          if (error) throw error;
          set({ items: data || [] });

          // Update stats
          const items = data || [];
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
          const { data, error } = await supabase
            .from('list_items')
            .insert([{ ...item, completed: false }])
            .select()
            .single();

          if (error) throw error;
          set((state) => ({ items: [...state.items, data] }));
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
          const { data, error } = await supabase
            .from('list_items')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;
          set((state) => ({
            items: state.items.map((item) => (item.id === id ? data : item)),
          }));
          await get().fetchItems(data.list_id);
        } catch (error) {
          set({ error: (error as Error).message });
        } finally {
          set({ isLoading: false });
        }
      },

      deleteItem: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const item = get().items.find((i) => i.id === id);
          const { error } = await supabase
            .from('list_items')
            .delete()
            .eq('id', id);

          if (error) throw error;
          set((state) => ({
            items: state.items.filter((item) => item.id !== id),
          }));
          if (item) {
            await get().fetchItems(item.list_id);
          }
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