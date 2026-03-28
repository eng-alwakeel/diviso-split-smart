/**
 * Guest Data Store — localStorage CRUD for temporary groups, expenses, plans.
 * All data is ephemeral and tied to the guest session.
 */

const DATA_KEY = 'diviso_guest_data';

export interface GuestGroup {
  id: string;
  name: string;
  currency: string;
  is_temporary: true;
  created_at: string;
  updated_at: string;
}

export interface GuestExpense {
  id: string;
  group_id: string;
  description: string;
  amount: number;
  currency: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface GuestPlan {
  id: string;
  name: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface GuestData {
  groups: GuestGroup[];
  expenses: GuestExpense[];
  plans: GuestPlan[];
}

function generateId(): string {
  return crypto.randomUUID?.() ?? `g_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function readData(): GuestData {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    if (!raw) return { groups: [], expenses: [], plans: [] };
    return JSON.parse(raw);
  } catch {
    return { groups: [], expenses: [], plans: [] };
  }
}

function writeData(data: GuestData): void {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

// --- Groups ---
export function getGuestGroups(): GuestGroup[] {
  return readData().groups;
}

export function addGuestGroup(name: string, currency: string = 'SAR'): GuestGroup {
  const data = readData();
  const now = new Date().toISOString();
  const group: GuestGroup = { id: generateId(), name, currency, is_temporary: true, created_at: now, updated_at: now };
  data.groups.push(group);
  writeData(data);
  return group;
}

export function updateGuestGroup(id: string, updates: Partial<Pick<GuestGroup, 'name' | 'currency'>>): void {
  const data = readData();
  const idx = data.groups.findIndex(g => g.id === id);
  if (idx >= 0) {
    data.groups[idx] = { ...data.groups[idx], ...updates, updated_at: new Date().toISOString() };
    writeData(data);
  }
}

export function deleteGuestGroup(id: string): void {
  const data = readData();
  data.groups = data.groups.filter(g => g.id !== id);
  data.expenses = data.expenses.filter(e => e.group_id !== id);
  writeData(data);
}

// --- Expenses ---
export function getGuestExpenses(groupId?: string): GuestExpense[] {
  const data = readData();
  return groupId ? data.expenses.filter(e => e.group_id === groupId) : data.expenses;
}

export function addGuestExpense(expense: Omit<GuestExpense, 'id' | 'created_at' | 'updated_at'>): GuestExpense {
  const data = readData();
  const now = new Date().toISOString();
  const item: GuestExpense = { ...expense, id: generateId(), created_at: now, updated_at: now };
  data.expenses.push(item);
  writeData(data);
  return item;
}

export function updateGuestExpense(id: string, updates: Partial<Pick<GuestExpense, 'description' | 'amount' | 'category'>>): void {
  const data = readData();
  const idx = data.expenses.findIndex(e => e.id === id);
  if (idx >= 0) {
    data.expenses[idx] = { ...data.expenses[idx], ...updates, updated_at: new Date().toISOString() };
    writeData(data);
  }
}

export function deleteGuestExpense(id: string): void {
  const data = readData();
  data.expenses = data.expenses.filter(e => e.id !== id);
  writeData(data);
}

// --- Plans ---
export function getGuestPlans(): GuestPlan[] {
  return readData().plans;
}

export function addGuestPlan(plan: Omit<GuestPlan, 'id' | 'created_at' | 'updated_at'>): GuestPlan {
  const data = readData();
  const now = new Date().toISOString();
  const item: GuestPlan = { ...plan, id: generateId(), created_at: now, updated_at: now };
  data.plans.push(item);
  writeData(data);
  return item;
}

export function updateGuestPlan(id: string, updates: Partial<Pick<GuestPlan, 'name' | 'destination' | 'start_date' | 'end_date'>>): void {
  const data = readData();
  const idx = data.plans.findIndex(p => p.id === id);
  if (idx >= 0) {
    data.plans[idx] = { ...data.plans[idx], ...updates, updated_at: new Date().toISOString() };
    writeData(data);
  }
}

// --- Bulk ---
export function getAllGuestData(): GuestData {
  return readData();
}

export function clearGuestData(): void {
  localStorage.removeItem(DATA_KEY);
}
