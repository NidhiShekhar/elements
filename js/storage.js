/* =====================================================================
   Tiny localStorage helpers shared by every feature module.
   Everything is namespaced under "bloom-*" keys.
   ===================================================================== */
const BloomStore = (function () {
  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  function todayIso() {
    const d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function daysAgoIso(n) {
    const d = new Date(Date.now() - n * 86400000);
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function formatDate(iso, opts) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB',
      opts || { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function formatDateLong(iso) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-US',
      { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---- check-ins: { [dateIso]: {mood, energy, sleep, reflection} } ---- */
  const CHECKIN_KEY = 'bloom-checkins';
  function getCheckins() { return read(CHECKIN_KEY, {}); }
  function saveCheckin(dateIso, data) {
    const all = getCheckins();
    all[dateIso] = data;
    write(CHECKIN_KEY, all);
  }
  function lastNDays(n) {
    const all = getCheckins();
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const iso = daysAgoIso(i);
      out.push({ date: iso, entry: all[iso] || null });
    }
    return out;
  }

  /* ---- journal: [{id, date, content, tone}] newest first ---- */
  const JOURNAL_KEY = 'bloom-journal';
  function getJournal() { return read(JOURNAL_KEY, []); }
  function setJournal(entries) { write(JOURNAL_KEY, entries); }

  /* ---- cycle events: [{date, kind}] kind = "period_start"|"period_end" ---- */
  const CYCLE_KEY = 'bloom-cycle-events';
  function getCycleEvents() {
    const stored = read(CYCLE_KEY, null);
    if (stored) return stored;
    // seed two past cycles so the modal has something meaningful on day one
    const seed = [
      { date: daysAgoIso(64), kind: 'period_start' },
      { date: daysAgoIso(60), kind: 'period_end' },
      { date: daysAgoIso(36), kind: 'period_start' },
      { date: daysAgoIso(32), kind: 'period_end' },
      { date: daysAgoIso(8),  kind: 'period_start' },
      { date: daysAgoIso(4),  kind: 'period_end' }
    ];
    write(CYCLE_KEY, seed);
    return seed;
  }
  function addCycleEvent(evt) {
    const all = getCycleEvents();
    all.push(evt);
    all.sort((a, b) => a.date.localeCompare(b.date));
    write(CYCLE_KEY, all);
    return all;
  }

  return {
    read, write, todayIso, daysAgoIso, formatDate, formatDateLong, escapeHtml,
    getCheckins, saveCheckin, lastNDays,
    getJournal, setJournal,
    getCycleEvents, addCycleEvent
  };
})();
