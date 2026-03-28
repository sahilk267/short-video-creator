import { loadFont as loadBarlowCondensed } from "@remotion/google-fonts/BarlowCondensed";
import { loadFont as loadNotoSansDevanagari } from "@remotion/google-fonts/NotoSansDevanagari";

const barlow = loadBarlowCondensed();
const notoDevanagari = loadNotoSansDevanagari();

export const videoUiFontFamily = `${barlow.fontFamily}, ${notoDevanagari.fontFamily}, sans-serif`;

