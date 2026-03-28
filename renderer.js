// Default System Prompt
const DEFAULT_PROMPT = `You are a cold email personalization assistant for a design and UX agency called Labs22, based in Dubai.

Your job has TWO parts:
1) Analyze websites like a normal visitor
2) Personalize fixed email templates using that analysis

You are NOT allowed to write new emails.
You are NOT allowed to improve phrasing.
You are NOT allowed to change tone.

You must use the templates word-for-word.

You may ONLY replace bracketed fields.

---

PART 0 — WEBSITE ACCESS CHECK (HARD OVERRIDE — HIGHEST PRIORITY)

This step has absolute priority over all other instructions.

If the website content provided is empty, an error page, less than 50 characters, a parked domain, or a "coming soon" page:

Return ONLY this JSON: {"siteLoaded": false}

Do NOT do analysis. Do NOT score pillars. Do NOT generate email fields. Stop here.

---

PART 1 — WEBSITE ANALYSIS (NORMAL USER LENS)

If the site has real content, analyze like a normal first-time visitor.

You are:
- Busy
- Slightly skeptical
- Low patience
- Skimming quickly

You do NOT think like a UX expert.

You think like a real visitor asking:
- What do they do?
- Is this for me?
- What should I do next?
- Do I trust this?

Describe reactions simply.

No jargon.
No expert terms.

---

STRICT LANGUAGE RULES (ANALYSIS)

Never use:
- optimization
- CRO
- funnel
- audit
- heuristics
- conversion rate
- user experience
- call to action / CTA
- above the fold
- information architecture
- bounce rate
- KPIs
- leverage
- synergy
- actionable
- utilize

Use natural phrases like:
- not obvious
- hard to find
- had to scroll
- wasn't sure
- not immediately clear
- took me a moment
- I couldn't tell

---

PART 2 — 3-PILLAR ANALYSIS

POSITIONING
If what they do or who it's for isn't clear quickly.

CONVERSION
If next steps or contact paths feel buried or unclear.

TRUST
If proof, credibility, or reassurance feels missing.

---

PART 3 — DETERMINISTIC SCORING (MANDATORY)

Score each pillar from 1-5.

1 = Major issue
2 = Clear problem
3 = Noticeable gap
4 = Decent
5 = Strong

Rules:
- Lowest score = most painful
- Tie-breaker: Positioning > Conversion > Trust
- Briefly explain scores
- If all pillars score 4-5, set allGood to true

---

PART 4 — FINDING THE RIGHT OBSERVATION (CRITICAL)

Check in this order:

TIER 1 — CLARITY (always check first):
- Can a visitor tell exactly WHO this company helps?
- Can a visitor tell what OUTCOMES they deliver?
- Does the hero/tagline say something specific or could it apply to anyone?
- What is the company's actual positioning and does the site communicate it clearly?

TIER 2 — TRUST:
- Is there visible proof? Client logos, testimonials, results, case studies?
- Would a visitor feel confident this company has done this before?

TIER 3 — CONVERSION:
- Is there a genuine friction problem?
- ONLY flag if the contact path is truly broken or missing

NEVER flag as issues:
- Contact form in footer (that's normal)
- "Contact Us" in navigation (that's normal)
- "Read More" links (that's normal)
- Creative taglines (intentional brand choices)
- Outdated news or blog sections (NEVER mention this, ever)
- Subjective design opinions
- Rhetorical questions on the page (these are a copywriting choice, not a problem)

THE OBSERVATION FORMULA:

Part A — Reference what their site actually says about themselves. Their positioning. Their tagline. Their claimed expertise. Show you actually looked.

Part B — Note what a first-time visitor still can't easily figure out DESPITE what the site says. What's missing? Who exactly do they help? What results do they get?

COMBINE: "noticed the positioning around [what they say] — I might be wrong, but as a first-time visitor it's still [what's unclear or missing]"

---

PART 5 — OUTPUT FORMAT

Output ONLY valid JSON. No markdown. No backticks. No text before or after the JSON.

USE THESE EXACT FIELD NAMES:

{
  "siteLoaded": true,
  "visitorReaction": "2-3 sentence gut reaction as a normal visitor. Reference what the company says about themselves and what felt unclear or missing.",
  "pillars": {
    "positioning": {"score": 1, "reason": "one sentence"},
    "trust": {"score": 1, "reason": "one sentence"},
    "conversion": {"score": 1, "reason": "one sentence"}
  },
  "mostPainful": "positioning",
  "allGood": false,
  "industry": "the company's actual industry described naturally, like you would tell a friend. e.g. market entry advisory, luxury real estate, fintech platform. NOT a database label.",
  "opening_line": "One complete sentence. How you came across them and what you noticed about their positioning. Must describe what they do naturally and reference something specific their site says. Example: I came across Broadfolio while looking at market entry and business development firms in the Middle East, and noticed the positioning around decision-maker access and helping companies establish in the region",
  "specific_observation": "1-2 sentences. Flows after 'I might be wrong, but'. Notes what a first-time visitor still can't easily figure out DESPITE what the site says. References what they claim, then notes the gap. Starts lowercase. No ending period.",
  "pointers": [
    "Pointer 1 — specific to this site, 20+ words, helpful tone, actionable. NEVER mention outdated content.",
    "Pointer 2 — specific to this site, 20+ words, helpful tone, actionable. NEVER mention outdated content.",
    "Pointer 3 — specific to this site, 20+ words, helpful tone, actionable. NEVER mention outdated content."
  ]
}

DO NOT use these field names: siteAnalyzed, observations, specificObservation, specificFeature, keyAction, key_action, specific_feature, painExplanation, openingLine

---

QUALITY CHECKLIST — verify before outputting:

1. Does opening_line describe what the company does in natural language? Not a database label like "top-tier" or "Unknown"?
2. Does opening_line reference something specific their site says (their tagline, positioning, claimed expertise)?
3. Does specific_observation reference what THEIR site says, then note what's MISSING?
4. Does specific_observation start lowercase and have no ending period?
5. Does it flow naturally after "I might be wrong, but"?
6. Are all pointers 20+ words and specific to THIS site?
7. Did you mention outdated news or blog posts ANYWHERE? REMOVE IT.
8. Did you flag Read More buttons, footer contact forms, or rhetorical questions as problems? Find something else.
9. Did you use any banned jargon?
10. Would a CEO read this and think "fair point"?
11. Would Aryan send this email without editing?

---

EXAMPLE OF GOOD OUTPUT (for Broadfolio):

{
  "siteLoaded": true,
  "visitorReaction": "I can tell they help companies enter the Middle East market, and I noticed the positioning around 'market entry' and 'access to decision makers.' But as a first-time visitor it wasn't immediately clear which types of companies they work best with or what outcomes they typically deliver.",
  "pillars": {
    "positioning": {"score": 2, "reason": "The core service is clear but it's not obvious which industries or company stages they specialize in"},
    "trust": {"score": 2, "reason": "No client logos, case studies, or specific outcomes on the homepage despite a Clients page existing in nav"},
    "conversion": {"score": 4, "reason": "Contact form and phone number in the footer, Contact Us in nav — easy enough to find"}
  },
  "mostPainful": "trust",
  "allGood": false,
  "industry": "market entry advisory",
  "opening_line": "I came across Broadfolio while looking at market entry and business development firms in the Middle East, and noticed the positioning around decision-maker access and helping companies establish in the region",
  "specific_observation": "as a first-time visitor it's still a bit hard to quickly understand who Broadfolio is best for (industries/company stage) and what outcomes you typically deliver — before needing to read multiple sections",
  "pointers": [
    "Adding a short line under the hero text specifying which types of companies you typically help — European tech companies, manufacturers, consumer brands — would instantly tell visitors whether your services are relevant to them",
    "The 'Why Choose Us' section makes strong claims about relationships and faster ROI but backing one of those up with a specific example or client result would make the claims much more convincing",
    "The five rhetorical questions under Services are a smart way to speak to visitor pain points — adding a clear next step right after ('Book a 15-minute consultation') would capture visitors while they're nodding along"
  ]
}
`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    siteLoaded: { type: "BOOLEAN" },
    visitorReaction: { type: "STRING" },
    pillars: {
      type: "OBJECT",
      properties: {
        positioning: { type: "OBJECT", properties: { score: { type: "INTEGER" }, reason: { type: "STRING" } }, required: ["score", "reason"] },
        trust: { type: "OBJECT", properties: { score: { type: "INTEGER" }, reason: { type: "STRING" } }, required: ["score", "reason"] },
        conversion: { type: "OBJECT", properties: { score: { type: "INTEGER" }, reason: { type: "STRING" } }, required: ["score", "reason"] }
      }
    },
    mostPainful: { type: "STRING" },
    allGood: { type: "BOOLEAN" },
    specific_observation: { type: "STRING" },
    industry: { type: "STRING" },
    opening_line: { type: "STRING" },
    pointers: { type: "ARRAY", items: { type: "STRING" } }
  },
  required: ["siteLoaded"]
};

