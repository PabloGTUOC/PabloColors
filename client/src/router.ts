import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('@/views/LoginView.vue'), meta: { public: true } },
    { path: '/', component: () => import('@/views/LibraryView.vue') },
    { path: '/recipes/new', component: () => import('@/views/NewRecipeView.vue') },
    { path: '/recipes/:id', component: () => import('@/views/RecipeView.vue') },
  ],
});

router.beforeEach(async (to) => {
  if (to.meta.public) return true;
  try {
    const resp = await fetch('/api/v1/auth/me', { credentials: 'include' });
    if (resp.ok) return true;
    return '/login';
  } catch {
    return '/login';
  }
});

export default router;
