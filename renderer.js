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
  displayed.forEach(l => { const b = `Batch ${l.batch||1}`; if(!batches[b]) batches[b]=[]; batches[b].push(l); });
  
  Object.keys(batches).sort((a,b)=>parseInt(a.replace('Batch ',''))-parseInt(b.replace('Batch ',''))).forEach(batchKey => {
    const list = batches[batchKey];
    const header = document.createElement('tr');
    header.style.background = 'rgba(255,255,255,0.03)';
    header.innerHTML = `<td colspan="9" style="padding:10px 16px; font-family:'SF Mono'; font-size:10px; color:var(--accent); opacity:0.8; letter-spacing:1px;">${batchKey.toUpperCase()}</td>`;
    tbody.appendChild(header);

    list.forEach(l => {
      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      tr.innerHTML = `
        <td style="text-align:center;">${l.source==='batch'?'📦':'👤'}</td>
        <td style="font-family:'SF Mono'; font-size:11px; opacity:0.6;">${l.batch||1}</td>
        <td>${l.firstName}</td><td>${l.company}</td><td>${l.industry||'Identifying...'}</td><td>${l.websiteURL}</td>
        <td class="status-${l.status.toLowerCase()}">${l.status}</td>
        <td>${l.analysis?.pillars? l.analysis.pillars.positioning.score+'/5':'-'}</td>
        <td><button class="view-btn outline-btn" style="padding:4px 8px; font-size:11px;">View</button></td>
      `;
      tr.onclick = () => openLeadDetail(l);
      tbody.appendChild(tr);
    });
  });
  document.getElementById('importedCount').innerText = `${leads.filter(l=>l.mode===currentMode).length} LEADS`;
}

function openLeadDetail(lead) {
  document.getElementById('dashboardSections').style.display = 'none';
  document.getElementById('leadDetailView').style.display = 'flex';
  document.getElementById('detailCompany').innerText = lead.company;
  document.getElementById('detailName').innerText = lead.firstName;
  document.getElementById('detailEmail').innerText = lead.email;
  document.getElementById('detailIndustry').innerText = lead.industry || 'Identifying...';
  document.getElementById('detailStatusText').innerText = lead.status;
  document.getElementById('detailStatusBadge').className = `status-${lead.status.toLowerCase()}`;
  
  if (lead.analysis) {
    document.getElementById('detailReaction').innerText = lead.analysis.visitorReaction || '';
    const gap = lead.mode === 'branding' ? lead.analysis.brand_observation : lead.analysis.specific_observation;
    document.getElementById('detailGap').innerText = gap || '';
    // (Scores population follows previous logic)
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
document.getElementById('tabLeads').onclick = () => switchTab('tabLeads', 'leadsSection');
document.getElementById('tabBatch').onclick = () => switchTab('tabBatch', 'batchSection');
document.getElementById('tabSingle').onclick = () => switchTab('tabSingle', 'singleSection');
document.getElementById('backFromDetailBtn').onclick = () => { document.getElementById('leadDetailView').style.display='none'; document.getElementById('dashboardSections').style.display='flex'; };

function reassignBatches() {
  leads.forEach((l, i) => l.batch = Math.floor(i / 40) + 1);
  const sel = document.getElementById('batchSelector');
  if (sel) {
    const max = Math.ceil(leads.length / 40);
    sel.innerHTML = '<option value="all">All Batches</option>';
    for(let i=1; i<=max; i++) sel.innerHTML += `<option id="opt${i}" value="${i}">Batch ${i}</option>`;
  }
}

function updateProgressText() {
  const r = leads.filter(l => l.status==='Ready').length;
  document.getElementById('progressText').innerText = `${r}/${leads.length} Processed`;
}

initApp();