// State
let leads = [];
let isProcessing = false;
let cancelProcessing = false;
let selectedRowIndex = -1;
let activeTab = 'tabLeads';
let leadToDeleteIndex = -1;

function showDeleteModal(index) {
  const lead = leads[index];
  if (!lead) return;
  leadToDeleteIndex = index;
  document.getElementById('deleteModalText').innerText = `Are you sure you want to delete ${lead.company}? This cannot be undone.`;
  document.getElementById('deleteModal').classList.add('active');
}

const MODELS_MAP = {
  Gemini: ['gemini-3-flash-preview', 'gemini-3.1-flash', 'gemini-3.1-pro', 'gemini-1.5-pro'],
  Claude: ['claude-sonnet-4-6', 'claude-sonnet-4-20250514', 'claude-opus-4-6', 'claude-haiku-4-5', 'claude-3-5-sonnet-latest'],
  OpenAI: ['gpt-4o', 'gpt-4o-mini', 'gpt-o1-preview']
};

function updateModelDropdown() {
  const provider = document.getElementById('activeAi').value;
  const modelSelect = document.getElementById('activeModel');
  const currentVal = localStorage.getItem('activeModel');
  
  modelSelect.innerHTML = '';
  (MODELS_MAP[provider] || []).forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.innerText = m;
    modelSelect.appendChild(opt);
  });
  
  if (currentVal && MODELS_MAP[provider].includes(currentVal)) {
    modelSelect.value = currentVal;
  }
}

function switchTab(tabId, sectionId) {
  // Update Tab Styling
  document.querySelectorAll('.app-tab').forEach(t => {
    t.classList.remove('active');
    t.style.color = 'var(--text-40)';
    t.style.borderBottom = 'none';
  });
  const el = document.getElementById(tabId);
  if (el) {
    el.classList.add('active');
    el.style.color = 'var(--accent)';
    el.style.borderBottom = '2px solid var(--accent)';
  }

  activeTab = tabId;
  
  // Handle Detail View vs Dashboard
  const dashboardSections = document.getElementById('dashboardSections');
  const detailView = document.getElementById('leadDetailView');

  if (sectionId === 'leadDetailView') {
    dashboardSections.style.display = 'none';
    detailView.style.display = 'flex';
  } else {
    dashboardSections.style.display = 'flex';
    detailView.style.display = 'none';

    // Toggle Panels inside dashboard
    const batchPanel = document.getElementById('batchPanel');
    const singlePanel = document.getElementById('singlePanel');

    batchPanel.style.display = (sectionId === 'batchSection') ? 'flex' : 'none';
    singlePanel.style.display = (sectionId === 'singleSection') ? 'flex' : 'none';

    renderTable();
  }
}

function updateActiveAiBadge() {
  const provider = localStorage.getItem('activeAi') || 'Gemini';
  const badge = document.querySelector('.ai-badge');
  if (badge) badge.innerText = provider.toUpperCase();
}

async function saveAllState() {
  await window.electronAPI.saveState(leads);
}

// Wait for the Electron preload bridge to be ready (prevents race condition on load)
function waitForElectronAPI(timeout = 3000) {
  return new Promise((resolve, reject) => {
    const interval = 60;
    let elapsed = 0;
    const check = () => {
      if (window.electronAPI && typeof window.electronAPI.loadState === 'function') {
        return resolve();
      }
      elapsed += interval;
      if (elapsed >= timeout) {
        return reject(new Error('electronAPI not available after ' + timeout + 'ms'));
      }
      setTimeout(check, interval);
    };
    check();
  });
}

