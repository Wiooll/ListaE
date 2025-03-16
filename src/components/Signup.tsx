import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError('As senhas não coincidem');
    }

    try {
      setError('');
      await signup(email, password);
      navigate('/');
    } catch (err) {
      setError('Falha ao criar conta. Tente novamente.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <h1 className="text-5xl font-bold text-center py-8">ListaÊ</h1>
      
      <div className="container mx-auto px-4 flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-center mb-8">CADASTRO</h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-gray-700 font-bold mb-2">
                  E-MAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 font-bold mb-2">
                  SENHA
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-bold mb-2">
                  CONFIRMAR SENHA
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded hover:bg-blue-700 transition duration-200"
              >
                Cadastrar
              </button>
            </form>
            
            <div className="text-center mt-4">
              <a href="/" className="text-blue-600 hover:text-blue-800">
                Já tem uma conta? Faça login!
              </a>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <ShoppingCart size={64} className="mx-auto text-gray-600" />
          </div>
        </div>
      </div>
      
      <footer className="py-4 text-center text-gray-600">
        Desenvolvido por: <a href="https://github.com/Wiooll" className="text-blue-600 hover:text-blue-800">Willian Sousa</a>
      </footer>
    </div>
  );
}