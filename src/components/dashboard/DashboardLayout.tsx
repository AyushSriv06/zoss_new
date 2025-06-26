import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { 
  Home, 
  Package, 
  Calendar, 
  Shield, 
  Settings, 
  LogOut,
  Bell,
  User
} from 'lucide-react'

const DashboardLayout = () => {
  const { userProfile, signOut, isAdmin } = useAuth()
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My Products', href: '/dashboard/products', icon: Package },
    { name: 'Services', href: '/dashboard/services', icon: Calendar },
    { name: 'Warranty', href: '/dashboard/warranty', icon: Shield },
    { name: 'Profile', href: '/dashboard/profile', icon: User },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center px-6 border-b">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/adc708a3-75ca-4634-8eaa-778c22587ac5.png" 
                alt="Zoss Water" 
                className="h-8 w-8"
              />
              <span className="font-heading text-xl font-bold text-zoss-blue">
                Zoss Water
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-zoss-green text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}

            {isAdmin && (
              <div className="pt-4 mt-4 border-t">
                <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Admin
                </p>
                <Link
                  to="/admin"
                  className="mt-2 flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <Settings className="mr-3 h-5 w-5" />
                  Admin Panel
                </Link>
              </div>
            )}
          </nav>

          {/* User info and logout */}
          <div className="border-t p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-zoss-green rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userProfile?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userProfile?.email}
                </p>
              </div>
            </div>
            <Button
              onClick={signOut}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
          </h1>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout