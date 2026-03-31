/**
 * generateCompanyData.js
 *
 * Build-time script that reads markdown files from the company workspace
 * and outputs structured JSON for the NEXUS web app.
 *
 * Usage: node scripts/generateCompanyData.js
 * Runs automatically as prebuild/prestart via package.json.
 *
 * Truth sources (in priority order):
 *   01_NOVA/03_COMPANY_STATUS.md   — executive summary per product
 *   05_shared/01_CURRENT_STATE.md  — live operational state
 *   05_shared/03_NEXT_ACTIONS.md   — next steps (priority order)
 *   05_shared/04_PHASE_TRACKER.md  — phase status tables
 *   05_shared/05_BLOCKERS.md       — current blockers
 *   CALENDAR.md                    — phase deadlines & revenue milestones
 *   SCOREBOARD.md                  — weekly KPIs
 *   06_AUREON/04_tracking/pipeline.md — AUREON pipeline leads
 */

const fs = require('fs');
const path = require('path');

// Resolve company root (3 levels up from nexus-ui: nexus-ui → PRODUCT → 02_NEXUS → company)
const COMPANY_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const OUTPUT_PATH = path.resolve(__dirname, '..', 'src', 'data', 'companyData.generated.json');

function readFile(relativePath) {
  const fullPath = path.join(COMPANY_ROOT, relativePath);
  try {
    return fs.readFileSync(fullPath, 'utf-8');
  } catch {
    console.warn(`[generateCompanyData] Could not read: ${relativePath}`);
    return '';
  }
}

/**
 * Extract sections from markdown by heading level.
 * Returns { heading: content } map.
 */
function extractSections(md, level = 2) {
  const prefix = '#'.repeat(level) + ' ';
  const sections = {};
  let currentHeading = null;
  let currentContent = [];

  for (const line of md.split('\n')) {
    if (line.startsWith(prefix) && !line.startsWith(prefix + '#')) {
      if (currentHeading) {
        sections[currentHeading] = currentContent.join('\n').trim();
      }
      currentHeading = line.slice(prefix.length).trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }
  if (currentHeading) {
    sections[currentHeading] = currentContent.join('\n').trim();
  }
  return sections;
}

/**
 * Parse a markdown table into array of objects.
 * Expects | Header1 | Header2 | ... format.
 */
function parseMarkdownTable(text) {
  const lines = text.split('\n').filter((l) => l.trim().startsWith('|'));
  if (lines.length < 2) return [];

  const headers = lines[0]
    .split('|')
    .map((h) => h.trim())
    .filter(Boolean);

  // Skip separator line (|---|---|...)
  const dataLines = lines.slice(1).filter((l) => !l.match(/^\|[\s-|]+\|$/));

  return dataLines.map((line) => {
    const cells = line.split('|').map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length);
    const row = {};
    headers.forEach((h, i) => {
      row[h.toLowerCase().replace(/[^a-z0-9]/g, '_')] = cells[i] || '';
    });
    return row;
  });
}

/**
 * Extract checklist items from markdown.
 * Returns [{ done: boolean, text: string }]
 */
function parseChecklist(text) {
  const items = [];
  for (const line of text.split('\n')) {
    const match = line.match(/^-\s*\[([ xX✅⏳])\]\s*(.+)/);
    if (match) {
      items.push({
        done: match[1] !== ' ',
        text: match[2].trim(),
      });
    }
  }
  return items;
}

/**
 * Extract bullet points from markdown.
 */
function parseBullets(text) {
  return text
    .split('\n')
    .filter((l) => l.match(/^[-*]\s+/))
    .map((l) => l.replace(/^[-*]\s+/, '').trim());
}

/**
 * Strip markdown bold/italic markers from a string.
 */
function cleanMarkdown(str) {
  if (!str) return '';
  return str
    .replace(/\*{1,2}([^*]*)\*{1,2}/g, '$1')
    .replace(/_{1,2}([^_]*)_{1,2}/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/✅|⏳|🟡|🔴|🟢|⏸️/g, '')
    .trim();
}

/**
 * Extract value from a two-column markdown table for a given field key.
 * Matches rows like | **Phase** | ... | or | Phase | ... |
 */
function extractTableValue(tableText, fieldName) {
  const lines = tableText.split('\n').filter((l) => l.trim().startsWith('|'));
  for (const line of lines) {
    const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
    if (cells.length >= 2) {
      const key = cleanMarkdown(cells[0]).toLowerCase();
      if (key === fieldName.toLowerCase()) {
        return cleanMarkdown(cells[1]);
      }
    }
  }
  return '';
}

/**
 * Product name → department ID mapping.
 * Used to link product entries in COMPANY_STATUS to department IDs in the app.
 */
