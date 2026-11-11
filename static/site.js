// The browser's half: filters and distance over /filters/*.json, compare, search,
// the map, and taking down an offer past its date on a page built before then.
// Source text only ever goes in through textContent.
(function () {
  "use strict";
  var el = function (tag, props, kids) {
    var n = document.createElement(tag);
    Object.assign(n, props || {});
    (kids || []).forEach(function (k) { n.append(k); });
    return n;
  };
  var getJson = function (name) {
    return fetch("/filters/" + name + ".json").then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  };
  var query = new URLSearchParams(location.search);

  // An offer past its end date never shows as current, even on an old page.
  var today = new Date().toLocaleDateString("en-CA");
  document.querySelectorAll("[data-ends]").forEach(function (n) {
    if (!n.dataset.ends || n.dataset.ends >= today) return;
    var section = n.closest("section");
    n.remove();
    if (section && !section.querySelector("[data-ends]")) {
      var none = document.createElement("p");
      none.textContent = "No offers are running at the moment.";
      section.append(none);
    }
  });

  // ---- Distance ----
  function miles(a, b) {
    var rad = Math.PI / 180;
    var h = Math.pow(Math.sin(((b[0] - a[0]) * rad) / 2), 2) + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.pow(Math.sin(((b[1] - a[1]) * rad) / 2), 2);
    return 2 * 3958.8 * Math.asin(Math.sqrt(h));
  }
  var nearest = function (c, point) {
    return c.points.reduce(function (best, p) { return Math.min(best, miles(point, p)); }, Infinity);
  };

  // ---- Search, anywhere: Command K. An instant index by type, and Pagefind's words where a site is built ----
  (function () {
    var LABELS = { zipnear: "ZIP code", offer: "Offers", service: "Services", guarantee: "Guarantees", company: "Companies", area: "Areas", zip: "ZIP codes", brand: "Brands", page: "Also mentioned on" };
    var ORDER = ["zipnear", "offer", "service", "guarantee", "company", "area", "zip", "brand", "page"];
    var SAMPLE = { offer: 3, service: 4, guarantee: 3, area: 4, zip: 3 };
    var index = null;
    var dialog = null;
    var input = null;
    var box = null;
    var rows = [];
    var active = 0;
    var typed = 0;
    var isMac = /Mac|iPhone|iPad/.test(navigator.platform);
    document.querySelectorAll("[data-search-key]").forEach(function (k) { k.textContent = isMac ? "\u2318K" : "Ctrl K"; });

    function words(s) { return String(s).toLowerCase().replace(/[^a-z0-9$%]+/g, " ").trim(); }
    function score(item, terms) {
      var name = words(item.n);
      var all = name + " " + words(item.s || "") + " " + words(item.k || "");
      var total = 0;
      for (var i = 0; i < terms.length; i++) {
        var t = terms[i];
        if (all.indexOf(t) < 0) return 0;
        total += name.indexOf(t) === 0 ? 5 : (" " + name).indexOf(" " + t) >= 0 ? 3 : name.indexOf(t) >= 0 ? 2 : 1;
      }
      return total;
    }
    function draw(groups, empty, order) {
      rows = [];
      var kids = [];
      (order || ORDER).forEach(function (type) {
        var list = groups[type];
        if (!list || !list.length) return;
        kids.push(el("p", { textContent: LABELS[type], className: "px-3 pt-4 pb-1 text-label font-semibold text-ink-3", role: "presentation" }));
        list.forEach(function (item) {
          var i = rows.length;
          var a = el("a", { href: item.p, id: "search-row-" + i, className: "flex items-baseline justify-between gap-4 rounded-control px-3 py-2 no-underline max-sm:flex-col max-sm:gap-0" }, [
            el("span", { textContent: item.n, className: "min-w-0 max-w-full truncate font-medium text-ink" }),
            el("span", { textContent: item.s || "", className: "shrink-0 max-w-[45%] truncate text-label text-ink-3 max-sm:max-w-full" })
          ]);
          a.setAttribute("role", "option");
          a.addEventListener("mousemove", function () { if (active !== i) mark(i); });
          rows.push(a);
          kids.push(a);
        });
      });
      if (!rows.length) kids.push(el("p", { textContent: empty || "Nothing matches that yet. Try a service, an offer or a ZIP code.", className: "px-3 py-8 text-center text-ink-2" }));
      box.replaceChildren.apply(box, kids);
      mark(0);
    }
    function mark(i) {
      if (rows[active]) { rows[active].classList.remove("bg-panel"); rows[active].setAttribute("aria-selected", "false"); }
      active = i;
      if (!rows[i]) { input.removeAttribute("aria-activedescendant"); return; }
      rows[i].classList.add("bg-panel");
      rows[i].setAttribute("aria-selected", "true");
      rows[i].scrollIntoView({ block: "nearest" });
      input.setAttribute("aria-activedescendant", rows[i].id);
    }
    function sample() {
      var groups = {};
      (index || []).forEach(function (item) {
        groups[item.t] = groups[item.t] || [];
        if (SAMPLE[item.t] && groups[item.t].length < SAMPLE[item.t]) groups[item.t].push(item);
      });
      draw(groups);
    }
    function find(q) {
      var mine = ++typed;
      var terms = words(q).split(" ").filter(Boolean);
      var groups = {};
      if (/^\d{5}$/.test(q.trim())) groups.zipnear = [{ n: "Companies near " + q.trim(), s: "Sorted by distance", p: "/companies?zip=" + q.trim() }];
      var scored = (index || []).map(function (item) { return [score(item, terms), item]; }).filter(function (x) { return x[0]; }).sort(function (x, y) { return y[0] - x[0]; });
      // The group holding the best match comes first, so a place name leads with the place.
      var best = { zipnear: Infinity };
      scored.forEach(function (x) {
        var g = groups[x[1].t] = groups[x[1].t] || [];
        if (g.length < 5) g.push(x[1]);
        best[x[1].t] = Math.max(best[x[1].t] || 0, x[0]);
      });
      var order = ORDER.slice().sort(function (a, b) { return (best[b] || 0) - (best[a] || 0); });
      draw(groups, null, order);
      if (q.trim().length < 3) return;
      // Words inside the pages. A site still in dev has no index, and the instant results stand alone.
      import("/pagefind/pagefind.js").then(function (pf) {
        return pf.debouncedSearch(q, {}, 150).then(function (r) {
          if (!r || mine !== typed) return;
          return Promise.all(r.results.slice(0, 3).map(function (x) { return x.data(); })).then(function (pages) {
            if (mine !== typed) return;
            var seen = {};
            Object.keys(groups).forEach(function (t) { groups[t].forEach(function (x) { seen[x.p] = 1; }); });
            groups.page = pages.map(function (d) {
              return { n: d.meta.title || d.url, s: "Mentions “" + q.trim() + "”", p: d.url.replace(/\.html$/, "") };
            }).filter(function (x) { return !seen[x.p]; });
            var keep = active;
            draw(groups, null, order);
            mark(Math.min(keep, rows.length - 1));
          });
        });
      }).catch(function () {});
    }
    function build() {
      dialog = el("dialog", { className: "m-auto mt-[10vh] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-card bg-surface p-0 text-ink shadow-lift backdrop:bg-night/50 max-sm:mt-0 max-sm:h-dvh max-sm:max-h-none max-sm:w-full max-sm:max-w-none max-sm:rounded-none" });
      dialog.setAttribute("aria-label", "Search");
      input = el("input", { type: "search", placeholder: "Search offers, services, companies, ZIP codes", className: "min-w-0 grow bg-transparent py-4 text-lede outline-none [&::-webkit-search-cancel-button]:hidden" });
      input.setAttribute("role", "combobox");
      input.setAttribute("aria-expanded", "true");
      input.setAttribute("aria-controls", "search-results");
      input.setAttribute("aria-label", "Search");
      input.autocomplete = "off";
      var close = el("button", { type: "button", textContent: "Esc", className: "rounded bg-panel px-2 py-1 text-label text-ink-2 hover:text-ink" });
      close.addEventListener("click", function () { dialog.close(); });
      box = el("div", { id: "search-results", className: "max-h-[60vh] overflow-y-auto px-2 pb-2 max-sm:max-h-none max-sm:grow" });
      box.setAttribute("role", "listbox");
      box.setAttribute("aria-label", "Results");
      var foot = el("p", { textContent: "\u2191\u2193 to move, \u21B5 to open", className: "border-t border-line px-5 py-2 text-label text-ink-3 max-sm:hidden" });
      dialog.append(
        el("div", { className: "flex h-full flex-col" }, [
          el("div", { className: "flex items-center gap-3 border-b border-line px-5" }, [input, close]),
          box,
          foot
        ])
      );
      document.body.append(dialog);
      dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
      input.addEventListener("input", function () { input.value.trim() ? find(input.value) : sample(); });
      input.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown") { e.preventDefault(); if (rows.length) mark((active + 1) % rows.length); }
        else if (e.key === "ArrowUp") { e.preventDefault(); if (rows.length) mark((active - 1 + rows.length) % rows.length); }
        else if (e.key === "Enter" && rows[active]) { e.preventDefault(); location.href = rows[active].href; }
      });
    }
    function open() {
      if (!dialog) build();
      if (dialog.open) return;
      dialog.showModal();
      input.value = "";
      input.focus();
      if (index) return sample();
      draw({}, "Loading...");
      getJson("search").then(function (list) { index = list || []; if (!input.value.trim()) sample(); else find(input.value); });
    }
    document.querySelectorAll("[data-search-open]").forEach(function (a) {
      a.addEventListener("click", function (e) { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); open(); });
    });
    document.addEventListener("keydown", function (e) {
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialog && dialog.open) dialog.close();
        else open();
      } else if (e.key === "/" && !typing && !(dialog && dialog.open)) {
        e.preventDefault();
        open();
      }
    });
  })();

  // ---- A company's request form: its page is static, so it asks for its spam stamp ----
  var leadForm = document.querySelector("[data-lead-form]");
  if (leadForm) {
    fetch("/request/stamp").then(function (r) { return r.json(); }).then(function (j) { leadForm.querySelector('[name="_started"]').value = j.stamp; }).catch(function () {});
  }

  // Filters stand open on a desktop, and fold behind one button on a phone so results come first.
  var drawer = document.querySelector("[data-filter-drawer]");
  if (drawer && window.matchMedia("(min-width: 64rem)").matches) drawer.open = true;

  // ---- The map: pins cluster as they crowd, and follow what the list shows ----
  function drawMap(node, companies, areaPath) {
    var ACCENT = "#0a6650";
    var live = null;
    var wanted = companies;
    function features(list) {
      return { type: "FeatureCollection", features: list.flatMap(function (c) {
        return c.points.map(function (p) { return { type: "Feature", geometry: { type: "Point", coordinates: [p[1], p[0]] }, properties: { name: c.name, path: c.path } }; });
      }) };
    }
    function fit(map, list) {
      var box = new window.maplibregl.LngLatBounds();
      list.forEach(function (c) { c.points.forEach(function (p) { box.extend([p[1], p[0]]); }); });
      if (!box.isEmpty()) map.fitBounds(box, { padding: 48, maxZoom: 13, duration: 0 });
    }
    var s = document.createElement("script");
    s.src = "/maplibre/maplibre-gl.js";
    s.onload = function () {
      var map = new window.maplibregl.Map({ container: node, style: "https://tiles.openfreemap.org/styles/positron", cooperativeGestures: true });
      fit(map, wanted);
      map.on("load", function () {
        map.addSource("companies", { type: "geojson", data: features(wanted), cluster: true, clusterRadius: 42, clusterMaxZoom: 12 });
        map.addLayer({ id: "clusters", type: "circle", source: "companies", filter: ["has", "point_count"], paint: { "circle-color": ACCENT, "circle-radius": ["step", ["get", "point_count"], 15, 10, 19, 30, 24], "circle-stroke-color": "#ffffff", "circle-stroke-width": 2 } });
        map.addLayer({ id: "cluster-count", type: "symbol", source: "companies", filter: ["has", "point_count"], layout: { "text-field": ["get", "point_count_abbreviated"], "text-font": ["Noto Sans Regular"], "text-size": 13, "text-allow-overlap": true }, paint: { "text-color": "#ffffff" } });
        map.addLayer({ id: "points", type: "circle", source: "companies", filter: ["!", ["has", "point_count"]], paint: { "circle-color": ACCENT, "circle-radius": 7, "circle-stroke-color": "#ffffff", "circle-stroke-width": 2 } });
        map.on("click", "clusters", function (e) {
          var f = map.queryRenderedFeatures(e.point, { layers: ["clusters"] })[0];
          map.getSource("companies").getClusterExpansionZoom(f.properties.cluster_id).then(function (zoom) { map.easeTo({ center: f.geometry.coordinates, zoom: zoom }); });
        });
        map.on("click", "points", function (e) {
          var f = e.features[0];
          new window.maplibregl.Popup({ offset: 10 }).setLngLat(f.geometry.coordinates).setDOMContent(el("a", { href: f.properties.path, textContent: f.properties.name })).addTo(map);
        });
        ["clusters", "points"].forEach(function (id) {
          map.on("mouseenter", id, function () { map.getCanvas().style.cursor = "pointer"; });
          map.on("mouseleave", id, function () { map.getCanvas().style.cursor = ""; });
        });
        live = map;
        map.getSource("companies").setData(features(wanted));
        if (areaPath) {
          getJson("area-shapes").then(function (shapes) {
            var ring = shapes && shapes[areaPath];
            if (!ring) return;
            map.addSource("area", { type: "geojson", data: { type: "Feature", geometry: { type: "Polygon", coordinates: [ring] }, properties: {} } });
            map.addLayer({ id: "area", type: "fill", source: "area", paint: { "fill-color": ACCENT, "fill-opacity": 0.08 } }, "clusters");
            map.addLayer({ id: "area-line", type: "line", source: "area", paint: { "line-color": ACCENT, "line-width": 1.5 } }, "clusters");
          });
        }
      });
      node.mapResize = function () { map.resize(); fit(map, wanted); };
    };
    document.head.append(s);
    return function (list) {
      wanted = list;
      if (!live) return;
      live.getSource("companies").setData(features(list));
      fit(live, list);
    };
  }

  // ---- Companies: filters and sort, with a shareable address ----
  var companyForm = document.querySelector("[data-company-filters]");
  var mapNodes = document.querySelectorAll("[data-map]");
  if (companyForm || mapNodes.length) {
    getJson("list-companies").then(function (list) {
      if (!list) return;
      if (!companyForm) {
        var slug = location.pathname.startsWith("/companies/") ? location.pathname.split("/")[2] : null;
        mapNodes.forEach(function (node) {
          var area = node.dataset.area;
          var here = slug ? list.filter(function (c) { return c.slug === slug; }) : area ? list.filter(function (c) { return c.areas.includes(area) || c.serves.includes(area); }) : list;
          drawMap(node, here, area);
        });
        return;
      }
      var showOnMap = mapNodes[0] ? drawMap(mapNodes[0], list) : function () {};
      var mapToggle = document.querySelector("[data-map-toggle]");
      if (mapToggle) {
        mapToggle.addEventListener("click", function () {
          var frame = document.querySelector("[data-map-frame]");
          var open = frame.classList.toggle("hidden") === false;
          mapToggle.textContent = open ? "Hide map" : "Show map";
          mapToggle.setAttribute("aria-expanded", String(open));
          if (open && mapNodes[0].mapResize) mapNodes[0].mapResize();
        });
      }
      var ul = document.querySelector("[data-company-list]");
      var rows = {};
      ul.querySelectorAll("[data-slug]").forEach(function (li) { rows[li.dataset.slug] = li; });
      var count = document.querySelector("[data-count]");
      var note = document.querySelector("[data-sort-note]");
      var zipInput = companyForm.querySelector("[data-zip]");
      var selects = companyForm.querySelectorAll("[data-filter]");
      var boxes = companyForm.querySelectorAll("[data-has]");
      var sortSel = companyForm.querySelector("[data-sort]");
      var zips = null;
      var NOTES = { offers: "", name: "", years: "Longest in business first.", rating: "Highest Google rating first." };
      var PAGE = 24;
      var shown = PAGE;
      var NEARBY_MILES = 20;
      var moreBtn = document.querySelector("[data-more]");
      var none = document.querySelector("[data-none]");
      var activeCount = document.querySelector("[data-active-count]");
      var clears = document.querySelectorAll("[data-clear]");
      var formClear = companyForm.querySelector("[data-clear]");

      /** A company serves a ZIP when it is based there, or based in or names one of its cities. */
      function serves(c, hit) {
        return c.postcodes.includes(hit[0]) || hit[3].some(function (a) { return c.areas.includes(a) || c.serves.includes(a); });
      }

      function apply(keepShown) {
        if (keepShown !== true) shown = PAGE;
        var point = null;
        var hit = null;
        var z = zipInput && zipInput.value.trim();
        if (z && z.length === 5 && zips) {
          hit = zips.find(function (x) { return x[0] === z; });
          if (hit) point = [hit[1], hit[2]];
        }
        var picked = list.filter(function (c) {
          if (hit && !serves(c, hit) && nearest(c, point) > NEARBY_MILES) return false;
          for (var i = 0; i < selects.length; i++) {
            var s = selects[i];
            if (!s.value) continue;
            if (s.dataset.filter === "areas") {
              if (!c.areas.includes(s.value) && !c.serves.includes(s.value)) return false;
            } else if (!(c[s.dataset.filter] || []).includes(s.value)) return false;
          }
          for (var j = 0; j < boxes.length; j++) if (boxes[j].checked && !c[boxes[j].dataset.has]) return false;
          return true;
        });
        var sort = sortSel.value;
        var by = {
          name: function (a, b) { return a.name.localeCompare(b.name); },
          offers: function (a, b) { return (b.offers > 0) - (a.offers > 0) || a.name.localeCompare(b.name); },
          years: function (a, b) { return (b.years == null ? -1 : b.years) - (a.years == null ? -1 : a.years); },
          rating: function (a, b) { return (b.rating ? b.rating.rating : -1) - (a.rating ? a.rating.rating : -1) || (b.rating ? b.rating.count : 0) - (a.rating ? a.rating.count : 0); }
        }[sort];
        // Those that serve the ZIP come first, with offers first among them; then whoever else is close, nearest first.
        picked.sort(hit ? function (a, b) {
          return serves(b, hit) - serves(a, hit) || (serves(a, hit) ? by(a, b) : nearest(a, point) - nearest(b, point));
        } : by);
        ul.replaceChildren.apply(ul, picked.slice(0, shown).map(function (c) { return rows[c.slug]; }).filter(Boolean));
        moreBtn.hidden = picked.length <= shown;
        moreBtn.textContent = "Show more (" + (picked.length - shown) + " left)";
        none.hidden = picked.length > 0;
        showOnMap(picked);
        var active = 0;
        selects.forEach(function (s) { if (s.value) active++; });
        boxes.forEach(function (b) { if (b.checked) active++; });
        if (z) active++;
        activeCount.textContent = active ? "(" + active + ")" : "";
        formClear.hidden = !active;
        var serving = hit ? picked.filter(function (c) { return serves(c, hit); }).length : 0;
        count.textContent = hit
          ? serving + (serving === 1 ? " company serves " : " companies serve ") + z + (picked.length > serving ? ", and " + (picked.length - serving) + " more nearby" : "")
          : picked.length + (picked.length === 1 ? " company" : " companies") + (z && z.length === 5 && zips ? ". We don't have ZIP " + z + " on our list" : "");
        note.textContent = NOTES[sort];
        // The address holds the filters, so a filtered view can be shared.
        var q = new URLSearchParams();
        selects.forEach(function (s) { if (s.value) q.set(s.dataset.filter, s.value); });
        boxes.forEach(function (b) { if (b.checked) q.set(b.dataset.has, "1"); });
        if (sort !== "offers") q.set("sort", sort);
        if (z) q.set("zip", z);
        var qs = q.toString();
        history.replaceState(null, "", location.pathname + (qs ? "?" + qs : ""));
      }

      selects.forEach(function (s) { if (query.get(s.dataset.filter)) s.value = query.get(s.dataset.filter); });
      boxes.forEach(function (b) { b.checked = query.get(b.dataset.has) === "1"; });
      if (query.get("sort")) sortSel.value = query.get("sort");
      if (zipInput && query.get("zip")) zipInput.value = query.get("zip");
      companyForm.addEventListener("input", function () { apply(); });
      moreBtn.addEventListener("click", function () { shown += PAGE; apply(true); });
      clears.forEach(function (b) {
        b.addEventListener("click", function () {
          selects.forEach(function (s) { s.value = ""; });
          boxes.forEach(function (x) { x.checked = false; });
          if (zipInput) zipInput.value = "";
          apply();
        });
      });
      companyForm.addEventListener("submit", function (e) { e.preventDefault(); });
      getJson("zips").then(function (z) { zips = z || []; apply(); });
      apply();
    });
  }

  // ---- Compare: up to three, side by side ----
  var compareNode = document.querySelector("[data-compare]");
  if (compareNode) {
    getJson("list-companies").then(function (list) {
      if (!list) return;
      var names = document.getElementById("company-names");
      list.forEach(function (c) { names.append(el("option", { value: c.name })); });
      var chosen = (query.get("c") || "").split(",").filter(function (s) { return list.some(function (c) { return c.slug === s; }); }).slice(0, 3);
      var ROWS = [
        ["Google rating", function (c) { return c.rating ? c.rating.rating.toFixed(1) + (c.rating.count != null ? " from " + c.rating.count.toLocaleString("en-US") + " reviews" : "") : ""; }],
        ["Current offers", function (c) { return c.offers ? String(c.offers) : ""; }],
        ["Services", function (c) { return c.services.join(", "); }],
        ["Brands", function (c) { return c.brands.join(", "); }],
        ["Years in business", function (c) { return c.years != null ? String(c.years) : ""; }],
        ["Cities", function (c) { return c.cities.join(", "); }],
        ["Phone", function (c) { return c.phone || ""; }]
      ];
      function draw() {
        var cs = chosen.map(function (s) { return list.find(function (c) { return c.slug === s; }); });
        history.replaceState(null, "", location.pathname + (chosen.length ? "?c=" + chosen.join(",") : ""));
        if (!cs.length) return compareNode.replaceChildren(el("p", { textContent: "Add a company to start.", className: "text-ink-2" }));
        var head = el("tr", { className: "border-b border-line-strong" }, [el("th", { scope: "col" })].concat(cs.map(function (c) {
          var remove = el("button", { type: "button", textContent: "Remove", className: "text-label font-normal underline" });
          remove.addEventListener("click", function () { chosen = chosen.filter(function (s) { return s !== c.slug; }); draw(); });
          return el("th", { scope: "col", className: "py-2 pr-4 text-left align-top" }, [el("a", { href: c.path, textContent: c.name, className: "font-body text-title" }), el("br"), remove]);
        })));
        // Guarantees line up by kind, so parts sits across from parts.
        var kinds = [];
        cs.forEach(function (c) { c.terms.forEach(function (t) { if (kinds.indexOf(t.kind) < 0) kinds.push(t.kind); }); });
        kinds.sort(function (a, b) { return (a === "other") - (b === "other") || a.localeCompare(b); });
        var rowsNow = ROWS.slice(0, 2).concat(kinds.map(function (k) {
          return [k === "other" ? "Other promises" : k.charAt(0).toUpperCase() + k.slice(1) + " guarantee", function (c) { return c.terms.filter(function (t) { return t.kind === k; }).map(function (t) { var x = t.text || "Offered"; return x.charAt(0).toUpperCase() + x.slice(1); }).join("\n"); }];
        }), ROWS.slice(2));
        var body = rowsNow.map(function (r) {
          return el("tr", { className: "border-b border-line align-top" }, [el("th", { scope: "row", textContent: r[0], className: "py-2 pr-4 text-left font-semibold whitespace-nowrap" })].concat(cs.map(function (c) {
            var v = r[1](c);
            return el("td", { textContent: v || "not stated", className: "whitespace-pre-line py-2 pr-4 " + (v ? "" : "text-ink-3") });
          })));
        });
        compareNode.replaceChildren(el("table", { className: "w-full min-w-[36rem] border-collapse" }, [el("thead", {}, [head]), el("tbody", {}, body)]));
      }
      document.querySelector("[data-compare-pick]").addEventListener("submit", function (e) {
        e.preventDefault();
        var input = document.querySelector("[data-compare-input]");
        var hit = list.find(function (c) { return c.name.toLowerCase() === input.value.trim().toLowerCase(); });
        if (hit && !chosen.includes(hit.slug) && chosen.length < 3) chosen.push(hit.slug);
        input.value = "";
        draw();
      });
      draw();
    });
  }

  // ---- Search: Pagefind over dist/; a ZIP goes to the companies list ----
  var results = document.querySelector("[data-search-results]");
  if (results) {
    var q = query.get("q") || "";
    var box = document.querySelector("[data-search-input]");
    var said = document.querySelector("[data-search-count]");
    box.value = q;
    if (q) {
      import("/pagefind/pagefind.js").then(function (pf) {
        return pf.search(q).then(function (r) {
          said.textContent = r.results.length + (r.results.length === 1 ? " result" : " results");
          return Promise.all(r.results.slice(0, 30).map(function (x) { return x.data(); })).then(function (rows) {
            results.replaceChildren.apply(results, rows.map(function (d) {
              return el("li", { className: "border-b border-line py-3" }, [el("a", { href: d.url.replace(/\.html$/, ""), textContent: d.meta.title || d.url, className: "font-body text-title" }), el("p", { textContent: d.excerpt.replace(/<[^>]+>/g, ""), className: "text-ink-2" })]);
            }));
          });
        });
      }).catch(function () {
        said.textContent = "Search is built when the site is deployed. Until then, browse the companies.";
      });
    }
  }
})();
