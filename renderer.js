// Prompts are loaded from prompt-uiux.js and prompt-branding.js
// (both included as <script> tags in index.html before this file)



const UIUX_SCHEMA = {
  type: "object",
  properties: {
    siteLoaded: { type: "boolean" },
    emailTier: { type: "string" },
    skipReason: { type: "string" },
    visitorReaction: { type: "string" },
    pillars: {
      type: "object",
      properties: {
        positioning: { type: "object", properties: { score: { type: "integer" }, reason: { type: "string" } } },
        trust: { type: "object", properties: { score: { type: "integer" }, reason: { type: "string" } } },
        conversion: { type: "object", properties: { score: { type: "integer" }, reason: { type: "string" } } }
      }
    },
    mostPainful: { type: "string" },
    mostImpressive: { type: "string" },
    industry: { type: "string" },
    opening_line: { type: "string" },
    specific_observation: { type: "string" },
    design_compliment: { type: "string" },
    pointers: { type: "array", items: { type: "string" } },
    what_works: {
      type: "array",
      items: {
        type: "object",
        properties: {
          pillar: { type: "string" },
          observation: { type: "string" }
        }
      }
    }
  }
};

const BRANDING_SCHEMA = {
  type: "object",
  properties: {
    siteLoaded: { type: "boolean" },
    emailTier: { type: "string" },
    skipReason: { type: "string" },
    sector: { type: "string" },
    brandStrength: { type: "integer" },
    differentiator: { type: "string" },
    visitorReaction: { type: "string" },
    industry: { type: "string" },
    opening_line: { type: "string" },
    brand_observation: { type: "string" },
    brand_compliment: { type: "string" },
    pointers: { type: "array", items: { type: "string" } },
    what_works: { type: "array", items: { type: "string" } }
  }
};

// State
let leads = [];
let isProcessing = false;
let currentProcessingBatch = null;
let cancelProcessing = false;
let currentMode = localStorage.getItem('currentMode') || 'uiux';
let activeCampaign = localStorage.getItem('activeCampaign') || 'Manual';
const CAMPAIGN_REGISTRY_KEY = 'campaignRegistryV1';
let sidebarOpen = localStorage.getItem('sidebarOpen') !== 'false';
let campaignRegistry = [];

// Tier grouping state — persists collapse state across re-renders
const tierCollapseState = {};

// Batch-level ENOC overrides — loaded from localStorage
let batchEnocSettings = {};
try { const s = localStorage.getItem('batchEnocSettings'); if (s) batchEnocSettings = JSON.parse(s); } catch(e) { batchEnocSettings = {}; }
const TIER_ORDER = ['strong', 'soft', 'compliment'];
const TIER_LABELS = { strong: 'Strong Critique', soft: 'Soft Observation', compliment: 'Compliment' };
const TIER_COLORS = { strong: '#EF4444', soft: '#F59E0B', compliment: '#10B981' };
const BATCH_LEAD_DELAY_MS = 15000;
const AI_MAX_CONTENT_CHARS = 3200;
const AI_MAX_429_RETRIES = 3;
const AI_429_BASE_DELAY_MS = 15000;
const AI_REPAIR_MAX_TOKENS = 1200;

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function normalizeCampaignName(name) {
  return String(name || '').trim();
}

function loadCampaignRegistry() {
  campaignRegistry = [];
  try {
    const raw = localStorage.getItem(CAMPAIGN_REGISTRY_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    const seen = new Set();
    parsed.forEach(entry => {
      const name = normalizeCampaignName(typeof entry === 'string' ? entry : entry?.name);
      if (!name || seen.has(name)) return;
      seen.add(name);
      campaignRegistry.push({
        name,
        createdAt: (typeof entry === 'object' && entry?.createdAt) ? entry.createdAt : new Date().toISOString()
      });
    });
  } catch (e) {
    campaignRegistry = [];
  }
}

function saveCampaignRegistry() {
  localStorage.setItem(CAMPAIGN_REGISTRY_KEY, JSON.stringify(campaignRegistry));
}

function ensureCampaignExists(name, createdAt = new Date().toISOString()) {
  const cleanName = normalizeCampaignName(name);
  if (!cleanName) return false;
  const existing = campaignRegistry.find(c => c.name === cleanName);
  if (existing) return false;
  campaignRegistry.push({ name: cleanName, createdAt });
  saveCampaignRegistry();
  return true;
}

function renameCampaignInRegistry(oldName, newName) {
  const oldClean = normalizeCampaignName(oldName);
  const newClean = normalizeCampaignName(newName);
  if (!oldClean || !newClean || oldClean === newClean) return;

  const existing = campaignRegistry.find(c => c.name === oldClean);
  if (existing) {
    existing.name = newClean;
    saveCampaignRegistry();
  } else {
    ensureCampaignExists(newClean);
  }
}

function removeCampaignFromRegistry(name) {
  const cleanName = normalizeCampaignName(name);
  if (!cleanName) return;
  const next = campaignRegistry.filter(c => c.name !== cleanName);
  if (next.length === campaignRegistry.length) return;
  campaignRegistry = next;
  saveCampaignRegistry();
}

function syncCampaignRegistryWithLeads() {
  const nowIso = new Date().toISOString();
  const byName = new Map();
  let changed = false;

  campaignRegistry.forEach(c => {
    const name = normalizeCampaignName(c?.name);
    if (!name) {
      changed = true;
      return;
    }
    if (!byName.has(name)) {
      byName.set(name, { name, createdAt: c?.createdAt || nowIso });
    } else {
      changed = true;
    }
  });

  const collectFromLeads = (list, defaultCampaign) => {
    list.forEach(l => {
      const campaignName = normalizeCampaignName(l.campaign || defaultCampaign);
      if (!campaignName) return;
      if (!byName.has(campaignName)) {
        byName.set(campaignName, { name: campaignName, createdAt: l.dateAdded || nowIso });
        changed = true;
        return;
      }
      if (l.dateAdded && l.dateAdded < byName.get(campaignName).createdAt) {
        byName.get(campaignName).createdAt = l.dateAdded;
        changed = true;
      }
    });
  };
  collectFromLeads(leads, 'Manual');
  collectFromLeads(personalLeads, 'Personal');

  const activeName = normalizeCampaignName(activeCampaign) || 'Manual';
  if (!byName.has(activeName)) {
    byName.set(activeName, { name: activeName, createdAt: nowIso });
    changed = true;
  }

  campaignRegistry = Array.from(byName.values());
  if (changed) saveCampaignRegistry();
}

function trimAiContent(text, maxChars = AI_MAX_CONTENT_CHARS) {
  const value = String(text || '');
  if (value.length <= maxChars) return value;
  const truncated = value.slice(0, maxChars);
  return `${truncated}\n\n[CONTENT TRUNCATED TO ${maxChars} CHARACTERS FOR RATE-LIMIT SAFETY]`;
}

function parseModelJson(rawText) {
  if (!rawText) return null;
  let clean = String(rawText).trim();
  clean = clean.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }
  try { return JSON.parse(clean); } catch (e) { return null; }
}

function isRateLimitResponse(response) {
  if (!response) return false;
  if (response.status === 429) return true;
  const payload = `${JSON.stringify(response.data || '')} ${String(response.error || '')}`;
  return /rate[_\s-]?limit/i.test(payload);
}

function buildAiCallError(response) {
  if (!response) return 'API error: empty response';
  if (response.status) return `API error ${response.status}: ${JSON.stringify(response.data)}`;
  if (response.error) return `API error: ${response.error}`;
  return `API error: ${JSON.stringify(response)}`;
}

async function callClaudeWithBackoff({ model, apiKey, sysPrompt, userContent, maxTokens, temperature, leadLabel }) {
  for (let attempt = 0; attempt <= AI_MAX_429_RETRIES; attempt++) {
    if (cancelProcessing) return { ok: false, error: 'Processing cancelled by user' };
    const response = await window.electronAPI.aiCall({
      url: 'https://api.anthropic.com/v1/messages',
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: {
        model,
        max_tokens: maxTokens,
        temperature,
        system: sysPrompt,
        messages: [{ role: 'user', content: userContent }]
      }
    });

    if (response?.ok) return response;
    if (attempt < AI_MAX_429_RETRIES && isRateLimitResponse(response)) {
      const delayMs = AI_429_BASE_DELAY_MS * (attempt + 1);
      console.warn(`[OutreachEngine] Rate-limited for ${leadLabel || 'lead'}. Retrying in ${Math.round(delayMs / 1000)}s (${attempt + 1}/${AI_MAX_429_RETRIES}).`);
      await wait(delayMs);
      continue;
    }
    return response;
  }
  return { ok: false, error: 'Rate limit retries exhausted' };
}

// Personal tab state — isolated from all other lead data
let personalLeads = [];
let currentPersonalLead = null;

function savePersonalLeads() {
  localStorage.setItem('personalLeads', JSON.stringify(personalLeads));
}

function loadPersonalLeads() {
  try {
    const saved = localStorage.getItem('personalLeads');
    if (saved) personalLeads = JSON.parse(saved);
  } catch(e) { personalLeads = []; }
  let migrated = false;
  personalLeads.forEach(l => {
    if (!l.campaign) { l.campaign = 'Personal'; migrated = true; }
  });
  if (migrated) savePersonalLeads();
}

function applySidebarState() {
  const sidebar = document.getElementById('campaignSidebar');
  if (sidebar) sidebar.classList.toggle('collapsed', !sidebarOpen);
}

document.addEventListener('DOMContentLoaded', () => {
  loadCampaignRegistry();
  applySidebarState();

  const toggleBtn = document.getElementById('sidebarToggleBtn');
  if (toggleBtn) {
    toggleBtn.onclick = () => {
      sidebarOpen = !sidebarOpen;
      localStorage.setItem('sidebarOpen', sidebarOpen);
      applySidebarState();
    };
  }

  const newCampaignBtn = document.getElementById('newCampaignBtn');
  newCampaignBtn.onmouseenter = () => { newCampaignBtn.style.borderColor = 'var(--accent)'; newCampaignBtn.style.color = 'var(--accent)'; };
  newCampaignBtn.onmouseleave = () => { newCampaignBtn.style.borderColor = 'rgba(255,255,255,0.12)'; newCampaignBtn.style.color = 'var(--text-70)'; };

  newCampaignBtn.onclick = () => {
    const container = document.getElementById('campaignListContainer');
    if (container.querySelector('.new-campaign-card')) return; // already open
    const card = document.createElement('div');
    card.className = 'new-campaign-card';
    card.style.cssText = 'padding:12px; border-radius:8px; border:1px solid var(--accent); background:rgba(255,94,0,0.06); margin-bottom:4px;';
    card.innerHTML = `
      <div style="font-size:10px; color:var(--accent); font-family:'SF Mono',monospace; font-weight:700; letter-spacing:0.5px; margin-bottom:8px;">NEW CAMPAIGN</div>
      <input class="new-campaign-input" type="text" placeholder="Campaign name…" style="width:100%; background:transparent; border:none; border-bottom:1px solid rgba(255,255,255,0.2); color:#fff; font-size:13px; font-weight:600; font-family:inherit; outline:none; padding:4px 0;">
      <div style="font-size:10px; color:var(--text-40); margin-top:6px;">Press Enter to create · Esc to cancel</div>`;
    container.prepend(card);
    const input = card.querySelector('.new-campaign-input');
    input.focus();
    const commit = () => {
      const name = normalizeCampaignName(input.value);
      card.remove();
      if (!name) return;
      ensureCampaignExists(name);
      activeCampaign = name;
      localStorage.setItem('activeCampaign', activeCampaign);
      renderSidebar(); reassignBatches(); renderTable();
    };
    input.onkeydown = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { card.remove(); }
    };
    input.onblur = () => setTimeout(commit, 120);
  };
});

// Active prompts — always initialized from code constants.
// Settings edits update these at runtime. No localStorage caching.
let activeUiuxPrompt = DEFAULT_PROMPT;
let activeBrandingPrompt = BRANDING_PROMPT;

function campaignProgressRing(pct, isComplete, count) {
  const r = 11;
  const circ = +(2 * Math.PI * r).toFixed(3); // 69.115
  const trackColor = 'rgba(255,255,255,0.08)';

  if (count === 0) {
    return `<svg width="30" height="30" viewBox="0 0 30 30" style="flex-shrink:0;">
      <circle cx="15" cy="15" r="${r}" fill="none" stroke="${trackColor}" stroke-width="2"/>
    </svg>`;
  }

  const dash = +((pct / 100) * circ).toFixed(3);
  const ringColor = isComplete ? '#10B981' : 'var(--accent)';
  const label = isComplete
    ? `<text x="15" y="19" text-anchor="middle" font-size="10" fill="#10B981" font-weight="600">✓</text>`
    : `<text x="15" y="19" text-anchor="middle" font-size="${pct === 100 ? '7' : pct >= 10 ? '8' : '9'}" font-family="SF Mono,monospace" fill="rgba(255,255,255,0.8)" font-weight="700">${pct}%</text>`;

  return `<svg width="30" height="30" viewBox="0 0 30 30" style="flex-shrink:0;">
    <circle cx="15" cy="15" r="${r}" fill="none" stroke="${trackColor}" stroke-width="2"/>
    <circle cx="15" cy="15" r="${r}" fill="none" stroke="${ringColor}" stroke-width="2"
      stroke-dasharray="${dash} ${circ}" stroke-linecap="round"
      transform="rotate(-90 15 15)"/>
    ${label}
  </svg>`;
}

