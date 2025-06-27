import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, User } from '@/lib/supabase'
import { toast } from 'sonner'

interface AuthContextType {
  user: SupabaseUser | null
  userProfile: User | null
  isAdmin: boolean
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔄 AuthProvider: Initializing authentication state...')
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('📋 AuthProvider: Initial session check:', {
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email
      })
      
      setUser(session?.user ?? null)
      if (session?.user) {
        console.log('👤 AuthProvider: User found in initial session, fetching profile...')
        fetchUserProfile(session.user.id)
        checkAdminStatus(session.user.id)
      } else {
        console.log('❌ AuthProvider: No user in initial session')
      }
      
      console.log('🏁 AuthProvider: Initial setup complete, setting loading to false')
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 AuthProvider: Auth state change detected:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
          userEmail: session?.user?.email
        })
        
        setUser(session?.user ?? null)
        if (session?.user) {
          console.log('👤 AuthProvider: User authenticated, fetching profile...')
          await fetchUserProfile(session.user.id)
          await checkAdminStatus(session.user.id)
        } else {
          console.log('🚪 AuthProvider: User signed out, clearing profile data')
          setUserProfile(null)
          setIsAdmin(false)
        }
        
        console.log('🏁 AuthProvider: Auth state change processed, setting loading to false')
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('📊 AuthProvider: Fetching user profile for:', userId)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      console.log('✅ AuthProvider: User profile fetched successfully:', data)
      setUserProfile(data)
    } catch (error) {
      console.error('❌ AuthProvider: Error fetching user profile:', error)
      toast.error('Failed to load user profile')
    }
  }

  const checkAdminStatus = async (userId: string) => {
    try {
      console.log('🔐 AuthProvider: Checking admin status for:', userId)
      const { data, error } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      const adminStatus = !!data
      console.log('✅ AuthProvider: Admin status checked:', { isAdmin: adminStatus, role: data?.role })
      setIsAdmin(adminStatus)
    } catch (error) {
      console.error('❌ AuthProvider: Error checking admin status:', error)
      toast.error('Failed to check admin permissions')
      setIsAdmin(false)
    }
  }

  const signInWithGoogle = async () => {
    console.log('🔑 AuthProvider: Initiating Google sign-in...')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    })
    if (error) {
      console.error('❌ AuthProvider: Google sign-in error:', error)
      throw error
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    console.log('📧 AuthProvider: Initiating email sign-in for:', email)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) {
      console.error('❌ AuthProvider: Email sign-in error:', error)
      throw error
    }
    console.log('✅ AuthProvider: Email sign-in successful')
  }

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    console.log('📝 AuthProvider: Initiating email sign-up for:', email)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    })
    if (error) {
      console.error('❌ AuthProvider: Email sign-up error:', error)
      throw error
    }
    console.log('✅ AuthProvider: Email sign-up successful')
  }

  const signOut = async () => {
    console.log('🚪 AuthProvider: Initiating sign-out...')
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('❌ AuthProvider: Sign-out error:', error)
      throw error
    }
    console.log('✅ AuthProvider: Sign-out successful')
  }

  const value = {
    user,
    userProfile,
    isAdmin,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut
  }

  console.log('🔍 AuthProvider: Current state:', {
    hasUser: !!user,
    hasUserProfile: !!userProfile,
    isAdmin,
    loading,
    userId: user?.id,
    userEmail: user?.email
  })

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}