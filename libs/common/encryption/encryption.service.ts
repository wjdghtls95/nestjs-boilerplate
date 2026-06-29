import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { DomainException } from '@libs/common/exceptions/domain.exception';
import { DOMAIN_ERRORS } from '@libs/common/constants/errors/domain.errors';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor(hexKey: string) {
    this.key = Buffer.from(hexKey, 'hex');
  }

  encrypt(plain: string): string {
    const iv = randomBytes(IV_BYTES);

    const cipher = createCipheriv(ALGORITHM, this.key, iv);

    const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);

    const authTag = cipher.getAuthTag();

    return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(
      ':',
    );
  }

  decrypt(encoded: string): string {
    let iv: Buffer;
    let authTag: Buffer;
    let encryptedData: Buffer;

    try {
      const parts = encoded.split(':');

      if (parts.length !== 3) throw new Error('invalid format');

      iv = Buffer.from(parts[0], 'base64');
      authTag = Buffer.from(parts[1], 'base64');
      encryptedData = Buffer.from(parts[2], 'base64');
    } catch {
      throw new DomainException(DOMAIN_ERRORS.ENCRYPTION_INVALID_FORMAT);
    }

    try {
      const decipher = createDecipheriv(ALGORITHM, this.key, iv);

      decipher.setAuthTag(authTag);

      return decipher.update(encryptedData) + decipher.final('utf8');
    } catch {
      throw new DomainException(DOMAIN_ERRORS.ENCRYPTION_DECRYPT_FAILED);
    }
  }
}
