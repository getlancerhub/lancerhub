import { FastifyRequest, FastifyReply } from 'fastify'
import { JWTPayload } from '../lib/auth.js'

// Extend FastifyRequest to include user information
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JWTPayload
    user: JWTPayload
  }
}

/**
 * Authentication middleware function
 * Verifies the JWT token using Fastify's JWT plugin
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify()
  } catch {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Valid authentication token required',
    })
  }
}

/**
 * Optional authentication middleware
 * Does not fail if no token is provided, but validates if present
 */
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  try {
    await request.jwtVerify()
  } catch {
    // Invalid token or no token, but we continue without user info
    // Fastify JWT plugin will still set request.user to undefined
  }
}

/**
 * Workspace-specific authentication middleware
 * Ensures user has access to the specified workspace
 */
export function createWorkspaceAuthMiddleware(
  workspaceIdParam = 'workspaceId'
) {
  return async function workspaceAuthMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    // First apply regular auth
    await authMiddleware(request, reply)

    // If auth failed, the reply would already be sent
    if (reply.sent) return

    const user = request.user as JWTPayload
    const workspaceId = (request.params as Record<string, string>)[
      workspaceIdParam
    ]

    if (!workspaceId) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Workspace ID is required',
      })
    }

    // Check if user has access to this workspace
    // This is a simplified check - you might want to implement more complex role-based access
    if (user.workspaceId && user.workspaceId !== workspaceId) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'No access to this workspace',
      })
    }
  }
}

/**
 * Role-based authentication middleware factory
 * Creates middleware that checks for specific roles or permissions
 */
export function createRoleMiddleware(allowedRoles: string[]) {
  return async function roleMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    // First apply regular auth
    await authMiddleware(request, reply)

    // If auth failed, the reply would already be sent
    if (reply.sent) return

    const user = request.user!

    // For now, we'll implement basic role checking
    // You can extend this based on your role system
    const userRole = (user as JWTPayload & { role?: string }).role || 'user'

    if (!allowedRoles.includes(userRole)) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      })
    }
  }
}
