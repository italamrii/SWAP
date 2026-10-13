// Generates stylized product illustrations used by the demo seed (public/seed/*.svg).
// Run: node scripts/gen-seed-art.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const BGS = {
  a: ["#f3f4f1", "#e4e7e1"],
  b: ["#eef2f7", "#dde4ee"],
  c: ["#f6f1ea", "#ebe2d6"],
  d: ["#1b1f24", "#0f1215"],
};

const frame = (bg, body, accent = "#0e9f6e") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
<defs>
<radialGradient id="bg" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></radialGradient>
<linearGradient id="metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4048"/><stop offset="1" stop-color="#1c2025"/></linearGradient>
<linearGradient id="metalLight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9dde2"/><stop offset="1" stop-color="#aab1b9"/></linearGradient>
<linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".22"/><stop offset=".5" stop-color="#ffffff" stop-opacity=".04"/><stop offset="1" stop-color="#ffffff" stop-opacity=".12"/></linearGradient>
<linearGradient id="rgb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${accent}"/><stop offset=".5" stop-color="#6d4dff"/><stop offset="1" stop-color="#22d3ee"/></linearGradient>
<filter id="sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000" flood-opacity=".22"/></filter>
</defs>
<rect width="800" height="600" fill="url(#bg)"/>
<ellipse cx="400" cy="505" rx="250" ry="22" fill="#000" opacity=".10"/>
<g filter="url(#sh)">${body}</g>
</svg>`;

const fan = (cx, cy, r, color = "#2a2f36") => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#15181c" stroke="${color}" stroke-width="6"/>
${[0, 72, 144, 216, 288].map((a) => `<path transform="rotate(${a} ${cx} ${cy})" d="M${cx} ${cy} q ${r * 0.35} ${-r * 0.75} ${r * 0.05} ${-r * 0.85} q ${-r * 0.45} ${r * 0.2} ${-r * 0.05} ${r * 0.85}z" fill="#2c323a"/>`).join("")}
<circle cx="${cx}" cy="${cy}" r="${r * 0.22}" fill="#3a4048"/>`;

