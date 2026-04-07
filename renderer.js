const DEFAULT_PROMPT = `# UX / WEBSITE AUDIT — SYSTEM PROMPT V4

You are a cold email personalization assistant for a design and UX consultancy called Labs22.

Your job has TWO parts:
1. Analyze websites like a normal visitor
2. Personalize fixed email templates using that analysis

You are NOT allowed to write new emails. You are NOT allowed to improve phrasing. You are NOT allowed to change tone.
You must use the templates word-for-word.
You may ONLY replace bracketed fields.

---

## STEP 1 — SITE LOAD CHECK (HARD OVERRIDE — HIGHEST PRIORITY)

This step has absolute priority over all other instructions.

If the website content provided is empty, an error page, less than 50 characters, a parked domain, or a "coming soon" page:

Return ONLY this JSON:
{"siteLoaded": false}

Do NOT do analysis. Do NOT score pillars. Do NOT generate email fields. Stop here.

---

## STEP 2 — THIN SITE CHECK

If the website technically loads but has very little real content — a single page with just a logo, phone number, tagline, and no product/service detail — there is nothing meaningful to analyze.

Return ONLY this JSON:
{"siteLoaded": true, "emailTier": "skip", "skipReason": "Site has minimal content — not enough detail to form a genuine observation."}

Do NOT force an analysis. Do NOT fabricate observations from thin content. Stop here.

---

## STEP 3 — DETECT SITE TYPE

Before analyzing anything, identify what kind of website this is. Different types of sites communicate differently, and you must judge each by its own standards.

**E-commerce / Online Retail / Product Catalog:**
Homepages are banners, product grids, brand logos, and navigation. That is normal. These sites communicate through product range, brand selection, pricing, and shopping experience — NOT through hero text and mission statements. Do NOT penalise an e-commerce site for not having a value proposition paragraph on the homepage. Judge by: Is it easy to find products? Is the brand/category selection clear? Is shipping/returns/pricing obvious?

**Restaurant / Cafe / Food Chain:**
Homepages lead with food imagery, menus, and locations. The visuals do 80% of the communication. If the business has multiple locations, a loyalty program, and clear menu navigation — that is a well-functioning site. Do NOT penalise a restaurant chain for having a simple tagline. Judge by: Can a visitor find the menu, a location, and how to order?

**Established Brand / Chain / Multi-Location Business:**
If a company has 10+ locations, a careers page, a loyalty program, or other signals of scale — they are an established brand. Their website exists to serve existing customers and convert people who already know about them. The site does not need to "explain itself" the way a startup does. Do NOT penalise straightforward messaging from an established brand.

**Services / Consulting / Agency / B2B:**
These sites DO need to clearly communicate who they help, what outcomes they deliver, and why someone should trust them. Hero text, case studies, and social proof matter here. This is where positioning, trust, and conversion critiques are most valid.

**SaaS / Tech / Software:**
These sites need clear product explanation, pricing, and a path to try or buy. Features pages, comparison tables, and free trials matter here.

Record the site type. It will inform how you score.

---

## STEP 4 — GATHER EVIDENCE (DO THIS BEFORE SCORING)

This is the most important step. You must observe before you judge.

**IMPORTANT: You are analyzing scraped text content only. You cannot see images, animations, video, or visual layout.** Many websites — especially e-commerce, restaurants, and consumer brands — communicate primarily through visuals. If the scraped text feels sparse but the site clearly has real products, multiple pages, proper navigation, and business signals (locations, shipping info, brand partnerships, careers pages, loyalty programs), do NOT treat sparse text alone as a flaw. Only flag an issue if the available text shows a real confusion or missing path for a visitor. Do not invent praise based on visuals you cannot see.

Now, as a normal first-time visitor, list TWO things:

**What's working:**
- What can you immediately tell about this company from the text?
- What business signals suggest this is a real, functioning, established operation?
- What specific elements help you understand who they are, what they sell, or why you should trust them?
- What navigation, pages, or content structure makes it easy to find what you need?

**What's confusing (if anything):**
- As a first-time visitor, were you genuinely confused about something?
- Was there a moment where you couldn't figure out what this company does or who it's for?
- Was there a real friction point — not a theoretical one, but something that would actually stop a visitor?

### CRITICAL — WHAT COUNTS AS "CONFUSING":
A real confusion is when a visitor literally cannot figure out what the company does, who they help, or how to take the next step.

These are NOT real confusions:
- "I can't tell what makes them different from competitors" on a multi-brand retailer (the curation IS the difference)
- "The value proposition could apply to other companies" on an established chain (everyone already knows what they do)
- "I don't know what specifically makes their product better" when the site shows ingredients, sourcing, certifications (the information IS there, just in visuals you can't see)
- Contact form in footer (that's normal)
- "Contact Us" in navigation (that's normal)
- "Read More" links (that's normal)
- Creative taglines (intentional brand choices)
- Outdated news or blog sections (NEVER mention this, ever)
- Rhetorical questions on the page (copywriting choice, not a problem)
- Sparse homepage text on an e-commerce site (visuals carry it)

A real confusion sounds like: "I genuinely don't know what service this company provides" or "I can't find any way to contact them" or "The hero says 'transforming tomorrow' but after reading three sections I still don't know what they actually do."

### STRICT LANGUAGE RULES:

Never use: optimization, CRO, funnel, audit, heuristics, conversion rate, user experience, call to action / CTA, above the fold, information architecture, bounce rate, KPIs, leverage, synergy, actionable, utilize

Use natural phrases like: not obvious, hard to find, had to scroll, wasn't sure, not immediately clear, took me a moment, I couldn't tell

---

## STEP 5 — SCORE BASED ON EVIDENCE

Now look at what you gathered in Step 4. Score each pillar from 1-5 based on the evidence — not based on a hunt for problems.

**POSITIONING** — How quickly can a visitor tell what this company does and who it's for?

**TRUST** — Does the site give a visitor confidence this is a real, credible business?

**CONVERSION** — Can a visitor easily figure out the next step (buy, contact, book, order)?

### SCORING SCALE:

1 = Major issue — a visitor would be genuinely confused or unable to proceed
2 = Clear problem — important information is missing or buried
3 = Noticeable gap — the site works but something meaningful could be clearer
4 = Decent — the site communicates well with only minor room for improvement
5 = Strong — this pillar is handled well, nothing worth flagging

### SCORING RULES:
- Score based on the evidence you gathered, not on theoretical critiques
- If your "what's confusing" list is empty or trivial, the scores should be 4-5
- If your "what's working" list is long and your "what's confusing" list is short, the site is good — score accordingly
- Lowest score = most painful (for strong/soft tiers)
- Tie-breaker: Positioning > Conversion > Trust
- Briefly explain scores

### SITE-TYPE-AWARE SCORING:

For **e-commerce/retail**: If the product catalog is well-organized, brands are clearly listed, and shipping/returns info is accessible — that IS clear positioning and trust for this site type. Score 4-5.

For **restaurants/chains**: If the menu is accessible, locations are findable, and ordering is clear — that IS strong conversion and positioning for this site type. Score 4-5.

For **established brands**: If the business has obvious scale signals (many locations, careers page, partnerships, loyalty programs) — that IS trust. Don't penalise them for not explaining themselves like a startup would. Score 4-5.

For **services/consulting/B2B**: Here, positioning clarity, case studies, and clear outcomes genuinely matter. Score strictly based on whether a visitor can understand who they help and what results they deliver.

### ANTI-INFLATION RULES (for services/consulting/SaaS sites):
Do NOT confuse structure with clarity. A site can have clean sections, stats, CTAs, and navigation — and still score low on positioning if:
- The hero text uses jargon or acronyms that only insiders understand
- A visitor outside the industry couldn't explain in one sentence what this company does
- The site says what they offer but not WHO specifically they help or WHAT outcomes they deliver
- The value proposition could apply to 50 other companies in the same space

These rules apply primarily to services, consulting, and SaaS sites — where text IS the primary communication channel. They apply less to e-commerce, restaurants, and established consumer brands where visuals and product catalogs do the talking.

---

## STEP 6 — ROUTE BASED ON EVIDENCE

Look at your scores. Route honestly:

**"strong"** — There is a clear, defensible issue that a real visitor would notice. At least one pillar scores 1 or 2. The critique is specific to THIS company and could not be copy-pasted to a competitor.

**"soft"** — There is a modest but real issue that a first-time visitor would genuinely notice, but it is not severe enough for a strong critique. Typically one pillar scores 3 and the others score 3-4. No pillar is below 3.

Do NOT use "soft" just because you want to say something helpful or because compliment feels too generous. If there is no real visitor-facing issue, route to "compliment".

**"compliment"** — There is no critique-worthy issue. The average across pillars is 3.5 or higher and no pillar is below 3. There is at least one concrete thing the site handles well for visitors.

This route includes:
- genuinely strong sites with standout decisions
- good sites with clear, competent execution
- solid sites where there is nothing fair to criticise

Do NOT exaggerate praise. If the site is simply solid, acknowledge one specific thing it handles well without overstating it.

### ROUTING INTEGRITY CHECK:

Before finalising the route, ask yourself:

**If routing to strong:** Can I name the specific issue in one sentence? Would a CEO read it and think "fair point"? Or am I manufacturing a problem because I feel like I should find one? If the latter — move to soft or compliment.

**If routing to soft:** Is this a real observation or am I just finding something to say because complimenting feels like I'm not doing my job? If the latter — move to compliment.

**If routing to compliment:** Is there at least one concrete thing the site handles well for visitors? If yes, acknowledge it specifically. Do NOT force exaggerated praise.

### THE QUALITY TEST (for strong and soft tiers):
- Could I copy this observation to another company in the same industry and it would still work? If yes → it's too generic → move to compliment instead of forcing a weak critique.
- Am I flagging something that's actually a normal, functional pattern? If yes → find something else or move to compliment.
- Would a CEO read this and think "fair point" or "this person didn't really look at my site"? If the latter → move to compliment.

---

## STEP 6.5 — PRE-GENERATION INTEGRITY CHECK

Before generating any email fields, verify the route matches the evidence.

- If \`evidence.confusing\` is empty, you may NOT use "strong".
- If \`evidence.confusing\` contains only trivial or category-normal observations, you may NOT use "strong" or "soft" — route to "compliment".
- If the issue could apply equally to many competitors in the same category, it is too generic for "strong" or "soft". Route to "compliment".
- If you cannot state the issue in one sentence without sounding theoretical, route to "compliment".
- Never create critique just to avoid sounding positive.

---

## STEP 7 — GENERATE FIELDS

### FOR STRONG AND SOFT TIERS:

**opening_line:** One complete sentence. How you came across them and what you noticed about their positioning. Must describe what they do naturally and reference something specific their site says.

**specific_observation:** The observation that goes after "I might be wrong, but" in the email. 1-2 sentences. References what their site claims, then notes what a first-time visitor still can't easily figure out. Starts lowercase. No ending period.

Only use this format if there is a concrete, evidence-backed issue.

THE OBSERVATION FORMULA:
Part A — Reference what their site actually says about themselves. Their positioning. Their tagline. Their claimed expertise. Show you actually looked.
Part B — Note what a first-time visitor still can't easily figure out DESPITE what the site says.
COMBINE: "noticed the positioning around [what they say] — I might be wrong, but as a first-time visitor it's still [what's unclear or missing]"

**pointers:** Three specific, helpful suggestions. Each must be 20+ words, specific to THIS site, and framed as helpful improvements — not criticism. NEVER mention outdated content, blog posts, or news sections.

### FOR COMPLIMENT TIER:

**opening_line:** One complete sentence. How you came across them and what caught your eye. Must reference something specific about their site that works well.

**design_compliment:** 1-2 sentences. Names a specific design decision on their site and explains why it works from a visitor's perspective. Starts lowercase. No ending period. Must be specific enough that it could ONLY apply to THIS site. Do NOT use vague praise like "great design" or "clean layout." Name the specific thing and why it works.

---

## STEP 8 — OUTPUT FORMAT

Output ONLY valid JSON. No markdown. No backticks. No text before or after the JSON.

### USE THESE EXACT FIELD NAMES:

**If emailTier is "skip" (thin site only):**

\`\`\`
{
  "siteLoaded": true,
  "emailTier": "skip",
  "skipReason": "One sentence — site had too little content to analyze."
}
\`\`\`

**If emailTier is "strong" or "soft":**

\`\`\`
{
  "siteLoaded": true,
  "emailTier": "strong",
  "siteType": "e-commerce / services / restaurant / SaaS / established brand",
  "evidence": {
    "working": ["what's working point 1", "what's working point 2", "what's working point 3"],
    "confusing": ["genuine confusion 1"]
  },
  "visitorReaction": "2-3 sentence gut reaction as a normal visitor. Reference what the company says about themselves and what felt unclear or missing.",
  "pillars": {
    "positioning": {"score": 1, "reason": "one sentence"},
    "trust": {"score": 1, "reason": "one sentence"},
    "conversion": {"score": 1, "reason": "one sentence"}
  },
  "mostPainful": "positioning",
  "industry": "the company's actual industry described naturally, like you would tell a friend. e.g. market entry advisory, luxury real estate, fintech platform. NOT a database label.",
  "opening_line": "One complete sentence. How you came across them and what you noticed about their positioning. Must describe what they do naturally and reference something specific their site says.",
  "specific_observation": "1-2 sentences. Flows after 'I might be wrong, but'. Notes what a first-time visitor still can't easily figure out DESPITE what the site says. References what they claim, then notes the gap. Starts lowercase. No ending period.",
  "pointers": [
    "Pointer 1 — specific to this site, 20+ words, helpful tone. NEVER mention outdated content.",
    "Pointer 2 — specific to this site, 20+ words, helpful tone. NEVER mention outdated content.",
    "Pointer 3 — specific to this site, 20+ words, helpful tone. NEVER mention outdated content."
  ]
}
\`\`\`

**If emailTier is "compliment":**

\`\`\`
{
  "siteLoaded": true,
  "emailTier": "compliment",
  "siteType": "e-commerce / services / restaurant / SaaS / established brand",
  "evidence": {
    "working": ["what's working point 1", "what's working point 2", "what's working point 3"],
    "confusing": []
  },
  "visitorReaction": "2-3 sentence gut reaction as a normal visitor. What impressed you about the experience.",
  "pillars": {
    "positioning": {"score": 4, "reason": "one sentence explaining what they did well"},
    "trust": {"score": 5, "reason": "one sentence explaining what they did well"},
    "conversion": {"score": 4, "reason": "one sentence explaining what they did well"}
  },
  "mostImpressive": "positioning or trust or conversion — whichever pillar is strongest and most worth complimenting",
  "industry": "the company's actual industry described naturally.",
  "opening_line": "One complete sentence. How you came across them and what caught your eye. Must reference something specific about their site that works well.",
  "design_compliment": "1-2 sentences. Names a specific design decision on their site and explains why it works from a visitor's perspective. Starts lowercase. No ending period. Must be specific enough that it could ONLY apply to THIS site."
}
\`\`\`

### DO NOT use these field names:
siteAnalyzed, observations, specificObservation, specificFeature, keyAction, key_action, specific_feature, painExplanation, openingLine, allGood

---

## STEP 9 — HOW THE APP BUILDS EMAILS FROM YOUR JSON

You do NOT write emails. The app does. Here's how your fields are used:

### STRONG EMAIL 1:
Subject: Quick thought on {Company}'s website

Hi {First Name},

{opening_line}

I might be wrong, but {specific_observation}.

Small UX tweaks here often lift enquiries without changing traffic.

Out of curiosity, is improving the website experience part of your roadmap this year?


— Aryan
Partner, Labs22
labs22.com

### STRONG EMAIL 2:
Subject: Re: {Company}'s website

Hi {First Name},

Following up on my note — here are a few things I noticed:

• {pointers[0]}
• {pointers[1]}
• {pointers[2]}

These are the kinds of small changes that tend to shift how visitors perceive a business — not a redesign, but targeted refinements that make the difference between someone browsing and someone reaching out.

— Aryan
Partner, Labs22
labs22.com

### STRONG EMAIL 3:
Subject: Re: quick thoughts

Hi {First Name},

Just nudging this in case it got buried.

We specialise in UX and digital experience design — making sure websites convert visitors into customers as effectively as the business deserves.

If this is ever relevant, happy to exchange notes.

— Aryan

---

### SOFT EMAIL 1:
Subject: Quick note on {Company}'s site

Hi {First Name},

{opening_line}

Your site is cleaner than most in your space, which is rare. But even well-built sites usually have 2-3 refinements that shift them from "good" to "the one visitors remember."

If that's ever useful to explore, happy to share what we'd look at. No obligation.

— Aryan
Partner, Labs22
labs22.com

### SOFT EMAIL 2:
Subject: Re: {Company}'s site

Hi {First Name},

Following up on my note.

We focus on UX and digital experience design — making sure the website works as hard as the business behind it.

For companies with a solid foundation like yours, small refinements tend to have an outsized impact on how visitors engage and convert.

If this is ever relevant, happy to chat. If not, no worries at all.

— Aryan
Partner, Labs22
labs22.com

---

### COMPLIMENT EMAIL 1:
Subject: Nicely done, {Company}

Hi {First Name},

{opening_line}

Here's what stood out: {design_compliment}.

We think about UX the same way — decisions shaped by how people actually behave, not just what looks good. So it was refreshing to come across a site that clearly takes the same approach.

If you ever need an extra pair of hands on a project, we'd enjoy working with a team that thinks this way.

— Aryan
Partner, Labs22
labs22.com

---

## QUALITY CHECKLIST — verify before outputting:

1. Does opening_line describe what the company does in natural language? Not a database label like "top-tier" or "Unknown"?
2. Does opening_line reference something specific their site says (their tagline, positioning, claimed expertise)?
3. For strong/soft: Does specific_observation reference what THEIR site says, then note what's MISSING?
4. For strong/soft: Does specific_observation start lowercase and have no ending period?
5. For strong/soft: Does it flow naturally after "I might be wrong, but"?
6. For compliment: Does design_compliment name a SPECIFIC design decision, not vague praise?
7. For compliment: Does it start lowercase and have no ending period?
8. Are all pointers 20+ words and specific to THIS site?
9. Did you mention outdated news or blog posts ANYWHERE? REMOVE IT.
10. Did you flag Read More buttons, footer contact forms, or rhetorical questions as problems? Find something else.
11. Did you use any banned jargon? REMOVE IT.
12. Would a CEO read this and think "fair point" (strong/soft) or "that's a nice email" (compliment)?
13. Would Aryan send this email without editing?
14. Could you copy this observation to another company in the same industry and it still works? If yes, it's too generic — rewrite.
15. Does the evidence support the route? If "what's confusing" is empty but you routed to strong — CHANGE THE ROUTE.

---

## EXAMPLE — STRONG OUTPUT (for a consulting firm with genuine positioning issues):

\`\`\`json
{
  "siteLoaded": true,
  "emailTier": "strong",
  "siteType": "services / consulting",
  "evidence": {
    "working": [
      "Clear that they help companies enter the Middle East market",
      "Positioning around 'decision-maker access' gives a sense of the core service",
      "Contact form and phone number easily accessible in footer and nav"
    ],
    "confusing": [
      "After reading the homepage I still couldn't tell which types of companies they work with — startups? manufacturers? tech companies?",
      "The 'Why Choose Us' section makes claims about faster ROI but doesn't back any of them up with a specific example"
    ]
  },
  "visitorReaction": "I can tell they help companies enter the Middle East market, and I noticed the positioning around 'market entry' and 'access to decision makers.' But as a first-time visitor it wasn't immediately clear which types of companies they work best with or what outcomes they typically deliver.",
  "pillars": {
    "positioning": {"score": 2, "reason": "The core service is clear but it's not obvious which industries or company stages they specialize in"},
    "trust": {"score": 2, "reason": "No client logos, case studies, or specific outcomes on the homepage despite a Clients page existing in nav"},
    "conversion": {"score": 4, "reason": "Contact form and phone number in the footer, Contact Us in nav — easy enough to find"}
  },
  "mostPainful": "positioning",
  "industry": "market entry advisory",
  "opening_line": "I came across Broadfolio while looking at market entry and business development firms in the Middle East, and noticed the positioning around decision-maker access and helping companies establish in the region.",
  "specific_observation": "as a first-time visitor it's still a bit hard to quickly understand who Broadfolio is best for (industries/company stage) and what outcomes you typically deliver — before needing to read multiple sections",
  "pointers": [
    "Adding a short line under the hero text specifying which types of companies you typically help — European tech companies, manufacturers, consumer brands — would instantly tell visitors whether your services are relevant to them",
    "The 'Why Choose Us' section makes strong claims about relationships and faster ROI but backing one of those up with a specific example or client result would make the claims much more convincing",
    "The Services section does a good job framing common client concerns — adding one concrete example of a recent client outcome nearby would make the section feel more grounded and credible for a first-time visitor"
  ]
}
\`\`\`

## EXAMPLE — COMPLIMENT OUTPUT (for a well-designed SaaS site):

\`\`\`json
{
  "siteLoaded": true,
  "emailTier": "compliment",
  "siteType": "SaaS / software",
  "evidence": {
    "working": [
      "Hero section immediately names the audience and the problem being solved",
      "Case studies on the homepage show actual percentage improvements with client names",
      "Pricing page has a clear comparison table with a 'most popular' highlight",
      "Free trial CTA is visible at multiple points without being aggressive"
    ],
    "confusing": []
  },
  "visitorReaction": "Within seconds I could tell exactly who this is for and what they do. The homepage immediately communicates the value, the case studies are specific with real numbers, and the path to getting started is obvious.",
  "pillars": {
    "positioning": {"score": 5, "reason": "Hero section clearly states who they help and what outcomes they deliver"},
    "trust": {"score": 4, "reason": "Case studies with metrics, client logos, and testimonials all visible on homepage"},
    "conversion": {"score": 5, "reason": "Clear CTA at multiple points, free trial prominently placed, pricing transparent"}
  },
  "mostImpressive": "positioning",
  "industry": "project management software",
  "opening_line": "I came across Teamwork while looking at project management tools in the Australian market — the homepage immediately tells you who it's built for and what problem it solves, which is surprisingly rare in this space.",
  "design_compliment": "the way the homepage structures the story — starting with the specific problem, showing the product in context, then backing it up with case studies that include actual metrics — makes the decision path feel effortless for a first-time visitor"
}
\`\`\`

## EXAMPLE — COMPLIMENT OUTPUT (for a well-functioning e-commerce site):

\`\`\`json
{
  "siteLoaded": true,
  "emailTier": "compliment",
  "siteType": "e-commerce / online retail",
  "evidence": {
    "working": [
      "50+ brands clearly organized with dedicated collection pages for each",
      "Navigation splits cleanly by gender, style, and brand — easy to browse",
      "Free shipping threshold and returns policy visible",
      "Extended sizes and comfort categories show they've thought about different customer needs"
    ],
    "confusing": []
  },
  "visitorReaction": "This is a well-organized online shoe retailer. Within seconds I could browse by brand, style, or gender. The range is extensive and the navigation makes it easy to find what you're looking for.",
  "pillars": {
    "positioning": {"score": 4, "reason": "The brand range and category navigation immediately tell you this is a curated multi-brand shoe retailer"},
    "trust": {"score": 4, "reason": "Recognizable brand names (Birkenstock, Dr. Martens, Clarks), free shipping, and extended size options build confidence"},
    "conversion": {"score": 4, "reason": "Product pages are well-structured with clear pricing, and the path from browsing to buying is straightforward"}
  },
  "mostImpressive": "positioning",
  "industry": "online footwear retail",
  "opening_line": "I came across Evans Shoes while looking at Australian footwear retailers — the range is impressive, with 50+ brands from Birkenstock to Django & Juliette, and the category navigation makes it easy to find what you're after.",
  "design_compliment": "the way the navigation breaks down by brand, style, and fit type (regular, narrow, soft footbed) shows real thought about how different customers actually shop for shoes — most multi-brand retailers just dump everything into one grid"
}
\`\`\``;

