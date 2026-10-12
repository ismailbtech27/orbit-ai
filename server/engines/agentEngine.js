/**
 * Orbit Agentic AI Layer
 * Analyzes the threat context and recommends an action based on constraints.
 * Deterministic for academic demonstration stability.
 */
export const getAgentRecommendation = async (alertDetails, riskDetails, validActions) => {
  let recommendedAction = 'INVESTIGATE';
  let reasoning = 'Default safe action selected for monitoring.';

  if (alertDetails.threatType === "Unauthorized Privileged Access Attempt") {
    recommendedAction = 'BLOCK_ACCOUNT';
    reasoning = 'The account is exhibiting privilege escalation behavior targeting administrative resources. Immediate blocking is recommended to prevent system compromise.';
  } else if (alertDetails.threatType === "Suspicious Account Activity") {
    recommendedAction = 'RESTRICT_ACCOUNT';
    reasoning = 'The account showed repeated authentication failures followed by successful access and sensitive file access. Temporarily restricting the account is recommended to prevent data exfiltration.';
  } else if (alertDetails.threatType === "Repeated Authentication Failures") {
    recommendedAction = 'LOG_ONLY';
    reasoning = 'Repeated authentication failures detected. Logging for continuous monitoring until a successful login occurs.';
  }

  // Ensure action is valid
  if (!validActions.includes(recommendedAction)) {
    recommendedAction = validActions[0];
  }

  return {
    recommendedAction,
    reasoning
  };
};
