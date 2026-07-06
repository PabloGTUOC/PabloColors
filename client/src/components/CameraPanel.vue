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
        <span v-if="camera.error" class="camera-error" :title="camera.error">{{ shortError }}</span>
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

// Show a concise one-liner; full message available on hover (title attr)
const shortError = computed(() => {
  const e = camera.error ?? '';
  if (e.includes('Unable to claim') || e.includes('claimInterface')) {
    return 'Interface busy — quit Image Capture/Photos, check camera USB mode';
  }
  if (e.includes('No device selected') || e.includes('cancelled')) return 'No device selected';
  // Truncate long raw messages
  return e.length > 80 ? e.slice(0, 77) + '…' : e;
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
  background: var(--surface); border-top: 3px solid var(--border);
  padding: .8rem 1.5rem; font-size: .85rem;
}
.banner-static { color: var(--text-muted); text-align: center; padding: .25rem 0; font-weight: 700; text-transform: uppercase; }
.status-row { display: flex; align-items: center; gap: .75rem; }
.status-dot {
  width: 12px; height: 12px; border-radius: 50%; background: var(--text-muted); flex-shrink: 0;
  border: 1.5px solid var(--border);
}
.status-dot.connected { background: #22c55e; }
.status-dot.connecting { background: #f59e0b; }
.status-dot.error { background: var(--danger); }
.status-label { font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text); }
.camera-error { color: var(--danger); font-size: .8rem; flex: 1; font-weight: 700; text-transform: uppercase; }
.actions { margin-left: auto; display: flex; gap: .5rem; }
.btn-cam {
  padding: .4rem 1rem; border: 2px solid var(--border); border-radius: 999px;
  background: var(--surface); color: var(--text); cursor: pointer; font-size: .8rem;
  font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em;
  box-shadow: 2px 2px 0 var(--border);
  transition: transform 0.05s, box-shadow 0.05s;
}
.btn-cam:hover:not(:disabled) {
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 var(--border);
  background: var(--hover);
}
.btn-cam:active:not(:disabled) {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 var(--border);
}
.btn-cam:disabled { opacity: .5; cursor: not-allowed; }
.btn-disconnect:hover {
  background: var(--danger);
  color: #ffffff;
}
.slots-row { display: flex; gap: .5rem; margin-top: .75rem; flex-wrap: wrap; }
.slot {
  display: flex; flex-direction: column; align-items: center; gap: .1rem;
  padding: .4rem .8rem; border: 2px solid var(--border); border-radius: 8px;
  cursor: pointer; min-width: 64px; background: var(--surface);
  box-shadow: 2px 2px 0 var(--border);
  transition: transform 0.05s, box-shadow 0.05s;
}
.slot:hover {
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 var(--border);
  background: var(--hover);
}
.slot:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 var(--border);
}
.slot-label { font-weight: 800; font-size: .8rem; color: var(--accent); }
.slot-name { font-size: .68rem; color: var(--text); font-weight: 700; text-transform: uppercase; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
