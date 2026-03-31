// Try to load generated company data (from scripts/generateCompanyData.js)
let generatedData = null;
try {
  generatedData = require('../../data/companyData.generated.json');
} catch {
  // Generated data not available — use hardcoded defaults
}

/**
 * HARDCODED_STATE — fallback when generated data is unavailable.
 * Reflects actual truth as of 2026-03-31 (N1 kickoff).
 * This is the minimum viable state for the app to be meaningful.
 *
 * IMPORTANT: this should stay in sync with 01_NOVA/03_COMPANY_STATUS.md.
 * When generated data IS available, mergeGeneratedData() enriches this further.
 */
const HARDCODED_STATE = {
  // Schema version — bump when the shape changes to force localStorage refresh
  _schemaVersion: 2,
  departments: [
    {
      id: 'nexus',
      name: 'NEXUS',
      phase: 'N1 — Truth Sync + Company Intelligence',
      status: 'active',
      currentState: 'Phase 8.75 complete. Foundation clean. N1 Truth Sync in progress.',
      nextAction: 'Execute N1: build truth sync layer, connect dashboard to real company state.',
      blockers: [],
      urgency: 'high',
      lastUpdated: '2026-03-31T00:00:00.000Z',
      metrics: {},
    },
    {
      id: 'hephaestus',
      name: 'HEPHAESTUS',
      phase: 'VORTEX V4-P8 Complete → V1 Active',
      status: 'active',
      currentState: 'VORTEX V4-P8 Signal Metrics API complete. Full AETHER→VORTEX rename done. Paperclip installed and running.',
      nextAction: 'Execute V1: verification + observability + persistence loop.',
      blockers: [],
      urgency: 'normal',
      lastUpdated: '2026-03-31T00:00:00.000Z',
      metrics: {},
    },
    {
      id: 'xenon',
      name: 'XENON',
      phase: 'Phase 4 — Complete. Activation pending.',
      status: 'paused',
      currentState: 'Department structure complete. 27 launch strategy docs, campaign template, and channel tracker ready.',
      nextAction: 'Nicholas decides channel + format → first campaign.',
      blockers: ['Awaiting channel/format direction'],
      urgency: 'low',
      lastUpdated: '2026-03-31T00:00:00.000Z',
      metrics: {},
    },
    {
      id: 'aureon',
      name: 'AUREON',
      phase: 'A1 — First Revenue 🟡 Active',
      status: 'active',
      currentState: 'System fully operational. Target: €1,000 within 14 days (by April 14). Offer: Abandoned Cart Recovery — €500 setup + €150/month.',
      nextAction: 'Research 30 Shopify leads → send 20 DMs today.',
      blockers: [],
      urgency: 'critical',
      lastUpdated: '2026-03-31T00:00:00.000Z',
      metrics: { revenueTarget: 1000, revenueCurrency: 'EUR', revenueDeadline: 'April 14, 2026' },
    },
  ],
};

/**
 * Map product name (from COMPANY_STATUS) to department ID (used in app).
 * VORTEX is the active product under HEPHAESTUS, so it maps there.
 */
const PRODUCT_NAME_TO_DEPT_ID = {
  NEXUS: 'nexus',
  VORTEX: 'hephaestus',
  HEPHAESTUS: 'hephaestus',
  XENON: 'xenon',
  AUREON: 'aureon',
};

/**
 * Merge generated truth-layer data into the hardcoded base state.
 *
 * Priority:
 *   generated.products[]  → per-dept phase, currentState (from lastCompleted), nextAction (from nextStep), blockers
 *   generated.departments[] → fallback phase/blockers enrichment if products[] is empty
 *   generated._generated   → pipeline, backlog, tasks, nextActions, phaseTracker, blockers, calendar data
 */
function mergeGeneratedData(base, generated) {
  if (!generated) return base;

  const merged = { ...base, departments: base.departments.map((d) => ({ ...d })) };

  // Primary: enrich from products[] (parsed from 03_COMPANY_STATUS.md)
  if (generated.products?.length > 0) {
    // Build a map: deptId → first matching product (prefer direct match over HEPHAESTUS fallback)
    const productByDeptId = {};
    for (const product of generated.products) {
      const deptId = PRODUCT_NAME_TO_DEPT_ID[product.name] || product.deptId;
      if (!deptId) continue;
      // Prefer VORTEX over HEPHAESTUS for hephaestus dept (VORTEX is the active product)
      if (!productByDeptId[deptId] || product.name === 'VORTEX') {
        productByDeptId[deptId] = product;
      }
    }

    merged.departments = merged.departments.map((dept) => {
      const product = productByDeptId[dept.id];
      if (!product) return dept;

      const updatedDept = { ...dept };

      if (product.phase) {
        updatedDept.phase = product.phase;
      }
      if (product.nextStep) {
        updatedDept.nextAction = product.nextStep;
      }
      if (product.lastCompleted) {
        // Build a rich currentState from lastCompleted + health
        const healthSuffix = product.health ? ` ${product.health}.` : '';
        updatedDept.currentState = `${product.lastCompleted}.${healthSuffix}`;
      }
      if (product.blockers && product.blockers !== 'None' && product.blockers !== 'None — execution-ready') {
        updatedDept.blockers = [product.blockers];
      } else if (product.blockers === 'None' || product.blockers === 'None — execution-ready') {
        updatedDept.blockers = [];
      }
      if (product.target) {
        updatedDept.metrics = { ...updatedDept.metrics, target: product.target };
      }

      return updatedDept;
    });
  } else if (generated.departments?.length > 0) {
    // Fallback: enrich from legacy departments[] (parsed from 01_CURRENT_STATE.md)
    merged.departments = merged.departments.map((dept) => {
      const genDept = generated.departments.find(
        (g) => g.name.toLowerCase() === dept.name.toLowerCase()
      );
      if (genDept) {
        return {
          ...dept,
          phase: genDept.phase ? cleanMarkdown(genDept.phase) : dept.phase,
          blockers: genDept.blockers && genDept.blockers !== 'None'
            ? [cleanMarkdown(genDept.blockers)]
            : dept.blockers,
        };
      }
      return dept;
    });
  }

  // Attach all generated data for downstream use
  merged._generated = {
    pipeline: generated.pipeline || [],
    backlog: generated.backlog || {},
    tasks: generated.tasks || {},
    nextActions: generated.nextActions || [],
    phaseTracker: generated.phaseTracker || [],
    blockers: generated.blockers || [],
    currentFocus: generated.currentFocus || {},
    products: generated.products || [],
    phaseDeadlines: generated.phaseDeadlines || {},
    revenueMilestones: generated.revenueMilestones || [],
    lastGenerated: generated.lastGenerated,
  };

  return merged;
}

function cleanMarkdown(str) {
  if (!str) return '';
  return str
    .replace(/\*{1,2}([^*]*)\*{1,2}/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .trim();
}

export { mergeGeneratedData, cleanMarkdown };
export const INITIAL_COMPANY_STATE = mergeGeneratedData(HARDCODED_STATE, generatedData);
