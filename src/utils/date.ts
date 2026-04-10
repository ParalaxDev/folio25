/**
 * Formats a date into a localized string using en-GB locale
 * in format: "D MMM YYYY" (e.g. "15 Jan 2024")
 */
export const formatDate = (date: Date): string => {
  if (!date || isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
};
