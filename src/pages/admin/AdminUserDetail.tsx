import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, User, UserProduct, MasterProduct, Service } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Edit } from 'lucide-react';
import AdminProductForm from './AdminProductForm';
import AdminServiceForm from './AdminServiceForm';

const AdminUserDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [userProducts, setUserProducts] = useState<UserProduct[]>([]);
  const [masterProducts, setMasterProducts] = useState<MasterProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<UserProduct | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState<{product: UserProduct, service?: Service} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUser();
      fetchUserProducts();
      fetchMasterProducts();
    }
    // eslint-disable-next-line
  }, [userId]);

  const fetchUser = async () => {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (!error) setUser(data);
  };

  const fetchUserProducts = async () => {
    const { data, error } = await supabase
      .from('user_products')
      .select('*, master_product:master_products(*), services:services(*)')
      .eq('user_id', userId);
    if (!error) setUserProducts(data || []);
  };

  const fetchMasterProducts = async () => {
    const { data, error } = await supabase.from('master_products').select('*');
    if (!error) setMasterProducts(data || []);
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product: UserProduct) => {
    setSelectedProduct(product);
    setShowProductForm(true);
  };

  const handleProductFormClose = (refresh = false) => {
    setShowProductForm(false);
    setSelectedProduct(null);
    if (refresh) fetchUserProducts();
  };

  const handleAddService = (product: UserProduct) => {
    setShowServiceForm({ product });
  };

  const handleEditService = (product: UserProduct, service: Service) => {
    setShowServiceForm({ product, service });
  };

  const handleServiceFormClose = (refresh = false) => {
    setShowServiceForm(null);
    if (refresh) fetchUserProducts();
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!user) return <div className="p-8 text-center">User not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-4 flex items-center"><ArrowLeft className="mr-2 h-4 w-4" />Back to Users</Button>
        <h2 className="text-2xl font-bold mb-2">{user.name || user.email}</h2>
        <p className="text-gray-600 mb-6">{user.email} | Role: {user.role}</p>
        <h3 className="text-xl font-semibold mb-2">Products</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {userProducts.map((prod) => (
            <Card key={prod.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img src={prod.master_product?.image_url || '/placeholder.svg'} alt={prod.master_product?.model_name} className="w-10 h-10 object-cover rounded" />
                  <div>
                    <CardTitle className="text-lg">{prod.master_product?.model_name}</CardTitle>
                    <p className="text-xs text-gray-500">Serial: {prod.serial_number}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleEditProduct(prod)}><Edit className="h-4 w-4" /> Edit</Button>
              </CardHeader>
              <CardContent>
                <div className="text-sm mb-2">Purchase Date: {new Date(prod.purchase_date).toLocaleDateString()}</div>
                <div className="text-sm mb-2">AMC Valid Until: {prod.amc_valid_until ? new Date(prod.amc_valid_until).toLocaleDateString() : 'N/A'}</div>
                <div className="text-sm mb-2">Warranty: {prod.master_product?.warranty_period_months} months</div>
                <div className="text-sm mb-2">Service Interval: {prod.master_product?.standard_service_interval_months} months</div>
                <div className="mt-2">
                  <h4 className="font-semibold mb-1">Service Times</h4>
                  <ul className="list-disc ml-5">
                    {(prod.services || []).map((svc: Service) => (
                      <li key={svc.id} className="mb-1">
                        {svc.service_date ? new Date(svc.service_date).toLocaleDateString() : 'TBD'} - {svc.status}
                        <Button size="sm" variant="outline" className="ml-2" onClick={() => handleEditService(prod, svc)}>Edit</Button>
                      </li>
                    ))}
                  </ul>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => handleAddService(prod)}>Add Service Time</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Button className="bg-zoss-green hover:bg-zoss-green/90" onClick={handleAddProduct}>Add Product</Button>
        {showProductForm && (
          <AdminProductForm
            userId={user.id}
            masterProducts={masterProducts}
            product={selectedProduct}
            onClose={handleProductFormClose}
          />
        )}
        {showServiceForm && (
          <AdminServiceForm
            userProduct={showServiceForm.product}
            service={showServiceForm.service}
            onClose={handleServiceFormClose}
          />
        )}
      </div>
    </div>
  );
};

export default AdminUserDetail; 