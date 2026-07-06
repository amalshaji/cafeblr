export interface OgCafe {
  name: string;
  area: string;
  knownFor: string;
}

export interface OgImageModel {
  width: number;
  height: number;
  accentColor: string;
  displayHost: string;
  iconSrc: string;
  cafeCount: number;
  areaCount: number;
  topAreas: Array<[string, number]>;
  latestCafes: OgCafe[];
}

interface OgStyle {
  [property: string]: string | number | OgStyle;
}
type OgChild = string | number | OgElement;

interface OgProps {
  style?: OgStyle;
  src?: string;
  width?: number;
  height?: number;
  children?: OgChild | OgChild[];
}

export interface OgElement {
  type: string;
  props: OgProps;
}

interface Palette {
  canvas: string;
  ink: string;
  muted: string;
  line: string;
  wash: string;
  accent: string;
  accentDeep: string;
}

export function renderOgTemplate(model: OgImageModel): OgElement {
  const palette = colors(model.accentColor);

  return element(
    "div",
    {
      style: {
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: model.width,
        height: model.height,
        padding: "52px 62px",
        backgroundColor: palette.wash,
        color: palette.ink,
        fontFamily: "Figtree",
      },
    },
    [
      divider(palette),
      header(model, palette),
      body(model, palette),
      footer(model, palette),
    ],
  );
}

function colors(accent: string): Palette {
  return {
    canvas: "#ffffff",
    ink: "#201914",
    muted: "#75695f",
    line: "#ece6e0",
    wash: "#faf8f6",
    accent,
    accentDeep: "#14432f",
  };
}

function header(model: OgImageModel, palette: Palette): OgElement {
  return element(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 28,
      },
    },
    [
      element(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 14,
          },
        },
        [
          element("img", {
            src: model.iconSrc,
            width: 46,
            height: 46,
            style: {
              display: "flex",
              width: 46,
              height: 46,
              flexShrink: 0,
            },
          }),
          wordmark(palette),
        ],
      ),
      element(
        "div",
        {
          style: {
            fontSize: 20,
            color: palette.muted,
          },
        },
        "Sourced from posts Bengaluru loved",
      ),
    ],
  );
}

function wordmark(palette: Palette): OgElement {
  return element(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "baseline",
        gap: 8,
        fontFamily: "Fraunces",
        fontSize: 36,
        fontWeight: 600,
      },
    },
    ["Cafe", element("span", { style: { color: palette.accent } }, "BLR")],
  );
}

function body(model: OgImageModel, palette: Palette): OgElement {
  return element(
    "div",
    {
      style: {
        display: "flex",
        flex: 1,
        gap: 42,
        paddingTop: 46,
      },
    },
    [heroColumn(model, palette), statsColumn(model, palette)],
  );
}

function heroColumn(model: OgImageModel, palette: Palette): OgElement {
  return element(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        width: 630,
      },
    },
    [
      element(
        "div",
        {
          style: {
            display: "flex",
            fontFamily: "Fraunces",
            fontSize: 65,
            fontWeight: 400,
            lineHeight: 1.04,
            color: palette.ink,
          },
        },
        "Nice cafes in Bengaluru, found by the internet.",
      ),
      element(
        "div",
        {
          style: {
            display: "flex",
            marginTop: 22,
            maxWidth: 620,
            fontSize: 25,
            lineHeight: 1.34,
            color: palette.muted,
          },
        },
        "Every spot comes with directions and the receipts.",
      ),
      element(
        "div",
        {
          style: {
            display: "flex",
            gap: 12,
            marginTop: 30,
            flexWrap: "wrap",
          },
        },
        model.topAreas.map(([area, count]) => areaChip(area, count, palette)),
      ),
    ],
  );
}

function statsColumn(model: OgImageModel, palette: Palette): OgElement {
  return element(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        width: 390,
        gap: 16,
      },
    },
    [
      element(
        "div",
        {
          style: {
            display: "flex",
            gap: 14,
          },
        },
        [
          stat("cafes", String(model.cafeCount), palette),
          stat("areas", String(model.areaCount), palette),
        ],
      ),
      ...model.latestCafes.map((cafe, index) => cafeRow(cafe, index, palette)),
    ],
  );
}

function stat(label: string, value: string, palette: Palette): OgElement {
  return element(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: "15px 18px",
        border: `1px solid ${palette.line}`,
        borderRadius: 18,
        backgroundColor: palette.canvas,
      },
    },
    [
      element(
        "div",
        { style: { fontSize: 31, fontWeight: 700, color: palette.ink } },
        value,
      ),
      element("div", { style: { fontSize: 17, color: palette.muted } }, label),
    ],
  );
}

function areaChip(area: string, count: number, palette: Palette): OgElement {
  return element(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "10px 16px",
        border: `1px solid ${palette.line}`,
        borderRadius: 999,
        backgroundColor: palette.canvas,
        fontSize: 18,
        fontWeight: 600,
      },
    },
    [
      area,
      element(
        "span",
        { style: { color: palette.muted, fontWeight: 400 } },
        String(count),
      ),
    ],
  );
}

function cafeRow(cafe: OgCafe, index: number, palette: Palette): OgElement {
  return element(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "18px 20px",
        border: `1px solid ${palette.line}`,
        borderRadius: 18,
        backgroundColor: palette.canvas,
        boxShadow: "0 2px 8px rgba(32, 25, 20, 0.05)",
      },
    },
    [
      element(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 14,
          },
        },
        [
          element(
            "div",
            {
              style: {
                fontSize: 25,
                fontWeight: 700,
                color: palette.ink,
                lineHeight: 1.1,
              },
            },
            cafe.name,
          ),
          element(
            "div",
            {
              style: {
                flexShrink: 0,
                fontSize: 16,
                fontWeight: 600,
                color: palette.accent,
              },
            },
            cafe.area,
          ),
        ],
      ),
      element(
        "div",
        {
          style: {
            display: "flex",
            color: palette.muted,
            fontSize: 16,
            lineHeight: 1.3,
          },
        },
        `${index === 0 ? "Latest find" : "Internet loved"}: ${cafe.knownFor}`,
      ),
    ],
  );
}

function footer(model: OgImageModel, palette: Palette): OgElement {
  return element(
    "div",
    {
      style: {
        position: "absolute",
        left: 62,
        right: 62,
        bottom: 38,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: palette.muted,
        fontSize: 18,
      },
    },
    [
      model.displayHost,
      element(
        "span",
        { style: { color: palette.accentDeep, fontWeight: 600 } },
        "Directions + receipts for every spot",
      ),
    ],
  );
}

function divider(palette: Palette): OgElement {
  return element("div", {
    style: {
      position: "absolute",
      left: 62,
      right: 62,
      top: 122,
      height: 1,
      backgroundColor: palette.line,
    },
  });
}

function element(type: string, props: OgProps, children?: OgChild | OgChild[]): OgElement {
  return {
    type,
    props: {
      ...props,
      ...(children === undefined ? {} : { children }),
    },
  };
}
