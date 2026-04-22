import { supabase } from './supabase'
import { logger } from './logger'

export async function auditLog(
  userId: string,
  action: string,
  metadata?: Record<string, any>
) {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('Failed to create audit log', error as Error)
  }
}

export async function trackLoginAttempt(email: string, success: boolean, ip?: string) {
  logger.info(success ? 'Login successful' : 'Login failed', {
    email,
    ip,
    timestamp: new Date().toISOString(),
  })

  if (!success) {
    const attempts = await getRecentFailedAttempts(email, 15 * 60 * 1000)
    if (attempts > 5) {
      logger.warn('Brute force attempt detected', {
        email,
        attempts,
      })
    }
  }
}

export async function getRecentFailedAttempts(email: string, timeWindow: number): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('login_attempts')
      .select('*')
      .eq('email', email)
      .eq('success', false)
      .gt('timestamp', new Date(Date.now() - timeWindow).toISOString())

    return error ? 0 : data?.length || 0
  } catch {
    return 0
  }
}

export async function trackPasswordChange(userId: string, email: string) {
  await auditLog(userId, 'password_changed', { email })
  logger.info('Password changed', { userId, email })
}

export async function trackRoleChange(userId: string, oldRole: string, newRole: string) {
  await auditLog(userId, 'role_changed', { oldRole, newRole })
  logger.info('User role changed', { userId, oldRole, newRole })
}
