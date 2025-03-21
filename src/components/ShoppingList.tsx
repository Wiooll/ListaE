import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, ShoppingCart, Settings, LogOut, Trash2, Edit2 } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useListStore } from '../stores/listStore';
import { SortableItem } from './SortableItem';

interface ListItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  completed: boolean;
}

export default function ShoppingList() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editItem, setEditItem] = useState({ name: '', quantity: '', price: '' });
  const [newItem, setNewItem] = useState({ name: '', quantity: '', price: '' });
  const { id } = useParams();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const {
    items,
    currentList,
    stats,
    filter,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    toggleItemComplete,
    reorderItems,
    setFilter
  } = useListStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    if (id) {
      fetchItems(id);
    }
  }, [currentUser, navigate, id, fetchItems]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Falha ao fazer logout', error);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    try {
      await addItem({
        list_id: id,
        name: newItem.name,
        quantity: parseFloat(newItem.quantity),
        price: parseFloat(newItem.price),
      });
      setNewItem({ name: '', quantity: '', price: '' });
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) return;
    
    try {
      await updateItem(isEditing, {
        name: editItem.name,
        quantity: parseFloat(editItem.quantity),
        price: parseFloat(editItem.price),
      });
      setIsEditing(null);
      setEditItem({ name: '', quantity: '', price: '' });
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      try {
        await deleteItem(itemId);
      } catch (error) {
        console.error('Erro ao deletar item:', error);
      }
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      await reorderItems(newItems);
    }
  };

  const filteredItems = items.filter((item) => {
    if (filter === 'active') return !item.completed;
    if (filter === 'completed') return item.completed;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <nav className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
              {currentList?.name || 'LISTA DE COMPRAS'}
            </h1>
            <div className="w-6" />
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64 bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 ease-in-out z-20`}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">ListaÊ</h2>
          <div className="space-y-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 w-full"
            >
              <ShoppingCart size={20} />
              <span>Listas</span>
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 w-full"
            >
              <Settings size={20} />
              <span>Configurações</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 w-full"
            >
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>

      {/* List Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total de Itens</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Concluídos</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Gasto</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                R$ {stats.totalSpent.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Orçamento Restante</p>
              <p className={`text-2xl font-bold ${
                stats.remainingBudget >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                R$ {stats.remainingBudget.toFixed(2)}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2 mt-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Todos ({stats.total})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'active'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Ativos ({stats.active})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'completed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Concluídos ({stats.completed})
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredItems}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredItems.map((item) => (
                  <div key={item.id} className="p-4">
                    {isEditing === item.id ? (
                      <form onSubmit={handleUpdateItem} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <input
                            type="text"
                            value={editItem.name}
                            onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Nome do item"
                            required
                          />
                          <input
                            type="number"
                            value={editItem.quantity}
                            onChange={(e) => setEditItem({ ...editItem, quantity: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Quantidade"
                            min="0"
                            step="0.01"
                            required
                          />
                          <input
                            type="number"
                            value={editItem.price}
                            onChange={(e) => setEditItem({ ...editItem, price: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Preço"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditing(null);
                              setEditItem({ name: '', quantity: '', price: '' });
                            }}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                          >
                            Salvar
                          </button>
                        </div>
                      </form>
                    ) : (
                      <SortableItem id={item.id}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={() => toggleItemComplete(item.id)}
                              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <div className={`${item.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {item.quantity} x R$ {item.price.toFixed(2)} = R$ {(item.quantity * item.price).toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setIsEditing(item.id);
                                setEditItem({
                                  name: item.name,
                                  quantity: item.quantity.toString(),
                                  price: item.price.toString(),
                                });
                              }}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                            >
                              <Edit2 size={20} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                      </SortableItem>
                    )}
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Add Item Form */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700">
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Nome do item"
                  required
                />
                <input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Quantidade"
                  min="0"
                  step="0.01"
                  required
                />
                <input
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Preço"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Adicionar Item
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}