/* wh-shop.js — the floating buy button on product pages (sections/wh-product-bar.liquid, Figma Menu Mobile/Product Bar).
   - Moves the bar out of the page window to the end of <body>, so it stays fixed to the screen (the window is a CSS container,
     which would otherwise pin it to the page instead of the screen).
   - Add to Cart adds to the cart without leaving the page (without JS it is a normal form post to the cart). */
(() => {
  const bar = document.querySelector('[data-wh-pbar]');
  if (!bar || bar.dataset.whReady) return;
  bar.dataset.whReady = '1';
  document.body.appendChild(bar);
  document.body.classList.add('wh-has-pbar');
  const form = bar.querySelector('[data-wh-product-form]'), button = bar.querySelector('[data-wh-add]'), label = bar.querySelector('[data-wh-add-label]');
  if (!form || !button) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    button.disabled = true;
    try {
      const r = await fetch((window.Shopify?.routes?.root || '/') + 'cart/add.js', { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
      if (!r.ok) throw new Error('Could not add');
      label.textContent = 'Added';
    } catch (err) { label.textContent = 'Try again'; }
    setTimeout(() => { button.disabled = false; label.textContent = label.dataset.label; }, 1600);
  });
})();