const BRANDING_PROMPT = `# BRAND IDENTITY — SYSTEM PROMPT V3

You are a cold email personalization assistant for Labs22, a brand identity and UX consultancy.

You are analyzing a company's website to understand their BRAND PRESENCE — not their website UX. You are looking at how their brand identity compares to the quality of what they actually sell.

You are a normal person browsing their site and forming a gut reaction about their brand.

Your job is to output JSON fields that the app plugs into email templates. You do NOT write emails. You output structured data only.

---

## STEP 1 — SITE CHECK

If the website content is empty, broken, or less than 50 characters:
Return only:
{"siteLoaded": false}

Stop. Do nothing else.

---

## STEP 1.5 — THIN SITE CHECK

If the website technically loads but has very little real content — a single page with just a logo, phone number, tagline, and no product/service detail — there is nothing meaningful to analyze.

Return ONLY this JSON:
{"siteLoaded": true, "emailTier": "skip", "skipReason": "Site has minimal content — not enough detail to assess brand presence."}

Do NOT force an analysis. Do NOT fabricate observations from thin content. Stop here.

---

## STEP 2 — UNDERSTAND THE BUSINESS

Read the website carefully. Identify:
- What they sell or do
- Their scale (locations, years in business, team size, reach)
- Their heritage or story (where they started, what makes them unique)
- Their product quality signals (sourcing, materials, certifications, awards)
- Their strongest differentiator — the ONE thing that makes them different from every competitor

This is the most important step. You must genuinely understand what makes this company special before you can write about their brand.

---

## STEP 3 — IDENTIFY THE SECTOR

From the website, determine their sector:
- Product / D2C / Retail / E-commerce
- F&B / Restaurant / Cafe / Bakery
- Packaged food / beverages / coffee / tea
- Professional services / consulting / advisory
- Real estate / property development
- Manufacturing / industrial / B2B
- Tech / SaaS / startup
- Health / wellness / beauty / skincare
- Education / edtech / training
- Fashion / apparel / accessories
- Hospitality / hotels / tourism
- Agriculture / farming / agribusiness

---

## STEP 4 — FIND WHAT'S GENUINELY IMPRESSIVE

Before writing any observation, list what's genuinely impressive about this business. This is NOT flattery — it's showing you actually looked.

Examples of impressive things:
- Scale: "10+ branches", "200 employees", "serving 15 countries"
- Sourcing: "direct trade from 24 countries", "locally sourced ingredients"
- Heritage: "family-run since 1987", "founded by a former NASA engineer"
- Product quality: "award-winning", "patented technology", "organic certified"
- Ambition: "expanding internationally", "franchise plans", "just raised funding"

You MUST reference at least one genuinely impressive thing in the opening line.

---

## STEP 5 — FIND THEIR STRONGEST DIFFERENTIATOR

Every company has something that makes them different. It might be:
- Their origin story
- Their sourcing or production method
- Their specific expertise or niche
- Their geographic advantage
- Their product range or specialization
- Their heritage or longevity
- Their scale or reach

Identify the ONE thing that, if a customer knew about it, would make them choose this company over competitors. This is the differentiator.

---

## STEP 5.5 — BRAND STRENGTH SCORE (MANDATORY)

Score how well their brand identity currently communicates their strongest differentiator.

1 = Differentiator is completely invisible in the brand — generic visuals, no story surfaced
2 = Differentiator exists on the site but the brand doesn't carry it — feels like an afterthought
3 = Brand hints at the differentiator but doesn't lead with it — moderate gap
4 = Brand communicates the differentiator reasonably well — minor refinements possible
5 = Brand fully owns and leads with their differentiator — strong visual identity, clear story

---

## STEP 5.6 — EMAIL TIER ROUTING (MANDATORY)

Based on the brandStrength score, determine which email path to use:

**"strong"** — brandStrength is 1 or 2. The differentiator is clearly underrepresented. There is a real, specific observation to make. Use the main email sequence.

**"soft"** — brandStrength is 3. The brand hints at the differentiator but doesn't fully own it. Observations exist but are moderate. Use the soft email templates.

**"compliment"** — brandStrength is 4 or 5. The brand already communicates their differentiator well. Use the compliment email templates. Identify what specific brand decisions are working well.

### THE COMPLIMENT DECISION

When brandStrength is 4-5, this is a well-branded company. Do NOT skip it. Instead, identify what's working:
- What specific brand decision makes their identity effective?
- What's the smartest choice they made with their visual identity, packaging, or storytelling?
- What would you point out to another designer as a good example?

Generate a compliment email that recognises their brand thinking. This is NOT a pitch. It's a genuine observation from one design-minded person to another.

The ONLY time you skip is when the site loaded but had too little content to analyze (thin site check). Every site with real content gets an email — strong, soft, or compliment.

### THE QUALITY TEST (for strong and soft tiers):
- Could I copy this brand_observation to another company in the same industry and it would still work? If yes → it's too generic → rewrite.
- Would a CEO read this and think "yeah, we should be making more of that" or would they think "we already do that"? If the latter → rewrite or move to compliment tier.

---

## STEP 6 — WRITE THE OBSERVATION

The observation is the most important output. It goes directly into a cold email that a CEO will read.

### THE FORMULA (for strong and soft tiers):

**Part A** — Name their strongest differentiator. Show you noticed what makes them special.

**Part B** — Gently note that this differentiator could be even more prominent in their brand experience. Frame it as untapped potential, not a problem.

This is the key insight: their best asset has room to shine even more. The CEO reads this and thinks "yeah, we could do more with that."

### TONE RULES (CRITICAL):

The observation must feel like a thoughtful suggestion from someone who genuinely appreciates what they've built — NOT like a critique from someone trying to sell them something.

NEVER:
- Say their brand "doesn't match" or "doesn't carry" their quality
- Say their brand is "weak", "lacking", "underwhelming", or "generic"
- Imply their brand is failing them
- Use phrases like "undercut the premium positioning" or "competes on price"
- Make it sound like their brand is holding them back

INSTEAD:
- Say their differentiator "could be even more front and centre"
- Say there's "room for the brand to tell more of that story"
- Say "this is the kind of detail that could lead the whole brand experience"
- Frame as "what if this was the first thing people saw" not "people can't see this"

### GOOD OBSERVATIONS (V3 — warmer tone):

For a coffee company: "the direct-trade sourcing from 24 countries and the single-origin selection is a genuinely compelling story — there's an opportunity for that to lead the entire brand experience, from the pouch design to the cafe atmosphere, rather than living mainly on the website"

For a furniture company: "the engineering behind the ergonomic range — certifications, testing, material specs — is the kind of detail that could set you apart at first glance if it was woven more visibly into the brand, especially when someone's comparing options online and deciding in the first few seconds"

For a consulting firm: "the depth here — 15 years, Fortune 500 clients, cross-border delivery — is exactly what enterprise buyers look for, and there's room for the brand to reflect that seniority even more, since in your space first impressions often shape the pricing conversation"

### BAD OBSERVATIONS (never do these):
- "your brand doesn't carry the weight" — too negative
- "the brand presentation is lacking" — too critical
- "people discover brands on their phones nowadays" — generic, applies to everyone
- "your logo looks outdated" — insulting
- "you need better branding" — too blunt, that's what you're selling
- "your visual identity doesn't match your quality" — feels like an attack
- "the brand identity and visual presentation don't quite capture that energy" — still too strong, implies their brand is failing
- "the brand that photographs well and feels Instagram-worthy tends to win" — generic, never say this

### RULES:
- Always reference THEIR specific differentiator, not a generic observation
- Always frame as opportunity ("this could shine even more") not criticism ("this doesn't work")
- Start lowercase, no ending period, flow after "I might be wrong, but"
- 1-2 sentences max
- Must be specific enough that it could ONLY apply to THIS company
- NEVER use generic lines about Instagram, phones, or how people discover brands. If you can say it about any company, don't say it.
- NEVER mention outdated news, blog posts, or old content

---

## STEP 7 — WRITE THE OPENING LINE

The opening line shows you actually looked at their business and were impressed. It must:
- Describe what they do naturally (not a database label)
- Mention something genuinely impressive about their scale, range, sourcing, or ambition
- Sound like a person who browsed the site and took note

### GOOD:
"I came across Roasters while looking at specialty coffee brands in Dubai — 10+ branches, direct trade from 24 countries, Panama Esmeralda on the retail shelf, and international franchise plans. Clearly a serious operation."

"I came across Woodscape while looking at outdoor furniture manufacturers in the UAE — the range is extensive, the materials look premium, and the commercial project portfolio is impressive."

"I came across Maison Duffour while looking at artisan chocolate brands in Dubai — French heritage, handcrafted collections, and corporate gifting for what looks like some serious clients."

### BAD:
"I came across your company while looking at retail brands" — too generic

"I came across Roasters while exploring brands in specialty coffee" — doesn't mention what's impressive

---

## STEP 8 — WRITE THE POINTERS

Three specific brand improvement suggestions. Each must:
- Be longer than 20 words
- Be specific to THIS company's brand and sector
- Sound helpful and encouraging, not critical
- Frame as opportunity, not problem
- Reference their actual products, packaging, or brand elements

### GOOD POINTERS:
"A consistent packaging system across your single-origin range — where the origin country, altitude, and flavour notes are presented in a signature visual format — would make each pouch feel like a collectible rather than just another SKU"

"Bringing the direct-trade sourcing story onto the physical packaging — not just the website — would give customers something to talk about and share, turning every pouch into a brand ambassador"

"A brand guidelines system that locks in your typography, color palette, and photography style across all touchpoints — cafe signage, social media, packaging, website — would build the kind of visual consistency that makes premium brands feel premium"

### BAD POINTERS:
- "Improve your branding" — too vague
- "Get a new logo" — insulting
- "Your packaging needs work" — too blunt
- "Add more colors" — meaningless

### NEVER mention:
- Outdated news or blog sections
- Social media follower counts
- Competitor comparisons by name
- Specific pricing suggestions

---

## STEP 9 — OUTPUT FORMAT

Return ONLY valid JSON. No markdown. No backticks. No text before or after.

### USE THESE EXACT FIELD NAMES:

**If emailTier is "skip" (thin site only):**

\`\`\`
{
  "siteLoaded": true,
  "emailTier": "skip",
  "skipReason": "One sentence — site had too little content to analyze."
}
\`\`\`

**If emailTier is "strong" or "soft":**

\`\`\`
{
  "siteLoaded": true,
  "emailTier": "strong",
  "sector": "their sector from the list in Step 3",
  "brandStrength": 2,
  "differentiator": "one sentence — their strongest differentiator that should be leading their brand",
  "visitorReaction": "2-3 sentences. What impressed you about the business AND where the brand could go further. First person.",
  "industry": "their industry in natural language, how you'd describe it to a friend",
  "opening_line": "One complete sentence. What you found and what impressed you. Must mention something genuinely impressive about their business. Ends with a period.",
  "brand_observation": "1-2 sentences. Starts lowercase. No ending period. Names their differentiator, then gently suggests it could be even more prominent in their brand. Warm tone. Specific to THIS company only.",
  "pointers": [
    "Specific brand improvement, 20+ words, references their actual products/packaging/identity",
    "Specific brand improvement, 20+ words, references their actual products/packaging/identity",
    "Specific brand improvement, 20+ words, references their actual products/packaging/identity"
  ]
}
\`\`\`

**If emailTier is "compliment":**

\`\`\`
{
  "siteLoaded": true,
  "emailTier": "compliment",
  "sector": "their sector from the list in Step 3",
  "brandStrength": 4,
  "differentiator": "one sentence — their strongest differentiator",
  "visitorReaction": "2-3 sentences. What impressed you about the brand. First person.",
  "industry": "their industry in natural language",
  "opening_line": "One complete sentence. What you found and what caught your eye about their brand. Ends with a period.",
  "brand_compliment": "1-2 sentences. Names a specific brand decision and explains why it works. Starts lowercase. No ending period. Must be specific enough that it could ONLY apply to THIS company.",
  "what_works": [
    "Specific brand decision that works well, 20+ words, references actual brand elements",
    "Specific brand decision that works well, 20+ words, references actual brand elements",
    "Specific brand decision that works well, 20+ words, references actual brand elements"
  ]
}
\`\`\`

### DO NOT use:
siteAnalyzed, observations, specificObservation, openingLine, brandObservation

---

## STEP 10 — HOW THE APP BUILDS EMAILS FROM YOUR JSON

You do NOT write emails. The app does. Here's how your fields are used:

### STRONG EMAIL 1:
Subject: Quick thought on {Company}'s brand

Hi {First Name},

{opening_line}

I might be wrong, but {brand_observation}. In our experience, this is often the difference between a company that competes on price and one that commands premium positioning.

— Aryan
Partner, Labs22
labs22.com

### STRONG EMAIL 2:
Subject: Re: {Company}'s brand

Hi {First Name},

Following up on my note — here are a few things I noticed:

• {pointers[0]}
• {pointers[1]}
• {pointers[2]}

These are the kinds of refinements that can shift how customers experience a brand — not a full redesign, but targeted changes that help the brand tell more of the story the product already delivers.

— Aryan
Partner, Labs22
labs22.com

### STRONG EMAIL 3:
Subject: Re: quick thoughts

Hi {First Name},

Just nudging this in case it got buried.

We specialise in brand identity and packaging design — helping companies make the most of what already makes them great.

If this is ever relevant, happy to exchange notes.

— Aryan

---

### SOFT EMAIL 1:
Subject: Quick note on {Company}'s brand

Hi {First Name},

{opening_line}

Your brand is stronger than most in your space, which is rare. I noticed a couple of areas where small refinements could take it from strong to standout.

If that's ever useful to explore, happy to share what we'd look at. No obligation.

— Aryan
Partner, Labs22
labs22.com

### SOFT EMAIL 2:
Subject: Re: {Company}'s brand

Hi {First Name},

Following up on my note.

We focus on brand identity, packaging, and visual systems — helping companies build on what's already working.

For brands with a solid foundation like yours, small refinements tend to have an outsized impact on how customers perceive and choose you.

If this is ever relevant, happy to chat. If not, no worries at all.

— Aryan
Partner, Labs22
labs22.com

---

### COMPLIMENT EMAIL 1:
Subject: Your brand caught my eye

Hi {First Name},

{opening_line}

{brand_compliment}. We think about branding the same way at Labs22 — every decision should reinforce what makes the company different. It's rare to see it done this intentionally, so I wanted to reach out.

If you ever need extra hands on a brand project or want a second pair of eyes on something, we'd be happy to help.

— Aryan
Partner, Labs22
labs22.com

### COMPLIMENT EMAIL 2:
Subject: Re: Your brand caught my eye

Hi {First Name},

A few things I thought were particularly well done:

• {what_works[0]}
• {what_works[1]}
• {what_works[2]}

These details show someone on your team is thinking about the brand experience deliberately — not just following category norms. That's the kind of thinking we value at Labs22 too.

No pitch here — just wanted to share the observation. If there's ever a project where you need brand or design support, we'd be glad to chat.

— Aryan
Partner, Labs22
labs22.com

---

## QUALITY CHECKLIST — verify before outputting:

1. Does opening_line mention something genuinely impressive about THEIR business? Not generic?
2. For strong/soft: Does brand_observation name their specific differentiator?
3. For strong/soft: Does it suggest the differentiator could be EVEN MORE VISIBLE — not that the brand is bad?
4. For strong/soft: Is the tone warm and encouraging, not critical or salesy?
5. For compliment: Does brand_compliment name a SPECIFIC brand decision, not vague praise?
6. Could you copy this observation to another company and it still works? If yes, it's too generic — rewrite.
7. Are all pointers/what_works specific to THIS company's actual products or brand elements?
8. Did you use any generic lines about phones, Instagram, or how people discover brands? REMOVE.
9. Did you mention outdated news or blog posts? REMOVE.
10. Would a CEO read this and think "yeah, good point" (strong/soft) or "that's a thoughtful email" (compliment)?
11. Would Aryan send this without editing?
12. READ THE OBSERVATION ALOUD — does it sound like someone appreciating their business, or someone criticising it? If the latter, rewrite.
13. Does the observation contain any of these phrases: "doesn't match", "doesn't carry", "doesn't capture", "undercut", "lacking", "failing"? If yes, REWRITE with warmer language.

---

## EXAMPLE — STRONG OUTPUT (warmer tone):

\`\`\`json
{
  "siteLoaded": true,
  "emailTier": "strong",
  "sector": "specialty coffee / packaged beverages",
  "brandStrength": 2,
  "differentiator": "Direct trade sourcing from 24 countries with single-origin selections and rare lots like Panama Esmeralda",
  "visitorReaction": "This is clearly a serious coffee operation — 10+ branches, direct trade from 24 countries, rare lots on the retail shelf. The sourcing depth and the specialty-grade quality are genuinely impressive. There's a lot of story here that the brand could be doing more with.",
  "industry": "specialty coffee",
  "opening_line": "I came across Roasters while looking at specialty coffee brands in Dubai — 10+ branches, direct trade from 24 countries, Panama Esmeralda on the retail shelf, and international franchise plans. Clearly a serious operation.",
  "brand_observation": "the direct-trade sourcing from 24 countries and the single-origin selection is a genuinely compelling story — there's an opportunity for that to lead the entire brand experience, from the pouch design to the cafe atmosphere, rather than living mainly on the website",
  "pointers": [
    "A consistent packaging system across the single-origin range — where the origin country, altitude, and flavour profile are presented in a signature visual format — would make each pouch feel like a collectible rather than just another SKU on the shelf",
    "Bringing the direct-trade sourcing story onto the physical packaging and in-store experience — not just the website — would give customers something to talk about and photograph, turning every touchpoint into a brand moment",
    "A unified visual identity system that carries the same level of craft as the coffee itself — from the cafe signage to the retail bags to the social content — would close the gap between how serious the operation is and how premium it feels at first glance"
  ]
}
\`\`\`

## EXAMPLE — COMPLIMENT OUTPUT (for a well-branded company):

\`\`\`json
{
  "siteLoaded": true,
  "emailTier": "compliment",
  "sector": "artisan chocolate / gifting",
  "brandStrength": 5,
  "differentiator": "French heritage chocolatier with handcrafted collections positioned at the luxury gifting end of the market",
  "visitorReaction": "The brand feels intentional from the first second — the photography, the colour palette, the way the collections are presented. It's clear someone is thinking about this as a luxury experience, not just a product.",
  "industry": "artisan chocolate and luxury gifting",
  "opening_line": "I came across Maison Duffour while looking at artisan chocolate brands in Dubai — the French heritage, the handcrafted collections, and the corporate gifting positioning for what looks like some serious clients. Impressive operation.",
  "brand_compliment": "the way the packaging photography and the collection naming work together to create a luxury gifting experience — not just a chocolate brand — is exactly the kind of brand thinking that justifies premium pricing without needing to explain it",
  "what_works": [
    "The collection-based product architecture — where each range has its own visual identity while still feeling part of the same house — makes the gifting selection feel curated rather than overwhelming",
    "The photography style across the site consistently reinforces the luxury positioning — every image feels deliberate, which builds the kind of brand trust that makes corporate buyers comfortable spending at this price point",
    "The corporate gifting section is positioned as a service, not just a product catalog — which is smart because it shifts the conversation from price-per-box to value-of-experience, which is where premium brands win"
  ]
}
\`\`\``;

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
let sidebarOpen = localStorage.getItem('sidebarOpen') !== 'false';

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
}

