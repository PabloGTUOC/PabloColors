import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface RecipeSettings {
  filmSimulation: string;
  grainEffect: number;
  grainSize: number;
  colorChromeEffect: number;
  colorChromeFxBlue: number;
  whiteBalance: string;
  wbColorTemp?: number;
  wbShiftRed: number;
  wbShiftBlue: number;
  dynamicRange: number;
  dRangePriority: number;
  highlightTone: number;
  shadowTone: number;
  color: number;
  sharpness: number;
  noiseReduction: number;
  clarity: number;
  smoothSkin: number;
  exposureBias: number;
}

export interface Recipe {
  id: string;
  name: string;
  scenario: string;
  description?: string;
  tags: string[];
  samplePhotoPath?: string;
  createdAt: string;
  updatedAt: string;
  settings: RecipeSettings;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(url, { credentials: 'include', ...options });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${resp.status}`);
  }
  if (resp.status === 204) return undefined as T;
  return resp.json();
}

export const useRecipeStore = defineStore('recipes', () => {
  const recipes = ref<Recipe[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const activeScenario = ref<string>('all');
  const searchQuery = ref('');
  const activeTag = ref<string | null>(null);

  const filtered = computed(() => {
    let list = recipes.value;
    if (activeScenario.value !== 'all') {
      list = list.filter(r => r.scenario === activeScenario.value);
    }
    if (activeTag.value) {
      list = list.filter(r => r.tags.includes(activeTag.value!));
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q) ||
        r.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return list;
  });

  const scenarioCounts = computed(() => {
    const counts: Record<string, number> = {};
    for (const r of recipes.value) {
      counts[r.scenario] = (counts[r.scenario] ?? 0) + 1;
    }
    return counts;
  });

  async function fetchAll() {
    loading.value = true;
    error.value = null;
    try {
      recipes.value = await apiFetch<Recipe[]>('/api/v1/recipes');
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load recipes';
    } finally {
      loading.value = false;
    }
  }

  async function fetchOne(id: string): Promise<Recipe> {
    return apiFetch<Recipe>(`/api/v1/recipes/${id}`);
  }

  async function create(data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recipe> {
    const created = await apiFetch<Recipe>('/api/v1/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    recipes.value.unshift(created);
    return created;
  }

  async function update(id: string, data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recipe> {
    const updated = await apiFetch<Recipe>(`/api/v1/recipes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const idx = recipes.value.findIndex(r => r.id === id);
    if (idx !== -1) recipes.value[idx] = updated;
    return updated;
  }

  async function remove(id: string): Promise<void> {
    await apiFetch<void>(`/api/v1/recipes/${id}`, { method: 'DELETE' });
    recipes.value = recipes.value.filter(r => r.id !== id);
  }

  async function uploadPhoto(id: string, file: File): Promise<Recipe> {
    const form = new FormData();
    form.append('photo', file);
    const updated = await apiFetch<Recipe>(`/api/v1/recipes/${id}/photo`, {
      method: 'POST',
      body: form,
    });
    const idx = recipes.value.findIndex(r => r.id === id);
    if (idx !== -1) recipes.value[idx] = updated;
    return updated;
  }

  async function removePhoto(id: string): Promise<Recipe> {
    const updated = await apiFetch<Recipe>(`/api/v1/recipes/${id}/photo`, { method: 'DELETE' });
    const idx = recipes.value.findIndex(r => r.id === id);
    if (idx !== -1) recipes.value[idx] = updated;
    return updated;
  }

  return {
    recipes, loading, error, activeScenario, searchQuery, activeTag, filtered, scenarioCounts,
    fetchAll, fetchOne, create, update, remove, uploadPhoto, removePhoto,
  };
});
