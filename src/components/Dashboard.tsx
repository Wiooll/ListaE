import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Menu, ShoppingCart, Settings, LogOut } from 'lucide-react';
import { useListStore } from '../stores/listStore';

export default function Dashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [listName, setListName] = useState('');
  const [budget, setBudget] = useState('');
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const {
    lists,
    isLoading,
    error,
    fetchLists,
    createList,
    deleteList,
    setCurrentList
  } = useListStore();

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    fetchLists(currentUser.uid);
  }, [currentUser, navigate, fetchLists]);

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
    if (!currentUser) return;
    
    try {
      await createList(listName, parseFloat(budget), currentUser.uid);
      setIsModalOpen(false);
      setListName('');
      setBudget('');
    } catch (error) {
      console.error('Erro ao criar lista:', error);
    }
  };

  const handleDeleteList = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta lista?')) {
      try {
        await deleteList(id);
      } catch (error) {
        console.error('Erro ao deletar lista:', error);
      }
    }
  };

  const handleListClick = (list: any) => {
    setCurrentList(list);
    navigate(`/list/${list.id}`);
  };

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SUAS LISTAS</h1>
            <div className="w-6" /> {/* Spacer */}
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

      {/* Add List Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 text-white rounded-full text-2xl shadow-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center"
      >
        +
      </button>

      {/* Lists Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map((list) => (
              <div
                key={list.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition duration-200"
              >
                <div className="flex justify-between items-start">
                  <div onClick={() => handleListClick(list)} className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {list.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Orçamento: R$ {list.budget.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteList(list.id);
                    }}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create List Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">NOVA LISTA</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateList}>
              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                  placeholder="Digite o nome da sua lista"
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">
                  Orçamento
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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