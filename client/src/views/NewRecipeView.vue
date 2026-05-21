<template>
  <div class="page">
    <RecipeForm :initial="null" @saved="onSaved" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import RecipeForm from '@/components/RecipeForm.vue';

const router = useRouter();
function onSaved(id: string) { router.push(`/recipes/${id}`); }
</script>

<style scoped>
.page { padding: 1.5rem; padding-bottom: 100px; max-width: 760px; margin: 0 auto; }
</style>
