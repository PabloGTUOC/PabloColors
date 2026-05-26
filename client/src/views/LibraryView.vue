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
  flex: 1; padding: .75rem 1rem; border: 2.5px solid var(--border);
  border-radius: 10px; background: var(--surface); color: var(--text); font-size: .95rem;
  font-weight: 700;
}
.search-input:focus { outline: none; border-color: var(--border); }
.tag-filter { margin-bottom: 1rem; }

.view-toggle { display: flex; border: 2.5px solid var(--border); border-radius: 10px; overflow: hidden; background: var(--surface); }
.view-toggle button {
  padding: .5rem .75rem; border: none; background: transparent;
  color: var(--text); cursor: pointer; font-size: 1.1rem; line-height: 1;
  font-weight: 800;
}
.view-toggle button:hover { background: var(--hover); }
.view-toggle button.active { background: var(--border); color: var(--surface); }

.btn-primary {
  background: var(--border);
  color: var(--surface);
  border: 2px solid var(--border);
  border-radius: 10px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 800;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 3px 3px 0 var(--border);
  transition: transform 0.1s, box-shadow 0.1s;
  white-space: nowrap;
}
.btn-primary:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 var(--border);
}
.btn-primary:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 var(--border);
}

.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem; }
.list { display: flex; flex-direction: column; gap: .75rem; }

.state-msg { padding: 2rem; text-align: center; color: var(--text-muted); }
.state-msg.error { color: var(--danger); }

@media (max-width: 640px) {
  .library-layout { flex-direction: column; }
  .sidebar { width: 100%; }
}
</style>
