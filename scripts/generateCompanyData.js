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

function extractSections(md, level = 2) {
  const prefix = '#'.repeat(level) + ' ';
  const sections = {};
  let currentHeading = null;
  let currentContent = [];

  for (const line of md.split('\n')) {
    if (line.startsWith(prefix) && !line.startsWith(prefix + '#')) {
      if (currentHeading) sections[currentHeading] = currentContent.join('\n').trim();
      currentHeading = line.slice(prefix.length).trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }
  if (currentHeading) sections[currentHeading] = currentContent.join('\n').trim();
  return sections;
}

function parseMarkdownTable(text) {
  const lines = text.split('\n').filter((l) => l.trim().startsWith('|'));
  if (lines.length < 2) return [];

  const headers = lines[0]
    .split('|')
    .map((h) => h.trim())
    .filter(Boolean);

  const dataLines = lines.slice(1).filter((l) => !l.match(/^\|(?:\s*[:-]+\s*\|)+\s*$/));

  return dataLines.map((line) => {
    const cells = line.split('|').map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length);
    const row = {};
    headers.forEach((h, i) => {
      row[h.toLowerCase().replace(/[^a-z0-9]/g, '_')] = cells[i] || '';
    });
    return row;
  });
}

function parseChecklist(text) {
  const items = [];
  for (const line of text.split('\n')) {
    const match = line.match(/^-\s*\[([ xX✅⏳])]\s*(.+)/);
    if (match) items.push({ done: match[1] !== ' ', text: match[2].trim() });
  }
  return items;
}

function parseBullets(text) {
  return text
    .split('\n')
    .filter((l) => l.match(/^[-*]\s+/))
    .map((l) => l.replace(/^[-*]\s+/, '').trim());
}

function cleanMarkdown(str) {
  if (!str) return '';
  return str
    .replace(/\*{1,2}([^*]*)\*{1,2}/g, '$1')
    .replace(/_{1,2}([^_]*)_{1,2}/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/✅|⏳|🟡|🔴|🟢|⏸️|🎯/g, '')
    .trim();
}

function extractTableValue(tableText, fieldName) {
  const lines = tableText.split('\n').filter((l) => l.trim().startsWith('|'));
  for (const line of lines) {
    const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
    if (cells.length >= 2) {
      const key = cleanMarkdown(cells[0]).toLowerCase();
      if (key === fieldName.toLowerCase()) return cleanMarkdown(cells[1]);
    }
  }
  return '';
}

function extractLabeledValue(text, label) {
  const regex = new RegExp(`(?:^|\\n)\\s*\\*{0,2}${label}[:\\s*]+\\*{0,2}(.+?)(?:\\n|$)`, 'i');
  const match = text.match(regex);
  return match ? cleanMarkdown(match[1]) : '';
}

const PRODUCT_TO_DEPT_ID = {
  NEXUS: 'nexus',
  VORTEX: 'hephaestus',
  HEPHAESTUS: 'hephaestus',
  XENON: 'xenon',
  AUREON: 'aureon',
};

