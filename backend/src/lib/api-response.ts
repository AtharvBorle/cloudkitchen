import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string | any;
}

export function successResponse<T>(data: T, message?: string, statusCode = 200) {
    const payload: ApiResponse<T> = {
        success: true,
        data,
        message,
    };
    return NextResponse.json(payload, { status: statusCode });
}

export function errorResponse(error: string | any, statusCode = 400) {
    let rawMessage = typeof error === 'string' ? error : error?.message || 'Something went wrong. Please try again.';

    // User-friendly custom translation for generic raw exception strings
    let message = rawMessage;
    const lower = rawMessage.toLowerCase().trim();

    if (lower === 'unauthorized' || lower === 'unauthorized.' || (statusCode === 401 && (!rawMessage || lower === 'unauthorized'))) {
        message = 'Please log in first to continue.';
    } else if (lower === 'forbidden' || lower === 'forbidden.' || (statusCode === 403 && (!rawMessage || lower === 'forbidden'))) {
        message = 'Access denied. You do not have permission to perform this action.';
    } else if (lower === 'not found' || (statusCode === 404 && (!rawMessage || lower === 'not found'))) {
        message = 'The requested resource could not be found.';
    } else if (
        statusCode >= 500 ||
        lower.includes('prisma') ||
        lower.includes('database') ||
        lower.includes('query') ||
        lower.includes('connection') ||
        lower.includes('stack') ||
        lower.includes('failed to connect') ||
        (process.env.NODE_ENV === 'production' && statusCode >= 500)
    ) {
        message = 'Something went wrong on our server. Please try again later.';
    }

    const payload: ApiResponse = {
        success: false,
        message: message,
        error: message,
    };

    // Log the underlying error for secure server-side observability (not sent to client)
    console.error(`[API Error ${statusCode}]:`, error);

    return NextResponse.json(payload, { status: statusCode });
}
