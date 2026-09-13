// AnimeArts Audio Novelas — script.js
// Los datos viven en novelas.json. Para agregar novelas usa admin.html.
// NOTA: este script usa fetch(), por lo que necesita servirse por http/https.
// En GitHub Pages funciona automáticamente. Para probar en local:
//   python -m http.server 8000  ->  http://localhost:8000

const FANDOM_COLORS = {
  "Fate": ["#3b2f6b","#8f6bff"],
  "DxD": ["#5b1f33","#e2566b"],
  "Boku no Hero": ["#1f4a5b","#4fd5e0"],
  "RWBY": ["#5b3a1f","#f2a541"],
  "Re:Zero": ["#3a1f5b","#a06bff"],
  "Danmachi": ["#1f5b3d","#4fe084"],
  "Naruto": ["#5b3a1f","#f2823f"],
  "Honkai Impact": ["#5b1f4a","#e2569c"],
  "Bleach": ["#1f3b5b","#4f9de0"],
  "Genshin Impact": ["#3d5b1f","#a8e04f"],
  "Honkai Star Rail": ["#331f5b","#8f6bff"],
  "Jujutsu Kaisen": ["#1f1f5b","#6b6bff"],
  "Marvel": ["#5b1f1f","#e25656"],
  "DC": ["#1f2f5b","#5674e0"],
  "default": ["#241b3a","#b48ee8"],
};

const QUICK_FANDOMS = ["Fate","Boku no Hero","DxD","RWBY","Re:Zero","Naruto","Danmachi","Honkai Impact","Bleach","Genshin Impact"];
const BATCH = 30;
let NOVELAS = [];
let state = { query:"", fandom:"Todos", matureOnly:false, sort:"orden", visible:30 };

