/**
 * Real authentication using backend API
 */
import { User } from '@/types';
import { authAPI } from './api';
import { useState, useEffect } from 'react';

const CURRENT_USER_KEY = 'currentUser';

// Get current user from localStorage (cached)
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userJson = localStorage.getItem(CURRENT_USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
}

// Save current user to localStorage
function saveCurrentUser(user: User): void {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

// Remove current user
function removeCurrentUser(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
}

/**
 * Login user with email and password
 */
export async function login(email: string, password: string): Promise<User> {
  try {
    // Login and get token
    await authAPI.login(email, password);
    
    // Get user info
    const userData = await authAPI.getCurrentUser();
    
    const user: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role as 'organizer' | 'student',
    };
    
    saveCurrentUser(user);
    return user;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка входа';
    throw new Error(message);
  }
}

/**
 * Register new user
 */
export async function signup(
  email: string,
  name: string,
  password: string,
  role: 'organizer' | 'student'
): Promise<User> {
  try {
    // Register user
    const userData = await authAPI.register(email, name, password, role);
    
    // Auto-login after registration
    await authAPI.login(email, password);
    
    const user: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role as 'organizer' | 'student',
    };
    
    saveCurrentUser(user);
    return user;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка регистрации';
    throw new Error(message);
  }
}

/**
 * Logout user
 */
export function logout(): void {
  authAPI.logout();
  removeCurrentUser();
}

/**
 * Refresh current user from API
 */
export async function refreshCurrentUser(): Promise<User | null> {
  try {
    const userData = await authAPI.getCurrentUser();
    const user: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role as 'organizer' | 'student',
    };
    saveCurrentUser(user);
    return user;
  } catch (error) {
    // Token might be expired, logout
    logout();
    return null;
  }
}

/**
 * React hook for getting current user
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  return { user };
}

