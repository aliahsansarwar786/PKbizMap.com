/**
 * Slugify a string according to BizPrimeHub technical SEO rules:
 * - Full business name, never shortened, cut or abbreviated
 * - All lowercase
 * - Only a-z, 0-9, and hyphens
 * - No leading, trailing, or double hyphens
 * - No length limit that truncates the name
 *
 * Examples:
 * "Alpha Pro Web Solutions" -> "alpha-pro-web-solutions"
 * "Tasty Zaiqa Restaurant" -> "tasty-zaiqa-restaurant"
 * "New Karachi Biryani & BBQ House" -> "new-karachi-biryani-bbq-house"
 */
function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a unique slug for a business:
 * 1. Base slug from title.
 * 2. If already taken by another business:
 *    - append slugified city: `${baseSlug}-${citySlug}`
 * 3. If still taken:
 *    - append `-2`, `-3`, etc.
 */
async function generateUniqueSlug(title, city, existingDocId, BusinessModel) {
  const baseSlug = slugify(title) || 'business';

  // Check if baseSlug is available
  const baseTaken = await BusinessModel.findOne({
    slug: baseSlug,
    ...(existingDocId ? { _id: { $ne: existingDocId } } : {}),
  }).select('_id').lean();

  if (!baseTaken) {
    return baseSlug;
  }

  // Base is taken, try appending city
  const citySlug = slugify(city);
  const cityCandidate = citySlug ? `${baseSlug}-${citySlug}` : `${baseSlug}-1`;

  const cityTaken = await BusinessModel.findOne({
    slug: cityCandidate,
    ...(existingDocId ? { _id: { $ne: existingDocId } } : {}),
  }).select('_id').lean();

  if (!cityTaken) {
    return cityCandidate;
  }

  // City candidate is taken, append -2, -3, ...
  const prefix = citySlug ? `${baseSlug}-${citySlug}` : baseSlug;
  let counter = 2;
  while (true) {
    const candidate = `${prefix}-${counter}`;
    const taken = await BusinessModel.findOne({
      slug: candidate,
      ...(existingDocId ? { _id: { $ne: existingDocId } } : {}),
    }).select('_id').lean();

    if (!taken) {
      return candidate;
    }
    counter++;
  }
}

module.exports = {
  slugify,
  generateUniqueSlug,
};
