'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  full_name: string
  role: 'Master Admin' | 'Engineering' | 'IT' | 'User'
  department_id: string | null
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signOut: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchingProfile, setFetchingProfile] = useState(false)
  const [lastFetchedUserId, setLastFetchedUserId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (!mounted) return
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        setError(sessionError.message)
        setLoading(false)
        return
      }

      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      
      setUser(session?.user ?? null)
      if (session?.user) {
        // Only fetch if user ID changed or not currently fetching
        if (session.user.id !== lastFetchedUserId && !fetchingProfile) {
          fetchUserProfile(session.user.id)
        }
      } else {
        setUserProfile(null)
        setError(null)
        setLoading(false)
        setLastFetchedUserId(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [lastFetchedUserId, fetchingProfile])

  const fetchUserProfile = async (userId: string) => {
    // Prevent multiple simultaneous fetches for the same user
    if (fetchingProfile && lastFetchedUserId === userId) {
      console.log('Already fetching profile for user:', userId)
      return
    }

    setFetchingProfile(true)
    setLastFetchedUserId(userId)
    
    try {
      console.log('Fetching user profile for ID:', userId)
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        
        // Handle infinite recursion error (42P17)
        if (error.code === '42P17') {
          console.error('Infinite recursion detected in RLS policy!')
          setError('Error konfigurasi database: Infinite recursion di RLS policy. Silakan jalankan migration 013_fix_infinite_recursion_users_rls.sql di Supabase SQL Editor.')
          setUserProfile(null)
          setLoading(false)
          return
        }
        
        // Jika user tidak ada di tabel users, coba buat otomatis
        if (error.code === 'PGRST116') {
          console.log('User profile not found, attempting to create...')
          
          // Get auth user data
          const { data: authUser } = await supabase.auth.getUser()
          
          if (authUser?.user) {
            // Try to create user profile automatically
            const { data: newUser, error: createError } = await supabase
              .from('users')
              .insert({
                id: authUser.user.id,
                email: authUser.user.email || '',
                full_name: authUser.user.user_metadata?.full_name || authUser.user.email?.split('@')[0] || 'User',
                role: authUser.user.user_metadata?.role || 'User',
                is_active: true,
              })
              .select()
              .single()

            if (createError) {
              console.error('Error creating user profile:', createError)
              // Check if it's also recursion error
              if (createError.code === '42P17') {
                setError('Error konfigurasi database: Infinite recursion di RLS policy. Silakan jalankan migration 013_fix_infinite_recursion_users_rls.sql di Supabase SQL Editor.')
              } else {
                setError('User profile tidak ditemukan. Silakan hubungi administrator untuk membuat profil user.')
              }
              setUserProfile(null)
            } else if (newUser) {
              console.log('User profile created successfully:', newUser)
              const normalizedData = {
                ...newUser,
                role: newUser.role?.trim() as 'Master Admin' | 'Engineering' | 'IT' | 'User'
              }
              setUserProfile(normalizedData)
              setError(null)
            }
          } else {
            setError('User profile tidak ditemukan. Silakan hubungi administrator untuk membuat profil user.')
            setUserProfile(null)
          }
        } else {
          setError(`Error: ${error.message}`)
          setUserProfile(null)
        }
        setLoading(false)
        return
      }
      
      if (data) {
        // Normalize role - trim whitespace
        const normalizedData = {
          ...data,
          role: data.role?.trim() as 'Master Admin' | 'Engineering' | 'IT' | 'User'
        }
        console.log('User Profile loaded successfully:', normalizedData)
        setUserProfile(normalizedData)
        setError(null)
      } else {
        console.warn('No data returned from users table')
        setError('User profile tidak ditemukan di database')
        setUserProfile(null)
      }
    } catch (error: any) {
      console.error('Unexpected error fetching user profile:', error)
      setError(error.message || 'Terjadi kesalahan saat memuat profil user')
      setUserProfile(null)
    } finally {
      setLoading(false)
      setFetchingProfile(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
    setError(null)
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