async function initApp() {
  console.log("=== Renderer initializing ===");
  
  try {
    const apiKey = 'AIzaSyDUbdMujw1MdmP6rSAvGzei11_e0IHL0As';
    if (!localStorage.getItem('geminiKey')) {
      localStorage.setItem('geminiKey', apiKey);
    }
    document.getElementById('geminiKey').value = localStorage.getItem('geminiKey') || apiKey;
    document.getElementById('claudeKey').value = localStorage.getItem('claudeKey') || '';
    document.getElementById('openaiKey').value = localStorage.getItem('openaiKey') || '';
    document.getElementById('activeAi').value = localStorage.getItem('activeAi') || 'Gemini';
    
    // Bind dynamic dropdown
    document.getElementById('activeAi').onchange = updateModelDropdown;
    updateModelDropdown();

    document.getElementById('senderName').value = localStorage.getItem('senderName') || 'Aryan';
    document.getElementById('senderTitle').value = localStorage.getItem('senderTitle') || 'Partner, Labs22';
    document.getElementById('senderWebsite').value = localStorage.getItem('senderWebsite') || 'labs22.com';
    document.getElementById('enocLine').checked = localStorage.getItem('enocLine') !== 'false';
    
    // Force v6 Prompt Upgrade if old version detected
    let currentPrompt = localStorage.getItem('systemPrompt');
    if (!currentPrompt || !currentPrompt.includes('PART 0 — WEBSITE ACCESS CHECK')) {
       console.log("Old prompt version detected. Migrating to V6 Apex...");
       currentPrompt = DEFAULT_PROMPT;
       localStorage.setItem('systemPrompt', DEFAULT_PROMPT);
    }
    
    document.getElementById('systemPromptArea').value = currentPrompt;
    console.log("Settings fields populated.");
  } catch(e) { console.error("Settings init error:", e); }

  try { updateActiveAiBadge(); } catch(e) { console.error("Badge error:", e); }

  // Load saved state — wait for preload bridge first
  try {
    console.log("Loading state from disk...");
    await waitForElectronAPI();
    const savedState = await window.electronAPI.loadState();
    console.log("Raw state loaded from disk:", savedState);
    
    if (savedState && Array.isArray(savedState) && savedState.length > 0) {
      console.log(`${savedState.length} leads found in storage.`);
      leads = savedState;
      
      // Deep legacy format mapping
      leads.forEach((l, idx) => {
        // Default source for existing/legacy data
        if (!l.source) l.source = 'manual';

        if (l.analysis) {
          // 1. Map visitorReaction to expertReaction if missing
          if (!l.analysis.expertReaction && l.analysis.visitorReaction) {
            l.analysis.expertReaction = l.analysis.visitorReaction;
          }
          // 2. Map pillars to areas structure
          if ((!l.analysis.areas || Object.keys(l.analysis.areas).length === 0) && l.analysis.pillars) {
            l.analysis.areas = {
              brandClarity: l.analysis.pillars.positioning || l.analysis.pillars.brandClarity || { score: 0, finding: "" },
              trustSignals: l.analysis.pillars.trust || l.analysis.pillars.trustSignals || { score: 0, finding: "" },
              conversionPath: l.analysis.pillars.conversion || l.analysis.pillars.conversionPath || { score: 0, finding: "" }
            };
            console.log(`Mapped legacy pillars for lead ${idx}: ${l.company}`);
          }
          // 3. Map other old fields
          if (!l.analysis.gapStatement && l.analysis.painExplanation) l.analysis.gapStatement = l.analysis.painExplanation;
          if (!l.analysis.pointers && l.analysis.observations) l.analysis.pointers = l.analysis.observations;
          if (!l.analysis.specificObservation && l.analysis.specificFeature) l.analysis.specificObservation = l.analysis.specificFeature;
        }
      });
      
      switchTab('tabLeads', 'leadsSection');
      document.getElementById('importedCount').innerText = leads.length + ' leads imported';
      document.getElementById('progressText').style.display = 'block';
      updateProgressText();
      renderTable(); // Force immediate render
      console.log("Initial table render completed.");
      saveAllState(); // Save the migrated format
    } else {
      console.log("No saved leads or state is empty.");
      switchTab('tabLeads', 'leadsSection'); // Default to empty leads view
    }
  } catch (err) {
    console.error("CRITICAL: State loading failed:", err);
    switchTab('tabLeads', 'leadsSection');
  }
  
  // Tab Click Handlers
  document.getElementById('tabLeads').onclick = () => switchTab('tabLeads', 'leadsSection');
  document.getElementById('tabBatch').onclick = () => switchTab('tabBatch', 'batchSection');
  document.getElementById('tabSingle').onclick = () => switchTab('tabSingle', 'singleSection');
  
  // Big CTA button on Leads view
  document.getElementById('addLeadsCta').onclick = () => switchTab('tabBatch', 'batchSection');

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.metaKey && e.key === 'i') { 
      e.preventDefault(); 
      switchTab('tabBatch', 'batchSection'); 
    }
    if (e.metaKey && e.key === 'e') { 
      e.preventDefault(); 
      document.getElementById('exportReadyBtn').click(); 
    }
    if (e.metaKey && e.key === 'r') { 
      e.preventDefault(); 
      document.getElementById('processNextBatchBtn').click(); 
    }
    
    // Table Navigation
    if (document.getElementById('leadsSection').style.display === 'flex') {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const rows = document.querySelectorAll('#leadsTableBody tr');
        if (selectedRowIndex < rows.length - 1) {
          if (selectedRowIndex >= 0) rows[selectedRowIndex].style.background = '';
          selectedRowIndex++;
          rows[selectedRowIndex].style.background = 'rgba(255,255,255,0.05)';
          rows[selectedRowIndex].scrollIntoView({ block: 'nearest' });
        }
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const rows = document.querySelectorAll('#leadsTableBody tr');
        if (selectedRowIndex > 0) {
          rows[selectedRowIndex].style.background = '';
          selectedRowIndex--;
          rows[selectedRowIndex].style.background = 'rgba(255,255,255,0.05)';
          rows[selectedRowIndex].scrollIntoView({ block: 'nearest' });
        }
      }
      if (e.key === 'Enter') {
        const rows = document.querySelectorAll('#leadsTableBody tr');
        if (selectedRowIndex >= 0 && selectedRowIndex < rows.length) {
          rows[selectedRowIndex].ondblclick();
        }
      }
    }

    if (e.key === 'Escape') {
      const detailView = document.getElementById('leadDetailView');
      const settingsModal = document.getElementById('settingsModal');

      if (settingsModal && settingsModal.classList.contains('active')) {
        document.getElementById('closeSettingsBtn').click();
      } else if (detailView && detailView.style.display === 'flex') {
        document.getElementById('backFromDetailBtn').click();
      } else if (isProcessing) {
        document.getElementById('stopBtn').click();
      }
    }
  });
};


document.getElementById('settingsBtn').onclick = () => document.getElementById('settingsModal').classList.add('active');
document.getElementById('closeSettingsBtn').onclick = () => {
  localStorage.setItem('geminiKey', document.getElementById('geminiKey').value);
  localStorage.setItem('claudeKey', document.getElementById('claudeKey').value);
  localStorage.setItem('openaiKey', document.getElementById('openaiKey').value);
  localStorage.setItem('activeAi', document.getElementById('activeAi').value);
  localStorage.setItem('activeModel', document.getElementById('activeModel').value);
  localStorage.setItem('senderName', document.getElementById('senderName').value);
  localStorage.setItem('senderTitle', document.getElementById('senderTitle').value);
  localStorage.setItem('senderWebsite', document.getElementById('senderWebsite').value);
  localStorage.setItem('enocLine', document.getElementById('enocLine').checked);
  localStorage.setItem('systemPrompt', document.getElementById('systemPromptArea').value);
  
  updateActiveAiBadge();

  const btn = document.getElementById('closeSettingsBtn');
  btn.innerText = 'Saved!';
  setTimeout(() => {
    document.getElementById('settingsModal').classList.remove('active');
    btn.innerText = 'Save';
  }, 400);
};

document.getElementById('clearDataBtn').onclick = () => {
  if (confirm("Are you sure you want to clear all leads data?")) {
    leads = [];
    saveAllState();
    switchTab('tabLeads', 'leadsSection');
    renderTable();
    document.getElementById('settingsModal').classList.remove('active');
  }
};

document.getElementById('manualAddBtn').onclick = () => {
  console.log("Manual add triggered");
  const first = document.getElementById('manualFirstName').value.trim();
  const company = document.getElementById('manualCompany').value.trim();
  const url = document.getElementById('manualUrl').value.trim();
  const emailsInput = document.getElementById('manualEmails').value.trim();

  if (!url || !emailsInput) {
    alert("Website URL and at least one Email are required.");
    return;
  }

  const emails = emailsInput.split(',').map(e => e.trim()).filter(e => e);
  if (emails.length === 0) {
    alert("Please provide valid emails.");
    return;
  }

  console.log(`Adding ${emails.length} emails for ${company}`);
  emails.forEach(email => {
    leads.push({
      firstName: first, lastName: '',
      email: email, company: company || 'Unknown',
      websiteURL: url, industry: 'Identifying...',
      title: '', status: 'Queued', analysis: null, sequence: null,
      source: 'manual', addedAt: new Date().toISOString()
    });
  });

  console.log("Switching to leads view...");
  switchTab('tabLeads', 'leadsSection');
  
  if (document.getElementById('importedCount')) {
    document.getElementById('importedCount').innerText = `${leads.length} leads imported`;
  }
  
  updateProgressText();
  renderTable();
  saveAllState();

  // Clear inputs
  document.getElementById('manualFirstName').value = '';
  document.getElementById('manualIndustry').value = '';
  document.getElementById('manualCompany').value = '';
  document.getElementById('manualUrl').value = '';
  document.getElementById('manualEmails').value = '';
  console.log("Manual add complete and state saved.");
};

document.getElementById('dropZone').onclick = async () => {
    const csvContent = await window.electronAPI.openCSV();
    if (csvContent) {
        Papa.parse(csvContent, {
          header: true, skipEmptyLines: true,
          complete: function(results) {
            const reqCols = ['First Name', 'Last Name', 'Email', 'Company', 'Website URL', 'Industry'];
            const missing = reqCols.filter(c => !results.meta.fields.includes(c));
            if (missing.length > 0) {
               alert(`CSV missing required columns: ${missing.join(', ')}`);
               return;
            }

            const newLeads = results.data.map(row => ({
              firstName: row['First Name'] || '', lastName: row['Last Name'] || '',
              email: row['Email'] || '', company: row['Company'] || '',
              websiteURL: row['Website URL'] || '', industry: row['Industry'] || '',
              title: row['Title'] || '', status: 'Queued', analysis: null, sequence: null,
              source: 'batch', addedAt: new Date().toISOString()
            })).filter(l => l.email);
            leads.push(...newLeads);

            document.getElementById('importedCount').innerText = `${leads.length} leads imported`;
            updateProgressText();
            switchTab('tabLeads', 'leadsSection');
            saveAllState();
          }
        });
    }
};

document.getElementById('cancelDeleteBtn').onclick = () => {
  document.getElementById('deleteModal').classList.remove('active');
};

