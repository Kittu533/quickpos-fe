"use client";

import { useEffect, useState } from "react";
import { usersAPI } from "@/lib/api";
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
  UserCog,
  Power,
  Loader2,
} from "lucide-react";

interface User {
  id: number;
  username: string;
  fullname: string;
  email: string;
  role: string;
  is_active: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    user: User | null;
    action: "toggle";
  }>({ open: false, user: null, action: "toggle" });
  const [successDialog, setSuccessDialog] = useState<{
    open: boolean;
    title: string;
    description?: string;
  }>({ open: false, title: "", description: "" });
  const [toggling, setToggling] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    fullname: "",
    email: "",
    password: "",
    role: "cashier",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await usersAPI.getAll({ limit: 100 });
      setUsers(res.data.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingUser) {
        const { password, ...data } = formData;
        await usersAPI.update(editingUser.id, data);
        setSuccessDialog({
          open: true,
          title: "User Updated!",
          description: `"${formData.fullname}" has been updated successfully.`,
        });
      } else {
        await usersAPI.create(formData);
        setSuccessDialog({
          open: true,
          title: "User Created!",
          description: `"${formData.fullname}" has been added as a new user.`,
        });
      }

      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setSuccessDialog({
        open: true,
        title: "Error",
        description: err.response?.data?.message || "Failed to save user",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      fullname: user.fullname,
      email: user.email,
      password: "",
      role: user.role,
    });
    setShowModal(true);
  };

  const handleToggleClick = (user: User) => {
    setConfirmDialog({ open: true, user, action: "toggle" });
  };

  const handleToggleConfirm = async () => {
    if (!confirmDialog.user) return;

    setToggling(true);
    try {
      await usersAPI.toggleStatus(confirmDialog.user.id);
      const newStatus = !confirmDialog.user.is_active;
      setConfirmDialog({ open: false, user: null, action: "toggle" });
      setSuccessDialog({
        open: true,
        title: newStatus ? "User Activated!" : "User Deactivated!",
        description: `"${confirmDialog.user.fullname}" has been ${newStatus ? "activated" : "deactivated"}.`,
      });
      fetchUsers();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setConfirmDialog({ open: false, user: null, action: "toggle" });
      setSuccessDialog({
        open: true,
        title: "Error",
        description: err.response?.data?.message || "Failed to toggle user status",
      });
    } finally {
      setToggling(false);
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({ username: "", fullname: "", email: "", password: "", role: "cashier" });
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculation
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, "default" | "secondary" | "outline"> = {
      admin: "default",
      manager: "secondary",
      cashier: "outline",
    };
    return <Badge variant={colors[role] || "secondary"}>{role}</Badge>;
  };

  return (
    <div className="space-y-4 lg:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold">Users</h2>
          <p className="text-sm text-muted-foreground">Manage system users</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          className="pl-10"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-secondary/50">
                <tr>
                  <th className="px-3 lg:px-4 py-3 text-left text-xs lg:text-sm font-medium">User</th>
                  <th className="px-3 lg:px-4 py-3 text-left text-xs lg:text-sm font-medium hidden md:table-cell">Email</th>
                  <th className="px-3 lg:px-4 py-3 text-center text-xs lg:text-sm font-medium">Role</th>
                  <th className="px-3 lg:px-4 py-3 text-center text-xs lg:text-sm font-medium hidden sm:table-cell">Status</th>
                  <th className="px-3 lg:px-4 py-3 text-right text-xs lg:text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-secondary/30">
                      <td className="px-3 lg:px-4 py-3">
                        <div className="flex items-center gap-2 lg:gap-3">
                          <UserCog className="h-5 w-5 lg:h-6 lg:w-6 text-blue-500 drop-shadow-sm" />
                          <div>
                            <p className="font-medium text-sm lg:text-base">{user.fullname}</p>
                            <p className="text-xs text-muted-foreground">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 lg:px-4 py-3 text-sm hidden md:table-cell">{user.email}</td>
                      <td className="px-3 lg:px-4 py-3 text-center">{getRoleBadge(user.role)}</td>
                      <td className="px-3 lg:px-4 py-3 text-center hidden sm:table-cell">
                        <Badge variant={user.is_active ? "success" : "destructive"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleClick(user)}
                        >
                          <Power className={`h-4 w-4 ${user.is_active ? "text-red-500" : "text-green-500"}`} />
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

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Username *</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={formData.fullname}
                  onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              {!editingUser && (
                <div className="sm:col-span-2">
                  <Label>Password *</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                  />
                </div>
              )}
              <div className="sm:col-span-2">
                <Label>Role</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="cashier">Cashier</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingUser ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Toggle Status Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.user?.is_active ? "Deactivate User" : "Activate User"}
        description={`Are you sure you want to ${confirmDialog.user?.is_active ? "deactivate" : "activate"} "${confirmDialog.user?.fullname}"?`}
        confirmText={confirmDialog.user?.is_active ? "Deactivate" : "Activate"}
        cancelText="Cancel"
        variant={confirmDialog.user?.is_active ? "warning" : "default"}
        onConfirm={handleToggleConfirm}
        loading={toggling}
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
