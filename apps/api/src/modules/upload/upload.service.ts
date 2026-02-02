import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

const BUCKET = process.env.S3_BUCKET ?? '';
const REGION = process.env.AWS_REGION ?? 'sa-east-1';
const USE_S3 = !!process.env.S3_BUCKET && !!process.env.AWS_ACCESS_KEY_ID;
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads');

@Injectable()
export class UploadService {
  private s3: S3Client | null = USE_S3
    ? new S3Client({ region: REGION })
    : null;

  async save(
    file: Express.Multer.File,
    prefix: string,
    key?: string,
    opts?: { taskId?: string; type?: string },
  ): Promise<{ url: string; key: string }> {
    const pathPrefix =
      opts?.taskId && opts?.type ? `${prefix}/${opts.taskId}/${opts.type}` : prefix;
    const name = `${Date.now()}-${file.originalname}`;
    const fullKey = key ?? `${pathPrefix}/${name}`;

    if (this.s3 && BUCKET) {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: fullKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
      const url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${fullKey}`;
      return { url, key: fullKey };
    }

    await mkdir(UPLOAD_DIR, { recursive: true });
    const dest = join(UPLOAD_DIR, fullKey);
    await mkdir(join(UPLOAD_DIR, pathPrefix), { recursive: true });
    await pipeline(Readable.from(file.buffer), createWriteStream(dest));
    const url = `/uploads/${fullKey}`;
    return { url, key: fullKey };
  }
}
