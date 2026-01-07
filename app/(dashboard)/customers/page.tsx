"use client";

import { useEffect, useState } from "react";
import { customersAPI } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
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
  Users,
  Star,
  Loader2,
} from "lucide-react";

interface Customer {
  id: number;
  member_code: string;
  name: string;
  phone: string;
  email: string;
  points: number;
  total_spent: number;
  member_since: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);

  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    customer: Customer | null;
  }>({ open: false, customer: null });
  const [successDialog, setSuccessDialog] = useState<{
    open: boolean;
    title: string;
    description?: string;
  }>({ open: false, title: "", description: "" });
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await customersAPI.getAll({ limit: 100 });
      setCustomers(res.data.data);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingCustomer) {
        await customersAPI.update(editingCustomer.id, formData);
        setSuccessDialog({
          open: true,
          title: "Member Updated!",
          description: `"${formData.name}" has been updated successfully.`,
        });
      } else {
        await customersAPI.create(formData);
        setSuccessDialog({
          open: true,
          title: "Member Registered!",
          description: `"${formData.name}" has been added as a new member.`,
        });
      }

      setShowModal(false);
      resetForm();
      fetchCustomers();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setSuccessDialog({
        open: true,
        title: "Error",
        description: err.response?.data?.message || "Failed to save member",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || "",
      email: customer.email || "",
    });
    setShowModal(true);
  };

  const handleDeleteClick = (customer: Customer) => {
    setConfirmDialog({ open: true, customer });
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDialog.customer) return;

    setDeleting(true);
    try {
      await customersAPI.delete(confirmDialog.customer.id);
      setConfirmDialog({ open: false, customer: null });
      setSuccessDialog({
        open: true,
        title: "Member Deleted!",
        description: `"${confirmDialog.customer.name}" has been removed.`,
      });
      fetchCustomers();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setConfirmDialog({ open: false, customer: null });
      setSuccessDialog({
        open: true,
        title: "Error",
        description: err.response?.data?.message || "Failed to delete member",
      });
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setEditingCustomer(null);
    setFormData({ name: "", phone: "", email: "" });
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery) ||
      c.member_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculation
  const totalItems = filteredCustomers.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4 lg:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold">Customers</h2>
          <p className="text-sm text-muted-foreground">Manage your members</p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, or code..."
          className="pl-10"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-secondary/50">
                <tr>
                  <th className="px-3 lg:px-4 py-3 text-left text-xs lg:text-sm font-medium">Member</th>
                  <th className="px-3 lg:px-4 py-3 text-left text-xs lg:text-sm font-medium hidden sm:table-cell">Contact</th>
                  <th className="px-3 lg:px-4 py-3 text-right text-xs lg:text-sm font-medium">Points</th>
                  <th className="px-3 lg:px-4 py-3 text-right text-xs lg:text-sm font-medium hidden md:table-cell">Total Spent</th>
                  <th className="px-3 lg:px-4 py-3 text-left text-xs lg:text-sm font-medium hidden lg:table-cell">Since</th>
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
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No members found
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b border-border hover:bg-secondary/30">
                      <td className="px-3 lg:px-4 py-3">
                        <div className="flex items-center gap-2 lg:gap-3">
                          <Users className="h-5 w-5 lg:h-6 lg:w-6 text-blue-500 drop-shadow-sm" />
                          <div>
                            <p className="font-medium text-sm lg:text-base">{customer.name}</p>
                            <p className="text-xs text-muted-foreground">{customer.member_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 lg:px-4 py-3 text-sm hidden sm:table-cell">
                        <p>{customer.phone || "-"}</p>
                        <p className="text-xs text-muted-foreground">{customer.email}</p>
                      </td>
                      <td className="px-3 lg:px-4 py-3 text-right">
                        <Badge variant="secondary" className="gap-1">
                          <Star className="h-3 w-3" />
                          {customer.points}
                        </Badge>
                      </td>
                      <td className="px-3 lg:px-4 py-3 text-right font-medium hidden md:table-cell">
                        {formatCurrency(parseFloat(String(customer.total_spent)))}
                      </td>
                      <td className="px-3 lg:px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                        {formatDate(customer.member_since)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(customer)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteClick(customer)}
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
              {editingCustomer ? "Edit Member" : "Register New Member"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Full Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            {!editingCustomer && (
              <p className="text-xs text-muted-foreground">
                Member code will be auto-generated (MBR-XXXXXX)
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingCustomer ? "Update" : "Register"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title="Delete Member"
        description={`Are you sure you want to delete "${confirmDialog.customer?.name}"? This action cannot be undone.`}
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
