import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

export interface JWTPayload {
  userId: string
  email: string
  workspaceId?: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

// JWT Configuration
const ACCESS_TOKEN_SECRET =
  process.env.JWT_ACCESS_SECRET || 'your-access-secret-key'
const REFRESH_TOKEN_SECRET =
  process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m'
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

export class AuthService {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return bcrypt.hash(password, saltRounds)
  }

  /**
   * Compare a password with its hash
   */
  static async comparePassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  /**
   * Generate access and refresh tokens
   */
  static generateTokenPair(payload: JWTPayload): TokenPair {
    const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      issuer: 'lancerhub-api',
      audience: 'lancerhub-client',
    } as jwt.SignOptions)

    const refreshToken = jwt.sign(
      { userId: payload.userId },
      REFRESH_TOKEN_SECRET,
      {
        expiresIn: REFRESH_TOKEN_EXPIRES_IN,
        issuer: 'lancerhub-api',
        audience: 'lancerhub-client',
      } as jwt.SignOptions
    )

    return { accessToken, refreshToken }
  }

  /**
   * Verify an access token
   */
  static verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, ACCESS_TOKEN_SECRET, {
        issuer: 'lancerhub-api',
        audience: 'lancerhub-client',
      }) as JWTPayload
    } catch {
      throw new Error('Invalid access token')
    }
  }

  /**
   * Verify a refresh token
   */
  static verifyRefreshToken(token: string): { userId: string } {
    try {
      return jwt.verify(token, REFRESH_TOKEN_SECRET, {
        issuer: 'lancerhub-api',
        audience: 'lancerhub-client',
      }) as { userId: string }
    } catch {
      throw new Error('Invalid refresh token')
    }
  }

  /**
   * Generate a secure random token for email verification or password reset
   */
  static generateSecureToken(): string {
    return jwt.sign(
      { random: Math.random().toString(36) },
      ACCESS_TOKEN_SECRET,
      { expiresIn: '24h' }
    )
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): {
    valid: boolean
    message?: string
  } {
    if (password.length < 8) {
      return {
        valid: false,
        message: 'Password must be at least 8 characters long',
      }
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return {
        valid: false,
        message: 'Password must contain at least one lowercase letter',
      }
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return {
        valid: false,
        message: 'Password must contain at least one uppercase letter',
      }
    }

    if (!/(?=.*\d)/.test(password)) {
      return {
        valid: false,
        message: 'Password must contain at least one number',
      }
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return {
        valid: false,
        message:
          'Password must contain at least one special character (@$!%*?&)',
      }
    }

    return { valid: true }
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
}
