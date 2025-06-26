import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, UserProduct, Service } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Package, Calendar, Shield, AlertTriangle, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const Dashboard = () => {
  const { userProfile } = useAuth()
  const [userProducts, setUserProducts] = useState<UserProduct[]>([])
  const [upcomingServices, setUpcomingServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userProfile) {
      fetchDashboardData()
    }
  }, [userProfile])

  const fetchDashboardData = async () => {
    try {
      // Fetch user products
      const { data: products, error: productsError } = await supabase
        .from('user_products')
        .select(`
          *,
          master_product:master_products(*)
        `)
        .eq('user_id', userProfile?.id)

      if (productsError) throw productsError

      // Fetch upcoming services
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          user_product:user_products(
            *,
            master_product:master_products(*)
          )
        `)
        .in('user_product_id', products?.map(p => p.id) || [])
        .in('status', ['Due Soon', 'Overdue'])
        .order('next_service_due_date', { ascending: true })

      if (servicesError) throw servicesError

      setUserProducts(products || [])
      setUpcomingServices(services || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getWarrantyStatus = (product: UserProduct) => {
    if (!product.master_product) return 'Unknown'
    
    const purchaseDate = new Date(product.purchase_date)
    const warrantyEndDate = new Date(purchaseDate)
    warrantyEndDate.setMonth(warrantyEndDate.getMonth() + product.master_product.warranty_period_months)
    
    const now = new Date()
    const daysLeft = Math.ceil((warrantyEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysLeft < 0) return 'Expired'
    if (daysLeft < 30) return 'Expiring Soon'
    return 'Active'
  }

  const bookService = (productId: string, productName: string) => {
    const message = `Hi, I would like to book a service for my ${productName} (Product ID: ${productId}). Please let me know the available slots.`
    const whatsappUrl = `https://wa.me/919876543210?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-zoss-blue to-zoss-green rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Welcome back, {userProfile?.name}!
        </h2>
        <p className="text-blue-100">
          Manage your Zoss Water products and services from your dashboard
        </p>
      </div>

      {/* Service Notifications */}
      {upcomingServices.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            You have {upcomingServices.length} service(s) due soon. 
            <Link to="/dashboard/services" className="ml-2 underline font-medium">
              View details
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProducts.length}</div>
            <p className="text-xs text-muted-foreground">
              Registered products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Services Due</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {upcomingServices.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Upcoming services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Warranties</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {userProducts.filter(p => getWarrantyStatus(p) === 'Active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Under warranty
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AMC Plans</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {userProducts.filter(p => p.amc_valid_until && new Date(p.amc_valid_until) > new Date()).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active AMC plans
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Recent Products</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No products registered yet</p>
                <Link to="/dashboard/products">
                  <Button className="bg-zoss-green hover:bg-zoss-green/90">
                    Add Your First Product
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {userProducts.slice(0, 3).map((product) => (
                  <div key={product.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <img
                      src={product.master_product?.image_url || '/placeholder.svg'}
                      alt={product.master_product?.model_name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{product.master_product?.model_name}</h4>
                      <p className="text-sm text-gray-500">
                        Purchased: {new Date(product.purchase_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      getWarrantyStatus(product) === 'Active' 
                        ? 'bg-green-100 text-green-800'
                        : getWarrantyStatus(product) === 'Expiring Soon'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {getWarrantyStatus(product)}
                    </div>
                  </div>
                ))}
                {userProducts.length > 3 && (
                  <Link to="/dashboard/products">
                    <Button variant="outline" className="w-full">
                      View All Products
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Upcoming Services</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingServices.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No upcoming services</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingServices.slice(0, 3).map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">
                        {service.user_product?.master_product?.model_name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Due: {service.next_service_due_date ? new Date(service.next_service_due_date).toLocaleDateString() : 'TBD'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        service.status === 'Overdue' 
                          ? 'bg-red-100 text-red-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {service.status}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => bookService(
                          service.user_product?.id || '',
                          service.user_product?.master_product?.model_name || ''
                        )}
                        className="bg-zoss-green hover:bg-zoss-green/90"
                      >
                        Book Service
                      </Button>
                    </div>
                  </div>
                ))}
                {upcomingServices.length > 3 && (
                  <Link to="/dashboard/services">
                    <Button variant="outline" className="w-full">
                      View All Services
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard