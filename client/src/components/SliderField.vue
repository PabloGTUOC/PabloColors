<template>
  <div class="field" :class="{ disabled: props.disabled }" :title="props.disabledHint ?? ''">
    <label :for="sliderId">{{ props.label }} ({{ displayValue }})</label>
    <input
      :id="sliderId"
      type="range"
      :min="props.min"
      :max="props.max"
      :step="props.step"
      :value="modelValue"
      :disabled="props.disabled"
      @input="$emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  label: string;
  modelValue: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  disabledHint?: string;
}>();

defineEmits<{ 'update:modelValue': [value: number] }>();

const sliderId = 'slider-' + Math.random().toString(36).substring(2, 9);

const displayValue = computed(() => {
  const v = props.modelValue;
  return v > 0 ? `+${v}` : String(v);
});
</script>

<style scoped>
.field { display: flex; flex-direction: column; gap: .4rem; margin-bottom: 1rem; }
.field.disabled { opacity: .45; pointer-events: none; }
label { font-size: 11px; font-weight: 800; color: var(--text); text-transform: uppercase; letter-spacing: 0.05em; }
input[type="range"] { width: 100%; }
</style>
