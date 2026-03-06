import crypto from 'crypto';

export class UUID {
  static v4() {
    return crypto.randomUUID();
  }
}
