/**
 * generateCompanyData.js
 *
 * Build-time script that reads markdown files from the company workspace
 * and outputs structured JSON for the NEXUS web app.
 *
 * Usage: node scripts/generateCompanyData.js
 * Runs automatically as prebuild/prestart via package.json.
 */

const fs = require('fs');
const path = require('path');

// Resolve company root (3 levels up from nexus-ui)
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
    if (line.startsWith(prefix)) {
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

// ─── Main ───

function generate() {
  console.log('[generateCompanyData] Reading company data...');

  const output = {
    departments: [],
    backlog: {},
    pipeline: [],
    tasks: {},
    blockers: [],
    nextActions: [],
    phaseTracker: [],
    lastGenerated: new Date().toISOString(),
  };

  // 1. Current State
  const currentState = readFile('05_shared/01_CURRENT_STATE.md');
  if (currentState) {
    const sections = extractSections(currentState, 2);
    for (const [heading, content] of Object.entries(sections)) {
      // Try to extract department info from headings like "NEXUS (Product)" or "VORTEX (Trading)"
      const deptMatch = heading.match(/^(\w+)\s*\(/);
      if (deptMatch) {
        const name = deptMatch[1];
        const phaseMatch = content.match(/Phase[:\s]+(.+?)(?:\n|$)/i);
        const statusMatch = content.match(/Status[:\s]+(.+?)(?:\n|$)/i);
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
  }

  // 2. Next Actions
  const nextActions = readFile('05_shared/03_NEXT_ACTIONS.md');
  if (nextActions) {
    const sections = extractSections(nextActions, 3);
    let priority = 1;
    for (const [heading, content] of Object.entries(sections)) {
      output.nextActions.push({
        priority,
        title: heading,
        details: content.slice(0, 200),
      });
      priority++;
    }
  }

  // 3. Phase Tracker
  const phaseTracker = readFile('05_shared/04_PHASE_TRACKER.md');
  if (phaseTracker) {
    const table = parseMarkdownTable(phaseTracker);
    output.phaseTracker = table;
  }

  // 4. Blockers
  const blockers = readFile('05_shared/05_BLOCKERS.md');
  if (blockers) {
    output.blockers = parseBullets(blockers).filter((b) => b.length > 0);
  }

  // 5. Hephaestus Backlog
  const hephBacklog = readFile('03_HEPHAESTUS/04_BACKLOG.md');
  if (hephBacklog) {
    const items = parseChecklist(hephBacklog);
    if (items.length > 0) {
      output.backlog.hephaestus = items;
    } else {
      // Try bullet parsing
      output.backlog.hephaestus = parseBullets(hephBacklog)
        .map((text) => ({ done: false, text }));
    }
  }

  // 6. Aureon Pipeline
  const pipeline = readFile('06_AUREON/04_tracking/pipeline.md');
  if (pipeline) {
    const table = parseMarkdownTable(pipeline);
    if (table.length > 0) {
      output.pipeline = table;
    }
  }

  // 7. Nexus Tasks
  const nexusTasks = readFile('02_NEXUS/PRODUCT/03_TASKS.md');
  if (nexusTasks) {
    const items = parseChecklist(nexusTasks);
    output.tasks.nexus = items;
  }

  // 8. Hephaestus Focus
  const hephFocus = readFile('03_HEPHAESTUS/01_CURRENT_FOCUS.md');
  if (hephFocus) {
    output.currentFocus = output.currentFocus || {};
    output.currentFocus.hephaestus = hephFocus.slice(0, 500);
  }

  // 9. Xenon Focus
  const xenonFocus = readFile('04_XENON/01_CURRENT_FOCUS.md');
  if (xenonFocus) {
    output.currentFocus = output.currentFocus || {};
    output.currentFocus.xenon = xenonFocus.slice(0, 500);
  }

  // Write output
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`[generateCompanyData] Written to ${OUTPUT_PATH}`);
  console.log(`  - ${output.departments.length} departments from shared state`);
  console.log(`  - ${output.nextActions.length} next actions`);
  console.log(`  - ${output.pipeline.length} pipeline entries`);
  console.log(`  - ${Object.keys(output.backlog).length} backlog sources`);
}

generate();
