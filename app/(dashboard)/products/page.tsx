"use client";

import { useEffect, useState } from "react";
import { productsAPI, categoriesAPI, getImageUrl } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmDialog, SuccessDialog } from "@/components/ui/alert-dialog";
import { TablePagination } from "@/components/ui/table-pagination";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  Loader2,
  Link as LinkIcon,
  Upload,
  X,
} from "lucide-react";

interface Product {
  id: number;
  barcode: string;
  name: string;
  price: number;
  cost_price: number;
  stock: number;
  min_stock: number;
  is_active: boolean;
  image_url?: string;
  category?: { id: number; name: string };
}

interface Category {
  id: number;
  name: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    product: Product | null;
  }>({ open: false, product: null });
  const [successDialog, setSuccessDialog] = useState<{
    open: boolean;
    title: string;
    description?: string;
  }>({ open: false, title: "", description: "" });
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    price: "",
    cost_price: "",
    stock: "",
    min_stock: "5",
    category_id: "",
    image_url: "",
  });

  // Image file state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await productsAPI.getAll({ limit: 100, is_active: true });
      setProducts(res.data.data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await categoriesAPI.getAll();
      setCategories(res.data.data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Use FormData for file upload support
      const submitData = new FormData();
      submitData.append("name", formData.name);
      if (formData.barcode) submitData.append("barcode", formData.barcode);
      submitData.append("price", formData.price);
      if (formData.cost_price) submitData.append("cost_price", formData.cost_price);
      submitData.append("stock", formData.stock || "0");
      submitData.append("min_stock", formData.min_stock || "5");
      if (formData.category_id) submitData.append("category_id", formData.category_id);

      // Add image file if selected, otherwise use URL
      if (imageFile) {
        submitData.append("image", imageFile);
      } else if (formData.image_url) {
        submitData.append("image_url", formData.image_url);
      }

      if (editingProduct) {
        await productsAPI.update(editingProduct.id, submitData);
        setSuccessDialog({
          open: true,
          title: "Product Updated!",
          description: `"${formData.name}" has been updated successfully.`,
        });
      } else {
        await productsAPI.create(submitData);
        setSuccessDialog({
          open: true,
          title: "Product Created!",
          description: `"${formData.name}" has been added to inventory.`,
        });
      }

      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setSuccessDialog({
        open: true,
        title: "Error",
        description: err.response?.data?.message || "Failed to save product",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      barcode: product.barcode || "",
      price: String(product.price),
      cost_price: product.cost_price ? String(product.cost_price) : "",
      stock: String(product.stock),
      min_stock: String(product.min_stock),
      category_id: product.category?.id ? String(product.category.id) : "",
      image_url: product.image_url || "",
    });
    setShowModal(true);
  };

  const handleDeleteClick = (product: Product) => {
    setConfirmDialog({ open: true, product });
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDialog.product) return;

    setDeleting(true);
    try {
      await productsAPI.delete(confirmDialog.product.id);
      setConfirmDialog({ open: false, product: null });
      setSuccessDialog({
        open: true,
        title: "Product Deleted!",
        description: `"${confirmDialog.product.name}" has been removed from inventory.`,
      });
      fetchProducts();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setConfirmDialog({ open: false, product: null });
      setSuccessDialog({
        open: true,
        title: "Error",
        description: err.response?.data?.message || "Failed to delete product",
      });
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      barcode: "",
      price: "",
      cost_price: "",
      stock: "",
      min_stock: "5",
      category_id: "",
      image_url: "",
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setFormData({ ...formData, image_url: "" }); // Clear URL when file selected
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculation
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset to page 1 when search query changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4 lg:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold">Products</h2>
          <p className="text-sm text-muted-foreground">Manage your inventory</p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          className="pl-10"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-secondary/50">
                <tr>
                  <th className="px-3 lg:px-4 py-3 text-left text-xs lg:text-sm font-medium">Product</th>
                  <th className="px-3 lg:px-4 py-3 text-left text-xs lg:text-sm font-medium hidden md:table-cell">Category</th>
                  <th className="px-3 lg:px-4 py-3 text-right text-xs lg:text-sm font-medium">Price</th>
                  <th className="px-3 lg:px-4 py-3 text-right text-xs lg:text-sm font-medium hidden sm:table-cell">Stock</th>
                  <th className="px-3 lg:px-4 py-3 text-center text-xs lg:text-sm font-medium hidden lg:table-cell">Status</th>
                  <th className="px-3 lg:px-4 py-3 text-right text-xs lg:text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No products found
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => (
                    <tr key={product.id} className="border-b border-border hover:bg-secondary/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden shadow-sm border border-gray-100">
                            {product.image_url ? (
                              <img
                                src={getImageUrl(product.image_url) || ''}
                                alt={product.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="flex items-center justify-center h-full w-full"><svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21 16-4-4-4 4"/><path d="m17 12 4 4-4 4"/><path d="M3 21h18"/><path d="M3 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/></svg></div>';
                                }}
                              />
                            ) : (
                              <Package className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.barcode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 lg:px-4 py-3 text-sm hidden md:table-cell">
                        {product.category?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(parseFloat(String(product.price)))}
                      </td>
                      <td className="px-3 lg:px-4 py-3 text-right hidden sm:table-cell">
                        <span className={product.stock <= product.min_stock ? "text-red-500" : ""}>
                          {product.stock}
                        </span>
                        {product.stock <= product.min_stock && (
                          <AlertTriangle className="ml-1 inline h-4 w-4 text-red-500" />
                        )}
                      </td>
                      <td className="px-3 lg:px-4 py-3 text-center hidden lg:table-cell">
                        <Badge variant={product.is_active ? "success" : "secondary"}>
                          {product.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteClick(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add Product"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Product Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Barcode</Label>
                <Input
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                />
              </div>
              <div>
                <Label>Category</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Selling Price *</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Cost Price</Label>
                <Input
                  type="number"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                />
              </div>
              <div>
                <Label>Stock</Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </div>
              <div>
                <Label>Min Stock Alert</Label>
                <Input
                  type="number"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="flex items-center gap-2 mb-2">
                  <Upload className="h-4 w-4" />
                  Product Image
                </Label>

                {/* Image Preview */}
                {(imagePreview || formData.image_url) && (
                  <div className="mb-3 flex items-start gap-3">
                    <div className="relative h-24 w-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0">
                      <img
                        src={imagePreview || formData.image_url}
                        alt="Preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '';
                          (e.target as HTMLImageElement).alt = 'Invalid image';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          clearImage();
                          setFormData({ ...formData, image_url: "" });
                        }}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-sm transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {imageFile ? `File: ${imageFile.name}` : "Preview gambar produk"}
                    </p>
                  </div>
                )}

                {/* File Upload Button */}
                <div className="flex flex-col gap-2">
                  <label className="cursor-pointer">
                    <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
                      <Upload className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {imageFile ? "Change image" : "Click to upload image"}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>

                  {/* URL Fallback */}
                  {!imageFile && (
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-400">or use URL</span>
                      </div>
                    </div>
                  )}
                  {!imageFile && (
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <Input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingProduct ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title="Delete Product"
        description={`Are you sure you want to delete "${confirmDialog.product?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />

      {/* Success Dialog */}
      <SuccessDialog
        open={successDialog.open}
        onOpenChange={(open) => setSuccessDialog({ ...successDialog, open })}
        title={successDialog.title}
        description={successDialog.description}
      />
    </div>
  );
}
