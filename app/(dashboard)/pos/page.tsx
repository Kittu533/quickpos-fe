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
  Package,
  ShoppingBag,
  Wallet,
  Coins,
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
        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              ref={barcodeInputRef}
              placeholder="Search products or scan barcode..."
              className="pl-12 h-12 text-base rounded-xl border-gray-200 shadow-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleBarcodeSearch(searchQuery);
                }
              }}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-gray-200 bg-gray-50 px-2 font-mono text-xs text-gray-500">
                Enter
              </kbd>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-3 gap-4">
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
                className="group relative flex flex-col items-start rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all duration-300 hover:shadow-lg hover:border-blue-200 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-sm overflow-hidden"
              >
                {/* Product Image/Icon Container */}
                <div className="mb-3 h-20 w-full rounded-lg bg-blue-50 flex items-center justify-center relative overflow-hidden transition-all duration-300 hover:bg-blue-100">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="h-10 w-10 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
                  )}
                  {/* Stock Badge Overlay */}
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant={product.stock > 10 ? "secondary" : product.stock > 0 ? "outline" : "destructive"}
                      className={`text-xs font-semibold shadow-sm ${product.stock > 10
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                        : product.stock > 0
                          ? "bg-amber-100 text-amber-700 border-amber-200"
                          : ""
                        }`}
                    >
                      {product.stock > 0 ? product.stock : "Out"}
                    </Badge>
                  </div>
                </div>
                {/* Product Info */}
                <div className="flex-1 w-full">
                  <p className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-700 transition-colors">
                    {product.name}
                  </p>
                  {product.category?.name && (
                    <p className="text-xs text-gray-400 mt-1">{product.category.name}</p>
                  )}
                </div>
                {/* Price */}
                <div className="mt-3 w-full pt-3 border-t border-gray-100">
                  <span className="text-base font-bold text-blue-600">
                    {formatCurrency(parseFloat(String(product.price)))}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <Card className="w-96 flex flex-col border-0 shadow-xl bg-white rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 bg-blue-600 text-white">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              <span>Shopping Cart</span>
              {items.length > 0 && (
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  {items.length} items
                </Badge>
              )}
            </div>
            {items.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart} className="text-white hover:bg-white/10">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col overflow-hidden p-4">
          {/* Customer */}
          <div className="mb-4">
            {customer ? (
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3 border border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{customer.name}</p>
                    <p className="text-xs text-emerald-600 font-medium">
                      <Coins className="h-3 w-3 inline mr-1" />
                      {customer.points} points • 5% discount
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setCustomer(null)} className="text-gray-400 hover:text-red-500">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search member phone..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCustomerSearch()}
                    className="pl-10 border-gray-200 focus:border-blue-300"
                  />
                </div>
                <Button variant="secondary" onClick={handleCustomerSearch} className="bg-blue-50 hover:bg-blue-100 text-blue-600">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <Separator className="bg-gray-100" />

          {/* Cart Items */}
          <div className="flex-1 overflow-auto py-4 space-y-3">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <ShoppingBag className="h-10 w-10 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">Your cart is empty</p>
                <p className="text-xs text-gray-400 mt-1">Add products to get started</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.product_id} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Package className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 line-clamp-1">{item.product_name}</p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(item.price)} × {item.quantity} = <span className="font-semibold text-blue-600">{formatCurrency(item.price * item.quantity)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-full border-gray-200 hover:bg-blue-50 hover:border-blue-200"
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-full border-gray-200 hover:bg-blue-50 hover:border-blue-200"
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
                      onClick={() => removeItem(item.product_id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <Separator className="bg-gray-100" />

          {/* Totals */}
          <div className="py-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span className="font-medium text-gray-700">{formatCurrency(totals.subtotal)}</span>
            </div>
            {isMember && (
              <div className="flex justify-between text-emerald-600">
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Member Discount ({totals.discountPercent}%)
                </span>
                <span className="font-medium">-{formatCurrency(totals.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500">
              <span>Tax ({totals.taxPercent}%)</span>
              <span className="font-medium text-gray-700">{formatCurrency(totals.tax)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-xl font-bold">
              <span className="text-gray-800">Total</span>
              <span className="text-blue-600">
                {formatCurrency(totals.total)}
              </span>
            </div>
            {isMember && totals.pointsEarned > 0 && (
              <div className="flex justify-between text-xs text-emerald-600 bg-emerald-50 p-2 rounded-lg">
                <span className="flex items-center gap-1">
                  <Coins className="h-3 w-3" />
                  Points earned
                </span>
                <span className="font-semibold">+{totals.pointsEarned} pts</span>
              </div>
            )}
          </div>

          {/* Pay Button */}
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6 rounded-xl shadow-lg transition-all hover:shadow-xl"
            disabled={items.length === 0 || !currentShift}
            onClick={() => setShowPaymentModal(true)}
          >
            <Wallet className="mr-2 h-5 w-5" />
            Pay {formatCurrency(totals.total)}
          </Button>
        </CardContent>
      </Card>

      {/* Shift Modal */}
      <Dialog open={showShiftModal} onOpenChange={setShowShiftModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-lg">Open Shift</span>
                <p className="text-sm font-normal text-gray-500">Start your work session</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-gray-700">Opening Balance</label>
            <p className="text-xs text-gray-400 mb-2">Enter the cash amount in your drawer</p>
            <div className="relative">
              <Coins className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="number"
                placeholder="0"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="pl-10 text-lg font-semibold"
              />
            </div>
            {shiftError && (
              <div className="mt-3 flex items-center gap-2 text-sm text-red-500 bg-red-50 p-2 rounded-lg">
                <X className="h-4 w-4" />
                {shiftError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleOpenShift} disabled={shiftLoading} className="w-full bg-blue-600 hover:bg-blue-700">
              {shiftLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Clock className="mr-2 h-4 w-4" />}
              Open Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-lg">Complete Payment</span>
                <p className="text-sm font-normal text-gray-500">Choose payment method</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            {/* Total Amount */}
            <div className="text-center bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">Total Amount</p>
              <p className="text-4xl font-bold text-blue-600">
                {formatCurrency(totals.total)}
              </p>
            </div>

            {/* Payment Methods */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "cash", label: "Cash", icon: Banknote, color: "bg-emerald-500" },
                { value: "debit", label: "Debit", icon: CreditCard, color: "bg-blue-500" },
                { value: "credit", label: "Credit", icon: CreditCard, color: "bg-purple-500" },
                { value: "ewallet", label: "E-Wallet", icon: Smartphone, color: "bg-orange-500" },
              ].map((method) => (
                <button
                  key={method.value}
                  onClick={() => {
                    setPaymentMethod(method.value);
                    if (method.value !== "cash") {
                      setAmountPaid(String(totals.total));
                    }
                  }}
                  className={`relative h-20 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-2 ${paymentMethod === method.value
                    ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/20"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                    }`}
                >
                  <div className={`h-8 w-8 rounded-full ${method.color} flex items-center justify-center`}>
                    <method.icon className="h-4 w-4 text-white" />
                  </div>
                  <span className={`text-sm font-medium ${paymentMethod === method.value ? "text-blue-700" : "text-gray-600"}`}>
                    {method.label}
                  </span>
                  {paymentMethod === method.value && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Amount Input */}
            {paymentMethod === "cash" && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Amount Received</label>
                  <div className="relative mt-1">
                    <Banknote className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="number"
                      placeholder="0"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="pl-10 text-lg font-semibold"
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {quickAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setAmountPaid(String(amount))}
                      className={`hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 ${amountPaid === String(amount) ? "bg-blue-50 border-blue-200 text-blue-600" : ""
                        }`}
                    >
                      {formatCurrency(amount)}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAmountPaid(String(totals.total))}
                    className={`hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 ${amountPaid === String(totals.total) ? "bg-emerald-50 border-emerald-200 text-emerald-600" : ""
                      }`}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Exact
                  </Button>
                </div>
                {parseFloat(amountPaid) >= totals.total && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                    <p className="text-sm text-emerald-600 mb-1">Change Due</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(parseFloat(amountPaid) - totals.total)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPaymentModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              onClick={handlePayment}
              disabled={!paymentMethod || parseFloat(amountPaid || "0") < totals.total || processing}
            >
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">Transaction Complete</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="mx-auto h-20 w-20 rounded-full bg-emerald-500 flex items-center justify-center mb-4 shadow-lg">
              <Check className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Transaction Complete!</h3>
            <p className="text-gray-500">Your payment has been processed successfully</p>

            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-center gap-3">
                <Receipt className="h-8 w-8 text-gray-400" />
                <div className="text-left">
                  <p className="text-sm text-gray-500">Receipt saved</p>
                  <p className="text-xs text-gray-400">Ready for printing if needed</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowReceiptModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
