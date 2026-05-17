/* =============================================================
   The Flame Brush — site application
   Vanilla JS. No build step. No framework.
   Reads data/collections.json (generated from images/ folders).
   ============================================================= */

(() => {
  "use strict";

  /* ---------- studio info (edit me) ----------------------- */
  const STUDIO = {
    name: "The Flame Brush",
    tagline: "Hand-blown vessels from a two-woman studio.",
    email: "theflamebrush@gmail.com",
    instagram: "@the_flame_brush",
    location: "Alameda, CA",
    address: "14 Riverside Drive, Asheville NC 28801",
    hours: "Saturdays 11–4 · or by appointment",
    estYear: "2025",
    bookingLine: "Custom orders",
  };

  /* ---------- helpers ------------------------------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const h = (tag, attrs = {}, ...children) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
      else if (k === "dataset" && typeof v === "object") Object.assign(el.dataset, v);
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === "html") el.innerHTML = v;
      else el.setAttribute(k, v);
    }
    for (const child of children.flat()) {
      if (child === null || child === undefined || child === false) continue;
      el.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return el;
  };
  const pad2 = (n) => String(n).padStart(2, "0");

  const ICONS = {
    "arrow-right": '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m13 5 7 7-7 7"/></svg>',
    "arrow-left":  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m11 5-7 7 7 7"/></svg>',
    "x":           '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>',
    "menu":        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
  };

  /* =========================================================
     ROUTER (hash-based)
     ========================================================= */
  function parseRoute() {
    const raw = (window.location.hash || "#/").replace(/^#/, "");
    const parts = raw.split("/").filter(Boolean);
    if (parts.length === 0) return { name: "home" };
    if (parts[0] === "collections" && parts[1]) return { name: "collection", id: parts[1] };
    if (parts[0] === "collections") return { name: "collections" };
    if (parts[0] === "about") return { name: "about" };
    if (parts[0] === "contact") {
      const q = new URLSearchParams(raw.split("?")[1] || "");
      return { name: "contact", piece: q.get("piece") };
    }
    return { name: "home" };
  }
  function go(path) {
    window.location.hash = path;
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  window.addEventListener("hashchange", () => render());

  /* =========================================================
     DATA — loads from /data/collections.json
     ========================================================= */
  let COLLECTIONS = [];
  let ALL_PIECES = [];
  let STUDIO_WALL = [];

  async function loadData() {
    try {
      const res = await fetch("data/collections.json", { cache: "no-cache" });
      if (!res.ok) throw new Error("collections.json missing — run the build (or push to GitHub and let the Action build it).");
      const data = await res.json();
      COLLECTIONS = (data.collections || []).map(c => ({
        ...c,
        pieces: c.pieces || [],
      }));
      ALL_PIECES = COLLECTIONS.flatMap(c => c.pieces.map(p => ({ ...p, collectionId: c.id, season: c.season })));
      STUDIO_WALL = data.studioWall || [];
    } catch (err) {
      console.warn(err);
      COLLECTIONS = [];
      ALL_PIECES = [];
      STUDIO_WALL = [];
    }
  }

  /* =========================================================
     SHARED CHROME
     ========================================================= */
  function studioStrip() {
    return h("div", { class: "fb-strip" },
      h("div", {}, STUDIO.bookingLine),
      h("div", {}, `${STUDIO.location} · Est. ${STUDIO.estYear}`),
    );
  }

  function topNav(active) {
    const items = [
      ["home", "Studio", "#/"],
      ["collections", "Collections", "#/collections"],
      ["about", "About", "#/about"],
      ["contact", "Contact", "#/contact"],
    ];
    const nav = h("nav", { class: "fb-nav" },
      h("div", { class: "fb-nav-inner" },
        h("a", {
          class: "brand",
          href: "#/",
          onclick: (e) => { e.preventDefault(); go("/"); },
        },
          h("img", { src: "assets/logo-64.png", alt: "", class: "fb-logo-mark" }),
          h("span", { html: `The <span class="amp">Flame</span> Brush` }),
        ),
        h("ul", {},
          ...items.map(([k, label, href]) =>
            h("li", {
              class: (active === k || (k === "collections" && active === "collection")) ? "active" : "",
              onclick: () => { go(href.replace(/^#/, "")); nav.classList.remove("open"); },
            }, label)
          ),
        ),
        h("div", { class: "fb-nav-actions" },
          h("a", { onclick: () => go("/contact") }, "Inquire ↗"),
        ),
        h("button", {
          class: "fb-nav-toggle",
          "aria-label": "Toggle menu",
          onclick: () => nav.classList.toggle("open"),
          html: ICONS["menu"],
        }),
      ),
    );
    return nav;
  }

  function footer() {
    return h("footer", { class: "fb-footer" },
      h("div", { class: "fb-footer-inner" },
        h("div", {},
          h("div", { class: "brand" },
            h("img", { src: "assets/logo-64.png", alt: "", class: "fb-logo-mark" }),
            h("span", { html: `The <span class="amp">Flame</span> Brush` }),
          ),
          h("p", { class: "colophon" },
            `A woman-owned glass-art partnership. Hand-blown vessels, ring dishes, and small sculptural objects from a sunlit studio in ${STUDIO.location}.`),
        ),
        h("div", {},
          h("h5", {}, "Studio"),
          h("ul", {},
            h("li", { onclick: () => go("/about") }, "About"),
            h("li", { onclick: () => go("/collections") }, "Collections"),
          ),
        ),
        h("div", {},
          h("h5", {}, "Catalog"),
          h("ul", {},
            h("li", { onclick: () => go("/collections") }, "All works"),
            h("li", { onclick: () => go("/contact") }, "Commissions"),
          ),
        ),
        h("div", {},
          h("h5", {}, "Connect"),
          h("ul", {},
            h("li", {}, h("a", { href: `https://instagram.com/${STUDIO.instagram.replace(/^@/, "")}`, target: "_blank", rel: "noopener" }, "Instagram ↗")),
            h("li", {}, h("a", { href: `mailto:${STUDIO.email}` }, STUDIO.email)),
          ),
        ),
      ),
      h("div", { class: "fb-footer-bottom" },
        h("span", {}, `© ${new Date().getFullYear()} ${STUDIO.name} · all pieces one of one`),
        h("span", {}, `Made with care in ${STUDIO.location}`),
      ),
    );
  }

  /* =========================================================
     HOME — parallax photo wall hero
     ========================================================= */
  function homePage() {
    return h("div", {}, heroWall(), homeBlurb(), homeCollections());
  }

  function heroWall() {
    // Prefer the dedicated studio-wall folder (small, web-sized photos).
    // Fall back to full-res collection photos if the wall folder is empty.
    const photos = (STUDIO_WALL && STUDIO_WALL.length > 0)
      ? STUDIO_WALL
      : ALL_PIECES.map(p => p.photo).filter(Boolean);
    const tileRecipe = [
      { col: "1 / 3", row: "1", colStart: 1, dy: 0.30 },
      { col: "3 / 5", row: "1", colStart: 3, dy: 0.10 },
      { col: "5 / 7", row: "1", colStart: 5, dy: 0.50 },
      { col: "1 / 2", row: "2", colStart: 1, dy: 0.20 },
      { col: "2 / 4", row: "2", colStart: 2, dy: 0.40 },
      { col: "4 / 5", row: "2", colStart: 4, dy: 0.15 },
      { col: "5 / 7", row: "2", colStart: 5, dy: 0.35 },
      { col: "1 / 3", row: "3", colStart: 1, dy: 0.45 },
      { col: "3 / 5", row: "3", colStart: 3, dy: 0.20 },
      { col: "5 / 7", row: "3", colStart: 5, dy: 0.30 },
    ];
    const grid = h("div", { class: "grid" });
    const tileImages = [];
    if (photos.length > 0) {
      tileRecipe.forEach((t, i) => {
        const photo = photos[(i * 3 + 1) % photos.length];
        // Diagonal cascade: top-left first, bottom-right last
        const delay = (parseInt(t.row) - 1) * 180 + (t.colStart - 1) * 60;
        const tile = h("div", {
          class: "hero-tile",
          dataset: { dy: String(t.dy) },
          style: {
            gridColumn: t.col,
            gridRow: t.row,
            "--reveal-delay": `${delay}ms`,
          },
        });
        const img = h("img", {
          src: photo, alt: "",
          loading: "eager",
          fetchpriority: i < 6 ? "high" : "auto",
          decoding: "async",
        });
        tile.append(img);
        grid.append(tile);
        tileImages.push(img);

        // Preload hint in <head> so the browser prioritizes these.
        if (i < 6 && !document.querySelector(`link[rel="preload"][href="${photo}"]`)) {
          document.head.append(h("link", { rel: "preload", as: "image", href: photo, fetchpriority: "high" }));
        }
      });
    }

    const section = h("section", { class: "hero-wall" },
      grid,
      h("div", { class: "scrim" }),
      h("div", { class: "content" },
        h("h1", { html: `Glass,<br/>caught <em>mid-breath</em>.` }),
        h("p", { class: "lede" },
          `A two-woman studio uniting scientific curiosity with artistic innovation. Every piece is hand-blown, annealed overnight, and signed by hand.`),
        h("div", { class: "actions" },
          h("button", {
            class: "fb-btn fb-btn-primary",
            onclick: () => go("/collections"),
            html: `View collections ${ICONS["arrow-right"]}`,
          }),
          h("button", {
            class: "fb-btn fb-btn-secondary",
            onclick: () => go("/about"),
          }, "About the studio"),
        ),
      ),
    );

    // Choreographed reveal: wait for all hero images to load, then cascade.
    // Bail out after 2.5s if some are slow — we don't want a stuck-blank hero.
    const markReady = () => requestAnimationFrame(() => section.classList.add("is-ready"));
    if (tileImages.length === 0) {
      markReady();
    } else {
      const pending = tileImages.map(img =>
        img.complete && img.naturalWidth > 0
          ? Promise.resolve()
          : new Promise(resolve => {
              img.addEventListener("load", resolve, { once: true });
              img.addEventListener("error", resolve, { once: true });
            })
      );
      Promise.all(pending).then(markReady);
      setTimeout(markReady, 2500);
    }

    // Parallax — applies to the tile (parent), reveal animations target the inner <img>.
    // Mobile gets a much gentler factor so drifting tiles don't expose dark gaps.
    const onScroll = () => {
      const y = window.scrollY;
      const factor = window.matchMedia("(max-width: 880px)").matches ? 0.13 : 0.4;
      section.querySelectorAll("[data-dy]").forEach(el => {
        const dy = parseFloat(el.dataset.dy || "0");
        el.style.setProperty("--parallax-y", `${(y * dy * factor).toFixed(2)}px`);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    const observer = new MutationObserver(() => {
      if (!document.contains(section)) {
        window.removeEventListener("scroll", onScroll);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return section;
  }

  function homeBlurb() {
    return h("section", { class: "wash-cream fb-home-blurb" },
      h("div", { class: "inner" },
        h("div", { class: "fb-eyebrow" },
          h("span", { class: "rule" }), "About the studio", h("span", { class: "rule" }),
        ),
        h("p", { class: "quote", html: `We unite scientific curiosity with artistic innovation to create unique glass art that <em>inspires and connects</em> — a vibrant, inclusive space where art and science flourish together.` }),
      ),
    );
  }

  function homeCollections() {
    return h("section", { class: "fb-section" },
      h("div", { class: "fb-eyebrow" },
        h("span", { class: "rule" }), "The collections"),
      h("h2", { html: `Two seasons of work,<br/>one body of practice.`, style: { fontSize: "clamp(48px, 5.5vw, 80px)", lineHeight: "1.04", margin: "0 0 64px", maxWidth: "880px" } }),
      collectionsGrid(),
    );
  }

  function collectionsGrid() {
    const grid = h("div", { class: "fb-collections" });
    if (COLLECTIONS.length === 0) {
      grid.append(
        h("article", { class: "fb-coll-card" },
          h("div", { class: "empty-state", html: `No collections yet.<br/>Drop image folders into <code>images/</code> and push to GitHub.` }),
        ),
      );
      return grid;
    }
    COLLECTIONS.forEach(c => {
      grid.append(
        h("article", { class: "fb-coll-card", onclick: () => go(`/collections/${c.id}`) },
          h("div", { class: "img", style: { backgroundImage: `url("${c.cover}")` } }),
          h("div", { class: "scrim" }),
          h("span", { class: "pieces-count" }, `${c.pieces.length} ${c.pieces.length === 1 ? "piece" : "pieces"}`),
          h("div", { class: "meta" },
            c.season ? h("div", { class: "season" }, c.season) : null,
            h("h3", {}, c.title),
            c.tagline ? h("div", { class: "tagline" }, c.tagline) : null,
          ),
        ),
      );
    });
    return grid;
  }

  /* =========================================================
     COLLECTIONS INDEX
     ========================================================= */
  function collectionsIndex() {
    return h("div", {},
      h("section", { class: "fb-section tight", style: { paddingBottom: "32px" } },
        h("div", { class: "fb-eyebrow" }, h("span", { class: "rule" }), "Collections"),
        h("h1", {
          html: `Every piece is one of one.<br/><em style="color:var(--ember-400)">The collections</em> are how we mark time.`,
          style: { fontSize: "clamp(56px, 7vw, 112px)", lineHeight: "1.0", margin: "0 0 24px", maxWidth: "1000px" },
        }),
        h("p", {
          html: "We organize our work by season because the studio behaves differently in each one — colder kilns in winter, longer days in summer, and the choices that follow.",
          style: { fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "22px", color: "var(--paper-100)", maxWidth: "640px", margin: "0 0 64px", lineHeight: "1.55" },
        }),
      ),
      h("section", { class: "fb-section", style: { paddingTop: "0" } }, collectionsGrid()),
    );
  }

  /* =========================================================
     COLLECTION DETAIL
     ========================================================= */
  function collectionDetail(id) {
    const collection = COLLECTIONS.find(c => c.id === id);
    if (!collection) {
      return h("section", { class: "fb-section" },
        h("h1", {}, "Collection not found."),
        h("p", {}, "Check that the folder still exists under images/."),
        h("button", { class: "fb-btn fb-btn-secondary", onclick: () => go("/collections") }, "All collections"),
      );
    }

    const wrap = h("div", {});

    const heroEl = h("div", { class: "fb-coll-hero" },
      h("div", { class: "img", style: { backgroundImage: `url("${collection.cover}")` } }),
      h("div", { class: "scrim" }),
      h("div", { class: "content" },
        h("button", { class: "back", onclick: () => go("/collections"), html: `${ICONS["arrow-left"]} All collections` }),
        h("div", { class: "season" }, `${collection.season || ""} · ${collection.pieces.length} pieces`),
        h("h1", {}, collection.title),
        collection.tagline ? h("div", { class: "tagline" }, collection.tagline) : null,
      ),
    );
    wrap.append(heroEl);

    if (collection.blurb) {
      wrap.append(h("p", { class: "fb-coll-blurb" }, collection.blurb));
    }

    const gallery = h("div", { class: "fb-gallery" });
    collection.pieces.forEach((p, i) => {
      gallery.append(
        h("button", { class: "tile", onclick: () => openLightbox(collection, i) },
          h("div", { class: "img-wrap" },
            h("span", { class: "num" }, pad2(i + 1)),
            h("img", { src: p.photo, alt: p.title, loading: "lazy" }),
          ),
          h("div", { class: "meta-row" },
            h("span", { class: "title" }, p.title),
            p.size ? h("span", { class: "size" }, p.size) : null,
          ),
        ),
      );
    });
    wrap.append(gallery);

    return wrap;
  }

  /* =========================================================
     LIGHTBOX
     ========================================================= */
  let lbState = null;

  function openLightbox(collection, index) {
    closeLightbox();
    lbState = { collection, index };
    const overlay = h("div", { class: "fb-lightbox", id: "fb-lightbox" });
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeLightbox();
    });
    document.body.append(overlay);
    document.body.style.overflow = "hidden";
    renderLightbox();
    document.addEventListener("keydown", lbKeys);
  }

  function closeLightbox() {
    document.removeEventListener("keydown", lbKeys);
    const node = document.getElementById("fb-lightbox");
    if (node) node.remove();
    document.body.style.overflow = "";
    lbState = null;
  }

  function lbKeys(e) {
    if (!lbState) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowLeft") lbNav(-1);
    else if (e.key === "ArrowRight") lbNav(1);
  }
  function lbNav(delta) {
    if (!lbState) return;
    const n = lbState.collection.pieces.length;
    lbState.index = (lbState.index + delta + n) % n;
    renderLightbox();
  }

  function renderLightbox() {
    if (!lbState) return;
    const overlay = document.getElementById("fb-lightbox");
    if (!overlay) return;
    const { collection, index } = lbState;
    const piece = collection.pieces[index];
    overlay.innerHTML = "";
    overlay.append(
      h("div", { class: "counter" }, `${pad2(index + 1)} / ${pad2(collection.pieces.length)}`),
      h("button", { class: "close", "aria-label": "Close", onclick: closeLightbox, html: ICONS["x"] }),
      h("button", { class: "arrow prev", "aria-label": "Previous", onclick: () => lbNav(-1), html: ICONS["arrow-left"].replace('width="14" height="14"', 'width="28" height="28"') }),
      h("button", { class: "arrow next", "aria-label": "Next", onclick: () => lbNav(1), html: ICONS["arrow-right"].replace('width="14" height="14"', 'width="28" height="28"') }),
      h("div", { class: "stage" },
        h("div", { class: "photo", style: { backgroundImage: `url("${piece.photo}")` } }),
        h("div", { class: "info" },
          collection.season ? h("div", { class: "season" }, collection.season) : null,
          h("h2", {}, piece.title),
          piece.note || piece.edition ? h("div", {
            style: { fontSize: "14px", color: "var(--paper-300)", letterSpacing: "0.04em" },
          }, piece.note || `Edition ${piece.edition}`) : null,
          h("div", { class: "spec" },
            piece.size ? h("div", { class: "k" }, "Dimensions") : null, piece.size ? h("div", { class: "v" }, piece.size) : null,
            piece.year ? h("div", { class: "k" }, "Year") : null, piece.year ? h("div", { class: "v" }, piece.year) : null,
            piece.materials ? h("div", { class: "k" }, "Materials") : null, piece.materials ? h("div", { class: "v" }, piece.materials) : null,
            piece.process ? h("div", { class: "k" }, "Process") : null, piece.process ? h("div", { class: "v" }, piece.process) : null,
            piece.price ? h("div", { class: "k" }, "Inquire") : null, piece.price ? h("div", { class: "v" }, `$${piece.price} · one of one`) : null,
          ),
          h("div", { class: "actions" },
            h("button", {
              class: "fb-btn fb-btn-primary",
              onclick: () => { closeLightbox(); go(`/contact?piece=${encodeURIComponent(piece.title)}`); },
              html: `Inquire to purchase ${ICONS["arrow-right"]}`,
            }),
            h("button", { class: "fb-btn fb-btn-ghost", onclick: closeLightbox }, "Close"),
          ),
        ),
      ),
    );
  }

  /* =========================================================
     ABOUT
     ========================================================= */
  function aboutPage() {
    return h("div", {},
      // ---------- Intro / About us ----------
      h("section", { class: "fb-about-intro" },
        h("div", { class: "fb-about-intro-inner" },
          h("div", { class: "fb-about-intro-text reveal" },
            h("h1", { html: `Meet the <em>makers</em> of The Flame Brush!` }),
            h("p", { class: "lede" },
              "Together, Caitlin and Gwen have built The Flame Brush as a space where curiosity, experimentation, and creativity collide. By bridging cutting-edge science with an artist's sensitivity, The Flame Brush invites viewers to see glass not just as a medium, but as a living interface where discovery and creativity interact — revealing new dimensions shaped by both nature and imagination."),
            h("p", { class: "fb-about-postscript" },
              "Stay tuned for more behind-the-scenes glimpses, upcoming drops, and a closer look at the art that emerges when science meets molten glass!"),
          ),
          h("figure", { class: "fb-about-intro-photo reveal" },
            h("div", {
              class: "photo parallax",
              dataset: { dy: "0.06" },
              style: { backgroundImage: `url("assets/Team/caitlin-and-gwen.JPG")` },
            }),
            h("figcaption", {}, "Caitlin Koski & Gwen Musial · The Flame Brush"),
          ),
        ),
      ),

      // ---------- Transition header into the bios ----------
      h("section", { class: "fb-about-transition reveal" },
        h("h2", { html: `We are so excited to introduce the co-founders and creative minds shaping <em>our studio</em>.` }),
      ),

      // ---------- Caitlin ----------
      bioBlock({
        side: "left",
        photo: "assets/Team/caitlin.JPG",
        firstName: "Caitlin",
        fullName: "Caitlin Koski",
        credits: "BS Biomedical Engineering · MS Biotechnology · PhD Materials Science & Engineering",
        minor: "Minor in Studio Arts — painting & black-and-white film photography",
        body: [
          "Caitlin melds scientific innovation with artistic expression through glass. She brings a uniquely multifaceted perspective to The Flame Brush, where every form is a small experiment in precision and intuition.",
          "Gwen inspired Caitlin to explore the hot shop, where she began her training in 2022 at The Glass Hand Studio in Alameda, California. Her work showcases an eye for contrast and composition, playing on light, color, and shadow with each blown form. Her experimental approach blends scientific precision with artistic abstraction, leading to transformative glass pieces.",
        ],
      }),

      // ---------- Gwen ----------
      bioBlock({
        side: "right",
        photo: "assets/Team/gwen.jpg",
        firstName: "Gwen",
        fullName: "Gwen Musial",
        credits: "BS Biomedical Engineering · PhD Biomedical Optics, University of Houston",
        minor: "7 Years spent living and working in Europe",
        body: [
          "Gwen bridges science and art through glass, drawing inspiration from both scientific precision and artistic beauty. Her lifelong fascination with how light transforms materials threads through every piece she makes.",
          "Gwen discovered glassblowing during lockdown in Cologne, Germany, after watching Blown Away, and began training in 2022 at The Glass Hand Studio in Alameda, California. Her work explores the interplay of light, transparency, and form — reflecting how a single gather can reveal hidden dimensions of beauty.",
        ],
      }),

      // ---------- Values ----------
      h("section", { class: "fb-values" },
        ...[
          ["Slow craft.",    "A 14-hour anneal is the difference between a vessel and a pile of pretty shards. We make as much as the kiln will allow."],
          ["Proudly local.", "We uplift the local Bay Area artistic community — fostering collaboration and empowering women in creative and scientific fields. The studio is louder when shared."],
          ["One of one.",    "Every piece in every collection is unrepeatable, each work is one of one."],
        ].map(([title, body]) =>
          h("div", { class: "v reveal" },
            h("h4", {}, title),
            h("p", {}, body),
          )
        ),
      ),
    );
  }

  function bioBlock({ side, photo, eyebrow, firstName, fullName, credits, minor, body }) {
    const photoEl = h("figure", { class: "fb-bio-photo reveal" },
      h("div", {
        class: "photo parallax",
        dataset: { dy: "0.04" },
        style: { backgroundImage: `url("${photo}")` },
      }),
      h("figcaption", {}, firstName),
    );
    const textEl = h("div", { class: "fb-bio-text reveal" },
      eyebrow ? h("div", { class: "fb-eyebrow" }, h("span", { class: "rule" }), eyebrow) : null,
      h("h2", { class: "fb-bio-name", html: fullName.replace(firstName, `<em>${firstName}</em>`) }),
      h("div", { class: "fb-bio-credits" },
        h("div", { class: "credits-line" }, credits),
        minor ? h("div", { class: "credits-line minor" }, minor) : null,
      ),
      ...body.map(p => h("p", {}, p)),
    );
    return h("section", { class: `fb-bio ${side === "right" ? "alt" : ""}` },
      side === "left" ? photoEl : textEl,
      side === "left" ? textEl : photoEl,
    );
  }

  /* =========================================================
     CONTACT — submits to Web3Forms (AJAX, no backend, no signup
     beyond getting the access key once).
     ========================================================= */
  const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
  const WEB3FORMS_KEY      = "a4fe1e69-4a20-4147-904d-60e325be8c88";

  function contactPage(piecePrefill) {
    const formContainer = h("div", { class: "fb-form-wrap" });

    const renderForm = () => {
      formContainer.innerHTML = "";
      const form = h("form", { class: "fb-form" });

      // Honeypot — bots fill this; humans don't see it.
      const honeypot = h("input", {
        type: "checkbox", name: "botcheck",
        style: { display: "none" },
        tabindex: "-1", "aria-hidden": "true",
      });

      form.append(
        honeypot,
        h("div", { class: "row2" },
          h("div", { class: "field" }, h("label", {}, "Your name"),
            h("input", { type: "text", name: "name", required: true, autocomplete: "name" })),
          h("div", { class: "field" }, h("label", {}, "Email"),
            h("input", { type: "email", name: "email", required: true, autocomplete: "email" })),
        ),
        h("div", { class: "row2" },
          h("div", { class: "field" },
            h("label", {}, "What's this about"),
            (() => {
              const sel = h("select", { name: "inquiry" });
              [
                ["general", "A general hello"],
                ["purchase", "Inquiring about a piece"],
                ["commission", "Custom commission"],
                ["press", "Press / collaboration"],
              ].forEach(([v, t]) => sel.append(h("option", {
                value: v, selected: piecePrefill && v === "purchase",
              }, t)));
              return sel;
            })(),
          ),
          h("div", { class: "field" },
            h("label", {}, "Piece (optional)"),
            h("input", { type: "text", name: "piece", placeholder: "e.g. Stillwater, no. 2", value: piecePrefill || "" }),
          ),
        ),
        h("div", { class: "field" },
          h("label", {}, "Your note"),
          h("textarea", {
            name: "message", required: true,
            placeholder: "Tell us a little about what you're hoping for.",
          }, piecePrefill ? `I'd like to inquire about purchasing "${piecePrefill}".` : ""),
        ),
      );

      const submitBtn = h("button", {
        type: "submit", class: "fb-btn fb-btn-primary",
        html: `Send the note ${ICONS["arrow-right"]}`,
      });
      form.append(h("div", { class: "submit" }, submitBtn));

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (honeypot.checked) return; // bot caught

        const fd = new FormData(form);
        const inquiry = (fd.get("inquiry") || "general").toString();
        const name = (fd.get("name") || "a friend").toString().trim();

        const payload = {
          access_key: WEB3FORMS_KEY,
          subject: `[${inquiry}] inquiry from ${name} — theflamebrush.studio`,
          from_name: `${name} via theflamebrush.studio`,
          name: name,
          email: fd.get("email"),
          inquiry: inquiry,
          piece: (fd.get("piece") || "").toString().trim(),
          message: (fd.get("message") || "").toString(),
        };

        submitBtn.disabled = true;
        submitBtn.innerHTML = "Sending…";

        try {
          const res = await fetch(WEB3FORMS_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify(payload),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.success) {
            renderSuccess();
          } else {
            console.warn("Web3Forms response", res.status, data);
            renderError(data.message || `The form service returned an error (HTTP ${res.status}). Try again, or email us directly.`);
          }
        } catch (err) {
          console.error("Web3Forms fetch failed", err);
          renderError("Couldn't reach the form service. Check your connection and try again — or email us directly.");
        }
      });

      formContainer.append(form);
    };

    const renderSuccess = () => {
      formContainer.innerHTML = "";
      formContainer.append(
        h("div", { class: "fb-form-handoff reveal is-in" },
          h("div", { class: "fb-eyebrow", style: { color: "var(--ember-400)" } },
            h("span", { class: "rule" }), "Note received"),
          h("h2", { html: `Thanks for the <em>note</em>.` }),
          h("p", { class: "lede" },
            "We'll write back soon. If it's about a piece you're hoping to purchase, we'll hold it for you while we sort the details."),
          h("button", {
            class: "fb-btn fb-btn-secondary",
            onclick: renderForm,
            style: { marginTop: "24px" },
          }, "Send another note"),
        ),
      );
    };

    const renderError = (msg) => {
      formContainer.innerHTML = "";
      formContainer.append(
        h("div", { class: "fb-form-handoff" },
          h("p", { class: "lede", style: { color: "var(--paper-100)" } }, msg),
          h("p", { class: "fb-form-handoff-fallback" },
            "You can also email us directly at ",
            h("a", { href: `mailto:${STUDIO.email}` }, STUDIO.email),
            "."),
          h("button", {
            class: "fb-btn fb-btn-secondary",
            onclick: renderForm,
            style: { marginTop: "24px" },
          }, "Try again"),
        ),
      );
    };

    renderForm();

    return h("div", { class: "fb-contact-wrap" },
      h("section", { class: "fb-contact" },
        h("div", { class: "left" },
          h("div", { class: "fb-eyebrow" }, h("span", { class: "rule" }), "Get in touch"),
          h("h1", { html: `Let's <em>talk</em>.` }),
          h("p", { class: "lede" }, "For purchase inquiries, custom commissions, press, or anything else — we read every note."),
          h("div", { class: "info" },
            h("div", { class: "row" }, h("span", { class: "k" }, "Studio"), h("span", { class: "v" }, STUDIO.location)),
            h("div", { class: "row" }, h("span", { class: "k" }, "Email"),
              h("span", { class: "v" },
                h("a", { href: `mailto:${STUDIO.email}` }, STUDIO.email))),
            h("div", { class: "row" }, h("span", { class: "k" }, "Instagram"),
              h("span", { class: "v" },
                h("a", { href: `https://instagram.com/${STUDIO.instagram.replace(/^@/, "")}`, target: "_blank", rel: "noopener" }, STUDIO.instagram))),
          ),
        ),
        h("div", { class: "right" }, formContainer),
      ),
    );
  }

  /* =========================================================
     MAIN RENDER
     ========================================================= */
  async function render() {
    if (!document.body.classList.contains("loaded")) {
      await loadData();
      document.body.classList.add("loaded");
    }
    const route = parseRoute();
    const root = document.getElementById("app");
    root.innerHTML = "";
    root.append(studioStrip(), topNav(route.name));

    if (route.name === "home") root.append(homePage());
    else if (route.name === "collections") root.append(collectionsIndex());
    else if (route.name === "collection") root.append(collectionDetail(route.id));
    else if (route.name === "about") root.append(aboutPage());
    else if (route.name === "contact") root.append(contactPage(route.piece));

    root.append(footer());
    setupScrollEffects(root);
  }

  /* =========================================================
     SCROLL EFFECTS — reveal-on-scroll + soft parallax
     ========================================================= */
  let scrollHandlers = [];
  function setupScrollEffects(root) {
    // Tear down handlers from the previous page
    scrollHandlers.forEach(fn => window.removeEventListener("scroll", fn));
    scrollHandlers = [];

    // 1) Reveal-on-scroll via IntersectionObserver
    const reveals = root.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && reveals.length) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
      reveals.forEach(el => io.observe(el));
    } else {
      reveals.forEach(el => el.classList.add("is-in"));
    }

    // 2) Soft parallax for elements with [data-dy]
    const parallaxers = root.querySelectorAll(".parallax[data-dy]");
    if (parallaxers.length) {
      const onScroll = () => {
        parallaxers.forEach(el => {
          const rect = el.getBoundingClientRect();
          const center = rect.top + rect.height / 2 - window.innerHeight / 2;
          const dy = parseFloat(el.dataset.dy || "0") * center * -0.4;
          el.style.transform = `translate3d(0, ${dy.toFixed(2)}px, 0) scale(1.06)`;
        });
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      scrollHandlers.push(onScroll);
    }
  }

  document.addEventListener("DOMContentLoaded", render);
})();
