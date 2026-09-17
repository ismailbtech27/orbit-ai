import { DataTypes } from 'sequelize';
import sequelize from '../db/database.js';

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'ACTIVE' // ACTIVE, SUSPICIOUS, TEMPORARILY_RESTRICTED, ESCALATED, BLOCKED
  },
  restrictionExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  blockedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  firstSuspiciousActivityAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  suspiciousEventCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  incidentId: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

export default User;
