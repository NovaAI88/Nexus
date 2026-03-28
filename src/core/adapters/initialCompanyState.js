// Try to load generated company data (from scripts/generateCompanyData.js)
let generatedData = null;
try {
  generatedData = require('../../data/companyData.generated.json');
} catch {
  // Generated data not available — use hardcoded defaults
}

const HARDCODED_STATE = {
  departments: [
    {
      id: 'nexus',
      name: 'NEXUS',
      phase: 'Phase 9 — Context Bridge',
      status: 'active',
      currentState: 'Phase 8.75 complete. Foundation clean. Execution OS upgrade in progress.',
      nextAction: 'Complete Phase 3 execution engine and premium UI upgrade.',
      blockers: [],
      urgency: 'normal',
      lastUpdated: '2026-03-27T00:00:00.000Z',
      metrics: {},
    },
    {
      id: 'hephaestus',
      name: 'HEPHAESTUS',
      phase: 'V4-P7C — RANGE Intelligence Phase 2 Complete',
      status: 'active',
      currentState: 'VORTEX Phase 2 implemented and verified. 10/10 deterministic tests passing. Full suite 13 files / 30 tests passed.',
      nextAction: 'Resume VORTEX with evidence-first verification sequence, then define Phase 3 RANGE plan.',
      blockers: [],
      urgency: 'normal',
      lastUpdated: '2026-03-25T00:00:00.000Z',
      metrics: {},
    },
    {
      id: 'xenon',
      name: 'XENON',
      phase: 'Phase 4 — Complete',
      status: 'paused',
      currentState: 'Department structure complete. Campaign template and channel tracker ready.',
      nextAction: 'Decide channel (Twitter/X or LinkedIn) and first content format to unblock first campaign.',
      blockers: ['Channel decision pending'],
      urgency: 'low',
      lastUpdated: '2026-03-22T00:00:00.000Z',
      metrics: {},
    },
    {
      id: 'aureon',
      name: 'AUREON',
      phase: 'Phase 1 — Active Execution',
      status: 'active',
      currentState: 'System built and operational. Target: €1,000 within 72 hours. Offer: Abandoned Cart Recovery.',
      nextAction: 'Run lead analysis on 10 Shopify stores and send 10 DMs today.',
      blockers: [],
      urgency: 'critical',
      lastUpdated: '2026-03-26T00:00:00.000Z',
      metrics: { revenueTarget: 1000, revenueCurrency: 'EUR' },
    },
  ],
};

// Merge generated data into hardcoded state
function mergeGeneratedData(base, generated) {
  if (!generated) return base;

  const merged = { ...base };

  // Enrich departments with generated data
  if (generated.departments?.length > 0) {
    merged.departments = base.departments.map((dept) => {
      const genDept = generated.departments.find(
        (g) => g.name.toLowerCase() === dept.name.toLowerCase()
      );
      if (genDept) {
        return {
          ...dept,
          phase: cleanMarkdown(genDept.phase) || dept.phase,
          blockers: genDept.blockers && genDept.blockers !== 'None'
            ? [cleanMarkdown(genDept.blockers)]
            : dept.blockers,
        };
      }
      return dept;
    });
  }

  // Attach extra data
  merged._generated = {
    pipeline: generated.pipeline || [],
    backlog: generated.backlog || {},
    tasks: generated.tasks || {},
    nextActions: generated.nextActions || [],
    phaseTracker: generated.phaseTracker || [],
    blockers: generated.blockers || [],
    currentFocus: generated.currentFocus || {},
    lastGenerated: generated.lastGenerated,
  };

  return merged;
}

function cleanMarkdown(str) {
  if (!str) return '';
  return str.replace(/^\*{1,2}\s*/, '').replace(/\s*\*{1,2}$/, '').trim();
}

export const INITIAL_COMPANY_STATE = mergeGeneratedData(HARDCODED_STATE, generatedData);
