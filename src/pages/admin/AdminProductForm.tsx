import { useState } from 'react';
import { supabase, MasterProduct, UserProduct } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface AdminProductFormProps {
  userId: string;
  masterProducts: MasterProduct[];
  product?: UserProduct | null;
  onClose: (refresh?: boolean) => void;
}

const AdminProductForm = ({ userId, masterProducts, product, onClose }: AdminProductFormProps) => {
  const [form, setForm] = useState({
    master_product_id: product?.master_product_id || '',
    purchase_date: product?.purchase_date ? product.purchase_date.slice(0, 10) : '',
    serial_number: product?.serial_number || '',
    amc_valid_until: product?.amc_valid_until ? product.amc_valid_until.slice(0, 10) : '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (product) {
        // Update
        const { error } = await supabase
          .from('user_products')
          .update({ ...form })
          .eq('id', product.id);
        if (error) throw error;
        toast.success('Product updated!');
      } else {
        // Insert
        const { error } = await supabase
          .from('user_products')
          .insert({ ...form, user_id: userId });
        if (error) throw error;
        toast.success('Product added!');
      }
      onClose(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="master_product_id">Product Model</Label>
            <select
              id="master_product_id"
              name="master_product_id"
              value={form.master_product_id}
              onChange={handleChange}
              required
              className="w-full border rounded px-2 py-2"
            >
              <option value="">Select a model</option>
              {masterProducts.map(mp => (
                <option key={mp.product_id} value={mp.product_id}>{mp.model_name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="purchase_date">Purchase Date</Label>
            <Input
              id="purchase_date"
              name="purchase_date"
              type="date"
              value={form.purchase_date}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="serial_number">Serial Number</Label>
            <Input
              id="serial_number"
              name="serial_number"
              value={form.serial_number}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="amc_valid_until">AMC Valid Until</Label>
            <Input
              id="amc_valid_until"
              name="amc_valid_until"
              type="date"
              value={form.amc_valid_until}
              onChange={handleChange}
            />
          </div>
          <Button type="submit" className="w-full bg-zoss-green hover:bg-zoss-green/90" disabled={loading}>
            {loading ? 'Saving...' : (product ? 'Update Product' : 'Add Product')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminProductForm; 