/* ============================================================
   iPad Queen — Admin dashboard (Version Supabase & Auth)
   ============================================================ */
import { DB, CATEGORY_LABELS, formatDZD, supabase } from './data.js';

document.addEventListener('DOMContentLoaded', async () => {
  const loginView = document.getElementById('login-view');
  const dashView = document.getElementById('dashboard-view');

  async function showDashboard(){
    loginView.style.display = 'none';
    dashView.style.display = 'grid';
    await renderAll();
  }

  // Vérifie si l'utilisateur est déjà connecté via Supabase Auth
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    showDashboard();
  }

  // Gestion du formulaire de connexion par Email / Mot de passe
  document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-pass').value;

    if (!email || !password) {
      toastAdmin('Veuillez remplir tous les champs');
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      toastAdmin('Identifiants incorrects : ' + error.message);
    } else {
      showDashboard();
    }
  });

  document.getElementById('admin-pass').addEventListener('keydown', (e) => { 
    if(e.key === 'Enter') document.getElementById('login-btn').click(); 
  });

  document.getElementById('logout-btn').addEventListener('click', async (e) => { 
    e.preventDefault(); 
    await supabase.auth.signOut();
    DB.setAdmin(false); 
    location.reload(); 
  });

  document.querySelectorAll('.admin-side nav a[data-tab]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.admin-side nav a[data-tab]').forEach(x => x.classList.remove('active'));
      a.classList.add('active');
      const tab = a.dataset.tab;
      document.querySelectorAll('.admin-card').forEach(c => c.style.display = 'none');
      if(tab === 'dashboard'){ document.querySelectorAll('.admin-card').forEach(c => c.style.display = 'block'); }
      else { const panel = document.querySelector(`[data-panel="${tab}"]`); if(panel) panel.style.display = 'block'; }
    });
  });

  const MAX_IMAGES = 7;
  let currentImages = [];
  const imgFileInput = document.getElementById('f-image-file');
  const imgGrid = document.getElementById('f-images-grid');
  const imgCount = document.getElementById('f-image-count');

  function renderImagesGrid(){
    imgCount.textContent = `${currentImages.length} / ${MAX_IMAGES} photos`;
    imgGrid.innerHTML = currentImages.map((src, i) => `
      <div class="image-editor-thumb">
        <img src="${src}" alt="Photo ${i+1}">
        ${i === 0 ? '<span class="cover-tag">Photo principale</span>' : ''}
        <button type="button" class="remove-thumb" data-remove-img="${i}" aria-label="Retirer">✕</button>
      </div>`).join('');
    imgGrid.querySelectorAll('[data-remove-img]').forEach(btn => {
      btn.addEventListener('click', () => { currentImages.splice(parseInt(btn.dataset.removeImg,10), 1); renderImagesGrid(); });
    });
  }

  imgFileInput.addEventListener('change', async () => {
    const files = Array.from(imgFileInput.files || []);
    let skippedSize = 0, skippedMax = 0, failed = 0;
    for(const file of files){
      if(currentImages.length >= MAX_IMAGES){ skippedMax++; continue; }
      if(file.size > 8 * 1024 * 1024){ skippedSize++; continue; }
      try{
        const url = await DB.uploadProductImage(file);
        if(url){
          currentImages.push(url);
          renderImagesGrid();
        } else {
          failed++;
        }
      }catch(e){
        console.error('Erreur upload image:', e);
        failed++;
      }
    }
    if(skippedMax) toastAdmin(`Maximum ${MAX_IMAGES} photos par produit`);
    else if(skippedSize) toastAdmin('Une image dépassait 8 Mo et a été ignorée');
    else if(failed) toastAdmin("Une image n'a pas pu être téléversée");
    imgFileInput.value = '';
  });

  const imgUrlInput = document.getElementById('f-image-url');
  document.getElementById('f-image-url-add').addEventListener('click', () => {
    const url = imgUrlInput.value.trim();
    if(!url) return;
    if(currentImages.length >= MAX_IMAGES){ toastAdmin(`Maximum ${MAX_IMAGES} photos par produit`); return; }
    currentImages.push(url);
    imgUrlInput.value = '';
    renderImagesGrid();
  });

  // ENREGISTREMENT DES TARIFS DE LIVRAISON (Lecture dynamique du DOM)
  document.getElementById('save-shipping-btn').addEventListener('click', async () => {
    const ratesArray = [];
    const rows = document.querySelectorAll('#admin-shipping-table tr');

    rows.forEach(row => {
      const stopInput = row.querySelector('[data-ship-stopdesk]');
      const homeInput = row.querySelector('[data-ship-home]');
      if (stopInput && homeInput) {
        const w = stopInput.dataset.shipStopdesk;
        ratesArray.push({
          wilaya: w,
          rate_desk: parseInt(stopInput.value, 10) || 0,
          rate_home: parseInt(homeInput.value, 10) || 0
        });
      }
    });

    const ok = await DB.saveShippingRates(ratesArray);
    toastAdmin(ok ? 'Tarifs de livraison enregistrés' : "⚠️ Échec de l'enregistrement");
    if (ok) await renderAll();
  });

  const modal = document.getElementById('product-modal');
  document.getElementById('add-product-btn').addEventListener('click', () => openModal());
  document.getElementById('cancel-modal').addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', (e) => { if(e.target === modal) modal.classList.remove('open'); });

  // SOUMISSION FORMULAIRE PRODUIT (AJOUT / MODIFICATION)
  document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('f-id').value;
    const data = {
      images: currentImages.slice(0, MAX_IMAGES),
      image: currentImages[0] || null,
      name: document.getElementById('f-name').value.trim(),
      category: document.getElementById('f-category').value,
      gen: document.getElementById('f-gen').value.trim() || '—',
      storage: document.getElementById('f-storage').value.trim() || '—',
      color: document.getElementById('f-color').value.trim() || '—',
      condition: document.getElementById('f-condition').value.trim() || 'Neuf',
      price: parseInt(document.getElementById('f-price').value, 10) || 0,
      old_price: document.getElementById('f-oldprice').value ? parseInt(document.getElementById('f-oldprice').value,10) : null,
      stock: parseInt(document.getElementById('f-stock').value, 10) || 0,
      chip: document.getElementById('f-chip').value.trim() || '—',
      battery: document.getElementById('f-battery').value.trim() || '—',
      display: document.getElementById('f-display').value.trim() || '—',
      camera: document.getElementById('f-camera').value.trim() || '—',
      accessories: document.getElementById('f-accessories').value.trim() || '—',
      badge: document.getElementById('f-badge').value.trim() || null,
      featured: document.getElementById('f-featured').checked
    };

    let success = false;
    if(id){ 
      success = await DB.updateProduct(id, data); 
    } else { 
      success = await DB.addProduct(data); 
    }

    if(success){
      toastAdmin(id ? 'Produit mis à jour' : 'Produit ajouté au catalogue');
      modal.classList.remove('open');
      await renderAll();
    } else {
      toastAdmin('⚠️ Erreur lors de l’enregistrement dans la base de données');
    }
  });

  async function openModal(product){
    document.getElementById('modal-title').textContent = product ? 'Modifier le produit' : 'Ajouter un produit';
    document.getElementById('f-id').value = product ? product.id : '';
    imgFileInput.value = '';
    currentImages = product && product.images && product.images.length ? [...product.images]
      : (product && product.image ? [product.image] : []);
    renderImagesGrid();
    document.getElementById('f-name').value = product ? product.name : '';
    document.getElementById('f-category').value = product ? product.category : 'pro';
    document.getElementById('f-gen').value = product ? product.gen : '';
    document.getElementById('f-storage').value = product ? product.storage : '';
    document.getElementById('f-color').value = product ? product.color : '';
    document.getElementById('f-condition').value = product ? product.condition : '';
    document.getElementById('f-price').value = product ? product.price : '';
    document.getElementById('f-oldprice').value = product && product.old_price ? product.old_price : '';
    document.getElementById('f-stock').value = product ? product.stock : '';
    document.getElementById('f-chip').value = product ? product.chip : '';
    document.getElementById('f-battery').value = product ? product.battery : '';
    document.getElementById('f-display').value = product ? product.display : '';
    document.getElementById('f-camera').value = product ? product.camera : '';
    document.getElementById('f-accessories').value = product ? product.accessories : '';
    document.getElementById('f-badge').value = product && product.badge ? product.badge : '';
    document.getElementById('f-featured').checked = product ? !!product.featured : false;
    modal.classList.add('open');
  }
  window._openProductModal = openModal;

  async function renderAll(){
    const products = await DB.getProducts();
    const orders = await DB.getOrders();
    const ratesData = await DB.getShippingRates();

    document.getElementById('kpi-total').textContent = products.length;
    document.getElementById('kpi-stock').textContent = products.filter(p => p.stock > 0).length;
    document.getElementById('kpi-featured').textContent = products.filter(p => p.featured).length;
    document.getElementById('kpi-orders').textContent = orders.length;

    // Rendu table produits
    document.getElementById('admin-products-table').innerHTML = products.map(p => `
      <tr>
        <td>${(p.images && p.images[0]) || p.image ? `<img src="${(p.images && p.images[0]) || p.image}" alt="" style="width:44px;height:44px;border-radius:10px;object-fit:cover;">` : `<div style="width:44px;height:44px;border-radius:10px;background:var(--blush);"></div>`}</td>
        <td><b>${p.name}</b><br><span style="color:var(--ink-soft);font-size:12px;">${p.storage} · ${p.color}</span></td>
        <td><span class="tag-pill">${CATEGORY_LABELS[p.category] || p.category}</span></td>
        <td>${formatDZD(p.price)}</td>
        <td>${p.stock}</td>
        <td>${p.stock === 0 ? '<span style="color:#c94b4b;font-weight:600;">Rupture</span>' : p.featured ? '<span style="color:#1f9d55;font-weight:600;">Vedette</span>' : 'Actif'}</td>
        <td>
          <div class="row-actions">
            <button class="icon-btn" data-edit="${p.id}" aria-label="Modifier"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></button>
            <button class="icon-btn danger" data-del="${p.id}" aria-label="Supprimer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg></button>
          </div>
        </td>
      </tr>`).join('') || `<tr><td colspan="7" style="text-align:center;color:var(--ink-soft);padding:26px;">Aucun produit pour le moment.</td></tr>`;

    // Rendu table commandes
    const ORDER_STATUSES = ['Nouvelle','Confirmée','Expédiée','Livrée','Annulée'];
    document.getElementById('admin-orders-table').innerHTML = orders.map(o => `
      <tr>
        <td><b>${o.customer_name || '—'}</b><br><span style="color:var(--ink-soft);font-size:12px;">${o.customer_phone || ''}${o.address ? ' · ' + o.address : ''}</span>${o.notes ? `<br><span style="color:var(--ink-soft);font-size:11.5px;">📝 ${o.notes}</span>` : ''}</td>
        <td>${o.items ? o.items.map(i => `${i.productName} (×${i.quantity})`).join(', ') : '—'}</td>
        <td><b>${o.wilaya || '—'}</b>${o.commune ? `<br><span style="color:var(--ink-soft);font-size:11.5px;">${o.commune}</span>` : ''}</td>
        <td>${formatDZD(o.total || 0)}${o.shipping_fee ? `<br><span style="color:var(--ink-soft);font-size:11px;">dont ${formatDZD(o.shipping_fee)} livraison</span>` : ''}</td>
        <td>
          <select class="select-pill" style="padding:6px 10px;font-size:12px;" data-order-status="${o.id}">
            ${ORDER_STATUSES.map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>
        <td>${new Date(o.created_at).toLocaleString('fr-FR')}</td>
        <td><button class="icon-btn danger" data-order-del="${o.id}" aria-label="Supprimer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button></td>
      </tr>`).join('') || `<tr><td colspan="7" style="text-align:center;color:var(--ink-soft);padding:26px;">Aucune commande pour le moment.</td></tr>`;

    // Rendu table tarifs livraison depuis Supabase
    const wilayasList = Object.keys(ratesData);
    document.getElementById('admin-shipping-table').innerHTML = wilayasList.map(w => {
      const r = ratesData[w] || { rate_desk: 0, rate_home: 0 };
      return `
        <tr>
          <td><b>${w}</b></td>
          <td><input type="number" min="0" step="50" data-ship-stopdesk="${w}" value="${r.rate_desk}" style="width:110px;padding:8px 10px;border-radius:8px;border:1px solid rgba(176,107,90,.25);"></td>
          <td><input type="number" min="0" step="50" data-ship-home="${w}" value="${r.rate_home}" style="width:110px;padding:8px 10px;border-radius:8px;border:1px solid rgba(176,107,90,.25);"></td>
        </tr>`;
    }).join('');

    // Écouteurs d'événements
    document.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', async () => {
      const p = await DB.getProduct(b.dataset.edit);
      openModal(p);
    }));
    
    document.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => { 
      if(confirm('Supprimer ce produit ?')){ 
        await DB.deleteProduct(b.dataset.del); 
        await renderAll(); 
        toastAdmin('Produit supprimé'); 
      } 
    }));

    document.querySelectorAll('[data-order-del]').forEach(b => b.addEventListener('click', async () => { 
      if(confirm('Supprimer cette commande ?')){
        await DB.deleteOrder(b.dataset.orderDel); 
        await renderAll(); 
        toastAdmin('Commande supprimée');
      }
    }));

    document.querySelectorAll('[data-order-status]').forEach(sel => sel.addEventListener('change', async () => { 
      await DB.updateOrderStatus(sel.dataset.orderStatus, sel.value); 
      await renderAll();
      toastAdmin('Statut et stock mis à jour'); 
    }));
  }
});

function toastAdmin(msg){
  let el = document.getElementById('toast');
  if(!el){ el = document.createElement('div'); el.id='toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(()=>el.classList.remove('show'), 2600);
}