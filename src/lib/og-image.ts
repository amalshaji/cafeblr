import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import satori from "satori";
import { SEO, seoStats } from "./seo";
import { renderOgTemplate, type OgImageModel } from "./og-template";

type FontWeight = 400 | 600 | 700;

interface OgFont {
  name: "Figtree" | "Fraunces";
  data: Buffer;
  weight: FontWeight;
  style: "normal";
}

const fontFiles = {
  figtreeRegular: "node_modules/@expo-google-fonts/figtree/400Regular/Figtree_400Regular.ttf",
  figtreeSemiBold:
    "node_modules/@expo-google-fonts/figtree/600SemiBold/Figtree_600SemiBold.ttf",
  figtreeBold: "node_modules/@expo-google-fonts/figtree/700Bold/Figtree_700Bold.ttf",
  frauncesRegular: "node_modules/@expo-google-fonts/fraunces/400Regular/Fraunces_400Regular.ttf",
  frauncesSemiBold:
    "node_modules/@expo-google-fonts/fraunces/600SemiBold/Fraunces_600SemiBold.ttf",
};

const fontsPromise = Promise.all([
  readProjectFile(fontFiles.figtreeRegular),
  readProjectFile(fontFiles.figtreeSemiBold),
  readProjectFile(fontFiles.figtreeBold),
  readProjectFile(fontFiles.frauncesRegular),
  readProjectFile(fontFiles.frauncesSemiBold),
]);

const faviconPromise = readProjectFile("public/favicon.svg", "utf8");

export async function renderOgPng(): Promise<Buffer> {
  const [fonts, iconSrc] = await Promise.all([loadFonts(), loadFaviconDataUrl()]);
  const model = ogImageModel(iconSrc);
  const svg = await satori(renderOgTemplate(model), {
    width: model.width,
    height: model.height,
    fonts,
  });

  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function loadFonts(): Promise<OgFont[]> {
  const [
    figtreeRegular,
    figtreeSemiBold,
    figtreeBold,
    frauncesRegular,
    frauncesSemiBold,
  ] = await fontsPromise;

  return [
    font("Figtree", figtreeRegular, 400),
    font("Figtree", figtreeSemiBold, 600),
    font("Figtree", figtreeBold, 700),
    font("Fraunces", frauncesRegular, 400),
    font("Fraunces", frauncesSemiBold, 600),
  ];
}

async function loadFaviconDataUrl(): Promise<string> {
  const svg = await faviconPromise;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function ogImageModel(iconSrc: string): OgImageModel {
  return {
    width: SEO.ogImageWidth,
    height: SEO.ogImageHeight,
    accentColor: SEO.accentColor,
    displayHost: new URL(SEO.siteUrl).host,
    iconSrc,
    cafeCount: seoStats.cafeCount,
    areaCount: seoStats.areaCount,
    topAreas: seoStats.topAreas,
    latestCafes: seoStats.latestCafes.slice(0, 2),
  };
}

function font(name: OgFont["name"], data: Buffer, weight: FontWeight): OgFont {
  return { name, data, weight, style: "normal" };
}

function readProjectFile(path: string): Promise<Buffer>;
function readProjectFile(path: string, encoding: "utf8"): Promise<string>;
function readProjectFile(path: string, encoding?: "utf8"): Promise<Buffer | string> {
  return readFile(join(process.cwd(), path), encoding);
}
