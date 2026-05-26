<template>
  <div class="recipe-form">
    <div class="form-header">
      <div class="header-nav">
        <button class="btn-back" @click="$router.back()" title="Go back to the previous page">← Back</button>
        <button class="btn-home" @click="$router.push('/')" title="Go to home library">⌂ Home</button>
      </div>
      <h2>{{ isNew ? 'New Recipe' : 'Edit Recipe' }}</h2>
    </div>

    <!-- Meta -->
    <section class="section">
      <div class="field">
        <label for="recipe-name">Name *</label>
        <input id="recipe-name" v-model="form.name" type="text" placeholder="e.g. Kodachrome 64" required />
      </div>

      <div class="field">
        <label for="recipe-scenario">Scenario *</label>
        <select id="recipe-scenario" v-model="form.scenario">
          <option v-for="s in SCENARIOS" :key="s.value" :value="s.value">{{ s.label }}</option>
        </select>
      </div>

      <div class="field">
        <label for="recipe-description">Description</label>
        <textarea id="recipe-description" v-model="form.description" rows="3" placeholder="Notes, usage tips…"></textarea>
      </div>

      <div class="field">
        <label for="recipe-tags">Tags</label>
        <div class="tag-input">
          <span v-for="t in form.tags" :key="t" class="chip">
            {{ t }} <button @click="removeTag(t)">×</button>
          </span>
          <input
            id="recipe-tags"
            v-model="tagInput"
            type="text"
            placeholder="Add tag…"
            @keydown.enter.prevent="addTag"
            @keydown.comma.prevent="addTag"
          />
        </div>
      </div>

      <!-- Photo upload -->
      <div class="field">
        <label for="recipe-photo">Sample Photo</label>
        <div
          class="drop-zone"
          :class="{ dragging: isDragging }"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="onDrop"
          @click="photoInput?.click()"
          role="button"
          aria-label="Sample photo upload drop zone"
        >
          <img v-if="photoPreview" :src="photoPreview" class="photo-preview" />
          <span v-else class="drop-hint">Drag & drop or click to upload (JPEG/PNG, max 10 MB)</span>
        </div>
        <input id="recipe-photo" ref="photoInput" type="file" accept=".jpg,.jpeg,.png" style="display:none" @change="onFileChange" />
        <button v-if="photoPreview && !isNew" class="btn-link danger" @click="removePhoto">Remove photo</button>
      </div>
    </section>

    <!-- Film settings -->
    <section class="section">
      <h3>Film Settings</h3>

      <div class="field">
        <label for="film-simulation">Film Simulation *</label>
        <select id="film-simulation" v-model="form.settings.filmSimulation" @change="onFilmSimChange">
          <option v-for="fs in FILM_SIMS" :key="fs.value" :value="fs.value">{{ fs.label }}</option>
        </select>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="grain-effect">Grain Effect</label>
          <select id="grain-effect" v-model.number="form.settings.grainEffect">
            <option :value="0">Off</option><option :value="1">Weak</option><option :value="2">Strong</option>
          </select>
        </div>
        <div class="field">
          <label for="grain-size">Grain Size</label>
          <select id="grain-size" v-model.number="form.settings.grainSize">
            <option :value="0">Small</option><option :value="1">Large</option>
          </select>
        </div>
      </div>

      <div class="field-row" :class="{ disabled: isMonochrome }" :title="isMonochrome ? 'Not applicable for monochrome simulations' : ''">
        <div class="field">
          <label for="color-chrome-effect">Color Chrome Effect</label>
          <select id="color-chrome-effect" v-model.number="form.settings.colorChromeEffect" :disabled="isMonochrome">
            <option :value="0">Off</option><option :value="1">Weak</option><option :value="2">Strong</option>
          </select>
        </div>
        <div class="field">
          <label for="color-chrome-fx-blue">Color Chrome FX Blue</label>
          <select id="color-chrome-fx-blue" v-model.number="form.settings.colorChromeFxBlue" :disabled="isMonochrome">
            <option :value="0">Off</option><option :value="1">Weak</option><option :value="2">Strong</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label for="smooth-skin">Smooth Skin</label>
        <select id="smooth-skin" v-model.number="form.settings.smoothSkin">
          <option :value="0">Off</option><option :value="1">Weak</option><option :value="2">Strong</option>
        </select>
      </div>
    </section>

    <!-- Exposure & WB -->
    <section class="section">
      <h3>Exposure & White Balance</h3>

      <div class="field">
        <label for="exposure-bias">Exposure Bias ({{ form.settings.exposureBias > 0 ? '+' : '' }}{{ form.settings.exposureBias.toFixed(1) }} EV)</label>
        <input id="exposure-bias" type="range" v-model.number="form.settings.exposureBias" min="-5" max="5" step="0.3" />
      </div>

      <div class="field-row">
        <div class="field" :class="{ disabled: form.settings.dRangePriority !== 0 }" :title="form.settings.dRangePriority !== 0 ? 'Not applicable when D-Range Priority is active' : ''">
          <label for="dynamic-range">Dynamic Range</label>
          <select id="dynamic-range" v-model.number="form.settings.dynamicRange" :disabled="form.settings.dRangePriority !== 0">
            <option :value="0">Auto</option>
            <option :value="100">DR100</option>
            <option :value="200">DR200</option>
            <option :value="400">DR400</option>
          </select>
        </div>
        <div class="field">
          <label for="drange-priority">D-Range Priority</label>
          <select id="drange-priority" v-model.number="form.settings.dRangePriority">
            <option :value="0">Off</option>
            <option :value="1">Auto</option>
            <option :value="2">Weak</option>
            <option :value="3">Strong</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label for="white-balance">White Balance</label>
        <select id="white-balance" v-model="form.settings.whiteBalance">
          <option v-for="wb in WB_OPTIONS" :key="wb.value" :value="wb.value">{{ wb.label }}</option>
        </select>
      </div>

      <div v-if="form.settings.whiteBalance === 'COLOR_TEMP'" class="field">
        <label for="wb-color-temp">Color Temperature (K)</label>
        <input id="wb-color-temp" type="number" v-model.number="form.settings.wbColorTemp" min="2500" max="10000" step="100" />
      </div>

      <div class="field-row">
        <div class="field">
          <label for="wb-shift-red">WB Shift Red ({{ form.settings.wbShiftRed > 0 ? '+' : '' }}{{ form.settings.wbShiftRed }})</label>
          <input id="wb-shift-red" type="range" v-model.number="form.settings.wbShiftRed" min="-9" max="9" step="1" />
        </div>
        <div class="field">
          <label for="wb-shift-blue">WB Shift Blue ({{ form.settings.wbShiftBlue > 0 ? '+' : '' }}{{ form.settings.wbShiftBlue }})</label>
          <input id="wb-shift-blue" type="range" v-model.number="form.settings.wbShiftBlue" min="-9" max="9" step="1" />
        </div>
      </div>
    </section>

    <!-- Tone -->
    <section class="section">
      <h3>Tone</h3>

      <SliderField label="Highlight Tone" v-model="form.settings.highlightTone" :min="-2" :max="4" :step="0.5" :disabled="form.settings.dRangePriority !== 0" :disabled-hint="form.settings.dRangePriority !== 0 ? 'Not applicable when D-Range Priority is active' : ''" />
      <SliderField label="Shadow Tone" v-model="form.settings.shadowTone" :min="-2" :max="4" :step="0.5" :disabled="form.settings.dRangePriority !== 0" :disabled-hint="form.settings.dRangePriority !== 0 ? 'Not applicable when D-Range Priority is active' : ''" />
      <SliderField label="Color" v-model="form.settings.color" :min="-4" :max="4" :step="1" :disabled="isMonochrome" :disabled-hint="isMonochrome ? 'Not applicable for monochrome' : ''" />
      <SliderField label="Sharpness" v-model="form.settings.sharpness" :min="-4" :max="4" :step="1" />
      <SliderField label="Noise Reduction" v-model="form.settings.noiseReduction" :min="-4" :max="4" :step="1" />
      <SliderField label="Clarity" v-model="form.settings.clarity" :min="-5" :max="5" :step="1" />
    </section>

    <!-- Actions -->
    <div class="form-actions">
      <button class="btn-danger" v-if="!isNew" @click="confirmDelete">Delete</button>
      <button v-if="!isNew" class="btn-secondary btn-push" @click="pickerOpen = true">Push to camera</button>
      <button class="btn-secondary" @click="$router.back()">Cancel</button>
      <button class="btn-primary" :disabled="saving" @click="save">{{ saving ? 'Saving…' : 'Save' }}</button>
    </div>

    <p v-if="saveError" class="error-msg">{{ saveError }}</p>

    <SlotPicker
      v-if="pickerOpen"
      :recipe-name="form.name"
      :settings="form.settings"
      @close="pickerOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRecipeStore } from '@/stores/recipes';
