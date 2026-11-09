# Evan Exanes: portfolio

Portfolio of Evan Prens P. Exanes, web developer and SEO specialist. A static site in HTML, CSS and plain JavaScript, with no build step and no framework. Built for USERDES at Asia Pacific College.

**Live site:** https://evanexanes.github.io/

## Pages

| Page | File |
|---|---|
| Home | `index.html` |
| Case study: corporate website | `02-case-study-corporate.html` |
| Case study: blog website | `03-case-study-blog.html` |
| Case study: e-commerce store | `04-case-study-ecommerce.html` |
| Case study: personal website | `05-case-study-personal.html` |
| About | `06-about.html` |
| Contact | `07-contact.html` |
| Case study: B2B blog articles | `08-case-study-tecadvance-blog.html` |
| Case study: MotoPulse | `09-case-study-motopulse.html` |
| Case study: NCTN Bank | `10-case-study-nctn-bank.html` |
| Case study: SEO on this site | `11-case-study-seo.html` |

The four WordPress case studies each link to a live demo, a static export that lives in its own repository: [corporate-website](https://github.com/evanexanes/corporate-website), [blog-website](https://github.com/evanexanes/blog-website), [ecommerce-website](https://github.com/evanexanes/ecommerce-website) and [personal-website](https://github.com/evanexanes/personal-website). The MotoPulse and NCTN Bank case studies link to [motopulse](https://github.com/evanexanes/motopulse) and [nctn-bank-java](https://github.com/evanexanes/nctn-bank-java).

## What the site does
- **Light and dark theme.** The header switch flips it, and the browser remembers the choice.
- **Phone menu.** At 1024 px and below, a hamburger opens a side drawer that traps focus, closes on Escape and hands focus back to the button.
- **Quick answers.** A panel of pre-written answers. It is not AI, and it makes no network request.
- **Consent first.** The Google Map and the Cal.com booking pop-up load only after you allow embeds. Without JavaScript the map stays a link, and Schedule a call opens Cal.com in a new tab.
- **Contact form.** It posts to Web3Forms and points to an email address if the request fails.
- **Reduced motion.** The count-up numbers and the carousel autoplay switch off when the visitor asks for reduced motion.

## Files

| Path | What it holds |
|---|---|
| `styles.css` | Styles for every page, including both themes |
| `script.js` | Page behaviour as independent blocks: drawer, theme switch, consent, booking pop-up, Quick answers, carousel, contact form and more |
| `assets/` | The CV (PDF), fonts, 33 certificate PDFs and images |
| `sitemap.xml`, `robots.txt` | Files for search engines |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are |

## Run it locally
No build step. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. The map, the booking pop-up and the contact form need an internet connection.

## Deploy
GitHub Pages serves the `main` branch from the repository root.

## Source file headers
Every HTML, CSS and JavaScript file opens with a header block: program name, description, author, date compiled and a change history. A commit that changes a file adds a row to its history.
