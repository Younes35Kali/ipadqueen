/* ============================================================
   iPad Queen — Site interactions (Version Supabase / Module)
   ============================================================ */

// 1. IMPORTATION DE LA BASE DE DONNÉES
import { DB, CATEGORY_LABELS, formatDZD } from './data.js';

document.addEventListener('DOMContentLoaded', async () => {

  /* ---- loader ---- */
  const loader = document.getElementById('loader');
  if(loader){ window.addEventListener('load', () => setTimeout(()=>loader.classList.add('hidden'), 350)); }

  /* ---- nav scroll state + mobile toggle ---- */
  const navbar = document.querySelector('.navbar');
  const onScroll = () => { if(navbar) navbar.classList.toggle('scrolled', window.scrollY > 20); };
  onScroll(); window.addEventListener('scroll', onScroll, { passive:true });

  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if(toggle && links){
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }

  const searchToggle = document.getElementById('search-toggle-btn');
  if(searchToggle){
    searchToggle.addEventListener('click', () => {
      const input = document.getElementById('search-input');
      if(input){ input.focus(); input.scrollIntoView({behavior:'smooth', block:'center'}); }
      else { window.location.href = 'products.html'; }
    });
  }

  /* ---- scroll reveal ---- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold:.15 });
  document.querySelectorAll('.reveal, .reveal-scale').forEach(el => io.observe(el));

  /* ---- animated counters ---- */
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count, 10);
    const counterIo = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if(e.isIntersecting){
          let cur = 0; const step = Math.max(1, Math.ceil(target/60));
          const t = setInterval(() => { cur += step; if(cur >= target){ cur = target; clearInterval(t); } el.textContent = cur.toLocaleString('fr-FR') + (el.dataset.suffix||''); }, 22);
          counterIo.unobserve(el);
        }
      });
    }, { threshold:.4 });
    counterIo.observe(el);
  });

  /* ---- button ripple ---- */
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function(e){
      if(this.disabled) return;
      const r = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      r.className = 'ripple';
      r.style.width = r.style.height = size+'px';
      r.style.left = (e.clientX - rect.left - size/2)+'px';
      r.style.top = (e.clientY - rect.top - size/2)+'px';
      this.appendChild(r);
      setTimeout(()=>r.remove(), 650);
    });
  });

  /* ---- FAQ accordion ---- */
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.faq-item').forEach(i => { i.classList.remove('open'); i.querySelector('.faq-a').style.maxHeight = null; });
      if(!isOpen){ item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
    });
  });

  /* ---- category strip -> jump to products with filter ---- */
  document.querySelectorAll('[data-cat-link]').forEach(el => {
    el.addEventListener('click', () => { window.location.href = `products.html?cat=${el.dataset.catLink}`; });
  });

  // Chargement des données asynchrones
  renderFeatured();
  if (!document.getElementById('search-input')) {
    renderProductGrid();
  }
  renderProductDetail();
  wireProductPageFilters();
});

