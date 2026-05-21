<template>
  <!-- Desktop: vertical sidebar. Mobile: horizontal tab row -->
  <nav class="scenario-nav">
    <button
      v-for="s in scenarios"
      :key="s.value"
      class="scenario-item"
      :class="{ active: store.activeScenario === s.value }"
      @click="select(s.value)"
    >
      <span class="label">{{ s.label }}</span>
      <span class="count">{{ s.value === 'all' ? store.recipes.length : (store.scenarioCounts[s.value] ?? 0) }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { useRecipeStore } from '@/stores/recipes';

const store = useRecipeStore();

const scenarios = [
  { value: 'all', label: 'All' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'family', label: 'Family' },
  { value: 'street', label: 'Street' },
  { value: 'travel', label: 'Travel' },
  { value: 'nature', label: 'Nature' },
  { value: 'indoors', label: 'Indoors' },
  { value: 'low_light', label: 'Low Light' },
  { value: 'black_and_white', label: 'B&W' },
  { value: 'other', label: 'Other' },
];

function select(value: string) {
  store.activeScenario = value;
  store.activeTag = null;
}
</script>

<style scoped>
.scenario-nav {
  display: flex;
  flex-direction: column;
  padding: 1rem .5rem;
  border-right: 1px solid var(--border);
  background: var(--surface);
  gap: 2px;
}
.scenario-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: .5rem .75rem;
  border: none;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  border-radius: 6px;
  font-size: .9rem;
  text-align: left;
  width: 100%;
}
.scenario-item:hover { background: var(--hover); }
.scenario-item.active { background: var(--accent-subtle); color: var(--accent); font-weight: 600; }
.count { font-size: .75rem; color: var(--text-muted); }

@media (max-width: 640px) {
  .scenario-nav {
    flex-direction: row;
    overflow-x: auto;
    border-right: none;
    border-bottom: 1px solid var(--border);
    padding: .5rem;
  }
  .scenario-item { white-space: nowrap; flex-shrink: 0; }
  .count { display: none; }
}
</style>
