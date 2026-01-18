// Minimal utils bridge for popup.html (content.js overlay).
// Only includes what shared modules (e.g. date-modal.js) require.

(function () {
  if (window.utils) return;

  window.utils = {
    showToast: (message, duration = 2000) => {
      const existing = document.getElementById('prd-stv-toast');
      if (existing) existing.remove();

      const div = document.createElement('div');
      div.id = 'prd-stv-toast';
      div.textContent = message;
      document.body.appendChild(div);

      setTimeout(() => div.remove(), duration);
    }
  };
})();

