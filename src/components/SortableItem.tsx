import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit2, Trash2 } from 'lucide-react';
import { type ItemFormData } from '../lib/validations';

interface ListItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  completed: boolean;
}

interface SortableItemProps {
  item: ListItem;
  isEditing: boolean;
  editItem: ItemFormData;
  onEditChange: (item: ItemFormData) => void;
  onUpdate: (e: React.FormEvent) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggleComplete: (id: string) => Promise<void>;
  setIsEditing: (id: string) => void;
}

export function SortableItem({
  item,
  isEditing,
  editItem,
  onEditChange,
  onUpdate,
  onDelete,
  onToggleComplete,
  setIsEditing,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <form onSubmit={onUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor={`edit-name-${item.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome do Item
              </label>
              <input
                type="text"
                id={`edit-name-${item.id}`}
                value={editItem.name}
                onChange={(e) => onEditChange({ ...editItem, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label htmlFor={`edit-quantity-${item.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Quantidade
              </label>
              <input
                type="number"
                id={`edit-quantity-${item.id}`}
                value={editItem.quantity}
                onChange={(e) => onEditChange({ ...editItem, quantity: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label htmlFor={`edit-price-${item.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Preço
              </label>
              <input
                type="number"
                id={`edit-price-${item.id}`}
                value={editItem.price}
                onChange={(e) => onEditChange({ ...editItem, price: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => onEditChange({ name: '', quantity: 0, price: 0 })}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md cursor-move"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <input
            type="checkbox"
            checked={item.completed}
            onChange={() => onToggleComplete(item.id)}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            aria-label={`Marcar ${item.name} como ${item.completed ? 'não concluído' : 'concluído'}`}
          />
          <div className={`${item.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {item.quantity} x R$ {item.price.toFixed(2)} = R$ {(item.quantity * item.price).toFixed(2)}
            </p>
          </div>
        </div>
        <div 
          className="flex space-x-2"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Botão de editar clicado:', item.id);
              onEditChange({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
              });
              setIsEditing(item.id);
            }}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded-full p-1"
            aria-label={`Editar ${item.name}`}
          >
            <Edit2 size={20} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Botão de deletar clicado:', item.id);
              onDelete(item.id);
            }}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded-full p-1"
            aria-label={`Excluir ${item.name}`}
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}