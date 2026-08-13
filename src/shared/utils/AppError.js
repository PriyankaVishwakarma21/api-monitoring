/**
 * AppError class is a custom error class that extends the built-in Error class. 
 * It is used to create operational errors with a specific message, status code, and optional additional error details. 
 * This class is useful for handling errors in a consistent manner throughout an application.
 */
class AppError extends Error {
    constructor(message, statusCode = 500, errors = null) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);// it give proper information about where the error was created
    }
}
export default AppError;