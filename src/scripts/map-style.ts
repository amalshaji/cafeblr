// Hand-authored MapLibre style for the homepage map — a playful, cartoon-leaning
// basemap in Cafe BLR's own palette (cream land, soft green parks, amber roads).
// Vector tiles + fonts from OpenFreeMap (no API key, production use allowed).

const TILEJSON = "https://tiles.openfreemap.org/planet";
const GLYPHS = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";

type Palette = {
  land: string;
  residential: string;
  park: string;
  wood: string;
  water: string;
  building: string;
  buildingLine: string;
  roadMinor: string;
  roadMinorCasing: string;
  roadMajor: string;
  roadMajorCasing: string;
  roadHighway: string;
  roadHighwayCasing: string;
  rail: string;
  aeroway: string;
  boundary: string;
  label: string;
  labelSoft: string;
  halo: string;
};

const LIGHT: Palette = {
  land: "#f6f1e9",
  residential: "#f1e9df",
  park: "#c3e0ba",
  wood: "#aed3a6",
  water: "#a3d5da",
  building: "#eadfd1",
  buildingLine: "#e0d2c1",
  roadMinor: "#ffffff",
  roadMinorCasing: "#e4d9ca",
  roadMajor: "#fbe7b0",
  roadMajorCasing: "#e6c887",
  roadHighway: "#f6c98e",
  roadHighwayCasing: "#dfa960",
  rail: "#ded2c2",
  aeroway: "#eae2d5",
  boundary: "#d2c0ac",
  label: "#4a4038",
  labelSoft: "#8a7d70",
  halo: "rgba(255, 253, 248, 0.9)",
};

const DARK: Palette = {
  land: "#1b1512",
  residential: "#201914",
  park: "#233827",
  wood: "#1f3123",
  water: "#1d3d43",
  building: "#241c15",
  buildingLine: "#2b2119",
  roadMinor: "#2c241c",
  roadMinorCasing: "#231c15",
  roadMajor: "#3b2f20",
  roadMajorCasing: "#2c231a",
  roadHighway: "#4a3a26",
  roadHighwayCasing: "#33291c",
  rail: "#2e261e",
  aeroway: "#231c16",
  boundary: "#3d332a",
  label: "#cfc2b1",
  labelSoft: "#8f8172",
  halo: "rgba(21, 17, 14, 0.9)",
};

/** width interpolation helper: [[zoom, width], ...] */
function widthByZoom(stops: Array<[number, number]>) {
  return ["interpolate", ["exponential", 1.4], ["zoom"], ...stops.flat()];
}