document.getElementById('confirmDeleteBtn').onclick = () => {
  if (leadToDeleteIndex > -1) {
    leads.splice(leadToDeleteIndex, 1);
    saveAllState();
    renderTable();
    updateProgressText();
    document.getElementById('deleteModal').classList.remove('active');
  }
};

let sortCol = '';
let sortAsc = true;
document.getElementById('searchInput').oninput = renderTable;

document.querySelectorAll('.sortable').forEach(th => {
  th.onclick = () => {
    const col = th.dataset.sort;
    if (sortCol === col) sortAsc = !sortAsc;
    else { sortCol = col; sortAsc = true; }
    renderTable();
  };
});

function getScoreBadge(score) {
  let c = 'red';
  if (score >= 4) c = 'green';
  else if (score >= 3) c = 'orange';
  return `<span class="score-badge score-${c}">${score}</span>`;
}

// Track which month groups are expanded
const expandedMonths = new Set();

function getMonthKey(lead) {
  if (lead.addedAt) {
    const d = new Date(lead.addedAt);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(key) {
  const [year, month] = key.split('-');
  return new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
}

function renderTable() {
  const tbody = document.getElementById('leadsTableBody');
  tbody.innerHTML = '';
  const filter = document.getElementById('statusFilter').value;
  const search = document.getElementById('searchInput').value.toLowerCase();
  
  let displayed = leads.filter((lead) => {
    if (activeTab === 'tabBatch' && lead.source !== 'batch') return false;
    if (activeTab === 'tabSingle' && lead.source !== 'manual') return false;
    if (filter !== 'All' && lead.status !== filter) return false;
    if (search) {
      if (!`${lead.firstName} ${lead.lastName} ${lead.company} ${lead.industry} ${lead.websiteURL}`.toLowerCase().includes(search)) return false;
    }
    return true;
  });

  if (sortCol) {
    displayed.sort((a, b) => {
      let va = a[sortCol] || ''; let vb = b[sortCol] || '';
      if (sortCol === 'name') { va = a.firstName+' '+a.lastName; vb = b.firstName+' '+b.lastName; }
      else if (sortCol === 'company') { va = a.company; vb = b.company; }
      else if (sortCol === 'industry') { va = a.industry; vb = b.industry; }
      else if (sortCol === 'website') { va = a.websiteURL; vb = b.websiteURL; }
      else if (sortCol === 'status') { va = a.status; vb = b.status; }
      va = va.toLowerCase(); vb = vb.toLowerCase();
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
  }

  // Group by month
  const groups = {};
  displayed.forEach(lead => {
    const key = getMonthKey(lead);
    if (!groups[key]) groups[key] = [];
    groups[key].push(lead);
  });

  // Sort groups newest first
  const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  // Auto-expand the most recent month if nothing is expanded yet
  if (expandedMonths.size === 0 && sortedKeys.length > 0) {
    expandedMonths.add(sortedKeys[0]);
  }

  sortedKeys.forEach(monthKey => {
    const monthLeads = groups[monthKey];
    const isOpen = expandedMonths.has(monthKey);
    const label = getMonthLabel(monthKey);
    const readyCount = monthLeads.filter(l => l.status === 'Ready' || l.status === 'Exported').length;
    const errorCount = monthLeads.filter(l => l.status === 'Error').length;

    // Accordion header row
    const headerRow = document.createElement('tr');
    headerRow.style.cssText = 'background: rgba(255,255,255,0.03); cursor: pointer; user-select: none;';
    headerRow.innerHTML = `
      <td colspan="8" style="padding: 10px 16px; font-size: 11px; font-family: 'SF Mono', monospace; color: var(--text-40); letter-spacing: 0.08em;">
        <span style="margin-right: 8px; display: inline-block; transition: transform 0.2s; transform: rotate(${isOpen ? '90' : '0'}deg);">▶</span>
        ${label.toUpperCase()}
        <span style="margin-left: 12px; color: var(--text-20);">${monthLeads.length} LEADS</span>
        ${readyCount > 0 ? `<span style="margin-left: 8px; color: #4ade80; font-size: 10px;">✓ ${readyCount} READY</span>` : ''}
        ${errorCount > 0 ? `<span style="margin-left: 8px; color: #f87171; font-size: 10px;">✗ ${errorCount} ERROR</span>` : ''}
      </td>`;
    headerRow.onclick = () => {
      if (expandedMonths.has(monthKey)) expandedMonths.delete(monthKey);
      else expandedMonths.add(monthKey);
      renderTable();
    };
    tbody.appendChild(headerRow);

    if (!isOpen) return;

    // Lead rows
    monthLeads.forEach((lead) => {
      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      const name = `${lead.firstName} ${lead.lastName}`.trim() || '—';
      const b = lead.analysis?.pillars?.positioning?.score;
      const t = lead.analysis?.pillars?.trust?.score;
      const c = lead.analysis?.pillars?.conversion?.score;
      const scoresHtml = b ? `${getScoreBadge(b)}${getScoreBadge(t)}${getScoreBadge(c)}` : '-';
      const sourceIcon = lead.source === 'batch' ? '📦' : '👤';
      const canProcess = lead.status === 'Queued' || lead.status === 'Error';
      const isProcessed = !canProcess && lead.status !== 'Processing';

      tr.innerHTML = `
        <td style="opacity: 0.5; padding-right: 0; text-align: center; font-size: 14px;">${sourceIcon}</td>
        <td>${name}</td>
        <td>${lead.company}</td><td>${lead.industry || '—'}</td><td>${lead.websiteURL}</td>
        <td class="status-${lead.status.toLowerCase()}"><span class="status-dot"></span>${lead.status}</td>
        <td>${scoresHtml}</td>
        <td style="white-space: nowrap; position: relative;">
          ${canProcess ? `<button class="outline-btn process-single-btn" tabindex="-1" style="padding: 4px 10px; font-size: 11px; color: #a78bfa; border-color: rgba(167,139,250,0.4);" title="Process this lead">⚡</button>` : ''}
          ${isProcessed ? `<button class="outline-btn view-btn" tabindex="-1" style="padding: 4px 10px; font-size: 11px;">View</button>` : ''}
          ${isProcessed ? `<button class="outline-btn download-btn" tabindex="-1" style="padding: 4px 10px; font-size: 11px;">CSV</button>` : ''}
          <button class="more-btn" tabindex="-1" style="background: transparent; border: 1px solid rgba(255,255,255,0.12); border-radius: 4px; cursor: pointer; opacity: 0.6; margin-left: 6px; padding: 3px 8px; color: var(--text-60); font-size: 14px; line-height: 1; transition: opacity 0.2s;" title="More options">···</button>
          <div class="more-dropdown" style="display:none; position: absolute; right: 0; top: 110%; z-index: 999; background: #1a1a1f; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); min-width: 140px; overflow: hidden;">
            <button class="dropdown-reprocess" style="display: block; width: 100%; text-align: left; padding: 10px 14px; background: transparent; border: none; color: #a78bfa; font-size: 12px; cursor: pointer; font-family: inherit; transition: background 0.15s; border-bottom: 1px solid rgba(255,255,255,0.05);">⚡ Reprocess</button>
            <button class="dropdown-delete" style="display: block; width: 100%; text-align: left; padding: 10px 14px; background: transparent; border: none; color: #f87171; font-size: 12px; cursor: pointer; font-family: inherit; transition: background 0.15s;">🗑️ Delete</button>
          </div>
        </td>`;

      if (canProcess) {
        tr.querySelector('.process-single-btn').onclick = async (e) => {
          e.stopPropagation();
          if (isProcessing) { alert('Another batch is already running. Please wait.'); return; }
          lead.status = 'Processing';
          renderTable();
          await processLead(lead);
          renderTable();
          saveAllState();
        };
      }
      if (isProcessed) {
        tr.querySelector('.view-btn').onclick = (e) => { e.stopPropagation(); openLeadDetail(lead); };
        tr.querySelector('.download-btn').onclick = (e) => { e.stopPropagation(); downloadSingleLead(lead); };
      }

      // ··· dropdown logic
      const moreBtn = tr.querySelector('.more-btn');
      const dropdown = tr.querySelector('.more-dropdown');
      moreBtn.onclick = (e) => {
        e.stopPropagation();
        // Close any other open dropdowns
        document.querySelectorAll('.more-dropdown').forEach(d => { if (d !== dropdown) d.style.display = 'none'; });
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
      };
      tr.querySelector('.dropdown-reprocess').onclick = async (e) => {
        e.stopPropagation();
        dropdown.style.display = 'none';
        if (isProcessing) { alert('Already processing another batch. Please wait.'); return; }
        lead.status = 'Processing';
        renderTable();
        await processLead(lead);
        renderTable();
        saveAllState();
      };
      tr.querySelector('.dropdown-delete').onclick = (e) => {
        e.stopPropagation();
        dropdown.style.display = 'none';
        showDeleteModal(leads.indexOf(lead));
      };
      tr.querySelector('.dropdown-reprocess').onmouseenter = (e) => { e.target.style.background = 'rgba(167,139,250,0.1)'; };
      tr.querySelector('.dropdown-reprocess').onmouseleave = (e) => { e.target.style.background = 'transparent'; };
      tr.querySelector('.dropdown-delete').onmouseenter = (e) => { e.target.style.background = 'rgba(248,113,113,0.1)'; };
      tr.querySelector('.dropdown-delete').onmouseleave = (e) => { e.target.style.background = 'transparent'; };
      moreBtn.onmouseenter = () => { moreBtn.style.opacity = '1'; };
      moreBtn.onmouseleave = () => { moreBtn.style.opacity = '0.6'; };

      tr.onclick = () => {
        document.querySelectorAll('.more-dropdown').forEach(d => d.style.display = 'none');
        document.querySelectorAll('#leadsTableBody tr').forEach(r => r.style.background = '');
        tr.style.background = 'rgba(255,255,255,0.05)';
        selectedRowIndex = Array.from(tbody.children).indexOf(tr);
      };
      tr.ondblclick = () => { if (isProcessed) openLeadDetail(lead); };
      tbody.appendChild(tr);
    });
  });
}

async function downloadSingleLead(l) {
  if (l.status === 'Queued' || l.status === 'Processing') {
    alert("Lead must be processed (Ready) before downloading emails.");
    return;
  }
  const csvRows = [
    ['First Name', 'Last Name', 'Email', 'Company', 'Website URL', 'Industry', 'email1_subject', 'email1_body', 'email2_subject', 'email2_body', 'email3_subject', 'email3_body', 'email4_subject', 'email4_body', 'score_positioning', 'score_trust', 'score_conversion', 'mostPainfulArea', 'Status'],
    [
      l.firstName, l.lastName, l.email, l.company, l.websiteURL, l.industry,
      l.sequence?.e1s || '', l.sequence?.e1b || '',
      l.sequence?.e2s || '', l.sequence?.e2b || '',
      l.sequence?.e3s || '', l.sequence?.e3b || '',
      l.sequence?.e4s || '', l.sequence?.e4b || '',
      l.analysis?.pillars?.positioning?.score || l.analysis?.areas?.brandClarity?.score || '',
      l.analysis?.pillars?.trust?.score || l.analysis?.areas?.trustSignals?.score || '',
      l.analysis?.pillars?.conversion?.score || l.analysis?.areas?.conversionPath?.score || '',
      l.analysis?.mostPainful || '',
      l.status
    ].map(v => `"${String(v).replace(/"/g, '""')}"`)
  ];
  const csvString = csvRows.map(r => r.join(',')).join('\n');
  const success = await window.electronAPI.saveCSV(csvString);
  if (success) {
    if (l.status === 'Ready') {
      l.status = 'Exported';
      renderTable();
      saveAllState();
    }
    alert('Downloaded successfully!');
  }
}
document.getElementById('statusFilter').onchange = renderTable;

let currentDetailLead = null;
let viewMode = 'scale';

function openLeadDetail(lead) {
  currentDetailLead = lead;
  document.getElementById('leadsSection').style.display = 'none';
  document.getElementById('leadDetailView').style.display = 'flex';
  
  document.getElementById('detailCompany').innerText = lead.company || 'Unknown';
  document.getElementById('detailName').innerText = `${lead.firstName} ${lead.lastName}`.trim() || 'No Name';
  document.getElementById('detailEmail').innerText = lead.email;
  document.getElementById('detailIndustry').innerText = lead.industry || 'Unknown';
  
  const sb = document.getElementById('detailStatusBadge');
  sb.className = `status-${lead.status.toLowerCase()}`;
  document.getElementById('detailStatusText').innerText = lead.status;
  
  document.getElementById('openWebsiteBtn').onclick = () => {
    const url = lead.websiteURL.startsWith('http') ? lead.websiteURL : 'https://' + lead.websiteURL;
    window.electronAPI.openExternal(url);
  };
  
  if (lead.analysis) {
    document.getElementById('detailReaction').innerText = lead.analysis.visitorReaction || lead.analysis.expertReaction || '';
    
    const b = lead.analysis.pillars?.positioning || lead.analysis.areas?.brandClarity;
    document.getElementById('scoreBrand').innerText = b?.score || '-';
    document.getElementById('scoreBrand').style.color = b?.score <= 2 ? '#EF4444' : (b?.score == 3 ? '#EAB308' : '#22C55E');
    document.getElementById('findingBrand').innerText = b?.reason || b?.finding || '';

    const t = lead.analysis.pillars?.trust || lead.analysis.areas?.trustSignals || lead.analysis.areas?.trust;
    document.getElementById('scoreTrust').innerText = t?.score || '-';
    document.getElementById('scoreTrust').style.color = t?.score <= 2 ? '#EF4444' : (t?.score == 3 ? '#EAB308' : '#22C55E');
    document.getElementById('findingTrust').innerText = t?.reason || t?.finding || '';

    const c = lead.analysis.pillars?.conversion || lead.analysis.areas?.conversionPath || lead.analysis.areas?.conversion;
    document.getElementById('scoreConversion').innerText = c?.score || '-';
    document.getElementById('scoreConversion').style.color = c?.score <= 2 ? '#EF4444' : (c?.score == 3 ? '#EAB308' : '#22C55E');
    document.getElementById('findingConversion').innerText = c?.reason || c?.finding || '';

    let gapName = lead.analysis.mostPainful || '';
    if (gapName === 'brandClarity' || gapName === 'positioning') gapName = 'POSITIONING';
    else if (gapName === 'trustSignals' || gapName === 'trust') gapName = 'TRUST SIGNALS';
    else gapName = 'CONVERSION PATH';
    
    document.getElementById('gapLabel').innerText = `GAP STATEMENT — ${gapName}`;
    document.getElementById('detailGap').innerText = lead.analysis.gapStatement || lead.analysis.specific_observation || lead.analysis.specificObservation || '';

    const ptrCont = document.getElementById('detailPointers');
    ptrCont.innerHTML = '';
    const pointers = lead.analysis.pointers || lead.analysis.observations;
    if (pointers) {
      pointers.forEach(p => {
        const div = document.createElement('div');
        div.className = 'pointer-item';
        div.innerText = p;
        ptrCont.appendChild(div);
      });
    }
  } else {
    document.getElementById('detailReaction').innerText = 'No analysis yet.';
    ['scoreBrand','findingBrand','scoreTrust','findingTrust','scoreConversion','findingConversion','detailGap'].forEach(id => document.getElementById(id).innerText = '-');
    document.getElementById('detailPointers').innerHTML = '';
  }
  
  renderEmails();
}

function renderEmails() {
  const container = document.getElementById('emailCards');
  container.innerHTML = '';
  if (!currentDetailLead || !currentDetailLead.sequence) return;
  
  const seq = currentDetailLead.sequence;
  const emails = [];
  if (seq.e1s) emails.push({ num: 1, day: 'Day 1 — Pattern interrupt', s: seq.e1s, b: seq.e1b });
  if (seq.e2s) emails.push({ num: 2, day: 'Day 5 — Quick pointers', s: seq.e2s, b: seq.e2b });
  if (viewMode === 'vip') {
    if (seq.e3s) emails.push({ num: 3, day: 'Day 13 — Credibility nudge', s: seq.e3s, b: seq.e3b });
    if (seq.e4s) emails.push({ num: 4, day: 'Day 20 — Close the loop', s: seq.e4s, b: seq.e4b });
  }
  
  emails.forEach(e => {
    const card = document.createElement('div');
    card.className = 'email-card';
    card.innerHTML = `
      <div class="email-header">
        <div style="display: flex; gap: 8px; align-items: center;">
          <div style="background: var(--text-40); color: var(--bg); font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">EMAIL ${e.num}</div>
          <div style="font-size: 12px; color: var(--text-70);">${e.day}</div>
        </div>
        <button class="outline-btn copy-btn" style="padding: 4px 8px; font-size: 11px;">Copy</button>
      </div>
      <div class="email-body">
        <div style="font-size: 10px; color: var(--text-40); margin-bottom: 4px; font-family: monospace;">SUBJECT</div>
        <div style="margin-bottom: 16px; font-weight: 500;">${e.s}</div>
        <div>${e.b.replace(/\\n/g, '<br>')}</div>
      </div>
    `;
    card.querySelector('.copy-btn').onclick = (evt) => {
      navigator.clipboard.writeText(`Subject: ${e.s}\\n\\n${e.b.replace(/\\n/g, '\\n')}`);
      const btn = evt.target;
      btn.innerText = 'Copied!';
      setTimeout(() => btn.innerText = 'Copy', 1500);
    };
    container.appendChild(card);
  });
}

document.getElementById('backFromDetailBtn').onclick = () => {
  document.getElementById('leadDetailView').style.display = 'none';
  document.getElementById('leadsSection').style.display = 'flex';
};
document.getElementById('tabAnalysis').onclick = () => {
  document.querySelectorAll('.tab').forEach(t => { t.classList.remove('active'); t.style.color = 'var(--text-70)'; t.style.borderBottom = 'none'; });
  document.getElementById('tabAnalysis').classList.add('active');
  document.getElementById('tabAnalysis').style.color = 'var(--accent)';
  document.getElementById('tabAnalysis').style.borderBottom = '2px solid var(--accent)';
  document.getElementById('analysisContent').style.display = 'block';
  document.getElementById('emailsContent').style.display = 'none';
};
document.getElementById('tabEmails').onclick = () => {
  document.querySelectorAll('.tab').forEach(t => { t.classList.remove('active'); t.style.color = 'var(--text-70)'; t.style.borderBottom = 'none'; });
  document.getElementById('tabEmails').classList.add('active');
  document.getElementById('tabEmails').style.color = 'var(--accent)';
  document.getElementById('tabEmails').style.borderBottom = '2px solid var(--accent)';
  document.getElementById('emailsContent').style.display = 'block';
  document.getElementById('analysisContent').style.display = 'none';
};
document.getElementById('modeScale').onclick = () => {
  viewMode = 'scale';
  document.getElementById('modeScale').style.background = 'var(--accent)';
  document.getElementById('modeScale').style.color = 'var(--bg)';
  document.getElementById('modeVip').style.background = 'transparent';
  document.getElementById('modeVip').style.color = 'var(--text-70)';
  renderEmails();
};
document.getElementById('modeVip').onclick = () => {
  viewMode = 'vip';
  document.getElementById('modeVip').style.background = 'var(--accent)';
  document.getElementById('modeVip').style.color = 'var(--bg)';
  document.getElementById('modeScale').style.background = 'transparent';
  document.getElementById('modeScale').style.color = 'var(--text-70)';
  renderEmails();
};

function updateProgressText() {
  const queuedCount = leads.filter(l => l.status === 'Queued' || l.status === 'Error').length;
  const processedCount = leads.filter(l => l.status === 'Ready' || l.status === 'Exported').length;
  document.getElementById('progressText').innerText = `${processedCount}/${leads.length} processed | ${queuedCount} remaining`;
}

document.getElementById('processNextBatchBtn').onclick = async () => {
  if (isProcessing) return;
  isProcessing = true;
  cancelProcessing = false;
  
  let batchSize = parseInt(document.getElementById('batchSizeInput').value, 10);
  if (isNaN(batchSize) || batchSize <= 0) batchSize = 150;

  const pending = leads.filter(l => l.status === 'Queued' || l.status === 'Error');
  const batch = pending.slice(0, batchSize);
  
  if (batch.length === 0) {
    isProcessing = false;
    alert("No leads found in Queued or Error status to process.");
    return;
  }

  const stopBtn = document.getElementById('stopBtn');
  stopBtn.innerText = "STOP PROCESSING";
  stopBtn.disabled = false;
  stopBtn.style.display = 'inline-flex';
  
  document.getElementById('exportReadyBtn').disabled = true;
  document.getElementById('processNextBatchBtn').disabled = true;
  document.getElementById('progressText').style.display = 'inline-block';
  updateProgressText();
  console.log(">>> STOP BUTTON DEPLOYED");
  
  for (let i = 0; i < batch.length; i++) {
    if (cancelProcessing) break;
    batch[i].status = 'Processing'; 
    renderTable();
    await processLead(batch[i]);
    if (cancelProcessing) break;
    updateProgressText();
    renderTable();
    saveAllState();
    if (i < batch.length - 1) {
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  
  isProcessing = false;
  document.getElementById('stopBtn').style.display = 'none';
  document.getElementById('exportReadyBtn').disabled = false;
  document.getElementById('processNextBatchBtn').disabled = false;
  if (cancelProcessing) {
    document.getElementById('progressText').innerText = "Processing stopped by user.";
  }
};

document.getElementById('stopBtn').onclick = () => {
    cancelProcessing = true;
    document.getElementById('stopBtn').innerText = "Stopping...";
    document.getElementById('stopBtn').disabled = true;
};

async function callAIGeneric(text, provider) {
  const sysPrompt = localStorage.getItem('systemPrompt') || DEFAULT_PROMPT;
  let maxRetries = 1;

  while(maxRetries >= 0) {
    try {
      let response;
      const customModel = localStorage.getItem('activeModel')?.trim();

      if (provider === 'Claude') {
        const key = localStorage.getItem('claudeKey');
        const modelId = customModel || 'claude-sonnet-4-6';
        response = await window.electronAPI.aiCall({
          url: 'https://api.anthropic.com/v1/messages',
          method: 'POST',
          headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
          body: {
            model: modelId, max_tokens: 4096, system: sysPrompt,
            messages: [{ role: 'user', content: `Analyze this website content:\n\n${text}` }]
          }
        });
      } else if (provider === 'OpenAI') {
        const key = localStorage.getItem('openaiKey');
        const modelId = customModel || 'gpt-4o-mini';
        response = await window.electronAPI.aiCall({
          url: 'https://api.openai.com/v1/chat/completions',
          method: 'POST',
          headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: {
            model: modelId, temperature: 0.3, max_tokens: 4096,
            messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: `Analyze this website content:\n\n${text}` }]
          }
        });
      } else {
        const key = localStorage.getItem('geminiKey');
        const modelId = customModel || 'gemini-3-flash-preview';
        const schema = {
          type: "OBJECT",
          properties: {
            siteLoaded: { type: "BOOLEAN" },
            visitorReaction: { type: "STRING" },
            pillars: {
              type: "OBJECT",
              properties: {
                positioning: { type: "OBJECT", properties: { score: { type: "INTEGER" }, reason: { type: "STRING" } } },
                trust: { type: "OBJECT", properties: { score: { type: "INTEGER" }, reason: { type: "STRING" } } },
                conversion: { type: "OBJECT", properties: { score: { type: "INTEGER" }, reason: { type: "STRING" } } }
              }
            },
            mostPainful: { type: "STRING" },
            allGood: { type: "BOOLEAN" },
            specific_observation: { type: "STRING" },
            opening_line: { type: "STRING" },
            industry: { type: "STRING" },
            pointers: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["siteLoaded"]
        };
        response = await window.electronAPI.aiCall({
          url: `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${key}`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: {
            contents: [{ parts: [{ text: `${sysPrompt}\n\nAnalyze this website content:\n\n${text}` }] }],
            generationConfig: { temperature: 0.3, responseMimeType: "application/json", responseSchema: schema, maxOutputTokens: 4096 }
          }
        });
      }

      if (!response.ok) {
        throw new Error(response.data?.error?.message || response.error || `AI API Error ${response.status}`);
      }

      let aiText = '';
      if (provider === 'Claude') {
        aiText = response.data.content[0].text;
        console.log('>>> Claude Stop Reason:', response.data.stop_reason);
      } else if (provider === 'OpenAI') {
        aiText = response.data.choices[0].message.content;
      } else {
        aiText = response.data.candidates[0].content.parts[0].text;
        console.log('>>> Gemini Finish Reason:', response.data.candidates[0].finishReason);
      }

      console.log('>>> RAW AI Text (Full):', aiText);
      console.log('>>> AI Text Length:', aiText.length);

      const cleanText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanText.substring(cleanText.indexOf('{'), cleanText.lastIndexOf('}') + 1));

    } catch (e) {
      console.warn('AI call failed, retrying...', e);
      if (maxRetries === 0) throw e;
      maxRetries--;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

async function processLead(lead) {
  console.log('>>> processLead START', lead.company, lead.email, lead.websiteURL);
  if (!lead.email || !lead.websiteURL) {
    lead.status = 'Error';
    lead.analysis = { visitorReaction: "ERROR: Missing email or website URL." };
    renderTable();
    return;
  }
  
  let provider = localStorage.getItem('activeAi') || 'Gemini';
  try {
    console.log('>>> Scraping:', lead.websiteURL);
    let scrapedText = await window.electronAPI.scrapeWebsite(lead.websiteURL);
    if (cancelProcessing) return; // Mid-scrape interrupt

    if (!scrapedText || scrapedText.trim() === '') {
       generateSiteDownSequence(lead);
       lead.status = 'Ready';
       return;
    }

    console.log('>>> Calling AI:', provider);
    const data = await callAIGeneric(scrapedText, provider);
    
    // --- ROBUST FIELD NORMALIZATION ---
    // Mapping: Map alternatives to expected canonical names if expected is missing
    const mapping = {
      'siteAnalyzed': 'siteLoaded',
      'keyAction': 'key_action',
      'specificFeature': 'specific_feature',
      'visitor_reaction': 'visitorReaction',
      'most_painful': 'mostPainful',
      'all_good': 'allGood'
    };
    
    for (const [alt, canonical] of Object.entries(mapping)) {
      if (data[alt] !== undefined && data[canonical] === undefined) {
        data[canonical] = data[alt];
      }
    }

    // Advanced Observation Mapping (Ordered Priority)
    if (!data.specific_observation) {
      if (data.specificObservation) data.specific_observation = data.specificObservation;
      else if (data.observation) data.specific_observation = data.observation;
      else if (Array.isArray(data.observations) && data.observations.length > 0) {
        data.specific_observation = data.observations[0];
      }
    }

    // Advanced Pointers Mapping
    if (!data.pointers) {
      if (Array.isArray(data.observations)) data.pointers = data.observations;
      else if (Array.isArray(data.specific_observations)) data.pointers = data.specific_observations;
    }
    
    // Final defensive fallbacks
    if (data.siteLoaded === undefined) data.siteLoaded = true;
    if (!data.specific_observation) data.specific_observation = '';
    if (!data.visitorReaction) data.visitorReaction = data.expertReaction || '';
    if (!data.industry) data.industry = data.type || 'Unknown';
    
    // opening_line normalization — check all possible variants
    if (!data.opening_line) {
      if (data.openingLine) data.opening_line = data.openingLine;
      else if (data.opening) data.opening_line = data.opening;
    }
    
    console.log('>>> opening_line value:', data.opening_line);
    console.log('>>> industry value:', data.industry);

    // Fail-safe formatting cleanup
    if (data.specific_feature) data.specific_feature = data.specific_feature.replace(/\.$/, '').trim();
    if (data.key_action) data.key_action = data.key_action.replace(/\.$/, '').trim();

    console.log('>>> NORMALIZED response:', JSON.stringify(data));
    
    const obs = data?.specific_observation;
    const ptrs = data?.pointers;
    const pScore = data?.pillars?.positioning?.score;
    const tScore = data?.pillars?.trust?.score;
    const cScore = data?.pillars?.conversion?.score;

    const hasObs = obs && obs.length > 5;
    const hasPtrs = ptrs && Array.isArray(ptrs) && ptrs.length >= 2;
    const hasScores = typeof pScore === 'number' && typeof tScore === 'number' && typeof cScore === 'number';

    const isValid = hasObs && hasPtrs && hasScores;
    console.log('>>> Validation Check:', { hasObs, hasPtrs, hasScores, isValid });

    if (!isValid) {
      const why = !hasObs ? 'Missing Observation' : (!hasPtrs ? 'Missing Pointers' : 'Missing Pillar Scores');
      lead.status = 'Error';
      lead.analysis = data || {};
      lead.analysis.visitorReaction = `AI response was incomplete (${why}).`;
      console.log('>>> FAIL: validation failed -', why);
      return;
    }
    
    if (data.industry && data.industry.length > 2) {
      lead.industry = data.industry;
    }
    
    lead.analysis = data;

    if (data.allGood) generateSoftSequence(lead);
    else generateScaleSequence(lead, data);

    const emailBody = lead.sequence?.e1b || '';
    if (emailBody.includes('undefined') || emailBody.includes('Hi ,')) {
      lead.status = 'Error';
      lead.analysis.visitorReaction = "Final validation failed: Email contains placeholders.";
      console.log('>>> FAIL: final email check failed');
    } else {
      lead.status = 'Ready';
      console.log('>>> SUCCESS: Lead is Ready!');
    }
  } catch (e) {
    console.error('>>> CATCH ERROR:', e);
    lead.status = 'Error';
    lead.analysis = { expertReaction: `Error: ${e.message}` };
  }
}

function getSenderVars() {
  return {
    name: localStorage.getItem('senderName') || 'Aryan',
    title: localStorage.getItem('senderTitle') || 'Partner, Labs22',
    web: localStorage.getItem('senderWebsite') || 'labs22.com'
  };
}

function generateScaleSequence(lead, analysis) {
  const p1 = analysis.pointers[0];
  const p2 = analysis.pointers[1];
  const p3 = analysis.pointers[2];
  const s = getSenderVars();
  const obs = analysis.specific_observation;
  const aiIndustry = (analysis.industry && analysis.industry !== 'Unknown' && analysis.industry !== 'Identifying...') ? analysis.industry : 'your industry';
  const companyName = lead.company ? lead.company.charAt(0).toUpperCase() + lead.company.slice(1) : lead.company;
  const opening = analysis.opening_line || `I came across ${companyName} while looking at ${aiIndustry} firms in the UAE and noticed your website.`;
  const firstName = lead.firstName?.trim() || "there";
  
  lead.sequence = {
     e1s: `Quick observation on ${companyName}'s website`,
     e1b: `Hi ${firstName},\n\n${opening}\n\nI might be wrong, but ${obs}. Small UX tweaks here often lift enquiries without changing traffic.\n\nOut of curiosity, is improving the website experience part of your roadmap this year?\n\nOpen to that?\n\n— ${s.name}\n${s.title}\n${s.web}`,
     e2s: `Quick notes on your website`,
     e2b: `Hi ${firstName},\n\nI took a closer look at your website and noted a couple of small UX opportunities that could impact enquiries:\n\n• ${p1}\n\n• ${p2}\n\n${p3 ? '• ' + p3 : ''}\n\nThese are usually quick fixes but can influence how easily visitors take action.\n\nWe help teams refine UX so their website converts more of the visitors they already have.\n\nThought I'd share in case helpful.\n\n— ${s.name}\n${s.title}\n${s.web}`,
     e3s: `Re: quick notes`, 
     e3b: `Hi ${firstName},\n\nJust nudging this in case it got buried.\n\nWe spend most of our time refining UX and brand experiences so websites convert and build trust more effectively. We've done this work with ENOC and Visa UAE as part of their digital transformation efforts.\n\nIf this is ever on your roadmap, happy to exchange notes.\n\n— ${s.name}`, 
     e4s: `Should I close the loop?`, 
     e4b: `Hi ${firstName},\n\nI haven't heard back, so I wasn't sure if this is relevant right now.\n\nIf website improvements aren't a focus at the moment, no problem at all.\n\nLet me know if I should close the loop for now.\n\n— ${s.name}`
  };
}

function generateSoftSequence(lead) {
  const s = getSenderVars();
  const analysis = lead.analysis || {};
  
  // Bugfix: Consistency in Soft Sequence too
  const industry = (analysis.industry && !['Unknown', 'Identifying...', 'top-tier'].includes(analysis.industry)) 
    ? analysis.industry 
    : (lead.industry && !['Unknown', 'Identifying...'].includes(lead.industry) ? lead.industry : "your industry");

  const companyName = lead.company ? lead.company.charAt(0).toUpperCase() + lead.company.slice(1) : lead.company;
  const opening = analysis.opening_line || `I came across ${companyName} while looking at ${industry} brands in the UAE. Your site is cleaner than most in your space, which is rare.`;
  const firstName = lead.firstName?.trim() || "there";

  lead.sequence = {
     e1s: `Quick note on ${lead.company}'s brand`,
     e1b: `Hi ${firstName},\n\n${opening}\n\nWe specialize in brand identity and UX — recent work includes ENOC and Visa UAE. Your site is cleaner than most in your space, which is rare.\n\nOne thing I've noticed working with companies at your level: the gap between a good website and one that actively builds trust and drives action is usually just 3-4 targeted changes. Not a redesign — a refinement.\n\nIf that's ever useful to explore, happy to share what we'd look at. No obligation.\n\n— ${s.name}\n${s.title}\n${s.web}`,
     e2s: `Re: ${lead.company}'s brand`,
     e2b: `Hi ${firstName},\n\nFollowing up on my note.\n\nWe focus on three things: positioning, trust, and conversions — making sure the right visitors quickly understand what you do, feel confident engaging, and take the next step.\n\nFor companies with a solid foundation like yours, small refinements in these areas tend to have an outsized impact on enquiries.\n\nIf this is ever relevant, happy to chat. If not, no worries at all.\n\n— ${s.name}\n${s.title}\n${s.web}`,
     e3s: `Re: quick notes`, 
     e3b: `Hi ${firstName},\n\nJust nudging this in case it got buried.\n\nWe spend most of our time refining UX and brand experiences so websites convert and build trust more effectively. We've done this work with ENOC and Visa UAE as part of their digital transformation efforts.\n\nIf this is ever on your roadmap, happy to exchange notes.\n\n— ${s.name}`, 
     e4s: `Should I close the loop?`, 
     e4b: `Hi ${firstName},\n\nI haven't heard back, so I wasn't sure if this is relevant right now.\n\nIf website improvements aren't a focus at the moment, no problem at all.\n\nLet me know if I should close the loop for now.\n\n— ${s.name}`
  };
}

function generateSiteDownSequence(lead) {
  const s = getSenderVars();
  const firstName = lead.firstName?.trim() || "there";

  lead.sequence = {
     e1s: `Quick note — your website isn't loading`,
     e1b: `Hi ${firstName},\n\nI tried opening your website today, but it wouldn't load.\n\nWhen a site is unreachable, most visitors don't retry — they leave. You lose attention and enquiries before your work even gets seen.\n\nAt Labs22, we focus on three things: positioning, trust, and conversions — so the right visitors quickly understand what you do, feel confident engaging, and take the next step.\n\nOut of curiosity — if improving the website experience is on your roadmap this year, is this something you're already aware of / working on?\n\n— ${s.name}\n${s.title}\n${s.web}`,
     e2s: `Re: ${lead.company}'s website`,
     e2b: `Hi ${firstName},\n\nFollowing up on my note regarding your site being down today.\n\nIf you're already on top of it, please disregard. But if you're looking for a partner to help improve the digital experience and brand perception of ${lead.company}, I'd love to chat.\n\n— ${s.name}\n${s.title}\n${s.web}`,
     e3s: `Re: quick notes`, 
     e3b: `Hi ${firstName},\n\nJust nudging this in case it got buried.\n\nWe spend most of our time refining UX and brand experiences so websites convert and build trust more effectively. We've done this work with ENOC and Visa UAE as part of their digital transformation efforts.\n\nIf this is ever on your roadmap, happy to exchange notes.\n\n— ${s.name}`, 
     e4s: `Should I close the loop?`, 
     e4b: `Hi ${firstName},\n\nI haven't heard back, so I wasn't sure if this is relevant right now.\n\nIf website improvements aren't a focus at the moment, no problem at all.\n\nLet me know if I should close the loop for now.\n\n— ${s.name}`
  };
}

document.getElementById('exportReadyBtn').onclick = async () => {
  const readyLeads = leads.filter(l => l.status === 'Ready');
  if (readyLeads.length === 0) {
    alert('No Ready leads to export.');
    return;
  }
  
  const csvRows = [
    ['First Name', 'Last Name', 'Email', 'Company', 'Website URL', 'Industry', 'email1_subject', 'email1_body', 'email2_subject', 'email2_body', 'email3_subject', 'email3_body', 'email4_subject', 'email4_body', 'score_positioning', 'score_trust', 'score_conversion', 'mostPainfulArea', 'Status']
  ];
  for (const l of readyLeads) {
    csvRows.push([
      l.firstName, l.lastName, l.email, l.company, l.websiteURL, l.industry,
      l.sequence?.e1s || '', l.sequence?.e1b || '',
      l.sequence?.e2s || '', l.sequence?.e2b || '',
      l.sequence?.e3s || '', l.sequence?.e3b || '',
      l.sequence?.e4s || '', l.sequence?.e4b || '',
      l.analysis?.pillars?.positioning?.score || l.analysis?.areas?.brandClarity?.score || l.analysis?.areas?.positioning?.score || '',
      l.analysis?.pillars?.trust?.score || l.analysis?.areas?.trustSignals?.score || l.analysis?.areas?.trust?.score || '',
      l.analysis?.pillars?.conversion?.score || l.analysis?.areas?.conversionPath?.score || l.analysis?.areas?.conversion?.score || '',
      l.analysis?.mostPainful || '',
      l.status
    ].map(v => `"${String(v).replace(/"/g, '""')}"`));
  }
  const csvString = csvRows.map(r => r.join(',')).join('\n');
  const success = await window.electronAPI.saveCSV(csvString);
  if (success) {
    readyLeads.forEach(l => l.status = 'Exported');
    renderTable();
    saveAllState();
    alert('Exported successfully!');
  }
};

// Boot the app — use both events for maximum Electron compatibility
let _appStarted = false;
function startApp() {
  if (_appStarted) return;
  _appStarted = true;
  initApp().catch(err => console.error('initApp failed:', err));
}
// Close any open ··· dropdowns when clicking outside
document.addEventListener('click', () => {
  document.querySelectorAll('.more-dropdown').forEach(d => d.style.display = 'none');
});

document.addEventListener('DOMContentLoaded', startApp);
window.addEventListener('load', startApp);
