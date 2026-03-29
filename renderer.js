const DEFAULT_PROMPT = `You are a cold email personalization assistant for a design and UX agency called Labs22, based in Dubai.

... (Full V6 Apex UX Prompt provided by user) ...

PART 9 — OUTPUT FORMAT
{
  "siteLoaded": true,
  "visitorReaction": "2-3 sentences",
  "pillars": {
    "positioning": { "score": 0, "reason": "why" },
    "trust": { "score": 0, "reason": "why" },
    "conversion": { "score": 0, "reason": "why" }
  },
  "mostPainful": "direct conversion gap",
  "allGood": false,
  "specific_observation": "note for email. starts with 'I noticed...'",
  "industry": "natural industry",
  "opening_line": "Observation. Ends with period.",
  "pointers": ["Pointer 1", "Pointer 2", "Pointer 3"]
}
`;

const BRANDING_PROMPT = `You are a cold email personalization assistant for Labs22, a brand identity and UX agency in Dubai.

... (Full Branding Prompt provided by user) ...

PART 9 — OUTPUT FORMAT
{
  "siteLoaded": true,
  "sector": "their sector",
  "differentiator": "one sentence",
  "visitorReaction": "2-3 sentences",
  "industry": "natural industry",
  "opening_line": "One complete sentence. Ends with a period.",
  "brand_observation": "1-2 sentences. Starts lowercase. No ending period.",
  "pointers": ["Pointer 1", "Pointer 2", "Pointer 3"]
}
`;

// State
let leads = [];
let isProcessing = false;
let cancelProcessing = false;
let currentMode = localStorage.getItem('currentMode') || 'uiux'; 
let activeTab = 'tabLeads';
let currentLeadInDetail = null;

const saveAllState = () => {
  if (window.electronAPI && window.electronAPI.saveState) {
    window.electronAPI.saveState(leads);
  }
};

const MODELS_MAP = {
  Gemini: ['gemini-3-flash-preview', 'gemini-3.1-flash', 'gemini-1.5-pro'],
  Claude: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-opus-latest'],
  OpenAI: ['gpt-4o', 'gpt-4o-mini', 'o1-preview']
};

function updateModelDropdown() {
  const provider = document.getElementById('activeAi').value;
  const modelSelect = document.getElementById('activeModel');
  const currentVal = localStorage.getItem('activeModel');
  modelSelect.innerHTML = '';
  (MODELS_MAP[provider] || []).forEach(m => {
    const opt = document.createElement('option');
    opt.value = m; opt.innerText = m;
    modelSelect.appendChild(opt);
  });
  if (currentVal && (MODELS_MAP[provider]||[]).includes(currentVal)) {
    modelSelect.value = currentVal;
  }
}

