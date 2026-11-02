/* wh-gallery.js — the Product Header photo gallery (<wh-gallery>), and only that.
   - Scrolls slowly on its own, in an endless loop: the photos are repeated, and the gallery always sits one round in,
     so there is room to swipe both ways; near either end it jumps by one round (which looks exactly the same).
   - Moves with inertia: mouse over the gallery → it glides to a stop; mouse out → it speeds back up.
   - Drag it sideways with the mouse; let go and it keeps sliding, then slows down (a "flick").
   - Touch: swipe as usual; it carries on a moment after you let go.
   - No auto-scrolling or sliding for visitors who asked their device for reduced motion, or while the gallery is off screen. */
class WhGallery extends HTMLElement {
  connectedCallback() {
    this.items = [...this.children];
    if (this.items.length < 2) return;
    this.classList.add('is-enhanced');                        // switches off scroll-snap (it fights the slow scroll)
    this.querySelectorAll('img').forEach(img => { img.draggable = false; });
    this.fillClones();
    this.pos = this.setWidth; this.scrollTo_(this.pos);       // start one round in (looks the same as the first photo)
    this.hovered = false; this.touching = false; this.visible = true;
    this.speed = 30;                                          // design px per second (Figma px × page scale)
    this.v = 0;                                               // current speed in screen px per second (starts still, then speeds up)
    this.easeTime = 0.18;                                     // seconds to get ~63% of the way to the new speed (hover stop / start)
    this.glideTime = 0.4;                                     // same, for the slide after a flick
    this.still = matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.addEventListener('mouseenter', () => { this.hovered = true; });
    this.addEventListener('mouseleave', () => { this.hovered = false; this.endDrag(); });
    this.addEventListener('pointerdown', e => this.startDrag(e));
    this.addEventListener('pointermove', e => this.moveDrag(e));
    this.addEventListener('pointerup', () => this.endDrag());
    this.addEventListener('pointercancel', () => this.endDrag());
    this.addEventListener('touchstart', () => { this.touching = true; this.v = 0; clearTimeout(this.resume); }, { passive: true });
    this.addEventListener('touchend', () => { this.resume = setTimeout(() => { this.touching = false; this.pos = this.scrollLeft; }, 2500); }, { passive: true });
    // Scrolling that didn't come from us (trackpad, swipe, keyboard): follow it
    this.addEventListener('scroll', () => {
      if (Math.abs(this.scrollLeft - this.written) <= 1) return;
      // Swipes/trackpad use the browser's own scrolling, which can't go past the edges: jump one round only when close to an edge,
      // so a swipe in progress is rarely interrupted.
      this.pos = this.scrollLeft;
      const S = this.setWidth;
      if (S && this.pos < S * 0.5) this.pos += S;
      else if (S && this.pos > this.scrollWidth - this.clientWidth - S * 0.5) this.pos -= S;
      if (this.pos !== this.scrollLeft) this.scrollLeft = this.pos;
      this.written = this.scrollLeft;
    }, { passive: true });

    this.io = new IntersectionObserver(([en]) => { this.visible = en.isIntersecting; });
    this.io.observe(this);
    this.ro = new ResizeObserver(() => {                        // Desktop ↔ Mobile changes the photo sizes: keep the same place in the round
      const old = this.setWidth, frac = old ? (((this.pos - old) % old) + old) % old / old : 0;
      this.fillClones(); this.pos = this.setWidth * (1 + frac); this.scrollTo_(this.pos);
    });
    this.ro.observe(this);

    this.last = performance.now();
    this.tick = this.tick.bind(this);
    this.frame = requestAnimationFrame(this.tick);
  }
  disconnectedCallback() { cancelAnimationFrame(this.frame); this.io && this.io.disconnect(); this.ro && this.ro.disconnect(); }

  /* Repeat the photos so there is a full round to the left (the originals) and at least 1.5 rounds + a screen to the right.
     setWidth = one full round of photos. Our own moves keep the position in the second round (setWidth … 2 × setWidth). */
  fillClones() {
    this.querySelectorAll('[data-wh-clone]').forEach(c => c.remove());
    const first = this.items[0];
    let added = 0;
    do {
      this.items.forEach(it => { const c = it.cloneNode(true); c.setAttribute('data-wh-clone', ''); c.setAttribute('aria-hidden', 'true'); c.removeAttribute('data-shopify-editor-block'); this.appendChild(c); });
      added++;
      this.setWidth = this.children[this.items.length].offsetLeft - first.offsetLeft;
    } while (this.scrollWidth < this.setWidth * 3.5 + this.clientWidth && added < 10);
  }
  wrap() {
    if (!this.setWidth) return;
    if (this.pos >= this.setWidth * 2) this.pos -= this.setWidth;
    else if (this.pos < this.setWidth) this.pos += this.setWidth;
  }
  scrollTo_(x) { this.scrollLeft = x; this.written = this.scrollLeft; }
  autoSpeed() {
    const unit = this.clientWidth / (this.clientWidth < 750 ? 390 : 1464);   // same scaling as the page (--wh-u)
    return this.speed * Math.min(unit, this.clientWidth < 750 ? 1.3 : unit);
  }
  tick(now) {
    const dt = Math.min(now - this.last, 100) / 1000; this.last = now;
    if (!this.dragging && !this.touching && this.visible) {
      const target = this.hovered || this.still ? 0 : this.autoSpeed();
      const tau = this.flicking ? this.glideTime : this.easeTime;
      this.v += (target - this.v) * (1 - Math.exp(-dt / tau));            // ease toward the target speed
      if (Math.abs(this.v - target) < 0.5) { this.v = target; this.flicking = false; }
      if (this.v) { this.pos += this.v * dt; this.wrap(); this.scrollTo_(this.pos); }
    }
    this.frame = requestAnimationFrame(this.tick);
  }
  startDrag(e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    this.dragging = true; this.flicking = false; this.v = 0;
    this.dragX = e.clientX; this.dragFrom = this.pos; this.samples = [[e.timeStamp, e.clientX]];
    this.classList.add('is-dragging'); this.setPointerCapture(e.pointerId); e.preventDefault();
  }
  moveDrag(e) {
    if (!this.dragging) return;
    this.pos = this.dragFrom - (e.clientX - this.dragX);
    if (this.pos >= this.setWidth * 2 || this.pos < this.setWidth) { this.wrap(); this.dragFrom = this.pos; this.dragX = e.clientX; }
    this.scrollTo_(this.pos);
    this.samples.push([e.timeStamp, e.clientX]);
    while (this.samples.length > 2 && e.timeStamp - this.samples[0][0] > 100) this.samples.shift();   // last ~0.1 s of movement
  }
  endDrag() {
    if (!this.dragging) return;
    this.dragging = false; this.classList.remove('is-dragging');
    const s = this.samples, a = s[0], b = s[s.length - 1], dt = (b[0] - a[0]) / 1000;
    const recent = performance.now() - b[0] < 80;                           // still moving when let go?
    if (!this.still && recent && dt > 0) { this.v = Math.max(-3000, Math.min(3000, -(b[1] - a[1]) / dt)); this.flicking = true; }
  }
}
if (!customElements.get('wh-gallery')) customElements.define('wh-gallery', WhGallery);
