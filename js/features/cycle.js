/* Cycle modal — today's phase, average cycle length, next-period
   estimate, event history, and simple period start/end logging. */
(function () {
  const MS_DAY = 86400000;

  function analyze(events) {
    const starts = events.filter(e => e.kind === 'period_start')
                         .map(e => e.date).sort();
    if (!starts.length) return null;

    const gaps = [];
    for (let i = 1; i < starts.length; i++) {
      gaps.push(Math.round(
        (new Date(starts[i]) - new Date(starts[i - 1])) / MS_DAY));
    }
    const avgLen = gaps.length
      ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length)
      : 28;

    const lastStart = starts[starts.length - 1];
    const dayOfCycle = Math.floor(
      (Date.now() - new Date(lastStart + 'T00:00:00')) / MS_DAY) + 1;

    let phase = 'Follicular';
    if (dayOfCycle <= 5) phase = 'Menstrual';
    else if (dayOfCycle <= 13) phase = 'Follicular';
    else if (dayOfCycle <= 16) phase = 'Ovulatory';
    else phase = 'Luteal';

    const next = new Date(new Date(lastStart + 'T00:00:00').getTime() + avgLen * MS_DAY);
    const nextIso = next.getFullYear() + '-' +
      String(next.getMonth() + 1).padStart(2, '0') + '-' +
      String(next.getDate()).padStart(2, '0');
    const daysUntil = Math.max(0, Math.round((next - Date.now()) / MS_DAY));

    return { avgLen, dayOfCycle, phase, nextIso, daysUntil };
  }

  function render() {
    const body = document.getElementById('cycleBody');
    const events = BloomStore.getCycleEvents();
    const stats = analyze(events);

    const summary = stats
      ? '<div class="bloom-row">' +
          '<div class="bloom-card"><p class="bloom-label">Today</p>' +
            '<p class="bloom-value" style="font-size:1.15rem">' + stats.phase + '</p>' +
            '<p class="bloom-label" style="margin-top:6px">Day ' + stats.dayOfCycle + ' of cycle</p></div>' +
          '<div class="bloom-card"><p class="bloom-label">Avg cycle</p>' +
            '<p class="bloom-value">' + stats.avgLen + '<small>days</small></p></div>' +
          '<div class="bloom-card"><p class="bloom-label">Next period</p>' +
            '<p class="bloom-value" style="font-size:1.15rem">' +
              (stats.daysUntil === 0 ? 'Around now' : 'in ~' + stats.daysUntil + 'd') + '</p>' +
            '<p class="bloom-label" style="margin-top:6px">' + BloomStore.formatDate(stats.nextIso) + '</p></div>' +
        '</div>'
      : '<div class="bloom-empty">Log a period start to begin tracking.</div>';

    const history = events.slice().reverse().slice(0, 8).map(e =>
      '<div style="display:flex; justify-content:space-between; padding:8px 2px; ' +
        'border-bottom:1px solid var(--bloom-pill-border); font-size:0.85rem">' +
        '<span>' + (e.kind === 'period_start' ? 'Period started' : 'Period ended') + '</span>' +
        '<span style="color:var(--bloom-muted)">' + BloomStore.formatDate(e.date) + '</span>' +
      '</div>'
    ).join('');

    body.innerHTML =
      bloomModalHead('Cycle', 'Predictions are estimates, not medical advice') +
      '<div class="modal-scroll">' +
        summary +
        '<div style="display:flex; gap:10px; margin:18px 0">' +
          '<button class="bloom-pill" data-log="period_start">Log period start</button>' +
          '<button class="bloom-pill" data-log="period_end">Log period end</button>' +
        '</div>' +
        '<p class="bloom-label" style="margin-bottom:4px">Recent events</p>' +
        (history || '<div class="bloom-empty">No events yet.</div>') +
      '</div>';

    body.querySelectorAll('[data-log]').forEach((btn) => {
      btn.addEventListener('click', () => {
        BloomStore.addCycleEvent({ date: BloomStore.todayIso(), kind: btn.dataset.log });
        render();
      });
    });
  }

  BloomModals.register('cycle', render);
})();
