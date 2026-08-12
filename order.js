/* ============================================================
   iPad Queen — On-site ordering (Version Module / Supabase)
   ============================================================ */
import { DB, formatDZD, waLink } from './data.js';

let _orderProduct = null;
let _shippingRates = {}; // Cache pour les tarifs de livraison

document.addEventListener('DOMContentLoaded', async () => {
  // On télécharge les tarifs de livraison une seule fois au chargement
  _shippingRates = await DB.getShippingRates();

  const mount = document.getElementById('order-modal-include');
  if(!mount) return;

  mount.innerHTML = `
  <div class="modal-bg" id="order-modal">
    <div class="modal order-modal-box">
      <button type="button" class="order-modal-close" id="order-modal-close" aria-label="Fermer">✕</button>
      <div id="order-modal-product" class="order-modal-product"></div>
      <h3>Passer la commande</h3>
      <form id="order-form">
        <div class="order-form-grid">
          <div><label>Nom complet</label><input id="o-name" required placeholder="Votre nom"></div>
          <div><label>Téléphone</label><input id="o-phone" required placeholder="05XX XX XX XX" inputmode="tel"></div>
          <div><label>Wilaya</label><select id="o-wilaya" required></select></div>
          <div><label>Commune</label><select id="o-commune" required disabled><option value="">Sélectionnez d'abord une wilaya</option></select></div>
          <div><label>Livraison</label>
            <select id="o-delivery-mode" required>
              <option value="home">À domicile</option>
              <option value="stopdesk">Stop Desk / Point Relais</option>
            </select>
          </div>
          <div><label>Quantité</label><input id="o-qty" type="number" min="1" value="1" required></div>
        </div>
        <div style="margin-top:14px;"><label>Adresse de livraison</label><input id="o-address" required placeholder="Rue, numéro, bâtiment, quartier…"></div>
        <div style="margin-top:14px;"><label>Note (optionnel)</label><input id="o-note" placeholder="Précision sur votre commande"></div>
        <div class="order-total-box" id="order-total-box"></div>
        <button type="submit" class="btn btn-primary btn-block" style="margin-top:18px;" id="btn-submit-order">Confirmer la commande</button>
        <a href="#" target="_blank" rel="noopener" id="o-whatsapp-link" class="order-wa-alt">ou discuter sur WhatsApp à la place</a>
      </form>
      <div id="order-success" class="order-success" style="display:none;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>
        <h3>Commande envoyée 👑</h3>
        <p>Merci ! Nous vous contactons très vite au numéro fourni pour confirmer la livraison.</p>
        <button type="button" class="btn btn-ghost" id="order-success-close">Fermer</button>
      </div>
    </div>
  </div>`;

  const wilayaSelect = document.getElementById('o-wilaya');
  const communeSelect = document.getElementById('o-commune');

  const wilayas = await DB.getWilayasList();
  wilayaSelect.innerHTML = '<option value="" disabled selected>Choisissez votre wilaya</option>' +
    wilayas.map(w => `<option value="${w}">${w}</option>`).join('');

  async function loadCommunes() {
    const wilaya = wilayaSelect.value;
    communeSelect.disabled = true;
    communeSelect.innerHTML = '<option value="">Chargement des communes…</option>';

    if (!wilaya) {
      communeSelect.innerHTML = '<option value="">Sélectionnez d’abord une wilaya</option>';
      return;
    }

    const communes = await DB.getCommunes(wilaya);
    if (!communes.length) {
      communeSelect.innerHTML = '<option value="">Aucune commune disponible</option>';
      return;
    }

    communeSelect.innerHTML = '<option value="" disabled selected>Choisissez votre commune</option>' +
      communes.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    communeSelect.disabled = false;
  }

  const modeSelect = document.getElementById('o-delivery-mode');
  const qtyInput = document.getElementById('o-qty');
  const totalBox = document.getElementById('order-total-box');
  const submitBtn = document.getElementById('btn-submit-order');

  function currentShippingFee(){
    const r = _shippingRates[wilayaSelect.value];
    if(!r) return 0;
    return modeSelect.value === 'stopdesk' ? (r.rate_desk || 0) : (r.rate_home || 0);
  }

  function refreshTotal(){
    if(!_orderProduct) return;
    
    const maxStock = _orderProduct.stock || 1;
    let qty = parseInt(qtyInput.value, 10) || 1;
    
    // Limitation de la quantité au stock maximal disponible
    if (qty > maxStock) {
      qty = maxStock;
      qtyInput.value = maxStock;
    } else if (qty < 1) {
      qty = 1;
      qtyInput.value = 1;
    }

    const shippingFee = currentShippingFee();
    const subtotal = _orderProduct.price * qty;
    
    totalBox.innerHTML = `
      <div class="order-total-row"><span>Sous-total (${qty} × ${formatDZD(_orderProduct.price)})</span><b>${formatDZD(subtotal)}</b></div>
      <div class="order-total-row"><span>Livraison (${modeSelect.options[modeSelect.selectedIndex].text} — ${wilayaSelect.value || 'Wilaya'}${communeSelect.value ? ' / ' + communeSelect.value : ''})</span><b>${shippingFee ? formatDZD(shippingFee) : 'À confirmer'}</b></div>
      <div class="order-total-row order-total-final"><span>Total</span><b>${formatDZD(subtotal + shippingFee)}</b></div>`;
  }
  
  wilayaSelect.addEventListener('change', async () => {
    await loadCommunes();
    refreshTotal();
  });
  [modeSelect, qtyInput].forEach(el => el.addEventListener('change', refreshTotal));
  qtyInput.addEventListener('input', refreshTotal);

  const modal = document.getElementById('order-modal');
  const form = document.getElementById('order-form');
  const successBox = document.getElementById('order-success');

  function closeModal(){ modal.classList.remove('open'); }
  document.getElementById('order-modal-close').addEventListener('click', closeModal);
  document.getElementById('order-success-close').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if(!_orderProduct) return;
    
    if (!wilayaSelect.value || !communeSelect.value) {
      alert("Veuillez sélectionner votre wilaya et votre commune.");
      return;
    }

    submitBtn.textContent = "Vérification du stock...";
    submitBtn.disabled = true;

    // 1. Re-vérification en direct du stock disponible sur Supabase
    const liveProduct = await DB.getProduct(_orderProduct.id);
    const availableStock = liveProduct ? (liveProduct.stock || 0) : 0;
    
    const qty = Math.max(1, parseInt(document.getElementById('o-qty').value, 10) || 1);

    if (availableStock <= 0) {
      alert("Désolé, ce produit est tombé en rupture de stock entre temps.");
      submitBtn.textContent = "Confirmer la commande";
      submitBtn.disabled = false;
      closeModal();
      return;
    }

    if (qty > availableStock) {
      alert(`Désolé, il ne reste plus que ${availableStock} exemplaire(s) disponible(s).`);
      qtyInput.value = availableStock;
      refreshTotal();
      submitBtn.textContent = "Confirmer la commande";
      submitBtn.disabled = false;
      return;
    }

    submitBtn.textContent = "Envoi en cours...";

    const shippingFee = currentShippingFee();
    const subtotal = _orderProduct.price * qty;
    
    // 2. Enregistrement de la commande avec productId inclus
    const ok = await DB.logOrder({
      customer_name: document.getElementById('o-name').value.trim(),
      customer_phone: document.getElementById('o-phone').value.trim(),
      wilaya: document.getElementById('o-wilaya').value,
      commune: document.getElementById('o-commune').value,
      address: document.getElementById('o-address').value.trim(),
      items: [{
        productId: _orderProduct.id, // Requis pour décrémenter le stock lors de la confirmation
        productName: _orderProduct.name,
        quantity: qty,
        priceAtPurchase: _orderProduct.price
      }],
      subtotal: subtotal,
      shipping_fee: shippingFee,
      total: subtotal + shippingFee,
      notes: document.getElementById('o-note').value.trim()
    });

    submitBtn.textContent = "Confirmer la commande";
    submitBtn.disabled = false;
    
    if (ok) {
      form.style.display = 'none';
      document.getElementById('order-modal-product').style.display = 'none';
      successBox.style.display = 'block';
    } else {
      alert("Une erreur est survenue lors de l'enregistrement de la commande. Veuillez réessayer.");
    }
  });

  // Fonction globale attachée à "window" pour être appelable depuis n'importe quel module
  window.openOrderModal = async function(productId){
    // Récupération asynchrone du produit depuis Supabase
    const p = await DB.getProduct(productId);
    
    if(!p) {
      alert("Produit introuvable.");
      return;
    }

    // Restriction : Ne pas ouvrir la modale si le produit est en rupture de stock
    if ((p.stock || 0) <= 0) {
      alert("Ce produit est actuellement en rupture de stock.");
      return;
    }
    
    _orderProduct = p;
    form.reset();
    communeSelect.disabled = true;
    communeSelect.innerHTML = '<option value="">Sélectionnez d’abord une wilaya</option>';

    // Limitation du champ quantité au stock disponible
    const oQty = document.getElementById('o-qty');
    oQty.value = 1;
    oQty.min = 1;
    oQty.max = p.stock;

    form.style.display = 'block';
    document.getElementById('order-modal-product').style.display = 'flex';
    successBox.style.display = 'none';
    
    document.getElementById('order-modal-product').innerHTML = `
      <div class="order-modal-thumb">${(p.images && p.images[0]) || p.image ? `<img src="${(p.images && p.images[0]) || p.image}" alt="${p.name}">` : ''}</div>
      <div>
        <b>${p.name}</b>
        <span>${formatDZD(p.price)}</span>
        <small style="display:block;color:var(--ink-soft);font-size:11px;margin-top:2px;">Stock disponible : ${p.stock}</small>
      </div>`;
      
    document.getElementById('o-whatsapp-link').href = waLink(p.name);
    modal.classList.add('open');
    refreshTotal();
  };
});