/**
 * KITMED Typography System
 *
 * Professional medical platform typography following UX strategy
 * - Maximum font-weight: semibold (600)
 * - No font-extrabold or font-black
 * - Limited use of font-bold only for critical emphasis
 * - Medical professional appearance
 * - WCAG 2.1 AA compliant
 * - Cross-language support (English/French/Arabic)
 */

export const KITMED_TYPOGRAPHY = {
  // Page Headers - Professional hierarchy
  pageTitle: "text-2xl font-medium text-gray-900",
  sectionHeader: "text-lg font-medium text-gray-900",

  // Body Text - Readable and accessible
  bodyLarge: "text-base font-normal text-gray-700",
  bodyDefault: "text-sm font-normal text-gray-600",
  bodySmall: "text-xs font-normal text-gray-500",

  // Interactive Elements - Clear and actionable
  buttonPrimary: "text-sm font-medium",
  buttonSecondary: "text-sm font-normal",
  linkDefault: "text-sm font-normal text-blue-600 hover:text-blue-700",

  // Form Elements - User-friendly forms
  label: "text-sm font-medium text-gray-700",
  input: "text-sm font-normal",
  helpText: "text-xs font-normal text-gray-500",
  error: "text-xs font-medium text-red-600",

  // Data Display - Professional metrics
  metricValue: "text-3xl font-semibold text-gray-900",
  metricLabel: "text-xs font-medium text-gray-500 uppercase tracking-wider",
  tableHeader: "text-xs font-medium text-gray-500 uppercase tracking-wider",
  tableCell: "text-sm font-normal text-gray-900",

  // Cards & Components - Consistent hierarchy
  cardTitle: "text-lg font-medium text-gray-900",
  cardDescription: "text-sm text-gray-600",
  badgeDefault: "text-xs font-medium",

  // Navigation - Clear wayfinding
  navItem: "text-sm font-medium",
  navItemActive: "text-sm font-semibold",
  breadcrumb: "text-sm font-normal text-gray-500",

  // Status & Feedback - Clear communication
  statusText: "text-sm font-medium",
  alertTitle: "text-sm font-medium",
  alertDescription: "text-sm font-normal",

  // Special Elements
  logoText: "text-xl font-semibold",
  userInitials: "text-sm font-medium text-white",
} as const;

/**
 * Typography utility functions for dynamic usage
 */
export const getTypographyClass = (variant: keyof typeof KITMED_TYPOGRAPHY): string => {
  return KITMED_TYPOGRAPHY[variant];
};

/**
 * Responsive typography variants
 * For components that need different sizing across breakpoints
 */
export const RESPONSIVE_TYPOGRAPHY = {
  hero: "text-2xl font-medium text-gray-900 lg:text-3xl lg:font-semibold",
  pageTitle: "text-xl font-medium text-gray-900 lg:text-2xl",
  sectionTitle: "text-lg font-medium text-gray-900 lg:text-xl",
} as const;

/**
 * Typography presets for common component patterns
 */
export const TYPOGRAPHY_PRESETS = {
  // Dashboard components
  dashboardStats: {
    value: KITMED_TYPOGRAPHY.metricValue,
    label: KITMED_TYPOGRAPHY.metricLabel,
  },

  // Table components
  dataTable: {
    header: KITMED_TYPOGRAPHY.tableHeader,
    cell: KITMED_TYPOGRAPHY.tableCell,
  },

  // Card components
  infoCard: {
    title: KITMED_TYPOGRAPHY.cardTitle,
    description: KITMED_TYPOGRAPHY.cardDescription,
  },

  // Form components
  formField: {
    label: KITMED_TYPOGRAPHY.label,
    input: KITMED_TYPOGRAPHY.input,
    help: KITMED_TYPOGRAPHY.helpText,
    error: KITMED_TYPOGRAPHY.error,
  },
} as const;

export default KITMED_TYPOGRAPHY;