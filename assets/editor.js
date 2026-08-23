/**
 * =====================================================================
 * NURULQURAN STUDIO · Easy In-Browser WYSIWYG Editor & Cloud Publisher
 * Zero-dependency, lightweight, standalone visual editor with direct
 * GitHub & Cloudflare Pages cloud server synchronization.
 * =====================================================================
 */

(function () {
  "use strict";

  if (window.__NQ_EDITOR_INITIALIZED__) return;
  window.__NQ_EDITOR_INITIALIZED__ = true;

  /* =====================================================================
     1. STATE & CONFIGURATION
  ===================================================================== */
  const state = {
    isEditMode: false,
    modifiedCount: 0,
    activeElement: null,
    savedSelection: null,
    filename: getFilename(),
    draftKey: "nq_draft_" + getFilename(),
    ghOwner: localStorage.getItem("nq_gh_owner") || "islamwell",
    ghRepo: localStorage.getItem("nq_gh_repo") || "nurulquran-showcase",
    ghBranch: localStorage.getItem("nq_gh_branch") || "main",
    ghToken: localStorage.getItem("nq_gh_token") || ""
  };

  function getFilename() {
    let path = window.location.pathname.split("/").pop();
    if (!path || path === "" || path === "/") path = "index.html";
    if (!path.endsWith(".html")) path += ".html";
    return path;
  }

  function getNextVersion() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const verEl = document.querySelector(".nq-version-tag, .footer-version-tag");
    if (verEl) {
      const m = verEl.textContent.match(/v(\\d+)\\.(\\d+)\\.(\\d+)/);
      if (m) {
        const major = parseInt(m[1], 10);
        const minor = parseInt(m[2], 10);
        const patch = parseInt(m[3], 10) + 1;
        return `v${major}.${minor}.${patch} (updated ${timeStr})`;
      }
    }
    return `v1.0.7 (updated ${timeStr})`;
  }

  /* =====================================================================
     2. STYLES INJECTION
  ===================================================================== */
  const styles = `
    #nq-editor-pill {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99990;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: linear-gradient(135deg, rgba(18, 26, 46, 0.95), rgba(8, 14, 28, 0.95));
      border: 1px solid rgba(245, 201, 123, 0.35);
      color: #F5C97B;
      padding: 9px 16px 9px 12px;
      border-radius: 9999px;
      font-family: "Inter", system-ui, -apple-system, sans-serif;
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      cursor: pointer;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(245, 201, 123, 0.2);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      user-select: none;
    }
    #nq-editor-pill:hover {
      transform: translateY(-2px) scale(1.03);
      border-color: #F5C97B;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 201, 123, 0.4);
      color: #FFFFFF;
    }
    #nq-editor-pill svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    #nq-editor-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 56px;
      z-index: 99999;
      background: rgba(6, 12, 22, 0.96);
      border-bottom: 1px solid rgba(245, 201, 123, 0.3);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 18px;
      font-family: "Inter", system-ui, -apple-system, sans-serif;
      color: #F8FAFC;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
      animation: nqSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes nqSlideDown {
      from { transform: translateY(-100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .nq-bar-left, .nq-bar-mid, .nq-bar-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .nq-mode-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(45, 212, 191, 0.15);
      border: 1px solid rgba(45, 212, 191, 0.4);
      color: #2DD4BF;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .nq-badge-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #2DD4BF;
      box-shadow: 0 0 8px #2DD4BF;
      animation: nqPulse 1.8s infinite;
    }
    @keyframes nqPulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }

    .nq-change-counter {
      font-size: 0.75rem;
      color: #94A3B8;
      font-weight: 600;
    }

    .nq-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #E2E8F0;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }
    .nq-btn:hover {
      background: rgba(255, 255, 255, 0.14);
      color: #FFFFFF;
      border-color: rgba(245, 201, 123, 0.4);
      transform: translateY(-1px);
    }
    .nq-btn-primary {
      background: linear-gradient(135deg, #F5C97B 0%, #D4AF37 100%);
      color: #060913 !important;
      border-color: #F5C97B;
      font-weight: 700;
      box-shadow: 0 0 16px rgba(245, 201, 123, 0.35);
    }
    .nq-btn-primary:hover {
      background: linear-gradient(135deg, #FFF0B8 0%, #F5C97B 100%);
      box-shadow: 0 0 24px rgba(245, 201, 123, 0.55);
      transform: translateY(-1px);
    }
    .nq-btn-close {
      background: rgba(244, 63, 94, 0.14);
      border-color: rgba(244, 63, 94, 0.3);
      color: #FDA4AF;
    }
    .nq-btn-close:hover {
      background: rgba(244, 63, 94, 0.28);
      color: #FFFFFF;
    }
    .nq-sep {
      width: 1px;
      height: 20px;
      background: rgba(255, 255, 255, 0.14);
      margin: 0 4px;
    }

    #nq-wysiwyg-bubble {
      position: absolute;
      z-index: 100000;
      display: none;
      align-items: center;
      gap: 3px;
      background: rgba(14, 22, 38, 0.96);
      border: 1px solid rgba(245, 201, 123, 0.4);
      border-radius: 12px;
      padding: 4px 6px;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.8), 0 0 20px rgba(245, 201, 123, 0.25);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      transform: translate(-50%, -100%);
      margin-top: -10px;
      animation: nqPop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes nqPop {
      from { transform: translate(-50%, -90%) scale(0.9); opacity: 0; }
      to { transform: translate(-50%, -100%) scale(1); opacity: 1; }
    }
    #nq-wysiwyg-bubble::after {
      content: "";
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid rgba(14, 22, 38, 0.96);
    }
    .nq-bubble-btn {
      background: transparent;
      border: none;
      color: #E2E8F0;
      padding: 6px 8px;
      border-radius: 6px;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      display: grid;
      place-items: center;
      transition: all 0.15s ease;
      font-family: inherit;
      line-height: 1;
      min-width: 28px;
    }
    .nq-bubble-btn:hover {
      background: rgba(245, 201, 123, 0.2);
      color: #F5C97B;
    }
    .nq-bubble-btn.active {
      background: #F5C97B;
      color: #060913;
    }

    .nq-editing-active body {
      padding-top: 56px !important;
    }
    .nq-editable {
      outline: 1.5px dashed rgba(245, 201, 123, 0.3) !important;
      outline-offset: 3px;
      border-radius: 4px;
      transition: outline-color 0.2s ease, box-shadow 0.2s ease;
      cursor: text;
    }
    .nq-editable:hover {
      outline-color: rgba(245, 201, 123, 0.7) !important;
      background: rgba(245, 201, 123, 0.04);
    }
    .nq-editable:focus {
      outline: 2px solid #F5C97B !important;
      outline-offset: 4px;
      background: rgba(245, 201, 123, 0.08);
      box-shadow: 0 0 16px rgba(245, 201, 123, 0.25);
    }
    .nq-modified {
      outline-color: rgba(45, 212, 191, 0.8) !important;
    }

    .nq-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 100010;
      background: rgba(3, 6, 12, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      display: none;
      place-items: center;
      padding: 20px;
      animation: nqFadeIn 0.25s ease;
    }
    @keyframes nqFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .nq-modal-box {
      background: #0D1527;
      border: 1px solid rgba(245, 201, 123, 0.3);
      border-radius: 20px;
      width: 100%;
      max-width: 560px;
      padding: 28px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 201, 123, 0.15);
      font-family: "Inter", system-ui, -apple-system, sans-serif;
      color: #F8FAFC;
    }
    .nq-modal-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 14px;
    }
    .nq-modal-head h3 {
      font-size: 1.25rem;
      font-weight: 800;
      color: #F5C97B;
      margin: 0;
    }
    .nq-modal-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
      font-size: 0.9rem;
    }
    .nq-input-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .nq-input-group label {
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      color: #94A3B8;
      text-transform: uppercase;
    }
    .nq-input {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      padding: 10px 14px;
      color: #FFFFFF;
      font-family: inherit;
      font-size: 0.92rem;
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .nq-input:focus {
      border-color: #F5C97B;
      box-shadow: 0 0 0 3px rgba(245, 201, 123, 0.2);
      background: rgba(255, 255, 255, 0.09);
    }
    .nq-modal-foot {
      margin-top: 24px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 18px;
    }
    .nq-status-box {
      padding: 12px 16px;
      border-radius: 10px;
      background: rgba(45, 212, 191, 0.1);
      border: 1px solid rgba(45, 212, 191, 0.3);
      color: #2DD4BF;
      font-size: 0.85rem;
      display: none;
      align-items: center;
      gap: 10px;
    }
    .nq-status-box.error {
      background: rgba(244, 63, 94, 0.12);
      border-color: rgba(244, 63, 94, 0.35);
      color: #FDA4AF;
    }

    #nq-toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: rgba(14, 22, 38, 0.96);
      border: 1px solid #F5C97B;
      color: #FFFFFF;
      padding: 12px 24px;
      border-radius: 999px;
      font-size: 0.88rem;
      font-weight: 600;
      z-index: 100020;
      box-shadow: 0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(245, 201, 123, 0.35);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none;
      font-family: "Inter", system-ui, -apple-system, sans-serif;
    }
    #nq-toast.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  `;

  const styleEl = document.createElement("style");
  styleEl.id = "nq-editor-styles";
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  /* =====================================================================
     3. DOM ELEMENTS CREATION
  ===================================================================== */
  const pill = document.createElement("button");
  pill.id = "nq-editor-pill";
  pill.setAttribute("aria-label", "Toggle WYSIWYG Editor (Alt+E)");
  pill.setAttribute("title", "Toggle WYSIWYG Editor (Alt+E)");
  pill.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 20h9"></path>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
    </svg>
    <span>Edit Page</span>
  `;
  document.body.appendChild(pill);

  const bar = document.createElement("div");
  bar.id = "nq-editor-bar";
  bar.style.display = "none";
  bar.innerHTML = `
    <div class="nq-bar-left">
      <div class="nq-mode-badge">
        <span class="nq-badge-dot"></span>
        <span>WYSIWYG Mode</span>
      </div>
      <span class="nq-change-counter" id="nq-changes-val">0 changes</span>
    </div>

    <div class="nq-bar-mid">
      <button class="nq-btn" id="nq-btn-undo" title="Undo (Cmd+Z)">↺ Undo</button>
      <button class="nq-btn" id="nq-btn-redo" title="Redo (Cmd+Y)">↻ Redo</button>
      <div class="nq-sep"></div>
      <button class="nq-btn" id="nq-btn-save-draft" title="Save draft in browser storage">💾 Save Draft</button>
      <button class="nq-btn" id="nq-btn-reset" title="Discard all local changes">🔄 Reset</button>
      <button class="nq-btn" id="nq-btn-export" title="Download standalone clean HTML file">📥 Export HTML</button>
    </div>

    <div class="nq-bar-right">
      <button class="nq-btn nq-btn-primary" id="nq-btn-push" title="Commit and deploy to Cloud Server">🚀 Push to Cloud</button>
      <button class="nq-btn" id="nq-btn-config" title="Settings & GitHub Token">⚙️</button>
      <button class="nq-btn nq-btn-close" id="nq-btn-exit" title="Exit Editor">✕ Exit</button>
    </div>
  `;
  document.body.appendChild(bar);

  const bubble = document.createElement("div");
  bubble.id = "nq-wysiwyg-bubble";
  bubble.innerHTML = `
    <button class="nq-bubble-btn" data-cmd="bold" title="Bold (Cmd+B)"><b>B</b></button>
    <button class="nq-bubble-btn" data-cmd="italic" title="Italic (Cmd+I)"><i>I</i></button>
    <button class="nq-bubble-btn" data-cmd="underline" title="Underline (Cmd+U)"><u>U</u></button>
    <button class="nq-bubble-btn" data-cmd="strikeThrough" title="Strikethrough"><s>S</s></button>
    <div class="nq-sep" style="height:14px"></div>
    <button class="nq-bubble-btn" data-action="gold" title="Gold Accent Highlight" style="color:#F5C97B">✦ Gold</button>
    <button class="nq-bubble-btn" data-action="teal" title="Teal Accent Highlight" style="color:#2DD4BF">✦ Teal</button>
    <button class="nq-bubble-btn" data-action="arabic" title="Arabic Font Family" style="font-family:'Amiri',serif">عربي</button>
    <div class="nq-sep" style="height:14px"></div>
    <button class="nq-bubble-btn" data-action="link" title="Insert / Edit Link">🔗</button>
    <button class="nq-bubble-btn" data-cmd="removeFormat" title="Clear Formatting">🧹</button>
  `;
  document.body.appendChild(bubble);

  const cloudModal = document.createElement("div");
  cloudModal.className = "nq-modal-backdrop";
  cloudModal.id = "nq-cloud-modal";
  cloudModal.innerHTML = `
    <div class="nq-modal-box">
      <div class="nq-modal-head">
        <h3>🚀 Push Changes to Cloud Server</h3>
        <button class="nq-btn nq-btn-close" id="nq-close-cloud-modal">✕</button>
      </div>
      <div class="nq-modal-body">
        <p style="color:#94A3B8;margin:0 0 8px">
          This will commit your changes directly to the <b><span id="nq-modal-repo"></span></b> repository on branch <b><span id="nq-modal-branch"></span></b> and trigger instant <b>Cloudflare Pages</b> deployment.
        </p>

        <div class="nq-input-group">
          <label>File to Publish</label>
          <input class="nq-input" id="nq-pub-file" readonly value="${state.filename}">
        </div>

        <div class="nq-input-group">
          <label>New Semantic Version</label>
          <input class="nq-input" id="nq-pub-version" readonly value="">
        </div>

        <div class="nq-input-group">
          <label>Commit Message</label>
          <input class="nq-input" id="nq-pub-msg" value="Update content in ${state.filename}">
        </div>

        <div class="nq-status-box" id="nq-pub-status">
          <span id="nq-pub-status-txt"></span>
        </div>
      </div>
      <div class="nq-modal-foot">
        <button class="nq-btn" id="nq-cancel-publish">Cancel</button>
        <button class="nq-btn nq-btn-primary" id="nq-do-publish">🚀 Commit & Deploy Live</button>
      </div>
    </div>
  `;
  document.body.appendChild(cloudModal);

  const configModal = document.createElement("div");
  configModal.className = "nq-modal-backdrop";
  configModal.id = "nq-config-modal";
  configModal.innerHTML = `
    <div class="nq-modal-box">
      <div class="nq-modal-head">
        <h3>⚙️ Cloud Server & GitHub Settings</h3>
        <button class="nq-btn nq-btn-close" id="nq-close-config-modal">✕</button>
      </div>
      <div class="nq-modal-body">
        <p style="color:#94A3B8;margin:0 0 6px">
          Configure your GitHub Personal Access Token (PAT) with <code>repo</code> permissions. Your token is stored securely in your browser's local storage only.
        </p>

        <div class="nq-input-group">
          <label>GitHub Personal Access Token (PAT)</label>
          <input class="nq-input" id="nq-cfg-token" type="password" placeholder="ghp_... or github_pat_..." value="${state.ghToken}">
          <small style="color:#64748B;font-size:0.75rem">
            Generate one on <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener" style="color:#F5C97B">GitHub Token Settings</a> with <code>repo</code> scope.
          </small>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="nq-input-group">
            <label>Repository Owner</label>
            <input class="nq-input" id="nq-cfg-owner" value="${state.ghOwner}">
          </div>
          <div class="nq-input-group">
            <label>Repository Name</label>
            <input class="nq-input" id="nq-cfg-repo" value="${state.ghRepo}">
          </div>
        </div>

        <div class="nq-input-group">
          <label>Target Branch</label>
          <input class="nq-input" id="nq-cfg-branch" value="${state.ghBranch}">
        </div>
      </div>
      <div class="nq-modal-foot">
        <button class="nq-btn" id="nq-cancel-config">Cancel</button>
        <button class="nq-btn nq-btn-primary" id="nq-save-config">Save Settings</button>
      </div>
    </div>
  `;
  document.body.appendChild(configModal);

  const toast = document.createElement("div");
  toast.id = "nq-toast";
  document.body.appendChild(toast);

  function showToast(msg, duration) {
    if (!duration) duration = 3000;
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), duration);
  }

  /* =====================================================================
     4. WYSIWYG & EDITING CORE
  ===================================================================== */
  const EDITABLE_SELECTORS = [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "li", "blockquote", "figcaption",
    ".lead", ".tr", ".en", ".q", ".qref",
    ".ayahbox", ".card p", ".card h3",
    ".stat-label", ".kicker", ".hero-desc", ".hero-title"
  ].join(",");

  function toggleEditMode(force) {
    state.isEditMode = force !== undefined ? force : !state.isEditMode;
    document.documentElement.classList.toggle("nq-editing-active", state.isEditMode);

    if (state.isEditMode) {
      pill.style.display = "none";
      bar.style.display = "flex";
      enableEditableElements();
      showToast("✏️ WYSIWYG Edit Mode active. Click any text to edit.");
    } else {
      pill.style.display = "inline-flex";
      bar.style.display = "none";
      bubble.style.display = "none";
      disableEditableElements();
      showToast("👁️ Returned to Preview Mode.");
    }
  }

  function enableEditableElements() {
    const els = document.querySelectorAll(EDITABLE_SELECTORS);
    els.forEach(el => {
      if (el.closest("#nq-editor-bar, #nq-editor-pill, #nq-wysiwyg-bubble, .nq-modal-backdrop, .nq-ar-ctrl")) return;
      el.setAttribute("contenteditable", "true");
      el.classList.add("nq-editable");

      el.addEventListener("input", handleElementInput);
      el.addEventListener("click", handleElementClick);
    });
  }

  function disableEditableElements() {
    const els = document.querySelectorAll(".nq-editable");
    els.forEach(el => {
      el.removeAttribute("contenteditable");
      el.classList.remove("nq-editable");
      el.removeEventListener("input", handleElementInput);
      el.removeEventListener("click", handleElementClick);
    });
  }

  function handleElementClick(e) {
    if (!state.isEditMode) return;
    if (e.target.tagName === "A" || e.target.closest("a")) {
      e.preventDefault();
    }
  }

  function handleElementInput(e) {
    if (!state.isEditMode) return;
    const el = e.currentTarget;
    if (!el.classList.contains("nq-modified")) {
      el.classList.add("nq-modified");
      state.modifiedCount++;
      updateChangeCounter();
    }
  }

  function updateChangeCounter() {
    const el = document.getElementById("nq-changes-val");
    if (el) el.textContent = `${state.modifiedCount} modification${state.modifiedCount === 1 ? "" : "s"}`;
  }

  /* =====================================================================
     5. SELECTION BUBBLE POSITIONING & FORMATTING
  ===================================================================== */
  document.addEventListener("selectionchange", handleSelectionChange);

  function handleSelectionChange() {
    if (!state.isEditMode) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      bubble.style.display = "none";
      return;
    }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) {
      bubble.style.display = "none";
      return;
    }

    const container = range.commonAncestorContainer;
    const editableEl = (container.nodeType === 1 ? container : container.parentElement).closest(".nq-editable");
    if (!editableEl) {
      bubble.style.display = "none";
      return;
    }

    bubble.style.display = "flex";
    const top = rect.top + window.scrollY - 8;
    const left = rect.left + window.scrollX + (rect.width / 2);
    bubble.style.top = `${top}px`;
    bubble.style.left = `${left}px`;
  }

  bubble.addEventListener("click", (e) => {
    const btn = e.target.closest(".nq-bubble-btn");
    if (!btn) return;
    e.preventDefault();

    const cmd = btn.dataset.cmd;
    const action = btn.dataset.action;

    if (cmd) {
      document.execCommand(cmd, false, null);
      handleSelectionChange();
      return;
    }

    if (action === "gold") {
      wrapSelectionWithStyle("color: #F5C97B; font-weight: 700;");
    } else if (action === "teal") {
      wrapSelectionWithStyle("color: #2DD4BF; font-weight: 700;");
    } else if (action === "arabic") {
      wrapSelectionWithStyle("font-family: var(--font-arabic, 'Amiri', serif); font-size: 1.25em; direction: rtl;");
    } else if (action === "link") {
      const url = prompt("Enter link URL (e.g. https://... or #section):", "https://");
      if (url) document.execCommand("createLink", false, url);
    }
  });

  function wrapSelectionWithStyle(styleStr) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;

    const range = sel.getRangeAt(0);
    const span = document.createElement("span");
    span.setAttribute("style", styleStr);

    try {
      span.appendChild(range.extractContents());
      range.insertNode(span);
      sel.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.addRange(newRange);
    } catch (err) {
      console.warn("Selection wrap error:", err);
    }
  }

  /* =====================================================================
     6. LOCAL STORAGE DRAFTS & REVERT
  ===================================================================== */
  function saveLocalDraft() {
    const html = getCleanSerializedHTML();
    localStorage.setItem(state.draftKey, html);
    showToast("💾 Draft saved locally in browser!");
  }

  function resetLocalDraft() {
    if (confirm("Are you sure you want to discard all local changes and reload the original page?")) {
      localStorage.removeItem(state.draftKey);
      window.location.reload();
    }
  }

  function checkForLocalDraft() {
    const saved = localStorage.getItem(state.draftKey);
    if (!saved) return;

    const banner = document.createElement("div");
    banner.id = "nq-draft-banner";
    banner.style.cssText = `
      position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
      background: rgba(14, 22, 38, 0.96); border: 1px solid #2DD4BF;
      color: #FFFFFF; padding: 8px 18px; border-radius: 999px; z-index: 99995;
      font-family: "Inter", system-ui, sans-serif; font-size: 0.8rem; font-weight: 600;
      display: flex; align-items: center; gap: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.6);
    `;
    banner.innerHTML = `
      <span>📝 An unsaved local draft exists for this page.</span>
      <button id="nq-res-draft" style="background:#2DD4BF;color:#060913;border:none;padding:3px 10px;border-radius:999px;font-weight:700;cursor:pointer">Restore Draft</button>
      <button id="nq-disc-draft" style="background:transparent;color:#94A3B8;border:none;cursor:pointer;padding:2px 6px">✕</button>
    `;
    document.body.appendChild(banner);

    document.getElementById("nq-res-draft").onclick = () => {
      document.open();
      document.write(saved);
      document.close();
    };
    document.getElementById("nq-disc-draft").onclick = () => {
      localStorage.removeItem(state.draftKey);
      banner.remove();
    };
  }

  /* =====================================================================
     7. CLEAN SERIALIZATION (ZERO ARTIFACTS)
  ===================================================================== */
  function getCleanSerializedHTML() {
    const clone = document.documentElement.cloneNode(true);

    const removeIds = [
      "nq-editor-styles",
      "nq-editor-pill",
      "nq-editor-bar",
      "nq-wysiwyg-bubble",
      "nq-cloud-modal",
      "nq-config-modal",
      "nq-toast",
      "nq-draft-banner"
    ];
    removeIds.forEach(id => {
      const el = clone.querySelector("#" + id);
      if (el) el.remove();
    });

    clone.classList.remove("nq-editing-active");
    clone.querySelectorAll(".nq-editable, .nq-modified").forEach(el => {
      el.removeAttribute("contenteditable");
      el.classList.remove("nq-editable", "nq-modified");
      if (el.getAttribute("class") === "") el.removeAttribute("class");
    });

    const nextVer = getNextVersion();
    const verEl = clone.querySelector(".nq-version-tag, .footer-version-tag");
    if (verEl) {
      verEl.textContent = nextVer;
    }

    return "<!DOCTYPE html>\n" + clone.outerHTML;
  }

  /* =====================================================================
     8. EXPORT STANDALONE HTML
  ===================================================================== */
  function exportHTMLFile() {
    const cleanHTML = getCleanSerializedHTML();
    const blob = new Blob([cleanHTML], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = state.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`📥 Exported clean standalone ${state.filename}`);
  }

  /* =====================================================================
     9. CLOUD SERVER & GITHUB PUSH ENGINE
  ===================================================================== */
  function openPublishModal() {
    if (!state.ghToken) {
      openConfigModal();
      showToast("⚠️ Please enter your GitHub Personal Access Token first.");
      return;
    }

    document.getElementById("nq-modal-repo").textContent = `${state.ghOwner}/${state.ghRepo}`;
    document.getElementById("nq-modal-branch").textContent = state.ghBranch;
    document.getElementById("nq-pub-file").value = state.filename;
    document.getElementById("nq-pub-version").value = getNextVersion();
    document.getElementById("nq-pub-msg").value = `Update content in ${state.filename} (${getNextVersion().split(" ")[0]})`;

    const statusBox = document.getElementById("nq-pub-status");
    statusBox.style.display = "none";
    statusBox.classList.remove("error");

    cloudModal.style.display = "grid";
  }

  function closePublishModal() {
    cloudModal.style.display = "none";
  }

  function openConfigModal() {
    document.getElementById("nq-cfg-token").value = state.ghToken;
    document.getElementById("nq-cfg-owner").value = state.ghOwner;
    document.getElementById("nq-cfg-repo").value = state.ghRepo;
    document.getElementById("nq-cfg-branch").value = state.ghBranch;
    configModal.style.display = "grid";
  }

  function closeConfigModal() {
    configModal.style.display = "none";
  }

  function saveConfig() {
    state.ghToken = document.getElementById("nq-cfg-token").value.trim();
    state.ghOwner = document.getElementById("nq-cfg-owner").value.trim() || "islamwell";
    state.ghRepo = document.getElementById("nq-cfg-repo").value.trim() || "nurulquran-showcase";
    state.ghBranch = document.getElementById("nq-cfg-branch").value.trim() || "main";

    localStorage.setItem("nq_gh_token", state.ghToken);
    localStorage.setItem("nq_gh_owner", state.ghOwner);
    localStorage.setItem("nq_gh_repo", state.ghRepo);
    localStorage.setItem("nq_gh_branch", state.ghBranch);

    closeConfigModal();
    showToast("⚙️ Settings saved successfully!");
  }

  async function executeCloudPublish() {
    const statusBox = document.getElementById("nq-pub-status");
    const statusTxt = document.getElementById("nq-pub-status-txt");
    const btnDoPublish = document.getElementById("nq-do-publish");

    statusBox.style.display = "flex";
    statusBox.classList.remove("error");
    btnDoPublish.disabled = true;
    btnDoPublish.textContent = "Publishing...";

    const commitMsg = document.getElementById("nq-pub-msg").value.trim() || `Update content in ${state.filename}`;

    try {
      statusTxt.textContent = "1/3 · Fetching file metadata from GitHub...";
      const apiUrl = `https://api.github.com/repos/${state.ghOwner}/${state.ghRepo}/contents/${state.filename}?ref=${state.ghBranch}`;

      const getRes = await fetch(apiUrl, {
        headers: {
          "Authorization": `Bearer ${state.ghToken}`,
          "Accept": "application/vnd.github+json"
        }
      });

      let currentSha = null;
      if (getRes.ok) {
        const getData = await getRes.json();
        currentSha = getData.sha;
      } else if (getRes.status !== 404) {
        const errJson = await getRes.json().catch(() => ({}));
        throw new Error(errJson.message || `GitHub error (${getRes.status})`);
      }

      statusTxt.textContent = "2/3 · Packaging and encoding clean UTF-8 HTML...";
      const cleanHTML = getCleanSerializedHTML();
      const utf8Base64 = btoa(unescape(encodeURIComponent(cleanHTML)));

      statusTxt.textContent = "3/3 · Creating commit on main branch...";
      const putBody = {
        message: commitMsg,
        content: utf8Base64,
        branch: state.ghBranch
      };
      if (currentSha) putBody.sha = currentSha;

      const putRes = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${state.ghToken}`,
          "Accept": "application/vnd.github+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(putBody)
      });

      if (!putRes.ok) {
        const errJson = await putRes.json().catch(() => ({}));
        throw new Error(errJson.message || `Failed to commit to GitHub (${putRes.status})`);
      }

      const putData = await putRes.json();
      const commitShaShort = putData.commit ? putData.commit.sha.substring(0, 7) : "latest";

      localStorage.removeItem(state.draftKey);

      statusBox.innerHTML = `
        <div>
          <p style="margin:0 0 4px;font-weight:700">✨ Success! Commit <a href="https://github.com/${state.ghOwner}/${state.ghRepo}/commit/${putData.commit.sha}" target="_blank" rel="noopener" style="color:#FFF0B8;text-decoration:underline">${commitShaShort}</a> created.</p>
          <p style="margin:0;font-size:0.8rem">Cloudflare Pages is now building & deploying live to <a href="https://nurulquran-showcase.pages.dev" target="_blank" rel="noopener" style="color:#FFF0B8;text-decoration:underline">nurulquran-showcase.pages.dev</a></p>
        </div>
      `;

      btnDoPublish.style.display = "none";
      document.getElementById("nq-cancel-publish").textContent = "Done";
      showToast("🚀 Pushed to Cloud Server successfully!");

    } catch (err) {
      statusBox.classList.add("error");
      statusTxt.textContent = `✗ Error: ${err.message}`;
      btnDoPublish.disabled = false;
      btnDoPublish.textContent = "Retry Publish";
    }
  }

  /* =====================================================================
     10. EVENT LISTENERS ATTACHMENT
  ===================================================================== */
  pill.addEventListener("click", () => toggleEditMode(true));

  document.getElementById("nq-btn-exit").addEventListener("click", () => toggleEditMode(false));
  document.getElementById("nq-btn-undo").addEventListener("click", () => document.execCommand("undo"));
  document.getElementById("nq-btn-redo").addEventListener("click", () => document.execCommand("redo"));
  document.getElementById("nq-btn-save-draft").addEventListener("click", saveLocalDraft);
  document.getElementById("nq-btn-reset").addEventListener("click", resetLocalDraft);
  document.getElementById("nq-btn-export").addEventListener("click", exportHTMLFile);
  document.getElementById("nq-btn-push").addEventListener("click", openPublishModal);
  document.getElementById("nq-btn-config").addEventListener("click", openConfigModal);

  document.getElementById("nq-close-cloud-modal").addEventListener("click", closePublishModal);
  document.getElementById("nq-cancel-publish").addEventListener("click", closePublishModal);
  document.getElementById("nq-do-publish").addEventListener("click", executeCloudPublish);

  document.getElementById("nq-close-config-modal").addEventListener("click", closeConfigModal);
  document.getElementById("nq-cancel-config").addEventListener("click", closeConfigModal);
  document.getElementById("nq-save-config").addEventListener("click", saveConfig);

  document.addEventListener("keydown", (e) => {
    if ((e.altKey && e.key.toLowerCase() === "e") || (e.metaKey && e.shiftKey && e.key.toLowerCase() === "e")) {
      e.preventDefault();
      toggleEditMode();
    }
  });

  checkForLocalDraft();

})();
