import { useState } from 'react';
import { supabase, UserProduct, Service } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface AdminServiceFormProps {
  userProduct: UserProduct;
  service?: Service;
  onClose: (refresh?: boolean) => void;
}

const AdminServiceForm = ({ userProduct, service, onClose }: AdminServiceFormProps) => {
  const [form, setForm] = useState({
    service_date: service?.service_date ? service.service_date.slice(0, 10) : '',
    next_service_due_date: service?.next_service_due_date ? service.next_service_due_date.slice(0, 10) : '',
    status: service?.status || 'Upcoming',
    notes: service?.notes || '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (service) {
        // Update
        const { error } = await supabase
          .from('services')
          .update({ ...form })
          .eq('id', service.id);
        if (error) throw error;
        toast.success('Service updated!');
      } else {
        // Insert
        const { error } = await supabase
          .from('services')
          .insert({ ...form, user_product_id: userProduct.id });
        if (error) throw error;
        toast.success('Service added!');
      }
      onClose(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{service ? 'Edit Service' : 'Add Service'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="service_date">Service Date</Label>
            <Input
              id="service_date"
              name="service_date"
              type="date"
              value={form.service_date}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="next_service_due_date">Next Service Due Date</Label>
            <Input
              id="next_service_due_date"
              name="next_service_due_date"
              type="date"
              value={form.next_service_due_date}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border rounded px-2 py-2"
            >
              <option value="Upcoming">Upcoming</option>
              <option value="Due Soon">Due Soon</option>
              <option value="Overdue">Overdue</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="w-full border rounded px-2 py-2"
            />
          </div>
          <Button type="submit" className="w-full bg-zoss-green hover:bg-zoss-green/90" disabled={loading}>
            {loading ? 'Saving...' : (service ? 'Update Service' : 'Add Service')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminServiceForm; 