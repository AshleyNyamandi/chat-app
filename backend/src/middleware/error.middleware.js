import { NODE_ENV } from "../lib/env.js"

const errorMiddleware = (err, req, res, next) => {
    try {   
        let error = { ...err };
        error.message = err.message;
        
        // Log the error for debugging
        console.error('Error:', err);

        // Mongoose Bad ObjectId (CastError)
        if (err.name === 'CastError' && err.kind === 'ObjectId') {
            const message = `Resource not found with id: ${err.value}`;
            error = new Error(message);
            error.statusCode = 404;
        }

        // Mongoose Duplicate Key Error (code 11000)
        if (err.code === 11000) {
            // Get the duplicate field name
            const field = Object.keys(err.keyPattern)[0];
            const message = `Duplicate field value entered for "${field}".`;
            error = new Error(message);
            error.statusCode = 400;
        }

        // Mongoose Validation Error
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            const message = `Validation Error: ${messages.join('. ')}`;
            error = new Error(message);
            error.statusCode = 400;
        }

        // Mongoose Missing Document (if using findByIdAndUpdate, etc.)
        if (err.name === 'DocumentNotFoundError') {
            const message = 'The requested document was not found';
            error = new Error(message);
            error.statusCode = 404;
        }

        // Mongoose Strict Mode Error (unknown fields)
        if (err.name === 'StrictModeError') {
            const message = `Field "${err.path}" is not allowed in the schema`;
            error = new Error(message);
            error.statusCode = 400;
        }

        // Mongoose ParallelSaveError
        if (err.name === 'ParallelSaveError') {
            const message = 'This document is being saved concurrently. Please try again.';
            error = new Error(message);
            error.statusCode = 409;
        }

        // JWT Errors
        if (err.name === 'JsonWebTokenError') {
            const message = 'Invalid authentication token';
            error = new Error(message);
            error.statusCode = 401;
        }

        if (err.name === 'TokenExpiredError') {
            const message = 'Authentication token has expired';
            error = new Error(message);
            error.statusCode = 401;
        }

        // Custom business logic errors
        if (err.name === 'BusinessError') {
            error.statusCode = err.statusCode || 400;
        }

        // Default error
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Internal Server Error';

        // Send response
        res.status(statusCode).json({
            success: false,
            message: message,
            // Include stack trace only in development
            ...(NODE_ENV === "development" && { stack: err.stack }),
            // Include additional error details if available
            ...(error.details && { details: error.details })
        });

    } catch (error) {
        // If something goes wrong in error handler itself
        console.error('Error in errorMiddleware:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
};

export default errorMiddleware;