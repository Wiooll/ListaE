import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ShoppingList from '../ShoppingList';
import { useAuth } from '../../contexts/AuthContext';
import { useListStore } from '../../stores/listStore';
import { useToast } from '../../contexts/ToastContext';

// Mock dos hooks
vi.mock('../../contexts/AuthContext');
vi.mock('../../stores/listStore');
vi.mock('../../contexts/ToastContext');

describe('ShoppingList', () => {
  const mockNavigate = vi.fn();
  const mockShowToast = vi.fn();
  const mockCurrentUser = { id: '1', email: 'test@example.com' };
  const mockItems = [
    { id: '1', name: 'Item 1', quantity: 1, price: 10, completed: false },
    { id: '2', name: 'Item 2', quantity: 2, price: 20, completed: true },
  ];
  const mockCurrentList = { id: '1', name: 'Lista Teste', budget: 100 };
  const mockStats = {
    total: 2,
    completed: 1,
    active: 1,
    totalSpent: 50,
    remainingBudget: 50,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock do useNavigate
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ id: '1' }),
      };
    });

    // Mock dos hooks
    (useAuth as any).mockReturnValue({
      currentUser: mockCurrentUser,
      logout: vi.fn(),
    });

    (useListStore as any).mockReturnValue({
      items: mockItems,
      currentList: mockCurrentList,
      stats: mockStats,
      filter: 'all',
      fetchItems: vi.fn(),
      addItem: vi.fn(),
      updateItem: vi.fn(),
      deleteItem: vi.fn(),
      toggleItemComplete: vi.fn(),
      reorderItems: vi.fn(),
      setFilter: vi.fn(),
    });

    (useToast as any).mockReturnValue({
      showToast: mockShowToast,
    });
  });

  it('renderiza corretamente', () => {
    render(
      <BrowserRouter>
        <ShoppingList />
      </BrowserRouter>
    );

    expect(screen.getByText('Lista Teste')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Total de Itens')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('adiciona um novo item', async () => {
    render(
      <BrowserRouter>
        <ShoppingList />
      </BrowserRouter>
    );

    const nameInput = screen.getByLabelText('Nome do Item');
    const quantityInput = screen.getByLabelText('Quantidade');
    const priceInput = screen.getByLabelText('Preço');
    const submitButton = screen.getByText('Adicionar Item');

    fireEvent.change(nameInput, { target: { value: 'Novo Item' } });
    fireEvent.change(quantityInput, { target: { value: '3' } });
    fireEvent.change(priceInput, { target: { value: '30' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(useListStore().addItem).toHaveBeenCalledWith({
        list_id: '1',
        name: 'Novo Item',
        quantity: 3,
        price: 30,
      });
      expect(mockShowToast).toHaveBeenCalledWith('Item adicionado com sucesso!', 'success');
    });
  });

  it('atualiza um item existente', async () => {
    render(
      <BrowserRouter>
        <ShoppingList />
      </BrowserRouter>
    );

    const editButton = screen.getAllByLabelText(/Editar/i)[0];
    fireEvent.click(editButton);

    const nameInput = screen.getByLabelText('Nome do Item');
    const quantityInput = screen.getByLabelText('Quantidade');
    const priceInput = screen.getByLabelText('Preço');
    const saveButton = screen.getByText('Salvar');

    fireEvent.change(nameInput, { target: { value: 'Item Atualizado' } });
    fireEvent.change(quantityInput, { target: { value: '4' } });
    fireEvent.change(priceInput, { target: { value: '40' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(useListStore().updateItem).toHaveBeenCalledWith('1', {
        name: 'Item Atualizado',
        quantity: 4,
        price: 40,
      });
      expect(mockShowToast).toHaveBeenCalledWith('Item atualizado com sucesso!', 'success');
    });
  });

  it('exclui um item', async () => {
    const mockConfirm = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(
      <BrowserRouter>
        <ShoppingList />
      </BrowserRouter>
    );

    const deleteButton = screen.getAllByLabelText(/Excluir/i)[0];
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(useListStore().deleteItem).toHaveBeenCalledWith('1');
      expect(mockShowToast).toHaveBeenCalledWith('Item excluído com sucesso!', 'success');
    });

    mockConfirm.mockRestore();
  });

  it('alterna o estado de conclusão de um item', async () => {
    render(
      <BrowserRouter>
        <ShoppingList />
      </BrowserRouter>
    );

    const checkbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(useListStore().toggleItemComplete).toHaveBeenCalledWith('1');
    });
  });

  it('filtra itens por status', () => {
    render(
      <BrowserRouter>
        <ShoppingList />
      </BrowserRouter>
    );

    const activeButton = screen.getByText('Ativos (1)');
    const completedButton = screen.getByText('Concluídos (1)');

    fireEvent.click(activeButton);
    expect(useListStore().setFilter).toHaveBeenCalledWith('active');

    fireEvent.click(completedButton);
    expect(useListStore().setFilter).toHaveBeenCalledWith('completed');
  });

  it('faz logout corretamente', async () => {
    render(
      <BrowserRouter>
        <ShoppingList />
      </BrowserRouter>
    );

    const menuButton = screen.getByLabelText('Abrir menu');
    fireEvent.click(menuButton);

    const logoutButton = screen.getByText('Sair');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(useAuth().logout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
      expect(mockShowToast).toHaveBeenCalledWith('Logout realizado com sucesso!', 'success');
    });
  });
}); 