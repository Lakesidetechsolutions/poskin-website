// Poskin Feed Store — small helpers

// Mobile menu
(function () {
  var btn = document.querySelector('.menu-btn');
  var nav = document.querySelector('nav.main');
  if (!btn || !nav) return;
  btn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
  });
})();

// Labeled placeholder for any photo file that's missing
// If a photo is missing, try its backup (data-fallback) first, then show a labeled placeholder
document.querySelectorAll('.photo img').forEach(function (img) {
  function fail() {
    var fb = img.getAttribute('data-fallback');
    if (fb && img.getAttribute('src') !== fb) { img.setAttribute('src', fb); return; }
    img.parentElement.classList.add('empty');
  }
  img.addEventListener('error', fail);
  if (img.complete && img.naturalWidth === 0) fail();
});

// Footer year
document.querySelectorAll('[data-year]').forEach(function (el) {
  el.textContent = new Date().getFullYear();
});

// Open / closed status + highlight today's hours (store time = Central)
(function () {
  var day, mins;
  try {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false
    }).formatToParts(new Date());
    var get = function (t) { return (parts.find(function (p) { return p.type === t; }) || {}).value; };
    day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    mins = (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10);
  } catch (e) { return; }

  var hours = { 1: [480, 1020], 2: [480, 1020], 3: [480, 1020], 4: [480, 1020], 5: [480, 1020], 6: [540, 720] };
  var today = hours[day];
  var open = today && mins >= today[0] && mins < today[1];
  var fmt = function (m) { var h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return h + (mm ? ':' + String(mm).padStart(2, '0') : '') + ' ' + ap; };
  var text = open ? 'Open now · until ' + fmt(today[1]) : (today && mins < today[0] ? 'Closed · opens ' + fmt(today[0]) + ' today' : 'Closed now');

  document.querySelectorAll('[data-status]').forEach(function (el) {
    el.textContent = text;
    el.classList.toggle('open', !!open);
  });

  var key = day === 0 ? 'sun' : day === 6 ? 'sat' : 'week';
  document.querySelectorAll('.hours tr[data-day="' + key + '"]').forEach(function (tr) { tr.classList.add('today'); });
})();

// Products page: highlight the category chip for the section in view
(function () {
  var bar = document.querySelector('.cat-bar');
  if (!bar || !('IntersectionObserver' in window)) return;
  var links = {};
  bar.querySelectorAll('a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var a = links[en.target.id];
      if (!a) return;
      bar.querySelectorAll('a.active').forEach(function (x) { x.classList.remove('active'); });
      a.classList.add('active');
      var w = bar.querySelector('.wrap');
      var l = a.offsetLeft - w.offsetLeft, r = l + a.offsetWidth;
      if (l < w.scrollLeft || r > w.scrollLeft + w.clientWidth) w.scrollTo({ left: Math.max(0, l - 20), behavior: 'smooth' });
    });
  }, { rootMargin: '-160px 0px -60% 0px' });
  document.querySelectorAll('.product[id]').forEach(function (s) { io.observe(s); });
})();

// Back-to-top button
(function () {
  var b = document.querySelector('.to-top');
  if (!b) return;
  var on = function () { b.classList.toggle('show', window.scrollY > 900); };
  window.addEventListener('scroll', on, { passive: true }); on();
  b.addEventListener('click', function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
})();

// Always open a page at the top (unless the link points to a section, like #cattle).
// Also fixes previews that show the site inside a frame and keep the old scroll spot.
(function () {
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  function toTop() {
    if (location.hash && location.hash.length > 1) {
      var t = document.getElementById(location.hash.slice(1));
      if (t) { t.scrollIntoView({ block: 'start', behavior: 'instant' }); return; }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    var first = document.querySelector('.topbar') || document.body;
    try { first.scrollIntoView({ block: 'start', behavior: 'instant' }); } catch (e) {}
  }
  toTop();
  window.addEventListener('load', function () { setTimeout(toTop, 0); });
  window.addEventListener('pageshow', function (e) { if (e.persisted) toTop(); });
})();

// Products dropdown: tap/click toggles (needed for phones)
document.querySelectorAll('.nav-drop').forEach(function (d) {
  var b = d.querySelector('.drop-btn');
  b.addEventListener('click', function (e) {
    e.preventDefault(); e.stopPropagation();
    var open = d.classList.toggle('open');
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('click', function (e) { if (!d.contains(e.target)) { d.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); } });
});

// Product search (products page)
(function () {
  var input = document.getElementById('psearch'), box = document.getElementById('psearch-results');
  if (!input) return;
  var pages = { cattle:'cattle.html', poultry:'poultry.html', horses:'horses.html', 'goats-sheep':'goats-sheep.html', pigs:'pigs.html', rabbits:'rabbits.html', 'dogs-cats':'dogs-cats.html', birds:'wild-birds.html', deer:'deer.html' };
  var items = [];
  document.querySelectorAll('.product[id]').forEach(function (art) {
    var cat = art.querySelector('h3').textContent, id = art.id;
    art.querySelectorAll('.lists li').forEach(function (li) {
      items.push({ t: li.textContent.trim(), cat: cat, id: id });
    });
    items.push({ t: cat, cat: 'Category', id: id });
  });
  function esc(s) { return s.replace(/[&<>]/g, function (c) { return { '&':'&amp;','<':'&lt;','>':'&gt;' }[c]; }); }
  input.addEventListener('input', function () {
    var q = input.value.trim().toLowerCase();
    if (q.length < 2) { box.hidden = true; box.innerHTML = ''; return; }
    var words = q.split(/\s+/);
    var hits = items.filter(function (it) { var s = (it.t + ' ' + it.cat).toLowerCase(); return words.every(function (w) { return s.indexOf(w) > -1; }); }).slice(0, 12);
    box.hidden = false;
    if (!hits.length) { box.innerHTML = '<div class="none">No match. Give us a call at 715-357-3350 and we can probably order it.</div>'; return; }
    box.innerHTML = hits.map(function (h) {
      var label = esc(h.t);
      words.forEach(function (w) { if (w) label = label.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); });
      var href = pages[h.id] || ('#' + h.id);
      return '<a href="' + href + '" data-id="' + h.id + '"><span>' + label + '</span><small>' + esc(h.cat) + '</small></a>';
    }).join('');
  });
  box.addEventListener('click', function (e) {
    var a = e.target.closest('a'); if (!a || a.getAttribute('href').charAt(0) !== '#') return;
    var d = document.querySelector('#' + a.dataset.id + ' details'); if (d) d.open = true;
  });
})();

// Hide time-limited banners after their end date (Central time)
(function () {
  try {
    var parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    document.querySelectorAll('[data-until]').forEach(function (el) {
      if (parts > el.getAttribute('data-until')) el.style.display = 'none';
    });
  } catch (e) {}
})();
