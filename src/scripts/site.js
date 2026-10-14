// Small behaviours the static design implies: the folded menu, the FAQ accordion,
// the enquiry forms and "Load more" on the blog.

// ── menu ──
const burger = document.querySelector('.burger');
const menu = document.getElementById('menu');
if (burger && menu) {
  const setOpen = (open) => {
    menu.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
  };
  burger.addEventListener('click', () => setOpen(menu.hidden));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { setOpen(false); burger.focus(); } });
}

// ── FAQ ──
document.querySelectorAll('.faq-q').forEach((q, i) => {
  const answer = q.parentElement.querySelector('.faq-a');
  const sign = q.querySelector('.faq-s');
  if (!answer) return;
  answer.id ||= `faq-a-${i}`;
  q.setAttribute('aria-controls', answer.id);
  q.addEventListener('click', () => {
    const open = answer.classList.toggle('faq-shut') === false;
    q.setAttribute('aria-expanded', String(open));
    if (sign) sign.textContent = open ? '–' : '+';
  });
});

// ── forms ──
// Enquiries post to Web3Forms and the result is shown in the note under the button.
document.querySelectorAll('form[data-form]').forEach((form) => {
  const note = form.querySelector('[data-form-note]');
  const say = (text, state) => { if (note) { note.textContent = text; note.dataset.state = state; } };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if ('busy' in form.dataset) return;
    form.dataset.busy = '';
    say('Sending\u2026', 'busy');
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.success === false) throw new Error(result.message || String(res.status));
      form.reset();
      say('Thanks. Kevin has your message and will be in touch.', 'ok');
    } catch {
      say('That did not send. Please call, or email us directly.', 'error');
    } finally {
      delete form.dataset.busy;
    }
  });
});

// ── blog archive: reveal the next batch of posts ──
const more = document.querySelector('[data-more]');
if (more) {
  more.addEventListener('click', () => {
    const hidden = Array.from(document.querySelectorAll('.ba-list > li[hidden]'));
    hidden.slice(0, Number(more.dataset.more) || 5).forEach((li) => { li.hidden = false; });
    if (hidden.length <= (Number(more.dataset.more) || 5)) more.parentElement.hidden = true;
  });
}