/* ---- toast ---- */
function toast(msg){
  let el = document.getElementById('toast');
  if(!el){ el = document.createElement('div'); el.id='toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(()=>el.classList.remove('show'), 2600);
}

/* ---- svg helpers ---- */
const ICONS = {
  heart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7.5-4.6-10-9.3C.4 8.1 2.3 4 6.2 4c2.1 0 3.7 1.2 4.8 3 1.1-1.8 2.7-3 4.8-3 3.9 0 5.8 4.1 4.2 7.7C19.5 16.4 12 21 12 21z"/></svg>',
  eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>'
};

/* ---- product card markup ---- */
function productCard(p){
  const isOutOfStock = (p.stock || 0) <= 0;

  const stockLabel = isOutOfStock 
    ? `<span class="stock-dot low"><span class="dot"></span>Rupture de stock</span>`
    : p.stock <= 2 
    ? `<span class="stock-dot low"><span class="dot"></span>Plus que ${p.stock} en stock</span>`
    : `<span class="stock-dot"><span class="dot"></span>En stock</span>`;

  const actionBtn = isOutOfStock
    ? `<button type="button" class="btn btn-disabled" disabled style="opacity:0.55;cursor:not-allowed;width:100%;">Rupture de stock</button>`
    : `<button type="button" class="btn btn-primary" data-order="${p.id}">Commander</button>`;

  return `
  <div class="product-card reveal-scale in" data-id="${p.id}" data-cat="${p.category}" data-price="${p.price}" data-name="${p.name.toLowerCase()}">
    <div class="media-wrap">
      <a href="product.html?id=${p.id}">
        <div class="product-media">
          <span class="price-tag">${formatDZD(p.price)}</span>
          ${p.badge ? `<span class="badge">★ ${p.badge}</span>` : ''}
          ${(p.images && p.images[0]) || p.image ? `<img src="${(p.images && p.images[0]) || p.image}" alt="${p.name}" class="product-photo">` : `<div class="device"></div>`}
        </div>
      </a>
    </div>
    <div class="product-body">
      <span class="cat-tag">${CATEGORY_LABELS[p.category] || p.category}</span>
      <h3><a href="product.html?id=${p.id}">${p.name}</a></h3>
      <p class="product-specs">${p.gen || ''} · ${p.storage || ''} · ${p.color || ''}</p>
      ${stockLabel}
      <div class="card-actions">
        ${actionBtn}
      </div>
    </div>
  </div>`;
}

function bindCardEvents(container){
  container.querySelectorAll('[data-order]').forEach(btn => {
    btn.addEventListener('click', () => { 
      if(typeof window.openOrderModal === 'function') window.openOrderModal(btn.dataset.order); 
    });
  });
}


/* ---- homepage featured products (ASYNC) ---- */
async function renderFeatured(){
  const el = document.getElementById('featured-grid');
  if(!el) return;
  const allProducts = await DB.getProducts();
  const products = allProducts.filter(p => p.featured);
  el.innerHTML = products.map(productCard).join('');
  bindCardEvents(el);
}

/* ---- full products page (ASYNC) ---- */
async function renderProductGrid(list){
  const el = document.getElementById('all-products-grid');
  if(!el) return;
  
  const products = list || await DB.getProducts();
  
  el.innerHTML = products.length ? products.map(productCard).join('') : `
    <div class="empty-state" style="grid-column:1/-1">
      ${ICONS.eye}
      <p>Aucun iPad ne correspond à votre recherche pour le moment.</p>
    </div>`;
  bindCardEvents(el);
  const countEl = document.getElementById('result-count');
  if(countEl) countEl.textContent = products.length;
}

/* ---- product filters (ASYNC) ---- */
async function wireProductPageFilters(){
  const grid = document.getElementById('all-products-grid');
  if(!grid) return;

  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');
  const catChips = document.querySelectorAll('[data-filter-cat]');
  const priceMax = document.getElementById('price-max');
  const priceOut = document.getElementById('price-max-out');

  let state = { q:'', cat:'all', sort:'newest', price:320000 };

  const params = new URLSearchParams(window.location.search);
  if(params.get('cat')) state.cat = params.get('cat');

  const allProducts = await DB.getProducts();

  function apply(){
    let list = [...allProducts];
    if(state.cat !== 'all') list = list.filter(p => p.category === state.cat);
    if(state.q) list = list.filter(p => p.name.toLowerCase().includes(state.q));
    list = list.filter(p => p.price <= state.price);
    
    if(state.sort === 'price-asc') list.sort((a,b)=>a.price-b.price);
    if(state.sort === 'price-desc') list.sort((a,b)=>b.price-a.price);
    if(state.sort === 'popularity') list.sort((a,b)=>(b.featured===true)-(a.featured===true));
    
    renderProductGrid(list);
  }

  catChips.forEach(chip => {
    if(chip.dataset.filterCat === state.cat) chip.classList.add('active');
    chip.addEventListener('click', () => {
      catChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.cat = chip.dataset.filterCat;
      apply();
    });
  });

  if(searchInput) searchInput.addEventListener('input', () => { state.q = searchInput.value.trim().toLowerCase(); apply(); });
  if(sortSelect) sortSelect.addEventListener('change', () => { state.sort = sortSelect.value; apply(); });
  if(priceMax){
    priceMax.addEventListener('input', () => { state.price = parseInt(priceMax.value,10); if(priceOut) priceOut.textContent = formatDZD(state.price); apply(); });
  }

  apply();
  renderRecentlyViewed();
}

/* ---- recent products (ASYNC) ---- */
async function renderRecentlyViewed(){
  const el = document.getElementById('recent-grid');
  if(!el) return;
  const ids = DB.getRecent();
  const wrap = document.getElementById('recent-section');
  
  if(!ids.length){ if(wrap) wrap.style.display='none'; return; }
  
  const products = [];
  for (const id of ids) {
    const p = await DB.getProduct(id);
    if (p) products.push(p);
  }

  if(!products.length){ if(wrap) wrap.style.display='none'; return; }
  
  el.innerHTML = products.map(productCard).join('');
  bindCardEvents(el);
}

/* ---- product detail page (ASYNC) ---- */
async function renderProductDetail(){
  const el = document.getElementById('product-detail');
  if(!el) return;
  
  const id = new URLSearchParams(window.location.search).get('id');
  const p = await DB.getProduct(id);
  
  if(!p){
    el.innerHTML = `<div class="empty-state">${ICONS.eye}<p>Ce produit n'est plus disponible.</p><a class="btn btn-primary" href="products.html" style="margin-top:16px">Voir tous les iPads</a></div>`;
    return;
  }
  
  DB.pushRecent(p.id);
  document.title = `${p.name} — iPad Queen`;
  const gallery = (p.images && p.images.length ? p.images : (p.image ? [p.image] : []));
  const isOutOfStock = (p.stock || 0) <= 0;

  const stockDot = isOutOfStock
    ? '<span class="stock-dot low"><span class="dot"></span>Rupture de stock — contactez-nous pour une notification</span>'
    : p.stock <= 2
    ? `<span class="stock-dot low"><span class="dot"></span>Plus que ${p.stock} en stock</span>`
    : '<span class="stock-dot"><span class="dot"></span>En stock — expédition rapide</span>';

  const orderBtnMarkup = isOutOfStock
    ? '<button type="button" class="btn btn-disabled" disabled style="opacity:0.55;cursor:not-allowed;">Rupture de stock</button>'
    : '<button type="button" class="btn btn-primary" id="pd-order-btn">Commander</button>';

  el.innerHTML = `
    <div class="breadcrumb reveal in"><a href="index.html">Accueil</a> / <a href="products.html">Boutique</a> / ${p.name}</div>
    <div class="pd-grid reveal in">
      <div class="pd-gallery">
        <div class="pd-main product-media" id="pd-main-media" style="border-radius:24px;">
          <span class="price-tag">${formatDZD(p.price)}</span>
          ${p.badge ? `<span class="badge">★ ${p.badge}</span>` : ''}
          ${gallery.length ? `<img src="${gallery[0]}" alt="${p.name}" class="product-photo" id="pd-main-img">` : `<div class="device" style="width:66%"></div>`}
        </div>
        ${gallery.length > 1 ? `<div class="pd-thumbs">${gallery.map((src,i) => `<button type="button" class="pd-thumb ${i===0?'active':''}" data-thumb="${i}"><img src="${src}" alt="${p.name} ${i+1}"></button>`).join('')}</div>` : ''}
      </div>
      <div class="pd-info">
        <span class="cat-tag">${CATEGORY_LABELS[p.category] || p.category}</span>
        <h1>${p.name}</h1>
        <p class="product-specs" style="font-size:14px;margin:8px 0 16px;">${p.gen || ''} · ${p.storage || ''} · ${p.color || ''} · ${p.condition || ''}</p>
        <div class="price-row" style="margin-bottom:10px;"><span class="price" style="font-size:30px;">${formatDZD(p.price)}</span>${p.oldPrice?`<span class="price-old">${formatDZD(p.oldPrice)}</span>`:''}</div>
        ${stockDot}
        <div class="pd-actions">
          ${orderBtnMarkup}
          <button class="btn btn-ghost" id="pd-share-btn">Partager</button>
        </div>

        <div class="pd-specs-table">
          <h4>Spécifications</h4>
          <ul>
            <li><span>Puce</span><b>${p.chip || 'Non spécifié'}</b></li>
            <li><span>État de la batterie</span><b>${p.battery || 'Non spécifié'}</b></li>
            <li><span>Appareil photo</span><b>${p.camera || 'Non spécifié'}</b></li>
            <li><span>Écran</span><b>${p.display || 'Non spécifié'}</b></li>
            <li><span>Accessoires inclus</span><b>${p.accessories || 'Aucun'}</b></li>
            <li><span>Garantie</span><b>3 mois iPad Queen</b></li>
            <li><span>Livraison</span><b>Toutes les wilayas — 24/48h</b></li>
          </ul>
        </div>
      </div>
    </div>`;

  el.querySelectorAll('[data-thumb]').forEach(btn => {
    btn.addEventListener('click', () => {
      const img = document.getElementById('pd-main-img');
      if(img) img.src = gallery[parseInt(btn.dataset.thumb,10)];
      el.querySelectorAll('.pd-thumb').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  const pdOrderBtn = document.getElementById('pd-order-btn');
  if(pdOrderBtn) {
    pdOrderBtn.addEventListener('click', () => { 
      if(typeof window.openOrderModal === 'function') window.openOrderModal(p.id); 
    });
  }
  
  
  document.getElementById('pd-share-btn').addEventListener('click', async () => {
    const url = window.location.href;
    if(navigator.share){ navigator.share({ title:p.name, url }); }
    else { await navigator.clipboard.writeText(url); toast('Lien copié !'); }
  });

  await renderRelated(p);
}

/* ---- related products (ASYNC) ---- */
async function renderRelated(p){
  const el = document.getElementById('related-grid');
  if(!el) return;
  const allProducts = await DB.getProducts();
  const list = allProducts.filter(x => x.category === p.category && x.id !== p.id).slice(0,4);
  el.innerHTML = list.map(productCard).join('');
  bindCardEvents(el);
}