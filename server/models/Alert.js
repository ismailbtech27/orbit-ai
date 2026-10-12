import { DataTypes } from 'sequelize';
import sequelize from '../db/database.js';

const Alert = sequelize.define('Alert', {
  alertId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  threatType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  severity: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sourceIp: {
    type: DataTypes.STRING,
    allowNull: true
  },
  mlConfidence: {
    type: DataTypes.FLOAT,
    allowNull: true // 0.0 to 100.0 from ML Service
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'OPEN' // OPEN, RESOLVED, REJECTED, SIMULATED, APPROVED
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  agentRecommendedAction: {
    type: DataTypes.STRING,
    allowNull: true
  },
  agentReasoning: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  policyDecision: {
    type: DataTypes.STRING,
    allowNull: true // ALLOWED, REQUIRES_HUMAN_APPROVAL, REJECTED
  },
  riskScore: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  riskLevel: {
    type: DataTypes.STRING,
    allowNull: true
  },
  priority: {
    type: DataTypes.STRING,
    allowNull: true
  },
  currentStage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  predictedStage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  observedPath: {
    type: DataTypes.TEXT, // Store as JSON string
    allowNull: true
  },
  predictedPath: {
    type: DataTypes.TEXT, // Store as JSON string
    allowNull: true
  },
  pathDeviationDetected: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

export default Alert;
