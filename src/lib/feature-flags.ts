import crypto from 'crypto';

export interface EvaluationContext {
  userId: string;
  environment: string;
  service?: string;
}

export interface FlagRule {
  type: 'percentage' | 'allowlist' | 'and' | 'or';
  value?: number; // For percentage
  userIds?: string[]; // For allowlist
  rules?: FlagRule[]; // For and/or composition
}

export interface EvaluationResult {
  enabled: boolean;
  reason: string;
}

/**
 * Deterministic hash function for percentage rollout
 * Same userId + flagKey always produces same result
 */
function hashUserIdForFlag(userId: string, flagKey: string): number {
  const hash = crypto
    .createHash('sha256')
    .update(`${userId}:${flagKey}`)
    .digest('hex');

  // Convert first 8 characters of hex to number between 0-99
  const hashInt = parseInt(hash.substring(0, 8), 16);
  return hashInt % 100;
}

/**
 * Evaluate a single rule
 */
function evaluateRule(
  rule: FlagRule,
  context: EvaluationContext,
  flagKey: string
): EvaluationResult {
  switch (rule.type) {
    case 'percentage':
      if (rule.value === undefined) {
        return { enabled: false, reason: 'Invalid percentage rule' };
      }
      const hash = hashUserIdForFlag(context.userId, flagKey);
      const enabled = hash < rule.value;
      return {
        enabled,
        reason: `User hash ${hash} ${enabled ? '<' : '>='} ${rule.value}%`,
      };

    case 'allowlist':
      if (!rule.userIds) {
        return { enabled: false, reason: 'Invalid allowlist rule' };
      }
      const isAllowed = rule.userIds.includes(context.userId);
      return {
        enabled: isAllowed,
        reason: isAllowed
          ? 'User in allowlist'
          : 'User not in allowlist',
      };

    case 'and':
      if (!rule.rules || rule.rules.length === 0) {
        return { enabled: false, reason: 'Invalid AND rule' };
      }
      for (const subRule of rule.rules) {
        const result = evaluateRule(subRule, context, flagKey);
        if (!result.enabled) {
          return { enabled: false, reason: `AND failed: ${result.reason}` };
        }
      }
      return { enabled: true, reason: 'All AND conditions met' };

    case 'or':
      if (!rule.rules || rule.rules.length === 0) {
        return { enabled: false, reason: 'Invalid OR rule' };
      }
      for (const subRule of rule.rules) {
        const result = evaluateRule(subRule, context, flagKey);
        if (result.enabled) {
          return { enabled: true, reason: `OR matched: ${result.reason}` };
        }
      }
      return { enabled: false, reason: 'No OR conditions met' };

    default:
      return { enabled: false, reason: 'Unknown rule type' };
  }
}

/**
 * Evaluate a feature flag
 */
export function evaluateFeatureFlag(
  flagKey: string,
  enabled: boolean,
  rules: FlagRule,
  context: EvaluationContext
): EvaluationResult {
  if (!enabled) {
    return { enabled: false, reason: 'Flag is globally disabled' };
  }

  return evaluateRule(rules, context, flagKey);
}