function parseCompanyStatus(md) {
  if (!md) return [];
  const sections = extractSections(md, 2);
  const products = [];

  for (const [heading, content] of Object.entries(sections)) {
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

function parseCalendar(md) {
  if (!md) return { phaseDeadlines: {}, revenueMilestones: [] };

  const sections = extractSections(md, 2);
  const phaseDeadlines = {};
  const revenueMilestones = [];

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

  const phaseSection = sections['Phase Deadlines'] || '';
  const subSections = extractSections(phaseSection, 3);
  for (const [heading, content] of Object.entries(subSections)) {
    const nameMatch = heading.match(/^([A-Z][A-Z0-9_]+)/);
    if (!nameMatch) continue;
    const name = nameMatch[1].toLowerCase();
    const rows = parseMarkdownTable(content);
    if (rows.length > 0) {
      phaseDeadlines[name] = rows.map((r) => ({
        phase: cleanMarkdown(r.phase || ''),
        start: cleanMarkdown(r.start || ''),
        targetEnd: cleanMarkdown(r.target_end || r['target end'] || ''),
        status: cleanMarkdown(r.status || ''),
      })).filter((r) => r.phase);
    }
  }

  return { phaseDeadlines, revenueMilestones };
}

function parseCurrentState(md) {
  if (!md) return [];
  const sections = extractSections(md, 2);
  const departments = [];

  for (const [heading, content] of Object.entries(sections)) {
    const deptMatch = heading.match(/^([A-Z][A-Z0-9_]+)/);
    if (!deptMatch) continue;

    const name = deptMatch[1];
    const phase = extractLabeledValue(content, 'Phase');
    const status = extractLabeledValue(content, 'Status') || 'active';
    const blockers = extractLabeledValue(content, 'Blockers') || extractLabeledValue(content, 'Blocker');

    departments.push({
      name,
      phase,
      status,
      blockers: blockers || 'None',
      source: 'current_state',
    });
  }

  return departments;
}

function parsePhaseTracker(md) {
  if (!md) return [];
  const rows = parseMarkdownTable(md);
  return rows.filter((row) => {
    const field = cleanMarkdown(row.field || '');
    const project = cleanMarkdown(row.project || '');
    if (!field && !project) return false;
    if (field === 'Field' || project === 'Project') return false;
    return true;
  });
}

function parsePipeline(md) {
  if (!md) return [];
  const table = parseMarkdownTable(md);
  return table.filter((r) => {
    const company = cleanMarkdown(r.company || '');
    const marker = cleanMarkdown(r._ || '');
    if (!company || company.length <= 2) return false;
    if (company === 'Current' || company === 'Meaning' || company === '---') return false;
    if (marker === 'Metric' || marker === '---') return false;
    return true;
  });
}

function generate() {
  console.log('[generateCompanyData] Reading company truth layer...');

  const output = {
    products: [],
    phaseDeadlines: {},
    revenueMilestones: [],
    departments: [],
    backlog: {},
    pipeline: [],
    tasks: {},
    blockers: [],
    nextActions: [],
    phaseTracker: [],
    lastGenerated: new Date().toISOString(),
  };

  const companyStatus = readFile('01_NOVA/03_COMPANY_STATUS.md');
  if (companyStatus) {
    output.products = parseCompanyStatus(companyStatus);
    console.log(`  - ${output.products.length} products from company status`);
  }

  const calendarMd = readFile('CALENDAR.md');
  if (calendarMd) {
    const { phaseDeadlines, revenueMilestones } = parseCalendar(calendarMd);
    output.phaseDeadlines = phaseDeadlines;
    output.revenueMilestones = revenueMilestones;
    console.log(`  - ${revenueMilestones.length} revenue milestones from calendar`);
  }

  const currentState = readFile('05_shared/01_CURRENT_STATE.md');
  if (currentState) {
    output.departments = parseCurrentState(currentState);
    console.log(`  - ${output.departments.length} departments from current state`);
  }

  const nextActions = readFile('05_shared/03_NEXT_ACTIONS.md');
  if (nextActions) {
    const sections = extractSections(nextActions, 3);
    let priority = 1;
    for (const [heading, content] of Object.entries(sections)) {
      output.nextActions.push({ priority, title: heading, details: content.slice(0, 300) });
      priority++;
    }
    console.log(`  - ${output.nextActions.length} next actions`);
  }

  const phaseTracker = readFile('05_shared/04_PHASE_TRACKER.md');
  if (phaseTracker) output.phaseTracker = parsePhaseTracker(phaseTracker);

  const blockers = readFile('05_shared/05_BLOCKERS.md');
  if (blockers) {
    output.blockers = parseBullets(blockers).filter((b) => b.length > 0);
    if (output.blockers.length > 0) console.log(`  - ${output.blockers.length} blockers`);
  }

  const hephBacklog = readFile('03_HEPHAESTUS/04_BACKLOG.md');
  if (hephBacklog) {
    const items = parseChecklist(hephBacklog);
    output.backlog.hephaestus = items.length > 0 ? items : parseBullets(hephBacklog).map((text) => ({ done: false, text }));
  }

  const pipeline = readFile('06_AUREON/04_tracking/pipeline.md');
  if (pipeline) {
    output.pipeline = parsePipeline(pipeline);
    console.log(`  - ${output.pipeline.length} pipeline entries`);
  }

  const nexusTasks = readFile('02_NEXUS/PRODUCT/03_TASKS.md');
  if (nexusTasks) output.tasks.nexus = parseChecklist(nexusTasks);

  const hephFocus = readFile('03_HEPHAESTUS/01_CURRENT_FOCUS.md');
  if (hephFocus) {
    output.currentFocus = output.currentFocus || {};
    output.currentFocus.hephaestus = hephFocus.slice(0, 500);
  }

  const xenonFocus = readFile('04_XENON/01_CURRENT_FOCUS.md');
  if (xenonFocus) {
    output.currentFocus = output.currentFocus || {};
    output.currentFocus.xenon = xenonFocus.slice(0, 500);
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`[generateCompanyData] Written to ${OUTPUT_PATH}`);
}

generate();
