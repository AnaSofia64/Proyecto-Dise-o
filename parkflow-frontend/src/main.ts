import { router } from './router.js';

document.addEventListener('DOMContentLoaded', () => {
  router.init();
});

window.addEventListener('storage', (event) => {
  if (event.key === 'jwt_token' && !event.newValue) {
    window.location.href = '/login';
  }
});