import type { Recipe, RecipeSettings } from '@/stores/recipes';
import SliderField from './SliderField.vue';
import SlotPicker from './SlotPicker.vue';

const props = defineProps<{
  initial: Recipe | null;
  recipeId?: string;
}>();

const emit = defineEmits<{
  saved: [id: string];
  deleted: [];
}>();

const route = useRoute();
const router = useRouter();
const store = useRecipeStore();

const isNew = computed(() => !props.recipeId);
const saving = ref(false);
const saveError = ref('');
const pickerOpen = ref(false);
const tagInput = ref('');
const isDragging = ref(false);
const photoInput = ref<HTMLInputElement | null>(null);
const photoPreview = ref('');
const pendingPhoto = ref<File | null>(null);

const MONOCHROME_SIMS = new Set(['ACROS_YE','ACROS_R','ACROS_G','ACROS','MONOCHROME','MONOCHROME_YE','MONOCHROME_R','MONOCHROME_G','SEPIA']);
const isMonochrome = computed(() => MONOCHROME_SIMS.has(form.value.settings.filmSimulation));

function defaultSettings(): RecipeSettings {
  return {
    filmSimulation: 'PROVIA', grainEffect: 0, grainSize: 0,
    colorChromeEffect: 0, colorChromeFxBlue: 0,
    whiteBalance: 'AUTO', wbShiftRed: 0, wbShiftBlue: 0,
    dynamicRange: 100, dRangePriority: 0, highlightTone: 0, shadowTone: 0,
    color: 0, sharpness: 0, noiseReduction: 0, clarity: 0,
    smoothSkin: 0, exposureBias: 0,
  };
}

