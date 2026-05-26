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
  background: var(--surface); border: 3px solid var(--border); border-radius: 16px;
  padding: 1.75rem; width: 380px; max-width: 95vw;
  box-shadow: 6px 6px 0 var(--border);
}
h3 { margin: 0 0 1.25rem; font-size: 1.1rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.03em; color: var(--text); }
.slots { display: grid; grid-template-columns: repeat(4, 1fr); gap: .5rem; margin-bottom: 1.5rem; }
.slot-btn {
  display: flex; flex-direction: column; align-items: center; padding: .6rem .4rem;
  border: 2px solid var(--border); border-radius: 8px; background: var(--surface);
  cursor: pointer; gap: .25rem;
  box-shadow: 2px 2px 0 var(--border);
  transition: transform 0.05s, box-shadow 0.05s;
}
.slot-btn:hover:not(:disabled) {
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 var(--border);
  background: var(--hover);
}
.slot-btn:active:not(:disabled) {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 var(--border);
}
.slot-btn:disabled { opacity: .5; cursor: not-allowed; }
.slot-label { font-weight: 800; font-size: .9rem; color: var(--accent); }
.slot-name { font-size: .68rem; color: var(--text); font-weight: 700; text-transform: uppercase; text-align: center; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.warning { color: var(--text-muted); font-size: .875rem; margin-bottom: 1.25rem; font-weight: 700; text-transform: uppercase; }
.result { font-size: .85rem; margin-bottom: 1.25rem; padding: .6rem .8rem; border-radius: 8px; font-weight: 700; text-transform: uppercase; }
.result.success { border: 2px solid #065f46; background: #d1fae5; color: #065f46; }
.result.warn { border: 2px solid #92400e; background: #fef3c7; color: #92400e; }
.result.error { border: 2px solid #991b1b; background: #fee2e2; color: #991b1b; }
.btn-close {
  width: 100%; padding: .65rem; border: 2px solid var(--border); border-radius: 8px;
  background: var(--surface); color: var(--text); cursor: pointer; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.05em;
  box-shadow: 3px 3px 0 var(--border);
  transition: transform 0.05s, box-shadow 0.05s;
}
.btn-close:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 var(--border);
  background: var(--hover);
}
.btn-close:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 var(--border);
}
</style>
