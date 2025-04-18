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
        // Return early if userId is undefined or null
        if (!userId) {
          set({ error: 'User ID is required', lists: [] });
          return;
        }

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
          set({ error: (error as Error).message, lists: [] });
        } finally {
          set({ isLoading: false });
        }
      },

      createList: async (name: string, budget: number, userId: string) => {
        if (!userId) {
          set({ error: 'User ID is required' });
          return;
        }

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
        if (!listId) {
          set({ error: 'List ID is required', items: [] });
          return;
        }

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
        if (!item.list_id) {
          set({ error: 'List ID is required' });
          return;
        }

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
        console.log('Iniciando atualização do item:', { id, updates });
        set({ isLoading: true, error: null });
        try {
          // Primeiro, verifica se o item existe
          const existingItem = get().items.find((i) => i.id === id);
          if (!existingItem) {
            console.error('Item não encontrado:', id);
            throw new Error('Item não encontrado');
          }

          console.log('Item encontrado, tentando atualizar no Supabase:', existingItem);

          // Faz a atualização no Supabase
          const { data, error } = await supabase
            .from('list_items')
            .update({
              ...updates,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

          if (error) {
            console.error('Erro do Supabase ao atualizar item:', error);
            throw error;
          }

          if (!data) {
            console.error('Nenhum dado retornado da atualização');
            throw new Error('Nenhum dado retornado da atualização');
          }

          console.log('Item atualizado com sucesso:', data);

          // Atualiza o estado local
          set((state) => ({
            items: state.items.map((item) => (item.id === id ? data : item)),
          }));

          // Atualiza as estatísticas
          const items = get().items;
          const stats = {
            total: items.length,
            completed: items.filter((item) => item.completed).length,
            active: items.filter((item) => !item.completed).length,
            totalSpent: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            remainingBudget: (get().currentList?.budget || 0) - items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          };
          set({ stats });
        } catch (error) {
          console.error('Erro na função updateItem:', error);
          set({ error: (error as Error).message });
        } finally {
          set({ isLoading: false });
        }
      },

      deleteItem: async (id: string) => {
        console.log('Iniciando deleção do item:', id);
        set({ isLoading: true, error: null });
        try {
          // Primeiro, verifica se o item existe
          const item = get().items.find((i) => i.id === id);
          if (!item) {
            console.error('Item não encontrado:', id);
            throw new Error('Item não encontrado');
          }

          console.log('Item encontrado, tentando deletar do Supabase:', item);

          // Faz a deleção no Supabase
          const { error } = await supabase
            .from('list_items')
            .delete()
            .eq('id', id);

          if (error) {
            console.error('Erro do Supabase ao deletar item:', error);
            throw error;
          }

          console.log('Item deletado com sucesso');

          // Atualiza o estado local
          set((state) => ({
            items: state.items.filter((item) => item.id !== id),
          }));

          // Atualiza as estatísticas
          const items = get().items.filter((i) => i.id !== id);
          const stats = {
            total: items.length,
            completed: items.filter((item) => item.completed).length,
            active: items.filter((item) => !item.completed).length,
            totalSpent: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            remainingBudget: (get().currentList?.budget || 0) - items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          };
          set({ stats });
        } catch (error) {
          console.error('Erro na função deleteItem:', error);
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