const form = ref<Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>>({
  name: '',
  scenario: 'other',
  description: '',
  tags: [],
  settings: defaultSettings(),
});

// Populate from initial prop or pulled query param
onMounted(() => {
  if (props.initial) {
    form.value = {
      name: props.initial.name,
      scenario: props.initial.scenario,
      description: props.initial.description ?? '',
      tags: [...props.initial.tags],
      settings: { ...defaultSettings(), ...props.initial.settings },
    };
    if (props.initial.samplePhotoPath) {
      photoPreview.value = `/photos/${props.initial.samplePhotoPath.replace('photos/', '')}`;
    }
  } else if (route.query.pulled) {
    try {
      const pulled = JSON.parse(route.query.pulled as string);
      form.value.name = pulled.name ?? '';
      form.value.scenario = pulled.scenario ?? 'other';
      if (pulled.settings) form.value.settings = pulled.settings;
    } catch { /* ignore */ }
  } else if (route.query.scenario) {
    form.value.scenario = route.query.scenario as string;
  }
});

function onFilmSimChange() {
  if (isMonochrome.value) {
    form.value.settings.color = 0;
    form.value.settings.colorChromeEffect = 0;
    form.value.settings.colorChromeFxBlue = 0;
  }
}

function addTag() {
  const t = tagInput.value.trim().replace(/,$/, '');
  if (t && !form.value.tags.includes(t)) form.value.tags.push(t);
  tagInput.value = '';
}

function removeTag(tag: string) {
  form.value.tags = form.value.tags.filter(t => t !== tag);
}

function onDrop(e: DragEvent) {
  isDragging.value = false;
  const file = e.dataTransfer?.files[0];
  if (file) setPhoto(file);
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) setPhoto(file);
}

function setPhoto(file: File) {
  pendingPhoto.value = file;
  photoPreview.value = URL.createObjectURL(file);
}

async function removePhoto() {
  if (!props.recipeId) return;
  await store.removePhoto(props.recipeId);
  photoPreview.value = '';
  pendingPhoto.value = null;
}

