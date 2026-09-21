/**
 * migrate-template-seo — ONE-TIME migration (idempotent, safe to re-run):
 * gives every integrated project in Templates/ its own SEO identity on
 * the picksaw.ir/<name>/ routes, without touching the visual experience:
 *
 *   • bilingual <title>  →  "Verda — … Website | Picksaw" style
 *   • bilingual meta description with creator attribution
 *   • canonical  https://picksaw.ir/<name>/
 *   • Open Graph (url / site_name / locale / absolute image) + Twitter card
 *   • CreativeWork JSON-LD:  creator  Amirehsan Ashoori / امیراحسان عاشوری,
 *     publisher  Picksaw / پیکسا   (never پیکساو)
 *   • a semantic <noscript> block in the five React SPAs so crawlers and
 *     no-JS visitors can understand the page (invisible to normal users —
 *     it only renders when JavaScript is disabled)
 *
 * Persian copy stays Persian-first (the sites are fa/RTL); English is the
 * secondary descriptor. Existing keywords/JSON-LD are preserved.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const PROJECTS = [
  {
    dir: "verda",
    title: "Verda — Cinematic Skin, Hair & Beauty Clinic Website | Picksaw",
    faName: "وِردا",
    faDesc: "قالب سینمایی کلینیک پوست، مو و زیبایی",
    ogTitle: "وِردا | کلینیک پوست و زیبایی",
    descFa:
      "وِردا؛ رویکردی مدرن، آرام و دقیق برای مراقبت از پوست، مو و زیبایی طبیعی. زیبایی در هماهنگی است.",
    ogDescFa:
      "زیبایی، در هماهنگی است. رویکردی مدرن و دقیق برای مراقبت از پوست و زیبایی طبیعی.",
    image: "https://picksaw.ir/verda/images/hero-editorial.jpg",
    enAbout:
      "Verda is a cinematic skin, hair & beauty clinic website with a calm sage palette, wind-physics floating leaves and Lenis/GSAP motion — a ready template in the Picksaw clinic collection, designed by Amirehsan Ashoori.",
  },
  {
    dir: "lumina",
    title: "Lumina — Luxury Dental Clinic Website | Picksaw",
    faName: "لومینا دنتال",
    faDesc: "قالب لوکس کلینیک دندانپزشکی و طراحی دیجیتال لبخند",
    ogTitle: "لومینا دنتال | لبخندی که با اطمینان می‌سازید",
    nameTitle: "کلینیک دندانپزشکی لومینا دنتال | لبخندی که با اطمینان می‌سازید",
    descFa:
      "کلینیک تخصصی دندانپزشکی زیبایی، ایمپلنت و طراحی دیجیتال لبخند لومینا دنتال. مراقبتی دقیق، فضایی آرام و نتایجی طبیعی متناسب با فرم چهره شما.",
    ogDescFa:
      "دندانپزشکی زیبایی و ترمیمی با رویکردی مدرن و دقیق. قالب لوکس کلینیک دندانپزشکی طراحی شده توسط Picksaw Studio.",
    ogImageOld: '<meta property="og:image" content="./images/hero-smile-clinic.jpg" />',
    image: "https://picksaw.ir/lumina/images/hero-smile-clinic.jpg",
    enAbout:
      "Lumina is a luxury dental clinic website — cosmetic dentistry, implants and digital smile design presented with precise, calm motion — designed by Amirehsan Ashoori at Picksaw.",
  },
  {
    dir: "pulse",
    title: "Pulse — Modern Medical & Beauty Clinic Website | Picksaw",
    faName: "پالس",
    faDesc: "قالب مدرن کلینیک پزشکی و زیبایی",
    ogTitle: "پالس | کلینیک مدرن پزشکی و زیبایی",
    descFa:
      "پالس؛ تجربه‌ای مدرن و حرفه‌ای برای مراقبت و خدمات پزشکی با تمرکز بر دقت و توجه به جزئیات. کلینیک پوست، مو، زیبایی و لیزر.",
    ogDescFa:
      "دقت، از توجه شروع می‌شود. کلینیک تخصصی پوست، مو و مراقبت‌های زیبایی پالس.",
    image: "https://picksaw.ir/pulse/images/hero-clinic.jpg",
    enAbout:
      "Pulse is a modern medical & beauty clinic website with architectural Persian typography and detail-driven motion — designed by Amirehsan Ashoori at Picksaw.",
  },
  {
    dir: "clarity",
    title: "Clarity — Natural Beauty & Skin Care Clinic Website | Picksaw",
    faName: "کلاریتی",
    faDesc: "قالب آرام کلینیک مراقبت و زیبایی طبیعی",
    ogTitle: "کلینیک کلاریتی | مراقبت و زیبایی طبیعی — CLARITY",
    descFa:
      "کلینیک کلاریتی؛ تجربه‌ای آرام، مدرن و حرفه‌ای برای مراقبت، زیبایی و سلامت پوست با رویکردی طبیعی و دقیق.",
    ogDescFa: "طبیعی‌تر، دقیق‌تر، برای تو. مراقبتی حرفه‌ای با تمرکز بر جزئیات و آرامش.",
    authorOld: '<meta name="author" content="Picksaw Studio" />',
    twitterOld: true,
    image: "https://picksaw.ir/clarity/images/hero.webp",
    enAbout:
      "Clarity is a calm, natural beauty & skin care clinic website — precise, minimal and serene — designed by Amirehsan Ashoori at Picksaw.",
  },
  {
    dir: "lumen",
    title: "Lumen — Skin & Beauty Clinic Website | Picksaw",
    faName: "لومن",
    faDesc: "قالب کلینیک پوست و زیبایی با رویکرد نتایج طبیعی",
    descFa:
      "لومن؛ تجربه‌ای مدرن و دقیق برای مراقبت از پوست، مو و زیبایی طبیعی. کلینیک زیبایی تخصصی با رویکرد نتایج طبیعی و متناسب.",
    image: "https://picksaw.ir/lumen/images/hero-portrait.jpg",
    enAbout:
      "Lumen is a precise, modern skin & beauty clinic website focused on natural, face-fitting results — designed by Amirehsan Ashoori at Picksaw.",
  },
  {
    dir: "aurora",
    static: true,
    title: "Aurora — Luxury Skin & Beauty Atelier Website | Picksaw",
    faName: "کلینیک اورورا",
    faDesc: "آتلیه تخصصی پوست و زیبایی — وب‌سایت کاملاً ایستا",
    descFa:
      "کلینیک زیبایی و مراقبت پوست اورورا — تلفیق هنر معماری چهره، جوانسازی مدرن و تجربه آرامش مطلق در تهران.",
    image: "https://picksaw.ir/aurora/assets/images/hero-portrait.jpg",
    enAbout:
      "Aurora is a luxury skin & beauty atelier website — a fully static, editorial Persian experience — designed by Amirehsan Ashoori at Picksaw.",
  },
];

const attributionFa = (p) =>
  `${p.faDesc} «${p.faName}» — طراحی‌شده توسط امیراحسان عاشوری در Picksaw / پیکسا.`;

const fullDesc = (p) =>
  `${p.descFa} ${p.faDesc} «${p.faName}» — طراحی‌شده توسط امیراحسان عاشوری (Amirehsan Ashoori) در Picksaw / پیکسا.`;

const ogDesc = (p) =>
  p.ogDescFa
    ? `${p.ogDescFa} ${p.faDesc} «${p.faName}» — طراحی‌شده توسط امیراحسان عاشوری در Picksaw / پیکسا.`
    : attributionFa(p);

const jsonLd = (p) => `{
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "@id": "https://picksaw.ir/${p.dir}/#work",
      "name": "${p.title.replace(/ \| Picksaw$/, "")}",
      "alternateName": "${p.faDesc} «${p.faName}»",
      "url": "https://picksaw.ir/${p.dir}/",
      "inLanguage": "fa-IR",
      "isPartOf": {
        "@type": "WebSite",
        "url": "https://picksaw.ir/",
        "name": "Picksaw",
        "alternateName": "پیکسا"
      },
      "creator": {
        "@type": "Person",
        "@id": "https://picksaw.ir/#amir",
        "name": "Amirehsan Ashoori",
        "alternateName": "امیراحسان عاشوری",
        "url": "https://picksaw.ir/"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Picksaw",
        "alternateName": "پیکسا",
        "url": "https://picksaw.ir/"
      }
    }`;

const noscript = (p) => `<noscript>
      <header style="max-width:44rem;margin:0 auto;padding:3rem 1.5rem;line-height:2">
        <h1 style="font-size:1.6rem;font-weight:800">${p.faName} — ${p.dir[0].toUpperCase() + p.dir.slice(1)}</h1>
        <h2 style="font-size:1.05rem;font-weight:600;margin-top:.75rem">${p.faDesc} | مجموعه قالب‌های کلینیک Picksaw / پیکسا</h2>
        <p style="margin-top:1rem">${attributionFa(p)}</p>
        <p lang="en" dir="ltr" style="margin-top:.75rem">${p.enAbout}</p>
        <p style="margin-top:1rem"><a href="https://picksaw.ir/" style="text-decoration:underline">picksaw.ir</a></p>
      </header>
    </noscript>`;

function replaceOnce(html, from, to, label, file) {
  const count = html.split(from).length - 1;
  if (count !== 1) {
    if (count === 0 && html.includes(to)) return html; // already migrated — idempotent
    throw new Error(`${file}: expected 1× anchor for ${label}, found ${count}`);
  }
  return html.replace(from, to);
}

let anyFail = false;
for (const p of PROJECTS) {
  const file = path.join(root, "Templates", p.dir, "index.html");
  let html = readFileSync(file, "utf8");
  const log = [];
  const canon = `<link rel="canonical" href="https://picksaw.ir/${p.dir}/" />`;

  try {
    if (html.includes(canon)) {
      log.push("already migrated — skipped");
    } else {
      // capture current title as the old anchor
      const titleMatch = html.match(/<title>(.*?)<\/title>/s);
      if (!titleMatch) throw new Error("no <title> found");
      html = replaceOnce(html, titleMatch[0], `<title>${p.title}</title>`, "<title>", file);
      log.push("title");

      // description (name + property variants)
      const descMatch = html.match(/<meta name="description" content="([^"]*)" \/>/);
      if (descMatch) {
        html = replaceOnce(
          html,
          descMatch[0],
          `<meta name="description" content="${fullDesc(p)}" />`,
          'meta[name=description]',
          file,
        );
        log.push("description");
      }
      const nameTitle = html.match(/<meta name="title" content="([^"]*)" \/>/);
      if (nameTitle) {
        html = replaceOnce(
          html,
          nameTitle[0],
          `<meta name="title" content="${p.title}" />`,
          'meta[name=title]',
          file,
        );
        log.push("meta title");
      }
      const ogTitle = html.match(/<meta property="og:title" content="([^"]*)" \/>/);
      if (ogTitle) {
        html = replaceOnce(
          html,
          ogTitle[0],
          `<meta property="og:title" content="${p.title}" />`,
          "og:title",
          file,
        );
        log.push("og:title");
      }
      const ogDescM = html.match(/<meta property="og:description" content="([^"]*)" \/>/);
      if (ogDescM) {
        html = replaceOnce(
          html,
          ogDescM[0],
          `<meta property="og:description" content="${ogDesc(p)}" />`,
          "og:description",
          file,
        );
        log.push("og:description");
      }
      // replace an existing *relative* og:image, else add one in the block
      let ogImageLine = `<meta property="og:image" content="${p.image}" />`;
      const ogImgM = html.match(/<meta property="og:image" content="([^"]*)" \/>/);
      if (ogImgM) {
        html = replaceOnce(html, ogImgM[0], ogImageLine, "og:image", file);
        ogImageLine = "";
        log.push("og:image (→ absolute)");
      }
      // clarity: normalize the author attribution to the actual creator
      if (p.authorOld && html.includes(p.authorOld)) {
        html = html.replace(
          p.authorOld,
          '<meta name="author" content="Amirehsan Ashoori — Picksaw" />',
        );
        log.push("author");
      } else if (!html.includes('name="author"')) {
        ogImageLine += `\n    <meta name="author" content="Amirehsan Ashoori — Picksaw" />`;
      }
      // twitter card trio when missing (clarity already has card+title+desc)
      let twitterBlock = "";
      if (!html.includes('name="twitter:card"')) {
        twitterBlock = `\n    <meta name="twitter:card" content="summary_large_image" />`;
      }
      if (html.includes('name="twitter:title"')) {
        const twT = html.match(/<meta name="twitter:title" content="([^"]*)" \/>/);
        html = replaceOnce(html, twT[0], `<meta name="twitter:title" content="${p.title}" />`, "twitter:title", file);
        const twD = html.match(/<meta name="twitter:description" content="([^"]*)" \/>/);
        if (twD)
          html = replaceOnce(
            html,
            twD[0],
            `<meta name="twitter:description" content="${ogDesc(p)}" />`,
            "twitter:description",
            file,
          );
        log.push("twitter (updated)");
      } else {
        twitterBlock += `\n    <meta name="twitter:title" content="${p.title}" />\n    <meta name="twitter:description" content="${ogDesc(p)}" />`;
        log.push("twitter (added)");
      }

      const localeLine = html.includes('property="og:locale"')
        ? ""
        : `\n    <meta property="og:locale" content="fa_IR" />\n    <meta property="og:locale:alternate" content="en_US" />`;

      const block =
        `    <!-- Picksaw integration SEO: canonical route + social cards + structured data -->\n` +
        `    ${canon}\n` +
        `    <meta property="og:url" content="https://picksaw.ir/${p.dir}/" />\n` +
        `    <meta property="og:site_name" content="Picksaw / پیکسا" />${localeLine}\n` +
        (ogImageLine ? `    ${ogImageLine}\n` : "") +
        `    <meta name="twitter:image" content="${p.image}" />${twitterBlock}\n` +
        `    <script type="application/ld+json">\n    ${jsonLd(p)}\n    </script>\n`;

      html = replaceOnce(html, "</head>", `${block}  </head>`, "</head>", file);
      log.push("canonical/og/json-ld");

      if (!p.static) {
        html = replaceOnce(
          html,
          '<div id="root"></div>',
          `<div id="root"></div>\n    ${noscript(p)}`,
          "root noscript",
          file,
        );
        log.push("noscript");
      }
      writeFileSync(file, html);
    }
    console.log(`${p.dir}: ${log.join(", ")}`);
  } catch (err) {
    anyFail = true;
    console.error(`${p.dir}: FAILED — ${err.message}`);
  }
}

process.exit(anyFail ? 1 : 0);
