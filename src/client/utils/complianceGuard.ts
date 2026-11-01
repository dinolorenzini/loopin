export interface ComplianceCheckResult {
  isSafe: boolean;
  warning?: string;
  piiType?: "email" | "phone" | "ssn_id" | "address" | "external_contact";
}

// Regex patterns for PII detection
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/;
const SSN_REGEX = /\b\d{3}[-]?\d{2}[-]?\d{4}\b/;
const STREET_REGEX = /\b\d{1,5}\s+(?:[a-zA-Z]+\s+){1,3}(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|court|ct|lane|ln|way|terrace|ter|place|pl|circle|cir|highway|hwy)\b/i;
const EXTERNAL_CONTACT_REGEX = /\b(snapchat|snap:|instagram|insta:|ig:|tiktok|discord:|phone\s*number|my\s*address|what(?:'s|\s+is)\s+your\s+(?:number|address|real\s+name))\b/i;

/**
 * Checks text for PII or child-safety violations under COPPA, FERPA, and GDPR.
 */
export function checkMessageCompliance(
  text: string,
  isChildMode: boolean,
  isFerpaMode: boolean
): ComplianceCheckResult {
  if (!text || typeof text !== "string") {
    return { isSafe: true };
  }

  // 1. Email check
  if (EMAIL_REGEX.test(text)) {
    return {
      isSafe: false,
      piiType: "email",
      warning: isChildMode
        ? "🛡️ COPPA Protection: Email addresses cannot be sent to protect child privacy."
        : isFerpaMode
        ? "🎓 FERPA Warning: Sharing email addresses may disclose student directory information."
        : "⚠️ Privacy Warning: Your message appears to contain an email address.",
    };
  }

  // 2. Phone check
  if (PHONE_REGEX.test(text)) {
    return {
      isSafe: false,
      piiType: "phone",
      warning: isChildMode
        ? "🛡️ COPPA Protection: Phone numbers cannot be shared in child-safe mode."
        : isFerpaMode
        ? "🎓 FERPA Warning: Phone numbers are considered student PII under 34 CFR § 99.3."
        : "⚠️ Privacy Warning: Your message appears to contain a telephone number.",
    };
  }

  // 3. SSN / Government ID check
  if (SSN_REGEX.test(text)) {
    return {
      isSafe: false,
      piiType: "ssn_id",
      warning: "🛑 Security Warning: Never share Social Security or national identification numbers.",
    };
  }

  // 4. Physical Street Address check
  if (STREET_REGEX.test(text)) {
    return {
      isSafe: false,
      piiType: "address",
      warning: isChildMode
        ? "🛡️ COPPA Protection: Physical addresses cannot be shared."
        : "⚠️ Privacy Notice: This message contains a physical street address.",
    };
  }

  // 5. In COPPA Child Mode, also guard against solicitations of external contact handles
  if (isChildMode && EXTERNAL_CONTACT_REGEX.test(text)) {
    return {
      isSafe: false,
      piiType: "external_contact",
      warning: "🛡️ Child-Safe Guard: Sharing social handles or soliciting personal contact is disabled for your protection.",
    };
  }

  return { isSafe: true };
}
