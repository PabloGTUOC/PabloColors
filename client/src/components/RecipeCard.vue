<template>
  <div class="card" :class="{ 'card-list': listMode }" @click="router.push(`/recipes/${recipe.id}`)">
    <div v-if="!listMode" class="photo" :style="photoStyle">
      <span v-if="!recipe.samplePhotoPath" class="no-photo">No photo</span>
    </div>

    <div class="body">
      <div v-if="listMode" class="list-thumb" :style="photoStyle"></div>

      <div class="meta">
        <div class="header-row">
          <span class="name">{{ recipe.name }}</span>
          <span class="scenario-badge">{{ scenarioLabel }}</span>
        </div>
        <div class="film-sim">{{ recipe.settings.filmSimulation.replace(/_/g, ' ') }}</div>
        <div class="tags">
          <span v-for="t in recipe.tags.slice(0, 4)" :key="t" class="tag">{{ t }}</span>
          <span v-if="recipe.tags.length > 4" class="tag muted">+{{ recipe.tags.length - 4 }}</span>
        </div>
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

const props = defineProps<{ recipe: Recipe; listMode?: boolean }>();
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
/* --- Grid card --- */
.card {
  border: 3px solid var(--border); border-radius: 16px; overflow: hidden;
  background: var(--surface); cursor: pointer; transition: transform 0.1s, box-shadow 0.1s;
  box-shadow: 5px 5px 0 var(--border);
}
.card:hover { transform: translate(-2px, -2px); box-shadow: 7px 7px 0 var(--border); }

.photo {
  height: 140px; background: var(--hover) center/cover no-repeat;
  display: flex; align-items: center; justify-content: center;
  border-bottom: 3px solid var(--border);
}
.no-photo { color: var(--text-muted); font-size: .8rem; font-weight: 700; text-transform: uppercase; }

.body { padding: 1.2rem; }
.header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: .5rem; margin-bottom: .4rem; }
.name { font-weight: 800; font-size: 1.05rem; text-transform: uppercase; color: var(--text); }
.scenario-badge {
  font-size: .7rem; padding: .2rem .6rem; border-radius: 999px;
  border: 1.5px solid currentColor; color: var(--accent); background: transparent;
  font-weight: 800; text-transform: uppercase; white-space: nowrap;
}
.film-sim { font-size: .82rem; color: var(--text); font-weight: 700; margin-bottom: .6rem; }
.tags { display: flex; flex-wrap: wrap; gap: .3rem; margin-bottom: .85rem; }
.tag {
  font-size: .72rem; padding: .15rem .5rem; border-radius: 999px;
  border: 1.5px solid var(--border); color: var(--text); font-weight: 700;
  text-transform: uppercase; background: transparent;
}
.tag.muted { opacity: .6; }
.actions { display: flex; justify-content: flex-end; }
.btn-sm {
  font-size: .75rem; padding: .4rem .75rem; border: 2px solid var(--border);
  border-radius: 8px; background: var(--border); color: var(--surface); cursor: pointer;
  font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;
  box-shadow: 2px 2px 0 var(--border);
  transition: transform 0.05s, box-shadow 0.05s;
}
.btn-sm:hover {
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 var(--border);
}
.btn-sm:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 var(--border);
}

/* --- List row overrides --- */
.card-list {
  border-radius: 12px;
}
.card-list .body {
  display: flex; align-items: center; gap: 1rem; padding: .85rem 1.2rem;
}
.card-list .meta { flex: 1; min-width: 0; }
.card-list .header-row { margin-bottom: .2rem; }
.card-list .tags { margin-bottom: 0; }
.card-list .actions { flex-shrink: 0; }

.list-thumb {
  width: 48px; height: 48px; border-radius: 8px; flex-shrink: 0;
  background: var(--hover) center/cover no-repeat;
  border: 2px solid var(--border);
}
</style>
