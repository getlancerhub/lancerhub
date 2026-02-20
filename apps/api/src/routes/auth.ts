import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { eq } from 'drizzle-orm'
import { db, users } from '../lib/db.js'
import { AuthService } from '../lib/auth.js'
import { ValidationService, ValidationError } from '../lib/validation.js'
import { authMiddleware } from '../middleware/auth.js'

export async function authRoutes(fastify: FastifyInstance) {
  // Register a new user
  fastify.post(
    '/auth/register',
    {
      schema: {
        description: 'Register a new user account',
        tags: ['Authentication'],
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                },
              },
              tokens: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string' },
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const registerData = ValidationService.validateRegisterInput(
          request.body
        )

        // Validate email format
        if (!AuthService.validateEmail(registerData.email)) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid email format',
          })
        }

        // Validate password strength
        const passwordValidation = AuthService.validatePassword(
          registerData.password
        )
        if (!passwordValidation.valid) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: passwordValidation.message,
          })
        }

        // Check if user already exists
        const [existingUser] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, registerData.email))
          .limit(1)

        if (existingUser) {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'User with this email already exists',
          })
        }

        // Hash the password
        const passwordHash = await AuthService.hashPassword(
          registerData.password
        )

        // Generate email verification token
        const emailVerificationToken = AuthService.generateSecureToken()

        // Create the user
        const [newUser] = await db
          .insert(users)
          .values({
            email: registerData.email,
            passwordHash,
            firstName: registerData.firstName,
            lastName: registerData.lastName,
            emailVerificationToken,
            isEmailVerified: false,
          })
          .returning({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
          })

        // Generate JWT tokens
        const tokens = AuthService.generateTokenPair({
          userId: newUser.id,
          email: newUser.email,
        })

        // Set refresh token as httpOnly cookie
        reply.setCookie('refreshToken', tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })

        // Set access token as cookie (optional, for browser convenience)
        reply.setCookie('accessToken', tokens.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000, // 15 minutes
        })

        return reply.status(201).send({
          success: true,
          message: 'User registered successfully',
          user: newUser,
          tokens,
        })
      } catch (_error) {
        if (_error instanceof ValidationError) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: _error.message,
            field: _error._field,
          })
        }

        request.log.error(_error)
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to register user',
        })
      }
    }
  )

  // Login user
  fastify.post(
    '/auth/login',
    {
      schema: {
        description: 'Login with email and password',
        tags: ['Authentication'],
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const loginData = ValidationService.validateLoginInput(request.body)

        // Find user by email
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, loginData.email))
          .limit(1)

        if (!user || !user.passwordHash) {
          return reply.status(401).send({
            error: 'Authentication Failed',
            message: 'Invalid email or password',
          })
        }

        // Verify password
        const isPasswordValid = await AuthService.comparePassword(
          loginData.password,
          user.passwordHash
        )

        if (!isPasswordValid) {
          return reply.status(401).send({
            error: 'Authentication Failed',
            message: 'Invalid email or password',
          })
        }

        // Update last login time
        await db
          .update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, user.id))

        // Generate JWT tokens
        const tokens = AuthService.generateTokenPair({
          userId: user.id,
          email: user.email,
        })

        // Set cookies
        reply.setCookie('refreshToken', tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        reply.setCookie('accessToken', tokens.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000,
        })

        return reply.send({
          success: true,
          message: 'Login successful',
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isEmailVerified: user.isEmailVerified,
          },
          tokens,
        })
      } catch (_error) {
        if (_error instanceof ValidationError) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: _error.message,
            field: _error._field,
          })
        }

        request.log.error(_error)
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to login',
        })
      }
    }
  )

  // Refresh access token
  fastify.post(
    '/auth/refresh',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        let refreshToken: string | undefined

        // Try to get refresh token from body first, then cookies
        const body = request.body as Record<string, unknown> | undefined
        if (body?.refreshToken) {
          refreshToken = body.refreshToken
        } else {
          refreshToken = request.cookies?.refreshToken
        }

        if (!refreshToken) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Refresh token is required',
          })
        }

        // Verify refresh token
        const payload = AuthService.verifyRefreshToken(refreshToken)

        // Get user data
        const [user] = await db
          .select({
            id: users.id,
            email: users.email,
          })
          .from(users)
          .where(eq(users.id, payload.userId))
          .limit(1)

        if (!user) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'User not found',
          })
        }

        // Generate new tokens
        const tokens = AuthService.generateTokenPair({
          userId: user.id,
          email: user.email,
        })

        // Set new cookies
        reply.setCookie('refreshToken', tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        reply.setCookie('accessToken', tokens.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000,
        })

        return reply.send({
          success: true,
          message: 'Tokens refreshed successfully',
          tokens,
        })
      } catch {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Invalid refresh token',
        })
      }
    }
  )

  // Logout user
  fastify.post(
    '/auth/logout',
    {
      preHandler: authMiddleware,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Clear cookies
      reply.clearCookie('accessToken')
      reply.clearCookie('refreshToken')

      return reply.send({
        success: true,
        message: 'Logged out successfully',
      })
    }
  )

  // Get current user profile
  fastify.get(
    '/auth/me',
    {
      preHandler: authMiddleware,
      schema: {
        description: 'Get current user profile',
        tags: ['Authentication'],
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user!.userId

        const [user] = await db
          .select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            isEmailVerified: users.isEmailVerified,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1)

        if (!user) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'User not found',
          })
        }

        return reply.send({
          success: true,
          user,
        })
      } catch (_error) {
        request.log.error(_error)
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to get user profile',
        })
      }
    }
  )

  // Forgot password
  fastify.post(
    '/auth/forgot-password',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { email } = ValidationService.validateForgotPasswordInput(
          request.body
        )

        const [user] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, email))
          .limit(1)

        if (!user) {
          // Don't reveal if email exists or not
          return reply.send({
            success: true,
            message: 'If the email exists, a password reset link has been sent',
          })
        }

        // Generate password reset token
        const resetToken = AuthService.generateSecureToken()
        const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

        await db
          .update(users)
          .set({
            passwordResetToken: resetToken,
            passwordResetExpires: resetExpires,
          })
          .where(eq(users.id, user.id))

        // Here you would send the email with the reset token
        // For now, we'll just return success

        return reply.send({
          success: true,
          message: 'Password reset link has been sent to your email',
        })
      } catch (_error) {
        if (_error instanceof ValidationError) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: _error.message,
          })
        }

        request.log.error(_error)
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to process password reset request',
        })
      }
    }
  )

  // Reset password
  fastify.post(
    '/auth/reset-password',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { token, newPassword } =
          ValidationService.validateResetPasswordInput(request.body)

        // Validate new password
        const passwordValidation = AuthService.validatePassword(newPassword)
        if (!passwordValidation.valid) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: passwordValidation.message,
          })
        }

        // Find user with valid reset token
        const [user] = await db
          .select({
            id: users.id,
            passwordResetExpires: users.passwordResetExpires,
          })
          .from(users)
          .where(eq(users.passwordResetToken, token))
          .limit(1)

        if (
          !user ||
          !user.passwordResetExpires ||
          user.passwordResetExpires < new Date()
        ) {
          return reply.status(400).send({
            error: 'Invalid Token',
            message: 'Password reset token is invalid or expired',
          })
        }

        // Hash new password
        const passwordHash = await AuthService.hashPassword(newPassword)

        // Update password and clear reset token
        await db
          .update(users)
          .set({
            passwordHash,
            passwordResetToken: null,
            passwordResetExpires: null,
          })
          .where(eq(users.id, user.id))

        return reply.send({
          success: true,
          message: 'Password has been reset successfully',
        })
      } catch (_error) {
        if (_error instanceof ValidationError) {
          return reply.status(400).send({
            error: 'Validation Error',
            message: _error.message,
          })
        }

        request.log.error(_error)
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to reset password',
        })
      }
    }
  )
}
