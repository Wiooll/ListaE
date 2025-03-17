import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Menu, ShoppingCart, Settings as SettingsIcon, LogOut, User, Bell, Shield, Palette } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function Settings() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [privateListsDefault, setPrivateListsDefault] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CONFIGURAÇÕES</h1>
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
              <SettingsIcon size={20} />
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

      {/* Settings Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="p-6 space-y-6">
            {/* Profile Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <div className="flex items-center space-x-3 mb-4">
                <User size={24} className="text-gray-600 dark:text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Perfil</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Email</label>
                  <p className="text-gray-600 dark:text-gray-400">{currentUser?.email}</p>
                </div>
                <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                  Alterar senha
                </button>
              </div>
            </div>

            {/* Notifications Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <div className="flex items-center space-x-3 mb-4">
                <Bell size={24} className="text-gray-600 dark:text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notificações</h2>
              </div>
              <div className="space-y-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="form-checkbox text-blue-600 dark:text-blue-400"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Notificações por email</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={pushNotifications}
                    onChange={(e) => setPushNotifications(e.target.checked)}
                    className="form-checkbox text-blue-600 dark:text-blue-400"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Notificações push</span>
                </label>
              </div>
            </div>

            {/* Privacy Section */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <div className="flex items-center space-x-3 mb-4">
                <Shield size={24} className="text-gray-600 dark:text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Privacidade</h2>
              </div>
              <div className="space-y-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={privateListsDefault}
                    onChange={(e) => setPrivateListsDefault(e.target.checked)}
                    className="form-checkbox text-blue-600 dark:text-blue-400"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Tornar listas privadas por padrão</span>
                </label>
              </div>
            </div>

            {/* Appearance Section */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Palette size={24} className="text-gray-600 dark:text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Aparência</h2>
              </div>
              <div className="space-y-4">
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="light">Tema Claro</option>
                  <option value="dark">Tema Escuro</option>
                  <option value="system">Usar tema do sistema</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}