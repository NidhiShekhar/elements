/* Insights modal — range toggles, a grouped bar chart of
   mood / energy / sleep from stored check-ins, plus insight cards. */
(function () {
  const RANGES = [
    { label: '2W', days: 14 },
    { label: '1M', days: 30 },
    { label: '3M', days: 90 }
  ];
  let rangeDays = 14;

  function render() {
    const body = document.getElementById('insightsBody');
    const days = BloomStore.lastNDays(rangeDays);
    const logged = days.filter(d => d.entry);

    // bucket long ranges so the chart stays readable
    const maxCols = 15;
    const bucketSize = Math.ceil(days.length / maxCols);
    const buckets = [];
    for (let i = 0; i < days.length; i += bucketSize) {
      const slice = days.slice(i, i + bucketSize).filter(d => d.entry);
      const avg = (sel, scale) => {
        const vals = slice.map(d => sel(d.entry)).filter(v => v != null);
        return vals.length
          ? vals.reduce((a, b) => a + b, 0) / vals.length / scale
          : null;
      };
      buckets.push({
        mood:   avg(e => e.mood, 5),
        energy: avg(e => e.energy, 10),
        sleep:  avg(e => e.sleep, 12)
      });
    }

    const chart = buckets.map(b =>
      '<div class="col">' +
        '<div class="bar mood"   style="height:' + Math.round((b.mood   || 0) * 33) + '%"></div>' +
        '<div class="bar energy" style="height:' + Math.round((b.energy || 0) * 33) + '%"></div>' +
        '<div class="bar sleep"  style="height:' + Math.round((b.sleep  || 0) * 33) + '%"></div>' +
      '</div>'
    ).join('');

    const insights = [];
    if (logged.length === 0) {
      insights.push('Log check-ins across a few weeks to see patterns here.');
    } else {
      const moods = logged.map(d => d.entry.mood).filter(v => v != null);
      if (moods.length) {
        const avg = moods.reduce((a, b) => a + b, 0) / moods.length;
        insights.push('Your average mood over this range is ' + avg.toFixed(1) +
          ' out of 5, across ' + logged.length + ' check-in' + (logged.length > 1 ? 's' : '') + '.');
      }
      const sleeps = logged.map(d => d.entry.sleep).filter(v => v != null);
      if (sleeps.length >= 3) {
        const avg = sleeps.reduce((a, b) => a + b, 0) / sleeps.length;
        insights.push('You averaged ' + avg.toFixed(1) + ' hours of sleep. ' +
          (avg >= 7 ? 'That\'s a solid rhythm — it often pairs with steadier moods.'
                    : 'A little more rest could gently lift your energy scores.'));
      }
    }

    body.innerHTML =
      bloomModalHead('Insights', 'Patterns from your check-ins') +
      '<div class="modal-scroll">' +
        '<div class="range-toggle">' +
          RANGES.map(r =>
            '<button class="bloom-pill' + (r.days === rangeDays ? ' selected' : '') + '" data-days="' + r.days + '">' +
              r.label + '</button>').join('') +
        '</div>' +
        (logged.length
          ? '<div class="bloom-card">' +
              '<div class="chart-box">' + chart + '</div>' +
              '<div class="chart-legend">' +
                '<span><i style="background:var(--bloom-rose)"></i>Mood</span>' +
                '<span><i style="background:var(--bloom-ochre)"></i>Energy</span>' +
                '<span><i style="background:var(--bloom-sage)"></i>Sleep</span>' +
              '</div>' +
            '</div>'
          : '<div class="bloom-empty">No check-ins in this range yet.<br>Complete a daily check-in to see trends.</div>') +
        insights.map(t => '<div class="insight-quote" style="margin-top:14px">' + BloomStore.escapeHtml(t) + '</div>').join('') +
      '</div>';

    body.querySelectorAll('[data-days]').forEach((btn) => {
      btn.addEventListener('click', () => {
        rangeDays = Number(btn.dataset.days);
        render();
      });
    });
  }

  BloomModals.register('insights', render);
})();
