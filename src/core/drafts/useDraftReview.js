import { useCallback, useMemo, useState } from 'react';

// Draft status lifecycle
export const DRAFT_STATUSES = {
  GENERATED: 'generated',
  AWAITING_REVIEW: 'awaiting_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ARCHIVED: 'archived',
};

export const DRAFT_STATUS_LABELS = {
  generated: 'Generated',
  awaiting_review: 'Awaiting Review',
  approved: 'Approved',
  rejected: 'Rejected',
  archived: 'Archived',
};

const STORAGE_KEY = 'nexus_draft_statuses';

function loadStoredStatuses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredStatuses(statuses) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses));
  } catch { /* ignore */ }
}

// Country → language mapping for European markets
const COUNTRY_LANGUAGE = {
  DE: 'de', AT: 'de', CH: 'de',
  FR: 'fr', MC: 'fr',
  NL: 'nl', BE: 'nl',
  ES: 'es',
  IT: 'it',
  PT: 'pt',
};

function getLanguage(country) {
  return COUNTRY_LANGUAGE[(country || '').toUpperCase()] || 'en';
}

// Build a language-aware greeting from the founder field
function greeting(founderStr, lang) {
  if (!founderStr) {
    return lang === 'de' ? 'Hallo,' : lang === 'fr' ? 'Bonjour,' : lang === 'nl' ? 'Hallo,' : lang === 'es' ? 'Hola,' : lang === 'it' ? 'Ciao,' : 'Hi there,';
  }
  const names = founderStr.split(/[/,&]/).map((s) => s.trim().split(' ')[0]).filter(Boolean);
  if (names.length >= 3) {
    return lang === 'de' ? 'Hallo zusammen,' : lang === 'fr' ? 'Bonjour à tous,' : lang === 'nl' ? 'Hallo allemaal,' : lang === 'es' ? 'Hola a todos,' : lang === 'it' ? 'Ciao a tutti,' : 'Hi everyone,';
  }
  if (names.length === 2) {
    const [a, b] = names;
    return lang === 'de' ? `Hi ${a}, hi ${b},` : lang === 'fr' ? `Bonjour ${a} et ${b},` : lang === 'nl' ? `Hallo ${a} en ${b},` : lang === 'es' ? `Hola ${a} y ${b},` : lang === 'it' ? `Ciao ${a} e ${b},` : `Hi ${a} and ${b},`;
  }
  const name = names[0];
  return lang === 'de' ? `Hi ${name},` : lang === 'fr' ? `Bonjour ${name},` : lang === 'nl' ? `Hallo ${name},` : lang === 'es' ? `Hola ${name},` : lang === 'it' ? `Ciao ${name},` : `Hi ${name},`;
}

// Derive a language-aware subject line from lead data
export function generateSubject(lead) {
  const lang = getLanguage(lead.country);
  const company = lead.company || 'your brand';
  switch (lang) {
    case 'de': return `Kleine Idee zu Warenkorbabbrüchen bei ${company}`;
    case 'fr': return `Une idée pour ${company} — récupérer les paniers abandonnés`;
    case 'nl': return `Idee voor verloren omzet bij ${company}`;
    case 'es': return `Una idea para recuperar ventas perdidas en ${company}`;
    case 'it': return `Un'idea per recuperare carrelli abbandonati — ${company}`;
    default:   return `Quick idea on abandoned carts — ${company}`;
  }
}

// Generate a language-aware outreach email body from lead data
export function generateBody(lead) {
  const lang = getLanguage(lead.country);
  const company = lead.company || 'your brand';
  const salutation = greeting(lead.founder, lang);

  switch (lang) {
    case 'de':
      return `${salutation}

ich habe mir ${company} angesehen — tolle Marke mit klarer Positionierung.

Gerade bei kleineren Shops geht oft Umsatz verloren, wenn Warenkorbabbrüche und einfache Follow-up-Strecken nicht sauber abgefangen werden.

Ich helfe Shops dabei, genau diese verlorenen Käufe pragmatisch zurückzuholen, ohne den Store mit komplizierten Systemen zu überladen.

Falls das bei euch noch nicht wirklich sauber aufgesetzt ist, kann ich dir kurz zeigen, wo ich bei ${company} die größten Chancen sehe.

Wenn du magst, schreibe ich dir dazu eine kurze, konkrete Einschätzung.

Viele Grüße
Nicholas
AUREON`;

    case 'fr':
      return `${salutation}

J'ai découvert ${company} — une marque avec un positionnement clair et une belle identité.

Dans les boutiques de cette taille, il est fréquent de perdre du chiffre d'affaires faute d'un système efficace pour récupérer les paniers abandonnés.

J'aide les boutiques à récupérer ces ventes perdues de façon pragmatique, sans alourdir la structure existante.

Si ce n'est pas encore optimisé chez vous, je serais ravi de vous montrer où se trouvent les plus grandes opportunités pour ${company}.

Si vous le souhaitez, je peux vous envoyer une courte analyse concrète.

Cordialement,
Nicholas
AUREON`;

    case 'nl':
      return `${salutation}

Ik ben ${company} tegengekomen — een merk met een duidelijke positionering en sterke uitstraling.

Bij webshops van deze omvang gaat er vaak omzet verloren doordat verlaten winkelwagens niet goed worden opgevolgd.

Ik help shops om deze verloren verkopen op een praktische manier terug te halen, zonder complexe systemen toe te voegen.

Als dit bij jullie nog niet goed is ingericht, kan ik kort laten zien waar de grootste kansen liggen voor ${company}.

Als je wilt, stuur ik je een korte, concrete analyse.

Met vriendelijke groet,
Nicholas
AUREON`;

    case 'es':
      return `${salutation}

He descubierto ${company} — una marca con un posicionamiento claro y gran potencial.

En tiendas de este tamaño, es habitual perder ingresos por no recuperar los carritos abandonados de forma efectiva.

Ayudo a tiendas a recuperar esas ventas perdidas de manera práctica, sin añadir sistemas complejos.

Si todavía no está bien configurado en vuestra tienda, me encantaría mostrarte dónde están las mayores oportunidades para ${company}.

Si te parece bien, te mando un análisis breve y concreto.

Un saludo,
Nicholas
AUREON`;

    case 'it':
      return `${salutation}

Ho scoperto ${company} — un brand con un posizionamento chiaro e un'identità forte.

Per i negozi di queste dimensioni, è comune perdere fatturato senza un sistema efficace per recuperare i carrelli abbandonati.

Aiuto i negozi a recuperare queste vendite perse in modo pragmatico, senza appesantire la struttura esistente.

Se non è ancora ottimizzato nel vostro caso, sarei felice di mostrarvi dove si trovano le maggiori opportunità per ${company}.

Se volete, posso inviarvi una breve analisi concreta.

Cordiali saluti,
Nicholas
AUREON`;

    default:
      return `${salutation}

I came across ${company} — great brand, clear positioning.

Shops like yours often lose revenue when abandoned carts and simple follow-up sequences aren't properly set up.

I help founder-led stores recover those lost sales pragmatically, without overcomplicating the stack.

If that's not fully in place yet, I'd love to quickly show you where I see the biggest opportunities for ${company}.

Happy to send you a short, concrete breakdown if you're interested.

Best,
Nicholas
AUREON`;
  }
}

