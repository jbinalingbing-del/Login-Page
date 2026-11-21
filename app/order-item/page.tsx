// app/order-item/page.tsx
"use client";

import { clearTokens, getUserId } from "@/lib/auth";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { apiClient } from "@/lib/api";
import { CONFIG } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OrderItem {
  order_item_id: number;
  order_item_code: string;
  order_item_name: string;
  id?: number;
  created_at?: string;
  updated_at?: string;
}

export default function OrderItemPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: true });

  // Data states
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states (shared for Create and Update)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [itemCode, setItemCode] = useState("");
  const [itemName, setItemName] = useState("");

  // READ (All)
  const fetchOrderItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiClient<OrderItem[]>(CONFIG.ENDPOINTS.ORDER_ITEM, {
        method: "GET",
        requiresAuth: true,
      });
      setOrderItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch order items.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isChecking) {
      fetchOrderItems();
    }
  }, [isChecking, fetchOrderItems]);

  // READ (Single)
  const handleViewItem = async (itemId: number) => {
    setError("");
    setSuccess("");
    try {
      const data = await apiClient<OrderItem>(
        `${CONFIG.ENDPOINTS.ORDER_ITEM}/${itemId}`,
        {
          method: "GET",
          requiresAuth: true,
        }
      );
      setSelectedItem(data);
    } catch (err: any) {
      setError(err.message || "Failed to load order item details.");
    }
  };

  // Open Form for CREATE
  const openCreateForm = () => {
    setEditingId(null);
    setItemCode("");
    setItemName("");
    setSelectedItem(null);
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };

  // Open Form for UPDATE
  const openEditForm = (item: OrderItem) => {
    setEditingId(item.order_item_id);
    setItemCode(item.order_item_code);
    setItemName(item.order_item_name);
    setSelectedItem(null);
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setItemCode("");
    setItemName("");
  };

  // CREATE & UPDATE Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const userId = getUserId();
    if (!userId) {
      setError("Unable to determine user ID from token. Please log in again.");
      setSubmitting(false);
      return;
    }

    try {
      if (editingId !== null) {
        // UPDATE (PUT /order_item/:id)
        await apiClient(`${CONFIG.ENDPOINTS.ORDER_ITEM}/${editingId}`, {
          method: "PUT",
          requiresAuth: true,
          body: JSON.stringify({
            order_item_code: itemCode,
            order_item_name: itemName,
            id: userId,
          }),
        });
        setSuccess(`Order item #${editingId} updated successfully.`);
      } else {
        // CREATE (POST /order_item)
        await apiClient(CONFIG.ENDPOINTS.ORDER_ITEM, {
          method: "POST",
          requiresAuth: true,
          body: JSON.stringify({
            order_item_code: itemCode,
            order_item_name: itemName,
            id: userId,
          }),
        });
        setSuccess("New order item created successfully.");
      }

      closeForm();
      await fetchOrderItems();
    } catch (err: any) {
      setError(err.message || "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE (DELETE /order_item/:id)
  const handleDelete = async (itemId: number) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete Order Item #${itemId}?`
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");
    try {
      await apiClient(`${CONFIG.ENDPOINTS.ORDER_ITEM}/${itemId}`, {
        method: "DELETE",
        requiresAuth: true,
      });

      if (selectedItem?.order_item_id === itemId) {
        setSelectedItem(null);
      }
      setSuccess(`Order item #${itemId} deleted successfully.`);
      await fetchOrderItems();
    } catch (err: any) {
      setError(err.message || "Failed to delete order item.");
    }
  };

  const handleLogout = () => {
    clearTokens();
    router.push(CONFIG.ROUTES.LOGIN);
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="dash-bg min-h-screen p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Navbar */}
        <header className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Order Items</h1>
            <p className="text-sm text-muted-foreground">Manage order items</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(CONFIG.ROUTES.DASHBOARD)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        {/* Status Notifications */}
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/50 rounded-md border border-red-200 dark:border-red-900">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 rounded-md border border-emerald-200 dark:border-emerald-900">
            {success}
          </div>
        )}

        {/* CREATE / UPDATE Form Card */}
        {isFormOpen && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>
                  {editingId !== null
                    ? `Update Order Item #${editingId}`
                    : "Create New Order Item"}
                </CardTitle>
                <CardDescription>
                  {editingId !== null
                    ? "Modify the order item code and name below."
                    : "Fill in the details to add a new order item."}
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={closeForm}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="order_item_code">Order Item Code</Label>
                    <Input
                      id="order_item_code"
                      placeholder="e.g. OI1"
                      value={itemCode}
                      onChange={(e) => setItemCode(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order_item_name">Order Item Name</Label>
                    <Input
                      id="order_item_name"
                      placeholder="e.g. Item 1"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting
                      ? "Saving..."
                      : editingId !== null
                      ? "Save Changes"
                      : "Create Order Item"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* READ Single Item Details Card */}
        {selectedItem && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>
                  Order Item Details (#{selectedItem.order_item_id})
                </CardTitle>
                <CardDescription>
                  Fetched directly from GET /order_item/
                  {selectedItem.order_item_id}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedItem(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block">
                  Order Item ID
                </span>
                <span className="font-medium">{selectedItem.order_item_id}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Code</span>
                <span className="font-medium">
                  {selectedItem.order_item_code}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Name</span>
                <span className="font-medium">
                  {selectedItem.order_item_name}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Created At</span>
                <span className="font-medium">
                  {selectedItem.created_at
                    ? new Date(selectedItem.created_at).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Item Table Card */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>
                A list of all order items stored in the backend.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={fetchOrderItems}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Read / Refresh
              </Button>
              <Button onClick={openCreateForm}>
                <Plus className="w-4 h-4 mr-2" />
                Create Order Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[90px]">ID</TableHead>
                    <TableHead>Order Item Code</TableHead>
                    <TableHead>Order Item Name</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Loading order items...
                      </TableCell>
                    </TableRow>
                  ) : orderItems.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No order items found. Click &quot;Create Order
                        Item&quot; to add one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orderItems.map((item) => (
                      <TableRow key={item.order_item_id}>
                        <TableCell className="font-medium">
                          {item.order_item_id}
                        </TableCell>
                        <TableCell>{item.order_item_code}</TableCell>
                        <TableCell>{item.order_item_name}</TableCell>
                        <TableCell>
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewItem(item.order_item_id)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Read
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openEditForm(item)}
                            >
                              <Pencil className="w-4 h-4 mr-1" />
                              Update
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(item.order_item_id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}