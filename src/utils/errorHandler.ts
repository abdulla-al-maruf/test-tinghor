// src/utils/errorHandler.ts

/**
 * Custom error handler and logger.
 * @param {Error} error - The error object to handle.
 * @param {string} context - Context where the error occurred.
 */
function handleError(error, context) {
    const errorMessage = error.message || 'Unknown Error';
    const timestamp = new Date().toISOString();
  
    console.error(`[${timestamp}] Error in ${context}: ${errorMessage}`);  
    // Additional logging can be implemented here, e.g., sending to external logging service.
}

export default handleError;
