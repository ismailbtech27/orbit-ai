import sequelize from '../db/database.js';
import User from './User.js';
import SecurityEvent from './SecurityEvent.js';
import Alert from './Alert.js';
import AuditLog from './AuditLog.js';

// Define relationships
SecurityEvent.belongsTo(User, { foreignKey: 'username', targetKey: 'username' });
User.hasMany(SecurityEvent, { foreignKey: 'username', sourceKey: 'username' });

Alert.belongsTo(SecurityEvent, { foreignKey: 'relatedEventId', targetKey: 'eventId', as: 'TriggerEvent' });
SecurityEvent.hasMany(Alert, { foreignKey: 'relatedEventId', sourceKey: 'eventId' });

export {
  sequelize,
  User,
  SecurityEvent,
  Alert,
  AuditLog
};
