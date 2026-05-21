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
        <div class="view-toggle">
          <button :class="{ active: viewMode === 'grid' }" @click="viewMode = 'grid'" title="Grid view">⊞</button>
          <button :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'" title="List view">☰</button>
        </div>
        <button class="btn-primary" @click="newRecipe">+ New Recipe</button>
      </div>

      <TagFilter v-if="store.activeScenario !== 'all'" class="tag-filter" />

      <div v-if="store.loading" class="state-msg">Loading…</div>
      <div v-else-if="store.error" class="state-msg error">{{ store.error }}</div>
      <div v-else-if="store.filtered.length === 0" class="state-msg muted">No recipes found.</div>
      <div v-else :class="viewMode === 'grid' ? 'grid' : 'list'">
        <RecipeCard v-for="r in store.filtered" :key="r.id" :recipe="r" :list-mode="viewMode === 'list'" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useRecipeStore } from '@/stores/recipes';
import ScenarioSidebar from '@/components/ScenarioSidebar.vue';
import TagFilter from '@/components/TagFilter.vue';
import RecipeCard from '@/components/RecipeCard.vue';

const router = useRouter();
const store = useRecipeStore();
const viewMode = ref<'grid' | 'list'>('grid');

onMounted(() => store.fetchAll());

function newRecipe() {
  const query: Record<string, string> = {};
  if (store.activeScenario !== 'all') query.scenario = store.activeScenario;
  router.push({ path: '/recipes/new', query });
}
</script>

<style scoped>
.library-layout {
  display: flex;
  min-height: 100vh;
  padding-bottom: 80px;
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

.view-toggle { display: flex; border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
.view-toggle button {
  padding: .45rem .6rem; border: none; background: transparent;
  color: var(--text-muted); cursor: pointer; font-size: 1rem; line-height: 1;
}
.view-toggle button:hover { background: var(--hover); }
.view-toggle button.active { background: var(--accent-subtle); color: var(--accent); }

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
.list { display: flex; flex-direction: column; gap: .5rem; }

.state-msg { padding: 2rem; text-align: center; color: var(--text-muted); }
.state-msg.error { color: var(--danger); }

@media (max-width: 640px) {
  .library-layout { flex-direction: column; }
  .sidebar { width: 100%; }
}
</style>