function renderSidebar() {
  const container = document.getElementById('campaignListContainer');
  const badge = document.getElementById('activeMonthBadge');
  if (!container || !badge) return;
  syncCampaignRegistryWithLeads();

  // Build campaign map: name → { earliestDate, count, done }
  const campaignMap = {};
  campaignRegistry.forEach(c => {
    campaignMap[c.name] = { date: c.createdAt || new Date().toISOString(), count: 0, done: 0 };
  });
  const tallyLeads = (list, defaultCampaign) => {
    list.forEach(l => {
      const c = l.campaign || defaultCampaign;
      if (!campaignMap[c]) {
        campaignMap[c] = { date: l.dateAdded || new Date().toISOString(), count: 0, done: 0 };
      } else if (l.dateAdded && l.dateAdded < campaignMap[c].date) {
        campaignMap[c].date = l.dateAdded;
      }
      campaignMap[c].count++;
      if (!['Queued', 'Processing', 'Draft'].includes(l.status)) {
        campaignMap[c].done++;
      }
    });
  };
  tallyLeads(leads, 'Manual');
  tallyLeads(personalLeads, 'Personal');

  // Ensure activeCampaign always appears
  if (!campaignMap[activeCampaign]) {
    campaignMap[activeCampaign] = { date: new Date().toISOString(), count: 0, done: 0 };
  }

  // Manual first, then newest → oldest
  const campaigns = Object.keys(campaignMap).sort((a, b) => {
    if (a === 'Manual') return -1;
    if (b === 'Manual') return 1;
    return campaignMap[b].date.localeCompare(campaignMap[a].date);
  });

  container.innerHTML = '';
  campaigns.forEach(c => {
    const { date, count, done } = campaignMap[c];
    const pct = count > 0 ? Math.round((done / count) * 100) : 0;
    const isComplete = count > 0 && done === count;
    const d = new Date(date);
    const dateStr = `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
    const isActive = c === activeCampaign;

    const el = document.createElement('div');
    el.className = isActive ? 'campaign-item active' : 'campaign-item';
    el.style.cssText = `padding: 9px 11px;`;

    // Safely escape the campaign name for HTML attributes
    const safeC = c.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Truncated name for delete confirm (keeps it from blowing up the container)
    const truncName = c.length > 24 ? c.substring(0, 24) + '…' : c;

    el.innerHTML = `
      <div style="display:flex; align-items:center; gap:4px; margin-bottom:5px; min-width:0;">
        <div class="campaign-name"
          style="font-size:13px; font-weight:${isActive ? '500' : '400'};
                 color:${isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)'};
                 white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
                 flex:1; min-width:0; line-height:1.3;"
          title="${safeC}">${safeC}</div>
        <button class="campaign-menu-btn"
          style="background:transparent; border:none; cursor:pointer;
                 color:rgba(255,255,255,0.5); font-size:14px;
                 flex-shrink:0; line-height:1; width:20px; height:20px;
                 display:flex; align-items:center; justify-content:center;">⋮</button>
      </div>
      <div style="display:flex; align-items:center; justify-content:space-between; gap:4px; min-width:0;">
        <span style="font-size:10.5px; color:rgba(255,255,255,0.3);
                     font-family:'SF Mono',monospace; white-space:nowrap;
                     overflow:hidden; text-overflow:ellipsis; flex:1; min-width:0;">
          ${dateStr} &middot; ${count} lead${count !== 1 ? 's' : ''}
        </span>
        <div style="flex-shrink:0; margin-right:1px;">${campaignProgressRing(pct, isComplete, count)}</div>
      </div>

      <div class="campaign-menu-dropdown">
        <button class="campaign-rename-opt" style="color:rgba(255,255,255,0.85);">✏&nbsp; Rename</button>
        <div style="height:1px; background:rgba(255,255,255,0.06); margin:3px 4px;"></div>
        <button class="campaign-delete-opt" style="color:#F87171;">🗑&nbsp; Delete</button>
      </div>

      <div class="delete-confirm">
        <div class="delete-campaign-label">Delete campaign?</div>
        <div class="delete-campaign-name" title="${safeC}">${truncName}</div>
        <div class="delete-campaign-warning">All leads in this campaign will be permanently removed.</div>
        <div class="delete-actions">
          <button class="delete-yes-btn">Delete</button>
          <button class="delete-no-btn">Cancel</button>
        </div>
      </div>`;

    const menuBtn = el.querySelector('.campaign-menu-btn');
    const menuDropdown = el.querySelector('.campaign-menu-dropdown');
    const deleteConfirm = el.querySelector('.delete-confirm');

    // Hover and active states are handled by CSS classes — no JS needed here

    menuBtn.onclick = (e) => {
      e.stopPropagation();
      const isOpen = menuDropdown.style.display === 'flex';
      document.querySelectorAll('.campaign-menu-dropdown').forEach(d => d.style.display = 'none');
      menuDropdown.style.display = isOpen ? 'none' : 'flex';
    };

    el.querySelector('.campaign-rename-opt').onclick = (e) => {
      e.stopPropagation();
      menuDropdown.style.display = 'none';
      const nameDiv = el.querySelector('.campaign-name');
      const input = document.createElement('input');
      input.value = c;
      input.style.cssText = `background:transparent; border:none; border-bottom:1px solid var(--accent); color:#fff; font-size:13px; font-weight:600; width:100%; outline:none; font-family:inherit;`;
      nameDiv.replaceWith(input);
      input.focus(); input.select();
      const commit = () => {
        const newName = normalizeCampaignName(input.value) || c;
        const duplicateName = newName !== c && campaignRegistry.some(item => item.name === newName);
        if (duplicateName) {
          alert(`Campaign "${newName}" already exists.`);
          renderSidebar();
          return;
        }
        if (newName !== c) {
          leads.forEach(l => { if (l.campaign === c) l.campaign = newName; });
          personalLeads.forEach(l => { if ((l.campaign || 'Personal') === c) l.campaign = newName; });
          renameCampaignInRegistry(c, newName);
          if (activeCampaign === c) { activeCampaign = newName; localStorage.setItem('activeCampaign', newName); }
          saveAllState();
          savePersonalLeads();
        }
        renderSidebar();
      };
      input.onblur = commit;
      input.onkeydown = (ke) => { if (ke.key === 'Enter') { ke.preventDefault(); input.blur(); } if (ke.key === 'Escape') { input.value = c; input.blur(); } };
    };

    el.querySelector('.campaign-delete-opt').onclick = (e) => {
      e.stopPropagation();
      menuDropdown.style.display = 'none';
      deleteConfirm.style.display = 'block';
    };

    el.querySelector('.delete-yes-btn').onclick = (e) => {
      e.stopPropagation();
      leads = leads.filter(l => l.campaign !== c);
      personalLeads = personalLeads.filter(l => (l.campaign || 'Personal') !== c);
      removeCampaignFromRegistry(c);
      if (activeCampaign === c) {
        const remaining = campaignRegistry.map(item => item.name).filter(Boolean);
        if (remaining.length === 0) {
          ensureCampaignExists('Manual');
          remaining.push('Manual');
        }
        activeCampaign = remaining[0] || 'Manual';
        localStorage.setItem('activeCampaign', activeCampaign);
      }
      saveAllState(); savePersonalLeads(); renderSidebar(); reassignBatches(); renderTable(); renderPersonalTable();
    };

    el.querySelector('.delete-no-btn').onclick = (e) => {
      e.stopPropagation();
      deleteConfirm.style.display = 'none';
    };

    el.onclick = (e) => {
      if (e.target.closest('.campaign-menu-btn') || e.target.closest('.campaign-menu-dropdown') || e.target.closest('.delete-confirm')) return;
      activeCampaign = c;
      localStorage.setItem('activeCampaign', c);
      renderSidebar(); reassignBatches(); renderTable(); renderPersonalTable();
    };
    container.appendChild(el);
  });

  const badgeText = activeCampaign.length > 20 ? activeCampaign.substring(0, 20) + '…' : activeCampaign;
  badge.innerText = badgeText.toUpperCase();
  badge.style.display = 'inline-block';
}
 
let activeTab = localStorage.getItem('activeTab') || 'tabLeads';
let currentLeadInDetail = null;

let _saveTimer = null;
const saveAllState = () => {
  if (!window.electronAPI || !window.electronAPI.saveState) return;
  if (!Array.isArray(leads)) { console.error('[OutreachEngine] saveAllState blocked: leads is not an array'); return; }
  // Debounce: coalesce rapid-fire saves into one write (500ms)
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    _saveTimer = null;
    window.electronAPI.saveState(leads).catch(err => console.error('[OutreachEngine] saveState failed:', err));
  }, 500);
};

const MODELS_MAP = {
  Claude: [
    { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5 / 4.6 (Latest)' },
    { id: 'claude-3-7-sonnet-20250219', label: 'Claude Sonnet 3.7' },
    { id: 'claude-3-5-sonnet-20241022', label: 'Claude Sonnet 3.5' },
    { id: 'claude-3-5-haiku-20241022', label: 'Claude Haiku 3.5' },
    { id: 'claude-3-opus-20240229', label: 'Claude Opus 3' }
  ]
};

function updateModelDropdown() {
  const modelSelect = document.getElementById('activeModel');
  const currentVal = localStorage.getItem('activeModel');
  modelSelect.innerHTML = '';
  MODELS_MAP.Claude.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id; opt.innerText = m.label;
    modelSelect.appendChild(opt);
  });
  const ids = MODELS_MAP.Claude.map(m => m.id);
  if (currentVal && ids.includes(currentVal)) {
    modelSelect.value = currentVal;
  }
}

function updateActiveAiBadge() {
  const badge = document.querySelector('.ai-badge');
  if (badge) badge.innerText = 'CLAUDE';
}

function switchTab(tabId, sectionId) {
  document.querySelectorAll('.app-tab').forEach(t => { t.classList.remove('active'); t.style.color = 'var(--text-40)'; t.style.borderBottom = 'none'; });
  const el = document.getElementById(tabId);
  if (el) { el.classList.add('active'); el.style.color = 'var(--accent)'; el.style.borderBottom = '2px solid var(--accent)'; }
  activeTab = tabId;
  localStorage.setItem('activeTab', tabId);
  if (sectionId === 'leadDetailView') {
    document.getElementById('dashboardSections').style.display = 'none'; document.getElementById('leadDetailView').style.display = 'flex';
  } else {
    document.getElementById('dashboardSections').style.display = 'flex'; document.getElementById('leadDetailView').style.display = 'none';
    document.getElementById('batchPanel').style.display = (sectionId === 'batchSection') ? 'flex' : 'none';
    document.getElementById('singlePanel').style.display = (sectionId === 'singleSection') ? 'flex' : 'none';
    renderTable();
  }
}

async function initApp() {
  loadPersonalLeads();
  loadCampaignRegistry();

  // Load AI Key
  safeSetValue('claudeKey', localStorage.getItem('claudeKey') || '');
  updateModelDropdown();

  // Load Sender Identities
  safeSetValue('uiuxSenderName', localStorage.getItem('uiuxSenderName') || 'Aryan');
  safeSetValue('uiuxSenderTitle', localStorage.getItem('uiuxSenderTitle') || 'Partner, Labs22');
  safeSetValue('uiuxSenderWeb', localStorage.getItem('uiuxSenderWeb') || 'labs22.com');
  safeSetChecked('uiuxEnoc', localStorage.getItem('uiuxEnoc') !== 'false');

  safeSetValue('brandingSenderName', localStorage.getItem('brandingSenderName') || '');
  safeSetValue('brandingSenderTitle', localStorage.getItem('brandingSenderTitle') || 'Partner, Labs22');
  safeSetValue('brandingSenderWeb', localStorage.getItem('brandingSenderWeb') || 'labs22.com');
  safeSetChecked('brandingEnoc', localStorage.getItem('brandingEnoc') !== 'false');

  // Prompts: always use the code constants directly. No localStorage caching.
  activeUiuxPrompt = DEFAULT_PROMPT;
  activeBrandingPrompt = BRANDING_PROMPT;
  safeSetValue('uiuxPromptArea', activeUiuxPrompt);
  safeSetValue('brandingPromptArea', activeBrandingPrompt);
  console.log('[OutreachEngine] Prompts loaded from code constants (no cache).');

  updateActiveAiBadge();

  // Load leads BEFORE first render to prevent empty-state saves
  try {
    const saved = await window.electronAPI.loadState();
    if (saved && Array.isArray(saved)) {
      leads = saved;
      leads.forEach(l => {
        if (!l.mode) l.mode = 'uiux';
        if (!l.campaign) {
          l.campaign = l.source === 'manual' ? 'Manual' : (l.csvSource || l.month || 'Imported');
        }
      });
      syncCampaignRegistryWithLeads();
      console.log(`[OutreachEngine] Loaded ${leads.length} leads.`);
    } else {
      console.warn('[OutreachEngine] No saved state found — starting with empty leads.');
    }
  } catch(e) { console.error('[OutreachEngine] LoadState fail:', e); }

  // First render happens AFTER leads are loaded
  switchMode(currentMode);
  renderSidebar();
  reassignBatches();
  renderTable();

}

// Settings tab IDs — defined at top level so activateSettingsTab is globally accessible
const _setTabs = ['setTabGeneral', 'setTabUiux', 'setTabBranding'];
const _setPanes = ['settingsGeneral', 'settingsSenderUiux', 'settingsSenderBranding'];

function activateSettingsTab(idx) {
  _setTabs.forEach((id, i) => {
    const tabEl = document.getElementById(id);
    if (tabEl) {
      if (i === idx) {
        tabEl.classList.add('active');
        tabEl.style.color = 'var(--accent)';
        tabEl.style.borderBottom = '2px solid var(--accent)';
      } else {
        tabEl.classList.remove('active');
        tabEl.style.color = 'var(--text-40)';
        tabEl.style.borderBottom = 'none';
      }
    }
    const paneEl = document.getElementById(_setPanes[i]);
    if (paneEl) paneEl.style.display = (i === idx) ? 'block' : 'none';
  });
}

_setTabs.forEach((id, idx) => {
  const el = document.getElementById(id);
  if (el) el.onclick = () => activateSettingsTab(idx);
});

function switchMode(mode) {
  currentMode = mode;
  localStorage.setItem('currentMode', mode);

  const uiBtn = document.getElementById('modeUiux');
  const brBtn = document.getElementById('modeBranding');
  const prBtn = document.getElementById('modePersonal');

  // Reset all three buttons
  [uiBtn, brBtn, prBtn].forEach(btn => {
    btn.style.color = 'var(--text-40)';
    btn.style.background = 'transparent';
    btn.style.boxShadow = 'none';
  });

  // Highlight active
  const activeBtn = mode === 'uiux' ? uiBtn : mode === 'branding' ? brBtn : prBtn;
  activeBtn.style.color = 'var(--bg)';
  activeBtn.style.background = 'var(--accent)';
  activeBtn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';

  const dashSections = document.getElementById('dashboardSections');
  const personalSection = document.getElementById('personalSection');
  const personalDetailView = document.getElementById('personalLeadDetailView');
  const leadDetailView = document.getElementById('leadDetailView');

  if (mode === 'personal') {
    // Hide regular views
    dashSections.style.display = 'none';
    leadDetailView.style.display = 'none';
    // Show personal table, hide personal detail
    personalDetailView.style.display = 'none';
    personalSection.style.display = 'flex';
    renderPersonalTable();
  } else {
    // Hide personal views
    personalSection.style.display = 'none';
    personalDetailView.style.display = 'none';
    // Restore regular table
    dashSections.style.display = 'flex';
    leadDetailView.style.display = 'none';

    const scoreHeader = document.getElementById('scoreHeader');
    if (scoreHeader) scoreHeader.style.display = (mode === 'branding') ? 'none' : 'table-cell';
    renderTable();
  }
}