async function save() {
  saveError.value = '';
  if (!form.value.name.trim()) { saveError.value = 'Name is required'; return; }
  saving.value = true;
  try {
    let recipe: Recipe;
    if (isNew.value) {
      recipe = await store.create(form.value);
    } else {
      recipe = await store.update(props.recipeId!, form.value);
    }
    if (pendingPhoto.value) {
      await store.uploadPhoto(recipe.id, pendingPhoto.value);
    }
    emit('saved', recipe.id);
  } catch (e) {
    saveError.value = e instanceof Error ? e.message : 'Save failed';
  } finally {
    saving.value = false;
  }
}

async function confirmDelete() {
  if (!confirm(`Delete "${form.value.name}"? This cannot be undone.`)) return;
  try {
    await store.remove(props.recipeId!);
    emit('deleted');
  } catch (e) {
    saveError.value = e instanceof Error ? e.message : 'Delete failed';
  }
}

const SCENARIOS = [
  { value: 'portrait', label: 'Portrait' },
  { value: 'family', label: 'Family' },
  { value: 'street', label: 'Street' },
  { value: 'travel', label: 'Travel' },
  { value: 'nature', label: 'Nature' },
  { value: 'indoors', label: 'Indoors' },
  { value: 'low_light', label: 'Low Light' },
  { value: 'black_and_white', label: 'Black & White' },
  { value: 'other', label: 'Other' },
];

const FILM_SIMS = [
  { value: 'PROVIA', label: 'Provia/Standard' },
  { value: 'VELVIA', label: 'Velvia/Vivid' },
  { value: 'ASTIA', label: 'Astia/Soft' },
  { value: 'CLASSIC_CHROME', label: 'Classic Chrome' },
  { value: 'REALA', label: 'Reala Ace' },
  { value: 'PRO_NEG_HI', label: 'Pro Neg. Hi' },
  { value: 'PRO_NEG_STD', label: 'Pro Neg. Std' },
  { value: 'CLASSIC_NEG', label: 'Classic Neg.' },
  { value: 'NOSTALGIC_NEG', label: 'Nostalgic Neg.' },
  { value: 'ETERNA', label: 'Eterna/Cinema' },
  { value: 'ETERNA_BLEACH_BYPASS', label: 'Eterna Bleach Bypass' },
  { value: 'ACROS_YE', label: 'Acros+Ye' },
  { value: 'ACROS_R', label: 'Acros+R' },
  { value: 'ACROS_G', label: 'Acros+G' },
  { value: 'ACROS', label: 'Acros' },
  { value: 'MONOCHROME', label: 'Monochrome' },
  { value: 'MONOCHROME_YE', label: 'Monochrome+Ye' },
  { value: 'MONOCHROME_R', label: 'Monochrome+R' },
  { value: 'MONOCHROME_G', label: 'Monochrome+G' },
  { value: 'SEPIA', label: 'Sepia' },
];

const WB_OPTIONS = [
  { value: 'AUTO', label: 'Auto' },
  { value: 'AUTO_WHITE', label: 'Auto (White Priority)' },
  { value: 'AUTO_AMBIENT', label: 'Auto (Ambience Priority)' },
  { value: 'DAYLIGHT', label: 'Daylight' },
  { value: 'SHADE', label: 'Shade' },
  { value: 'FL1', label: 'Fluorescent 1' },
  { value: 'FL2', label: 'Fluorescent 2' },
  { value: 'FL3', label: 'Fluorescent 3' },
  { value: 'INCANDESCENT', label: 'Incandescent' },
  { value: 'UNDERWATER', label: 'Underwater' },
  { value: 'COLOR_TEMP', label: 'Color Temperature' },
  { value: 'CUSTOM1', label: 'Custom 1' },
  { value: 'CUSTOM2', label: 'Custom 2' },
  { value: 'CUSTOM3', label: 'Custom 3' },
];
</script>

<style scoped>
.recipe-form { max-width: 680px; padding: 1rem 0; }
.form-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
.header-nav {
  display: flex;
  gap: 0.5rem;
}
.btn-back, .btn-home {
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  cursor: pointer;
  font-size: .85rem;
  font-weight: 800;
  text-transform: uppercase;
  padding: .4rem .75rem;
  box-shadow: 2px 2px 0 var(--border);
  transition: transform 0.05s, box-shadow 0.05s;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}
