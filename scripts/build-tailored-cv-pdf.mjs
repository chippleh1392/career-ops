#!/usr/bin/env node
/**
 * One-off style helper: fill templates/cv-template.html and run generate-pdf.mjs.
 * Usage: node scripts/build-tailored-cv-pdf.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import yaml from 'yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const profile = yaml.parse(fs.readFileSync(path.join(root, 'config/profile.yml'), 'utf8'));
const c = profile.candidate;

const PHONE = c.phone?.trim() || '224-856-0217';
const LINKEDIN_URL = c.linkedin?.startsWith('http')
  ? c.linkedin
  : `https://${c.linkedin}`;
const GITHUB_URL = `https://${c.github}`;

const SHARED = {
  LANG: 'en',
  NAME: c.full_name,
  PHONE,
  EMAIL: c.email,
  LINKEDIN_URL,
  LINKEDIN_DISPLAY: c.linkedin.replace(/^https?:\/\//, ''),
  PORTFOLIO_URL: GITHUB_URL,
  PORTFOLIO_DISPLAY: c.github,
  LOCATION: c.location,
  PAGE_WIDTH: '8.5in',
  SECTION_SUMMARY: 'Professional Summary',
  SECTION_COMPETENCIES: 'Core Competencies',
  SECTION_EXPERIENCE: 'Experience',
  SECTION_PROJECTS: 'Projects',
  SECTION_EDUCATION: 'Education',
  SECTION_CERTIFICATIONS: 'Certifications',
  SECTION_SKILLS: 'Technical Skills',
};

const EXPERIENCE = `
<div class="job avoid-break">
  <div class="job-header">
    <span class="job-company">DYODE</span>
    <span class="job-period">Feb 2023 - Mar 2026</span>
  </div>
  <div class="job-role">Senior Frontend Developer <span class="job-location">Remote</span></div>
  <ul>
    <li>Primary developer and technical owner across Shopify Plus retainers: custom sections, metafields, Shopify Flow, Functions, checkout extensibility, third-party integrations.</li>
    <li>Site speed and accessibility audits; ADA and Core Web Vitals improvements in production.</li>
    <li>GA4, GTM, CRO, and A/B testing support; code reviews, releases, mentoring, and stakeholder alignment.</li>
  </ul>
</div>
<div class="job avoid-break">
  <div class="job-header">
    <span class="job-company">DYODE</span>
    <span class="job-period">Mar 2021 - Feb 2023</span>
  </div>
  <div class="job-role">Front End Developer <span class="job-location">Remote</span></div>
  <ul>
    <li>Shopify and BigCommerce storefront features; Liquid, HTML/CSS/SCSS, JavaScript, React.</li>
    <li>Analytics, experimentation, accessibility, SEO, and app integrations; WordPress-to-BigCommerce migration exposure.</li>
  </ul>
</div>
<div class="job avoid-break">
  <div class="job-header">
    <span class="job-company">Americaneagle.com</span>
    <span class="job-period">Mar 2020 - Mar 2021</span>
  </div>
  <div class="job-role">Front End Developer</div>
  <ul>
    <li>Responsive ecommerce; GraphQL integration; accessibility, site speed, and SEO support.</li>
  </ul>
</div>
`;

const PROJECTS = `
<div class="project avoid-break">
  <div class="job-header">
    <span class="job-company">YouTube Analytics App</span>
  </div>
  <ul>
    <li>Internal analytics tool; product-style frontend ownership outside pure theme work.</li>
  </ul>
</div>
`;

const EDUCATION = `
<div class="edu-item avoid-break">
  <div class="job-company">Northeastern Illinois University</div>
  <div class="job-role">Bachelor of Science in Computer Science</div>
  <div class="job-period">2016 - 2019</div>
</div>
`;

const CERTS = `
<div class="cert-item avoid-break">Data Mining Specialization - University of Illinois Urbana-Champaign | 2024</div>
<div class="cert-item avoid-break">Mathematics for Machine Learning: Linear Algebra - Imperial College London | 2024</div>
`;

const SKILLS =
  'JavaScript, TypeScript, React, HTML5, CSS/SCSS, Liquid, Shopify Plus, Shopify Flow, Shopify Functions, Checkout Extensibility, GraphQL, GA4, GTM, WCAG, Core Web Vitals, Git.';

function tags(list) {
  return list
    .map((t) => `<div class="competency-tag">${t}</div>`)
    .join('\n');
}

const VARIANTS = {
  kombo: {
    file: 'cv-candidate-kombo-2026-04-14',
    SUMMARY_TEXT: `Senior frontend engineer with six years of ecommerce delivery, specializing in Shopify Plus: Liquid, OS 2.0 patterns, checkout extensibility, Shopify Functions, and high-traffic storefront work. Proven track record on Core Web Vitals, accessibility (WCAG/ADA), GA4/GTM, Klaviyo-class integrations, and CRO experimentation. Comfortable mentoring developers, leading code review, and partnering with marketing and ecommerce on launches and campaigns. Seeking to own Glamnetic's US and UK Shopify surfaces while raising the bar for performance and conversion.`,
    COMPETENCIES: tags([
      'Shopify Plus',
      'Liquid & OS 2.0',
      'Core Web Vitals',
      'WCAG / ADA',
      'GA4 & GTM',
      'Checkout extensibility',
      'React',
      'Mentoring',
    ]),
  },
  curio: {
    file: 'cv-candidate-curio-2026-04-14',
    SUMMARY_TEXT: `Senior Shopify-focused engineer with six years building and owning production storefronts across Shopify Plus and related stacks. Deep experience in accessibility compliance, technical SEO foundations, site performance, schema and analytics instrumentation, and third-party app and API integrations. Comfortable operating as the technical bridge between brand, marketing, and engineering stakeholders, including scoping, estimation, and delivery across multiple properties. Based in Texas; eligible for listed state requirements.`,
    COMPETENCIES: tags([
      'Shopify Plus',
      'Multi-brand commerce',
      'ADA & WCAG',
      'Technical SEO',
      'CWV & performance',
      'ERP / app integrations',
      'Stakeholder alignment',
      'Liquid & JavaScript',
    ]),
  },
};

function fillTemplate(variant) {
  const tpl = fs.readFileSync(path.join(root, 'templates/cv-template.html'), 'utf8');
  const v = VARIANTS[variant];
  const data = {
    ...SHARED,
    SUMMARY_TEXT: v.SUMMARY_TEXT,
    COMPETENCIES: v.COMPETENCIES,
    EXPERIENCE,
    PROJECTS,
    EDUCATION,
    CERTIFICATIONS: CERTS,
    SKILLS,
  };
  let out = tpl;
  for (const [key, val] of Object.entries(data)) {
    out = out.split(`{{${key}}}`).join(val);
  }
  if (out.includes('{{')) {
    throw new Error(`Unfilled placeholders in ${variant}`);
  }
  return out;
}

for (const key of Object.keys(VARIANTS)) {
  const html = fillTemplate(key);
  const base = VARIANTS[key].file;
  const htmlPath = path.join(root, 'output', `${base}.html`);
  const pdfPath = path.join(root, 'output', `${base}.pdf`);
  fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log(`Wrote ${htmlPath}`);
  execSync(`node "${path.join(root, 'generate-pdf.mjs')}" "${htmlPath}" "${pdfPath}" --format=letter`, {
    stdio: 'inherit',
    cwd: root,
  });
}