export function styleFor(theme: "light" | "dark"): any {
  const p = theme === "dark" ? DARK : LIGHT;
  return {
    version: 8,
    glyphs: GLYPHS,
    sources: { omt: { type: "vector", url: TILEJSON } },
    layers: [
      { id: "background", type: "background", paint: { "background-color": p.land } },
      {
        id: "residential",
        type: "fill",
        source: "omt",
        "source-layer": "landuse",
        filter: ["in", ["get", "class"], ["literal", ["residential", "suburbs", "neighbourhood", "commercial"]]],
        paint: { "fill-color": p.residential },
      },
      {
        id: "grass",
        type: "fill",
        source: "omt",
        "source-layer": "landcover",
        filter: ["==", ["get", "class"], "grass"],
        paint: { "fill-color": p.park, "fill-opacity": 0.6 },
      },
      {
        id: "wood",
        type: "fill",
        source: "omt",
        "source-layer": "landcover",
        filter: ["==", ["get", "class"], "wood"],
        paint: { "fill-color": p.wood, "fill-opacity": 0.7 },
      },
      {
        id: "park",
        type: "fill",
        source: "omt",
        "source-layer": "park",
        paint: { "fill-color": p.park, "fill-opacity": 0.75 },
      },
      {
        id: "water",
        type: "fill",
        source: "omt",
        "source-layer": "water",
        paint: { "fill-color": p.water },
      },
      {
        id: "waterway",
        type: "line",
        source: "omt",
        "source-layer": "waterway",
        paint: { "line-color": p.water, "line-width": widthByZoom([[10, 0.7], [17, 4]]) },
      },
      {
        id: "aeroway",
        type: "line",
        source: "omt",
        "source-layer": "aeroway",
        filter: ["in", ["get", "class"], ["literal", ["runway", "taxiway"]]],
        paint: { "line-color": p.aeroway, "line-width": widthByZoom([[11, 1.5], [16, 18]]) },
      },
      {
        id: "building",
        type: "fill",
        source: "omt",
        "source-layer": "building",
        minzoom: 14,
        paint: {
          "fill-color": p.building,
          "fill-outline-color": p.buildingLine,
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], 14, 0, 15, 0.9],
        },
      },
      {
        id: "rail",
        type: "line",
        source: "omt",
        "source-layer": "transportation",
        minzoom: 12,
        filter: ["==", ["get", "class"], "rail"],
        paint: {
          "line-color": p.rail,
          "line-width": widthByZoom([[12, 0.8], [17, 3]]),
          "line-dasharray": [3, 2.2],
        },
      },
      {
        id: "road-minor-casing",
        type: "line",
        source: "omt",
        "source-layer": "transportation",
        minzoom: 13,
        filter: ["in", ["get", "class"], ["literal", ["minor", "tertiary", "service"]]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": p.roadMinorCasing,
          "line-width": widthByZoom([[13, 1.6], [15, 3.5], [18, 14]]),
        },
      },
      {
        id: "road-minor",
        type: "line",
        source: "omt",
        "source-layer": "transportation",
        minzoom: 13,
        filter: ["in", ["get", "class"], ["literal", ["minor", "tertiary", "service"]]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": p.roadMinor,
          "line-width": widthByZoom([[13, 0.9], [15, 2.2], [18, 10.5]]),
        },
      },
      {
        id: "road-major-casing",
        type: "line",
        source: "omt",
        "source-layer": "transportation",
        minzoom: 10,
        filter: ["in", ["get", "class"], ["literal", ["primary", "secondary"]]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": p.roadMajorCasing,
          "line-width": widthByZoom([[10, 1.2], [14, 5], [18, 20]]),
        },
      },
      {
        id: "road-major",
        type: "line",
        source: "omt",
        "source-layer": "transportation",
        minzoom: 10,
        filter: ["in", ["get", "class"], ["literal", ["primary", "secondary"]]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": p.roadMajor,
          "line-width": widthByZoom([[10, 0.7], [14, 3.4], [18, 16]]),
        },
      },
      {
        id: "road-highway-casing",
        type: "line",
        source: "omt",
        "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk"]]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": p.roadHighwayCasing,
          "line-width": widthByZoom([[8, 1.4], [14, 6.5], [18, 24]]),
        },
      },
      {
        id: "road-highway",
        type: "line",
        source: "omt",
        "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk"]]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": p.roadHighway,
          "line-width": widthByZoom([[8, 0.9], [14, 4.6], [18, 19]]),
        },
      },
      {
        id: "boundary",
        type: "line",
        source: "omt",
        "source-layer": "boundary",
        filter: ["<=", ["get", "admin_level"], 6],
        paint: {
          "line-color": p.boundary,
          "line-width": 1,
          "line-dasharray": [4, 2.5],
        },
      },
      {
        id: "road-label",
        type: "symbol",
        source: "omt",
        "source-layer": "transportation_name",
        minzoom: 14.5,
        filter: ["in", ["get", "class"], ["literal", ["primary", "secondary", "tertiary", "minor"]]],
        layout: {
          "symbol-placement": "line",
          "text-font": ["Noto Sans Regular"],
          "text-field": ["get", "name"],
          "text-size": 11.5,
        },
        paint: { "text-color": p.labelSoft, "text-halo-color": p.halo, "text-halo-width": 1.4 },
      },
      {
        id: "place-neighbourhood",
        type: "symbol",
        source: "omt",
        "source-layer": "place",
        minzoom: 11,
        maxzoom: 16,
        filter: ["in", ["get", "class"], ["literal", ["suburb", "quarter", "neighbourhood", "village"]]],
        layout: {
          "text-font": ["Noto Sans Bold"],
          "text-field": ["get", "name"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 11, 11.5, 15, 15],
          "text-transform": "uppercase",
          "text-letter-spacing": 0.12,
        },
        paint: { "text-color": p.labelSoft, "text-halo-color": p.halo, "text-halo-width": 1.6 },
      },
      {
        id: "place-city",
        type: "symbol",
        source: "omt",
        "source-layer": "place",
        maxzoom: 13,
        filter: ["in", ["get", "class"], ["literal", ["city", "town"]]],
        layout: {
          "text-font": ["Noto Sans Bold"],
          "text-field": ["get", "name"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 8, 13, 12, 18],
        },
        paint: { "text-color": p.label, "text-halo-color": p.halo, "text-halo-width": 1.8 },
      },
    ],
  };
}
