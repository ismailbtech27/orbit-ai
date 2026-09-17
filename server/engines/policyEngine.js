/**
 * Orbit AI Policy Engine
 * Deterministically evaluates Agent recommendations against organizational policies.
 */

const VALID_ACTIONS = [
  'LOG_ONLY',
  'INVESTIGATE',
  'RESTRICT_ACCOUNT',
  'BLOCK_ACCOUNT',
  'ISOLATE_ASSET'
];

export const evaluateAction = (action, riskScore, riskLevel, assetCriticality = 'MEDIUM') => {
  // Ensure the action is recognized by the system
  if (!VALID_ACTIONS.includes(action)) {
    return {
      decision: 'REJECTED',
      reason: `Action '${action}' is not a recognized system action.`
    };
  }

  // Policy 1: Critical Assets require human approval for blocking
  if (action === 'BLOCK_ACCOUNT' && assetCriticality === 'CRITICAL') {
    return {
      decision: 'REQUIRES_HUMAN_APPROVAL',
      reason: 'Policy: Blocking accounts on CRITICAL assets always requires human verification.'
    };
  }

  // Policy 2: High/Critical risk actions (RESTRICT/BLOCK)
  if (action === 'RESTRICT_ACCOUNT' || action === 'BLOCK_ACCOUNT' || action === 'ISOLATE_ASSET') {
    if (riskScore < 60) {
      return {
        decision: 'REJECTED',
        reason: 'Policy: Disruptive actions are not permitted for Risk Score < 60.'
      };
    }
    
    if (riskLevel === 'CRITICAL') {
       // Automatic mitigation for critical risk (unless overridden by Policy 1)
       return {
         decision: 'ALLOWED',
         reason: 'Policy: Automatic mitigation permitted for CRITICAL risk.'
       };
    }
    
    if (riskLevel === 'HIGH') {
       return {
         decision: 'REQUIRES_HUMAN_APPROVAL',
         reason: 'Policy: Disruptive actions on HIGH risk require human approval.'
       };
    }
  }

  // Policy 3: Non-disruptive actions are generally allowed
  if (action === 'LOG_ONLY' || action === 'INVESTIGATE') {
    return {
      decision: 'ALLOWED',
      reason: 'Policy: Non-disruptive monitoring actions are allowed.'
    };
  }

  // Default fallback
  return {
    decision: 'REQUIRES_HUMAN_APPROVAL',
    reason: 'Policy: Action fell through to default safety catch.'
  };
};
