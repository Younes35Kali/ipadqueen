/* Shared footer — injected into any element with id="footer-include" */
document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('footer-include');
  if(!el) return;
  el.innerHTML = `
  <div class="container">
    <div class="foot-grid">
      <div>
        <div class="foot-brand"><img src="assets/logo.jpg" alt="Logo iPad Queen"><b>iPad Queen</b></div>
        <p style="font-size:14px;max-width:280px;">Boutique premium d'iPads et d'accessoires Apple 100% originaux, vérifiés et garantis, livrés partout en Algérie.</p>
        <div class="foot-social">
          <a href="https://www.instagram.com/ipad.queen.off/" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/></svg></a>
          <a href="https://wa.me/213551583284" target="_blank" rel="noopener" aria-label="WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.79.47 3.47 1.29 4.94L2 22l5.29-1.39a9.9 9.9 0 004.75 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2z"/></svg></a>
        </div>
      </div>
      <div>
        <h4>Boutique</h4>
        <ul>
          <li><a href="products.html?cat=pro">iPad Pro</a></li>
          <li><a href="products.html?cat=air">iPad Air</a></li>
          <li><a href="products.html?cat=mini">iPad Mini</a></li>
          <li><a href="products.html?cat=classic">iPad Classique</a></li>
          <li><a href="products.html?cat=accessories">Accessoires</a></li>
        </ul>
      </div>
      <div>
        <h4>Informations</h4>
        <ul>
          <li><a href="index.html#faq">Livraison &amp; garantie</a></li>
          <li><a href="index.html#faq">FAQ</a></li>
          <li><a href="index.html#avis">Avis clients</a></li>
          <li><a href="index.html#contact">Contact</a></li>
        </ul>
      </div>
      <div>
        <h4>Contact</h4>
        <ul>
          <li>0551 58 32 84</li>
          <li>@ipad.queen.off</li>
          <li>Livraison — 58 wilayas</li>
          <li>Sam – Jeu, 10h – 20h</li>
        </ul>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© <span id="year"></span> iPad Queen. Tous droits réservés.</span>
      <span class="credit">Site conçu et développé par <a href="https://nexus1agency.netlify.app" target="_blank" rel="noopener"><b>Nexus Digital Agency</b></a> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6z"/></svg> · <a href="https://www.instagram.com/younes35workss" target="_blank" rel="noopener">@younes35workss</a></span>
    </div>
  </div>`;
  const y = document.getElementById('year');
  if(y) y.textContent = new Date().getFullYear();
});
