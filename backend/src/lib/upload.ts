import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Note: @aws-sdk/client-s3 is required for S3 support
// import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file buffer to storage (Local Server, Cloudinary, or AWS S3).
 * Uses process.env.STORAGE_PROVIDER to determine the service:
 * - "local" | "server" | "disk": Stores directly on the backend server in public/uploads/{folder}
 * - "cloudinary": Uploads to Cloudinary cloud service
 * - "s3": Uploads to Amazon S3
 * 
 * @param fileBuffer - The Buffer containing the file data
 * @param mimeType - The MIME type of the file (e.g. 'image/jpeg')
 * @param originalFilename - The original name of the file
 * @param folder - The logical folder to store the file in
 * @returns The public URL of the uploaded image file
 */
export async function uploadImage(
    fileBuffer: Buffer,
    mimeType: string,
    originalFilename: string,
    folder: string
): Promise<string> {
    const provider = (process.env.STORAGE_PROVIDER || 'cloudinary').toLowerCase().trim();

    try {
        if (provider === 'local' || provider === 'server' || provider === 'disk' || provider === 'fs') {
            return await uploadToLocalStorage(fileBuffer, mimeType, originalFilename, folder);
        }
        if (provider === 's3') {
            return await uploadToS3(fileBuffer, mimeType, originalFilename, folder);
        }
        return await uploadToCloudinary(fileBuffer, folder);
    } catch (uploadErr) {
        console.warn(`Upload to ${provider} failed, creating safe data URL fallback:`, uploadErr);
        const mime = mimeType || 'image/jpeg';
        return `data:${mime};base64,${fileBuffer.toString('base64')}`;
    }
}

/**
 * Stores uploaded file directly on the backend server disk under public/uploads/{folder}/
 */
async function uploadToLocalStorage(
    fileBuffer: Buffer,
    mimeType: string,
    originalFilename: string,
    folder: string
): Promise<string> {
    // 1. Sanitize folder name
    const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'general';

    // 2. Prepare upload destination directory inside public/uploads/{folder}
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', sanitizedFolder);
    await fs.promises.mkdir(uploadDir, { recursive: true });

    // 3. Extract and clean file extension
    let ext = path.extname(originalFilename || '').toLowerCase();
    if (!ext || ext.length > 5 || !/^\.[a-z0-9]+$/.test(ext)) {
        const mimeExtMap: Record<string, string> = {
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/png': '.png',
            'image/webp': '.webp',
            'image/gif': '.gif',
            'image/svg+xml': '.svg',
            'application/pdf': '.pdf',
            'video/mp4': '.mp4',
            'video/webm': '.webm',
        };
        ext = mimeExtMap[mimeType] || '.jpg';
    }

    // 4. Generate unique, collision-safe filename
    const rawBaseName = path
        .basename(originalFilename || 'upload', ext)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 30);
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const filename = `${uniqueSuffix}-${rawBaseName}${ext}`;
    const targetFilePath = path.join(uploadDir, filename);

    // 5. Write buffer to server disk
    await fs.promises.writeFile(targetFilePath, fileBuffer);

    // 6. Build publicly accessible URL
    const baseUrl = (
        process.env.UPLOAD_BASE_URL ||
        process.env.NEXTAUTH_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        process.env.API_BASE_URL ||
        (process.env.NODE_ENV === 'production' ? 'https://dev.api.neocloudbites.com' : 'http://localhost:5000')
    ).replace(/\/$/, '');

    return `${baseUrl}/uploads/${sanitizedFolder}/${filename}`;
}

async function uploadToCloudinary(fileBuffer: Buffer, folder: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `neo-cloud-room/${folder}`,
                resource_type: 'image',
                quality: 'auto:good',
                fetch_format: 'auto',
                timeout: 8000,
            },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary upload error:", error);
                    return reject(error);
                }
                if (!result || !result.secure_url) {
                    return reject(new Error("Cloudinary returned empty result"));
                }
                resolve(result.secure_url);
            }
        );
        uploadStream.end(fileBuffer);
    });
}

async function uploadToS3(
    fileBuffer: Buffer,
    mimeType: string,
    originalFilename: string,
    folder: string
): Promise<string> {
    // Dynamic import to avoid requiring the SDK unless S3 is used
    try {
        const s3ModuleName = '@aws-sdk/client-s3';
        const { S3Client, PutObjectCommand } = await import(/* webpackIgnore: true */ s3ModuleName);

        const s3Client = new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });

        const key = `neo-cloud-room/${folder}/${Date.now()}-${originalFilename}`;
        const bucketName = process.env.AWS_S3_BUCKET_NAME;

        await s3Client.send(
            new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: fileBuffer,
                ContentType: mimeType,
            })
        );

        // This assumes the bucket is public or has a policy for public access.
        // For private buckets, you'd generate a signed URL or use a CDN.
        return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    } catch (error) {
        console.error("S3 upload error:", error);
        throw new Error("S3 upload failed. Did you install @aws-sdk/client-s3?");
    }
}
