/**
 * N1 Truth Sync — unit tests
 *
 * Tests the core sync logic:
 *   1. mergeGeneratedData — enriches hardcoded state from truth-layer products[]
 *   2. isStaleState detection (via schema version and lastGenerated)
 *   3. cleanMarkdown utility
 *   4. Pipeline filtering (legend rows stripped)
 */

import { mergeGeneratedData, cleanMarkdown } from '../initialCompanyState';

// ─── cleanMarkdown ───────────────────────────────────────────────────────────

describe('cleanMarkdown', () => {
  it('strips bold markers', () => {
    expect(cleanMarkdown('**Phase 8.75**')).toBe('Phase 8.75');
  });

  it('strips inline code', () => {
    expect(cleanMarkdown('`nexus-ui`')).toBe('nexus-ui');
  });

  it('handles empty string', () => {
    expect(cleanMarkdown('')).toBe('');
    expect(cleanMarkdown(null)).toBe('');
  });

  it('trims whitespace', () => {
    expect(cleanMarkdown('  hello  ')).toBe('hello');
  });
});

// ─── mergeGeneratedData ───────────────────────────────────────────────────────

const BASE_STATE = {
  _schemaVersion: 2,
  departments: [
    {
      id: 'nexus',
      name: 'NEXUS',
      phase: 'Hardcoded Phase',
      status: 'active',
      currentState: 'Hardcoded state',
      nextAction: 'Hardcoded action',
      blockers: [],
      urgency: 'normal',
      lastUpdated: '2026-03-01T00:00:00.000Z',
      metrics: {},
    },
    {
      id: 'aureon',
      name: 'AUREON',
      phase: 'Hardcoded Aureon Phase',
      status: 'active',
      currentState: 'Hardcoded aureon state',
      nextAction: 'Hardcoded aureon action',
      blockers: [],
      urgency: 'critical',
      lastUpdated: '2026-03-01T00:00:00.000Z',
      metrics: {},
    },
  ],
};

const GENERATED_WITH_PRODUCTS = {
  products: [
    {
      name: 'NEXUS',
      deptId: 'nexus',
      phase: 'N1 — Truth Sync + Company Intelligence',
      lastCompleted: 'Signal Metrics API complete',
      nextStep: 'Execute N1: build truth sync layer',
      blockers: 'None',
      target: '',
      health: 'Foundation complete, ready for N1',
      source: 'company_status',
    },
    {
      name: 'AUREON',
      deptId: 'aureon',
      phase: 'A1 — First Revenue Active',
      lastCompleted: 'Full system built',
      nextStep: 'Research 30 Shopify leads',
      blockers: 'None — execution-ready',
      target: '€1,000 within 14 days',
      health: 'System ready',
      source: 'company_status',
    },
  ],
  pipeline: [],
  backlog: {},
  tasks: {},
  nextActions: [{ priority: 1, title: '1. NEXUS N1', details: 'details' }],
  phaseTracker: [],
  blockers: [],
  currentFocus: {},
  phaseDeadlines: { nexus: [{ phase: 'N1 — Truth Sync', start: 'April 7, 2026', targetEnd: 'April 11, 2026', status: 'Pending' }] },
  revenueMilestones: [{ target: 'AUREON First Revenue', amount: '€1,000', deadline: 'April 14, 2026', status: 'In Progress' }],
  lastGenerated: '2026-03-31T12:00:00.000Z',
};