async function cargarNovelas() {
  try {
    const res = await fetch('novelas.json');
    NOVELAS = await res.json();
  } catch(e) {
    document.getElementById('grid').innerHTML =
      '<p style="color:var(--ink-dim);grid-column:1/-1;padding:40px 0">No se pudo cargar novelas.json. Abre el sitio desde un servidor (no con doble clic). Ver README.md.</p>';
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
  NOVELAS.forEach(n => { (n.fandoms||[]).forEach(f => fset.add(f)); chapters += n.chapters||0; });
  document.getElementById('statFandoms').textContent = fset.size;
  document.getElementById('statChapters').textContent = chapters.toLocaleString('es-CL');
}

function buildChips() {
  const row = document.getElementById('chipRow');
  const chips = [];
  chips.push(chipHTML('Todos','fandom',true));
  QUICK_FANDOMS.forEach(f => chips.push(chipHTML(f,'fandom',false)));
  chips.push(chipHTML('Otros universos','fandom',false,'Otros'));
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
  document.getElementById('matureChip').addEventListener('click', e => {
    state.matureOnly = !state.matureOnly;
    e.target.classList.toggle('active', state.matureOnly);
    state.visible = BATCH;
    render();
  });
}

function chipHTML(label, role, active, value) {
  return `<button class="chip${active?' active':''}" data-role="${role}" data-value="${value||label}">${label}</button>`;
}

function primaryFandom(n) { return (n.fandoms||[])[0]||null; }

function waveformBars(seed) {
  let bars = '';
  for(let i=0;i<16;i++){
    const h = 20+(Math.abs(Math.sin(seed*(i+1)*12.9898))*60);
    bars += `<span style="height:${h.toFixed(0)}%"></span>`;
  }
  return bars;
}

function hashStr(s) {
  let h=0;
  for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0;
  return h;
}

function bandStyle(n) {
  const fandom = primaryFandom(n);
  const colors = FANDOM_COLORS[fandom]||FANDOM_COLORS.default;
  const seed = (hashStr(n.title)%1000)/1000;
  const angle = 120+Math.round(seed*120);
  return {
    style:`background:linear-gradient(${angle}deg,${colors[0]},${colors[1]});`,
    seed,
    label: fandom ? ((n.fandoms||[]).length>1?`${n.fandoms[0]} × ${n.fandoms[1]}`:n.fandoms[0]) : 'Multiverso',
  };
}

function matchesFilters(n) {
  if(state.matureOnly && !n.mature) return false;
  if(state.fandom!=='Todos'){
    const f = n.fandoms||[];
    if(state.fandom==='Otros'){ if(f.length>0) return false; }
    else if(!f.includes(state.fandom)) return false;
  }
  if(state.query){
    const q = state.query.toLowerCase();
    const hay = (n.title+' '+(n.synopsis||'')+' '+(n.fandoms||[]).join(' ')).toLowerCase();
    if(!hay.includes(q)) return false;
  }
  return true;
}

function sortList(list) {
  const copy = list.slice();
  if(state.sort==='az') copy.sort((a,b)=>a.title.localeCompare(b.title,'es'));
  if(state.sort==='chapters') copy.sort((a,b)=>(b.chapters||0)-(a.chapters||0));
  return copy;
}

function escapeHTML(str) {
  const d=document.createElement('div'); d.textContent=str==null?'':String(str); return d.innerHTML;
}

function cardHTML(n, idx) {
  const band = bandStyle(n);
  const hasCover = n.cover&&n.cover.trim();
  return `
  <article class="card" data-idx="${idx}">
    <div class="poster" style="${hasCover?'':band.style}">
      ${n.mature?'<span class="badge-mature">+18</span>':''}
      ${hasCover?`<img src="${escapeHTML(n.cover)}" alt="" class="cover-img" loading="lazy">`:`<div class="waveform">${waveformBars(band.seed)}</div>`}
      <span class="fandom-label">${escapeHTML(band.label)}</span>
      <span class="chapters-badge">${n.chapters||0} cap.</span>
    </div>
    <h3 class="card-title">${escapeHTML(n.title)}</h3>
  </article>`;
}

function render() {
  const filtered = sortList(NOVELAS.filter(matchesFilters));
  const grid = document.getElementById('grid');
  const empty = document.getElementById('emptyState');
  const loadWrap = document.getElementById('loadMoreWrap');
  document.getElementById('resultCount').textContent = `${filtered.length} resultado${filtered.length===1?'':'s'}`;
  if(!filtered.length){ grid.innerHTML=''; empty.style.display='block'; loadWrap.style.display='none'; return; }
  empty.style.display='none';
  grid.innerHTML = filtered.slice(0,state.visible).map(n=>cardHTML(n,NOVELAS.indexOf(n))).join('');
  loadWrap.style.display = filtered.length>state.visible?'flex':'none';
  grid.querySelectorAll('.card').forEach(c=>{
    c.addEventListener('click',()=>openModal(NOVELAS[parseInt(c.dataset.idx,10)]));
  });
}

function openModal(n) {
  const band = bandStyle(n);
  const imgSrc = (n.banner&&n.banner.trim()) ? n.banner.trim() : (n.cover&&n.cover.trim() ? n.cover.trim() : '');
  const modalBand = document.getElementById('modalBand');
  modalBand.setAttribute('style', imgSrc?'':band.style);
  modalBand.innerHTML =
    (imgSrc?`<img src="${escapeHTML(imgSrc)}" alt="" class="cover-img">`:'') +
    `<div class="modal-close" id="modalClose">✕</div>`;
  document.getElementById('modalClose').addEventListener('click',closeModal);
  document.getElementById('modalTitle').textContent = n.title;
  document.getElementById('modalSynopsis').textContent = n.synopsis||'Sinopsis pendiente de agregar.';
  document.getElementById('modalChapters').textContent = `${n.chapters||0}`;
  const fandoms = n.fandoms&&n.fandoms.length?n.fandoms:['Multiverso'];
  const tags = fandoms.map(f=>`<span class="tag-pill">${escapeHTML(f)}</span>`);
  if(n.mature) tags.push(`<span class="tag-pill" style="color:var(--mature);border-color:var(--mature);">+18</span>`);
  document.getElementById('modalTags').innerHTML = tags.join('');
  const listen = document.getElementById('modalListen');
  listen.href = (n.link&&n.link.trim())?n.link.trim():'https://www.patreon.com/c/AnimeFicsArts?vanity=user';
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }

document.getElementById('modalOverlay').addEventListener('click',e=>{ if(e.target.id==='modalOverlay') closeModal(); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeModal(); });

let searchTimer;
document.getElementById('searchInput').addEventListener('input',e=>{
  clearTimeout(searchTimer);
  searchTimer = setTimeout(()=>{ state.query=e.target.value.trim(); state.visible=BATCH; render(); },150);
});
document.getElementById('sort').addEventListener('change',e=>{ state.sort=e.target.value; render(); });
document.getElementById('loadMoreBtn').addEventListener('click',()=>{ state.visible+=BATCH; render(); });

cargarNovelas();
