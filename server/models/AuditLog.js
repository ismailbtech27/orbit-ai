import { DataTypes } from 'sequelize';
import sequelize from '../db/database.js';

const AuditLog = sequelize.define('AuditLog', {
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  targetEntity: {
    type: DataTypes.STRING, // e.g. User, Alert
    allowNull: false
  },
  targetId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  performedBy: {
    type: DataTypes.STRING,
    allowNull: false, // System, Agent, or Username
    defaultValue: 'SYSTEM'
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

export default AuditLog;
