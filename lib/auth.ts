/**
 * Authentication and authorization utilities
 */

import { supabase } from './supabase'

export interface AuthUser {
  id: string
  email: string
  role?: string
  createdAt: string
}

export interface AuthSession {
  user: AuthUser | null
  token?: string
}

/**
 * Get current authenticated user from Supabase
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    // Fetch user profile with role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return {
      id: user.id,
      email: user.email || '',
      role: profile?.role || 'user',
      createdAt: user.created_at || new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error fetching current user:', error)
    return null
  }
}

/**
 * Sign up new user
 */
export async function signUpUser(
  email: string,
  password: string,
  metadata?: Record<string, unknown>
) {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { error: 'Invalid email format', data: null }
    }

    // Validate password strength (min 8 chars, one uppercase, one number)
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!passwordRegex.test(password)) {
      return {
        error: 'Password must be at least 8 characters with uppercase and number',
        data: null,
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })

    if (error) {
      return { error: error.message, data: null }
    }

    // Create user profile
    if (data.user) {
      await supabase.from('user_profiles').insert({
        id: data.user.id,
        email: data.user.email,
        role: 'user',
        created_at: new Date().toISOString(),
      })
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error signing up user:', error)
    return {
      error: 'An error occurred during sign up',
      data: null,
    }
  }
}

/**
 * Sign in user with email and password
 */
export async function signInUser(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { error: error.message, data: null }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error signing in user:', error)
    return {
      error: 'An error occurred during sign in',
      data: null,
    }
  }
}

/**
 * Sign out current user
 */
export async function signOutUser() {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  } catch (error) {
    console.error('Error signing out user:', error)
    return { error: 'An error occurred during sign out' }
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthUser | null, requiredRole: string): boolean {
  if (!user) return false
  if (requiredRole === 'user') return true
  return user.role === requiredRole
}

/**
 * Verify API token (for API requests)
 */
export async function verifyApiToken(token: string): Promise<AuthUser | null> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      return null
    }

    return {
      id: user.id,
      email: user.email || '',
      role: 'user',
      createdAt: user.created_at || new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error verifying token:', error)
    return null
  }
}
