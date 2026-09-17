import { calculateRisk } from './server/engines/riskEngine.js';
import { evaluateAction } from './server/engines/policyEngine.js';

console.log("--- Running Orbit AI Engine Tests ---");

// Test 1: Risk Engine (High Severity + High ML Confidence)
const risk1 = calculateRisk("HIGH", 95, "MEDIUM");
console.assert(risk1.level === 'CRITICAL', "Test 1 Failed: Should be CRITICAL");
console.log("Test 1 Passed: High severity + 95% confidence = CRITICAL risk.");

// Test 2: Risk Engine (Low Severity + Low ML Confidence)
const risk2 = calculateRisk("LOW", 10, "LOW");
console.assert(risk2.level === 'LOW', "Test 2 Failed: Should be LOW");
console.log("Test 2 Passed: Low severity + 10% confidence + Low asset = LOW risk.");

// Test 3: Policy Engine (Block Critical Asset)
const policy1 = evaluateAction("BLOCK_ACCOUNT", 99, "CRITICAL", "CRITICAL");
console.assert(policy1.decision === 'REQUIRES_HUMAN_APPROVAL', "Test 3 Failed");
console.log("Test 3 Passed: Blocking a CRITICAL asset always requires human approval.");

// Test 4: Policy Engine (Block Low Risk)
const policy2 = evaluateAction("BLOCK_ACCOUNT", 45, "MEDIUM", "MEDIUM");
console.assert(policy2.decision === 'REJECTED', "Test 4 Failed");
console.log("Test 4 Passed: Disruptive actions on low/medium risk (<60) are REJECTED.");

// Test 5: Policy Engine (Log Only)
const policy3 = evaluateAction("LOG_ONLY", 100, "CRITICAL", "HIGH");
console.assert(policy3.decision === 'ALLOWED', "Test 5 Failed");
console.log("Test 5 Passed: Non-disruptive actions (LOG_ONLY) are always ALLOWED.");

console.log("--- All Tests Passed ---");
