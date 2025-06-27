import { useAuth } from '@/contexts/AuthContext'
import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth()

  console.log('🛡️ ProtectedRoute: Checking access:', {
    hasUser: !!user,
    loading,
    userId: user?.id,
    userEmail: user?.email
  })

  if (loading) {
    console.log('⏳ ProtectedRoute: Still loading, showing spinner...')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-zoss-green"></div>
      </div>
    )
  }

  if (!user) {
    console.log('🚫 ProtectedRoute: No user found, redirecting to login...')
    return <Navigate to="/login" replace />
  }

  console.log('✅ ProtectedRoute: User authenticated, rendering protected content')
  return <>{children}</>
}

export default ProtectedRoute