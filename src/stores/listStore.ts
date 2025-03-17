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
  fetchLists: () => Promise<void>;
  createList: (name: string, budget: number) => Promise<void>;
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

      fetchLists: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('shopping_lists')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;
          set({ lists: data || [] });
        } catch (error) {
          set({ error: (error as Error).message });
        } finally {
          set({ isLoading: false });
        }
      },

      createList: async (name: string, budget: number) => {
        set({ isLoading: true, error: null });
        try {
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError) throw userError;
          
          const { data, error } = await supabase
            .from('shopping_lists')
            .insert([{ 
              name, 
              budget,
              user_id: userData.user.id 
            }])
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
          const stats = {
            total: data?.length || 0,
            completed: data?.filter((item) => item.completed).length || 0,
            active: data?.filter((item) => !item.completed).length || 0,
            totalSpent: data?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0,
            remainingBudget: (get().currentList?.budget || 0) - (data?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0),
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
            .insert([item])
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
          const { error } = await supabase
            .from('list_items')
            .delete()
            .eq('id', id);

          if (error) throw error;
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
            await get().createList(list.name, list.budget);
          }

          // Refresh lists
          await get().fetchLists();
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