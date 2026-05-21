<template>
  <div class="page">
    <div v-if="loading" class="state-msg">Loading…</div>
    <div v-else-if="error" class="state-msg error">{{ error }}</div>
    <RecipeForm
      v-else-if="recipe"
      :initial="recipe"
      :recipe-id="recipe.id"
      @saved="onSaved"
      @deleted="onDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRecipeStore } from '@/stores/recipes';
import type { Recipe } from '@/stores/recipes';
import RecipeForm from '@/components/RecipeForm.vue';

const route = useRoute();
const router = useRouter();
const store = useRecipeStore();

const recipe = ref<Recipe | null>(null);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    recipe.value = await store.fetchOne(route.params.id as string);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load recipe';
  } finally {
    loading.value = false;
  }
});

function onSaved() { router.push('/'); }
function onDeleted() { router.push('/'); }
</script>

<style scoped>
.page { padding: 1.5rem; padding-bottom: 100px; max-width: 760px; margin: 0 auto; }
.state-msg { padding: 2rem; text-align: center; color: var(--text-muted); }
.state-msg.error { color: var(--danger); }
</style>
