// Lazy Leaflet map for the homepage Grid/Map view toggle.
// Leaflet (and its CSS) load on first open, so the grid view stays light.

export type MapCafe = {
  id: number;
  name: string;
  area: string;
  lat: number;
  lng: number;
  likes: number;
  rating: number | null;
  thumb: string;
  source: string;
  directions: string;
};

type Leaflet = typeof import("leaflet");

let L: Leaflet | null = null;
let map: import("leaflet").Map | null = null;
let cluster: import("leaflet").MarkerClusterGroup | null = null;
let markers = new Map<number, import("leaflet").Marker>();
let allCafes: MapCafe[] = [];
let visibleIds: Set<number> | null = null; // null = everything
let glLayer: any = null; // L.maplibreGL layer (custom-styled vector basemap)
let styleFor: ((theme: "light" | "dark") => any) | null = null;
let loading: Promise<void> | null = null;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function formatLikes(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}k`;
  return String(n);
}

function popupHtml(cafe: MapCafe): string {
  const rating = cafe.rating == null ? "" : `<span class="pp-rating">★ ${cafe.rating.toFixed(1)}</span>`;
  return `
    <div class="pp">
      <img class="pp-img" src="${cafe.thumb}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()" />
      <div class="pp-body">
        <strong class="pp-name">${cafe.name}</strong>
        <span class="pp-meta">${cafe.area}${rating ? " · " : ""}${rating} · ♥ ${formatLikes(cafe.likes)}</span>
        <span class="pp-links">
          <a href="${cafe.source}" target="_blank" rel="noopener">Open post</a>
          <a href="${cafe.directions}" target="_blank" rel="noopener">Directions</a>
        </span>
      </div>
    </div>`;
}

function currentTheme(): "light" | "dark" {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function syncTiles() {
  if (!glLayer || !styleFor) return;
  glLayer.getMaplibreMap()?.setStyle(styleFor(currentTheme()));
}

function refreshMarkers() {
  if (!cluster) return;
  cluster.clearLayers();
  const shown: import("leaflet").Marker[] = [];
  for (const cafe of allCafes) {
    if (visibleIds && !visibleIds.has(cafe.id)) continue;
    const marker = markers.get(cafe.id);
    if (marker) shown.push(marker);
  }
  cluster.addLayers(shown);
}

async function loadLeaflet(): Promise<void> {
  const mod: any = await import("leaflet");
  L = (mod.default ?? mod) as Leaflet;
  (window as any).L = L; // leaflet.markercluster augments the shared instance
  await Promise.all([
    import("leaflet/dist/leaflet.css"),
    import("leaflet.markercluster/dist/MarkerCluster.css"),
    import("leaflet.markercluster"),
  ]);
}

async function init(container: HTMLElement, cafes: MapCafe[]): Promise<void> {
  await loadLeaflet();
  const leaflet = L!;
  allCafes = cafes;
  const still = reducedMotion();

  map = leaflet.map(container, {
    zoomControl: true,
    scrollWheelZoom: true,
    maxZoom: 19,
    zoomAnimation: !still,
    markerZoomAnimation: !still,
    fadeAnimation: !still,
  });
  // the GL basemap layer needs a valid view before it's added; fitBounds refines later
  map.setView([12.9629, 77.5937], 12);
  map.attributionControl.setPrefix(false);

  // cooperative gestures on touch: one finger scrolls the page (dragging off
  // switches Leaflet's touch-action to pan-x pan-y), two fingers pan/zoom the map
  if (window.matchMedia("(pointer: coarse)").matches) {
    map.dragging.disable();
    const hint = document.createElement("div");
    hint.className = "map-hint";
    hint.innerHTML = "<span>Use two fingers to move the map</span>";
    container.append(hint);
    let hideTimer: number | undefined;
    container.addEventListener(
      "touchmove",
      (event) => {
        if (event.touches.length === 1) {
          hint.classList.add("is-visible");
          window.clearTimeout(hideTimer);
          hideTimer = window.setTimeout(() => hint.classList.remove("is-visible"), 900);
        } else {
          hint.classList.remove("is-visible");
        }
      },
      { passive: true },
    );
  }

  // Custom-styled vector basemap (see map-style.ts); CARTO raster as fallback
  // if WebGL or the GL bundle is unavailable.
  try {
    const styleMod = await import("./map-style");
    styleFor = styleMod.styleFor;
    // no maplibre-gl.css: only needed for MapLibre's own controls/popups, which
    // Leaflet provides here (and its data-URI urls break the Astro build)
    await import("@maplibre/maplibre-gl-leaflet");
    glLayer = (leaflet as any).maplibreGL({
      style: styleFor(currentTheme()),
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a>',
    });
    glLayer.addTo(map);
    glLayer.getMaplibreMap()?.on("error", (event: any) => {
      console.error("basemap error", event?.error ?? event);
    });
  } catch {
    glLayer = null;
    leaflet
      .tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
        maxZoom: 19,
      })
      .addTo(map);
  }
  new MutationObserver(syncTiles).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  const dotIcon = leaflet.divIcon({
    className: "cafe-dot",
    html: "<span></span>",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });

  cluster = leaflet.markerClusterGroup({
    maxClusterRadius: 44,
    showCoverageOnHover: false,
    animate: !still,
    spiderfyDistanceMultiplier: 1.4,
    iconCreateFunction: (c) =>
      leaflet.divIcon({
        className: "cafe-cluster",
        html: `<span>${c.getChildCount()}</span>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      }),
  });

  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  for (const cafe of cafes) {
    const marker = leaflet.marker([cafe.lat, cafe.lng], {
      icon: dotIcon,
      title: `${cafe.name}, ${cafe.area}`,
      alt: `${cafe.name}, ${cafe.area}`,
    });
    marker.bindPopup(popupHtml(cafe), {
      className: "cafe-popup",
      maxWidth: 280,
      closeButton: false,
      autoPanPadding: [28, 28],
    });
    if (canHover) {
      // open on hover; linger while the cursor is over the popup so its links stay clickable
      let closeTimer: number | undefined;
      const cancelClose = () => window.clearTimeout(closeTimer);
      const scheduleClose = () => {
        cancelClose();
        closeTimer = window.setTimeout(() => marker.closePopup(), 250);
      };
      marker.on("mouseover", () => {
        cancelClose();
        marker.openPopup();
      });
      marker.on("mouseout", scheduleClose);
      marker.on("popupopen", () => {
        const el = marker.getPopup()?.getElement();
        el?.addEventListener("mouseenter", cancelClose);
        el?.addEventListener("mouseleave", scheduleClose);
      });
    }
    markers.set(cafe.id, marker);
  }

  map.addLayer(cluster);
  refreshMarkers();
  map.fitBounds(leaflet.latLngBounds(cafes.map((c) => [c.lat, c.lng])), { padding: [36, 36], maxZoom: 14 });
}

/** Open (and lazily create) the map inside `container`. Safe to call repeatedly. */
export function showMap(container: HTMLElement, cafes: MapCafe[]): Promise<void> {
  if (!loading) loading = init(container, cafes);
  return loading.then(() => {
    map?.invalidateSize();
  });
}

/** Restrict markers to these cafe ids (from the active search/area filters). */
export function setMapVisibility(ids: Set<number>): void {
  visibleIds = ids;
  refreshMarkers();
}
