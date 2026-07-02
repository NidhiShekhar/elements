/* Dashboard modal — greeting, today's snapshot, 7-day sparklines,
   and one gentle correlation-style insight. All from localStorage. */
(function () {
  const MOOD_FACES = { 1: '😞', 2: '😕', 3: '🙂', 4: '😊', 5: '😄' };
  const MOOD_WORDS = { 1: 'Low', 2: 'Meh', 3: 'Good', 4: 'Great', 5: 'Wonderful' };

  function greeting() {
    const h = new Date().getHours();
    if (h < 5)  return 'Good night, there';
    if (h < 12) return 'Good morning, there';
    if (h < 17) return 'Good afternoon, there';
    return 'Good evening, there';
  }

  function sparkline(values, max, extraClass) {
    const bars = values.map((v) => {
      const pct = v == null ? 0 : Math.max(8, Math.round((v / max) * 100));
      return '<span style="height:' + pct + '%; opacity:' + (v == null ? 0.25 : 0.85) + '"></span>';
    }).join('');
    return '<div class="sparkline-bars ' + (extraClass || '') + '">' + bars + '</div>';
  }

  function insightText(days) {
    const pairs = days.filter(d => d.entry && d.entry.mood != null && d.entry.sleep != null);
    if (pairs.length < 3) {
      return 'Log a few check-ins this week to see gentle patterns emerge.';
    }
    // simple correlation between sleep and mood
    const xs = pairs.map(p => p.entry.sleep);
    const ys = pairs.map(p => p.entry.mood);
    const n = xs.length;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0, dx2 = 0, dy2 = 0;
    for (let i = 0; i < n; i++) {
      num += (xs[i] - mx) * (ys[i] - my);
      dx2 += (xs[i] - mx) ** 2;
      dy2 += (ys[i] - my) ** 2;
    }
    const denom = Math.sqrt(dx2 * dy2);
    if (!denom) return 'Your recent days look steady — keep checking in.';
    const r = num / denom;
    return 'Sleep and next-day mood: in your recent check-ins, days with more of one ' +
      'factor tended to line up with ' + (r >= 0 ? 'higher' : 'lower') +
      ' values on the other (r=' + r.toFixed(3) + '). ' +
      'This is an association in your data, not a diagnosis.';
  }

  function render() {
    const body = document.getElementById('dashboardBody');
    const today = BloomStore.getCheckins()[BloomStore.todayIso()];
    const days = BloomStore.lastNDays(7);

    const moodVals  = days.map(d => d.entry ? d.entry.mood : null);
    const sleepVals = days.map(d => d.entry ? d.entry.sleep : null);
    const sleepNums = sleepVals.filter(v => v != null);
    const sleepAvg = sleepNums.length
      ? (sleepNums.reduce((a, b) => a + b, 0) / sleepNums.length).toFixed(1)
      : null;
    const moodNums = moodVals.filter(v => v != null);
    const moodAvg = moodNums.length
      ? moodNums.reduce((a, b) => a + b, 0) / moodNums.length
      : null;
    const moodWord = moodAvg == null ? '—'
      : moodAvg >= 4.2 ? 'bright' : moodAvg >= 3.4 ? 'good'
      : moodAvg >= 2.6 ? 'neutral' : moodAvg >= 1.8 ? 'low' : 'heavy';

    const snapshot = today
      ? '<div class="bloom-row">' +
          '<div class="bloom-card"><p class="bloom-label">Mood</p>' +
            '<p class="bloom-value">' + (MOOD_FACES[today.mood] || '—') +
            '<small>' + (MOOD_WORDS[today.mood] || '') + '</small></p></div>' +
          '<div class="bloom-card"><p class="bloom-label">Energy</p>' +
            '<p class="bloom-value">' + (today.energy != null ? today.energy + '/10' : '—') + '</p></div>' +
          '<div class="bloom-card"><p class="bloom-label">Sleep</p>' +
            '<p class="bloom-value">' + (today.sleep != null ? today.sleep + 'h' : '—') + '</p></div>' +
        '</div>' +
        '<div style="margin-top:12px"><button class="bloom-pill" data-open-checkin>Update check-in</button></div>'
      : '<div class="bloom-empty">No check-in yet today.<br>' +
        '<button class="bloom-button" data-open-checkin style="margin-top:12px">Start today\'s check-in</button></div>';

    body.innerHTML =
      bloomModalHead(greeting(), 'How is your day going?') +
      '<div class="modal-scroll">' +
        '<p class="bloom-label" style="margin-bottom:8px">Today\'s snapshot</p>' +
        snapshot +
        '<p class="bloom-label" style="margin:20px 0 8px">This week</p>' +
        '<div class="bloom-row">' +
          '<div class="bloom-card">' +
            '<p class="bloom-label">Mood</p>' +
            '<p class="bloom-value" style="font-size:1.2rem">' + moodWord + '</p>' +
            sparkline(moodVals, 5) +
            '<p class="bloom-label" style="margin-top:8px">Last 7 days</p>' +
          '</div>' +
          '<div class="bloom-card">' +
            '<p class="bloom-label">Sleep</p>' +
            '<p class="bloom-value" style="font-size:1.2rem">' +
              (sleepAvg != null ? sleepAvg + '<small>hrs avg</small>' : '—') + '</p>' +
            sparkline(sleepVals, 10, 'sage') +
            '<p class="bloom-label" style="margin-top:8px">Last 7 days</p>' +
          '</div>' +
        '</div>' +
        '<div class="insight-quote" style="margin-top:20px">' +
          BloomStore.escapeHtml(insightText(days)) +
        '</div>' +
      '</div>';

    body.querySelectorAll('[data-open-checkin]').forEach((btn) => {
      btn.addEventListener('click', () => BloomModals.open('checkin'));
    });
  }

  BloomModals.register('dashboard', render);
})();
