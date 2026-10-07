/**
 * Centralized Agency Branding and PDF Metadata Configuration.
 * Consumes environment variables with production-ready fallbacks.
 */
export const AGENCY_CONFIG = {
  name: process.env.NEXT_PUBLIC_AGENCY_NAME || "Khas Travels",
  phone: process.env.NEXT_PUBLIC_AGENCY_PHONE || "0334-3020868",
  address:
    process.env.NEXT_PUBLIC_AGENCY_ADDRESS ||
    "Office No 5, Hyderabad Road, Mirpurkhas, Sindh",
  footerText:
    process.env.NEXT_PUBLIC_PDF_FOOTER_TEXT ||
    "Powered by Innosoft Technologies",
};