const PRODUCT_TO_DEPT_ID = {
  NEXUS: 'nexus',
  VORTEX: 'hephaestus',   // VORTEX is the active product under HEPHAESTUS dept
  HEPHAESTUS: 'hephaestus',
  XENON: 'xenon',
  AUREON: 'aureon',
};

/**
 * Parse 01_NOVA/03_COMPANY_STATUS.md into a structured products[] array.
 * Each product section is a ## heading containing a two-column | Field | Status | table.
 */
function parseCompanyStatus(md) {
  if (!md) return [];
  const sections = extractSections(md, 2);
  const products = [];

  for (const [heading, content] of Object.entries(sections)) {
    // Match any ALLCAPS product name (NEXUS, VORTEX, HEPHAESTUS, XENON, AUREON)
    const nameMatch = heading.match(/^([A-Z][A-Z0-9_]+)/);
    if (!nameMatch) continue;

    const name = nameMatch[1];
    const deptId = PRODUCT_TO_DEPT_ID[name];
    if (!deptId) continue;

    const phase = extractTableValue(content, 'Phase') || extractTableValue(content, 'Active Phase');
    const lastCompleted = extractTableValue(content, 'Last Completed');
    const nextStep = extractTableValue(content, 'Next Step');
    const blockers = extractTableValue(content, 'Blockers');
    const target = extractTableValue(content, 'Target');

    // Extract health line: **Health:** 🟢 ...
    const healthMatch = content.match(/\*{0,2}Health[:\s*]+\*{0,2}\s*(.+)/i);
    const health = healthMatch ? healthMatch[1].replace(/\*+/g, '').trim() : '';

    products.push({
      name,
      deptId,
      phase: cleanMarkdown(phase),
      lastCompleted: cleanMarkdown(lastCompleted),
      nextStep: cleanMarkdown(nextStep),
      blockers: cleanMarkdown(blockers),
      target: cleanMarkdown(target),
      health: health.replace(/[🟢🟡🔴⏸️✅⏳]/g, '').trim(),
      source: 'company_status',
    });
  }

  return products;
}

/**
 * Parse CALENDAR.md into structured phaseDeadlines per product + revenue milestones.
 */
function parseCalendar(md) {
  if (!md) return { phaseDeadlines: {}, revenueMilestones: [] };

  const sections = extractSections(md, 2);
  const phaseDeadlines = {};
  const revenueMilestones = [];

  // Revenue Milestones section
  if (sections['Revenue Milestones']) {
    const rows = parseMarkdownTable(sections['Revenue Milestones']);
    for (const row of rows) {
      if (row.target && row.amount) {
        revenueMilestones.push({
          target: cleanMarkdown(row.target),
          amount: cleanMarkdown(row.amount),
          deadline: cleanMarkdown(row.deadline),
          status: cleanMarkdown(row.status),
        });
      }
    }
  }

  // Phase Deadlines sections — look for ### NEXUS, ### VORTEX, ### AUREON subsections
  const phaseSection = sections['Phase Deadlines'] || '';
  const subSections = extractSections(phaseSection, 3);
  for (const [heading, content] of Object.entries(subSections)) {
    const nameMatch = heading.match(/^([A-Z][A-Z0-9_]+)/);
    if (!nameMatch) continue;
    const name = nameMatch[1].toLowerCase();
    const rows = parseMarkdownTable(content);
    if (rows.length > 0) {
      phaseDeadlines[name] = rows.map((r) => ({
        phase: cleanMarkdown(r.phase || r['phase'] || ''),
        start: cleanMarkdown(r.start || ''),
        targetEnd: cleanMarkdown(r.target_end || r['target end'] || ''),
        status: cleanMarkdown(r.status || ''),
      })).filter((r) => r.phase);
    }
  }

  return { phaseDeadlines, revenueMilestones };
}

// ─── Main ───

