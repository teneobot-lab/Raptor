"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingBag, CreditCard, Banknote, CheckCircle2, X, Tag, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { getProducts } from '@/actions/product.actions';
import { createTransaction } from '@/actions/transaction.actions';
import { motion, AnimatePresence } from 'motion/react';

interface Product { id: string; name: string; price: number; stock: number; barcode: string; category: string; }
interface CartItem extends Product { quantity: number; }

const S = {
  input: { padding: '10px 12px', borderRadius: '8px', fontSize: '13px', color: '#fff', outline: 'none', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', width: '100%', boxSizing: 'border-box' as const },
  btn: (v: 'primary'|'ghost'|'danger'|'success', disabled?: boolean) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer', border: 'none', transition: 'all 0.15s', opacity: disabled ? 0.5 : 1,
    background: v === 'primary' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : v === 'success' ? 'linear-gradient(135deg,#10b981,#059669)' : v === 'danger' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)',
    color: v === 'danger' ? '#f87171' : '#fff',
    boxShadow: v === 'primary' ? '0 0 20px rgba(99,102,241,0.25)' : v === 'success' ? '0 0 20px rgba(16,185,129,0.25)' : 'none'
  }),
};

export default function CheckoutPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [discount, setDiscount] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => { getProducts(search).then(setProducts); }, [search]);

  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);
  const filtered = products.filter(p => !selectedCategory || p.category === selectedCategory);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search) {
      const match = products.find(p => p.barcode === search || p.name.toLowerCase() === search.toLowerCase());
      if (match) { addToCart(match); setSearch(''); }
      else toast.error("Product not found");
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock === 0) return toast.error('Out of stock');
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) {
        if (ex.quantity >= product.stock) { toast.error(`Only ${product.stock} in stock`); return prev; }
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.flatMap(item => {
      if (item.id !== id) return [item];
      const newQ = item.quantity + delta;
      if (newQ <= 0) return [];
      if (newQ > item.stock) { toast.error(`Only ${item.stock} in stock`); return [item]; }
      return [{ ...item, quantity: newQ }];
    }));
  };

  const subtotal = cart.reduce((a, i) => a + i.price * i.quantity, 0);
  const discountAmt = parseFloat(discount) || 0;
  const taxBase = Math.max(0, subtotal - discountAmt);
  const tax = taxBase * 0.1;
  const total = taxBase + tax;
  const cash = parseFloat(cashReceived) || 0;
  const change = cash - total;
  const canCheckout = cart.length > 0 && !isCheckingOut && (paymentMethod === 'CARD' || cash >= total);

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      const result = await createTransaction({ subtotal, tax, discount: discountAmt, total, amountPaid: paymentMethod === 'CASH' ? cash : total, change: Math.max(0, change), paymentMethod, notes, items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })) });
      setSuccessReceipt(result);
      setCart([]); setCashReceived(''); setDiscount(''); setNotes('');
      toast.success('Transaction complete!');
    } catch (e: any) { toast.error(e.message); }
    finally { setIsCheckingOut(false); }
  };

  return (
    <div style={{ display: 'flex', height: '100%', background: '#0d0d11' }}>
      {/* Success Modal */}
      <AnimatePresence>
        {successReceipt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
              style={{ background: '#16161f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '32px', maxWidth: '360px', width: '90%', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle2 size={32} style={{ color: '#10b981' }} />
              </div>
              <p style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Payment Successful</p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '4px' }}>{successReceipt.invoiceNo}</p>
              <p style={{ fontSize: '28px', fontWeight: 700, color: '#10b981', margin: '16px 0' }}>${successReceipt.total?.toFixed(2)}</p>
              {successReceipt.paymentMethod === 'CASH' && (
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '16px' }}>Change: ${Math.max(0, (successReceipt.amountPaid - successReceipt.total)).toFixed(2)}</p>
              )}
              <button style={{ ...S.btn('primary'), width: '100%', padding: '12px' }} onClick={() => setSuccessReceipt(null)}>New Transaction</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left: Products */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', gap: '14px', overflow: 'hidden' }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input style={{ ...S.input, paddingLeft: '36px', height: '44px', fontSize: '14px' }}
            placeholder="Scan barcode or search..." autoFocus value={search}
            onChange={e => setSearch(e.target.value)} onKeyDown={handleSearchKeyDown} />
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          {['All', ...categories].map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat === 'All' ? null : cat)}
              style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: 'none', whiteSpace: 'nowrap',
                background: (cat === 'All' && !selectedCategory) || selectedCategory === cat ? '#6366f1' : 'rgba(255,255,255,0.07)',
                color: (cat === 'All' && !selectedCategory) || selectedCategory === cat ? '#fff' : 'rgba(255,255,255,0.5)'
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div style={{ flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', alignContent: 'start', paddingRight: '4px' }}>
          {filtered.map(p => (
            <motion.div key={p.id} whileTap={{ scale: 0.96 }} whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
              <div onClick={() => addToCart(p)} style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px', cursor: p.stock === 0 ? 'not-allowed' : 'pointer',
                opacity: p.stock === 0 ? 0.4 : 1, transition: 'all 0.15s', textAlign: 'center'
              }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <ShoppingBag size={20} style={{ color: '#6366f1' }} />
                </div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#fff', marginBottom: '4px', lineHeight: 1.3 }}>{p.name}</p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#a5b4fc' }}>${p.price.toFixed(2)}</p>
                <p style={{ fontSize: '10px', color: p.stock <= 5 ? '#fbbf24' : 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                  {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right: Cart */}
      <div style={{ width: '360px', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.02)', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Cart header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={16} style={{ color: '#6366f1' }} />
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Order</span>
            {cart.length > 0 && <span style={{ background: '#6366f1', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '1px 6px', borderRadius: '10px' }}>{cart.length}</span>}
          </div>
          {cart.length > 0 && <button onClick={() => setCart([])} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '12px' }}>Clear</button>}
        </div>

        {/* Cart items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {cart.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: 'rgba(255,255,255,0.2)' }}>
              <ShoppingBag size={40} style={{ opacity: 0.2 }} />
              <p style={{ fontSize: '13px' }}>Cart is empty</p>
            </div>
          ) : cart.map(item => (
            <div key={item.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff', flex: 1, marginRight: '8px' }}>{item.name}</p>
                <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: '0' }}>
                  <X size={14} />
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#a5b4fc' }}>${(item.price * item.quantity).toFixed(2)}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button onClick={() => updateQty(item.id, -1)} style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={12} /></button>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, 1)} style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Payment panel */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { label: 'Subtotal', value: `$${subtotal.toFixed(2)}` },
              { label: 'Tax (10%)', value: `$${tax.toFixed(2)}` },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{r.label}</span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{r.value}</span>
              </div>
            ))}
            {/* Discount */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}><Tag size={11} />Discount</span>
              <div style={{ position: 'relative', width: '80px' }}>
                <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>$</span>
                <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" style={{ ...S.input, paddingLeft: '20px', paddingRight: '8px', height: '28px', fontSize: '12px', textAlign: 'right', width: '80px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>Total</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#a5b4fc' }}>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment method */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {(['CASH', 'CARD'] as const).map(m => (
              <button key={m} onClick={() => setPaymentMethod(m)} style={{
                padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${paymentMethod === m ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                background: paymentMethod === m ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: paymentMethod === m ? '#a5b4fc' : 'rgba(255,255,255,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}>
                {m === 'CASH' ? <Banknote size={14} /> : <CreditCard size={14} />} {m}
              </button>
            ))}
          </div>

          {/* Cash input */}
          {paymentMethod === 'CASH' && (
            <div>
              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>Cash Received ($)</label>
              <input type="number" value={cashReceived} onChange={e => setCashReceived(e.target.value)} placeholder="0.00" style={{ ...S.input, textAlign: 'right', fontSize: '16px', fontWeight: 700, height: '44px' }} />
              {cash > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Change</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: change >= 0 ? '#10b981' : '#f87171' }}>${Math.max(0, change).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" style={{ ...S.input, fontSize: '12px' }} />

          {/* Checkout button */}
          <button onClick={handleCheckout} disabled={!canCheckout} style={{ ...S.btn(canCheckout ? 'success' : 'ghost', !canCheckout), width: '100%', padding: '14px', fontSize: '15px', borderRadius: '10px' }}>
            {isCheckingOut ? 'Processing...' : `Charge $${total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