function updateActiveAiBadge() {
  const provider = localStorage.getItem('activeAi') || 'Gemini';
  const badge = document.querySelector('.ai-badge');
  if (badge) badge.innerText = provider.toUpperCase();
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
  // Load AI Keys
  document.getElementById('geminiKey').value = localStorage.getItem('geminiKey') || '';
  document.getElementById('claudeKey').value = localStorage.getItem('claudeKey') || '';
  document.getElementById('openaiKey').value = localStorage.getItem('openaiKey') || '';
  document.getElementById('activeAi').value = localStorage.getItem('activeAi') || 'Gemini';
  document.getElementById('activeAi').onchange = updateModelDropdown;
  updateModelDropdown();

  // Load Sender Identities
  document.getElementById('uiuxSenderName').value = localStorage.getItem('uiuxSenderName') || 'Aryan';
  document.getElementById('uiuxSenderTitle').value = localStorage.getItem('uiuxSenderTitle') || 'Partner, Labs22';
  document.getElementById('uiuxSenderWeb').value = localStorage.getItem('uiuxSenderWeb') || 'labs22.com';
  document.getElementById('uiuxEnoc').checked = localStorage.getItem('uiuxEnoc') !== 'false';

  document.getElementById('brandingSenderName').value = localStorage.getItem('brandingSenderName') || '';
  document.getElementById('brandingSenderTitle').value = localStorage.getItem('brandingSenderTitle') || 'Partner, Labs22';
  document.getElementById('brandingSenderWeb').value = localStorage.getItem('brandingSenderWeb') || 'labs22.com';
  document.getElementById('brandingEnoc').checked = localStorage.getItem('brandingEnoc') !== 'false';

  if (!localStorage.getItem('systemPrompt')) localStorage.setItem('systemPrompt', DEFAULT_PROMPT);
  if (!localStorage.getItem('systemPrompt_branding')) localStorage.setItem('systemPrompt_branding', BRANDING_PROMPT);
  
  switchMode(currentMode);
  updateActiveAiBadge();

  // Load Leads
  try {
    const saved = await window.electronAPI.loadState();
    if (saved && Array.isArray(saved)) {
      leads = saved;
      leads.forEach(l => { if (!l.mode) l.mode = 'uiux'; });
      reassignBatches();
      renderTable();
    }
  } catch(e) { console.error("LoadState fail:", e); }

  // Settings Tabs
  const setTabs = ['setTabGeneral', 'setTabUiux', 'setTabBranding'];
  const setPanes = ['settingsGeneral', 'settingsSenderUiux', 'settingsSenderBranding'];
  setTabs.forEach((id, idx) => {
    document.getElementById(id).onclick = () => {
      setTabs.forEach(t => document.getElementById(t).classList.remove('active'));
      setPanes.forEach(p => document.getElementById(p).style.display = 'none');
      document.getElementById(id).classList.add('active');
      document.getElementById(setPanes[idx]).style.display = 'block';
    };
  });
}

function switchMode(mode) {
  currentMode = mode;
  localStorage.setItem('currentMode', mode);
  
  const uiBtn = document.getElementById('modeUiux');
  const brBtn = document.getElementById('modeBranding');
  
  if (mode === 'uiux') {
    uiBtn.style.color = 'var(--bg)';
    uiBtn.style.background = 'var(--accent)';
    uiBtn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    brBtn.style.color = 'var(--text-40)';
    brBtn.style.background = 'transparent';
    brBtn.style.boxShadow = 'none';
  } else {
    brBtn.style.color = 'var(--bg)';
    brBtn.style.background = 'var(--accent)';
    brBtn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    uiBtn.style.color = 'var(--text-40)';
    uiBtn.style.background = 'transparent';
    uiBtn.style.boxShadow = 'none';
  }

  const pKey = mode === 'uiux' ? 'systemPrompt' : 'systemPrompt_branding';
  const def = mode === 'uiux' ? DEFAULT_PROMPT : BRANDING_PROMPT;
  document.getElementById('systemPromptArea').value = localStorage.getItem(pKey) || def;

  renderTable();
}

