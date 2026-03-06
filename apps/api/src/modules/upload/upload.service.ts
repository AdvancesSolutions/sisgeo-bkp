import { Injectable } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import sharp from 'sharp';

const BUCKET = process.env.S3_BUCKET ?? '';
const REGION = process.env.AWS_REGION ?? 'sa-east-1';
const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL ?? '';
const USE_S3 = !!process.env.S3_BUCKET;
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads');

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const JPEG_QUALITY = 85;
const PRESIGNED_EXPIRES = 900; // 15 min

@Injectable()
export class UploadService {
  private s3: S3Client | null = USE_S3 ? new S3Client({ region: REGION }) : null;

  private async compressImage(buffer: Buffer, mimetype: string): Promise<{ buffer: Buffer; contentType: string }> {
    const isImage = /^image\/(jpeg|png|webp|gif)$/i.test(mimetype);
    if (!isImage) return { buffer, contentType: mimetype };

    const img = sharp(buffer);
    const meta = await img.metadata();
    const needsResize = (meta.width ?? 0) > MAX_WIDTH || (meta.height ?? 0) > MAX_HEIGHT;

    let chain = img;
    if (needsResize) {
      chain = chain.resize(MAX_WIDTH, MAX_HEIGHT, { fit: 'inside', withoutEnlargement: true });
    }

    const out = await chain
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();

    return { buffer: out, contentType: 'image/jpeg' };
  }

  async save(
    file: Express.Multer.File,
    prefix: string,
    key?: string,
    opts?: { taskId?: string; type?: string },
  ): Promise<{ url: string; key: string }> {
    const pathPrefix =
      opts?.taskId && opts?.type ? `${prefix}/${opts.taskId}/${opts.type}` : prefix;
    const ext = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
    const name = `${Date.now()}.${ext === 'jpeg' || ext === 'jpg' ? 'jpg' : ext}`;
    const fullKey = key ?? `${pathPrefix}/${name}`;

    const { buffer, contentType } = await this.compressImage(file.buffer, file.mimetype);

    if (this.s3 && BUCKET) {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: fullKey,
          Body: buffer,
          ContentType: contentType,
        }),
      );
      const url = CLOUDFRONT_URL
        ? `${CLOUDFRONT_URL}/${fullKey}`
        : `https://${BUCKET}.s3.${REGION}.amazonaws.com/${fullKey}`;
      return { url, key: fullKey };
    }

    await mkdir(UPLOAD_DIR, { recursive: true });
    const dest = join(UPLOAD_DIR, fullKey);
    await mkdir(join(UPLOAD_DIR, pathPrefix), { recursive: true });
    await pipeline(Readable.from(buffer), createWriteStream(dest));
    const url = `/uploads/${fullKey}`;
    return { url, key: fullKey };
  }

  /**
   * Gera URL assinada para upload direto do mobile (fluxo: compressão client-side -> PUT S3).
   * Retorna uploadUrl (PUT), key e publicUrl (CloudFront ou S3) para exibição.
   */
  async getPresignedUploadUrl(
    prefix: string,
    opts: { taskId: string; type: 'BEFORE' | 'AFTER' },
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    if (!this.s3 || !BUCKET) {
      throw new Error('S3 não configurado. Use upload multipart em /upload/photo');
    }
    const pathPrefix = `${prefix}/${opts.taskId}/${opts.type}`;
    const name = `${Date.now()}.jpg`;
    const fullKey = `${pathPrefix}/${name}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: fullKey,
      ContentType: 'image/jpeg',
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uploadUrl = await getSignedUrl(this.s3 as any, command, { expiresIn: PRESIGNED_EXPIRES });
    const publicUrl = CLOUDFRONT_URL
      ? `${CLOUDFRONT_URL}/${fullKey}`
      : `https://${BUCKET}.s3.${REGION}.amazonaws.com/${fullKey}`;

    return { uploadUrl, key: fullKey, publicUrl };
  }

  /** Upload de vídeo/PDF/thumbnail para procedimentos (sem compressão) */
  async saveProcedureAsset(
    file: Express.Multer.File,
    type: 'video' | 'pdf' | 'thumbnail',
    procedimentoId: string,
  ): Promise<{ url: string; key: string }> {
    const ext = file.originalname.split('.').pop()?.toLowerCase() || (type === 'pdf' ? 'pdf' : 'mp4');
    const name = `${type}-${Date.now()}.${ext}`;
    const fullKey = `procedimentos/${procedimentoId}/${name}`;

    const buffer = file.buffer;
    const contentType = file.mimetype;

    if (this.s3 && BUCKET) {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: fullKey,
          Body: buffer,
          ContentType: contentType,
        }),
      );
      const url = CLOUDFRONT_URL
        ? `${CLOUDFRONT_URL}/${fullKey}`
        : `https://${BUCKET}.s3.${REGION}.amazonaws.com/${fullKey}`;
      return { url, key: fullKey };
    }

    await mkdir(UPLOAD_DIR, { recursive: true });
    const dest = join(UPLOAD_DIR, fullKey);
    await mkdir(join(UPLOAD_DIR, `procedimentos/${procedimentoId}`), { recursive: true });
    await pipeline(Readable.from(buffer), createWriteStream(dest));
    return { url: `/uploads/${fullKey}`, key: fullKey };
  }

  /** Retorna URL pública (CloudFront ou S3) para uma key. */
  getPublicUrl(key: string): string {
    if (CLOUDFRONT_URL) return `${CLOUDFRONT_URL}/${key}`;
    if (BUCKET) return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
    return `/uploads/${key}`;
  }
}
