export interface RegisterRequest {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

export interface VerifyEmailRequest {
  token: string
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public _field?: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class ValidationService {
  /**
   * Validate registration input
   */
  static validateRegisterInput(body: Record<string, unknown>): RegisterRequest {
    const { email, password, firstName, lastName } = body

    if (!email || typeof email !== 'string') {
      throw new ValidationError('Valid email is required', 'email')
    }

    if (!password || typeof password !== 'string') {
      throw new ValidationError('Password is required', 'password')
    }

    if (firstName && typeof firstName !== 'string') {
      throw new ValidationError('First name must be a string', 'firstName')
    }

    if (lastName && typeof lastName !== 'string') {
      throw new ValidationError('Last name must be a string', 'lastName')
    }

    return {
      email: email.toLowerCase().trim(),
      password,
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
    }
  }

  /**
   * Validate login input
   */
  static validateLoginInput(body: Record<string, unknown>): LoginRequest {
    const { email, password } = body

    if (!email || typeof email !== 'string') {
      throw new ValidationError('Valid email is required', 'email')
    }

    if (!password || typeof password !== 'string') {
      throw new ValidationError('Password is required', 'password')
    }

    return {
      email: email.toLowerCase().trim(),
      password,
    }
  }

  /**
   * Validate refresh token input
   */
  static validateRefreshTokenInput(
    body: Record<string, unknown>
  ): RefreshTokenRequest {
    const { refreshToken } = body

    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new ValidationError('Refresh token is required', 'refreshToken')
    }

    return { refreshToken }
  }

  /**
   * Validate forgot password input
   */
  static validateForgotPasswordInput(
    body: Record<string, unknown>
  ): ForgotPasswordRequest {
    const { email } = body

    if (!email || typeof email !== 'string') {
      throw new ValidationError('Valid email is required', 'email')
    }

    return {
      email: email.toLowerCase().trim(),
    }
  }

  /**
   * Validate reset password input
   */
  static validateResetPasswordInput(
    body: Record<string, unknown>
  ): ResetPasswordRequest {
    const { token, newPassword } = body

    if (!token || typeof token !== 'string') {
      throw new ValidationError('Reset token is required', 'token')
    }

    if (!newPassword || typeof newPassword !== 'string') {
      throw new ValidationError('New password is required', 'newPassword')
    }

    return { token, newPassword }
  }

  /**
   * Validate email verification input
   */
  static validateVerifyEmailInput(
    body: Record<string, unknown>
  ): VerifyEmailRequest {
    const { token } = body

    if (!token || typeof token !== 'string') {
      throw new ValidationError('Verification token is required', 'token')
    }

    return { token }
  }
}
