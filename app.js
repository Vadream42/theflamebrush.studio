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
    email: "hello@theflamebrush.studio",
    instagram: "@theflamebrush",
    location: "Asheville, NC",
    address: "14 Riverside Drive, Asheville NC 28801",
    hours: "Saturdays 11–4 · or by appointment",
    estYear: "2019",
    openLine: "Open studio · Saturdays 11–4",
    bookingLine: "Custom orders · booking March",
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
    } catch (err) {
      console.warn(err);
      COLLECTIONS = [];
      ALL_PIECES = [];
    }
  }

  /* =========================================================
     SHARED CHROME
     ========================================================= */
  function studioStrip() {
    return h("div", { class: "fb-strip" },
      h("div", {}, h("span", { class: "dot" }, "● "), STUDIO.openLine),
      h("div", { class: "hide-narrow" }, STUDIO.bookingLine),
      h("div", {}, `${STUDIO.location} · est. ${STUDIO.estYear}`),
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
          h("img", { src: "assets/logo-mark.svg", alt: "" }),
          h("span", { html: `The Flame <span class="amp">&amp;</span> Brush` }),
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
            h("img", { src: "assets/logo-mark.svg", alt: "" }),
            h("span", { html: `The Flame <span class="amp">&amp;</span> Brush` }),
          ),
          h("p", { class: "colophon" },
            `A woman-owned glass-art partnership. Hand-blown vessels, ring dishes, and small sculptural objects from a sunlit studio in ${STUDIO.location}.`),
        ),
        h("div", {},
          h("h5", {}, "Studio"),
          h("ul", {},
            h("li", { onclick: () => go("/about") }, "About"),
            h("li", { onclick: () => go("/collections") }, "Collections"),
            h("li", { onclick: () => go("/contact") }, "Visit"),
          ),
        ),
        h("div", {},
          h("h5", {}, "Catalog"),
          h("ul", {},
            h("li", { onclick: () => go("/collections") }, "All works"),
            h("li", { onclick: () => go("/contact") }, "Commissions"),
            h("li", { onclick: () => go("/contact") }, "Care guide"),
          ),
        ),
        h("div", {},
          h("h5", {}, "Connect"),
          h("ul", {},
            h("li", {}, h("a", { href: `https://instagram.com/${STUDIO.instagram.replace(/^@/, "")}`, target: "_blank", rel: "noopener" }, "Instagram ↗")),
            h("li", {}, h("a", { href: `mailto:${STUDIO.email}` }, STUDIO.email)),
            h("li", { onclick: () => go("/contact") }, "Newsletter"),
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
    const photos = ALL_PIECES.map(p => p.photo).filter(Boolean);
    const tileRecipe = [
      { col: "1 / 3", row: "1", dy: 0.30 },
      { col: "3 / 5", row: "1", dy: 0.10 },
      { col: "5 / 7", row: "1", dy: 0.50 },
      { col: "1 / 2", row: "2", dy: 0.20 },
      { col: "2 / 4", row: "2", dy: 0.40 },
      { col: "4 / 5", row: "2", dy: 0.15 },
      { col: "5 / 7", row: "2", dy: 0.35 },
      { col: "1 / 3", row: "3", dy: 0.45 },
      { col: "3 / 5", row: "3", dy: 0.20 },
      { col: "5 / 7", row: "3", dy: 0.30 },
    ];
    const grid = h("div", { class: "grid" });
    if (photos.length > 0) {
      tileRecipe.forEach((t, i) => {
        const photo = photos[(i * 3 + 1) % photos.length];
        grid.append(h("div", {
          dataset: { dy: String(t.dy) },
          style: { gridColumn: t.col, gridRow: t.row, backgroundImage: `url("${photo}")` },
        }));
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

    // parallax
    const onScroll = () => {
      const y = window.scrollY;
      section.querySelectorAll("[data-dy]").forEach(el => {
        const dy = parseFloat(el.dataset.dy || "0");
        el.style.transform = `translate3d(0, ${y * dy * 0.4}px, 0)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    // remove listener when this section is removed
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
    const heroPhoto = (COLLECTIONS[0] && COLLECTIONS[0].cover) || "";
    return h("div", {},
      h("section", { class: "fb-about-hero" },
        h("div", {},
          h("div", { class: "fb-eyebrow" }, h("span", { class: "rule" }), "About the studio"),
          h("h1", { html: `Two pairs of <em>hands</em>.<br/>One open kiln.` }),
          h("p", { class: "lede" }, "We unite scientific curiosity with artistic innovation to create unique glass art that inspires and connects."),
        ),
        h("div", { class: "photo", style: { backgroundImage: heroPhoto ? `url("${heroPhoto}")` : "none" } }),
      ),
      h("article", { class: "fb-about-body" },
        h("p", {}, "The Flame Brush is a woman-owned partnership. We met in a chemistry lab and again at a glory hole. The first taught us why glass behaves; the second taught us how to make it sing."),
        h("p", {}, "Everything in our catalog began as a 2,000°F gather of soda-lime glass on the end of a steel rod. We layer color as ground frit, marver it, blow and shape it at the bench, and finally surrender each piece to a fourteen-hour anneal — the slow part where, if anything is going to crack, it does. Most of the time it doesn't."),
        h("div", { class: "pull" }, "As a woman-owned partnership, we are dedicated to uplifting the artistic community, fostering collaboration, and empowering women in creative and scientific fields."),
        h("p", {}, `We are based in a sunlit studio in ${STUDIO.location}. Our doors are open to visitors on Saturdays, and to apprentice glassblowers from local universities all year round. We host workshops, run open-bench nights, and contribute work to fundraisers for women in STEM.`),
        h("p", {}, "Through our craft, we strive to spark wonder, encourage learning, and build a vibrant, inclusive space where art and science flourish together. We hope you'll come blow a bubble with us sometime."),
      ),
      h("section", { class: "fb-values" },
        ...[
          ["i.",   "Slow craft.", "A 14-hour anneal is the difference between a vessel and a pile of pretty shards. We make as much as the kiln will allow — no more."],
          ["ii.",  "Open studio.", "We host apprentices, workshops, and open-bench nights for women and non-binary makers. The studio is louder when shared."],
          ["iii.", "One of one.",  "Every piece in every collection is unrepeatable — the next will be its cousin, never its twin. We sign the pontil and number the year."],
        ].map(([num, title, body]) =>
          h("div", { class: "v" },
            h("div", { class: "num" }, num),
            h("h4", {}, title),
            h("p", {}, body),
          )
        ),
      ),
    );
  }

  /* =========================================================
     CONTACT — uses mailto: (no backend required)
     ========================================================= */
  function contactPage(piecePrefill) {
    const form = h("form", { class: "fb-form", onsubmit: (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const subject = encodeURIComponent(`[${fd.get("inquiry") || "general"}] note from ${fd.get("name") || "a friend"}`);
      const lines = [
        `From: ${fd.get("name")} <${fd.get("email")}>`,
        fd.get("piece") ? `Piece: ${fd.get("piece")}` : null,
        `Inquiry: ${fd.get("inquiry")}`,
        "",
        fd.get("message"),
      ].filter(Boolean).join("\n");
      window.location.href = `mailto:${STUDIO.email}?subject=${subject}&body=${encodeURIComponent(lines)}`;
    }});

    form.append(
      h("div", { class: "row2" },
        h("div", { class: "field" }, h("label", {}, "Your name"), h("input", { type: "text", name: "name", required: true })),
        h("div", { class: "field" }, h("label", {}, "Email"), h("input", { type: "email", name: "email", required: true })),
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
              ["workshop", "Workshop / open studio"],
              ["press", "Press / collaboration"],
            ].forEach(([v, t]) => sel.append(h("option", { value: v, selected: piecePrefill && v === "purchase" }, t)));
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
          placeholder: "Tell us a little about what you're hoping for. Even a sentence is plenty.",
        }, piecePrefill ? `I'd like to inquire about purchasing "${piecePrefill}".` : ""),
      ),
      h("div", { class: "submit" },
        h("span", { class: "helper" }, "We typically reply within two business days."),
        h("button", { type: "submit", class: "fb-btn fb-btn-primary", html: `Send the note ${ICONS["arrow-right"]}` }),
      ),
    );

    return h("section", { class: "fb-contact" },
      h("div", { class: "left" },
        h("div", { class: "fb-eyebrow" }, h("span", { class: "rule" }), "Get in touch"),
        h("h1", { html: `Let's <em>talk</em>.` }),
        h("p", { class: "lede" }, "For purchase inquiries, custom commissions, press, workshops, or anything else — we read every note."),
        h("div", { class: "info" },
          h("div", { class: "row" }, h("span", { class: "k" }, "Studio"), h("span", { class: "v" }, STUDIO.address)),
          h("div", { class: "row" }, h("span", { class: "k" }, "Email"), h("span", { class: "v" }, STUDIO.email)),
          h("div", { class: "row" }, h("span", { class: "k" }, "Open"), h("span", { class: "v" }, STUDIO.hours)),
          h("div", { class: "row" }, h("span", { class: "k" }, "Instagram"), h("span", { class: "v" }, STUDIO.instagram)),
        ),
      ),
      h("div", { class: "right" }, form),
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
  }

  document.addEventListener("DOMContentLoaded", render);
})();
