/* Check-in modal — a 4-step wizard: mood → energy → sleep → reflection.
   Saves to localStorage under today's date. */
(function () {
  const MOODS = [
    { v: 1, face: '😞', word: 'Low' },
    { v: 2, face: '😕', word: 'Meh' },
    { v: 3, face: '🙂', word: 'Good' },
    { v: 4, face: '😊', word: 'Great' },
    { v: 5, face: '😄', word: 'Wonderful' }
  ];

  let step = 0;
  let draft = {};

  function render() {
    step = 0;
    const existing = BloomStore.getCheckins()[BloomStore.todayIso()];
    draft = existing
      ? { mood: existing.mood, energy: existing.energy, sleep: existing.sleep, reflection: existing.reflection || '' }
      : { mood: null, energy: 5, sleep: 7, reflection: '' };
    paint();
  }

  function paint() {
    const body = document.getElementById('checkinBody');
    const pct = Math.round(((step + 1) / 4) * 100);

    let stepHtml = '';
    if (step === 0) {
      stepHtml =
        '<p class="bloom-label">How are you feeling today?</p>' +
        '<div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px">' +
        MOODS.map(m =>
          '<button class="bloom-pill' + (draft.mood === m.v ? ' selected' : '') + '" data-mood="' + m.v + '">' +
            m.face + '&nbsp; ' + m.word +
          '</button>'
        ).join('') +
        '</div>';
    } else if (step === 1) {
      stepHtml =
        '<p class="bloom-label">Energy level</p>' +
        '<p class="bloom-value">' + draft.energy + '/10</p>' +
        '<input class="bloom-range" id="energyRange" type="range" min="0" max="10" step="1" value="' + draft.energy + '">';
    } else if (step === 2) {
      stepHtml =
        '<p class="bloom-label">Hours of sleep last night</p>' +
        '<p class="bloom-value">' + draft.sleep + 'h</p>' +
        '<input class="bloom-range" id="sleepRange" type="range" min="0" max="12" step="0.5" value="' + draft.sleep + '">';
    } else {
      stepHtml =
        '<p class="bloom-label">Anything on your mind? (optional)</p>' +
        '<textarea class="bloom-textarea" id="reflectionText" rows="4" ' +
          'placeholder="A line or two about your day...">' +
          BloomStore.escapeHtml(draft.reflection) + '</textarea>';
    }

    body.innerHTML =
      bloomModalHead('Daily check-in', 'Step ' + (step + 1) + ' of 4') +
      '<div class="modal-scroll">' +
        '<div class="progress-track"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
        stepHtml +
        '<div style="display:flex; justify-content:space-between; margin-top:22px">' +
          (step > 0
            ? '<button class="bloom-button ghost" data-back>Back</button>'
            : '<span></span>') +
          (step < 3
            ? '<button class="bloom-button" data-next' + (step === 0 && draft.mood == null ? ' disabled' : '') + '>Next</button>'
            : '<button class="bloom-button" data-save>Save check-in</button>') +
        '</div>' +
      '</div>';

    body.querySelectorAll('[data-mood]').forEach((btn) => {
      btn.addEventListener('click', () => {
        draft.mood = Number(btn.dataset.mood);
        paint();
      });
    });
    const energy = body.querySelector('#energyRange');
    if (energy) energy.addEventListener('input', () => {
      draft.energy = Number(energy.value);
      body.querySelector('.bloom-value').textContent = draft.energy + '/10';
    });
    const sleep = body.querySelector('#sleepRange');
    if (sleep) sleep.addEventListener('input', () => {
      draft.sleep = Number(sleep.value);
      body.querySelector('.bloom-value').textContent = draft.sleep + 'h';
    });
    const back = body.querySelector('[data-back]');
    if (back) back.addEventListener('click', () => { syncText(); step--; paint(); });
    const next = body.querySelector('[data-next]');
    if (next) next.addEventListener('click', () => { syncText(); step++; paint(); });
    const save = body.querySelector('[data-save]');
    if (save) save.addEventListener('click', () => {
      syncText();
      BloomStore.saveCheckin(BloomStore.todayIso(), {
        mood: draft.mood, energy: draft.energy,
        sleep: draft.sleep, reflection: draft.reflection.trim()
      });
      BloomModals.close();
    });

    function syncText() {
      const t = body.querySelector('#reflectionText');
      if (t) draft.reflection = t.value;
    }
  }

  BloomModals.register('checkin', render);
})();
