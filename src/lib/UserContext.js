import { createContext, useContext } from 'react'
import { getStoredUser } from './user.js'

export const UserContext = createContext(null)
export const UserSetterContext = createContext(null)

// Falls back to localStorage when rendered outside the provider (e.g. isolated tests).
// In production the App.jsx provider always supplies a fresh Supabase-sourced value.
export function useUser() {
  return useContext(UserContext) ?? getStoredUser()
}

export function useSetUser() {
  return useContext(UserSetterContext)
}
