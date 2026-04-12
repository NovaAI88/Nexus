// NEXUS Design Tokens v1.0
// Single source of truth for all design values.
// Use CSS variables in components — never hardcode hex values.

export const colors = {
  // Base (Dark Mode)
  bgBase: '#0D0D0F',
  bgSurface: '#161618',
  bgCard: '#1E1E21',
  bgHover: '#26262A',
  border: '#2A2A2F',
  borderSubtle: '#1F1F23',

  // Text
  textPrimary: '#F8F8FA',
  textSecondary: '#A0A0AB',
  textMuted: '#6B6B78',

  // Accent
  accent: '#6B6BF0',
  accentHover: '#5858D4',
  accentSubtle: 'rgba(107, 107, 240, 0.08)',
  accentMuted: '#9B8FF7',

  // Semantic
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#60A5FA',

  // Project palette
  projectColors: {
    indigo: '#6B6BF0',
    violet: '#9B5FE0',
    rose: '#E05F7E',
    amber: '#E0A040',
    teal: '#40C9A2',
    sky: '#4097E0',
  } as const,
} as const;

export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  12: '48px',
} as const;

export const radius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const;

export const typography = {
  fontPrimary: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', monospace",

  scale: {
    display:   { size: '32px', weight: 700, lineHeight: 1.2 },
    headingLg: { size: '24px', weight: 600, lineHeight: 1.3 },
    headingMd: { size: '20px', weight: 600, lineHeight: 1.35 },
    headingSm: { size: '16px', weight: 600, lineHeight: 1.4 },
    bodyLg:    { size: '16px', weight: 400, lineHeight: 1.6 },
    bodyMd:    { size: '14px', weight: 400, lineHeight: 1.6 },
    bodySm:    { size: '13px', weight: 400, lineHeight: 1.5 },
    caption:   { size: '12px', weight: 500, lineHeight: 1.4 },
    mono:      { size: '13px', weight: 400, lineHeight: 1.5 },
  },
} as const;

export const shadows = {
  card:     '0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)',
  elevated: '0 4px 16px rgba(0, 0, 0, 0.5)',
  modal:    '0 20px 60px rgba(0, 0, 0, 0.7)',
  focus:    '0 0 0 2px #6B6BF0',
  drag:     '0 8px 24px rgba(0, 0, 0, 0.6)',
} as const;

export const layout = {
  sidebarWidth: '240px',
  sidebarCollapsedWidth: '64px',
  contentPadding: '32px',
  maxContentWidth: '1200px',
} as const;

// CSS variable injection — call once at app root
export const cssVariables = `
  :root {
    /* Base */
    --bg-base: ${colors.bgBase};
    --bg-surface: ${colors.bgSurface};
    --bg-card: ${colors.bgCard};
    --bg-hover: ${colors.bgHover};
    --border: ${colors.border};
    --border-subtle: ${colors.borderSubtle};

    /* Text */
    --text-primary: ${colors.textPrimary};
    --text-secondary: ${colors.textSecondary};
    --text-muted: ${colors.textMuted};

    /* Accent */
    --accent: ${colors.accent};
    --accent-hover: ${colors.accentHover};
    --accent-subtle: ${colors.accentSubtle};
    --accent-muted: ${colors.accentMuted};

    /* Semantic */
    --success: ${colors.success};
    --warning: ${colors.warning};
    --error: ${colors.error};
    --info: ${colors.info};

    /* Shadows */
    --shadow-card: ${shadows.card};
    --shadow-elevated: ${shadows.elevated};
    --shadow-modal: ${shadows.modal};
    --shadow-focus: ${shadows.focus};
    --shadow-drag: ${shadows.drag};

    /* Radius */
    --radius-sm: ${radius.sm};
    --radius-md: ${radius.md};
    --radius-lg: ${radius.lg};
    --radius-xl: ${radius.xl};
    --radius-full: ${radius.full};

    /* Spacing */
    --space-1: ${spacing[1]};
    --space-2: ${spacing[2]};
    --space-3: ${spacing[3]};
    --space-4: ${spacing[4]};
    --space-5: ${spacing[5]};
    --space-6: ${spacing[6]};
    --space-8: ${spacing[8]};
    --space-12: ${spacing[12]};

    /* Layout */
    --sidebar-width: ${layout.sidebarWidth};
    --sidebar-collapsed-width: ${layout.sidebarCollapsedWidth};
    --content-padding: ${layout.contentPadding};
    --max-content-width: ${layout.maxContentWidth};

    /* Typography */
    --font-primary: ${typography.fontPrimary};
    --font-mono: ${typography.fontMono};
  }

  [data-theme="light"] {
    --bg-base: #FAFAFA;
    --bg-surface: #F0F0F2;
    --bg-card: #FFFFFF;
    --bg-hover: #E8E8EC;
    --border: #D4D4DA;
    --border-subtle: #E4E4E8;
    --text-primary: #0D0D0F;
    --text-secondary: #52525A;
    --text-muted: #8B8B96;
  }
`;