function renderTable() {
  const tbody = document.getElementById('leadsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const search = document.getElementById('searchInput').value.toLowerCase();
  const filterBatch = document.getElementById('batchSelector').value;
  const activeTabName = activeTab || 'tabLeads';

  const filterSource  = document.getElementById('sourceFilter').value;
  const filterStatus  = document.getElementById('statusFilter').value;
  const filterCountry = document.getElementById('countryFilter').value;

  const displayed = leads.filter(l => {
    if (l.mode !== currentMode || l.campaign !== activeCampaign) return false;
    if (filterBatch !== 'all' && l.batch !== parseInt(filterBatch)) return false;
    if (filterSource !== 'All' && l.source !== filterSource) return false;
    if (filterStatus !== 'All' && l.status !== filterStatus) return false;
    if (filterCountry !== 'All' && (l.country || '').trim().toUpperCase() !== filterCountry.toUpperCase()) return false;
    if (search && !`${l.firstName} ${l.company} ${l.websiteURL}`.toLowerCase().includes(search)) return false;
    return true;
  });

  const batches = {};
  const manualLeads = [];
  displayed.forEach(l => { 
    if (l.source === 'manual') manualLeads.push(l);
    else {
      const b = `Batch ${l.batch||1}`; if(!batches[b]) batches[b]=[]; batches[b].push(l); 
    }
  });

  const createLeadRow = (l) => {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.className = 'dashboard-row';
    
    const getScoresHtml = (lead) => {
      if (lead.mode === 'branding') return lead.analysis ? `<span class="score-badge score-gray">✓</span>` : '-';
      if (!lead.analysis) return '-';
      
      const p = lead.analysis.pillars;
      const a = lead.analysis.areas;
      let scoresArray = [];
      if (p) scoresArray = [p.positioning?.score, p.trust?.score, p.conversion?.score];
      else if (a) scoresArray = [a.brandClarity?.score, a.trustSignals?.score, a.conversionPath?.score];
      
      const validScores = scoresArray.map(s => parseInt(s)).filter(s => !isNaN(s));
      const avg = validScores.length > 0 ? (validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
      
      let bars = '';
      if (avg >= 4) {
        bars = `<div style="display:flex;align-items:flex-end;gap:2px;height:14px;margin-left:8px;"><div style="width:3px;height:6px;background:#10B981;border-radius:1px;"></div><div style="width:3px;height:10px;background:#10B981;border-radius:1px;"></div><div style="width:3px;height:14px;background:#10B981;border-radius:1px;"></div></div>`;
      } else if (avg >= 2.8) {
        bars = `<div style="display:flex;align-items:flex-end;gap:2px;height:14px;margin-left:8px;"><div style="width:3px;height:6px;background:#F59E0B;border-radius:1px;"></div><div style="width:3px;height:10px;background:#F59E0B;border-radius:1px;"></div><div style="width:3px;height:14px;background:var(--border);border-radius:1px;"></div></div>`;
      } else {
        bars = `<div style="display:flex;align-items:flex-end;gap:2px;height:14px;margin-left:8px;"><div style="width:3px;height:6px;background:#EF4444;border-radius:1px;"></div><div style="width:3px;height:10px;background:var(--border);border-radius:1px;"></div><div style="width:3px;height:14px;background:var(--border);border-radius:1px;"></div></div>`;
      }

      const b = (val) => {
        let cl = 'score-gray';
        const v = parseInt(val);
        if (v >= 4) cl = 'score-green'; else if (v >= 3) cl = 'score-yellow'; else if (v > 0) cl = 'score-red';
        return `<span class="score-badge ${cl}">${val||'-'}</span>`;
      };
      
      let scoresHtml = '';
      if (p) scoresHtml = b(p.positioning?.score) + b(p.trust?.score) + b(p.conversion?.score);
      else if (a) scoresHtml = b(a.brandClarity?.score) + b(a.trustSignals?.score) + b(a.conversionPath?.score);
      
      return scoresHtml ? `<div style="display:flex; align-items:center;">` + scoresHtml + bars + `</div>` : '-';
    };
    const sc = (str, fallback = '-') => {
      if (!str || typeof str !== 'string' || str.trim() === '') return fallback;
      return str.trim().split(/\\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    };
    
    tr.innerHTML = `
      <td style="text-align:center;">${l.source==='batch'?'📦':'👤'}</td>
      <td>${sc(l.firstName, '')}</td>
      <td>${sc(l.company, '')}</td>
      <td>${sc(l.industry, '-')}</td>
      <td>${sc(l.country, '-')}</td>
      <td>${l.websiteURL}</td>
      <td class="status-${l.status.toLowerCase()}"><div style="display:flex;align-items:center;"><span class="status-dot"></span>${l.status}</div></td>
      <td style="${currentMode === 'branding' ? 'display:none;' : ''}">${getScoresHtml(l)}</td>
      <td style="position:relative;">
        <div style="display:flex; align-items:center; gap:8px;">
          ${
            (l.status === 'Processing')
            ? `<button class="stop-single-btn outline-btn" style="padding:4px 12px; font-size:11px; height:28px; border-color:#EF4444; color:#EF4444; cursor:pointer;">Stop</button>`
            : (l.status === 'Queued' || l.status === 'Error')
              ? `<button class="view-btn outline-btn" style="padding:4px 12px; font-size:11px; height:28px;">View</button>
                 <button class="process-inline-btn outline-btn" style="padding:4px 12px; font-size:11px; height:28px; border-color:#8B5CF6; color:#8B5CF6;">Process</button>`
              : (l.status === 'Skipped')
              ? `<button class="view-btn outline-btn" style="padding:4px 12px; font-size:11px; height:28px;">View</button>`
              : `<button class="view-btn outline-btn" style="padding:4px 12px; font-size:11px; height:28px;">View</button>
                 <button class="export-inline-btn outline-btn" style="padding:4px 12px; font-size:11px; height:28px; border-color:var(--accent); color:var(--accent);">Export</button>`
          }
          ${l.status === 'Processing' ? '' : `<button class="more-btn" style="background:transparent; border:none; color:var(--text-70); font-size:18px; cursor:pointer; padding:0 4px;">⋮</button>`}
          <div class="more-dropdown" style="display:none; position:absolute; right:12px; top:28px; background:var(--bg); border:1px solid var(--border); border-radius:6px; z-index:100; padding:4px; min-width:120px; flex-direction:column; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
            <button class="reprocess-dropdown-btn" style="background:transparent; color:var(--text-95); border:none; padding:8px 12px; text-align:left; font-size:11px; width:100%; cursor:pointer;">Reprocess</button>
            <button class="delete-dropdown-btn" style="background:transparent; color:#EF4444; border:none; padding:8px 12px; text-align:left; font-size:11px; width:100%; cursor:pointer; border-top:1px solid var(--border); margin-top:4px;">Delete</button>
          </div>
        </div>
      </td>
    `;

    tr.onclick = (e) => {
      if(e.target.closest('.view-btn') || e.target.closest('.process-inline-btn') || e.target.closest('.export-inline-btn') || e.target.closest('.more-btn') || e.target.closest('.more-dropdown')) return;
      openLeadDetail(l);
    };

    tr.querySelector('.view-btn')?.addEventListener('click', (e) => { e.stopPropagation(); openLeadDetail(l); });

    if (tr.querySelector('.stop-single-btn')) {
      tr.querySelector('.stop-single-btn').onclick = (e) => {
        e.stopPropagation();
        l.status = 'Queued'; 
        renderTable();
      };
    }
    
    if (tr.querySelector('.process-inline-btn')) {
      tr.querySelector('.process-inline-btn').onclick = async (e) => {
        e.stopPropagation();
        if (l.status === 'Processing') return;
        l.status = 'Processing';
        renderTable();
        await processLead(l);
        saveAllState();
        renderTable();
      };
    }

    if (tr.querySelector('.export-inline-btn')) {
      tr.querySelector('.export-inline-btn').onclick = (e) => {
        e.stopPropagation();
        if (l.status !== 'Ready' && l.status !== 'Exported') { alert('Lead must be processed (Ready) before exporting.'); return; }
        exportSpecificLeads([l]);
      };
    }

    const dropdown = tr.querySelector('.more-dropdown');
    const moreBtn = tr.querySelector('.more-btn');
    if (moreBtn) {
      moreBtn.onclick = (e) => {
        e.stopPropagation();
        document.querySelectorAll('.more-dropdown').forEach(d => { if(d!==dropdown) d.style.display='none'; });
        dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
      };
    }

    const reprocessBtn = tr.querySelector('.reprocess-dropdown-btn');
    reprocessBtn.onclick = (e) => {
      e.stopPropagation(); dropdown.style.display='none';
      if (l.status === 'Processing') return;
      l.status = 'Queued'; l.analysis = null; l.sequence = null;
      renderTable(); 
    };

    const deleteBtn = tr.querySelector('.delete-dropdown-btn');
    deleteBtn.onclick = async (e) => {
      e.stopPropagation(); dropdown.style.display='none';
      leads = leads.filter(x => x !== l);
      saveAllState(); renderTable();
    };

    return tr;
  };

  // Render Manual Leads with their own sticky section header
  if (manualLeads.length > 0) {
    const manualHeader = document.createElement('tr');
    manualHeader.innerHTML = `
      <td colspan="9" style="padding:10px 20px; font-family:'SF Mono',monospace; font-size:11px; color:rgba(255,255,255,0.35); font-weight:600; letter-spacing:0.8px; border-bottom:1px solid var(--border); background:#111113; position:sticky; top:40px; z-index:3; text-transform:uppercase;">
        Single Entries <span style="color:rgba(255,255,255,0.2); font-weight:400; margin-left:8px;">${manualLeads.length} lead${manualLeads.length !== 1 ? 's' : ''}</span>
      </td>`;
    tbody.appendChild(manualHeader);
    manualLeads.forEach(l => {
      tbody.appendChild(createLeadRow(l));
    });
  }
  
  Object.keys(batches).sort((a,b)=>parseInt(a.replace('Batch ',''))-parseInt(b.replace('Batch ',''))).forEach(batchKey => {
    const list = batches[batchKey];

    let bDateObj = new Date();
    if (list.length > 0 && list[0].dateAdded) { bDateObj = new Date(list[0].dateAdded); }
    const batchDateStr = `${String(bDateObj.getDate()).padStart(2,'0')}-${String(bDateObj.getMonth()+1).padStart(2,'0')}-${bDateObj.getFullYear()}`;

    const isFullyExported = list.length > 0 && list.every(l => l.status === 'Exported');
    const hasQueued    = list.some(l => l.status === 'Queued');
    const hasReady     = list.some(l => l.status === 'Ready');
    const isThisProcessing = isProcessing && currentProcessingBatch === batchKey;
    const isBatchComplete  = !hasQueued && !isThisProcessing && list.every(l => l.status !== 'Processing');

    // Compute tier groups for uiux mode (needed before building CTA)
    const grouped = currentMode === 'uiux' ? {
      strong:     list.filter(l => l.analysis?.emailTier === 'strong'),
      soft:       list.filter(l => l.analysis && l.analysis.emailTier !== 'strong' && l.analysis.emailTier !== 'compliment'),
      compliment: list.filter(l => l.analysis?.emailTier === 'compliment'),
    } : null;
    const ungroupedLeads = currentMode === 'uiux' ? list.filter(l => !l.analysis) : [];
    const activeTiers = grouped ? TIER_ORDER.filter(t => grouped[t].length > 0) : [];

    let badgeHtml = '';
    if (isFullyExported) {
      badgeHtml = `<span style="background:rgba(139,92,246,0.15); color:#8B5CF6; border:1px solid rgba(139,92,246,0.3); padding:4px 10px; border-radius:4px; font-size:10px; margin-left:12px; font-weight:700; display:inline-flex; align-items:center; gap:5px; font-family:'SF Mono',monospace;">✓ EXPORTED &middot; ${batchDateStr}</span>`;
    } else if (isBatchComplete && hasReady) {
      badgeHtml = `<span style="background:rgba(16,185,129,0.12); color:#10B981; border:1px solid rgba(16,185,129,0.3); padding:4px 10px; border-radius:4px; font-size:10px; margin-left:12px; font-weight:700; display:inline-flex; align-items:center; gap:5px; font-family:'SF Mono',monospace;">✓ COMPLETE &middot; ${batchDateStr}</span>`;
    }

    let ctaHtml = '';
    if (isThisProcessing) {
      ctaHtml = `<button class="process-batch-inline-btn primary-btn" style="padding:6px 16px; font-size:11px; height:32px; font-family:'SF Mono',monospace; background:#EF4444; border-color:#EF4444; color:white;">STOP PROCESSING</button>`;
    } else if (hasQueued) {
      ctaHtml = `<button class="process-batch-inline-btn primary-btn" style="padding:6px 16px; font-size:11px; height:32px; font-family:'SF Mono',monospace; opacity:${isProcessing?'0.5':'1'}; pointer-events:${isProcessing?'none':'auto'};">PROCESS BATCH</button>`;
    } else if (hasReady || isFullyExported) {
      if (currentMode === 'uiux' && activeTiers.length > 0) {
        const n = activeTiers.length;
        ctaHtml = `<button class="export-all-groups-btn primary-btn" style="padding:6px 16px; font-size:11px; height:32px; background:#8B5CF6; border-color:#8B5CF6; color:white; box-shadow:0 4px 12px rgba(139,92,246,0.3); font-family:'SF Mono',monospace;">EXPORT ALL ${n} GROUP${n === 1 ? '' : 'S'}</button>`;
      } else {
        ctaHtml = `<button class="export-batch-inline-btn primary-btn" style="padding:6px 16px; font-size:11px; height:32px; background:#8B5CF6; border-color:#8B5CF6; color:white; box-shadow:0 4px 12px rgba(139,92,246,0.3); font-family:'SF Mono',monospace;">EXPORT BATCH</button>`;
      }
    }

    const header = document.createElement('tr');
    header.innerHTML = `
      <td colspan="9" style="padding:16px 20px; font-family:'Inter', sans-serif; font-size:14px; color:#FFFFFF; font-weight:700; border-bottom:1px solid var(--border); background:#111113; position:sticky; top:40px; z-index:3;">
        <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
          <div style="display:flex; align-items:center; letter-spacing: 0.5px;">
            ${batchKey.toUpperCase()} <span style="color:var(--text-40); font-size:12px; margin-left:12px; font-weight:500;">${list.length} co${list.length !== 1 ? 's' : ''} &middot; ${batchDateStr}</span>
            ${badgeHtml}
          </div>
          ${ctaHtml}
        </div>
      </td>`;
    tbody.appendChild(header);

    const exportBatchBtn = header.querySelector('.export-batch-inline-btn');
    if (exportBatchBtn) exportBatchBtn.onclick = (e) => { e.stopPropagation(); exportSpecificLeads(list); };

    const exportAllGroupsBtn = header.querySelector('.export-all-groups-btn');
    if (exportAllGroupsBtn) exportAllGroupsBtn.onclick = async (e) => {
      e.stopPropagation();
      exportAllTierGroups(grouped, activeTiers);
    };

    const processBatchBtn = header.querySelector('.process-batch-inline-btn');
    if (processBatchBtn) processBatchBtn.onclick = async (e) => {
      e.stopPropagation();
      if (isProcessing && currentProcessingBatch === batchKey) {
        cancelProcessing = true;
        isProcessing = false;
        currentProcessingBatch = null;
        renderTable();
        return;
      }
      currentProcessingBatch = batchKey;
      isProcessing = true; cancelProcessing = false;
      renderTable();
      for (let i = 0; i < list.length; i++) {
        const l = list[i];
        if (cancelProcessing) break;
        if (l.status === 'Queued' || l.status === 'Error') {
          l.status = 'Processing';
          renderTable();
          await processLead(l);
          saveAllState();
          if (!cancelProcessing && currentProcessingBatch === batchKey) {
            const hasMorePending = list.slice(i + 1).some(nextLead => nextLead.status === 'Queued' || nextLead.status === 'Error');
            if (hasMorePending) {
              await wait(BATCH_LEAD_DELAY_MS);
            }
          }
        }
      }
      if (currentProcessingBatch === batchKey) {
        isProcessing = false; cancelProcessing = false; currentProcessingBatch = null;
        renderTable();
      }
    };

    // Render leads — grouped by tier for uiux, flat for branding
    // Safety: any error in tier grouping falls back to flat render so data never disappears
    let tierRenderSucceeded = false;
    if (currentMode === 'uiux' && grouped) {
      try {
        // Unprocessed leads (no analysis yet) render first, ungrouped
        ungroupedLeads.forEach(l => tbody.appendChild(createLeadRow(l)));

        // Tier group sections
        TIER_ORDER.forEach(tier => {
          const tierLeads = grouped[tier];
          if (!tierLeads || tierLeads.length === 0) return;

          const stateKey = `${batchKey}-${tier}`;
          const isExpanded = tierCollapseState[stateKey] !== false;
          const color = TIER_COLORS[tier];

          const tierHeader = document.createElement('tr');
          tierHeader.style.cursor = 'pointer';
          tierHeader.innerHTML = `
            <td colspan="9" style="padding:9px 20px 9px 32px; font-family:'SF Mono',monospace; font-size:10px; color:rgba(255,255,255,0.55); letter-spacing:1.2px; text-transform:uppercase; background:rgba(255,255,255,0.025); border-bottom:1px solid rgba(255,255,255,0.06);">
              <div style="display:flex; align-items:center; justify-content:space-between;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="color:${color}; font-size:7px; line-height:1;">&#9679;</span>
                  <span style="color:rgba(255,255,255,0.3); font-size:9px;">${isExpanded ? '&#9662;' : '&#9656;'}</span>
                  ${TIER_LABELS[tier]}
                  <span style="color:rgba(255,255,255,0.28); font-weight:400; margin-left:4px;">&middot; ${tierLeads.length}</span>
                </div>
                <button class="tier-export-btn outline-btn" style="padding:3px 10px; font-size:9px; height:22px; border-color:${color}; color:${color}; font-family:'SF Mono',monospace; letter-spacing:0.5px; opacity:0.7;">Export</button>
              </div>
            </td>`;

          tierHeader.onclick = (e) => {
            if (e.target.closest('.tier-export-btn')) return;
            tierCollapseState[stateKey] = !isExpanded;
            renderTable();
          };

          const exportBtn = tierHeader.querySelector('.tier-export-btn');
          if (exportBtn) {
            exportBtn.onclick = (e) => {
              e.stopPropagation();
              exportTierCSV(tier, tierLeads);
            };
          }

          tbody.appendChild(tierHeader);

          if (isExpanded) {
            tierLeads.forEach(l => tbody.appendChild(createLeadRow(l)));
          }
        });

        tierRenderSucceeded = true;
      } catch (err) {
        console.error('[OutreachEngine] Tier grouping render failed, falling back to flat render:', err);
      }
    }

    // Flat fallback: always runs if tier grouping didn't succeed
    if (!tierRenderSucceeded) {
      list.forEach(l => tbody.appendChild(createLeadRow(l)));
    }
  });
  document.getElementById('importedCount').innerText = `${leads.filter(l=>l.mode===currentMode && l.campaign===activeCampaign).length} LEADS`;
}

function openLeadDetail(lead) {
  currentLeadInDetail = lead;
  document.getElementById('dashboardSections').style.display = 'none';
  document.getElementById('leadDetailView').style.display = 'flex';
  const titleCase = (str) => {
    if (!str || typeof str !== 'string' || str.trim() === '') return str;
    return str.trim().split(/\\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };
  document.getElementById('detailCompany').innerText = titleCase(lead.company) || 'Company Name';
  document.getElementById('detailName').innerText = titleCase(lead.firstName) || 'Contact Name';
  document.getElementById('detailEmail').innerText = lead.email;
  document.getElementById('detailIndustry').innerText = titleCase(lead.industry) || 'Unknown';
  document.getElementById('detailCountry').innerText = titleCase(lead.country) || 'Unknown';
  document.getElementById('detailWebsiteText').innerText = (lead.websiteURL || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
  document.getElementById('detailStatusText').innerText = lead.status;
  document.getElementById('detailStatusBadge').className = `status-${lead.status.toLowerCase()}`;
  
  // Reset to Analysis tab
  document.getElementById('analysisContent').style.display = 'block';
  document.getElementById('emailsContent').style.display = 'none';
  document.getElementById('tabAnalysis').style.color = 'var(--accent)';
  document.getElementById('tabAnalysis').style.borderBottom = '2px solid var(--accent)';
  document.getElementById('tabEmails').style.color = 'var(--text-70)';
  document.getElementById('tabEmails').style.borderBottom = 'none';

  // Reset scores to default
  ['scoreBrand','scoreTrust','scoreConversion'].forEach(id => document.getElementById(id).innerText = '?');
  ['findingBrand','findingTrust','findingConversion'].forEach(id => document.getElementById(id).innerText = '...');
  document.getElementById('detailPointers').innerHTML = '';

  const pillarScores = document.getElementById('pillarScoresContainer');
  if (pillarScores) pillarScores.style.display = (lead.mode === 'branding') ? 'none' : 'flex';

  if (lead.analysis) {
    if (lead.status === 'Skipped') {
      document.getElementById('detailReaction').innerText = lead.analysis.skipReason || 'Site skipped — no meaningful gap to call out.';
      document.getElementById('detailGap').innerText = '';
    } else {
      document.getElementById('detailReaction').innerText = lead.analysis.visitorReaction || lead.analysis.expertReaction || '';
      const p = lead.analysis.pillars;
      const a = lead.analysis.areas;
      let scoresArray = [];
      if (p) scoresArray = [p.positioning?.score, p.trust?.score, p.conversion?.score];
      else if (a) scoresArray = [a.brandClarity?.score, a.trustSignals?.score, a.conversionPath?.score];
      
      const validScores = scoresArray.map(s => parseInt(s)).filter(s => !isNaN(s));
      const avg = validScores.length > 0 ? (validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
      
      // Determine tier for templates based on average
      const tier = avg >= 4 ? 'compliment' : (avg >= 2.8 ? 'strong' : 'critical');

      // Update Potential Gauge
      const tb = document.getElementById('tierBars');
      const tl = document.getElementById('tierLabel');
      if (tb && tl) {
        let bars = '';
        if (tier === 'compliment') {
          bars = `<div style="width:8px;height:10px;background:#10B981;border-radius:2px;"></div><div style="width:8px;height:18px;background:#10B981;border-radius:2px;"></div><div style="width:8px;height:26px;background:#10B981;border-radius:2px;"></div>`;
          tl.innerText = 'GOOD'; tl.style.color = '#10B981';
        } else if (tier === 'strong') {
          bars = `<div style="width:8px;height:10px;background:#F59E0B;border-radius:2px;"></div><div style="width:8px;height:18px;background:#F59E0B;border-radius:2px;"></div><div style="width:8px;height:26px;background:var(--border);border-radius:2px;"></div>`;
          tl.innerText = 'MEDIUM'; tl.style.color = '#F59E0B';
        } else {
          bars = `<div style="width:8px;height:10px;background:#EF4444;border-radius:2px;"></div><div style="width:8px;height:18px;background:var(--border);border-radius:2px;"></div><div style="width:8px;height:26px;background:var(--border);border-radius:2px;"></div>`;
          tl.innerText = 'BAD'; tl.style.color = '#EF4444';
        }
        tb.innerHTML = bars;
      }

      let gap;
      if (tier === 'compliment') {
        gap = lead.analysis.design_compliment || lead.analysis.brand_compliment || '';
      } else {
        gap = lead.mode === 'branding' ? lead.analysis.brand_observation : (lead.analysis.specific_observation || lead.analysis.gapStatement || '');
      }
      document.getElementById('detailGap').innerText = gap || '';

      // Populate pillar scores
      if (p) {
        document.getElementById('scoreBrand').innerText = p.positioning?.score ?? '?';
        document.getElementById('scoreTrust').innerText = p.trust?.score ?? '?';
        document.getElementById('scoreConversion').innerText = p.conversion?.score ?? '?';
        document.getElementById('findingBrand').innerText = p.positioning?.reason || '';
        document.getElementById('findingTrust').innerText = p.trust?.reason || '';
        document.getElementById('findingConversion').innerText = p.conversion?.reason || '';
      } else if (a) {
        document.getElementById('scoreBrand').innerText = a.brandClarity?.score ?? '?';
        document.getElementById('scoreTrust').innerText = a.trustSignals?.score ?? '?';
        document.getElementById('scoreConversion').innerText = a.conversionPath?.score ?? '?';
        document.getElementById('findingBrand').innerText = a.brandClarity?.finding || '';
        document.getElementById('findingTrust').innerText = a.trustSignals?.finding || '';
        document.getElementById('findingConversion').innerText = a.conversionPath?.finding || '';
      }

      // Populate pointers (or what_works for compliment tier)
      let pointers = lead.analysis.pointers || lead.analysis.observations || [];
      if (tier === 'compliment' && lead.analysis.what_works) {
        pointers = lead.analysis.what_works.map(w => typeof w === 'object' ? w.observation : w);
      }
      const ptContainer = document.getElementById('detailPointers');
      pointers.forEach(pt => {
        const el = document.createElement('div');
        el.style.cssText = 'font-size:13px; color:var(--text-95); padding:12px 16px; background:var(--panel); border:1px solid var(--border); border-radius:8px; line-height:1.5;';
        el.innerText = pt;
        ptContainer.appendChild(el);
      });
    }
  }
  renderEmails(lead);
}

function renderEmails(lead) {
  const container = document.getElementById('emailCards');
  container.innerHTML = '';
  if (!lead.sequence) return;
  [1,2,3,4].forEach(i => {
    if (!lead.sequence[`e${i}s`]) return;
    const card = document.createElement('div');
    card.className = 'email-card';

    const renderViewMode = () => {
      const body = lead.sequence[`e${i}b`].replace(/\n/g, '<br>');
      card.innerHTML = `
        <div class="email-header">
          <b>EMAIL ${i}</b>
          <div style="display:flex;gap:8px;">
            <button class="edit-btn outline-btn">Edit</button>
            <button class="copy-btn outline-btn">Copy</button>
          </div>
        </div>
        <div class="email-body"><b>S: ${lead.sequence[`e${i}s`]}</b><br><br>${body}</div>
      `;
      card.querySelector('.copy-btn').onclick = (e) => {
        navigator.clipboard.writeText(lead.sequence[`e${i}b`]);
        const btn = e.currentTarget;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span><svg style="width:14px;height:14px;vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>Copied!</span>';
        btn.classList.add('copied');
        setTimeout(() => { btn.innerHTML = originalText; btn.classList.remove('copied'); }, 2000);
      };
      card.querySelector('.edit-btn').onclick = () => renderEditMode();
    };

    const renderEditMode = () => {
      const escapedSubject = lead.sequence[`e${i}s`].replace(/"/g, '&quot;');
      const escapedBody = lead.sequence[`e${i}b`];
      card.innerHTML = `
        <div class="email-header">
          <b>EMAIL ${i}</b>
          <div style="display:flex;gap:8px;">
            <button class="cancel-edit-btn outline-btn">Cancel</button>
            <button class="save-edit-btn">Save</button>
          </div>
        </div>
        <div class="email-edit-body">
          <input class="email-subject-input" type="text" value="${escapedSubject}" placeholder="Subject" />
          <textarea class="email-body-textarea">${escapedBody}</textarea>
        </div>
      `;
      card.querySelector('.cancel-edit-btn').onclick = () => renderViewMode();
      card.querySelector('.save-edit-btn').onclick = () => {
        const newSubject = card.querySelector('.email-subject-input').value.trim();
        const newBody = card.querySelector('.email-body-textarea').value;
        if (newSubject) lead.sequence[`e${i}s`] = newSubject;
        lead.sequence[`e${i}b`] = newBody;
        saveAllState();
        renderViewMode();
      };
    };

    renderViewMode();
    container.appendChild(card);
  });
}

function getSenderVars(mode) {
  if (mode === 'branding') {
    return {
      name: localStorage.getItem('brandingSenderName') || '',
      title: localStorage.getItem('brandingSenderTitle') || 'Partner, Labs22',
      web: localStorage.getItem('brandingSenderWeb') || 'labs22.com',
      enoc: localStorage.getItem('brandingEnoc') !== 'false'
    };
  }
  return {
    name: localStorage.getItem('uiuxSenderName') || 'Aryan',
    title: localStorage.getItem('uiuxSenderTitle') || 'Partner, Labs22',
    web: localStorage.getItem('uiuxSenderWeb') || 'labs22.com',
    enoc: localStorage.getItem('uiuxEnoc') !== 'false'
  };
}

function generateSequences(lead) {
  const s = getSenderVars(lead.mode);
  const a = lead.analysis;
  const firstName = lead.firstName || 'there';
  const company = lead.company || '';
  const opening = a.opening_line || `I came across ${company}`;
  const tier = a.emailTier || 'strong';
  const isBranding = lead.mode === 'branding';
  const obs = isBranding ? a.brand_observation : a.specific_observation;
  const pointers = (a.pointers || []).map(p => `• ${p}`).join('\n');
  const sig = `— ${s.name}\n${s.title}\n${s.web}`;

  if (isBranding) {
    if (tier === 'compliment') {
      const compliment = a.brand_compliment || '';
      return {
        e1s: `Nicely done, ${company}`,
        e1b: `Hi ${firstName},\n\n${opening}\n\n${compliment}. We think about branding the same way at Labs22 — every decision should reinforce what makes the company different. It's rare to see it done this intentionally, so I wanted to reach out.\n\nIf you ever need extra hands on a brand project or want a second pair of eyes on something, we'd be happy to help.\n\n${sig}`
      };
    } else if (tier === 'strong') {
      return {
        e1s: `Quick thought on ${company}'s brand`,
        e1b: `Hi ${firstName},\n\n${opening}\n\nI might be wrong, but ${obs}.\n\n${sig}`,
        e2s: `Re: ${company}'s brand`,
        e2b: `Hi ${firstName},\n\nFollowing up on my note — here are a few things I noticed:\n\n${pointers}\n\nThese are the kinds of refinements that can shift how customers experience a brand — not a full redesign, but targeted changes that help the brand tell more of the story the product already delivers.\n\n${sig}`,
        e3s: `Re: quick thoughts`,
        e3b: `Hi ${firstName},\n\nJust nudging this in case it got buried.\n\nWe specialise in brand identity and packaging design — helping companies make the most of what already makes them great.\n\nIf this is ever relevant, happy to exchange notes.\n\n— ${s.name}`
      };
    } else {
      return {
        e1s: `Quick note on ${company}'s brand`,
        e1b: `Hi ${firstName},\n\n${opening}\n\nYour brand is stronger than most in your space, which is rare. I noticed a couple of areas where small refinements could take it from strong to standout.\n\nIf that's ever useful to explore, happy to share what we'd look at. No obligation.\n\n${sig}`,
        e2s: `Re: ${company}'s brand`,
        e2b: `Hi ${firstName},\n\nFollowing up on my note.\n\nWe focus on brand identity, packaging, and visual systems — making sure the brand works as hard as the product.\n\nFor companies with a solid foundation like yours, small refinements tend to have an outsized impact on how customers perceive and choose you.\n\nIf this is ever relevant, happy to chat. If not, no worries at all.\n\n${sig}`
      };
    }
  } else {
    if (tier === 'compliment') {
      const compliment = a.design_compliment || '';
      return {
        e1s: `Nicely done, ${company}`,
        e1b: `Hi ${firstName},\n\n${opening}\n\nHere's what stood out: ${compliment}.\n\nWe're a design consultancy that takes the same science-first approach to UX — decisions backed by how people actually behave, not just what looks good. So when we see it done well, we notice.\n\nIf you ever need an extra pair of hands on a project, we'd enjoy working with a team that thinks this way.\n\n${sig}`
      };
    } else if (tier === 'strong') {
      return {
        e1s: `Quick thought on ${company}'s website`,
        e1b: `Hi ${firstName},\n\n${opening}\n\nI might be wrong, but ${obs}.\n\n${sig}`,
        e2s: `Re: ${company}'s website`,
        e2b: `Hi ${firstName},\n\nFollowing up on my note — here are a few things I noticed:\n\n${pointers}\n\nThese are the kinds of small changes that tend to shift how visitors perceive a business — not a redesign, but targeted refinements that make the difference between someone browsing and someone reaching out.\n\n${sig}`,
        e3s: `Re: quick thoughts`,
        e3b: `Hi ${firstName},\n\nJust nudging this in case it got buried.\n\nWe specialise in UX and digital experience design — making sure websites convert visitors into customers as effectively as the business deserves.\n\nIf this is ever relevant, happy to exchange notes.\n\n— ${s.name}`
      };
    } else {
      return {
        e1s: `Quick note on ${company}'s site`,
        e1b: `Hi ${firstName},\n\n${opening}\n\nYour site handles most things well, which is rare in your space. One thing I did notice — ${obs}.\n\nNot a major issue, just something that stood out as a first-time visitor.\n\n${sig}`,
        e2s: `Re: ${company}'s site`,
        e2b: `Hi ${firstName},\n\nFollowing up on my note — a couple of ideas that might be worth exploring:\n\n${pointers}\n\nThese aren't big overhauls — more the kind of refinements that tend to shift how visitors engage with a site that already has a solid foundation.\n\n${sig}`,
        e3s: `Re: quick thoughts`,
        e3b: `Hi ${firstName},\n\nJust nudging this in case it got buried.\n\nWe specialise in UX and digital experience design — helping companies with strong foundations get even more out of their websites.\n\nOut of curiosity, is improving the website experience part of your roadmap this year?\n\n— ${s.name}`
      };
    }
  }
}

async function processLead(lead) {
  const model = localStorage.getItem('activeModel') || 'claude-sonnet-4-5';
  const apiKey = localStorage.getItem('claudeKey');
  const sysPrompt = lead.mode === 'branding' ? activeBrandingPrompt : activeUiuxPrompt;
  
  try {
    const scraped = await window.electronAPI.scrapeWebsite(lead.websiteURL);
    if (lead.status !== 'Processing') return;
    if (!scraped || scraped.trim().length < 50) {
      lead.status = 'Error';
      lead.errorMsg = `Could not load website: ${lead.websiteURL}`;
      renderTable();
      await window.electronAPI.saveState(leads);
      return;
    }

    // Detect JS-rendered (SPA) sites: scraper returned content but meaningful text is thin.
    // SPA indicators: __NEXT_DATA__, id="root", id="__next", very short readable text, etc.
    const metaLineRe = /^(Title:|OG Title:|Site Name:|Description:|Structured Data:)/m;
    const bodyEstimate = scraped.split('\n').filter(l => !metaLineRe.test(l)).join(' ')
      .replace(/\{[\s\S]{50,}\}/g, '')  // strip large JSON blobs (__NEXT_DATA__, ld+json leftovers)
      .replace(/\s+/g, ' ').trim();
    const isSPA = bodyEstimate.length < 400
      || /__(NEXT|NUXT)_DATA__|id=["'](root|app|__next)["']/.test(scraped)
      || (scraped.length > 200 && bodyEstimate.split(/\s+/).length < 30);  // lots of bytes but < 30 real words
    let contentForAI = scraped;
    console.log('[OutreachEngine] Scrape debug:', lead.company, '| raw:', scraped.length, 'chars | body estimate:', bodyEstimate.length, 'chars /', bodyEstimate.split(/\s+/).length, 'words | SPA detected:', isSPA);

    if (isSPA) {
      // Try /about for additional static content
      try {
        const base = new URL(lead.websiteURL.startsWith('http') ? lead.websiteURL : 'https://' + lead.websiteURL);
        const aboutScraped = await window.electronAPI.scrapeWebsite(base.origin + '/about');
        if (aboutScraped && aboutScraped.trim().length > 100) {
          contentForAI = scraped + '\n\n--- /about page ---\n\n' + aboutScraped;
        }
      } catch(e) { /* /about doesn't exist or timed out — continue with what we have */ }

      // Prepend a hard override note + known lead fields so the AI has enough to work with
      const leadContext = [
        lead.company   && `Company name: ${lead.company}`,
        lead.industry  && `Industry: ${lead.industry}`,
        lead.websiteURL && `Domain: ${lead.websiteURL}`
      ].filter(Boolean).join('\n');

      contentForAI = `[SCRAPER NOTE — MANDATORY OVERRIDE: This site uses client-side JavaScript rendering. ` +
        `The text below is sparse because the scraper can only read static HTML — the actual site content loads via JavaScript. ` +
        `This is a technical scraper limitation, NOT evidence of a thin or empty site. ` +
        `RULE: You are FORBIDDEN from returning emailTier "skip" for this lead. ` +
        `RULE: You are FORBIDDEN from applying STEP 1.5 (thin site check). ` +
        `RULE: If the scraped text is too sparse for full analysis, use the company name and domain below to form your best judgment and assign emailTier "soft". ` +
        `Only return siteLoaded: false if the content explicitly says "domain not found", "404", or "coming soon".]\n\n` +
        (leadContext ? `[KNOWN LEAD DATA]\n${leadContext}\n\n` : '') +
        contentForAI;
    }

    const originalContentLength = contentForAI.length;
    contentForAI = trimAiContent(contentForAI);
    if (contentForAI.length < originalContentLength) {
      console.log(`[OutreachEngine] Trimmed AI payload for ${lead.company} from ${originalContentLength} to ${contentForAI.length} chars.`);
    }

    const response = await callClaudeWithBackoff({
      model,
      apiKey,
      sysPrompt,
      userContent: `Analyze this website and return ONLY valid JSON:\n\n${contentForAI}`,
      maxTokens: 4096,
      temperature: 0.2,
      leadLabel: lead.company
    });

    if (lead.status !== 'Processing') return;
    if (!response || !response.ok) throw new Error(buildAiCallError(response));

    let rawResult = response?.data?.content?.[0]?.text || '';
    let parsed = parseModelJson(rawResult);
    if (!parsed) {
      console.warn(`[OutreachEngine] Non-JSON model output for ${lead.company}. Attempting repair pass.`);
      const repairResponse = await callClaudeWithBackoff({
        model,
        apiKey,
        sysPrompt,
        userContent: `Your previous reply was not valid JSON.\nReturn ONLY valid JSON using the exact required field names.\nDo not add markdown, commentary, or code fences.\n\nPrevious reply:\n${String(rawResult).slice(0, 5000)}`,
        maxTokens: AI_REPAIR_MAX_TOKENS,
        temperature: 0,
        leadLabel: `${lead.company} (repair)`
      });
      if (!repairResponse || !repairResponse.ok) throw new Error(buildAiCallError(repairResponse));
      rawResult = repairResponse?.data?.content?.[0]?.text || '';
      parsed = parseModelJson(rawResult);
    }
    if (!parsed) throw new Error('Model returned invalid JSON after one repair pass.');

    lead.analysis = parsed;
    if (lead.analysis.industry) lead.industry = lead.analysis.industry;
    if (lead.analysis.siteLoaded === true && !lead.analysis.emailTier) {
      lead.analysis.emailTier = 'soft';
    }
    const analysisPreview = JSON.stringify(lead.analysis).slice(0, 300);
    console.log('[OutreachEngine] AI response for', lead.company, '→ emailTier:', lead.analysis.emailTier, '| siteLoaded:', lead.analysis.siteLoaded, '| full:', analysisPreview);

    if (!lead.analysis.siteLoaded || lead.analysis.emailTier === 'skip') {
      lead.status = 'Skipped';
    } else {
      lead.sequence = generateSequences(lead);
      lead.status = 'Ready';
    }
  } catch(e) {
    const msg = e?.message || JSON.stringify(e) || 'Unknown error';
    if (cancelProcessing && /cancelled/i.test(msg)) {
      lead.status = 'Queued';
      lead.errorMsg = '';
    } else {
      lead.status = 'Error';
      lead.errorMsg = msg;
      console.error('processLead failed:', lead.errorMsg, e);
    }
  }
  renderTable();
  await window.electronAPI.saveState(leads);
}

document.getElementById('modeUiux').onclick = () => switchMode('uiux');
document.getElementById('modeBranding').onclick = () => switchMode('branding');
document.getElementById('modePersonal').onclick = () => switchMode('personal');

// Safe setter helpers — never crash if an element was removed from HTML
function safeSetValue(id, val) { const el = document.getElementById(id); if (el) el.value = val; }
function safeSetChecked(id, val) { const el = document.getElementById(id); if (el) el.checked = val; }
function safeGetValue(id) { const el = document.getElementById(id); return el ? el.value : undefined; }
function safeGetChecked(id) { const el = document.getElementById(id); return el ? el.checked : undefined; }

document.getElementById('settingsBtn').onclick = () => {
    // Reload values to ensure no unsaved edits linger
    safeSetValue('claudeKey', localStorage.getItem('claudeKey') || '');
    updateModelDropdown();

    safeSetValue('uiuxSenderName', localStorage.getItem('uiuxSenderName') || '');
    safeSetValue('uiuxSenderTitle', localStorage.getItem('uiuxSenderTitle') || '');
    safeSetValue('uiuxSenderWeb', localStorage.getItem('uiuxSenderWeb') || '');
    safeSetChecked('uiuxEnoc', localStorage.getItem('uiuxEnoc') !== 'false');

    safeSetValue('brandingSenderName', localStorage.getItem('brandingSenderName') || '');
    safeSetValue('brandingSenderTitle', localStorage.getItem('brandingSenderTitle') || '');
    safeSetValue('brandingSenderWeb', localStorage.getItem('brandingSenderWeb') || '');
    safeSetChecked('brandingEnoc', localStorage.getItem('brandingEnoc') !== 'false');

    safeSetValue('uiuxPromptArea', activeUiuxPrompt);
    safeSetValue('brandingPromptArea', activeBrandingPrompt);

    // Always reset to the first tab (GENERAL & AI) when opening
    activateSettingsTab(0);
    document.getElementById('settingsModal').classList.add('active');
};

document.getElementById('cancelSettingsBtn').onclick = () => {
    document.getElementById('settingsModal').classList.remove('active');
};

document.getElementById('clearDataBtn').onclick = () => {
  if (!confirm('Are you sure you want to clear ALL lead data? This cannot be undone.')) return;
  if (!confirm('This will permanently delete all leads across every campaign. Confirm again to proceed.')) return;
  leads = [];
  personalLeads = [];
  saveAllState();
  savePersonalLeads();
  localStorage.removeItem('batchEnocSettings');
  batchEnocSettings = {};
  renderSidebar();
  renderTable();
  document.getElementById('settingsModal').classList.remove('active');
  alert('All lead data has been cleared.');
};

document.getElementById('closeSettingsBtn').onclick = () => {
  // Only overwrite localStorage if the element exists — prevents wiping data when HTML changes
  const safeSave = (key, id) => { const v = safeGetValue(id); if (v !== undefined) localStorage.setItem(key, v); };
  const safeSaveCheck = (key, id) => { const v = safeGetChecked(id); if (v !== undefined) localStorage.setItem(key, v); };

  safeSave('claudeKey', 'claudeKey');
  safeSave('activeModel', 'activeModel');

  safeSave('uiuxSenderName', 'uiuxSenderName');
  safeSave('uiuxSenderTitle', 'uiuxSenderTitle');
  safeSave('uiuxSenderWeb', 'uiuxSenderWeb');
  safeSaveCheck('uiuxEnoc', 'uiuxEnoc');

  safeSave('brandingSenderName', 'brandingSenderName');
  safeSave('brandingSenderTitle', 'brandingSenderTitle');
  safeSave('brandingSenderWeb', 'brandingSenderWeb');
  safeSaveCheck('brandingEnoc', 'brandingEnoc');

  // Update in-memory prompts from textarea edits (used immediately by processLead)
  const uiuxPrompt = safeGetValue('uiuxPromptArea');
  const brandingPrompt = safeGetValue('brandingPromptArea');
  if (uiuxPrompt !== undefined) activeUiuxPrompt = uiuxPrompt;
  if (brandingPrompt !== undefined) activeBrandingPrompt = brandingPrompt;
  console.log('[OutreachEngine] Settings saved.');
  updateActiveAiBadge();
  document.getElementById('settingsModal').classList.remove('active');
};
document.getElementById('addLeadsCta').onclick = () => document.getElementById('addLeadModal').classList.add('active');
document.getElementById('closeAddLeadModalBtn').onclick = () => document.getElementById('addLeadModal').classList.remove('active');

document.getElementById('editLeadBtn').onclick = () => {
  if (!currentLeadInDetail) return;
  document.getElementById('editFirstName').value = currentLeadInDetail.firstName || '';
  document.getElementById('editCompany').value = currentLeadInDetail.company || '';
  document.getElementById('editEmail').value = currentLeadInDetail.email || '';
  document.getElementById('editCountry').value = currentLeadInDetail.country || '';
  document.getElementById('editLeadModal').classList.add('active');
};

document.getElementById('closeEditModalBtn').onclick = () => document.getElementById('editLeadModal').classList.remove('active');

document.getElementById('saveEditBtn').onclick = () => {
  if (!currentLeadInDetail) return;
  currentLeadInDetail.firstName = document.getElementById('editFirstName').value;
  currentLeadInDetail.company = document.getElementById('editCompany').value;
  currentLeadInDetail.email = document.getElementById('editEmail').value;
  currentLeadInDetail.country = document.getElementById('editCountry').value;
  saveAllState();
  renderTable(); // Update the main dashboard behind the scenes
  openLeadDetail(currentLeadInDetail); // Refresh the active detail view
  document.getElementById('editLeadModal').classList.remove('active');
};

// Tab nav removed — single unified view, navigation via campaign sidebar.

document.getElementById('tabAddBulk').onclick = () => {
  document.getElementById('tabAddBulk').classList.add('active');
  document.getElementById('tabAddBulk').style.color = 'var(--accent)';
  document.getElementById('tabAddBulk').style.borderBottom = '2px solid var(--accent)';
  document.getElementById('tabAddSingle').classList.remove('active');
  document.getElementById('tabAddSingle').style.color = 'var(--text-40)';
  document.getElementById('tabAddSingle').style.borderBottom = 'none';
  document.getElementById('modalBatchPanel').style.display = 'flex';
  document.getElementById('modalSinglePanel').style.display = 'none';
};

document.getElementById('tabAddSingle').onclick = () => {
  document.getElementById('tabAddSingle').classList.add('active');
  document.getElementById('tabAddSingle').style.color = 'var(--accent)';
  document.getElementById('tabAddSingle').style.borderBottom = '2px solid var(--accent)';
  document.getElementById('tabAddBulk').classList.remove('active');
  document.getElementById('tabAddBulk').style.color = 'var(--text-40)';
  document.getElementById('tabAddBulk').style.borderBottom = 'none';
  document.getElementById('modalSinglePanel').style.display = 'block';
  document.getElementById('modalBatchPanel').style.display = 'none';
};

document.getElementById('backFromDetailBtn').onclick = () => { document.getElementById('leadDetailView').style.display='none'; document.getElementById('dashboardSections').style.display='flex'; };

document.getElementById('tabAnalysis').onclick = () => {
  document.getElementById('analysisContent').style.display = 'block';
  document.getElementById('emailsContent').style.display = 'none';
  document.getElementById('tabAnalysis').style.color = 'var(--accent)';
  document.getElementById('tabAnalysis').style.borderBottom = '2px solid var(--accent)';
  document.getElementById('tabEmails').style.color = 'var(--text-70)';
  document.getElementById('tabEmails').style.borderBottom = 'none';
};

document.getElementById('tabEmails').onclick = () => {
  document.getElementById('analysisContent').style.display = 'none';
  document.getElementById('emailsContent').style.display = 'block';
  document.getElementById('tabAnalysis').style.color = 'var(--text-70)';
  document.getElementById('tabAnalysis').style.borderBottom = 'none';
  document.getElementById('tabEmails').style.color = 'var(--accent)';
  document.getElementById('tabEmails').style.borderBottom = '2px solid var(--accent)';
};

function reassignBatches() {
  let counter = 0;
  leads.forEach(l => {
    if (l.mode === currentMode && l.campaign === activeCampaign && l.source === 'batch') {
      l.batch = Math.floor(counter / parseInt(document.getElementById('batchSizeInput').value || 40)) + 1;
      counter++;
    }
  });
  const sel = document.getElementById('batchSelector');
  if (sel) {
    const maxBatch = Math.max(...leads.map(l => l.batch), 0);
    const currVal = sel.value;
    sel.innerHTML = '<option value="all">All Batches</option>';
    for(let i=1; i<=maxBatch; i++) sel.innerHTML += `<option id="opt${i}" value="${i}">Batch ${i}</option>`;
    if (currVal && currVal !== 'all' && parseInt(currVal) <= maxBatch) sel.value = currVal;
  }
}

function updateProgressText() {
  const r = leads.filter(l => l.status==='Ready').length;
  const pText = document.getElementById('progressText');
  if (pText) pText.innerText = `${r}/${leads.length} Processed`;
}

function updateCountryFilter() {
  const filter = document.getElementById('countryFilter');
  if (!filter) return;
  const currentVal = filter.value;
  const countries = [...new Set(leads.map(l => l.country).filter(Boolean))].sort();
  filter.innerHTML = '<option value="All">All Countries</option>';
  countries.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.innerText = c;
    filter.appendChild(opt);
  });
  if (countries.includes(currentVal)) {
    filter.value = currentVal;
  }
}

document.getElementById('manualAddBtn').onclick = () => {
  const url = document.getElementById('manualUrl').value.trim();
  const emails = document.getElementById('manualEmails').value.split(',').map(e=>e.trim()).filter(e=>e);
  const campaignName = normalizeCampaignName(activeCampaign) || 'Manual';
  if (!url || emails.length === 0) { alert('Website URL and at least one Email are required.'); return; }
  ensureCampaignExists(campaignName);
  
  let addedCount = 0;
  let dupeCount = 0;
  
  emails.forEach(e => {
    const normalizeURL = u => (u || '').toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    const isDupe = leads.some(el => normalizeURL(el.websiteURL) === normalizeURL(url));
    if (!isDupe) {
      leads.push({
        firstName: document.getElementById('manualFirstName').value,
        company: document.getElementById('manualCompany').value,
        websiteURL: url, email: e, country: document.getElementById('manualCountry').value,
        status: 'Queued', source: 'manual', mode: currentMode, campaign: campaignName, dateAdded: new Date().toISOString()
      });
      addedCount++;
    } else {
      dupeCount++;
    }
  });
  
  if (addedCount > 0) {
    document.getElementById('addLeadModal').classList.remove('active');
    try { reassignBatches(); } catch(e) { console.error('reassignBatches error:', e); }
    try { updateCountryFilter(); } catch(e) { console.error('updateCountryFilter error:', e); }
    try { saveAllState(); } catch(e) { console.error('saveAllState error:', e); }
    try { renderTable(); } catch(e) { console.error('renderTable error:', e); }
  } else if (dupeCount > 0) {
    alert('Duplicate Prevented: This Company URL or Email already exists in your database (perhaps in a different month).');
  } else {
    document.getElementById('addLeadModal').classList.remove('active');
  }
};

// ── CSV import core ─────────────────────────────────────────────────────────
// Shared by both click-to-open and drag-and-drop.
function processCSVContent(content, fileName) {
  const campaignName = activeCampaign;
  const normalizeURL = u => (u || '').toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

  Papa.parse(content, { header: true, skipEmptyLines: true, complete: (r) => {
    let addedCount = 0, dupeCount = 0, skippedCount = 0;

    r.data.forEach(row => {
      // Normalise all keys to lowercase so lookups are case-insensitive
      const R = {};
      Object.keys(row).forEach(k => { R[k.toLowerCase().trim()] = (row[k] || '').trim(); });
      const pick = (...keys) => { for (const k of keys) { const v = R[k.toLowerCase()]; if (v) return v; } return ''; };

      // ── Flexible column lookup (Apollo + custom CSVs with snake_case headers) ──
      const emailVal    = pick('email', 'primary_contact_email', 'founder_email', 'contact_email',
                               'Email Address', 'e-mail', 'work_email', 'person_email');
      const websiteVal  = pick('website_url', 'website', 'url', 'Website URL', 'domain',
                               'company_domain', 'company_website', 'web');
      const firstNameVal= pick('primary_contact_name', 'founder_name', 'contact_name', 'full_name',
                               'First Name', 'first_name', 'Name', 'Full Name', 'name');
      const lastNameVal = pick('Last Name', 'last_name', 'lastname');
      const companyVal  = pick('company_name', 'company', 'Company', 'Company Name',
                               'Organization', 'Account Name', 'account_name', 'org_name');
      const industryVal = pick('industry', 'Industry', 'Person Industry', 'Company Industry',
                               'sector', 'vertical');
      const countryVal  = pick('country', 'Country', 'Person Country', 'Company Country',
                               'location', 'region', 'geo');
      const titleVal    = pick('primary_contact_title', 'founder_title', 'contact_title', 'job_title',
                               'Title', 'Job Title', 'Person Title', 'position', 'role');

      if (!emailVal) { skippedCount++; return; }

      // ── Dupe check: URL only if non-empty; always check email ─────────────
      const normNewURL = normalizeURL(websiteVal);
      const isDupe = leads.some(el => {
        if (normNewURL && normalizeURL(el.websiteURL) === normNewURL) return true;
        if (el.email && el.email.toLowerCase() === emailVal.toLowerCase()) return true;
        return false;
      });

      if (isDupe) { dupeCount++; return; }

      leads.push({
        firstName: firstNameVal,
        lastName: lastNameVal,
        jobTitle: titleVal,
        company: companyVal,
        websiteURL: websiteVal,
        email: emailVal,
        industry: industryVal,
        country: countryVal,
        status: 'Queued',
        source: 'batch',
        mode: currentMode,
        campaign: campaignName,
        csvSource: fileName,
        dateAdded: new Date().toISOString()
      });
      addedCount++;
    });

    if (addedCount > 0) {
      reassignBatches(); updateCountryFilter(); saveAllState(); renderSidebar(); renderTable();
      document.getElementById('addLeadModal').classList.remove('active');
    } else if (dupeCount > 0 && addedCount === 0) {
      alert(`No new leads added — all ${dupeCount} rows already exist in your database.`);
    } else {
      alert(`No valid leads found.\n\nMake sure your CSV has at least an email column (Email, email, "Email Address", etc.).\n\nRows scanned: ${r.data.length}${skippedCount ? ` · Skipped (no email): ${skippedCount}` : ''}`);
    }
  }});
}

// ── Click to open file dialog ────────────────────────────────────────────────
document.getElementById('dropZone').onclick = async () => {
  const result = await window.electronAPI.openCSV();
  if (result) processCSVContent(result.content, result.fileName);
};

// ── Drag and drop ────────────────────────────────────────────────────────────
const dropZone = document.getElementById('dropZone');
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault(); e.stopPropagation();
  dropZone.style.borderColor = 'var(--accent)';
  dropZone.style.background = 'rgba(255,94,0,0.06)';
});
dropZone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  dropZone.style.borderColor = '';
  dropZone.style.background = '';
});
dropZone.addEventListener('drop', (e) => {
  e.preventDefault(); e.stopPropagation();
  dropZone.style.borderColor = '';
  dropZone.style.background = '';
  const file = e.dataTransfer.files[0];
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.csv')) { alert('Please drop a CSV file.'); return; }
  const reader = new FileReader();
  reader.onload = (evt) => processCSVContent(evt.target.result, file.name);
  reader.readAsText(file);
});

document.getElementById('batchSelector').addEventListener('change', (e) => {
  const batchId = e.target.value;
  const label = document.getElementById('batchEnocLabel');
  const toggle = document.getElementById('batchEnocToggle');
  if (batchId === 'all') {
    label.style.display = 'none';
  } else {
    label.style.display = 'flex';
    const key = `${currentMode}_${batchId}`;
    const globalEnoc = currentMode === 'branding' ? (localStorage.getItem('brandingEnoc') !== 'false') : (localStorage.getItem('uiuxEnoc') !== 'false');
    toggle.checked = batchEnocSettings[key] !== undefined ? batchEnocSettings[key] : globalEnoc;
  }
  renderTable();
});

document.getElementById('batchEnocToggle').addEventListener('change', (e) => {
  const batchId = document.getElementById('batchSelector').value;
  if (batchId !== 'all') {
     const key = `${currentMode}_${batchId}`;
     batchEnocSettings[key] = e.target.checked;
     localStorage.setItem('batchEnocSettings', JSON.stringify(batchEnocSettings));
  }
});

document.getElementById('sourceFilter').addEventListener('change', renderTable);
document.getElementById('countryFilter').addEventListener('change', renderTable);
document.getElementById('statusFilter').addEventListener('change', renderTable);
document.getElementById('searchInput').addEventListener('input', renderTable);
document.getElementById('batchSizeInput').addEventListener('change', () => { reassignBatches(); renderTable(); });

document.getElementById('processNextBatchBtn').onclick = async () => {
  if (isProcessing) return;
  const filterBatch = document.getElementById('batchSelector').value;
  const filterCountry = document.getElementById('countryFilter').value;
  
  const leadsToProcess = leads.filter(l => {
    return l.status === 'Queued' && l.mode === currentMode &&
           (filterBatch === 'all' || l.batch === parseInt(filterBatch)) &&
           (filterCountry === 'All' || (l.country||'').trim().toUpperCase() === filterCountry.toUpperCase());
  });
  
  if (leadsToProcess.length === 0) { alert("No queued leads found passing the current filters."); return; }

  isProcessing = true; cancelProcessing = false;
  document.getElementById('stopBtn').style.display = 'block';
  document.getElementById('progressText').style.display = 'block';

  for (let i = 0; i < leadsToProcess.length; i++) {
    if (cancelProcessing) break;
    leadsToProcess[i].status = 'Processing'; renderTable();
    await processLead(leadsToProcess[i]);
    if (!cancelProcessing && i < leadsToProcess.length - 1) {
      await wait(BATCH_LEAD_DELAY_MS);
    }
  }

  isProcessing = false; cancelProcessing = false;
  document.getElementById('stopBtn').style.display = 'none'; renderTable();
};

document.getElementById('stopBtn').onclick = () => { cancelProcessing = true; };

document.getElementById('exportReadyBtn').onclick = async () => {
  const filterBatch = document.getElementById('batchSelector').value;
  const filterCountry = document.getElementById('countryFilter').value;
  const readyLeads = leads.filter(l => l.status === 'Ready' && l.mode === currentMode && (filterBatch === 'all' || l.batch === parseInt(filterBatch)) && (filterCountry === 'All' || (l.country||'').trim().toUpperCase() === filterCountry.toUpperCase()));
  if (readyLeads.length === 0) { alert("No ready leads match the current filters."); return; }
  exportSpecificLeads(readyLeads);
};

// Builds CSV string for a tier — shared by single-tier and group export
function buildTierCSVData(tierLeads) {
  const esc = str => !str ? '""' : `"${str.replace(/"/g, '""')}"`;
  let csv = 'First Name,Company,Website,Email,Country,Industry,E1 Subject,E1 Body,E2 Subject,E2 Body,E3 Subject,E3 Body\n';
  tierLeads.forEach(l => {
    const seq = l.sequence || {};
    csv += `${esc(l.firstName)},${esc(l.company)},${esc(l.websiteURL)},${esc(l.email)},${esc(l.country)},${esc(l.analysis?.industry)},${esc(seq.e1s)},${esc(seq.e1b)},${esc(seq.e2s)},${esc(seq.e2b)},${esc(seq.e3s)},${esc(seq.e3b)}\n`;
  });
  return csv;
}

// Single-tier export — shows a save dialog and exports one CSV directly
async function exportTierCSV(tierName, tierLeads) {
  if (!tierLeads || tierLeads.length === 0) return;
  const exportable = tierLeads.filter(l => l.status === 'Ready' || l.status === 'Exported');
  if (exportable.length === 0) { alert(`No ready leads in the ${TIER_LABELS[tierName] || tierName} group.`); return; }

  const date = new Date().toISOString().split('T')[0];
  const filename = `labs22-outreach-${date}-${tierName}.csv`;
  const saved = await window.electronAPI.saveCSV({ csvData: buildTierCSVData(exportable), suggestedName: filename });
  if (saved) {
    exportable.forEach(l => l.status = 'Exported');
    saveAllState();
    renderTable();
    alert(`Exported ${exportable.length} ${TIER_LABELS[tierName] || tierName} leads.`);
  }
}

// All-groups export — creates Labs22OutreachEngine-YYYY-MM-DD/ folder with a subfolder per tier
async function exportAllTierGroups(grouped, activeTiers) {
  const date = new Date().toISOString().split('T')[0];

  const tiers = activeTiers
    .map(tier => {
      const exportable = (grouped[tier] || []).filter(l => l.status === 'Ready' || l.status === 'Exported');
      if (exportable.length === 0) return null;
      return {
        name: tier,
        filename: `labs22-outreach-${date}-${tier}.csv`,
        csvData: buildTierCSVData(exportable),
        leads: exportable
      };
    })
    .filter(Boolean);

  if (tiers.length === 0) { alert('No ready leads to export.'); return; }

  const result = await window.electronAPI.saveExportGroup({ date, tiers });
  if (result && result.success) {
    tiers.forEach(t => t.leads.forEach(l => l.status = 'Exported'));
    saveAllState();
    renderTable();
    alert(`Exported ${tiers.length} group${tiers.length !== 1 ? 's' : ''} to:\n${result.folderPath}`);
  }
}

async function exportSpecificLeads(targetLeads) {
  if (!targetLeads || targetLeads.length === 0) return;
  const readyOnly = targetLeads.filter(l => l.status === 'Ready' || l.status === 'Exported');
  if (readyOnly.length === 0) { alert("Nothing ready for export in this selection."); return; }

  let csvContent = "First Name,Company,Website,Email,Country,Status,Model,E1 Subject,E1 Body,E2 Subject,E2 Body\n";
  const esc = str => !str ? '""' : `"${str.replace(/"/g, '""')}"`;
  readyOnly.forEach(l => {
    const seq = l.sequence || {};
    csvContent += `${esc(l.firstName)},${esc(l.company)},${esc(l.websiteURL)},${esc(l.email)},${esc(l.country)},${esc(l.status)},${esc(l.mode)},${esc(seq.e1s)},${esc(seq.e1b)},${esc(seq.e2s)},${esc(seq.e2b)}\n`;
  });

  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2,'0')}-${String(now.getMonth()+1).padStart(2,'0')}-${now.getFullYear()}`;
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  
  let nameBase = `labs22-lead-engine-${dateStr}-${timeStr}.csv`;
  if (targetLeads.length === 1) {
    nameBase = `labs22-lead-engine-${targetLeads[0].company.toLowerCase().replace(/[^a-z0-9]/g,'')}-${dateStr}.csv`;
  }
  
  const saved = await window.electronAPI.saveCSV({ csvData: csvContent, suggestedName: nameBase });
  if (saved) { 
    targetLeads.forEach(l => l.status = 'Exported'); 
    saveAllState(); renderTable(); alert("Exported successfully!"); 
  }
}

document.addEventListener('click', () => {
  document.querySelectorAll('.more-dropdown').forEach(d => d.style.display = 'none');
  document.querySelectorAll('.campaign-menu-dropdown').forEach(d => d.style.display = 'none');
});

// ============================================================
// PERSONAL TAB — All logic below is fully isolated
// ============================================================

function renderPersonalTable() {
  const tbody = document.getElementById('personalTableBody');
  const countEl = document.getElementById('personalLeadCount');
  if (!tbody) return;

  const search = (document.getElementById('personalSearchInput').value || '').toLowerCase();
  const statusFilter = document.getElementById('personalStatusFilter').value;

  const inCampaign = personalLeads.filter(l => (l.campaign || 'Personal') === activeCampaign);
  const displayed = inCampaign.filter(l => {
    if (statusFilter !== 'All' && l.status !== statusFilter) return false;
    if (search && !`${l.company} ${l.contactName} ${l.relationship}`.toLowerCase().includes(search)) return false;
    return true;
  });

  countEl.innerText = `${inCampaign.length} LEADS`;
  tbody.innerHTML = '';

  displayed.forEach(l => {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.className = 'dashboard-row';
    const webDisplay = l.website ? l.website.replace(/^https?:\/\//, '').replace(/\/$/, '') : '-';
    const statusClass = 'status-' + l.status.toLowerCase().replace(/\s+/g, '-');
    tr.innerHTML = `
      <td>${l.company}</td>
      <td>${l.contactName}</td>
      <td style="color:var(--text-70);">${l.contactEmail}</td>
      <td style="color:var(--text-70); max-width:220px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${l.relationship}</td>
      <td style="color:var(--accent);">${webDisplay}</td>
      <td class="${statusClass}"><div style="display:flex;align-items:center;"><span class="status-dot"></span>${l.status}</div></td>
    `;
    tr.onclick = () => openPersonalLeadDetail(l);
    tbody.appendChild(tr);
  });
}

function openPersonalLeadDetail(lead) {
  currentPersonalLead = lead;
  document.getElementById('personalSection').style.display = 'none';
  const dv = document.getElementById('personalLeadDetailView');
  dv.style.display = 'flex';

  document.getElementById('pdCompany').innerText = lead.company;
  document.getElementById('pdContactName').innerText = lead.contactName;
  document.getElementById('pdContactEmail').innerText = lead.contactEmail;
  document.getElementById('pdRelationship').innerText = lead.relationship || '-';

  const websiteLink = document.getElementById('pdWebsiteLink');
  const websiteText = document.getElementById('pdWebsiteText');
  const scrapeBtn = document.getElementById('pdScrapeBtn');

  if (lead.website) {
    websiteText.innerText = lead.website.replace(/^https?:\/\//, '').replace(/\/$/, '');
    websiteLink.style.display = 'flex';
    scrapeBtn.style.display = 'inline-block';
  } else {
    websiteText.innerText = '-';
    websiteLink.style.display = 'none';
    scrapeBtn.style.display = 'none';
  }

  const statusClass = 'status-' + lead.status.toLowerCase().replace(/\s+/g, '-');
  document.getElementById('pdStatusBadge').className = statusClass;
  document.getElementById('pdStatusBadge').style.cssText = 'padding:6px 12px; border:1px solid var(--border); border-radius:12px; font-size:13px; display:flex; align-items:center; flex-shrink:0;';
  document.getElementById('pdStatusText').innerText = lead.status;

  // Migrate old single-email format to emails array
  if (!lead.emails) {
    lead.emails = [{ subject: lead.emailSubject || '', body: lead.emailBody || '' }];
    delete lead.emailSubject;
    delete lead.emailBody;
    savePersonalLeads();
  }
  // Trim any trailing empty emails from the old 2-slot format
  while (lead.emails.length > 1 && !(lead.emails[lead.emails.length - 1].subject || '').trim() && !(lead.emails[lead.emails.length - 1].body || '').trim()) {
    lead.emails.pop();
  }

  renderPersonalEmailComposers();

  // Website context section
  if (lead.websiteContext) {
    document.getElementById('pdWebsiteContext').innerText = lead.websiteContext;
    document.getElementById('pdWebsiteContextSection').style.display = 'block';
  } else {
    document.getElementById('pdWebsiteContextSection').style.display = 'none';
  }
}

function updatePersonalLeadStatus(status) {
  if (!currentPersonalLead) return;
  currentPersonalLead.status = status;
  const statusClass = 'status-' + status.toLowerCase().replace(/\s+/g, '-');
  document.getElementById('pdStatusBadge').className = statusClass;
  document.getElementById('pdStatusBadge').style.cssText = 'padding:6px 12px; border:1px solid var(--border); border-radius:12px; font-size:13px; display:flex; align-items:center; flex-shrink:0;';
  document.getElementById('pdStatusText').innerText = status;
  savePersonalLeads();
}

// Renders email composer blocks dynamically — called on open and when adding/removing emails
function renderPersonalEmailComposers() {
  const container = document.getElementById('pdEmailsContainer');
  if (!container || !currentPersonalLead) return;
  if (!currentPersonalLead.emails || currentPersonalLead.emails.length === 0) {
    currentPersonalLead.emails = [{ subject: '', body: '' }];
  }

  container.innerHTML = '';
  currentPersonalLead.emails.forEach((email, i) => {
    const isFirst = i === 0;
    const labels = ['EMAIL', 'FOLLOW-UP', 'EMAIL 3', 'EMAIL 4', 'EMAIL 5'];
    const label = labels[i] || `EMAIL ${i + 1}`;

    const block = document.createElement('div');
    block.style.cssText = 'background:var(--panel); border:1px solid var(--border); border-radius:var(--radius); margin-bottom:16px; overflow:hidden;';

    const headerHtml = `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 20px; border-bottom:1px solid var(--border); background:rgba(255,255,255,0.02);">
        <div class="section-label">${label}</div>
        <div style="display:flex; gap:8px; align-items:center;">
          ${!isFirst ? `<button class="pd-remove-btn outline-btn" style="font-size:10px; padding:3px 10px; border-color:rgba(239,68,68,0.25); color:#EF4444;">Remove</button>` : ''}
          <button class="pd-copy-btn outline-btn" style="font-size:10px; padding:4px 12px;">Copy</button>
        </div>
      </div>`;

    const bodyHtml = `
      <div style="padding:20px;">
        <div style="margin-bottom:14px;">
          <label style="font-size:10px; color:var(--text-40); font-family:'SF Mono',monospace; display:block; margin-bottom:6px;">SUBJECT</label>
          <input type="text" class="pd-subj full-input" placeholder="${isFirst ? 'Subject line...' : 'Follow-up subject...'}">
        </div>
        <div>
          <label style="font-size:10px; color:var(--text-40); font-family:'SF Mono',monospace; display:block; margin-bottom:6px;">EMAIL BODY</label>
          <textarea class="pd-body" placeholder="${isFirst ? 'Write or paste your email here...' : 'Write your follow-up here...'}" style="width:100%; min-height:240px; border:1px solid var(--border); border-radius:6px; padding:12px; font-size:13px; font-family:inherit; background:rgba(0,0,0,0.2); color:var(--text-95); resize:vertical; line-height:1.6; outline:none;"></textarea>
        </div>
      </div>`;

    block.innerHTML = headerHtml + bodyHtml;

    // Set values programmatically to avoid HTML-escaping issues
    const subjEl = block.querySelector('.pd-subj');
    const bodyEl = block.querySelector('.pd-body');
    subjEl.value = email.subject || '';
    bodyEl.value = email.body || '';

    // Save on input
    subjEl.addEventListener('input', () => {
      currentPersonalLead.emails[i].subject = subjEl.value;
      savePersonalLeads();
    });
    bodyEl.addEventListener('input', () => {
      currentPersonalLead.emails[i].body = bodyEl.value;
      const anyHasContent = currentPersonalLead.emails.some(e => (e.body || '').trim());
      if (anyHasContent && currentPersonalLead.status === 'Draft') {
        updatePersonalLeadStatus('Ready');
      } else {
        savePersonalLeads();
      }
    });

    // Copy button
    block.querySelector('.pd-copy-btn').addEventListener('click', (e) => {
      const subject = subjEl.value.trim();
      const body = bodyEl.value.trim();
      if (!subject && !body) return;
      const text = subject ? `Subject: ${subject}\n\n${body}` : body;
      navigator.clipboard.writeText(text).then(() => {
        const btn = e.currentTarget;
        const orig = btn.innerText;
        btn.classList.add('copied');
        btn.innerText = 'Copied!';
        setTimeout(() => { btn.classList.remove('copied'); btn.innerText = orig; }, 2000);
      });
    });

    // Remove button (emails 2+)
    const removeBtn = block.querySelector('.pd-remove-btn');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        currentPersonalLead.emails.splice(i, 1);
        savePersonalLeads();
        renderPersonalEmailComposers();
      });
    }

    container.appendChild(block);
  });
}

// Back button
document.getElementById('backFromPersonalDetailBtn').onclick = () => {
  document.getElementById('personalLeadDetailView').style.display = 'none';
  document.getElementById('personalSection').style.display = 'flex';
  renderPersonalTable();
};

// Website link click
document.getElementById('pdWebsiteLink').onclick = () => {
  if (currentPersonalLead && currentPersonalLead.website) {
    let url = currentPersonalLead.website.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
    window.electronAPI.openExternal(url);
  }
};

// Scrape website button
document.getElementById('pdScrapeBtn').onclick = async () => {
  if (!currentPersonalLead || !currentPersonalLead.website) return;
  const btn = document.getElementById('pdScrapeBtn');
  btn.innerText = 'Scraping...';
  btn.disabled = true;
  try {
    let url = currentPersonalLead.website.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
    const result = await window.electronAPI.scrapeWebsite(url);
    if (result) {
      const trimmed = result.substring(0, 2000);
      currentPersonalLead.websiteContext = trimmed;
      document.getElementById('pdWebsiteContext').innerText = trimmed;
      document.getElementById('pdWebsiteContextSection').style.display = 'block';
      savePersonalLeads();
    } else {
      alert('Could not scrape the website. The site may be blocking automated access.');
    }
  } catch(e) {
    alert('Scrape failed: ' + (e.message || 'Unknown error'));
  } finally {
    btn.innerText = 'Scrape Website';
    btn.disabled = false;
  }
};

// Add another email
document.getElementById('pdAddEmailBtn').onclick = () => {
  if (!currentPersonalLead) return;
  if (!currentPersonalLead.emails) currentPersonalLead.emails = [{ subject: '', body: '' }];
  currentPersonalLead.emails.push({ subject: '', body: '' });
  savePersonalLeads();
  renderPersonalEmailComposers();
  // Scroll new block into view
  const blocks = document.getElementById('pdEmailsContainer').querySelectorAll(':scope > div');
  if (blocks.length) blocks[blocks.length - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// Mark as Sent
document.getElementById('pdMarkSentBtn').onclick = () => {
  if (!currentPersonalLead) return;
  currentPersonalLead.sentDate = new Date().toISOString();
  updatePersonalLeadStatus('Sent');
};

// Mark as Replied
document.getElementById('pdMarkRepliedBtn').onclick = () => updatePersonalLeadStatus('Replied');

// Mark as No Response
document.getElementById('pdMarkNoResponseBtn').onclick = () => updatePersonalLeadStatus('No Response');

// Delete lead
document.getElementById('pdDeleteBtn').onclick = () => {
  document.getElementById('deletePersonalModal').classList.add('active');
};
document.getElementById('cancelDeletePersonalBtn').onclick = () => {
  document.getElementById('deletePersonalModal').classList.remove('active');
};
document.getElementById('confirmDeletePersonalBtn').onclick = () => {
  personalLeads = personalLeads.filter(l => l !== currentPersonalLead);
  savePersonalLeads();
  currentPersonalLead = null;
  document.getElementById('deletePersonalModal').classList.remove('active');
  document.getElementById('personalLeadDetailView').style.display = 'none';
  document.getElementById('personalSection').style.display = 'flex';
  renderPersonalTable();
};

// Edit lead button — opens edit modal prefilled
document.getElementById('pdEditBtn').onclick = () => {
  if (!currentPersonalLead) return;
  document.getElementById('plEditCompany').value = currentPersonalLead.company;
  document.getElementById('plEditContactName').value = currentPersonalLead.contactName;
  document.getElementById('plEditContactEmail').value = currentPersonalLead.contactEmail;
  document.getElementById('plEditWebsite').value = currentPersonalLead.website || '';
  document.getElementById('plEditRelationship').value = currentPersonalLead.relationship;
  document.getElementById('editPersonalLeadModal').classList.add('active');
};
document.getElementById('closeEditPersonalLeadModalBtn').onclick = () => {
  document.getElementById('editPersonalLeadModal').classList.remove('active');
};
document.getElementById('saveEditPersonalLeadBtn').onclick = () => {
  if (!currentPersonalLead) return;
  currentPersonalLead.company = document.getElementById('plEditCompany').value.trim() || currentPersonalLead.company;
  currentPersonalLead.contactName = document.getElementById('plEditContactName').value.trim() || currentPersonalLead.contactName;
  currentPersonalLead.contactEmail = document.getElementById('plEditContactEmail').value.trim() || currentPersonalLead.contactEmail;
  currentPersonalLead.website = document.getElementById('plEditWebsite').value.trim();
  currentPersonalLead.relationship = document.getElementById('plEditRelationship').value.trim() || currentPersonalLead.relationship;
  savePersonalLeads();
  document.getElementById('editPersonalLeadModal').classList.remove('active');
  openPersonalLeadDetail(currentPersonalLead);
};

// Search and status filter for personal table
document.getElementById('personalSearchInput').addEventListener('input', renderPersonalTable);
document.getElementById('personalStatusFilter').addEventListener('change', renderPersonalTable);

function setPersonalAddLeadTab(tab) {
  const isBulk = tab === 'bulk';
  const bulkTab = document.getElementById('tabAddPersonalBulk');
  const singleTab = document.getElementById('tabAddPersonalSingle');
  const bulkPanel = document.getElementById('personalModalBatchPanel');
  const singlePanel = document.getElementById('personalModalSinglePanel');

  bulkTab.classList.toggle('active', isBulk);
  singleTab.classList.toggle('active', !isBulk);
  bulkTab.style.color = isBulk ? 'var(--accent)' : 'var(--text-40)';
  bulkTab.style.borderBottom = isBulk ? '2px solid var(--accent)' : 'none';
  singleTab.style.color = isBulk ? 'var(--text-40)' : 'var(--accent)';
  singleTab.style.borderBottom = isBulk ? 'none' : '2px solid var(--accent)';
  bulkPanel.style.display = isBulk ? 'flex' : 'none';
  singlePanel.style.display = isBulk ? 'none' : 'block';
}

function processPersonalCSVContent(content, fileName) {
  const normalizeEmail = (e) => (e || '').trim().toLowerCase();
  const deriveCompany = (website, email) => {
    const fromWebsite = (website || '').replace(/^https?:\/\/(www\.)?/i, '').split('/')[0];
    if (fromWebsite) return fromWebsite;
    const fromEmail = (email || '').split('@')[1] || '';
    return fromEmail;
  };

  Papa.parse(content, { header: true, skipEmptyLines: true, complete: (r) => {
    let addedCount = 0;
    let dupeCount = 0;
    let skippedCount = 0;

    r.data.forEach((row, rowIndex) => {
      const R = {};
      Object.keys(row).forEach(k => { R[k.toLowerCase().trim()] = (row[k] || '').trim(); });
      const pick = (...keys) => {
        for (const key of keys) {
          const val = R[key.toLowerCase()];
          if (val) return val;
        }
        return '';
      };

      const emailField = pick('email', 'primary_contact_email', 'founder_email', 'contact_email', 'email address', 'e-mail', 'work_email', 'person_email');
      const emails = emailField.split(/[;,]/).map(e => e.trim()).filter(e => e && e.includes('@'));
      if (emails.length === 0) { skippedCount++; return; }

      const website = pick('website_url', 'website', 'url', 'website url', 'domain', 'company_domain', 'company_website', 'web');
      const firstName = pick('first_name', 'first name');
      const lastName = pick('last_name', 'last name', 'lastname');
      const combinedName = `${firstName} ${lastName}`.trim();
      const contactName = pick('primary_contact_name', 'founder_name', 'contact_name', 'full_name', 'name') || combinedName || 'Unknown';
      const companyRaw = pick('company_name', 'company', 'company name', 'organization', 'account name', 'account_name', 'org_name') || deriveCompany(website, emails[0]);
      const company = companyRaw.replace(/^www\./i, '').trim() || 'Unknown Company';
      const relationship = pick('relationship_context', 'relationship', 'context', 'notes', 'note') || `Imported from ${fileName}`;

      emails.forEach((email, emailIndex) => {
        const exists = personalLeads.some(l => normalizeEmail(l.contactEmail) === normalizeEmail(email));
        if (exists) { dupeCount++; return; }
        const campaignName = normalizeCampaignName(activeCampaign) || 'Personal';
        ensureCampaignExists(campaignName);
        personalLeads.push({
          id: `${Date.now()}-${rowIndex}-${emailIndex}`,
          company,
          contactName,
          contactEmail: email,
          website,
          relationship,
          status: 'Draft',
          emails: [{ subject: '', body: '' }],
          websiteContext: '',
          campaign: campaignName,
          dateAdded: new Date().toISOString()
        });
        addedCount++;
      });
    });

    if (addedCount > 0) {
      savePersonalLeads();
      renderPersonalTable();
      document.getElementById('addPersonalLeadModal').classList.remove('active');
      alert(`Imported ${addedCount} personal lead${addedCount === 1 ? '' : 's'}${dupeCount ? `\nSkipped duplicates: ${dupeCount}` : ''}${skippedCount ? `\nSkipped rows with no valid email: ${skippedCount}` : ''}`);
      return;
    }

    if (dupeCount > 0 || skippedCount > 0) {
      alert(`No new personal leads were imported.${dupeCount ? `\nDuplicates: ${dupeCount}` : ''}${skippedCount ? `\nRows with no valid email: ${skippedCount}` : ''}`);
      return;
    }

    alert('No valid leads found. Make sure your CSV has an email column.');
  }});
}

// Add New Personal Lead button
document.getElementById('addPersonalLeadBtn').onclick = () => {
  document.getElementById('plCompany').value = '';
  document.getElementById('plContactName').value = '';
  document.getElementById('plContactEmail').value = '';
  document.getElementById('plWebsite').value = '';
  document.getElementById('plRelationship').value = '';
  setPersonalAddLeadTab('bulk');
  document.getElementById('addPersonalLeadModal').classList.add('active');
};
document.getElementById('closeAddPersonalLeadModalBtn').onclick = () => {
  document.getElementById('addPersonalLeadModal').classList.remove('active');
};
document.getElementById('tabAddPersonalBulk').onclick = () => setPersonalAddLeadTab('bulk');
document.getElementById('tabAddPersonalSingle').onclick = () => setPersonalAddLeadTab('single');

document.getElementById('personalDropZone').onclick = async () => {
  const result = await window.electronAPI.openCSV();
  if (result) processPersonalCSVContent(result.content, result.fileName);
};
const personalDropZone = document.getElementById('personalDropZone');
personalDropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
  personalDropZone.style.borderColor = 'var(--accent)';
  personalDropZone.style.background = 'rgba(255,94,0,0.06)';
});
personalDropZone.addEventListener('dragleave', (e) => {
  e.preventDefault();
  personalDropZone.style.borderColor = '';
  personalDropZone.style.background = '';
});
personalDropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
  personalDropZone.style.borderColor = '';
  personalDropZone.style.background = '';
  const file = e.dataTransfer.files[0];
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.csv')) { alert('Please drop a CSV file.'); return; }
  const reader = new FileReader();
  reader.onload = (evt) => processPersonalCSVContent(evt.target.result, file.name);
  reader.readAsText(file);
});

document.getElementById('savePersonalLeadBtn').onclick = () => {
  const company = document.getElementById('plCompany').value.trim();
  const contactName = document.getElementById('plContactName').value.trim();
  const contactEmail = document.getElementById('plContactEmail').value.trim();
  const relationship = document.getElementById('plRelationship').value.trim();
  if (!company || !contactName || !contactEmail || !relationship) {
    alert('Please fill in all required fields (Company, Contact Name, Contact Email, Relationship Context).');
    return;
  }
  const campaignName = normalizeCampaignName(activeCampaign) || 'Personal';
  ensureCampaignExists(campaignName);
  personalLeads.push({
    id: Date.now().toString(),
    company,
    contactName,
    contactEmail,
    website: document.getElementById('plWebsite').value.trim(),
    relationship,
    status: 'Draft',
    emails: [{ subject: '', body: '' }],
    websiteContext: '',
    campaign: campaignName,
    dateAdded: new Date().toISOString()
  });
  savePersonalLeads();
  document.getElementById('addPersonalLeadModal').classList.remove('active');
  renderPersonalTable();
  renderSidebar();
};

document.getElementById('exportPersonalBtn').onclick = async () => {
  const inCampaign = personalLeads.filter(l => (l.campaign || 'Personal') === activeCampaign);
  const statusFilter = document.getElementById('personalStatusFilter').value;
  const search = (document.getElementById('personalSearchInput').value || '').toLowerCase();
  const exportable = inCampaign.filter(l => {
    if (statusFilter !== 'All' && l.status !== statusFilter) return false;
    if (search && !`${l.company} ${l.contactName} ${l.relationship}`.toLowerCase().includes(search)) return false;
    return true;
  });
  if (exportable.length === 0) { alert('No personal leads match the current filters.'); return; }

  const esc = str => !str ? '""' : `"${String(str).replace(/"/g, '""')}"`;
  const maxEmails = exportable.reduce((m, l) => Math.max(m, (l.emails || []).length), 1);
  const emailHeaders = [];
  for (let i = 1; i <= maxEmails; i++) emailHeaders.push(`E${i} Subject`, `E${i} Body`);
  let csv = ['Company', 'Contact Name', 'Contact Email', 'Website', 'Relationship', 'Campaign', 'Status', ...emailHeaders].join(',') + '\n';
  exportable.forEach(l => {
    const row = [esc(l.company), esc(l.contactName), esc(l.contactEmail), esc(l.website), esc(l.relationship), esc(l.campaign || 'Personal'), esc(l.status)];
    for (let i = 0; i < maxEmails; i++) {
      const em = (l.emails || [])[i] || { subject: '', body: '' };
      row.push(esc(em.subject), esc(em.body));
    }
    csv += row.join(',') + '\n';
  });

  const date = new Date().toISOString().split('T')[0];
  const slug = (activeCampaign || 'Personal').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'personal';
  const saved = await window.electronAPI.saveCSV({ csvData: csv, suggestedName: `labs22-personal-${slug}-${date}.csv` });
  if (saved) alert(`Exported ${exportable.length} personal lead${exportable.length === 1 ? '' : 's'}.`);
};

document.getElementById('leadWebsiteLink').onclick = () => {
  if (currentLeadInDetail && currentLeadInDetail.websiteURL && window.electronAPI && window.electronAPI.openExternal) {
    let url = currentLeadInDetail.websiteURL.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    window.electronAPI.openExternal(url);
  }
};

initApp();
