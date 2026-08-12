import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// 1. CONFIGURATION SUPABASE
const SUPABASE_URL = 'https://eyqqslojvhwbamkmbmee.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_48ld-B0dGveEDZD9NTXdLg_OyHzkrQa';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LOCAL_KEYS = {
  recent:   'iq_recent',
  admin:    'iq_admin_auth'
};

const STORAGE_BUCKET = 'products';

async function getPublicStorageUrl(path) {
  const { data, error } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  if (error) {
    console.error('Erreur getPublicUrl:', error);
    return null;
  }
  return data.publicUrl;
}

/* ============================================================
   L'objet DB : Pont complet avec Supabase
   ============================================================ */
export const DB = {
  // --- PRODUITS ---
  async getProducts() {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  },

  async getProduct(id) {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error) {
      console.error(`Erreur lors de la récupération du produit ${id}:`, error);
      return null;
    }
    return data;
  },

  async uploadProductImage(file) {
    const fileExt = file.name.split('.').pop().toLowerCase();
    const fileName = `product-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `products/${fileName}`;
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
    if (error) {
      console.error('Erreur upload image:', error);
      return null;
    }
    return await getPublicStorageUrl(data.path);
  },

  async addProduct(p) {
    const { data, error } = await supabase.from('products').insert([p]).select();
    if (error) { console.error(error); return false; }
    return data[0];
  },

  async updateProduct(id, patch) {
    const { data, error } = await supabase.from('products').update(patch).eq('id', id).select();
    if (error) { console.error(error); return false; }
    return true;
  },

  async deleteProduct(id) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { console.error(error); return false; }
    return true;
  },

  // --- FAVORIS & RÉCENTS (localStorage) ---
  pushRecent(id) {
    let list = this.getRecent().filter(x => x !== id);
    list.unshift(id);
    localStorage.setItem(LOCAL_KEYS.recent, JSON.stringify(list.slice(0, 8)));
  },
  getRecent() { 
    return JSON.parse(localStorage.getItem(LOCAL_KEYS.recent)) || []; 
  },

  // --- COMMANDES ---
  async logOrder(entry) {
    const { data, error } = await supabase.from('orders').insert([{ status: 'Nouvelle', ...entry }]).select();
    if (error) { console.error(error); return false; }
    return data[0];
  },

  async getOrders() {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); return []; }
    return data;
  },

  async deleteOrder(id) {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) { console.error(error); return false; }
    return true;
  },

  async updateOrderStatus(orderId, newStatus) {
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchErr || !order) {
      console.error("Erreur récupération commande :", fetchErr);
      return false;
    }

    const oldStatus = order.status;
    if (oldStatus === newStatus) return true;

    const { error: updateErr } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (updateErr) {
      console.error("Erreur mise à jour statut :", updateErr);
      return false;
    }

    // Déduction du stock lors de la confirmation
    if (newStatus === 'Confirmée' && !['Confirmée', 'Expédiée', 'Livrée'].includes(oldStatus)) {
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          const productId = item.productId || item.id;
          const qtyToDeduct = item.quantity || 1;

          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', productId)
            .single();

          if (product) {
            const newStock = Math.max(0, (product.stock || 0) - qtyToDeduct);
            await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', productId);
          }
        }
      }
    }

    // Réapprovisionnement lors de l'annulation
    if (newStatus === 'Annulée' && ['Confirmée', 'Expédiée'].includes(oldStatus)) {
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          const productId = item.productId || item.id;
          const qtyToAdd = item.quantity || 1;

          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', productId)
            .single();

          if (product) {
            const newStock = (product.stock || 0) + qtyToAdd;
            await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', productId);
          }
        }
      }
    }

    return true;
  },

  // --- LIVRAISON & WILAYAS DYNAMIQUES DEPUIS LA BD ---
  async getShippingRates() {
    const { data, error } = await supabase
      .from('shipping_rates')
      .select('*')
      .order('wilaya', { ascending: true });

    if (error) { 
      console.error('Erreur lors du chargement des tarifs :', error); 
      return {}; 
    }

    const ratesObj = {};
    if (data) {
      data.forEach(rate => {
        ratesObj[rate.wilaya] = rate;
      });
    }
    return ratesObj;
  },

  async getWilayasList() {
    const rates = await this.getShippingRates();
    return Object.keys(rates);
  },

  // --- COMMUNES ---
  async getCommunes(wilaya) {
    if (!wilaya) return [];

    const code = String(wilaya).split('-')[0].trim().padStart(2, '0');
    const { data, error } = await supabase
      .from('communes')
      .select('id, wilaya_code, wilaya, name, name_ar')
      .eq('wilaya_code', code)
      .order('name', { ascending: true });

    if (error) {
      console.error('Erreur lors du chargement des communes:', error);
      return [];
    }

    return Array.isArray(data) ? data : [];
  },

  async saveShippingRates(ratesArray) {
    const { error } = await supabase.from('shipping_rates').upsert(ratesArray, { onConflict: 'wilaya' });
    if (error) { console.error(error); return false; }
    return true;
  },

  // --- ADMIN ---
  isAdmin() { return sessionStorage.getItem(LOCAL_KEYS.admin) === 'true'; },
  setAdmin(v) { v ? sessionStorage.setItem(LOCAL_KEYS.admin, 'true') : sessionStorage.removeItem(LOCAL_KEYS.admin); }
};

/* ============================================================
   CONSTANTES ET UTILITAIRES EXPORTÉS
   ============================================================ */
export const CATEGORY_LABELS = {
  pro: 'iPad Pro', air: 'iPad Air', mini: 'iPad Mini', classic: 'iPad Classique', accessories: 'Accessoires'
};

export const WHATSAPP_NUMBER = '213551583284';

export function formatDZD(n) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' DA';
}

export function waLink(productName) {
  const msg = `Bonjour 👋\nJe suis intéressé(e) par :\n${productName}\nPouvez-vous me donner plus d'informations ?`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}