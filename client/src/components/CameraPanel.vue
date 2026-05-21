<template>
  <div class="camera-panel">
    <!-- Non-Chromium fallback -->
    <div v-if="!camera.webUSBAvailable" class="banner-static">
      Camera features require Chrome with the camera connected via USB-C.
    </div>

    <template v-else>
      <div class="status-row">
        <span class="status-dot" :class="statusClass"></span>
        <span class="status-label">{{ statusLabel }}</span>
        <span v-if="camera.error" class="camera-error">{{ camera.error }}</span>
        <div class="actions">
          <button v-if="camera.connectionState !== 'connected'" class="btn-cam" :disabled="camera.connectionState === 'connecting'" @click="camera.connect()">
            {{ camera.connectionState === 'connecting' ? 'Connecting…' : 'Connect camera' }}
          </button>
          <template v-else>
            <button class="btn-cam" @click="camera.refreshSlots()">Refresh</button>
            <button class="btn-cam btn-disconnect" @click="camera.disconnect()">Disconnect</button>
          </template>
        </div>
      </div>

      <div v-if="camera.connectionState === 'connected'" class="slots-row">
        <div
          v-for="slot in 7"
          :key="slot"
          class="slot"
          @click="pullSlot(slot)"
          title="Click to pull from camera"
        >
          <span class="slot-label">C{{ slot }}</span>
          <span class="slot-name">{{ slotName(slot) }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCameraStore } from '@/stores/camera';

const camera = useCameraStore();
const router = useRouter();

const statusClass = computed(() => ({
  dot: true,
  connected: camera.connectionState === 'connected',
  connecting: camera.connectionState === 'connecting',
  error: camera.connectionState === 'error',
}));

const statusLabel = computed(() => {
  if (camera.connectionState === 'connected') return camera.modelName ?? 'Camera connected';
  if (camera.connectionState === 'connecting') return 'Connecting…';
  if (camera.connectionState === 'error') return 'Connection error';
  return 'No camera';
});

function slotName(slot: number) {
  return camera.slots.find(s => s.slot === slot)?.name ?? '—';
}

async function pullSlot(slot: number) {
  if (camera.connectionState !== 'connected') return;
  try {
    const info = await camera.pullFromSlot(slot);
    if (info.settings) {
      // Navigate to new recipe pre-filled with pulled settings
      await router.push({
        path: '/recipes/new',
        query: { pulled: JSON.stringify({ name: info.name, settings: info.settings, scenario: 'other' }) },
      });
    }
  } catch { /* error shown via camera.error */ }
}
</script>

<style scoped>
.camera-panel {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
  background: var(--surface); border-top: 1px solid var(--border);
  padding: .6rem 1.25rem; font-size: .85rem;
}
.banner-static { color: var(--text-muted); text-align: center; padding: .25rem 0; }
.status-row { display: flex; align-items: center; gap: .75rem; }
.status-dot {
  width: 8px; height: 8px; border-radius: 50%; background: var(--text-muted); flex-shrink: 0;
}
.status-dot.connected { background: #22c55e; }
.status-dot.connecting { background: #f59e0b; }
.status-dot.error { background: var(--danger); }
.status-label { font-weight: 500; }
.camera-error { color: var(--danger); font-size: .8rem; flex: 1; }
.actions { margin-left: auto; display: flex; gap: .5rem; }
.btn-cam {
  padding: .3rem .7rem; border: 1px solid var(--border); border-radius: 6px;
  background: transparent; color: var(--text); cursor: pointer; font-size: .8rem;
}
.btn-cam:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.btn-cam:disabled { opacity: .5; cursor: not-allowed; }
.btn-disconnect:hover { border-color: var(--danger) !important; color: var(--danger) !important; }
.slots-row { display: flex; gap: .5rem; margin-top: .5rem; flex-wrap: wrap; }
.slot {
  display: flex; flex-direction: column; align-items: center; gap: .1rem;
  padding: .35rem .6rem; border: 1px solid var(--border); border-radius: 6px;
  cursor: pointer; min-width: 52px;
}
.slot:hover { border-color: var(--accent); }
.slot-label { font-weight: 700; font-size: .8rem; color: var(--accent); }
.slot-name { font-size: .68rem; color: var(--text-muted); }
</style>
