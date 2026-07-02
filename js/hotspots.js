/* =====================================================================
   Hotspot → modal registry. One modal open at a time; each feature
   module registers a render function that is called every time its
   modal opens (so content always reflects the latest stored data).
   ===================================================================== */
const BloomModals = (function () {
  const renderers = {};   // feature -> () => void
  const onClose = {};     // feature -> () => void (optional)
  let openFeature = null;

  function register(feature, renderFn, closeFn) {
    renderers[feature] = renderFn;
    if (closeFn) onClose[feature] = closeFn;
  }

  function dialogFor(feature) {
    return document.getElementById('modal-' + feature);
  }

  function open(feature) {
    if (openFeature && openFeature !== feature) close();
    const dlg = dialogFor(feature);
    if (!dlg) return;
    if (renderers[feature]) renderers[feature]();
    if (!dlg.open) dlg.showModal();
    openFeature = feature;
  }

  function close() {
    if (!openFeature) return;
    const dlg = dialogFor(openFeature);
    if (dlg && dlg.open) dlg.close();
    openFeature = null;
  }

  // wire every hotspot
  document.querySelectorAll('.hotspot[data-feature]').forEach((btn) => {
    btn.addEventListener('click', () => open(btn.dataset.feature));
  });

  // native close events (Escape, dlg.close()) — run feature teardown,
  // and clicking the backdrop closes too
  document.querySelectorAll('.bloom-modal').forEach((dlg) => {
    dlg.addEventListener('close', () => {
      const feature = dlg.id.replace('modal-', '');
      if (onClose[feature]) onClose[feature]();
      if (openFeature === feature) openFeature = null;
    });
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) dlg.close(); // click on ::backdrop area
    });
  });

  // ?open=<feature> deep-links straight into a modal (also handy for testing)
  window.addEventListener('DOMContentLoaded', () => {
    const feature = new URLSearchParams(location.search).get('open');
    if (feature && renderers[feature]) open(feature);
  });

  return { register, open, close };
})();

/* Shared header builder so every modal gets the same chrome. */
function bloomModalHead(title, subtitle) {
  return (
    '<div class="modal-head">' +
      '<div>' +
        '<h2>' + title + '</h2>' +
        (subtitle ? '<p class="modal-sub">' + subtitle + '</p>' : '') +
      '</div>' +
      '<button class="modal-close" type="button" data-close aria-label="Close">&#10005;</button>' +
    '</div>'
  );
}

/* Delegate close-button clicks inside any modal body. */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-close]');
  if (btn) {
    const dlg = btn.closest('dialog');
    if (dlg && dlg.open) dlg.close();
  }
});

/* First-visit welcome hint — one gentle line, dismissed forever after
   the first interaction with anything in the room. */
(function () {
  const HINT_KEY = 'bloom-welcomed';
  let seen = false;
  try { seen = localStorage.getItem(HINT_KEY) === '1'; } catch (e) {}
  if (seen) return;

  const hint = document.createElement('div');
  hint.className = 'welcome-hint';
  hint.textContent = 'Welcome home. Everything in this room is yours — try the lamp, or say hello to the cat.';
  document.getElementById('scene').appendChild(hint);

  function dismiss() {
    hint.classList.add('gone');
    try { localStorage.setItem(HINT_KEY, '1'); } catch (e) {}
    setTimeout(() => hint.remove(), 600);
    document.removeEventListener('pointerdown', dismiss);
    document.removeEventListener('keydown', dismiss);
  }
  document.addEventListener('pointerdown', dismiss, { once: false });
  document.addEventListener('keydown', dismiss, { once: false });
  setTimeout(dismiss, 12000);
})();
