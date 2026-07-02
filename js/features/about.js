/* About modal — the botanical prints on the wall open a little note
   about what Bloom is and how the room works. */
(function () {
  function render() {
    const body = document.getElementById('aboutBody');
    body.innerHTML =
      bloomModalHead('Bloom', 'A room of your own') +
      '<div class="modal-scroll">' +
        '<p style="font-size:0.92rem; line-height:1.7; margin-top:8px">' +
          'Bloom is a private wellbeing companion. There\'s no menu and no feed — ' +
          'just this room. Everything here is yours to touch:' +
        '</p>' +
        '<div class="bloom-card" style="margin-top:6px">' +
          '<div style="display:grid; gap:9px; font-size:0.88rem; line-height:1.5">' +
            '<span>The <strong>lamp</strong> cycles the light — day, dusk, night, and back.</span>' +
            '<span>The <strong>telephone</strong> takes your daily check-in.</span>' +
            '<span>The <strong>notebook and pen</strong> open your journal.</span>' +
            '<span>The <strong>stack of books</strong> holds your dashboard.</span>' +
            '<span>The <strong>pink flowers</strong> track your cycle.</span>' +
            '<span>The <strong>armchair</strong> is where insights live.</span>' +
            '<span>The <strong>record player</strong> plays something soft.</span>' +
            '<span>And the <strong>cat</strong>? The cat listens.</span>' +
          '</div>' +
        '</div>' +
        '<p style="font-size:0.85rem; line-height:1.65; color:var(--bloom-muted); margin-bottom:0">' +
          'Everything you write stays on this device. Bloom is a companion, ' +
          'not a clinician — it notices patterns in your data, it does not diagnose.' +
        '</p>' +
      '</div>';
  }

  BloomModals.register('about', render);
})();