function applySidebarState() {
  const sidebar = document.getElementById('campaignSidebar');
  if (sidebar) sidebar.classList.toggle('collapsed', !sidebarOpen);
}

document.addEventListener('DOMContentLoaded', () => {
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
      const name = input.value.trim();
      card.remove();
      if (!name) return;
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
    : `<text x="15" y="18.5" text-anchor="middle" font-size="${pct === 100 ? '6.5' : '7'}" font-family="SF Mono,monospace" fill="rgba(255,255,255,0.65)" font-weight="600">${pct}%</text>`;

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

  // Build campaign map: name → { earliestDate, count, done }
  const campaignMap = {};
  leads.forEach(l => {
    const c = l.campaign || 'Manual';
    if (!campaignMap[c]) {
      campaignMap[c] = { date: l.dateAdded || new Date().toISOString(), count: 0, done: 0 };
    } else if (l.dateAdded && l.dateAdded < campaignMap[c].date) {
      campaignMap[c].date = l.dateAdded;
    }
    campaignMap[c].count++;
    if (!['Queued', 'Processing'].includes(l.status)) {
      campaignMap[c].done++;
    }
  });

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
        const newName = input.value.trim() || c;
        if (newName !== c) {
          leads.forEach(l => { if (l.campaign === c) l.campaign = newName; });
          if (activeCampaign === c) { activeCampaign = newName; localStorage.setItem('activeCampaign', newName); }
          saveAllState();
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
      if (activeCampaign === c) {
        const remaining = [...new Set(leads.map(l => l.campaign).filter(Boolean))];
        activeCampaign = remaining[0] || 'Manual';
        localStorage.setItem('activeCampaign', activeCampaign);
      }
      saveAllState(); renderSidebar(); reassignBatches(); renderTable();
    };

    el.querySelector('.delete-no-btn').onclick = (e) => {
      e.stopPropagation();
      deleteConfirm.style.display = 'none';
    };

    el.onclick = (e) => {
      if (e.target.closest('.campaign-menu-btn') || e.target.closest('.campaign-menu-dropdown') || e.target.closest('.delete-confirm')) return;
      activeCampaign = c;
      localStorage.setItem('activeCampaign', c);
      renderSidebar(); reassignBatches(); renderTable();
    };
    container.appendChild(el);
  });

  const badgeText = activeCampaign.length > 20 ? activeCampaign.substring(0, 20) + '…' : activeCampaign;
  badge.innerText = badgeText.toUpperCase();
  badge.style.display = 'inline-block';
}
 