function renderTable() {
  const tbody = document.getElementById('leadsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const search = document.getElementById('searchInput').value.toLowerCase();
  const filterBatch = document.getElementById('batchSelector').value;
  const activeTabName = localStorage.getItem('activeTab') || 'tabLeads';

  const displayed = leads.filter(l => {
    if (l.mode !== currentMode) return false;
    if (activeTabName === 'tabBatch' && l.source !== 'batch') return false;
    if (activeTabName === 'tabSingle' && l.source !== 'manual') return false;
    if (filterBatch !== 'all' && l.batch !== parseInt(filterBatch)) return false;
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
      if (!lead.analysis || !lead.analysis.pillars) return '-';
      const p = lead.analysis.pillars;
      const b = val => {
        let cl = 'score-gray';
        if (val >= 4) cl = 'score-green'; else if (val >= 3) cl = 'score-yellow'; else if (val > 0) cl = 'score-red';
        return `<span class="score-badge ${cl}">${val||'-'}</span>`;
      };
      return `<div style="display:flex; align-items:center;">` + b(p.positioning?.score) + b(p.trust?.score) + b(p.conversion?.score) + `</div>`;
    };
    const sc = (str, fallback = '-') => {
      if (!str || typeof str !== 'string' || str.trim() === '') return fallback;
      const s = str.trim();
      return s.charAt(0).toUpperCase() + s.slice(1);
    };
    
    tr.innerHTML = `
      <td style="text-align:center;">${l.source==='batch'?'📦':'👤'}</td>
      <td>${sc(l.firstName, '')}</td>
      <td>${sc(l.company, '')}</td>
      <td>${sc(l.industry, '-')}</td>
      <td>${sc(l.country, '-')}</td>
      <td>${l.websiteURL}</td>
      <td class="status-${l.status.toLowerCase()}"><div style="display:flex;align-items:center;"><span class="status-dot"></span>${l.status}</div></td>
      <td>${getScoresHtml(l)}</td>
      <td style="position:relative;">
        <div style="display:flex; align-items:center; gap:8px;">
          <button class="view-btn outline-btn" style="padding:4px 12px; font-size:11px; height:28px;">View</button>
          ${
            (l.status === 'Queued' || l.status === 'Processing' || l.status === 'Error') 
            ? `<button class="process-inline-btn outline-btn" style="padding:4px 12px; font-size:11px; height:28px; border-color:#8B5CF6; color:#8B5CF6;">Process</button>`
            : `<button class="export-inline-btn outline-btn" style="padding:4px 12px; font-size:11px; height:28px; border-color:var(--accent); color:var(--accent);">Export</button>`
          }
          <button class="more-btn" style="background:transparent; border:none; color:var(--text-70); font-size:18px; cursor:pointer; padding:0 4px;">⋮</button>
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

    tr.querySelector('.view-btn').onclick = (e) => { e.stopPropagation(); openLeadDetail(l); };
    
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
    tr.querySelector('.more-btn').onclick = (e) => {
      e.stopPropagation();
      document.querySelectorAll('.more-dropdown').forEach(d => { if(d!==dropdown) d.style.display='none'; });
      dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
    };

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

  // Render Manual Leads without a table header separating them
  manualLeads.forEach(l => {
    tbody.appendChild(createLeadRow(l));
  });
  
  Object.keys(batches).sort((a,b)=>parseInt(a.replace('Batch ',''))-parseInt(b.replace('Batch ',''))).forEach(batchKey => {
    const list = batches[batchKey];
    
    let bDateObj = new Date();
    if (list.length > 0 && list[0].dateAdded) { bDateObj = new Date(list[0].dateAdded); }
    const batchDateStr = `${String(bDateObj.getDate()).padStart(2,'0')}-${String(bDateObj.getMonth()+1).padStart(2,'0')}-${bDateObj.getFullYear()}`;
    
    const isFullyExported = list.length > 0 && list.every(l => l.status === 'Exported');
    const badgeHtml = isFullyExported ? `<span style="background: rgba(139, 92, 246, 0.15); color: #8B5CF6; border: 1px solid rgba(139, 92, 246, 0.3); padding: 4px 10px; border-radius: 4px; font-size: 10px; margin-left: 12px; font-weight: 700; display: inline-flex; align-items: center;">✓ EXPORTED</span>` : '';

    const hasQueued = list.some(l => l.status === 'Queued');
    const hasReady = list.some(l => l.status === 'Ready');
    let ctaHtml = '';
    if (hasQueued) {
      ctaHtml = `<button class="process-batch-inline-btn primary-btn" style="padding: 6px 16px; font-size: 11px; height: 32px; font-family: 'SF Mono', monospace;">PROCESS BATCH</button>`;
    } else if (hasReady || isFullyExported) {
      ctaHtml = `<button class="export-batch-inline-btn primary-btn" style="padding: 6px 16px; font-size: 11px; height: 32px; background: #8B5CF6; border-color: #8B5CF6; color: white; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3); font-family: 'SF Mono', monospace;">EXPORT BATCH</button>`;
    }

    const header = document.createElement('tr');
    header.style.background = 'rgba(255,255,255,0.03)';
    header.innerHTML = `
      <td colspan="9" style="padding:16px 20px; font-family:'Inter', sans-serif; font-size:14px; color:#FFFFFF; font-weight:700; border-bottom:1px solid var(--border);">
        <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
          <div style="display:flex; align-items:center; letter-spacing: 0.5px;">
            ${batchKey.toUpperCase()} <span style="color:var(--text-40); font-size:12px; margin-left:12px; font-weight:500;">${batchDateStr}</span>
            ${badgeHtml}
          </div>
          ${ctaHtml}
        </div>
      </td>`;
    tbody.appendChild(header);

    const exportBatchBtn = header.querySelector('.export-batch-inline-btn');
    if (exportBatchBtn) exportBatchBtn.onclick = (e) => { e.stopPropagation(); exportSpecificLeads(list); };

    const processBatchBtn = header.querySelector('.process-batch-inline-btn');
    if (processBatchBtn) processBatchBtn.onclick = (e) => {
      e.stopPropagation(); 
      document.getElementById('batchSelector').value = batchKey.replace('Batch ','');
      document.getElementById('processNextBatchBtn').click();
    };

    list.forEach(l => {
      tbody.appendChild(createLeadRow(l));
    });
  });
  document.getElementById('importedCount').innerText = `${leads.filter(l=>l.mode===currentMode).length} LEADS`;
}

function openLeadDetail(lead) {
  currentLeadInDetail = lead;
  document.getElementById('dashboardSections').style.display = 'none';
  document.getElementById('leadDetailView').style.display = 'flex';
  document.getElementById('detailCompany').innerText = lead.company;
  document.getElementById('detailName').innerText = lead.firstName;
  document.getElementById('detailEmail').innerText = lead.email;
  document.getElementById('detailIndustry').innerText = lead.industry || 'Identifying...';
  document.getElementById('detailCountry').innerText = lead.country || 'Unknown';
  document.getElementById('detailStatusText').innerText = lead.status;
  document.getElementById('detailStatusBadge').className = `status-${lead.status.toLowerCase()}`;
  
  if (lead.analysis) {
    document.getElementById('detailReaction').innerText = lead.analysis.visitorReaction || '';
    const gap = lead.mode === 'branding' ? lead.analysis.brand_observation : lead.analysis.specific_observation;
    document.getElementById('detailGap').innerText = gap || '';
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
    const body = lead.sequence[`e${i}b`].replace(/\n/g,'<br>');
    card.innerHTML = `<div class="email-header"><b>EMAIL ${i}</b> <button class="copy-btn outline-btn">Copy</button></div><div class="email-body"><b>S: ${lead.sequence[`e${i}s`]}</b><br><br>${body}</div>`;
    card.querySelector('.copy-btn').onclick = () => { navigator.clipboard.writeText(lead.sequence[`e${i}b`]); };
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
  const firstName = lead.firstName || 'there';
  const obs = lead.mode === 'branding' ? lead.analysis.brand_observation : lead.analysis.specific_observation;
  const opening = lead.analysis.opening_line || `I came across ${lead.company}...`;
  
  const enocLine = s.enoc ? "\n\nWe specialized in brand identity and UX — recent work includes ENOC and Visa UAE." : "";

  return {
    e1s: `Quick thought on ${lead.company}`,
    e1b: `Hi ${firstName},\n\n${opening}\n\nI might be wrong, but ${obs}.${enocLine}\n\n— ${s.name}\n${s.title}\n${s.web}`,
    e2s: `Follow up pointer`,
    e2b: `Hi ${firstName},\n\nHope you're well. Here are some pointers: ${lead.analysis.pointers?.join('\n• ')}\n\n— ${s.name}`
  };
}

async function processLead(lead) {
  const provider = localStorage.getItem('activeAi') || 'Gemini';
  const model = localStorage.getItem('activeModel') || 'gemini-1.5-pro';
  const apiKey = localStorage.getItem(`${provider.toLowerCase()}Key`);
  const promptKey = lead.mode === 'branding' ? 'systemPrompt_branding' : 'systemPrompt';
  const sysPrompt = localStorage.getItem(promptKey) || (lead.mode==='branding'?BRANDING_PROMPT:DEFAULT_PROMPT);
  
  try {
    const scraped = await window.electronAPI.scrapeWebsite(lead.websiteURL);
    const schema = lead.mode === 'branding' ? BRANDING_SCHEMA : UIUX_SCHEMA;
    const response = await window.electronAPI.aiCall({
      url: provider === 'Gemini' ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}` : '...',
      method: 'POST', body: provider === 'Gemini' ? { contents: [{ parts: [{ text: `${sysPrompt}\n\n${scraped}` }] }], generationConfig: { responseMimeType: "application/json", responseSchema: schema }} : {}
    });
    const result = response.data.candidates[0].content.parts[0].text;
    lead.analysis = JSON.parse(result);
    lead.sequence = generateSequences(lead);
    lead.status = 'Ready';
  } catch(e) { lead.status = 'Error'; }
  renderTable();
  await window.electronAPI.saveState(leads);
}

document.getElementById('modeUiux').onclick = () => switchMode('uiux');
document.getElementById('modeBranding').onclick = () => switchMode('branding');

document.getElementById('settingsBtn').onclick = () => {
    // Reload values to ensure no unsaved edits linger
    document.getElementById('geminiKey').value = localStorage.getItem('geminiKey') || '';
    document.getElementById('claudeKey').value = localStorage.getItem('claudeKey') || '';
    document.getElementById('openaiKey').value = localStorage.getItem('openaiKey') || '';
    document.getElementById('activeAi').value = localStorage.getItem('activeAi') || 'Gemini';
    updateModelDropdown();
    
    document.getElementById('uiuxSenderName').value = localStorage.getItem('uiuxSenderName') || '';
    document.getElementById('uiuxSenderTitle').value = localStorage.getItem('uiuxSenderTitle') || '';
    document.getElementById('uiuxSenderWeb').value = localStorage.getItem('uiuxSenderWeb') || '';
    document.getElementById('uiuxEnoc').checked = localStorage.getItem('uiuxEnoc') !== 'false';
    
    document.getElementById('brandingSenderName').value = localStorage.getItem('brandingSenderName') || '';
    document.getElementById('brandingSenderTitle').value = localStorage.getItem('brandingSenderTitle') || '';
    document.getElementById('brandingSenderWeb').value = localStorage.getItem('brandingSenderWeb') || '';
    document.getElementById('brandingEnoc').checked = localStorage.getItem('brandingEnoc') !== 'false';

    const pKey = currentMode === 'uiux' ? 'systemPrompt' : 'systemPrompt_branding';
    const def = currentMode === 'uiux' ? DEFAULT_PROMPT : BRANDING_PROMPT;
    document.getElementById('systemPromptArea').value = localStorage.getItem(pKey) || def;

    document.getElementById('settingsModal').classList.add('active');
};

document.getElementById('cancelSettingsBtn').onclick = () => {
    document.getElementById('settingsModal').classList.remove('active');
};

document.getElementById('closeSettingsBtn').onclick = () => {
  localStorage.setItem('geminiKey', document.getElementById('geminiKey').value);
  localStorage.setItem('claudeKey', document.getElementById('claudeKey').value);
  localStorage.setItem('openaiKey', document.getElementById('openaiKey').value);
  localStorage.setItem('activeAi', document.getElementById('activeAi').value);
  localStorage.setItem('activeModel', document.getElementById('activeModel').value);
  
  localStorage.setItem('uiuxSenderName', document.getElementById('uiuxSenderName').value);
  localStorage.setItem('uiuxSenderTitle', document.getElementById('uiuxSenderTitle').value);
  localStorage.setItem('uiuxSenderWeb', document.getElementById('uiuxSenderWeb').value);
  localStorage.setItem('uiuxEnoc', document.getElementById('uiuxEnoc').checked);
  
  localStorage.setItem('brandingSenderName', document.getElementById('brandingSenderName').value);
  localStorage.setItem('brandingSenderTitle', document.getElementById('brandingSenderTitle').value);
  localStorage.setItem('brandingSenderWeb', document.getElementById('brandingSenderWeb').value);
  localStorage.setItem('brandingEnoc', document.getElementById('brandingEnoc').checked);
  
  const pKey = currentMode === 'uiux' ? 'systemPrompt' : 'systemPrompt_branding';
  localStorage.setItem(pKey, document.getElementById('systemPromptArea').value);
  
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

function switchTabVisuals(activeId) {
  const ids = ['tabLeads', 'tabBatch', 'tabSingle'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === activeId) {
      el.classList.add('active'); el.style.color = 'var(--accent)'; el.style.borderBottom = '2px solid var(--accent)';
    } else {
      el.classList.remove('active'); el.style.color = 'var(--text-40)'; el.style.borderBottom = 'none';
    }
  });
}

document.getElementById('tabLeads').onclick = () => {
  localStorage.setItem('activeTab', 'tabLeads');
  switchTabVisuals('tabLeads');
  document.getElementById('leadDetailView').style.display='none'; 
  document.getElementById('dashboardSections').style.display='flex';
  renderTable();
};

document.getElementById('tabBatch').onclick = () => {
  localStorage.setItem('activeTab', 'tabBatch');
  switchTabVisuals('tabBatch');
  document.getElementById('leadDetailView').style.display='none'; 
  document.getElementById('dashboardSections').style.display='flex';
  renderTable();
};

document.getElementById('tabSingle').onclick = () => {
  localStorage.setItem('activeTab', 'tabSingle');
  switchTabVisuals('tabSingle');
  document.getElementById('leadDetailView').style.display='none'; 
  document.getElementById('dashboardSections').style.display='flex';
  renderTable();
};

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

function reassignBatches() {
  leads.forEach((l, i) => l.batch = Math.floor(i / parseInt(document.getElementById('batchSizeInput').value || 40)) + 1);
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
  document.getElementById('progressText').innerText = `${r}/${leads.length} Processed`;
}

document.getElementById('manualAddBtn').onclick = () => {
  const url = document.getElementById('manualUrl').value.trim();
  const emails = document.getElementById('manualEmails').value.split(',').map(e=>e.trim()).filter(e=>e);
  if (!url || emails.length === 0) { alert('URL and logic emails required.'); return; }
  emails.forEach(e => {
    leads.push({
      firstName: document.getElementById('manualFirstName').value,
      company: document.getElementById('manualCompany').value,
      websiteURL: url, email: e, country: document.getElementById('manualCountry').value,
      status: 'Queued', source: 'manual', mode: currentMode, dateAdded: new Date().toISOString()
    });
  });
  reassignBatches(); updateCountryFilter(); saveAllState(); renderTable();
  document.getElementById('addLeadModal').classList.remove('active');
};

document.getElementById('dropZone').onclick = async () => {
  const csv = await window.electronAPI.openCSV();
  if (csv) {
    Papa.parse(csv, { header:true, skipEmptyLines: true, complete: (r) => {
      r.data.forEach(row => { 
        if(row.Email) {
          const rawCountry = row['Country'] || row['Person Country'] || row['Company Country'] || '';
          leads.push({ firstName: row['First Name'], company: row.Company, websiteURL: row['Website URL'], email: row.Email, industry: row['Industry'], country: rawCountry, status:'Queued', source:'batch', mode:currentMode, dateAdded: new Date().toISOString() }); 
        }
      });
      reassignBatches(); updateCountryFilter(); saveAllState(); renderTable();
      document.getElementById('addLeadModal').classList.remove('active');
    }});
  }
};

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
});

initApp();
