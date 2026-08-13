/**
 * ResponseFormatter is a utility class that provides methods to format API responses in a consistent manner. 
 * It includes methods for success, error, validation error, and paginated responses.
 */
class ResponseFormatter {
    static success = (data = null, message = "Success", statusCode = 200) => {
        return {
            success: true,
            data,
            message,
            statusCode,
            timestamp: new Date().toISOString()
        };
    }

    static error = (error = null, message = "Error", statusCode = 500) => {
        return {
            success: false,
            error,
            message,
            statusCode,
            timestamp: new Date().toISOString()
        };
    }

    static validationError = (error = null, message = "Validation Error", statusCode = 400) => {
        return {
            success: false,
            error,
            message,
            statusCode,
            timestamp: new Date().toISOString()
        };
    }

    static paginated = (data = null, page, limit, total) => {
        return {
            success: true,
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            message,
            statusCode,
            timestamp: new Date().toISOString()
        };
    }
}

export default ResponseFormatter;