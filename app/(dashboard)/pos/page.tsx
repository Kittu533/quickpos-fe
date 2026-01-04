"use client";

import { useEffect, useState, useRef } from "react";
import { useShiftStore } from "@/stores/shiftStore";
import { useCartStore, calculateTotals } from "@/stores/cartStore";
import { productsAPI, customersAPI, transactionsAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  X,
  Check,
  Loader2,
  Clock,
  Receipt,
} from "lucide-react";

interface Product {
  id: number;
  barcode: string;
  name: string;
  price: number;
  stock: number;
  image_url?: string;
  category?: { name: string };
}

export default function POSPage() {
  const { currentShift, openShift, isLoading: shiftLoading, error: shiftError } = useShiftStore();
  const { items, customer, addItem, updateQuantity, removeItem, clearCart, setCustomer, getSubtotal } = useCartStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [amountPaid, setAmountPaid] = useState("");
  const [processing, setProcessing] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<unknown>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const subtotal = getSubtotal();
  const isMember = !!customer;
  const totals = calculateTotals(subtotal, isMember);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productsAPI.getAll({ limit: 100, is_active: true });
        setProducts(res.data.data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };
    fetchProducts();
  }, []);

  // Check shift on load
  useEffect(() => {
    if (!currentShift && !shiftLoading) {
      setShowShiftModal(true);
    }
  }, [currentShift, shiftLoading]);

  // Filter products by search
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle barcode scan
  const handleBarcodeSearch = async (barcode: string) => {
    if (!barcode) return;
    try {
      const res = await productsAPI.getByBarcode(barcode);
      const product = res.data.data;
      addItem({
        product_id: product.id,
        product_name: product.name,
        barcode: product.barcode,
        price: parseFloat(product.price),
        stock: product.stock,
        image_url: product.image_url,
      });
      setSearchQuery("");
      barcodeInputRef.current?.focus();
    } catch {
      // Product not found
    }
  };

  // Search customer by phone
  const handleCustomerSearch = async () => {
    if (!customerSearch) return;
    try {
      const res = await customersAPI.getByPhone(customerSearch);
      setCustomer(res.data.data);
    } catch {
      alert("Member not found");
    }
  };

  // Open shift
  const handleOpenShift = async () => {
    const balance = parseFloat(openingBalance) || 0;
    const success = await openShift(balance);
    if (success) {
      setShowShiftModal(false);
    }
  };

  // Process payment
  const handlePayment = async () => {
    if (!paymentMethod || parseFloat(amountPaid) < totals.total) {
      return;
    }

    setProcessing(true);
    try {
      const res = await transactionsAPI.create({
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
        customer_id: customer?.id,
        payment_method: paymentMethod,
        amount_paid: parseFloat(amountPaid),
      });

      setLastTransaction(res.data.data);
      setShowPaymentModal(false);
      setShowReceiptModal(true);
      clearCart();
      setPaymentMethod("");
      setAmountPaid("");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || "Transaction failed");
    } finally {
      setProcessing(false);
    }
  };

  // Quick cash amounts
  const quickAmounts = [50000, 100000, 150000, 200000];

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-6 animate-fade-in">
      {/* Left: Products */}
      <div className="flex-1 flex flex-col">
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={barcodeInputRef}
              placeholder="Search or scan barcode..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleBarcodeSearch(searchQuery);
                }
              }}
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-3 gap-3">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() =>
                  addItem({
                    product_id: product.id,
                    product_name: product.name,
                    barcode: product.barcode,
                    price: parseFloat(String(product.price)),
                    stock: product.stock,
                    image_url: product.image_url,
                  })
                }
                disabled={product.stock === 0}
                className="flex flex-col items-start rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-secondary disabled:opacity-50"
              >
                <div className="mb-2 h-16 w-full rounded bg-secondary flex items-center justify-center">
                  <span className="text-2xl">📦</span>
                </div>
                <p className="text-sm font-medium line-clamp-2">{product.name}</p>
                <div className="mt-auto flex w-full items-center justify-between">
                  <span className="text-sm font-bold text-primary">
                    {formatCurrency(parseFloat(String(product.price)))}
                  </span>
                  <Badge variant={product.stock > 0 ? "secondary" : "destructive"}>
                    {product.stock}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <Card className="w-96 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>Cart</span>
            {items.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col overflow-hidden">
          {/* Customer */}
          <div className="mb-4">
            {customer ? (
              <div className="flex items-center justify-between rounded-lg bg-primary/10 p-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {customer.points} points • 5% discount
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setCustomer(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Member phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCustomerSearch()}
                />
                <Button variant="secondary" onClick={handleCustomerSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Cart Items */}
          <div className="flex-1 overflow-auto py-4 space-y-2">
            {items.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Cart is empty</p>
            ) : (
              items.map((item) => (
                <div key={item.product_id} className="flex items-center gap-2 rounded-lg bg-secondary/50 p-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-1">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={() => removeItem(item.product_id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <Separator />

          {/* Totals */}
          <div className="py-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            {isMember && (
              <div className="flex justify-between text-green-500">
                <span>Discount ({totals.discountPercent}%)</span>
                <span>-{formatCurrency(totals.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({totals.taxPercent}%)</span>
              <span>{formatCurrency(totals.tax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(totals.total)}</span>
            </div>
            {isMember && totals.pointsEarned > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Points earned</span>
                <span>+{totals.pointsEarned} pts</span>
              </div>
            )}
          </div>

          {/* Pay Button */}
          <Button
            className="w-full gradient-primary text-lg py-6"
            disabled={items.length === 0 || !currentShift}
            onClick={() => setShowPaymentModal(true)}
          >
            <CreditCard className="mr-2 h-5 w-5" />
            Pay {formatCurrency(totals.total)}
          </Button>
        </CardContent>
      </Card>

      {/* Shift Modal */}
      <Dialog open={showShiftModal} onOpenChange={setShowShiftModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Open Shift
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm text-muted-foreground">Opening Balance (Cash in drawer)</label>
            <Input
              type="number"
              placeholder="0"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="mt-2"
            />
            {shiftError && (
              <p className="mt-2 text-sm text-destructive">{shiftError}</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleOpenShift} disabled={shiftLoading} className="gradient-primary">
              {shiftLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Open Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <p className="text-muted-foreground">Total Amount</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(totals.total)}</p>
            </div>

            {/* Payment Methods */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "cash", label: "Cash", icon: Banknote },
                { value: "debit", label: "Debit", icon: CreditCard },
                { value: "credit", label: "Credit", icon: CreditCard },
                { value: "ewallet", label: "E-Wallet", icon: Smartphone },
              ].map((method) => (
                <Button
                  key={method.value}
                  variant={paymentMethod === method.value ? "default" : "outline"}
                  className="h-16 flex-col gap-1"
                  onClick={() => {
                    setPaymentMethod(method.value);
                    if (method.value !== "cash") {
                      setAmountPaid(String(totals.total));
                    }
                  }}
                >
                  <method.icon className="h-5 w-5" />
                  {method.label}
                </Button>
              ))}
            </div>

            {/* Amount Input */}
            {paymentMethod === "cash" && (
              <>
                <div>
                  <label className="text-sm text-muted-foreground">Amount Received</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="mt-1 text-lg"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {quickAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant="secondary"
                      size="sm"
                      onClick={() => setAmountPaid(String(amount))}
                    >
                      {formatCurrency(amount)}
                    </Button>
                  ))}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setAmountPaid(String(totals.total))}
                  >
                    Exact
                  </Button>
                </div>
                {parseFloat(amountPaid) >= totals.total && (
                  <div className="rounded-lg bg-green-500/10 p-3 text-center">
                    <p className="text-sm text-muted-foreground">Change</p>
                    <p className="text-xl font-bold text-green-500">
                      {formatCurrency(parseFloat(amountPaid) - totals.total)}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button
              className="gradient-primary"
              onClick={handlePayment}
              disabled={!paymentMethod || parseFloat(amountPaid || "0") < totals.total || processing}
            >
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Complete Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-500">
              <Check className="h-5 w-5" />
              Transaction Complete!
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <Receipt className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Transaction saved successfully</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowReceiptModal(false)} className="w-full">
              New Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
