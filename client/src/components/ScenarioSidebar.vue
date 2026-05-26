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
  padding: 1.5rem 1rem;
  border-right: 2.5px solid var(--border);
  background: transparent;
  gap: 8px;
}
.scenario-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: .65rem 1rem;
  border: 2px solid var(--border);
  background: var(--border);
  color: var(--surface);
  cursor: pointer;
  border-radius: 10px;
  font-size: .85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: left;
  width: 100%;
  transition: transform 0.05s;
}
.scenario-item:hover {
  transform: translate(-1px, -1px);
}
.scenario-item.active {
  background: var(--surface);
  color: var(--text);
  border: 2px solid var(--border);
  box-shadow: 3px 3px 0 var(--border);
  font-weight: 800;
}
.scenario-item.active:hover {
  transform: none;
}
.count {
  font-size: .72rem;
  background: var(--surface);
  color: var(--text);
  border-radius: 9999px;
  font-weight: 800;
  padding: 2px 8px;
  line-height: 1;
}
.scenario-item.active .count {
  background: var(--border);
  color: var(--surface);
}

@media (max-width: 640px) {
  .scenario-nav {
    flex-direction: row;
    overflow-x: auto;
    border-right: none;
    border-bottom: 2.5px solid var(--border);
    padding: .75rem;
    gap: 8px;
  }
  .scenario-item { white-space: nowrap; flex-shrink: 0; width: auto; }
  .count { display: none; }
}
</style>