describe('mergeGeneratedData', () => {
  it('returns base state unchanged when generated is null', () => {
    const result = mergeGeneratedData(BASE_STATE, null);
    expect(result.departments[0].phase).toBe('Hardcoded Phase');
  });

  it('enriches phase from products[] when available', () => {
    const result = mergeGeneratedData(BASE_STATE, GENERATED_WITH_PRODUCTS);
    expect(result.departments[0].phase).toBe('N1 — Truth Sync + Company Intelligence');
  });

  it('enriches nextAction from products[].nextStep', () => {
    const result = mergeGeneratedData(BASE_STATE, GENERATED_WITH_PRODUCTS);
    expect(result.departments[0].nextAction).toBe('Execute N1: build truth sync layer');
  });

  it('clears blockers when product says None', () => {
    const result = mergeGeneratedData(BASE_STATE, GENERATED_WITH_PRODUCTS);
    expect(result.departments[0].blockers).toEqual([]);
  });

  it('adds AUREON target to metrics', () => {
    const result = mergeGeneratedData(BASE_STATE, GENERATED_WITH_PRODUCTS);
    const aureon = result.departments.find((d) => d.id === 'aureon');
    expect(aureon.metrics.target).toBe('€1,000 within 14 days');
  });

  it('attaches _generated block with all truth-layer data', () => {
    const result = mergeGeneratedData(BASE_STATE, GENERATED_WITH_PRODUCTS);
    expect(result._generated).toBeDefined();
    expect(result._generated.nextActions).toHaveLength(1);
    expect(result._generated.revenueMilestones).toHaveLength(1);
    expect(result._generated.phaseDeadlines.nexus).toHaveLength(1);
    expect(result._generated.lastGenerated).toBe('2026-03-31T12:00:00.000Z');
  });

  it('prefers VORTEX over HEPHAESTUS for hephaestus dept', () => {
    const stateWithHeph = {
      ...BASE_STATE,
      departments: [
        ...BASE_STATE.departments,
        {
          id: 'hephaestus',
          name: 'HEPHAESTUS',
          phase: 'Old Heph Phase',
          status: 'active',
          currentState: '',
          nextAction: '',
          blockers: [],
          urgency: 'normal',
          lastUpdated: '2026-03-01T00:00:00.000Z',
          metrics: {},
        },
      ],
    };
    const generatedWithBoth = {
      ...GENERATED_WITH_PRODUCTS,
      products: [
        ...GENERATED_WITH_PRODUCTS.products,
        {
          name: 'VORTEX',
          deptId: 'hephaestus',
          phase: 'V4-P8 Complete → V1',
          lastCompleted: 'Signal Metrics API',
          nextStep: 'Execute V1',
          blockers: 'None',
          target: '',
          health: 'Ready for V1',
          source: 'company_status',
        },
        {
          name: 'HEPHAESTUS',
          deptId: 'hephaestus',
          phase: 'Phase 3 Complete',
          lastCompleted: 'Dept populated',
          nextStep: 'Supports VORTEX V1',
          blockers: 'None',
          target: '',
          health: 'Complete',
          source: 'company_status',
        },
      ],
    };
    const result = mergeGeneratedData(stateWithHeph, generatedWithBoth);
    const heph = result.departments.find((d) => d.id === 'hephaestus');
    // VORTEX should win over HEPHAESTUS for this department
    expect(heph.phase).toBe('V4-P8 Complete → V1');
    expect(heph.nextAction).toBe('Execute V1');
  });

  it('falls back to departments[] enrichment if products[] is empty', () => {
    const generatedLegacy = {
      products: [],
      departments: [{ name: 'NEXUS', phase: 'Legacy Phase', status: 'active', blockers: 'None', source: 'current_state' }],
      pipeline: [], backlog: {}, tasks: {}, nextActions: [], phaseTracker: [],
      blockers: [], currentFocus: {}, phaseDeadlines: {}, revenueMilestones: [],
      lastGenerated: '2026-03-31T12:00:00.000Z',
    };
    const result = mergeGeneratedData(BASE_STATE, generatedLegacy);
    expect(result.departments[0].phase).toBe('Legacy Phase');
  });
});

// ─── Generated JSON structural check ─────────────────────────────────────────

describe('companyData.generated.json structure', () => {
  let generated;

  beforeAll(() => {
    generated = require('../../../data/companyData.generated.json');
  });

  it('has products array with at least 4 entries', () => {
    expect(generated.products).toBeDefined();
    expect(generated.products.length).toBeGreaterThanOrEqual(4);
  });

  it('has NEXUS product with N1 phase and N2 nextStep', () => {
    const nexus = generated.products.find((p) => p.name === 'NEXUS');
    expect(nexus).toBeDefined();
    // N1 is now complete — phase reflects it, nextStep points forward to N2
    expect(nexus.phase).toContain('N1');
    expect(nexus.nextStep).toContain('N2');
  });

  it('has AUREON product with revenue target', () => {
    const aureon = generated.products.find((p) => p.name === 'AUREON');
    expect(aureon).toBeDefined();
    expect(aureon.target).toContain('€');
  });

  it('has phaseDeadlines.nexus with N1 entry', () => {
    expect(generated.phaseDeadlines).toBeDefined();
    expect(generated.phaseDeadlines.nexus).toBeDefined();
    const n1 = generated.phaseDeadlines.nexus.find((p) => p.phase?.startsWith('N1'));
    expect(n1).toBeDefined();
  });

  it('has revenueMilestones with AUREON first revenue', () => {
    expect(generated.revenueMilestones).toBeDefined();
    const aureonMilestone = generated.revenueMilestones.find(
      (m) => m.target?.includes('AUREON') && m.amount === '€1,000'
    );
    expect(aureonMilestone).toBeDefined();
  });

  it('has pipeline with real leads (no legend rows)', () => {
    expect(generated.pipeline).toBeDefined();
    // Legend rows like "Not contacted", "DM sent" should be filtered out
    const legendRows = generated.pipeline.filter(
      (r) => ['Meaning', 'Not contacted', 'DM sent', 'Responded'].includes(r.company)
    );
    expect(legendRows).toHaveLength(0);
    // Should have real company names
    expect(generated.pipeline.length).toBeGreaterThan(5);
  });

  it('has lastGenerated timestamp', () => {
    expect(generated.lastGenerated).toBeDefined();
    expect(new Date(generated.lastGenerated).getFullYear()).toBeGreaterThanOrEqual(2026);
  });
});