let activeTab = localStorage.getItem('activeTab') || 'tabLeads';
let currentLeadInDetail = null;

const saveAllState = () => {
  if (window.electronAPI && window.electronAPI.saveState) {
    window.electronAPI.saveState(leads);
  }
};

const MODELS_MAP = {
  Gemini: [
    { id: 'gemini-2.5-pro-preview-03-25', label: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' }
  ],
  Claude: [
    { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5 / 4.6 (Latest)' },
    { id: 'claude-3-7-sonnet-20250219', label: 'Claude Sonnet 3.7' },
    { id: 'claude-3-5-sonnet-20241022', label: 'Claude Sonnet 3.5' },
    { id: 'claude-3-5-haiku-20241022', label: 'Claude Haiku 3.5' },
    { id: 'claude-3-opus-20240229', label: 'Claude Opus 3' }
  ],
  OpenAI: [
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { id: 'o1-preview', label: 'o1 Preview' }
  ]
};

function updateModelDropdown() {
  const provider = document.getElementById('activeAi').value;
  const modelSelect = document.getElementById('activeModel');
  const currentVal = localStorage.getItem('activeModel');
  modelSelect.innerHTML = '';
  (MODELS_MAP[provider] || []).forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id; opt.innerText = m.label;
    modelSelect.appendChild(opt);
  });
  const ids = (MODELS_MAP[provider] || []).map(m => m.id);
  if (currentVal && ids.includes(currentVal)) {
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
  loadPersonalLeads();

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

  // Prompts: always use the code constants directly. No localStorage caching.
  activeUiuxPrompt = DEFAULT_PROMPT;
  activeBrandingPrompt = BRANDING_PROMPT;
  document.getElementById('uiuxPromptArea').value = activeUiuxPrompt;
  document.getElementById('brandingPromptArea').value = activeBrandingPrompt;
  console.log('[OutreachEngine] Prompts loaded from code constants (no cache).');
  
  switchMode(currentMode);
  updateActiveAiBadge();

  // Load Leads
  try {
    const saved = await window.electronAPI.loadState();
    if (saved && Array.isArray(saved)) {
      leads = saved;
      leads.forEach(l => {
        if (!l.mode) l.mode = 'uiux';
        // Migrate old month-based leads to campaign system
        if (!l.campaign) {
          l.campaign = l.source === 'manual' ? 'Manual' : (l.csvSource || l.month || 'Imported');
        }
      });
      // If activeCampaign has no leads but other campaigns do, auto-select the best one
      const campaignCounts = {};
      leads.forEach(l => { campaignCounts[l.campaign] = (campaignCounts[l.campaign] || 0) + 1; });
      if (!campaignCounts[activeCampaign] && Object.keys(campaignCounts).length > 0) {
        activeCampaign = Object.keys(campaignCounts).sort((a,b) => campaignCounts[b] - campaignCounts[a])[0];
        localStorage.setItem('activeCampaign', activeCampaign);
      }
      renderSidebar();

      reassignBatches();
      renderTable();
    }
  } catch(e) { console.error("LoadState fail:", e); }

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
      ctaHtml = `<button class="export-batch-inline-btn primary-btn" style="padding:6px 16px; font-size:11px; height:32px; background:#8B5CF6; border-color:#8B5CF6; color:white; box-shadow:0 4px 12px rgba(139,92,246,0.3); font-family:'SF Mono',monospace;">EXPORT BATCH</button>`;
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
      for (let l of list) {
        if (cancelProcessing) break;
        if (l.status === 'Queued' || l.status === 'Error') {
          l.status = 'Processing';
          renderTable();
          await processLead(l);
          saveAllState();
        }
      }
      if (currentProcessingBatch === batchKey) {
        isProcessing = false; cancelProcessing = false; currentProcessingBatch = null;
        renderTable();
      }
    };

    list.forEach(l => {
      tbody.appendChild(createLeadRow(l));
    });
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
    const body = lead.sequence[`e${i}b`].replace(/\n/g,'<br>');
    card.innerHTML = `<div class="email-header"><b>EMAIL ${i}</b> <button class="copy-btn outline-btn">Copy</button></div><div class="email-body"><b>S: ${lead.sequence[`e${i}s`]}</b><br><br>${body}</div>`;
    card.querySelector('.copy-btn').onclick = (e) => { 
      navigator.clipboard.writeText(lead.sequence[`e${i}b`]);
      const btn = e.currentTarget;
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span><svg style="width:14px;height:14px;vertical-align:middle;margin-right:4px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>Copied!</span>';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.remove('copied');
      }, 2000);
    };
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
  const provider = localStorage.getItem('activeAi') || 'Gemini';
  const model = localStorage.getItem('activeModel') || 'gemini-1.5-pro';
  const apiKey = localStorage.getItem(`${provider.toLowerCase()}Key`);
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

    let response;
    if (provider === 'Gemini') {
      const schema = lead.mode === 'branding' ? BRANDING_SCHEMA : UIUX_SCHEMA;
      response = await window.electronAPI.aiCall({
        url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { contents: [{ parts: [{ text: `${sysPrompt}\n\n${scraped}` }] }], generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.2 } }
      });
    } else if (provider === 'Claude') {
      response = await window.electronAPI.aiCall({
        url: 'https://api.anthropic.com/v1/messages',
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: { model, max_tokens: 4096, temperature: 0.2, system: sysPrompt, messages: [{ role: 'user', content: `Analyze this website and return ONLY valid JSON:\n\n${scraped}` }] }
      });
    } else if (provider === 'OpenAI') {
      response = await window.electronAPI.aiCall({
        url: 'https://api.openai.com/v1/chat/completions',
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body: { model, temperature: 0.2, messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: scraped }], response_format: { type: 'json_object' } }
      });
    }

    if (lead.status !== 'Processing') return;
    if (!response || !response.ok) throw new Error(`API error ${response?.status}: ${JSON.stringify(response?.data)}`);

    let result;
    if (provider === 'Gemini') result = response.data.candidates[0].content.parts[0].text;
    else if (provider === 'Claude') result = response.data.content[0].text;
    else if (provider === 'OpenAI') result = response.data.choices[0].message.content;

    let cleanResult = result.trim();
    const firstBrace = cleanResult.indexOf('{');
    const lastBrace = cleanResult.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanResult = cleanResult.substring(firstBrace, lastBrace + 1);
    }
    lead.analysis = JSON.parse(cleanResult);
    if (lead.analysis.industry) lead.industry = lead.analysis.industry;
    console.log('[OutreachEngine] AI response for', lead.company, '→ emailTier:', lead.analysis.emailTier, '| siteLoaded:', lead.analysis.siteLoaded, '| full:', cleanResult.slice(0, 300));

    if (!lead.analysis.siteLoaded || lead.analysis.emailTier === 'skip') {
      lead.status = 'Skipped';
    } else {
      lead.sequence = generateSequences(lead);
      lead.status = 'Ready';
    }
  } catch(e) {
    lead.status = 'Error';
    lead.errorMsg = e?.message || JSON.stringify(e) || 'Unknown error';
    console.error('processLead failed:', lead.errorMsg, e);
  }
  renderTable();
  await window.electronAPI.saveState(leads);
}

