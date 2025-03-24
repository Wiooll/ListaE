import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Menu, ShoppingCart, Settings, LogOut, Trash2, Edit2 } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useListStore } from '../stores/listStore';
import { SortableItem } from './SortableItem';
import { itemSchema, type ItemFormData } from '../lib/validations';

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
  const [editItem, setEditItem] = useState<ItemFormData>({ name: '', quantity: 0, price: 0 });
  const [newItem, setNewItem] = useState<ItemFormData>({ name: '', quantity: 0, price: 0 });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { id } = useParams();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
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
      showToast('Logout realizado com sucesso!', 'success');
    } catch (error) {
      showToast('Erro ao fazer logout', 'error');
      console.error('Falha ao fazer logout', error);
    }
  };

  const validateForm = (data: ItemFormData) => {
    try {
      itemSchema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof Error) {
        setErrors({ [error.name]: error.message });
      }
      return false;
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    if (!validateForm(newItem)) {
      showToast('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    try {
      await addItem({
        list_id: id,
        name: newItem.name,
        quantity: newItem.quantity,
        price: newItem.price,
      });
      setNewItem({ name: '', quantity: 0, price: 0 });
      showToast('Item adicionado com sucesso!', 'success');
    } catch (error) {
      showToast('Erro ao adicionar item', 'error');
      console.error('Erro ao adicionar item:', error);
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isEditing) {
      console.log('Nenhum item está sendo editado');
      return;
    }
    
    if (!validateForm(editItem)) {
      console.log('Formulário inválido:', errors);
      showToast('Por favor, corrija os erros no formulário', 'error');
      return;
    }
    
    try {
      console.log('Tentando atualizar item:', { id: isEditing, data: editItem });
      await updateItem(isEditing, {
        name: editItem.name,
        quantity: editItem.quantity,
        price: editItem.price,
      });
      console.log('Item atualizado com sucesso');
      setIsEditing(null);
      setEditItem({ name: '', quantity: 0, price: 0 });
      showToast('Item atualizado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      showToast(error instanceof Error ? error.message : 'Erro ao atualizar item', 'error');
    }
  };

  const handleDeleteItem = async (itemId: string | null) => {
    if (!itemId) {
      console.error('ID do item não fornecido');
      showToast('ID do item não encontrado', 'error');
      return;
    }

    const itemToDelete = items.find(item => item.id === itemId);
    if (!itemToDelete) {
      console.error('Item não encontrado:', itemId);
      showToast('Item não encontrado', 'error');
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir o item "${itemToDelete.name}"?`)) {
      try {
        console.log('Tentando deletar item:', itemId);
        await deleteItem(itemId);
        console.log('Item deletado com sucesso');
        showToast('Item excluído com sucesso!', 'success');
      } catch (error) {
        console.error('Erro ao excluir item:', error);
        showToast(error instanceof Error ? error.message : 'Erro ao excluir item', 'error');
      }
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      try {
        await reorderItems(newItems);
        showToast('Ordem dos itens atualizada!', 'success');
      } catch (error) {
        showToast('Erro ao reordenar itens', 'error');
        console.error('Erro ao reordenar itens:', error);
      }
    }
  };

  const filteredItems = items.filter((item) => {
    if (filter === 'active') return !item.completed;
    if (filter === 'completed') return item.completed;
    return true;
  });

  // Adicionar useEffect para monitorar mudanças no estado de edição
  useEffect(() => {
    console.log('Estado de edição mudou:', isEditing);
    console.log('Item sendo editado:', editItem);
  }, [isEditing, editItem]);

  // Adicionar useEffect para monitorar mudanças nos itens
  useEffect(() => {
    console.log('Lista de itens atualizada:', items);
  }, [items]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <nav className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              aria-label="Abrir menu"
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
        role="navigation"
        aria-label="Menu principal"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">ListaÊ</h2>
          <div className="space-y-4">
            <button
              onClick={() => {
                navigate('/dashboard');
                setIsMenuOpen(false);
              }}
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 w-full"
            >
              <ShoppingCart size={20} />
              <span>Listas</span>
            </button>
            <button
              onClick={() => {
                navigate('/settings');
                setIsMenuOpen(false);
              }}
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

        {/* Add Item Form */}
        <form onSubmit={handleAddItem} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome do Item
              </label>
              <input
                type="text"
                id="name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.name}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Quantidade
              </label>
              <input
                type="number"
                id="quantity"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                aria-invalid={!!errors.quantity}
                aria-describedby={errors.quantity ? 'quantity-error' : undefined}
              />
              {errors.quantity && (
                <p id="quantity-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.quantity}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Preço
              </label>
              <input
                type="number"
                id="price"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                aria-invalid={!!errors.price}
                aria-describedby={errors.price ? 'price-error' : undefined}
              />
              {errors.price && (
                <p id="price-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.price}
                </p>
              )}
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Adicionar Item
          </button>
        </form>

        {/* Items List */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredItems.map(item => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  isEditing={isEditing === item.id}
                  editItem={editItem}
                  onEditChange={setEditItem}
                  onUpdate={handleUpdateItem}
                  onDelete={handleDeleteItem}
                  onToggleComplete={toggleItemComplete}
                  setIsEditing={setIsEditing}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}