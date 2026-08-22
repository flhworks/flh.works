
(() => {
  const button = document.querySelector('.menu-button');
  const nav = document.querySelector('#global-nav');
  if (button && nav) {
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        button.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      }
    });
  }
})();
