/**
 * Safely escapes special regular expression characters in a string
 * to prevent Regular Expression Denial of Service (ReDoS) and unexpected regex behavior.
 *
 * @param {string} str - Raw user input string
 * @returns {string} - Escaped string safe for RegExp or MongoDB $regex
 */
const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = escapeRegex;
