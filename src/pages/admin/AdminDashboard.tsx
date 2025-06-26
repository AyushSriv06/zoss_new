import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, MasterProduct, UserProduct, Service } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Package, Users, Calendar, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { Navigate } from 'react-router-dom'

const AdminDashboard = () => {
  const { isAdmin, loading: authLoading } = useAuth()
  const [masterProducts, setMasterProducts] = useState<MasterProduct[]>([])
  const [userProducts, setUserProducts] = useState<UserProduct[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [newProduct, setNewProduct] = useState({
    model_name: '',
    description: '',
    image_url: '',
    warranty_period_months: 12,
    standard_service_interval_months: 6
  })

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData()
    }
  }, [isAdmin])

  if (authLoading) {
    return <div>Loading...</div>
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  const fetchAdminData = async () => {
    try {
      // Fetch master products
      const { data: products, error: productsError } = await supabase
        .from('master_products')
        .select('*')
        .order('created_at', { ascending: false })

      if (productsError) throw productsError

      // Fetch user products with user info
      const { data: userProds, error: userProdsError } = await supabase
        .from('user_products')
        .select(`
          *,
          user:users(*),
          master_product:master_products(*)
        `)
        .order('created_at', { ascending: false })

      if (userProdsError) throw userProdsError

      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          user_product:user_products(
            *,
            user:users(*),
            master_product:master_products(*)
          )
        `)
        .order('created_at', { ascending: false })

      if (servicesError) throw servicesError

      setMasterProducts(products || [])
      setUserProducts(userProds || [])
      setServices(servicesData || [])
    } catch (error) {
      console.error('Error fetching admin data:', error)
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { error } = await supabase
        .from('master_products')
        .insert(newProduct)

      if (error) throw error

      toast.success('Product added successfully!')
      setNewProduct({
        model_name: '',
        description: '',
        image_url: '',
        warranty_period_months: 12,
        standard_service_interval_months: 6
      })
      fetchAdminData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add product')
    }
  }

  const scheduleService = async (userProductId: string, serviceDueDate: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .insert({
          user_product_id: userProductId,
          next_service_due_date: serviceDueDate,
          status: 'Upcoming'
        })

      if (error) throw error

      toast.success('Service scheduled successfully!')
      fetchAdminData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule service')
    }
  }

  if (loading) {
    return <div>Loading admin dashboard...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage products, services, and customer data</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{masterProducts.length}</div>
              <p className="text-xs text-muted-foreground">Product models</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customer Products</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userProducts.length}</div>
              <p className="text-xs text-muted-foreground">Registered products</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Services</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {services.filter(s => s.status === 'Due Soon' || s.status === 'Overdue').length}
              </div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(userProducts.map(p => p.user_id)).size}
              </div>
              <p className="text-xs text-muted-foreground">Unique customers</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">Product Management</TabsTrigger>
            <TabsTrigger value="customers">Customer Products</TabsTrigger>
            <TabsTrigger value="services">Service Management</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Master Products</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-zoss-green hover:bg-zoss-green/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Product Model</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddProduct} className="space-y-4">
                    <div>
                      <Label htmlFor="model_name">Model Name</Label>
                      <Input
                        id="model_name"
                        value={newProduct.model_name}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, model_name: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newProduct.description}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="image_url">Image URL</Label>
                      <Input
                        id="image_url"
                        value={newProduct.image_url}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, image_url: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="warranty_period">Warranty Period (Months)</Label>
                      <Input
                        id="warranty_period"
                        type="number"
                        value={newProduct.warranty_period_months}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, warranty_period_months: parseInt(e.target.value) }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="service_interval">Service Interval (Months)</Label>
                      <Input
                        id="service_interval"
                        type="number"
                        value={newProduct.standard_service_interval_months}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, standard_service_interval_months: parseInt(e.target.value) }))}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full bg-zoss-green hover:bg-zoss-green/90">
                      Add Product
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {masterProducts.map((product) => (
                <Card key={product.product_id}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <img
                        src={product.image_url || '/placeholder.svg'}
                        alt={product.model_name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <CardTitle className="text-lg">{product.model_name}</CardTitle>
                        <p className="text-sm text-gray-500">{product.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Warranty:</span>
                        <span>{product.warranty_period_months} months</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service Interval:</span>
                        <span>{product.standard_service_interval_months} months</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <h2 className="text-xl font-semibold">Customer Products</h2>
            <div className="space-y-4">
              {userProducts.map((product) => (
                <Card key={product.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <img
                          src={product.master_product?.image_url || '/placeholder.svg'}
                          alt={product.master_product?.model_name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <h3 className="font-medium">{product.master_product?.model_name}</h3>
                          <p className="text-sm text-gray-500">
                            Customer: {(product as any).user?.name || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Purchased: {new Date(product.purchase_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              Schedule Service
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Schedule Service</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={(e) => {
                              e.preventDefault()
                              const formData = new FormData(e.target as HTMLFormElement)
                              const dueDate = formData.get('due_date') as string
                              scheduleService(product.id, dueDate)
                            }} className="space-y-4">
                              <div>
                                <Label htmlFor="due_date">Service Due Date</Label>
                                <Input
                                  id="due_date"
                                  name="due_date"
                                  type="date"
                                  required
                                />
                              </div>
                              <Button type="submit" className="w-full bg-zoss-green hover:bg-zoss-green/90">
                                Schedule Service
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <h2 className="text-xl font-semibold">Service Management</h2>
            <div className="space-y-4">
              {services.map((service) => (
                <Card key={service.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">
                          {service.user_product?.master_product?.model_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Customer: {(service.user_product as any)?.user?.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Due: {service.next_service_due_date ? new Date(service.next_service_due_date).toLocaleDateString() : 'TBD'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          service.status === 'Overdue' 
                            ? 'bg-red-100 text-red-800'
                            : service.status === 'Due Soon'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {service.status}
                        </span>
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              await supabase
                                .from('services')
                                .update({ status: 'Completed' })
                                .eq('id', service.id)
                              
                              toast.success('Service marked as completed')
                              fetchAdminData()
                            } catch (error: any) {
                              toast.error('Failed to update service status')
                            }
                          }}
                        >
                          Mark Complete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default AdminDashboard