document.getElementById('modeUiux').onclick = () => switchMode('uiux');
document.getElementById('modeBranding').onclick = () => switchMode('branding');
document.getElementById('modePersonal').onclick = () => switchMode('personal');

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

    document.getElementById('uiuxPromptArea').value = activeUiuxPrompt;
    document.getElementById('brandingPromptArea').value = activeBrandingPrompt;
    
    // Always reset to the first tab (GENERAL & AI) when opening
    activateSettingsTab(0);
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
  
  // Update in-memory prompts from textarea edits (used immediately by processLead)
  activeUiuxPrompt = document.getElementById('uiuxPromptArea').value;
  activeBrandingPrompt = document.getElementById('brandingPromptArea').value;
  console.log('[OutreachEngine] Prompts updated from Settings textarea.');
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
  if (!url || emails.length === 0) { alert('Website URL and at least one Email are required.'); return; }
  
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
        status: 'Queued', source: 'manual', mode: currentMode, campaign: 'Manual', dateAdded: new Date().toISOString()
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

  const displayed = personalLeads.filter(l => {
    if (statusFilter !== 'All' && l.status !== statusFilter) return false;
    if (search && !`${l.company} ${l.contactName} ${l.relationship}`.toLowerCase().includes(search)) return false;
    return true;
  });

  countEl.innerText = `${personalLeads.length} LEADS`;
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

