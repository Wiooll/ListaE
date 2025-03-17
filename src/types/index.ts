export interface ShoppingList {
  id: string;
  name: string;
  budget: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ListItem {
  id: string;
  list_id: string;
  name: string;
  quantity: number;
  price: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListStats {
  total: number;
  completed: number;
  active: number;
  totalSpent: number;
  remainingBudget: number;
}