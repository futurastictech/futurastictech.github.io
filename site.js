// Page wiring: writes every list from apps.js before the scroll engine mounts
// (the engine has to see the cards to drive them), then runs the Galaxy panel,
// the detail window and the ad slots.
(function () {
  var APPS = window.FT_APPS || [];
  var STORE = {
    ios: function (a) { return "https://apps.apple.com/app/id" + a.ios; },
    android: function (a) { return "https://play.google.com/store/apps/details?id=" + a.android; }
  };
  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var bySlug = {};
  APPS.forEach(function (a) { bySlug[a.slug] = a; });

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function tags(a, store) {
    var m = el("div", "meta");
    m.appendChild(el("span", "tag", a.genre));
    if (a.soon) m.appendChild(el("span", "tag tag--only", "Yakında"));
    else if (a.isNew) m.appendChild(el("span", "tag tag--new", "Yeni"));
    // Someone on the wrong phone should find out here, not after a trip to the store.
    if (store === "ios" && a.ios && !a.android) m.appendChild(el("span", "tag tag--only", "Sadece iOS"));
    if (store === "android" && a.android && !a.ios) m.appendChild(el("span", "tag tag--only", "Sadece Android"));
    if (a.play) m.appendChild(el("span", "tag tag--only", "Tarayıcıda oyna"));
    return m;
  }
  function opener(node, a) {
    node.type = "button";
    node.addEventListener("click", function () { openDetail(a.slug); });
    node.setAttribute("aria-haspopup", "dialog");
  }

  // ------------------------------------------------------- App Store rail
  var onIos = function (a) { return a.ios || a.soon; };
  var onAndroid = function (a) { return !!a.android; };
  var rail = document.getElementById("ios-rail");
  var end = rail.querySelector(".rail__end");
  var iosCount = 0;
  [["oyun", "Oyunlar"], ["uygulama", "Uygulamalar"]].forEach(function (g) {
    var list = APPS.filter(function (a) { return a.kind === g[0] && onIos(a); });
    if (!list.length) return;
    var head = el("div", "rail__group");
    head.appendChild(el("h3", "group-title", g[1]));
    head.appendChild(el("p", "rail__group-count", list.length + " yapım"));
    rail.insertBefore(head, end);
    list.forEach(function (a) {
      if (a.ios) iosCount++;
      var card = el("button", "card");
      opener(card, a);
      var art = el("div", "card__art");
      art.setAttribute("data-sc-tilt", "7");
      var img = el("img");
      img.src = a.icon; img.alt = ""; img.width = 256; img.height = 256; img.loading = "lazy";
      art.appendChild(img);
      var txt = el("div");
      txt.appendChild(el("p", "card__name", a.name));
      txt.appendChild(el("p", "card__blurb", a.blurb));
      card.appendChild(art);
      card.appendChild(txt);
      card.appendChild(tags(a, "ios"));
      rail.insertBefore(card, end);
    });
  });
  // The pan act wants roughly a viewport-height per few cards, plus one.
  var railItems = rail.children.length;
  document.getElementById("app-store").setAttribute("data-sc-span", String(Math.max(3, 1 + railItems * 0.42).toFixed(2)));

  // ------------------------------------------------------ Google Play grid
  var androidCount = 0;
  [["oyun", "android-games"], ["uygulama", "android-apps"]].forEach(function (g) {
    var ul = document.getElementById(g[1]);
    var list = APPS.filter(function (a) { return a.kind === g[0] && onAndroid(a); });
    document.getElementById(g[1] + "-count").textContent = list.length;
    list.forEach(function (a) {
      androidCount++;
      var li = el("li");
      var row = el("button", "row");
      opener(row, a);
      var img = el("img");
      img.src = a.icon; img.alt = ""; img.width = 74; img.height = 74; img.loading = "lazy";
      var txt = el("div");
      txt.appendChild(el("p", "row__name", a.name));
      txt.appendChild(tags(a, "android"));
      row.appendChild(img);
      row.appendChild(txt);
      row.appendChild(el("span", "row__go", "↗"));
      li.appendChild(row);
      ul.appendChild(li);
    });
  });

  document.getElementById("ios-count").textContent = iosCount;
  document.getElementById("android-count").textContent = androidCount;
  document.getElementById("total-count").textContent = APPS.filter(function (a) { return a.ios || a.android; }).length;
  document.getElementById("ios-label").textContent = iosCount;
  document.getElementById("android-label").textContent = androidCount;

  // ------------------------------------------------------- support pages
  var sup = document.getElementById("support-list");
  APPS.forEach(function (a) {
    if (!a.pages) return;
    var li = el("li");
    li.appendChild(el("span", "who", a.name));
    var links = a.intro === false ? [] : [["Tanıtım", ""]];
    links.push(["Gizlilik", "privacy-policy.html"], ["Destek", "support.html"]);
    links.forEach(function (p) {
      var l = el("a", null, p[0]);
      l.href = a.pages + "/" + p[1];
      li.appendChild(l);
    });
    sup.appendChild(li);
  });

  // ----------------------------------------------------- Galaxy index/lock
  // world.js reports which tile passed the reticle; with no WebGL the same
  // panel follows scroll position directly.
  var withIcon = APPS.filter(function (a) { return a.icon; });
  var index = document.getElementById("galaxy-index");
  var galaxy = document.getElementById("galaksi");
  var buttons = withIcon.map(function (a, k) {
    var li = el("li");
    var b = el("button", null, a.name.split(":")[0]);
    b.type = "button";
    b.addEventListener("click", function () {
      var travel = galaxy.offsetHeight - innerHeight;
      var top = galaxy.getBoundingClientRect().top + scrollY;
      scrollTo({ top: top + travel * (k / Math.max(withIcon.length - 1, 1)) + 2, behavior: reduceMotion ? "auto" : "smooth" });
    });
    li.appendChild(b);
    index.appendChild(li);
    return b;
  });

  var lock = document.getElementById("lock");
  var reticle = document.querySelector(".reticle");
  var current = null, swapTimer = 0;
  function showLock(k) {
    var a = withIcon[k];
    buttons.forEach(function (b, i) { b.setAttribute("aria-current", i === k ? "true" : "false"); });
    reticle.classList.toggle("is-locked", !!a);
    if (!a || a === current) return;
    current = a;
    document.getElementById("reticle-icon").src = a.icon;
    lock.classList.add("is-swapping");
    clearTimeout(swapTimer);
    swapTimer = setTimeout(function () {
      document.getElementById("lock-genre").textContent = "Kilitlendi · " + (a.kind === "oyun" ? "Oyun" : "Uygulama");
      document.getElementById("lock-name").textContent = a.name;
      document.getElementById("lock-blurb").textContent = a.blurb;
      var st = document.getElementById("lock-stores");
      st.textContent = "";
      var more = el("button", "chip chip--on chip--cta", "Ayrıntılar");
      opener(more, a);
      st.appendChild(more);
      [["ios", "App Store"], ["android", "Google Play"]].forEach(function (p) {
        if (a[p[0]]) {
          var l = el("a", "chip chip--on", p[1]);
          l.href = STORE[p[0]](a); l.rel = "noopener"; l.target = "_blank";
          st.appendChild(l);
        } else {
          st.appendChild(el("span", "chip chip--off", a.soon ? p[1] + " yakında" : p[1] + " yok"));
        }
      });
      lock.classList.remove("is-swapping");
    }, 140);
  }
  addEventListener("ft:lock", function (e) { if (e.detail.index >= 0) showLock(e.detail.index); else reticle.classList.remove("is-locked"); });
  function fallbackLock() {
    if (document.documentElement.classList.contains("has-webgl")) return;
    var r = galaxy.getBoundingClientRect();
    var p = Math.min(1, Math.max(0, -r.top / Math.max(galaxy.offsetHeight - innerHeight, 1)));
    showLock(Math.round(p * (withIcon.length - 1)));
  }
  addEventListener("scroll", fallbackLock, { passive: true });
  showLock(0);

  // --------------------------------------------------------- nav current
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".bar__nav a"));
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (l) { l.setAttribute("aria-current", l.getAttribute("href") === "#" + en.target.id ? "true" : "false"); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["galaksi", "app-store", "google-play", "destek"].forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  // ------------------------------------------------------- detail window
  var dlg = document.getElementById("detail");
  var player = document.getElementById("player");
  var frame = document.getElementById("player-frame");
  var lastFocus = null;
  function openDetail(slug, fromHash) {
    var a = bySlug[slug];
    if (!a || !dlg.showModal) return;
    lastFocus = document.activeElement;
    var icon = document.getElementById("detail-icon");
    icon.src = a.icon; icon.alt = a.name + " simgesi";
    document.getElementById("detail-meta").textContent =
      (a.kind === "oyun" ? "Oyun" : "Uygulama") + " · " + a.genre + (a.soon ? " · Yakında" : a.isNew ? " · Yeni" : "");
    document.getElementById("detail-name").textContent = a.name;
    document.getElementById("detail-blurb").textContent = a.blurb;
    document.getElementById("detail-desc").textContent = a.desc;

    var shots = document.getElementById("detail-shots");
    shots.textContent = "";
    (a.shots || []).forEach(function (s, i) {
      var im = el("img");
      im.src = "shots/" + s + ".webp"; im.alt = a.name + " ekran görüntüsü " + (i + 1); im.loading = "lazy"; im.decoding = "async";
      shots.appendChild(im);
    });

    var act = document.getElementById("detail-actions");
    act.textContent = "";
    if (a.play) {
      var pb = el("button", "cta cta--play", "Tarayıcıda oyna");
      pb.type = "button";
      pb.addEventListener("click", function () { startPlay(a); });
      act.appendChild(pb);
    }
    [["ios", "App Store'da aç"], ["android", "Google Play'de aç"]].forEach(function (p, i) {
      if (!a[p[0]]) return;
      var l = el("a", "cta" + (a.play || i > 0 && a.ios ? " cta--ghost" : ""), p[1]);
      l.href = STORE[p[0]](a); l.rel = "noopener"; l.target = "_blank";
      act.appendChild(l);
    });
    if (a.soon) act.appendChild(el("p", "detail__soon", "Henüz mağazada değil. Çıktığı gün burada olacak."));

    var pg = document.getElementById("detail-pages");
    pg.textContent = "";
    if (a.pages) {
      var links = a.intro === false ? [] : [["Tanıtım sayfası", ""]];
      links.push(["Gizlilik", "privacy-policy.html"], ["Destek", "support.html"]);
      links.forEach(function (p) { var l = el("a", null, p[0]); l.href = a.pages + "/" + p[1]; pg.appendChild(l); });
    }

    stopPlay();
    dlg.showModal();
    dlg.scrollTop = 0;
    document.documentElement.classList.add("has-dialog");
    if (!fromHash) history.replaceState(null, "", "#oyun/" + a.slug);
  }
  function startPlay(a) {
    frame.src = a.play;
    player.hidden = false;
    dlg.classList.add("is-playing");
    // The details panel (and the heading the dialog is named by) is hidden
    // while playing, so the dialog takes its own name for that time.
    dlg.removeAttribute("aria-labelledby");
    dlg.setAttribute("aria-label", a.name + ", tarayıcıda oynanıyor");
    setTimeout(function () { frame.focus(); }, 60);
  }
  function stopPlay() {
    if (player.hidden) return;
    player.hidden = true;
    frame.src = "about:blank";
    dlg.classList.remove("is-playing");
    dlg.removeAttribute("aria-label");
    dlg.setAttribute("aria-labelledby", "detail-name");
    var back = dlg.querySelector(".cta--play");
    if (back && dlg.open) back.focus();
  }
  dlg.addEventListener("close", function () {
    stopPlay();
    document.documentElement.classList.remove("has-dialog");
    if (location.hash.indexOf("#oyun/") === 0) history.replaceState(null, "", location.pathname + location.search);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  });
  dlg.addEventListener("click", function (e) {
    if (e.target === dlg || e.target.closest("[data-close]")) dlg.close();
    if (e.target.closest("[data-close-player]")) stopPlay();
  });
  function fromHash() {
    var m = /^#oyun\/([\w-]+)/.exec(location.hash);
    if (m) openDetail(m[1], true);
  }
  addEventListener("hashchange", fromHash);
  window.FT_openDetail = openDetail;
  setTimeout(fromHash, 0);

  // --------------------------------------------------------------- ads
  // AdSense is loaded only when a publisher id is configured in apps.js.
  var ADS = window.FT_ADS || {};
  if (ADS.client) {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(ADS.client);
    s.crossOrigin = "anonymous";
    document.head.appendChild(s);
    Array.prototype.forEach.call(document.querySelectorAll("[data-ad]"), function (box) {
      var slot = ADS.slots && ADS.slots[box.getAttribute("data-ad")];
      if (!slot) return;
      box.hidden = false;
      box.appendChild(el("p", "ad__label", "Reklam"));
      var ins = el("ins", "adsbygoogle");
      ins.style.display = "block";
      ins.setAttribute("data-ad-client", ADS.client);
      ins.setAttribute("data-ad-slot", slot);
      ins.setAttribute("data-ad-format", "auto");
      ins.setAttribute("data-full-width-responsive", "true");
      box.appendChild(ins);
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    });
  }
})();
