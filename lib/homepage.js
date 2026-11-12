import fs from "node:fs";
import path from "node:path";

const defaults = {"image":"","imageAlt":"Lepigonia Reisemobil","eyebrowEn":"Personal travel journal","eyebrowDe":"Persönliches Reisetagebuch","titleEn":"Stories from places worth remembering.","titleDe":"Geschichten von Orten, die bleiben.","copyEn":"Slow travel, beautiful photography and the little moments that stay with you.","copyDe":"Langsames Reisen, besondere Fotografie und die kleinen Momente, die bleiben.","buttonEn":"Explore stories","buttonDe":"Geschichten entdecken"};

export function getHomepageSettings() {
  try {
    const file = path.join(process.cwd(), "homepage.json");
    const saved = JSON.parse(fs.readFileSync(file, "utf8"));
    return { ...defaults, ...saved };
  } catch {
    return { ...defaults };
  }
}
