import { Log } from '../models/log.js';

/**
 * Logs an error to the database
 * @param {Error} error - The error object
 * @param {string} context - Context description (e.g., 'UserController.getAll')
 * @param {number} userId - Optional user ID
 * @returns {Promise<void>}
 */
export async function logError(error, context, userId = null) {
  try {
    const description = `[${context}] ${error.message}\nStack: ${error.stack}`;
    await Log.create({
      user_id: userId,
      description
    });
  } catch (logError) {
    // Fallback: log to console if database logging fails
    console.error('Failed to log error to database:', logError);
    console.error('Original error:', error);
  }
}

/**
 * Logs an info/action message to the database
 * @param {string} description - Description of the action
 * @param {number} userId - Optional user ID
 * @returns {Promise<void>}
 */
export async function logInfo(description, userId = null) {
  try {
    await Log.create({
      user_id: userId,
      description
    });
  } catch (error) {
    console.error('Failed to log info to database:', error);
  }
}

/**
 * Wrapper for controller methods to handle errors automatically
 * @param {Function} controllerMethod - The controller method to wrap
 * @returns {Function} Wrapped function
 */
export function withErrorLogging(controllerMethod) {
  return async (req, res) => {
    try {
      await controllerMethod(req, res);
    } catch (error) {
      const context = `${controllerMethod.name || 'Unknown'}`;
      const userId = req.user?.id || null;
      await logError(error, context, userId);
      res.status(500).json({ success: false, error: error.message });
    }
  };
}
