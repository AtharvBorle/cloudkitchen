import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ApiError } from './api-error';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIMES: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'application/pdf': '.pdf',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
};

/**
 * Validates the file buffer magic numbers against its declared MIME type
 * to prevent extension spoofing and polyglot payload execution.
 */
function validateMagicBytes(buffer: Buffer, mime: string): boolean {
    if (!buffer || buffer.length < 4) return false;

    // JPEG: FF D8 FF
    if (mime === 'image/jpeg' || mime === 'image/jpg') {
        return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }

    // PNG: 89 50 4E 47
    if (mime === 'image/png') {
        return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    }

    // GIF: 47 49 46 38
    if (mime === 'image/gif') {
        return buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38;
    }

    // WEBP: RIFF ... WEBP
    if (mime === 'image/webp') {
        return (
            buffer.length >= 12 &&
            buffer.toString('ascii', 0, 4) === 'RIFF' &&
            buffer.toString('ascii', 8, 12) === 'WEBP'
        );
    }

    // PDF: %PDF (25 50 44 46)
    if (mime === 'application/pdf') {
        return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
    }

    // MP4: ftyp at offset 4
    if (mime === 'video/mp4') {
        return buffer.length >= 8 && buffer.toString('ascii', 4, 8) === 'ftyp';
    }

    // WebM / EBML: 1A 45 DF A3
    if (mime === 'video/webm') {
        return buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
    }

    return false;
}

/**
 * Uploads a file buffer to storage (Local Server, Cloudinary, or AWS S3).
 * Enforces size limits, MIME type validation, and magic number integrity.
 */
export async function uploadImage(
    fileBuffer: Buffer,
    mimeType: string,
    originalFilename: string,
    folder: string
): Promise<string> {
    if (!fileBuffer || fileBuffer.length === 0) {
        throw new ApiError('No file content provided for upload.', 400);
    }

    if (fileBuffer.length > MAX_FILE_SIZE) {
        throw new ApiError(`File size (${(fileBuffer.length / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum allowed limit of 10MB.`, 400);
    }

    const cleanMime = (mimeType || 'image/jpeg').toLowerCase().trim();
    const safeExt = ALLOWED_MIMES[cleanMime];

    if (!safeExt) {
        throw new ApiError(`Unsupported file format (${cleanMime}). Allowed formats: JPEG, PNG, WEBP, GIF, PDF, MP4.`, 400);
    }

    if (!validateMagicBytes(fileBuffer, cleanMime)) {
        throw new ApiError('File signature validation failed. The file contents do not match its declared MIME type.', 400);
    }

    const provider = (process.env.STORAGE_PROVIDER || 'cloudinary').toLowerCase().trim();

    try {
        if (provider === 'local' || provider === 'server' || provider === 'disk' || provider === 'fs') {
            return await uploadToLocalStorage(fileBuffer, cleanMime, safeExt, originalFilename, folder);
        }
        if (provider === 's3') {
            return await uploadToS3(fileBuffer, cleanMime, originalFilename, folder);
        }
        return await uploadToCloudinary(fileBuffer, folder);
    } catch (uploadErr: any) {
        if (uploadErr instanceof ApiError) throw uploadErr;
        console.warn(`Upload to ${provider} failed, creating safe data URL fallback:`, uploadErr?.message || uploadErr);
        return `data:${cleanMime};base64,${fileBuffer.toString('base64')}`;
    }
}

/**
 * Stores uploaded file directly on backend server disk under public/uploads/{folder}/
 */
async function uploadToLocalStorage(
    fileBuffer: Buffer,
    _mimeType: string,
    safeExt: string,
    originalFilename: string,
    folder: string
): Promise<string> {
    // 1. Sanitize folder name strictly (prevent path traversal)
    const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'general';

    // 2. Prepare upload destination directory inside public/uploads/{folder}
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', sanitizedFolder);
    await fs.promises.mkdir(uploadDir, { recursive: true });

    // 3. Generate unique, collision-safe filename with verified extension
    const rawBaseName = path
        .basename(originalFilename || 'upload', path.extname(originalFilename || ''))
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .substring(0, 30);
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const filename = `${uniqueSuffix}-${rawBaseName}${safeExt}`;
    const targetFilePath = path.join(uploadDir, filename);

    // 4. Write buffer to server disk
    await fs.promises.writeFile(targetFilePath, fileBuffer);

    // 5. Build publicly accessible URL
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
                resource_type: 'auto',
                quality: 'auto:good',
                fetch_format: 'auto',
                timeout: 10000,
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    return reject(error);
                }
                if (!result || !result.secure_url) {
                    return reject(new Error('Cloudinary returned empty result'));
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

        const safeFilename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${path.basename(originalFilename).replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const key = `neo-cloud-room/${folder}/${safeFilename}`;
        const bucketName = process.env.AWS_S3_BUCKET_NAME;

        await s3Client.send(
            new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: fileBuffer,
                ContentType: mimeType,
            })
        );

        return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    } catch (error) {
        console.error('S3 upload error:', error);
        throw new ApiError('S3 upload service configuration error.', 500);
    }
}