// Build structured draft objects from pipeline leads
export function buildDrafts(leads, storedStatuses) {
  return leads
    .filter((l) => l.draft === '✅' || (l.status && l.status.toLowerCase().includes('draft')))
    .map((lead) => {
      const id = `draft_${lead._}`;
      const storedStatus = storedStatuses[id];
      return {
        id,
        leadId: lead._,
        company: lead.company,
        founder: lead.founder,
        recipient: lead.founder
          ? `${lead.founder} — ${lead.company}`
          : lead.company,
        channel: lead.channel || 'Email',
        subject: generateSubject(lead),
        body: generateBody(lead),
        score: lead.score,
        notes: lead.notes,
        rawStatus: lead.status,
        draftStatus: storedStatus || DRAFT_STATUSES.AWAITING_REVIEW,
      };
    });
}

export function useDraftReview(leads) {
  const [storedStatuses, setStoredStatuses] = useState(() => loadStoredStatuses());
  const [selectedDraftId, setSelectedDraftId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('awaiting_review');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [notes, setNotes] = useState({});

  const drafts = useMemo(() => buildDrafts(leads, storedStatuses), [leads, storedStatuses]);

  const updateStatus = useCallback((draftId, newStatus) => {
    setStoredStatuses((prev) => {
      const next = { ...prev, [draftId]: newStatus };
      saveStoredStatuses(next);
      return next;
    });
    // Auto-deselect after action
    if (newStatus !== DRAFT_STATUSES.AWAITING_REVIEW) {
      setSelectedDraftId((prev) => (prev === draftId ? null : prev));
    }
  }, []);

  const approve = useCallback((draftId) => updateStatus(draftId, DRAFT_STATUSES.APPROVED), [updateStatus]);
  const reject = useCallback((draftId) => updateStatus(draftId, DRAFT_STATUSES.REJECTED), [updateStatus]);
  const archive = useCallback((draftId) => updateStatus(draftId, DRAFT_STATUSES.ARCHIVED), [updateStatus]);
  const returnToReview = useCallback((draftId) => updateStatus(draftId, DRAFT_STATUSES.AWAITING_REVIEW), [updateStatus]);

  const saveNote = useCallback((draftId, noteText) => {
    setNotes((prev) => ({ ...prev, [draftId]: noteText }));
    setEditingNoteId(null);
  }, []);

  const filteredDrafts = useMemo(() => {
    if (activeFilter === 'all') return drafts;
    return drafts.filter((d) => d.draftStatus === activeFilter);
  }, [drafts, activeFilter]);

  const counts = useMemo(() => ({
    all: drafts.length,
    awaiting_review: drafts.filter((d) => d.draftStatus === DRAFT_STATUSES.AWAITING_REVIEW).length,
    approved: drafts.filter((d) => d.draftStatus === DRAFT_STATUSES.APPROVED).length,
    rejected: drafts.filter((d) => d.draftStatus === DRAFT_STATUSES.REJECTED).length,
    archived: drafts.filter((d) => d.draftStatus === DRAFT_STATUSES.ARCHIVED).length,
  }), [drafts]);

  const selectedDraft = useMemo(
    () => drafts.find((d) => d.id === selectedDraftId) || null,
    [drafts, selectedDraftId]
  );

  return {
    drafts,
    filteredDrafts,
    selectedDraft,
    selectedDraftId,
    setSelectedDraftId,
    activeFilter,
    setActiveFilter,
    counts,
    approve,
    reject,
    archive,
    returnToReview,
    editingNoteId,
    setEditingNoteId,
    notes,
    saveNote,
  };
}
