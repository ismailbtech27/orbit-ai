import { DataTypes } from 'sequelize';
import sequelize from '../db/database.js';

const SecurityEvent = sequelize.define('SecurityEvent', {
  eventId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  eventType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sourceIp: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false
  },
  severity: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resourceClassification: {
    type: DataTypes.STRING,
    allowNull: true // NORMAL, CONFIDENTIAL, HIGHLY_CONFIDENTIAL
  },
  analyzed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  threatDetected: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

export default SecurityEvent;
