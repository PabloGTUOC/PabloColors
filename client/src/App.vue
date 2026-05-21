<template>
  <router-view />
  <CameraPanel v-if="showCamera" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import CameraPanel from '@/components/CameraPanel.vue';

const route = useRoute();
const showCamera = computed(() => route.meta.public !== true);
</script>
