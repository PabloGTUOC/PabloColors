<template>
  <div class="library-layout">
    <ScenarioSidebar class="sidebar" />

    <main class="main">
      <div class="toolbar">
        <input
          v-model="store.searchQuery"
          class="search-input"
          type="search"
          placeholder="Search recipes…"
        />
        <button class="btn-primary" @click="router.push('/recipes/new')">+ New Recipe</button>
      </div>

      <TagFilter v-if="store.activeScenario !== 'all'" class="tag-filter" />

      <div v-if="store.loading" class="state-msg">Loading…</div>
      <div v-else-if="store.error" class="state-msg error">{{ store.error }}</div>
      <div v-else-if="store.filtered.length === 0" class="state-msg muted">No recipes found.</div>
      <div v-else class="grid">
        <RecipeCard v-for="r in store.filtered" :key="r.id" :recipe="r" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useRecipeStore } from '@/stores/recipes';
import ScenarioSidebar from '@/components/ScenarioSidebar.vue';
import TagFilter from '@/components/TagFilter.vue';
import RecipeCard from '@/components/RecipeCard.vue';

const router = useRouter();
const store = useRecipeStore();

onMounted(() => store.fetchAll());
</script>

<style scoped>
.library-layout {
  display: flex;
  min-height: 100vh;
  padding-bottom: 80px; /* space for camera panel */
}
.sidebar { width: 220px; flex-shrink: 0; }
.main { flex: 1; padding: 1.5rem; overflow-y: auto; }
.toolbar { display: flex; gap: .75rem; margin-bottom: 1rem; align-items: center; }
.search-input {
  flex: 1; padding: .55rem .75rem; border: 1px solid var(--border);
  border-radius: 6px; background: var(--bg); color: var(--text); font-size: .95rem;
}
.search-input:focus { outline: none; border-color: var(--accent); }
.tag-filter { margin-bottom: 1rem; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
.state-msg { padding: 2rem; text-align: center; color: var(--text-muted); }
.state-msg.error { color: var(--danger); }

@media (max-width: 640px) {
  .library-layout { flex-direction: column; }
  .sidebar { width: 100%; }
}
</style>
