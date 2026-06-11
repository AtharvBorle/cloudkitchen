import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const data = await req.json();

        // Log the data for lead generation (this keeps it separate from main DB)
        console.log('--- NEW FURNITURE QUERY ---');
        console.log(JSON.stringify(data, null, 2));
        console.log('---------------------------');

        // In a real scenario, this could be saved to a separate table or sent via email/webhook
        // For now, we return success as requested for a standalone/mocked implementation

        return NextResponse.json({
            success: true,
            message: 'Query received successfully'
        }, { status: 200 });

    } catch (error) {
        console.error('Error handling furniture query:', error);
        return NextResponse.json({
            success: false,
            message: 'Internal Server Error'
        }, { status: 500 });
    }
}
