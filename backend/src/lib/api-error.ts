export class ApiError extends Error {
    public statusCode: number;
    public data?: any;

    constructor(message: string, statusCode: number = 400, data?: any) {
        super(message);
        this.statusCode = statusCode;
        this.data = data;
        Object.setPrototypeOf(this, ApiError.prototype);
    }

    static unauthorized(message = "Please log in first to continue.", data?: any) {
        return new ApiError(message, 401, data);
    }

    static forbidden(message = "Access denied. You do not have permission to perform this action.", data?: any) {
        return new ApiError(message, 403, data);
    }

    static notFound(message = "The requested resource could not be found.", data?: any) {
        return new ApiError(message, 404, data);
    }

    static badRequest(message = "Invalid request details provided.", data?: any) {
        return new ApiError(message, 400, data);
    }

    static conflict(message = "A record with this information already exists.", data?: any) {
        return new ApiError(message, 409, data);
    }
}
