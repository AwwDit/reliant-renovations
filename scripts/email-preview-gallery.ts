import type { EmailTemplate } from "../lib/email/templates";

export interface EmailPreview {
  id: string;
  label: string;
  audience: string;
  trigger: string;
  template: EmailTemplate;
}

/** An offline viewer. Uses only synthetic, already-rendered email content. */
export function emailPreviewGallery(
  previews: EmailPreview[],
  logo: string,
): string {
  // Escape HTML parser delimiters even though this data currently contains only fixtures.
  const data = JSON.stringify(previews)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Email previews | Reliant Renovations</title>
  <style>
    *{box-sizing:border-box}
    :root{font-family:Arial,Helvetica,sans-serif;color:#202524;background:#e9eceb;font-synthesis:none}
    body{margin:0}
    button,a{-webkit-tap-highlight-color:transparent}
    button{font:inherit;cursor:pointer}
    button:focus-visible,a:focus-visible{outline:3px solid #2463eb;outline-offset:4px}
    [hidden]{display:none!important}
    .layout{display:grid;grid-template-columns:272px minmax(0,1fr);min-height:100vh}
    .sidebar{background:#181c1d;color:#f9faf9;padding:36px 24px;display:flex;flex-direction:column;align-items:flex-start;position:sticky;top:0;height:100vh}
    .brand{width:126px;height:auto;display:block;margin:0 0 42px}
    .eyebrow{font-size:10px;line-height:1.5;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;color:#b5bfbc;margin:0 0 12px}
    h1{font-size:27px;letter-spacing:-1px;font-weight:500;line-height:1.2;margin:0 0 30px}
    nav{width:100%;border-top:1px solid #3b4240}
    .email-choice{display:flex;align-items:flex-start;gap:14px;width:100%;text-align:left;border:0;border-bottom:1px solid #3b4240;background:transparent;color:#b5bfbc;padding:20px 12px;line-height:1.4}
    .email-choice:hover{background:#23292a;color:#fff}
    .email-choice[aria-pressed="true"]{background:#f9faf9;color:#202524;box-shadow:inset 3px 0 #2463eb}
    .number{font-size:10px;line-height:20px;color:#899793;font-variant-numeric:tabular-nums}
    .email-choice[aria-pressed="true"] .number{color:#195bdf}
    .choice-title{display:block;font-size:13px;font-weight:600}
    .choice-audience{display:block;font-size:11px;opacity:.8;margin-top:4px}
    .sidebar-note{margin:auto 0 0;padding-top:32px;color:#b5bfbc;font-size:12px;line-height:1.7;max-width:210px}
    .sidebar-note strong{color:#f9faf9;font-weight:500}
    main{min-width:0}
    .header{background:#f9faf9;padding:36px 40px 28px;border-bottom:1px solid #cbd2ce}
    .heading-row{display:flex;align-items:center;justify-content:space-between;gap:16px}
    .heading-row .eyebrow{color:#195bdf;margin:0}
    .counter{font-size:11px;color:#606765;font-variant-numeric:tabular-nums}
    h2{font-size:clamp(25px,2.4vw,36px);line-height:1.2;letter-spacing:-1px;font-weight:500;margin:18px 0 12px}
    .trigger{font-size:13px;color:#606765;line-height:1.7;margin:0 0 22px}
    .metadata{display:grid;grid-template-columns:66px minmax(0,1fr);gap:10px;font-size:12px;line-height:1.5;margin:0}
    dt{color:#606765}dd{margin:0;overflow-wrap:anywhere}
    .toolbar{display:flex;align-items:center;flex-wrap:wrap;gap:14px;padding:20px 40px}
    .control-group{display:flex;border:1px solid #bdc6c1;background:#f9faf9;padding:3px;gap:2px}
    .toggle{border:0;background:transparent;padding:10px 14px;color:#4e5754;font-size:12px;line-height:1.3}
    .toggle[aria-pressed="true"]{background:#202524;color:#fff}
    .toggle:disabled{opacity:.45;cursor:default}
    .export{margin-left:auto;font-size:12px;color:#202524;text-decoration:none;border-bottom:1px solid #778680;padding:8px 0}
    .export:hover{color:#195bdf}
    .canvas{padding:0 32px 40px;min-width:0}
    .viewport{box-sizing:content-box;width:760px;max-width:calc(100% - 2px);margin:0 auto;border:1px solid #cbd2ce;box-shadow:0 12px 35px #2025240d;background:#f9faf9}
    .viewport[data-size="mobile"]{width:390px}
    iframe{display:block;width:100%;height:700px;border:0;background:#e9eceb}
    pre{margin:0;padding:28px;font:13px/1.8 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere}
    .preview-note{text-align:center;font-size:11px;line-height:1.7;color:#606765;margin:20px 0 0}
    #link-status{color:#195bdf}
    @media(max-width:900px){
      .layout{grid-template-columns:224px minmax(0,1fr)}
      .sidebar{padding:28px 16px}.header{padding:28px}.toolbar{padding:20px 28px}.canvas{padding:0 20px 30px}
    }
    @media(max-width:640px){
      .layout{display:block}.sidebar{position:static;height:auto;padding:22px 20px}
      .brand{width:84px;margin:0 0 22px}.sidebar .eyebrow{margin-bottom:5px}h1{font-size:24px;margin-bottom:20px}
      nav{display:grid;grid-template-columns:1fr 1fr}.email-choice{padding:14px 10px;gap:9px}
      .sidebar-note{margin-top:16px;padding:0;max-width:none;font-size:11px}.sidebar-note br{display:none}
      .header{padding:24px 20px}.toolbar{padding:16px 20px;gap:10px}.toggle{padding:10px 12px}
      .export{margin-left:0}.canvas{padding:0 12px 24px}.metadata{grid-template-columns:54px minmax(0,1fr)}
    }
  </style>
</head>
<body>
  <div class="layout">
    <aside class="sidebar">
      <img class="brand" src="${logo}" alt="Reliant Renovations Inc." width="126" height="90">
      <p class="eyebrow">Brand communications</p>
      <h1>Email previews</h1>
      <nav id="email-list" aria-label="Choose an email"></nav>
      <p class="sidebar-note"><strong>Local preview only.</strong><br> Sample content. No emails sent.<br> Run the preview command again after editing a template.</p>
    </aside>
    <main>
      <header class="header">
        <div class="heading-row"><p class="eyebrow" id="audience"></p><span class="counter" id="counter"></span></div>
        <h2 id="email-title"></h2>
        <p class="trigger" id="trigger"></p>
        <dl class="metadata"><dt>Subject</dt><dd id="subject"></dd><dt>To</dt><dd id="recipient"></dd></dl>
      </header>
      <div class="toolbar">
        <div class="control-group" role="group" aria-label="Preview width">
          <button class="toggle" type="button" data-size="desktop" aria-pressed="true">Desktop</button>
          <button class="toggle" type="button" data-size="mobile" aria-pressed="false">Mobile</button>
        </div>
        <div class="control-group" role="group" aria-label="Email format">
          <button class="toggle" type="button" data-format="html" aria-pressed="true">HTML</button>
          <button class="toggle" type="button" data-format="text" aria-pressed="false">Plain text</button>
        </div>
        <a class="export" id="export" download>Download HTML <span aria-hidden="true">↗</span></a>
      </div>
      <div class="canvas">
        <div class="viewport" id="viewport" data-size="desktop">
          <iframe id="email-frame" title="Email preview" sandbox="allow-same-origin" referrerpolicy="no-referrer"></iframe>
          <pre id="plain-text" hidden></pre>
        </div>
        <p class="preview-note"><span id="dimensions"></span> · Browser preview; email apps may render differently.<br><span id="link-status" role="status">Email links are disabled in this gallery.</span></p>
      </div>
    </main>
  </div>
  <noscript><p>Enable JavaScript for the gallery, or open the individual HTML files in this folder.</p></noscript>
  <script type="application/json" id="preview-data">${data}</script>
  <script>
    const previews = JSON.parse(document.getElementById('preview-data').textContent);
    const frame = document.getElementById('email-frame');
    const viewport = document.getElementById('viewport');
    const plainText = document.getElementById('plain-text');
    const exportLink = document.getElementById('export');
    const sizeButtons = Array.from(document.querySelectorAll('[data-size].toggle'));
    const formatButtons = Array.from(document.querySelectorAll('[data-format]'));
    let current = previews[0];
    let format = 'html';
    let emailObserver;
    let exportUrl;

    function fitEmail() {
      const body = frame.contentDocument && frame.contentDocument.body;
      if (body && !frame.hidden) frame.style.height = Math.ceil(body.getBoundingClientRect().height) + 2 + 'px';
      document.getElementById('dimensions').textContent = Math.round(viewport.getBoundingClientRect().width - 2) + ' px wide';
    }

    frame.addEventListener('load', () => {
      if (emailObserver) emailObserver.disconnect();
      const doc = frame.contentDocument;
      if (!doc || !doc.body) return;
      const blockLink = (event) => {
        if (event.target.closest('a')) {
          event.preventDefault();
          document.getElementById('link-status').textContent = 'Preview only — this link does not open or send anything.';
        }
      };
      doc.addEventListener('click', blockLink);
      doc.addEventListener('auxclick', blockLink);
      emailObserver = new ResizeObserver(fitEmail);
      emailObserver.observe(doc.body);
      fitEmail();
    });
    new ResizeObserver(fitEmail).observe(viewport);

    function showFormat(nextFormat) {
      format = nextFormat;
      frame.hidden = format !== 'html';
      plainText.hidden = format !== 'text';
      formatButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.format === format)));
      if (exportUrl) URL.revokeObjectURL(exportUrl);
      exportUrl = URL.createObjectURL(new Blob([format === 'html' ? current.template.html : current.template.text], {
        type: format === 'html' ? 'text/html;charset=utf-8' : 'text/plain;charset=utf-8'
      }));
      exportLink.href = exportUrl;
      exportLink.download = current.id + (format === 'html' ? '.html' : '.txt');
      exportLink.textContent = 'Download ' + (format === 'html' ? 'HTML' : 'text') + ' ↗';
      requestAnimationFrame(fitEmail);
    }

    const emailList = document.getElementById('email-list');
    previews.forEach((preview, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'email-choice';
      button.dataset.email = preview.id;
      const number = document.createElement('span');
      number.className = 'number';
      number.textContent = String(index + 1).padStart(2, '0');
      const copy = document.createElement('span');
      const title = document.createElement('span');
      title.className = 'choice-title';
      title.textContent = preview.label;
      const audience = document.createElement('span');
      audience.className = 'choice-audience';
      audience.textContent = preview.audience;
      copy.append(title, audience);
      button.append(number, copy);
      button.addEventListener('click', () => selectEmail(preview.id));
      emailList.append(button);
    });

    function selectEmail(id) {
      current = previews.find(preview => preview.id === id) || previews[0];
      document.querySelectorAll('.email-choice').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.email === current.id)));
      document.getElementById('audience').textContent = current.audience;
      document.getElementById('counter').textContent = String(previews.indexOf(current) + 1).padStart(2, '0') + ' / ' + String(previews.length).padStart(2, '0');
      document.getElementById('email-title').textContent = current.label;
      document.getElementById('trigger').textContent = current.trigger;
      document.getElementById('subject').textContent = current.template.subject;
      document.getElementById('recipient').textContent = current.audience + ' (sample)';
      document.getElementById('link-status').textContent = 'Email links are disabled in this gallery.';
      plainText.textContent = current.template.text;
      frame.title = current.label + ' email preview';
      frame.srcdoc = current.template.html;
      showFormat(format);
    }
    sizeButtons.forEach(button => button.addEventListener('click', () => {
      viewport.dataset.size = button.dataset.size;
      sizeButtons.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
      requestAnimationFrame(fitEmail);
    }));
    formatButtons.forEach(button => button.addEventListener('click', () => showFormat(button.dataset.format)));
    selectEmail(previews[0].id);
  </script>
</body>
</html>`;
}