const art = {
  gpu: () => `<rect x="130" y="210" width="540" height="190" rx="26" fill="url(#metal)"/>
<rect x="130" y="210" width="540" height="190" rx="26" fill="url(#glass)"/>
${fan(265, 305, 70)}${fan(445, 305, 70)}
<rect x="545" y="245" width="95" height="120" rx="14" fill="#262b31"/>
<rect x="560" y="262" width="65" height="6" rx="3" fill="url(#rgb)"/>
<rect x="150" y="398" width="300" height="20" rx="4" fill="#b8913a"/>
${Array.from({ length: 22 }, (_, i) => `<rect x="${158 + i * 13}" y="402" width="7" height="14" fill="#e6c36a"/>`).join("")}
<rect x="130" y="220" width="12" height="170" rx="4" fill="#8a929c"/>
<rect x="150" y="226" width="380" height="6" rx="3" fill="url(#rgb)" opacity=".9"/>`,

  laptop: () => `<path d="M215 150 h370 a20 20 0 0 1 20 20 v230 h-410 v-230 a20 20 0 0 1 20 -20z" fill="#1f2328"/>
<rect x="215" y="168" width="370" height="218" rx="6" fill="#0b0d10"/>
<rect x="215" y="168" width="370" height="218" rx="6" fill="url(#glass)"/>
<path d="M235 360 q 90 -110 180 -60 t 160 -70 v 136 h-340z" fill="#0e9f6e" opacity=".55"/>
<path d="M235 386 q 120 -80 220 -40 t 130 -50 v 90 h-350z" fill="#6d4dff" opacity=".45"/>
<path d="M140 400 h520 l-30 42 a16 16 0 0 1 -13 6 h-434 a16 16 0 0 1 -13 -6z" fill="url(#metalLight)"/>
<rect x="355" y="402" width="90" height="8" rx="4" fill="#8f979f"/>`,

  pc: () => `<rect x="250" y="110" width="300" height="370" rx="18" fill="url(#metal)"/>
<rect x="268" y="128" width="200" height="334" rx="8" fill="#0d0f12"/>
${fan(368, 200, 52, "url(#rgb)")}${fan(368, 320, 52, "url(#rgb)")}
<rect x="300" y="380" width="140" height="56" rx="6" fill="#20252b"/>
<rect x="306" y="392" width="128" height="6" rx="3" fill="url(#rgb)"/>
<rect x="268" y="128" width="200" height="334" rx="8" fill="url(#glass)"/>
<rect x="484" y="140" width="48" height="300" rx="8" fill="#262b31"/>
<circle cx="508" cy="168" r="9" fill="#3b424a" stroke="#0e9f6e" stroke-width="3"/>
<rect x="270" y="478" width="40" height="10" rx="3" fill="#15181c"/><rect x="490" y="478" width="40" height="10" rx="3" fill="#15181c"/>`,

  monitor: () => `<rect x="130" y="110" width="540" height="310" rx="16" fill="#16191d"/>
<rect x="144" y="124" width="512" height="272" rx="6" fill="#0b0d10"/>
<path d="M144 330 q 120 -140 250 -60 t 262 -110 v 236 h-512z" fill="#0e9f6e" opacity=".45"/>
<path d="M144 396 q 160 -120 300 -50 t 212 -60 v 110 h-512z" fill="#6d4dff" opacity=".4"/>
<rect x="144" y="124" width="512" height="272" rx="6" fill="url(#glass)"/>
<path d="M372 420 h56 l18 60 h-92z" fill="url(#metalLight)"/>
<rect x="300" y="478" width="200" height="14" rx="7" fill="url(#metalLight)"/>`,

  cpu: () => `<rect x="250" y="150" width="300" height="300" rx="22" fill="#2d6a4f"/>
${Array.from({ length: 13 }, (_, i) => Array.from({ length: 13 }, (_, j) => `<circle cx="${270 + i * 21.6}" cy="${170 + j * 21.6}" r="3.2" fill="#d4b056"/>`).join("")).join("")}
<rect x="285" y="185" width="230" height="230" rx="14" fill="url(#metalLight)"/>
<rect x="285" y="185" width="230" height="230" rx="14" fill="url(#glass)"/>
<text x="400" y="292" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="34" fill="#4a525b">CORE</text>
<text x="400" y="332" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#6b737c">X3D · 8C/16T</text>
<path d="M285 395 l20 20 h-20z" fill="#d4b056"/>`,

  ram: () => `${[0, 1].map((k) => `<g transform="translate(0 ${k * 120})">
<rect x="140" y="170" width="520" height="96" rx="8" fill="url(#metal)"/>
<path d="M140 178 h520 v-22 q-30 -14 -60 0 t-60 0 t-60 0 t-60 0 t-60 0 t-60 0 t-60 0 t-60 0 t-60 0z" fill="url(#rgb)" opacity=".9"/>
<rect x="170" y="196" width="460" height="46" rx="4" fill="#262b31"/>
<text x="400" y="227" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="20" fill="#9aa3ad" letter-spacing="4">DDR5 6000</text>
<rect x="150" y="266" width="500" height="12" fill="#b8913a"/>
<rect x="388" y="266" width="10" height="12" fill="${"#e4e7e1"}"/>
</g>`).join("")}`,

  ssd: () => `<rect x="150" y="250" width="500" height="110" rx="10" fill="#14171b"/>
<rect x="175" y="268" width="120" height="74" rx="6" fill="#2a2f36"/>
<rect x="310" y="268" width="90" height="74" rx="6" fill="#2a2f36"/>
<rect x="415" y="268" width="90" height="74" rx="6" fill="#2a2f36"/>
<rect x="520" y="275" width="60" height="60" rx="4" fill="#353b43"/>
<rect x="600" y="296" width="36" height="18" rx="9" fill="#b8913a"/>
<rect x="160" y="230" width="380" height="36" rx="6" fill="url(#metalLight)"/>
<text x="350" y="255" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="17" fill="#444b53" letter-spacing="3">NVMe Gen4 · 2TB</text>
${Array.from({ length: 14 }, (_, i) => `<rect x="${156 + i * 7}" y="${i % 2 ? 340 : 346}" width="4" height="12" fill="#d4b056"/>`).join("")}`,

  console: () => `<path d="M240 260 q 30 -60 100 -60 h120 q 70 0 100 60 l 60 140 q 22 60 -30 70 q -40 6 -70 -40 l -30 -40 h-180 l -30 40 q -30 46 -70 40 q -52 -10 -30 -70z" fill="url(#metalLight)"/>
<circle cx="330" cy="300" r="34" fill="#2a2f36"/><circle cx="470" cy="340" r="34" fill="#2a2f36"/>
<circle cx="330" cy="300" r="20" fill="#3a4048"/><circle cx="470" cy="340" r="20" fill="#3a4048"/>
<g fill="#5c646d"><circle cx="520" cy="270" r="10"/><circle cx="548" cy="296" r="10"/><circle cx="492" cy="296" r="10"/><circle cx="520" cy="322" r="10"/></g>
<path d="M270 330 h20 v-20 h16 v20 h20 v16 h-20 v20 h-16 v-20 h-20z" fill="#5c646d" transform="translate(-20 -50)"/>
<rect x="370" y="240" width="60" height="8" rx="4" fill="#0e9f6e"/>`,

  keyboard: () => `<rect x="110" y="220" width="580" height="200" rx="20" fill="url(#metal)"/>
${Array.from({ length: 5 }, (_, r) => Array.from({ length: 14 }, (_, c) => `<rect x="${130 + c * 39.5}" y="${238 + r * 34}" width="34" height="28" rx="5" fill="${r === 4 && c > 3 && c < 10 ? "#2c323a" : (r + c) % 7 === 0 ? "#0e9f6e" : "#2c323a"}"/>`).join("")).join("")}
<rect x="110" y="410" width="580" height="8" rx="4" fill="url(#rgb)" opacity=".85"/>`,

  mouse: () => `<path d="M400 140 c 90 0 120 80 120 170 c 0 110 -50 170 -120 170 c -70 0 -120 -60 -120 -170 c 0 -90 30 -170 120 -170z" fill="url(#metal)"/>
<path d="M400 140 v120" stroke="#0d0f12" stroke-width="4"/>
<rect x="390" y="190" width="20" height="44" rx="10" fill="#4a525b"/>
<path d="M290 330 q 110 40 220 0" stroke="url(#rgb)" stroke-width="5" fill="none"/>
<path d="M400 140 c 90 0 120 80 120 170 c 0 110 -50 170 -120 170 c -70 0 -120 -60 -120 -170 c 0 -90 30 -170 120 -170z" fill="url(#glass)"/>`,

  headset: () => `<path d="M250 340 v-60 a150 150 0 0 1 300 0 v60" stroke="url(#metal)" stroke-width="28" fill="none" stroke-linecap="round"/>
<rect x="200" y="300" width="100" height="150" rx="40" fill="url(#metal)"/>
<rect x="500" y="300" width="100" height="150" rx="40" fill="url(#metal)"/>
<rect x="222" y="330" width="56" height="90" rx="26" fill="#15181c"/><rect x="522" y="330" width="56" height="90" rx="26" fill="#15181c"/>
<rect x="208" y="360" width="8" height="40" rx="4" fill="#0e9f6e"/><rect x="584" y="360" width="8" height="40" rx="4" fill="#0e9f6e"/>`,

  psu: () => `<rect x="190" y="170" width="420" height="260" rx="16" fill="url(#metal)"/>
${fan(330, 300, 95)}
<rect x="460" y="200" width="120" height="200" rx="10" fill="#262b31"/>
<text x="520" y="290" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="34" fill="#c9a24a">850</text>
<text x="520" y="318" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#9aa3ad">80+ GOLD</text>
<rect x="480" y="345" width="80" height="6" rx="3" fill="#0e9f6e"/>`,

  cooler: () => `<rect x="160" y="190" width="480" height="140" rx="14" fill="url(#metal)"/>
${fan(240, 260, 56, "#22272d")}${fan(400, 260, 56, "#22272d")}${fan(560, 260, 56, "#22272d")}
<path d="M300 330 q 0 60 60 80 M500 330 q 0 60 -60 80" stroke="#2a2f36" stroke-width="14" fill="none" stroke-linecap="round"/>
<circle cx="400" cy="430" r="52" fill="#1a1d22"/><circle cx="400" cy="430" r="40" fill="none" stroke="url(#rgb)" stroke-width="6"/>`,

  motherboard: () => `<rect x="200" y="110" width="400" height="380" rx="12" fill="#1c2a24"/>
<rect x="320" y="160" width="110" height="110" rx="8" fill="url(#metalLight)"/>
<rect x="455" y="150" width="14" height="190" rx="3" fill="#2a2f36"/><rect x="478" y="150" width="14" height="190" rx="3" fill="#2a2f36"/>
<rect x="500" y="150" width="14" height="190" rx="3" fill="#2a2f36"/><rect x="522" y="150" width="14" height="190" rx="3" fill="#2a2f36"/>
<rect x="220" y="130" width="80" height="200" rx="8" fill="url(#metal)"/>
<rect x="240" y="350" width="300" height="18" rx="4" fill="#2a2f36"/><rect x="240" y="410" width="300" height="18" rx="4" fill="#2a2f36"/>
<rect x="430" y="440" width="140" height="36" rx="6" fill="url(#metal)"/><rect x="440" y="455" width="120" height="5" rx="2" fill="url(#rgb)"/>
<rect x="320" y="290" width="110" height="40" rx="6" fill="#2d3a33"/>`,
};

mkdirSync("public/seed", { recursive: true });
for (const [name, draw] of Object.entries(art)) {
  for (const [variant, bg] of Object.entries(BGS)) {
    writeFileSync(`public/seed/${name}-${variant}.svg`, frame(bg, draw()));
  }
}
console.log("✓ seed art generated:", Object.keys(art).length * Object.keys(BGS).length, "files");
