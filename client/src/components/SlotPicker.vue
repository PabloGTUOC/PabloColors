<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="modal">
      <h3>Push "{{ recipeName }}" to camera slot</h3>

      <div v-if="!camera.webUSBAvailable" class="warning">
        Camera features require Chrome with the camera connected via USB-C.
      </div>
      <div v-else-if="camera.connectionState !== 'connected'" class="warning">
        Connect the camera first from the panel below.
      </div>
      <div v-else>
        <div class="slots">
          <button
            v-for="slot in 7"
            :key="slot"
            class="slot-btn"
            :disabled="pushing"
            @click="push(slot)"
          >
            <span class="slot-label">C{{ slot }}</span>
            <span class="slot-name">{{ slotName(slot) }}</span>
          </button>
        </div>
        <div v-if="result" class="result" :class="result.type">{{ result.message }}</div>
      </div>

      <button class="btn-close" @click="$emit('close')">Close</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useCameraStore } from '@/stores/camera';
import type { RecipeSettings } from '@/stores/recipes';


const props = defineProps<{ recipeName: string; settings: RecipeSettings }>();
const emit = defineEmits<{ close: [] }>();

const camera = useCameraStore();
const pushing = ref(false);
const result = ref<{ type: 'success' | 'warn' | 'error'; message: string } | null>(null);

function slotName(slot: number) {
  return camera.slots.find(s => s.slot === slot)?.name ?? '—';
}

async function push(slot: number) {
  pushing.value = true;
  result.value = null;
  try {
    const warnings = await camera.pushToSlot(slot, props.recipeName, props.settings);
    if (warnings.length > 0) {
      result.value = { type: 'warn', message: `Written with ${warnings.length} warning(s): ${warnings.map(w => w.message).join('; ')}` };
    } else {
      result.value = { type: 'success', message: `Pushed to C${slot} successfully.` };
    }
  } catch (e) {
    result.value = { type: 'error', message: e instanceof Error ? e.message : 'Push failed' };
  } finally {
    pushing.value = false;
  }
}
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 100;
  display: flex; align-items: center; justify-content: center;
}
.modal {
  background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
  padding: 1.75rem; width: 360px; max-width: 95vw;
}
h3 { margin: 0 0 1.25rem; font-size: 1rem; }
.slots { display: grid; grid-template-columns: repeat(4, 1fr); gap: .5rem; margin-bottom: 1rem; }
.slot-btn {
  display: flex; flex-direction: column; align-items: center; padding: .6rem .4rem;
  border: 1px solid var(--border); border-radius: 8px; background: var(--bg);
  cursor: pointer; gap: .25rem;
}
.slot-btn:hover:not(:disabled) { border-color: var(--accent); }
.slot-btn:disabled { opacity: .5; cursor: not-allowed; }
.slot-label { font-weight: 700; font-size: .9rem; color: var(--accent); }
.slot-name { font-size: .68rem; color: var(--text-muted); text-align: center; }
.warning { color: var(--text-muted); font-size: .875rem; margin-bottom: 1rem; }
.result { font-size: .85rem; margin-bottom: .75rem; padding: .5rem .75rem; border-radius: 6px; }
.result.success { background: #d1fae5; color: #065f46; }
.result.warn { background: #fef3c7; color: #92400e; }
.result.error { background: #fee2e2; color: #991b1b; }
.btn-close {
  width: 100%; padding: .55rem; border: 1px solid var(--border); border-radius: 6px;
  background: transparent; color: var(--text-muted); cursor: pointer;
}
</style>
