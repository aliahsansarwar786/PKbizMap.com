/**
 * Best-effort, fire-and-forget activity logger for admin actions.
 * Never throws, never awaits in a blocking way, and silently catches all errors.
 *
 * @param {Object} params
 * @param {string|Object} params.actorId
 * @param {string} params.actorName
 * @param {string} params.action
 * @param {string} params.targetType
 * @param {string|Object} [params.targetId]
 * @param {string} [params.targetLabel]
 * @param {string} [params.details]
 */
function logActivity({
  actorId,
  actorName,
  action,
  targetType,
  targetId = null,
  targetLabel = '',
  details = '',
}) {
  try {
    if (!actorId || !action || !targetType) return;

    setImmediate(async () => {
      try {
        const ActivityLog = require('../models/ActivityLog');
        await ActivityLog.create({
          actor: actorId,
          actorName: actorName || 'Admin',
          action,
          targetType,
          targetId: targetId || null,
          targetLabel: targetLabel ? String(targetLabel).slice(0, 300) : '',
          details: details ? String(details).slice(0, 500) : '',
        });
      } catch (err) {
        // Silently swallow logging errors — never impact the main operation
      }
    });
  } catch (err) {
    // Silently swallow
  }
}

module.exports = { logActivity };
