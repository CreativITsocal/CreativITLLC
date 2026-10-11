/* CreativIT, LLC — site interactions */
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header: solid on scroll ---------- */
  const header = document.querySelector(".site-header");
  const onScroll = () => header && header.classList.toggle("is-scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const toggle = document.querySelector(".menu-toggle");
  if (toggle) {
    const setOpen = (open) => {
      document.body.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    };
    toggle.addEventListener("click", () => setOpen(!document.body.classList.contains("menu-open")));
    document.querySelectorAll(".mobile-menu a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => e.key === "Escape" && setOpen(false));
  }

  /* ---------- Scroll reveal ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Viewfinder timecode (24 fps) ---------- */
  const timecodes = document.querySelectorAll("[data-timecode]");
  if (timecodes.length) {
    const start = performance.now();
    const pad = (n) => String(n).padStart(2, "0");
    const tick = (now) => {
      const f = Math.floor(((now - start) / 1000) * 24);
      const tc = `${pad(Math.floor(f / 86400))}:${pad(Math.floor(f / 1440) % 60)}:${pad(Math.floor(f / 24) % 60)}:${pad(f % 24)}`;
      timecodes.forEach((el) => (el.textContent = tc));
      if (!reduceMotion) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Hero still-reel ---------- */
  const slides = document.querySelectorAll(".hero-slide");
  const slideCap = document.querySelector("[data-slide-caption]");
  const slideNum = document.querySelector("[data-slide-count]");
  if (slides.length > 1) {
    let i = 0;
    const show = (n) => {
      slides.forEach((s, k) => s.classList.toggle("is-active", k === n));
      if (slideCap) slideCap.textContent = slides[n].dataset.caption || "";
      if (slideNum) slideNum.textContent = `${String(n + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    };
    show(0);
    if (!reduceMotion) setInterval(() => show((i = (i + 1) % slides.length)), 5200);
  }

  /* ---------- Filmstrip auto-scroll (seamless loop) ---------- */
  const strip = document.querySelector(".strip[data-autoscroll]");
  if (strip && !reduceMotion) {
    const originals = [...strip.children];
    // Clone the set once so the loop is seamless; clones forward clicks to the originals.
    originals.forEach((el) => {
      const c = el.cloneNode(true);
      c.removeAttribute("data-gallery");
      c.setAttribute("aria-hidden", "true");
      c.tabIndex = -1;
      c.addEventListener("click", () => el.click());
      strip.appendChild(c);
    });
    strip.classList.add("is-auto");

    const SPEED = 32; // px per second
    let pos = strip.scrollLeft, last = 0, paused = false, inView = false, resumeT;
    const loopW = () => strip.children[originals.length].offsetLeft - strip.children[0].offsetLeft;
    const pause = () => { paused = true; clearTimeout(resumeT); };
    const resume = (delay = 0) => { clearTimeout(resumeT); resumeT = setTimeout(() => (paused = false), delay); };

    strip.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && pause());
    strip.addEventListener("pointerleave", (e) => e.pointerType === "mouse" && resume());
    strip.addEventListener("focusin", pause);
    strip.addEventListener("focusout", () => resume());
    strip.addEventListener("touchstart", pause, { passive: true });
    strip.addEventListener("touchend", () => resume(2500), { passive: true });
    new IntersectionObserver(([en]) => (inView = en.isIntersecting)).observe(strip);

    const frame = (t) => {
      const dt = last ? Math.min((t - last) / 1000, 0.1) : 0;
      last = t;
      const lightboxOpen = document.querySelector("dialog.lightbox[open]");
      if (Math.abs(strip.scrollLeft - pos) > 2) pos = strip.scrollLeft; // user scrolled manually
      if (!paused && inView && !lightboxOpen) {
        pos += SPEED * dt;
        const w = loopW();
        if (w > 0 && pos >= w) pos -= w;
        strip.scrollLeft = pos;
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  /* ---------- Lightbox (films + photos) ---------- */
  const icon = {
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M15 5l-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 5l7 7-7 7"/></svg>',
  };
  let lb, stage, btnPrev, btnNext, group = [], idx = 0, lastFocus = null;

  const buildLightbox = () => {
    lb = document.createElement("dialog");
    lb.className = "lightbox";
    lb.setAttribute("aria-label", "Media viewer");
    lb.innerHTML = `
      <button class="lb-btn lb-close" type="button" aria-label="Close">${icon.close}</button>
      <button class="lb-btn lb-prev" type="button" aria-label="Previous">${icon.prev}</button>
      <button class="lb-btn lb-next" type="button" aria-label="Next">${icon.next}</button>
      <div class="lb-stage"></div>`;
    document.body.appendChild(lb);
    stage = lb.querySelector(".lb-stage");
    btnPrev = lb.querySelector(".lb-prev");
    btnNext = lb.querySelector(".lb-next");
    lb.querySelector(".lb-close").addEventListener("click", closeLb);
    btnPrev.addEventListener("click", () => step(-1));
    btnNext.addEventListener("click", () => step(1));
    lb.addEventListener("click", (e) => { if (e.target === lb) closeLb(); });
    lb.addEventListener("close", () => {
      stage.innerHTML = "";
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    });
    lb.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
  };

  const openLb = () => {
    if (!lb) buildLightbox();
    lastFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    if (!lb.open) lb.showModal();
  };
  const closeLb = () => lb && lb.open && lb.close();

  const showImage = () => {
    const el = group[idx];
    const cap = el.dataset.caption || "";
    stage.innerHTML = `<img src="${el.dataset.full}" alt="${el.querySelector("img")?.alt || cap}">
      <p class="lb-caption">${cap} <span aria-hidden="true">·</span> ${idx + 1} / ${group.length}</p>`;
    btnPrev.hidden = btnNext.hidden = group.length < 2;
  };
  const step = (d) => {
    if (!group.length || group.length < 2) return;
    idx = (idx + d + group.length) % group.length;
    showImage();
  };

  document.addEventListener("click", (e) => {
    const film = e.target.closest("[data-video]");
    if (film) {
      e.preventDefault();
      openLb();
      group = [];
      btnPrev.hidden = btnNext.hidden = true;
      const id = film.dataset.video;
      const title = film.dataset.title || "Video";
      stage.innerHTML = `<div class="lb-video"><iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1"
        title="${title}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>
        <p class="lb-caption">${title}</p>`;
      return;
    }
    const shot = e.target.closest("[data-gallery]");
    if (shot) {
      e.preventDefault();
      const name = shot.dataset.gallery;
      group = [...document.querySelectorAll(`[data-gallery="${name}"]`)]
        .filter((el) => !el.hidden)
        .sort((a, b) => (a.dataset.i || 0) - (b.dataset.i || 0));
      idx = Math.max(0, group.indexOf(shot));
      openLb();
      showImage();
    }
  });

  /* ---------- Gallery: row-first masonry + filter tabs ---------- */
  const gallery = document.querySelector(".gallery");
  if (gallery) {
    const shots = [...gallery.querySelectorAll(".shot")];
    shots.forEach((s, k) => (s.dataset.i = k));
    let cols = 0;
    const layout = (force) => {
      const n = window.innerWidth < 900 ? 2 : 3;
      if (n === cols && !force) return;
      cols = n;
      const colEls = Array.from({ length: n }, () => {
        const c = document.createElement("div");
        c.className = "masonry-col";
        return c;
      });
      const heights = new Array(n).fill(0);
      shots.forEach((s) => {
        if (s.hidden) { colEls[0].appendChild(s); return; }
        const img = s.querySelector("img");
        const k = heights.indexOf(Math.min(...heights));
        colEls[k].appendChild(s);
        heights[k] += (img.getAttribute("height") / img.getAttribute("width")) || 1;
      });
      gallery.replaceChildren(...colEls);
      gallery.classList.add("is-masonry");
    };
    layout();
    window.addEventListener("resize", () => layout());

    const tabs = document.querySelectorAll("[data-filter]");
    tabs.forEach((tab) =>
      tab.addEventListener("click", () => {
        const f = tab.dataset.filter;
        tabs.forEach((t) => t.setAttribute("aria-selected", String(t === tab)));
        shots.forEach((s) => (s.hidden = f !== "all" && !s.dataset.cat.split(" ").includes(f)));
        layout(true);
      })
    );
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
})();
