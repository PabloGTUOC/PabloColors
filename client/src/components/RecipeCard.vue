<template>
  <div class="card" @click="router.push(`/recipes/${recipe.id}`)">
    <div class="photo" :style="photoStyle">
      <span v-if="!recipe.samplePhotoPath" class="no-photo">No photo</span>
    </div>

    <div class="body">
      <div class="header-row">
        <span class="name">{{ recipe.name }}</span>
        <span class="scenario-badge">{{ scenarioLabel }}</span>
      </div>
      <div class="film-sim">{{ recipe.settings.filmSimulation.replace(/_/g, ' ') }}</div>
      <div class="tags">
        <span v-for="t in recipe.tags.slice(0, 4)" :key="t" class="tag">{{ t }}</span>
        <span v-if="recipe.tags.length > 4" class="tag muted">+{{ recipe.tags.length - 4 }}</span>
      </div>

      <div class="actions" @click.stop>
        <button class="btn-sm" @click="openSlotPicker">Push to camera</button>
      </div>
    </div>

    <SlotPicker
      v-if="pickerOpen"
      :recipe-name="recipe.name"
      :settings="recipe.settings"
      @close="pickerOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { Recipe } from '@/stores/recipes';
import SlotPicker from './SlotPicker.vue';

const props = defineProps<{ recipe: Recipe }>();
const router = useRouter();
const pickerOpen = ref(false);

const SCENARIO_LABELS: Record<string, string> = {
  portrait: 'Portrait', family: 'Family', street: 'Street', travel: 'Travel',
  nature: 'Nature', indoors: 'Indoors', low_light: 'Low Light',
  black_and_white: 'B&W', other: 'Other',
};
const scenarioLabel = computed(() => SCENARIO_LABELS[props.recipe.scenario] ?? props.recipe.scenario);

const photoStyle = computed(() => {
  if (!props.recipe.samplePhotoPath) return {};
  return { backgroundImage: `url(/photos/${props.recipe.samplePhotoPath.replace('photos/', '')})` };
});

function openSlotPicker() { pickerOpen.value = true; }
</script>

<style scoped>
.card {
  border: 1px solid var(--border); border-radius: 10px; overflow: hidden;
  background: var(--surface); cursor: pointer; transition: box-shadow .15s;
}
.card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.12); }
.photo {
  height: 140px; background: var(--hover) center/cover no-repeat;
  display: flex; align-items: center; justify-content: center;
}
.no-photo { color: var(--text-muted); font-size: .8rem; }
.body { padding: .85rem; }
.header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: .5rem; margin-bottom: .3rem; }
.name { font-weight: 600; font-size: .95rem; }
.scenario-badge {
  font-size: .7rem; padding: .15rem .5rem; border-radius: 999px;
  background: var(--accent-subtle); color: var(--accent); white-space: nowrap;
}
.film-sim { font-size: .8rem; color: var(--text-muted); margin-bottom: .5rem; }
.tags { display: flex; flex-wrap: wrap; gap: .3rem; margin-bottom: .75rem; }
.tag {
  font-size: .72rem; padding: .1rem .45rem; border-radius: 999px;
  border: 1px solid var(--border); color: var(--text-muted);
}
.tag.muted { opacity: .6; }
.actions { display: flex; justify-content: flex-end; }
.btn-sm {
  font-size: .78rem; padding: .3rem .65rem; border: 1px solid var(--border);
  border-radius: 6px; background: transparent; color: var(--text-muted); cursor: pointer;
}
.btn-sm:hover { border-color: var(--accent); color: var(--accent); }
</style>
