"use client"
import { useState } from "react";
import { createProduct } from "@/actions/product.actions";
import { toast } from "sonner";

export function ProductFormDialog({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', cost: '', stock: '', minStock: '5', barcode: '', category: '' });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await createProduct({
        name: form.name, price: parseFloat(form.price), cost: parseFloat(form.cost) || 0,
        stock: parseInt(form.stock) || 0, minStock: parseInt(form.minStock) || 5,
        barcode: form.barcode, category: form.category
      });
      toast.success("Product created!");
      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return <></>;
}
