import { getAgentRecommendation } from './server/engines/agentEngine.js';

async function runAgent() {
    console.log("Starting Agent test...");
    
    const alertDetails = {
        threatType: "Account Compromise / Unusual Login",
        severity: "HIGH",
        sourceIp: "10.0.0.99",
        mlConfidence: 92.5
    };
    
    const riskDetails = {
        score: 85,
        level: "CRITICAL"
    };
    
    const validActions = ['LOG_ONLY', 'INVESTIGATE', 'RESTRICT_ACCOUNT', 'BLOCK_ACCOUNT', 'ISOLATE_ASSET'];
    
    console.log("Inputs:");
    console.log("Alert Details:", alertDetails);
    console.log("Risk Details:", riskDetails);
    console.log("Valid Actions:", validActions);
    console.log("\nCalling Agent...");
    
    const response = await getAgentRecommendation(alertDetails, riskDetails, validActions);
    
    console.log("\n--- Agent Recommendation ---");
    console.log(JSON.stringify(response, null, 2));
}

runAgent();
