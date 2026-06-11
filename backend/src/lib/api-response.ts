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
    const message = typeof error === 'string' ? error : error?.message || 'Something went wrong';
    const payload: ApiResponse = {
        success: false,
        error: message,
    };

    // If it's a known error object we might want to attach additional details or log it.
    console.error(`[API Error ${statusCode}]:`, error);

    return NextResponse.json(payload, { status: statusCode });
}
