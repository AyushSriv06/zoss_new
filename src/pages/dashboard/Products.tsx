import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, UserProduct, MasterProduct } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Package, Calendar, Shield } from 'lucide-react'
import { toast } from 'sonner'

const Products = () => {
  const { userProfile } = useAuth()
  const [userProducts, setUserProducts] = useState<UserProduct[]>([])
  const [masterProducts, setMasterProducts] = useState<MasterProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [newProduct, setNewProduct] = useState({
    master_product_id: '',
    purchase_date: '',
    serial_number: '',
    amc_valid_until: ''
  })

  useEffect(() => {
    fetchProducts()
    fetchMasterProducts()
  }, [userProfile])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('user_products')
        .select(`
          *,
          master_product:master_products(*)
        `)
        .eq('user_id', userProfile?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUserProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const fetchMasterProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('master_products')
        .select('*')
        .order('model_name')

      if (error) throw error
      setMasterProducts(data || [])
    } catch (error) {
      console.error('Error fetching master products:', error)
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAddingProduct(true)

    try {
      const { error } = await supabase
        .from('user_products')
        .insert({
          user_id: userProfile?.id,
          master_product_id: newProduct.master_product_id,
          purchase_date: newProduct.purchase_date,
          serial_number: newProduct.serial_number || null,
          amc_valid_until: newProduct.amc_valid_until || null
        })

      if (error) throw error

      toast.success('Product added successfully!')
      setNewProduct({
        master_product_id: '',
        purchase_date: '',
        serial_number: '',
        amc_valid_until: ''
      })
      fetchProducts()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add product')
    } finally {
      setIsAddingProduct(false)
    }
  }

  const getWarrantyStatus = (product: UserProduct) => {
    if (!product.master_product) return { status: 'Unknown', color: 'gray' }
    
    const purchaseDate = new Date(product.purchase_date)
    const warrantyEndDate = new Date(purchaseDate)
    warrantyEndDate.setMonth(warrantyEndDate.getMonth() + product.master_product.warranty_period_months)
    
    const now = new Date()
    const daysLeft = Math.ceil((warrantyEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysLeft < 0) return { status: 'Expired', color: 'red' }
    if (daysLeft < 30) return { status: 'Expiring Soon', color: 'orange' }
    return { status: 'Active', color: 'green' }
  }

  const getAmcStatus = (product: UserProduct) => {
    if (!product.amc_valid_until) return { status: 'No AMC', color: 'gray' }
    
    const amcEndDate = new Date(product.amc_valid_until)
    const now = new Date()
    const daysLeft = Math.ceil((amcEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysLeft < 0) return { status: 'Expired', color: 'red' }
    if (daysLeft < 30) return { status: 'Expiring Soon', color: 'orange' }
    return { status: 'Active', color: 'green' }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Products</h2>
          <p className="text-gray-600">Manage your Zoss Water products</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-zoss-green hover:bg-zoss-green/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <Label htmlFor="product">Product Model</Label>
                <Select
                  value={newProduct.master_product_id}
                  onValueChange={(value) => setNewProduct(prev => ({ ...prev, master_product_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {masterProducts.map((product) => (
                      <SelectItem key={product.product_id} value={product.product_id}>
                        {product.model_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="purchase_date">Purchase Date</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={newProduct.purchase_date}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, purchase_date: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="serial_number">Serial Number (Optional)</Label>
                <Input
                  id="serial_number"
                  value={newProduct.serial_number}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, serial_number: e.target.value }))}
                  placeholder="Enter serial number"
                />
              </div>

              <div>
                <Label htmlFor="amc_valid_until">AMC Valid Until (Optional)</Label>
                <Input
                  id="amc_valid_until"
                  type="date"
                  value={newProduct.amc_valid_until}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, amc_valid_until: e.target.value }))}
                />
              </div>

              <Button
                type="submit"
                disabled={isAddingProduct || !newProduct.master_product_id || !newProduct.purchase_date}
                className="w-full bg-zoss-green hover:bg-zoss-green/90"
              >
                {isAddingProduct ? 'Adding...' : 'Add Product'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Products Grid */}
      {userProducts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-500 mb-6">Add your first Zoss Water product to get started</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-zoss-green hover:bg-zoss-green/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div>
                    <Label htmlFor="product">Product Model</Label>
                    <Select
                      value={newProduct.master_product_id}
                      onValueChange={(value) => setNewProduct(prev => ({ ...prev, master_product_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {masterProducts.map((product) => (
                          <SelectItem key={product.product_id} value={product.product_id}>
                            {product.model_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="purchase_date">Purchase Date</Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      value={newProduct.purchase_date}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, purchase_date: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="serial_number">Serial Number (Optional)</Label>
                    <Input
                      id="serial_number"
                      value={newProduct.serial_number}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, serial_number: e.target.value }))}
                      placeholder="Enter serial number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="amc_valid_until">AMC Valid Until (Optional)</Label>
                    <Input
                      id="amc_valid_until"
                      type="date"
                      value={newProduct.amc_valid_until}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, amc_valid_until: e.target.value }))}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isAddingProduct || !newProduct.master_product_id || !newProduct.purchase_date}
                    className="w-full bg-zoss-green hover:bg-zoss-green/90"
                  >
                    {isAddingProduct ? 'Adding...' : 'Add Product'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userProducts.map((product) => {
            const warrantyStatus = getWarrantyStatus(product)
            const amcStatus = getAmcStatus(product)
            
            return (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={product.master_product?.image_url || '/placeholder.svg'}
                      alt={product.master_product?.model_name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div>
                      <CardTitle className="text-lg">{product.master_product?.model_name}</CardTitle>
                      <p className="text-sm text-gray-500">
                        {product.serial_number ? `S/N: ${product.serial_number}` : 'No serial number'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">Purchased</span>
                    </div>
                    <span className="text-sm font-medium">
                      {new Date(product.purchase_date).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">Warranty</span>
                    </div>
                    <span className={`text-sm font-medium px-2 py-1 rounded ${
                      warrantyStatus.color === 'green' 
                        ? 'bg-green-100 text-green-800'
                        : warrantyStatus.color === 'orange'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {warrantyStatus.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">AMC</span>
                    </div>
                    <span className={`text-sm font-medium px-2 py-1 rounded ${
                      amcStatus.color === 'green' 
                        ? 'bg-green-100 text-green-800'
                        : amcStatus.color === 'orange'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {amcStatus.status}
                    </span>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        const message = `Hi, I need support for my ${product.master_product?.model_name} (Product ID: ${product.id}). Please assist me.`
                        const whatsappUrl = `https://wa.me/919876543210?text=${encodeURIComponent(message)}`
                        window.open(whatsappUrl, '_blank')
                      }}
                    >
                      Contact Support
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Products