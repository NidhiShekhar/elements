/* Journal modal — two-pane list + detail/compose, mirroring the Bloom
   journal page. Entries persist in localStorage, newest first. */
(function () {
  let selectedId = null;
  let mode = 'view'; // 'view' | 'edit' | 'compose'

  function titleOf(content) {
    const line = content.split('\n')[0].trim();
    return line.length > 48 ? line.slice(0, 48) + '…' : (line || 'Untitled');
  }

  function render() {
    mode = 'view';
    const entries = BloomStore.getJournal();
    if (selectedId == null || !entries.some(e => e.id === selectedId)) {
      selectedId = entries[0] ? entries[0].id : null;
    }
    paint();
  }

  function paint() {
    const body = document.getElementById('journalBody');
    const entries = BloomStore.getJournal();
    const selected = entries.find(e => e.id === selectedId) || null;

    const listHtml = entries.length
      ? entries.map(e =>
          '<button class="journal-item' + (e.id === selectedId && mode !== 'compose' ? ' active' : '') + '" data-id="' + e.id + '">' +
            '<span class="ji-date">' + BloomStore.formatDate(e.date) + '</span>' +
            '<span class="ji-title">' + BloomStore.escapeHtml(titleOf(e.content)) + '</span>' +
          '</button>'
        ).join('')
      : '<div class="bloom-empty">No entries yet.<br>Start writing your first one.</div>';

    let detailHtml = '';
    if (mode === 'compose' || mode === 'edit') {
      const initial = mode === 'edit' && selected ? selected.content : '';
      detailHtml =
        '<p class="bloom-label" style="margin-top:8px">' +
          (mode === 'compose' ? 'New entry — ' + BloomStore.formatDateLong(BloomStore.todayIso()) : 'Editing entry') +
        '</p>' +
        '<textarea class="bloom-textarea" id="journalText" rows="10" ' +
          'placeholder="What\'s on your mind today?">' + BloomStore.escapeHtml(initial) + '</textarea>' +
        '<div style="display:flex; gap:10px; margin-top:14px">' +
          '<button class="bloom-button" data-save>Save entry</button>' +
          '<button class="bloom-button ghost" data-cancel>Cancel</button>' +
        '</div>';
    } else if (selected) {
      detailHtml =
        '<p class="bloom-label" style="margin-top:8px">' + BloomStore.formatDateLong(selected.date) + '</p>' +
        '<h3>' + BloomStore.escapeHtml(titleOf(selected.content)) + '</h3>' +
        '<p style="font-size:0.92rem; line-height:1.65; white-space:pre-wrap">' +
          BloomStore.escapeHtml(selected.content) + '</p>' +
        (selected.tone ? '<span class="tone-badge">' + BloomStore.escapeHtml(selected.tone) + '</span>' : '') +
        '<div style="display:flex; gap:10px; margin-top:18px">' +
          '<button class="bloom-button ghost" data-edit>Edit</button>' +
          '<button class="bloom-button ghost" data-delete>Delete</button>' +
        '</div>';
    } else {
      detailHtml = '<div class="bloom-empty">Select an entry, or write a new one.</div>';
    }

    body.innerHTML =
      bloomModalHead('Your journal', 'A private place for your thoughts') +
      '<div style="padding:0 24px 10px"><button class="bloom-pill" data-new>+ New entry</button></div>' +
      '<div class="journal-layout">' +
        '<div class="journal-list">' + listHtml + '</div>' +
        '<div class="journal-detail">' + detailHtml + '</div>' +
      '</div>';

    body.querySelectorAll('.journal-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedId = Number(btn.dataset.id);
        mode = 'view';
        paint();
      });
    });
    const newBtn = body.querySelector('[data-new]');
    if (newBtn) newBtn.addEventListener('click', () => { mode = 'compose'; paint(); });
    const editBtn = body.querySelector('[data-edit]');
    if (editBtn) editBtn.addEventListener('click', () => { mode = 'edit'; paint(); });
    const delBtn = body.querySelector('[data-delete]');
    if (delBtn) delBtn.addEventListener('click', () => {
      if (!confirm('Delete this entry? This cannot be undone.')) return;
      const remaining = BloomStore.getJournal().filter(e => e.id !== selectedId);
      BloomStore.setJournal(remaining);
      selectedId = remaining[0] ? remaining[0].id : null;
      mode = 'view';
      paint();
    });
    const saveBtn = body.querySelector('[data-save]');
    if (saveBtn) saveBtn.addEventListener('click', () => {
      const text = body.querySelector('#journalText').value.trim();
      if (!text) return;
      const all = BloomStore.getJournal();
      if (mode === 'compose') {
        const entry = { id: Date.now(), date: BloomStore.todayIso(), content: text, tone: null };
        all.unshift(entry);
        selectedId = entry.id;
      } else {
        const target = all.find(e => e.id === selectedId);
        if (target) target.content = text;
      }
      BloomStore.setJournal(all);
      mode = 'view';
      paint();
    });
    const cancelBtn = body.querySelector('[data-cancel]');
    if (cancelBtn) cancelBtn.addEventListener('click', () => { mode = 'view'; paint(); });
  }

  BloomModals.register('journal', render);
})();
