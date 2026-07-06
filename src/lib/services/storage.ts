import fs from 'fs';
import path from 'path';

export interface UploadOptions {
  folder: 'logos' | 'receipts';
  fileName: string;
}

export async function uploadFile(buffer: Buffer, options: UploadOptions): Promise<string> {
  const { folder, fileName } = options;

  // Provision for AWS S3 / Cloudinary
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET) {
    console.log(`[Storage Service] AWS S3 credentials detected. Uploading ${fileName} to bucket ${process.env.AWS_S3_BUCKET}/${folder} in production.`);
    // Real upload code placeholder
  }

  if (process.env.CLOUDINARY_URL) {
    console.log(`[Storage Service] Cloudinary configuration detected. Uploading ${fileName} to Cloudinary folder ${folder} in production.`);
  }

  // Local/Mock implementation: Save to public/uploads directory
  try {
    const publicUploadsDir = path.resolve(process.cwd(), `public/uploads/${folder}`);
    if (!fs.existsSync(publicUploadsDir)) {
      fs.mkdirSync(publicUploadsDir, { recursive: true });
    }

    const filePath = path.join(publicUploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);

    // Return the relative web URL path accessible by the browser
    return `/uploads/${folder}/${fileName}`;
  } catch (err: any) {
    console.error('Local file upload failed:', err);
    throw new Error(`Upload failed: ${err.message}`);
  }
}
