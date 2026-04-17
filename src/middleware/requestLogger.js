/**
 * Request Logger Middleware
 * Logs incoming requests with timestamps, methods, paths, and response times
 * Place: src/middleware/requestLogger.js
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create write stream for logging
const errorStream = fs.createWriteStream(path.join(logsDir, 'error.log'), { flags: 'a' });
const accessStream = fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' });

/**
 * Request Logger Middleware
 * Logs request details and response times
 */
const requestLogger = (req, res, next) => {
  // Record start time
  const startTime = Date.now();
  
  // Generate request ID for tracking
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = requestId;

  // Log request details
  const requestLog = {
    timestamp: new Date().toISOString(),
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    user_id: req.user?.user_id || 'anonymous'
  };

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Add response details
    requestLog.statusCode = res.statusCode;
    requestLog.responseTime = `${responseTime}ms`;
    requestLog.contentLength = Buffer.byteLength(JSON.stringify(data));

    // Log to appropriate stream
    const logMessage = JSON.stringify(requestLog) + '\n';
    
    if (res.statusCode >= 400) {
      errorStream.write(logMessage);
      console.error(`[${requestLog.timestamp}] ERROR: ${requestLog.method} ${requestLog.path} - ${res.statusCode} - ${responseTime}ms`);
    } else {
      accessStream.write(logMessage);
      console.log(`[${requestLog.timestamp}] ${requestLog.method} ${requestLog.path} - ${res.statusCode} - ${responseTime}ms`);
    }

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Get logs from file
 * Usage: Call this to retrieve logs for debugging
 */
const getLogs = (logType = 'access', lines = 100) => {
  try {
    const logPath = path.join(logsDir, `${logType}.log`);
    const content = fs.readFileSync(logPath, 'utf8');
    return content.split('\n').slice(-lines).filter(line => line.trim());
  } catch (error) {
    return [];
  }
};

module.exports = {
  requestLogger,
  getLogs
};
