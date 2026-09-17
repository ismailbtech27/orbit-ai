/**
 * Orbit AI Risk Assessment Engine
 * Deterministically calculates a risk score (0-100) based on multiple factors.
 */

const SEVERITY_WEIGHTS = {
  LOW: 10,
  MEDIUM: 30,
  HIGH: 60,
  CRITICAL: 80
};

const ASSET_CRITICALITY_WEIGHTS = {
  LOW: 0.8,
  MEDIUM: 1.0,
  HIGH: 1.2,
  CRITICAL: 1.5
};

export const calculateRisk = (eventSeverity, mlConfidence, assetCriticality = 'MEDIUM') => {
  // Base score from severity (0-80 roughly)
  const baseScore = SEVERITY_WEIGHTS[eventSeverity.toUpperCase()] || 10;
  
  // Factor in ML Confidence (Confidence represents certainty of a threat, 0 to 100)
  // High confidence increases the score, low confidence slightly decreases the impact
  const confidenceMultiplier = (mlConfidence / 100);
  
  // Asset Criticality scales the final score
  const assetMultiplier = ASSET_CRITICALITY_WEIGHTS[assetCriticality.toUpperCase()] || 1.0;
  
  // Formula: (Base + (Base * Confidence)) * AssetMultiplier
  // Example: High (60) + (60 * 0.95) = 117. 117 * 1.0 = 117
  let rawScore = (baseScore + (baseScore * confidenceMultiplier)) * assetMultiplier;
  
  // Cap at 100
  let finalScore = Math.min(Math.round(rawScore), 100);
  
  let level = 'LOW';
  if (finalScore >= 80) level = 'CRITICAL';
  else if (finalScore >= 60) level = 'HIGH';
  else if (finalScore >= 40) level = 'MEDIUM';
  
  return {
    score: finalScore,
    level: level,
    factors: {
      severity: eventSeverity,
      mlConfidence,
      assetCriticality
    }
  };
};
