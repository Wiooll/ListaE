import Dexie, { Table } from 'dexie';
import type { ShoppingList, ListItem } from '../types';

class ShoppingListDB extends Dexie {
  shoppingLists!: Table<ShoppingList>;
  listItems!: Table<ListItem>;

  constructor() {
    super('ShoppingListDB');
    this.version(1).stores({
      shoppingLists: 'id, name, budget, user_id, created_at, updated_at',
      listItems: 'id, list_id, name, quantity, price, completed, created_at, updated_at',
    });
  }
}

export const db = new ShoppingListDB();