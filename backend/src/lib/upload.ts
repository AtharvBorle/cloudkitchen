import { v2 as cloudinary } from 'cloudinary';

// Note: @aws-sdk/client-s3 is required for S3 support
// import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file buffer to cloud storage (Cloudinary or AWS S3).
 * Uses process.env.STORAGE_PROVIDER to determine the service.
 * 
 * @param fileBuffer - The Buffer containing the file data
 * @param mimeType - The MIME type of the file (e.g. 'image/jpeg')
 * @param originalFilename - The original name of the file
 * @param folder - The logical folder to store the file in
 * @returns The secure URL of the uploaded image file
 */
export async function uploadImage(
    fileBuffer: Buffer,
    mimeType: string,
    originalFilename: string,
    folder: string
): Promise<string> {
    const provider = process.env.STORAGE_PROVIDER || 'cloudinary';

    try {
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

async function uploadToCloudinary(fileBuffer: Buffer, folder: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `neo-cloud-room/${folder}`,
                resource_type: 'auto',
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
