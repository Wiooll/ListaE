import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Menu, ShoppingCart, Settings, LogOut } from 'lucide-react';

interface ShoppingList {
  id: string;
  name: string;
  budget: number;
  userId: string;
}

export default function Dashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [listName, setListName] = useState('');
  const [budget, setBudget] = useState('');
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Falha ao fazer logout', error);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement Firebase list creation
    const newList = {
      id: Date.now().toString(),
      name: listName,
      budget: parseFloat(budget),
      userId: currentUser?.uid || '',
    };
    setLists([...lists, newList]);
    setIsModalOpen(false);
    setListName('');
    setBudget('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-2xl font-bold">SUAS LISTAS</h1>
            <div className="w-6" /> {/* Spacer */}
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out z-20`}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-8">ListaÊ</h2>
          <div className="space-y-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 w-full"
            >
              <ShoppingCart size={20} />
              <span>Listas</span>
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 w-full"
            >
              <Settings size={20} />
              <span>Configurações</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 w-full"
            >
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add List Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 text-white rounded-full text-2xl shadow-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center"
      >
        +
      </button>

      {/* Lists Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list) => (
            <div
              key={list.id}
              onClick={() => navigate(`/list/${list.id}`)}
              className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition duration-200"
            >
              <h3 className="text-xl font-semibold mb-2">{list.name}</h3>
              <p className="text-gray-600">
                Orçamento: R$ {list.budget.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Create List Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">NOVA LISTA</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateList}>
              <div className="mb-6">
                <label className="block text-gray-700 font-bold mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="Digite o nome da sua lista"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 font-bold mb-2">
                  Orçamento
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="0"
                  step="0.01"
                  placeholder="Valor total do seu orçamento"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded hover:bg-blue-700 transition duration-200"
              >
                Adicionar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}