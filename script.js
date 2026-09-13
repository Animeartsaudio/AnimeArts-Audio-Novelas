// ===================================================================
// AnimeArts Audio Novelas — lógica de catálogo
// -------------------------------------------------------------------
// Los datos viven en novelas.json (no acá). Para agregar o editar una
// novela, abre ese archivo — no hace falta tocar este script.
//
// IMPORTANTE: como este script carga novelas.json con fetch(), el
// sitio necesita servirse por http/https, no abrirse con doble clic
// desde el explorador de archivos (file://) — ahí el navegador
// bloquea la carga por seguridad (CORS). Al subirlo a GitHub Pages
// esto no es un problema, ya que se sirve por https automáticamente.
// Si quieres probarlo en tu compu antes de subirlo, corre un
// servidor local simple desde la carpeta del sitio, por ejemplo:
//     python -m http.server 8000
// y abre http://localhost:8000 en el navegador.
// ===================================================================

const FANDOM_COLORS = {
  "Fate": ["#3b2f6b", "#8f6bff"],
  "DxD": ["#5b1f33", "#e2566b"],
  "Boku no Hero": ["#1f4a5b", "#4fd5e0"],
  "RWBY": ["#5b3a1f", "#f2a541"],
  "Re:Zero": ["#3a1f5b", "#a06bff"],
  "Danmachi": ["#1f5b3d", "#4fe084"],
  "Naruto": ["#5b3a1f", "#f2823f"],
  "Honkai Impact": ["#5b1f4a", "#e2569c"],
  "Bleach": ["#1f3b5b", "#4f9de0"],
  "Genshin Impact": ["#3d5b1f", "#a8e04f"],
  "Honkai Star Rail": ["#331f5b", "#8f6bff"],
  "Jujutsu Kaisen": ["#1f1f5b", "#6b6bff"],
  "Marvel": ["#5b1f1f", "#e25656"],
  "DC": ["#1f2f5b", "#5674e0"],
  "default": ["#241b3a", "#4fd5e0"],
};

const QUICK_FANDOMS = ["Fate", "Boku no Hero", "DxD", "RWBY", "Re:Zero", "Naruto", "Danmachi", "Honkai Impact", "Bleach", "Genshin Impact"];

const BATCH = 30;

let NOVELAS = [];
let state = {
  query: "",
  fandom: "Todos",
  matureOnly: false,
  sort: "orden",
  visible: 30,
};

async function cargarNovelas() {
  try {
    const res = await fetch('novelas.json');
    NOVELAS = await res.json();
  } catch (e) {
    document.getElementById('grid').innerHTML =
      '<p style="color:var(--ink-dim);grid-column:1/-1;">No se pudo cargar novelas.json. Si abriste este archivo con doble clic, ábrelo desde un servidor local o súbelo a un hosting (ver comentario al inicio de script.js).</p>';
    console.error(e);
    return;
  }
  computeStats();
  buildChips();
  render();
}

function computeStats() {
  document.getElementById('statTotal').textContent = NOVELAS.length;
  const fset = new Set();
  let chapters = 0;
  NOVELAS.forEach(n => { (n.fandoms || []).forEach(f => fset.add(f)); chapters += n.chapters || 0; });
  document.getElementById('statFandoms').textContent = fset.size;
  document.getElementById('statChapters').textContent = chapters.toLocaleString('es-CL');
}

function buildChips() {
  const row = document.getElementById('chipRow');
  const chips = [];
  chips.push(chipHTML('Todos', 'fandom', true));
  QUICK_FANDOMS.forEach(f => chips.push(chipHTML(f, 'fandom', false)));
  chips.push(chipHTML('Otros universos', 'fandom', false, 'Otros'));
  chips.push(`<div style="width:1px;background:var(--line);flex-shrink:0;margin:0 4px;"></div>`);
  chips.push(`<button class="chip mature-chip" data-role="mature" id="matureChip">+18</button>`);
  row.innerHTML = chips.join('');

  row.querySelectorAll('.chip[data-role="fandom"]').forEach(el => {
    el.addEventListener('click', () => {
      row.querySelectorAll('.chip[data-role="fandom"]').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
      state.fandom = el.dataset.value;
      state.visible = BATCH;
      render();
    });
  });
  document.getElementById('matureChip').addEventListener('click', (e) => {
    state.matureOnly = !state.matureOnly;
    e.target.classList.toggle('active', state.matureOnly);
    state.visible = BATCH;
    render();
  });
}

function chipHTML(label, role, active, value) {
  return `<button class="chip${active ? ' active' : ''}" data-role="${role}" data-value="${value || label}">${label}</button>`;
}

function primaryFandom(n) {
  return (n.fandoms || [])[0] || null;
}

