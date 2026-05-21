import { defineStore } from 'pinia';
import { ref } from 'vue';
import { cameraSession, isWebUSBSupported, WriteWarning } from '@/camera';
import type { SlotInfo, RecipeSettings } from '@/camera';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export const useCameraStore = defineStore('camera', () => {
  const webUSBAvailable = isWebUSBSupported();
  const connectionState = ref<ConnectionState>('disconnected');
  const modelName = ref<string | null>(null);
  const slots = ref<SlotInfo[]>([]);
  const error = ref<string | null>(null);
  const lastWarnings = ref<WriteWarning[]>([]);

  async function connect() {
    connectionState.value = 'connecting';
    error.value = null;
    try {
      modelName.value = await cameraSession.connect();
      connectionState.value = 'connected';
      await refreshSlots();
    } catch (e) {
      connectionState.value = 'error';
      error.value = e instanceof Error ? e.message : 'Connection failed';
      modelName.value = null;
    }
  }

  async function disconnect() {
    try {
      await cameraSession.disconnect();
    } finally {
      connectionState.value = 'disconnected';
      modelName.value = null;
      slots.value = [];
    }
  }

  async function refreshSlots() {
    if (!cameraSession.isConnected()) return;
    error.value = null;
    try {
      slots.value = await cameraSession.readAllSlots();
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to read slots';
    }
  }

  async function pushToSlot(slot: number, name: string, settings: RecipeSettings): Promise<WriteWarning[]> {
    error.value = null;
    lastWarnings.value = [];
    try {
      const warnings = await cameraSession.writeSlot(slot, name, settings);
      lastWarnings.value = warnings;
      // Refresh just the written slot
      const updated = await cameraSession.readSlot(slot);
      const idx = slots.value.findIndex(s => s.slot === slot);
      if (idx !== -1) slots.value[idx] = updated;
      else slots.value.push(updated);
      return warnings;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to write slot';
      throw e;
    }
  }

  async function pullFromSlot(slot: number): Promise<SlotInfo> {
    error.value = null;
    try {
      const info = await cameraSession.readSlot(slot);
      const idx = slots.value.findIndex(s => s.slot === slot);
      if (idx !== -1) slots.value[idx] = info;
      return info;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to read slot';
      throw e;
    }
  }

  return {
    webUSBAvailable, connectionState, modelName, slots, error, lastWarnings,
    connect, disconnect, refreshSlots, pushToSlot, pullFromSlot,
  };
});