function generate() {
  console.log('[generateCompanyData] Reading company truth layer...');

  const output = {
    // Core truth: per-product structured status
    products: [],
    // Phase deadlines from CALENDAR
    phaseDeadlines: {},
    // Revenue milestones from CALENDAR
    revenueMilestones: [],
    // Legacy: departments array from CURRENT_STATE (kept for compat)
    departments: [],
    // Backlog items
    backlog: {},
    // AUREON pipeline leads
    pipeline: [],
    // Task checklists
    tasks: {},
    // Active blockers
    blockers: [],
    // Next actions (priority ordered)
    nextActions: [],
    // Phase tracker tables
    phaseTracker: [],
    lastGenerated: new Date().toISOString(),
  };

  // 1. Company Status (primary source for per-product state)
  const companyStatus = readFile('01_NOVA/03_COMPANY_STATUS.md');
  if (companyStatus) {
    output.products = parseCompanyStatus(companyStatus);
    console.log(`  - ${output.products.length} products from company status`);
  }

  // 2. Calendar (phase deadlines + revenue milestones)
  const calendarMd = readFile('CALENDAR.md');
  if (calendarMd) {
    const { phaseDeadlines, revenueMilestones } = parseCalendar(calendarMd);
    output.phaseDeadlines = phaseDeadlines;
    output.revenueMilestones = revenueMilestones;
    console.log(`  - ${revenueMilestones.length} revenue milestones from calendar`);
  }

  // 3. Current State (legacy dept enrichment from shared truth)
  const currentState = readFile('05_shared/01_CURRENT_STATE.md');
  if (currentState) {
    const sections = extractSections(currentState, 2);
    for (const [heading, content] of Object.entries(sections)) {
      // Match headings like "NEXUS (Product)", "VORTEX", "AUREON (Capital Generation)"
      const deptMatch = heading.match(/^([A-Z][A-Z0-9_]+)/);
      if (deptMatch) {
        const name = deptMatch[1];
        const phaseMatch = content.match(/\*{0,2}Phase[:\s*]+\*{0,2}\s*(.+?)(?:\n|$)/i);
        const statusMatch = content.match(/\*{0,2}Status[:\s*]+\*{0,2}\s*(.+?)(?:\n|$)/i);
        const blockerLines = content.match(/Blocker[s]?[:\s]+(.+?)(?:\n|$)/i);
        output.departments.push({
          name,
          phase: phaseMatch?.[1]?.trim() || '',
          status: statusMatch?.[1]?.trim() || 'active',
          blockers: blockerLines?.[1]?.trim() || 'None',
          source: 'current_state',
        });
      }
    }
    console.log(`  - ${output.departments.length} departments from current state`);
  }

  // 4. Next Actions
  const nextActions = readFile('05_shared/03_NEXT_ACTIONS.md');
  if (nextActions) {
    const sections = extractSections(nextActions, 3);
    let priority = 1;
    for (const [heading, content] of Object.entries(sections)) {
      output.nextActions.push({
        priority,
        title: heading,
        details: content.slice(0, 300),
      });
      priority++;
    }
    console.log(`  - ${output.nextActions.length} next actions`);
  }

  // 5. Phase Tracker
  const phaseTracker = readFile('05_shared/04_PHASE_TRACKER.md');
  if (phaseTracker) {
    output.phaseTracker = parseMarkdownTable(phaseTracker);
  }

  // 6. Blockers
  const blockers = readFile('05_shared/05_BLOCKERS.md');
  if (blockers) {
    output.blockers = parseBullets(blockers).filter((b) => b.length > 0);
    if (output.blockers.length > 0) {
      console.log(`  - ${output.blockers.length} blockers`);
    }
  }

  // 7. Hephaestus Backlog
  const hephBacklog = readFile('03_HEPHAESTUS/04_BACKLOG.md');
  if (hephBacklog) {
    const items = parseChecklist(hephBacklog);
    output.backlog.hephaestus = items.length > 0
      ? items
      : parseBullets(hephBacklog).map((text) => ({ done: false, text }));
  }

  // 8. Aureon Pipeline
  const pipeline = readFile('06_AUREON/04_tracking/pipeline.md');
  if (pipeline) {
    const table = parseMarkdownTable(pipeline);
    if (table.length > 0) {
      // Filter out legend/icon rows (rows without a meaningful company name)
      output.pipeline = table.filter((r) => r.company && r.company.length > 3 && !r.company.startsWith('---') && !['Meaning', 'Not contacted', 'DM sent', 'Responded', 'Call booked', 'Deal closed', 'Dead', 'On hold'].includes(r.company));
    }
    console.log(`  - ${output.pipeline.length} pipeline entries`);
  }

  // 9. Nexus Tasks
  const nexusTasks = readFile('02_NEXUS/PRODUCT/03_TASKS.md');
  if (nexusTasks) {
    output.tasks.nexus = parseChecklist(nexusTasks);
  }

  // 10. Hephaestus Focus
  const hephFocus = readFile('03_HEPHAESTUS/01_CURRENT_FOCUS.md');
  if (hephFocus) {
    output.currentFocus = output.currentFocus || {};
    output.currentFocus.hephaestus = hephFocus.slice(0, 500);
  }

  // 11. Xenon Focus
  const xenonFocus = readFile('04_XENON/01_CURRENT_FOCUS.md');
  if (xenonFocus) {
    output.currentFocus = output.currentFocus || {};
    output.currentFocus.xenon = xenonFocus.slice(0, 500);
  }

  // Write output
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`[generateCompanyData] Written to ${OUTPUT_PATH}`);
}

generate();