function waveformBars(seed) {
  let bars = '';
  for (let i = 0; i < 16; i++) {
    const h = 20 + (Math.abs(Math.sin(seed * (i + 1) * 12.9898)) * 60);
    bars += `<span style="height:${h.toFixed(0)}%"></span>`;
  }
  return bars;
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function bandStyle(n) {
  const fandom = primaryFandom(n);
  const colors = FANDOM_COLORS[fandom] || FANDOM_COLORS.default;
  const seed = (hashStr(n.title) % 1000) / 1000;
  const angle = 120 + Math.round(seed * 120);
  return {
    style: `background:linear-gradient(${angle}deg, ${colors[0]}, ${colors[1]});`,
    seed,
    label: fandom ? ((n.fandoms || []).length > 1 ? `${n.fandoms[0]} × ${n.fandoms[1]}` : n.fandoms[0]) : 'Multiverso',
  };
}

function matchesFilters(n) {
  if (state.matureOnly && !n.mature) return false;
  if (state.fandom !== 'Todos') {
    const fandoms = n.fandoms || [];
    if (state.fandom === 'Otros') {
      if (fandoms.length > 0) return false;
    } else if (!fandoms.includes(state.fandom)) {
      return false;
    }
  }
  if (state.query) {
    const q = state.query.toLowerCase();
    const hay = (n.title + ' ' + (n.synopsis || '') + ' ' + (n.fandoms || []).join(' ')).toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function sortList(list) {
  const copy = list.slice();
  if (state.sort === 'az') copy.sort((a, b) => a.title.localeCompare(b.title, 'es'));
  if (state.sort === 'chapters') copy.sort((a, b) => (b.chapters || 0) - (a.chapters || 0));
  return copy;
}

function posterInnerHTML(n, band) {
  const hasCover = n.cover && n.cover.trim();
  if (hasCover) {
    return `<img src="${escapeHTML(n.cover)}" alt="" class="cover-img" loading="lazy">`;
  }
  return `<div class="waveform">${waveformBars(band.seed)}</div>`;
}

function cardHTML(n, idx) {
  const band = bandStyle(n);
  const hasCover = n.cover && n.cover.trim();
  return `
  <article class="card" data-idx="${idx}">
    <div class="poster" style="${hasCover ? '' : band.style}">
      ${n.mature ? '<span class="badge-mature">+18</span>' : ''}
      ${posterInnerHTML(n, band)}
      <span class="fandom-label">${escapeHTML(band.label)}</span>
      <span class="chapters-badge">${n.chapters || 0} cap.</span>
    </div>
    <h3 class="card-title">${escapeHTML(n.title)}</h3>
  </article>`;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function render() {
  const filtered = sortList(NOVELAS.filter(matchesFilters));
  const grid = document.getElementById('grid');
  const empty = document.getElementById('emptyState');
  const loadWrap = document.getElementById('loadMoreWrap');

  document.getElementById('resultCount').textContent = `${filtered.length} resultado${filtered.length === 1 ? '' : 's'}`;

  if (filtered.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    loadWrap.style.display = 'none';
    return;
  }
  empty.style.display = 'none';

  const slice = filtered.slice(0, state.visible);
  grid.innerHTML = slice.map(n => cardHTML(n, NOVELAS.indexOf(n))).join('');
  loadWrap.style.display = filtered.length > state.visible ? 'flex' : 'none';

  grid.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => openModal(NOVELAS[parseInt(card.dataset.idx, 10)]));
  });
}

function openModal(n) {
  const band = bandStyle(n);
  const hasBanner = n.banner && n.banner.trim();
  const hasCover = n.cover && n.cover.trim();
  const modalBand = document.getElementById('modalBand');

  let imgSrc = '';
  if (hasBanner) imgSrc = n.banner.trim();
  else if (hasCover) imgSrc = n.cover.trim();

  modalBand.setAttribute('style', imgSrc ? '' : band.style);
  modalBand.innerHTML =
    (imgSrc ? `<img src="${escapeHTML(imgSrc)}" alt="" class="cover-img">` : '') +
    `<div class="modal-close" id="modalClose">✕</div>`;
  document.getElementById('modalClose').addEventListener('click', closeModal);

  document.getElementById('modalTitle').textContent = n.title;
  document.getElementById('modalSynopsis').textContent = n.synopsis || 'Sinopsis pendiente de agregar.';
  document.getElementById('modalChapters').textContent = `${n.chapters || 0}`;

  const fandoms = n.fandoms && n.fandoms.length ? n.fandoms : ['Multiverso'];
  const tags = fandoms.map(f => `<span class="tag-pill">${escapeHTML(f)}</span>`);
  if (n.mature) tags.push(`<span class="tag-pill" style="color:var(--mature);border-color:var(--mature);">+18</span>`);
  document.getElementById('modalTags').innerHTML = tags.join('');

  const listen = document.getElementById('modalListen');
  listen.href = (n.link && n.link.trim()) ? n.link.trim() : 'https://www.patreon.com/c/AnimeFicsArts?vanity=user';

  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'modalOverlay') closeModal();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

let searchTimer;
document.getElementById('searchInput').addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.query = e.target.value.trim();
    state.visible = BATCH;
    render();
  }, 150);
});

document.getElementById('sort').addEventListener('change', (e) => {
  state.sort = e.target.value;
  render();
});

document.getElementById('loadMoreBtn').addEventListener('click', () => {
  state.visible += BATCH;
  render();
});

cargarNovelas();