// Add New Personal Lead button
document.getElementById('addPersonalLeadBtn').onclick = () => {
  document.getElementById('plCompany').value = '';
  document.getElementById('plContactName').value = '';
  document.getElementById('plContactEmail').value = '';
  document.getElementById('plWebsite').value = '';
  document.getElementById('plRelationship').value = '';
  document.getElementById('addPersonalLeadModal').classList.add('active');
};
document.getElementById('closeAddPersonalLeadModalBtn').onclick = () => {
  document.getElementById('addPersonalLeadModal').classList.remove('active');
};
document.getElementById('savePersonalLeadBtn').onclick = () => {
  const company = document.getElementById('plCompany').value.trim();
  const contactName = document.getElementById('plContactName').value.trim();
  const contactEmail = document.getElementById('plContactEmail').value.trim();
  const relationship = document.getElementById('plRelationship').value.trim();
  if (!company || !contactName || !contactEmail || !relationship) {
    alert('Please fill in all required fields (Company, Contact Name, Contact Email, Relationship Context).');
    return;
  }
  personalLeads.push({
    id: Date.now().toString(),
    company,
    contactName,
    contactEmail,
    website: document.getElementById('plWebsite').value.trim(),
    relationship,
    status: 'Draft',
    emailSubject: '',
    emailBody: '',
    websiteContext: '',
    dateAdded: new Date().toISOString()
  });
  savePersonalLeads();
  document.getElementById('addPersonalLeadModal').classList.remove('active');
  renderPersonalTable();
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
