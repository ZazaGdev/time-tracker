export interface Category {
  id?: number;
  name: string;
}

export interface Subcategory {
  id?: number;
  name: string;
  categoryId: number;
}

export interface Tag {
  id?: number;
  name: string;
}

export interface Session {
  id?: number;
  categoryId: number;
  subcategoryId?: number;
  tagIds: number[];
  startedAt: string; // ISO string
  endedAt: string; // ISO string
  durationMs: number;
}

export interface ActiveTimer {
  id?: number;
  categoryId: number;
  subcategoryId?: number;
  tagIds: number[];
  startedAt: string; // ISO string
}
