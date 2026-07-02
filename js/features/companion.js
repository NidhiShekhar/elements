/* Companion modal — the cat listens. Chat UI with gentle rule-based
   replies drawn from your stored check-ins and journal. */
(function () {
  let messages = [];

  function botReply(text) {
    const q = text.toLowerCase();
    const days = BloomStore.lastNDays(7);
    const logged = days.filter(d => d.entry);

    if (/mood|feel/.test(q)) {
      const moods = logged.map(d => d.entry.mood).filter(v => v != null);
      if (!moods.length) {
        return 'I don\'t have any mood check-ins from this week yet. ' +
          'Pick up the telephone on the sideboard whenever you\'re ready.';
      }
      const avg = moods.reduce((a, b) => a + b, 0) / moods.length;
      return 'Over the past week your mood has averaged ' + avg.toFixed(1) +
        ' out of 5 across ' + moods.length + ' check-in' + (moods.length > 1 ? 's' : '') +
        '. ' + (avg >= 3.5 ? 'That\'s a warm stretch — nice.' : 'Some heavier days in there. Be gentle with yourself.');
    }
    if (/sleep|tired|rest/.test(q)) {
      const sleeps = logged.map(d => d.entry.sleep).filter(v => v != null);
      if (!sleeps.length) return 'No sleep logs yet this week — your check-ins will teach me your rhythm.';
      const avg = sleeps.reduce((a, b) => a + b, 0) / sleeps.length;
      return 'You\'ve averaged ' + avg.toFixed(1) + ' hours of sleep this week. ' +
        (avg >= 7 ? 'A steady rhythm like that tends to pair with brighter days.'
                  : 'When you can, an earlier night might soften the tired edges.');
    }
    if (/energy/.test(q)) {
      const en = logged.map(d => d.entry.energy).filter(v => v != null);
      if (!en.length) return 'I\'ll know more about your energy once you\'ve logged a check-in or two.';
      const avg = en.reduce((a, b) => a + b, 0) / en.length;
      return 'Your energy has been around ' + avg.toFixed(1) + '/10 lately. ' +
        (avg >= 6 ? 'You\'ve had fuel in the tank.' : 'Lower-energy stretches pass — small rests count.');
    }
    if (/journal|write|entry/.test(q)) {
      const n = BloomStore.getJournal().length;
      return n
        ? 'You have ' + n + ' journal entr' + (n > 1 ? 'ies' : 'y') + ' so far. ' +
          'The notebook on the sideboard opens right up if you want to add more.'
        : 'Your journal is still blank — the notebook and pen on the sideboard are waiting whenever words come.';
    }
    if (/hi|hello|hey/.test(q)) {
      return 'Mrrp. Hello. I\'m mostly asleep in this sunbeam, but I\'m listening. ' +
        'Ask me about your mood, sleep, energy, or journal.';
    }
    return 'I\'m a small cat with simple wisdom: I can reflect on your mood, sleep, ' +
      'energy, or journal. A fuller companion arrives when the Bloom backend is connected.';
  }

  function paint() {
    const body = document.getElementById('companionBody');
    body.innerHTML =
      bloomModalHead('Companion', 'The cat in the sunbeam is listening') +
      '<div class="chat-scroll" id="chatScroll">' +
        messages.map(m =>
          '<div class="chat-bubble ' + m.role + '">' + BloomStore.escapeHtml(m.text) + '</div>'
        ).join('') +
      '</div>' +
      '<div class="chat-input-row">' +
        '<input class="bloom-input" id="chatInput" type="text" placeholder="Ask about your week..." autocomplete="off">' +
        '<button class="bloom-button" data-send>Send</button>' +
      '</div>';

    const scroll = body.querySelector('#chatScroll');
    scroll.scrollTop = scroll.scrollHeight;

    const input = body.querySelector('#chatInput');
    const send = () => {
      const text = input.value.trim();
      if (!text) return;
      messages.push({ role: 'user', text });
      messages.push({ role: 'bot', text: botReply(text) });
      paint();
      const again = document.getElementById('chatInput');
      if (again) again.focus();
    };
    body.querySelector('[data-send]').addEventListener('click', send);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
  }

  function render() {
    if (!messages.length) {
      messages = [{
        role: 'bot',
        text: 'Prrr... you found me. I keep an eye on your check-ins and journal ' +
              'from this sunbeam. Ask me about your mood, sleep, or energy.'
      }];
    }
    paint();
  }

  BloomModals.register('companion', render);
})();