.btn-back:hover, .btn-home:hover {
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 var(--border);
}
.btn-back:active, .btn-home:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 var(--border);
}
h2 { margin: 0; font-size: 1.5rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.02em; }
h3 { margin: 0 0 1.2rem; font-size: 1.1rem; font-weight: 800; text-transform: uppercase; color: var(--text); }
.section {
  margin-bottom: 1.5rem;
  padding: 20px;
  border: 2.5px solid var(--border);
  border-radius: 12px;
  background: #f5f5f3;
  box-shadow: 4px 4px 0 var(--border);
}
@media (prefers-color-scheme: dark) {
  .section {
    background: #25252f;
  }
}
.field { display: flex; flex-direction: column; gap: .4rem; margin-bottom: 1rem; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.field-row.disabled { opacity: .45; pointer-events: none; }
label { font-size: 11px; font-weight: 800; color: var(--text); text-transform: uppercase; letter-spacing: 0.05em; }
input[type="text"], input[type="number"], textarea, select {
  padding: .65rem .85rem; border: 2px solid var(--border); border-radius: 8px;
  background: var(--surface); color: var(--text); font-size: .95rem; font-family: inherit;
  font-weight: 700; width: 100%;
}
input:focus, select:focus, textarea:focus { outline: none; border-color: var(--border); }
input[type="range"] { padding: 0; border: none; background: transparent; }
textarea { resize: vertical; }
.tag-input {
  display: flex; flex-wrap: wrap; gap: .4rem; padding: .5rem; border: 2px solid var(--border);
  border-radius: 8px; background: var(--surface); min-height: 44px; align-items: center;
}
.tag-input input { border: none; background: transparent; outline: none; flex: 1; min-width: 100px; font-size: .95rem; color: var(--text); font-weight: 700; }
.chip {
  display: flex; align-items: center; gap: .3rem; padding: .2rem .6rem;
  background: transparent; color: var(--text); border: 1.5px solid var(--border); border-radius: 999px; font-size: .8rem;
  font-weight: 700; text-transform: uppercase;
}
.chip button { background: none; border: none; cursor: pointer; color: var(--text); font-size: 1rem; padding: 0; line-height: 1; font-weight: 900; }
.chip button:hover { color: var(--danger); }
.drop-zone {
  border: 2.5px dashed var(--border); border-radius: 8px; padding: 1.5rem;
  text-align: center; cursor: pointer; transition: border-color .15s, background-color .15s;
  background: var(--surface);
}
.drop-zone:hover, .drop-zone.dragging { border-color: var(--border); background: var(--hover); }
.photo-preview { max-height: 200px; max-width: 100%; border: 2px solid var(--border); border-radius: 6px; }
.drop-hint { color: var(--text-muted); font-size: .875rem; font-weight: 700; text-transform: uppercase; }
.btn-link { background: none; border: none; cursor: pointer; font-size: .8rem; text-decoration: underline; padding: .25rem 0; font-weight: 700; }
.btn-link.danger { color: var(--danger); }
.form-actions { display: flex; gap: .75rem; justify-content: flex-end; margin-top: 1.5rem; margin-bottom: 2rem; }
.btn-primary {
  padding: .75rem 1.5rem;
  background: var(--accent);
  color: #ffffff;
  border: 2.5px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  font-size: .95rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 3px 3px 0 var(--border);
  transition: transform 0.1s, box-shadow 0.1s;
}
.btn-primary:hover:not(:disabled) {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 var(--border);
}
.btn-primary:active:not(:disabled) {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 var(--border);
}
.btn-primary:disabled { opacity: .5; cursor: not-allowed; }
.btn-secondary {
  padding: .75rem 1.5rem;
  border: 2.5px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  font-size: .95rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 3px 3px 0 var(--border);
  transition: transform 0.1s, box-shadow 0.1s;
}
.btn-secondary:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 var(--border);
  background: var(--hover);
}
.btn-secondary:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 var(--border);
}
.btn-danger {
  padding: .75rem 1.5rem;
  border: 2.5px solid var(--border);
  border-radius: 10px;
  background: var(--danger);
  color: #ffffff;
  cursor: pointer;
  font-size: .95rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 3px 3px 0 var(--border);
  transition: transform 0.1s, box-shadow 0.1s;
  margin-right: auto;
}
.btn-danger:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 var(--border);
}
.btn-danger:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 var(--border);
}
.error-msg { color: var(--danger); font-size: .875rem; margin-top: .5rem; text-align: right; font-weight: 700; }
</style>
