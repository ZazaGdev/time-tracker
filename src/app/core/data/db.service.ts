import Dexie, { Table } from 'dexie';
import { Category, Subcategory, Tag, Session, ActiveTimer } from '../models';

export class TTDatabase extends Dexie {
  categories!: Table<Category>;
  subcategories!: Table<Subcategory>;
  tags!: Table<Tag>;
  sessions!: Table<Session>;
  activeTimer!: Table<ActiveTimer>;

  constructor() {
    super('TTDatabase');

    this.version(1).stores({
      categories: '++id,name',
      subcategories: '++id,categoryId,name',
      tags: '++id,name',
      sessions: '++id,startedAt,endedAt,categoryId,subcategoryId',
      activeTimer: '++id,startedAt',
    });
  }
}

export const db = new TTDatabase();