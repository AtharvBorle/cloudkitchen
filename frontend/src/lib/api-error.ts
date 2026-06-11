export class ApiError extends Error {
    public statusCode: number;
    public data?: any;

    constructor(message: string, statusCode: number = 400, data?: any) {
        super(message);
        this.statusCode = statusCode;
        this.data = data;
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}
