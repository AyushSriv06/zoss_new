import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, User } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Navigate, useNavigate } from 'react-router-dom'

const AdminDashboard = () => {
  const { userProfile, loading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setUsersLoading(true)
    const { data, error } = await supabase.from('users').select('*')
    if (error) {
      toast.error('Failed to fetch users')
      setUsersLoading(false)
      return
    }
    setUsers(data || [])
    setUsersLoading(false)
  }

  if (loading || usersLoading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'superadmin')) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <h2 className="text-xl font-semibold mb-4">All Users</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.map(u => (
            <Card key={u.id} className="cursor-pointer hover:shadow-lg transition" onClick={() => navigate(`/admin/user/${u.id}`)}>
              <CardContent className="p-4">
                <div className="flex flex-col">
                  <span className="font-semibold text-lg">{u.name || u.email}</span>
                  <span className="text-gray-500 text-sm">{u.email}</span>
                  <span className="text-xs mt-1">Role: {u.role}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
