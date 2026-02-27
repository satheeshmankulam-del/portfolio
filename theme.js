/* ── SATHEESH M PORTFOLIO — THEME MANAGER ── */
(function () {
  const ROOT = document.documentElement;
  const STORE_KEY = 'sm-theme';

  // Apply theme immediately (before paint) to avoid flash
  function applyTheme(theme) {
    ROOT.setAttribute('data-theme', theme);
    // update all toggle buttons on the page
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      btn.setAttribute('data-current', theme);
    });
  }

  // Read saved preference, fallback to system preference
  function getSaved() {
    try { return localStorage.getItem(STORE_KEY); } catch(e) { return null; }
  }
  function save(theme) {
    try { localStorage.setItem(STORE_KEY, theme); } catch(e) {}
  }

  function getPreferred() {
    const saved = getSaved();
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // Apply immediately on script load
  applyTheme(getPreferred());

  // Toggle function called by button
  window.__toggleTheme = function () {
    const current = ROOT.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    save(next);
    applyTheme(next);
  };

  // Re-apply after DOM ready (in case buttons weren't there yet)
  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(getPreferred());
  });
})();
