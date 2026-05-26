<template>
  <div v-if="tags.length" class="tag-filter">
    <button
      v-for="t in tags"
      :key="t.tag"
      class="chip"
      :class="{ active: store.activeTag === t.tag }"
      @click="toggle(t.tag)"
    >
      {{ t.tag }} <span class="cnt">{{ t.count }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRecipeStore } from '@/stores/recipes';

const store = useRecipeStore();

const tags = computed(() => {
  const counts = new Map<string, number>();
  const source = store.activeScenario === 'all'
    ? store.recipes
    : store.recipes.filter(r => r.scenario === store.activeScenario);
  for (const r of source) {
    for (const t of r.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
});

function toggle(tag: string) {
  store.activeTag = store.activeTag === tag ? null : tag;
}
</script>

<style scoped>
.tag-filter { display: flex; flex-wrap: wrap; gap: .5rem; }
.chip {
  padding: .35rem .75rem; border: 1.5px solid var(--border); border-radius: 999px;
  background: transparent; color: var(--text); cursor: pointer; font-size: .78rem;
  font-weight: 700; text-transform: uppercase;
}
.chip:hover { background: var(--hover); }
.chip.active { background: var(--border); color: var(--surface); border-color: var(--border); }
.cnt { opacity: .7; margin-left: 2px; }
</style>
