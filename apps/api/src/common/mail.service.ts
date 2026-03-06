import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(process.env.SMTP_PORT ?? '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
      });
    }
  }

  async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    const subject = 'SIGEO - Redefinição de senha';
    const html = `
      <p>Você solicitou a redefinição de senha no SIGEO.</p>
      <p>Clique no link abaixo para definir uma nova senha (válido por 1 hora):</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>Se você não solicitou isso, ignore este e-mail.</p>
    `;
    if (this.transporter) {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM ?? 'noreply@sigeo.local',
        to,
        subject,
        html,
      });
    } else {
      console.log('[MailService] SMTP não configurado. Link de reset:', resetLink);
    }
  }
}
