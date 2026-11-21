// app/dashboard/page.tsx
"use client";

import { clearTokens, getUserId } from "@/lib/auth";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  LogOut,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  ShoppingCart,
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

interface Category {
  category_id: number;
  category_code: string;
  category_name: string;
  id?: number;
  created_at?: string;
  updated_at?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isChecking } = useAuthGuard({ requireAuth: true });

  // Data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states (shared for Create and Update)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [categoryCode, setCategoryCode] = useState("");
  const [categoryName, setCategoryName] = useState("");

  // READ (All)
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiClient<Category[]>(CONFIG.ENDPOINTS.CATEGORY, {
        method: "GET",
        requiresAuth: true,
      });
      setCategories(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isChecking) {
      fetchCategories();
    }
  }, [isChecking, fetchCategories]);

  // READ (Single)
  const handleViewCategory = async (categoryId: number) => {
    setError("");
    setSuccess("");
    try {
      const data = await apiClient<Category>(
        `${CONFIG.ENDPOINTS.CATEGORY}/${categoryId}`,
        {
          method: "GET",
          requiresAuth: true,
        }
      );
      setSelectedCategory(data);
    } catch (err: any) {
      setError(err.message || "Failed to load category details.");
    }
  };

  // Open Form for CREATE
  const openCreateForm = () => {
    setEditingId(null);
    setCategoryCode("");
    setCategoryName("");
    setSelectedCategory(null);
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };

  // Open Form for UPDATE
  const openEditForm = (category: Category) => {
    setEditingId(category.category_id);
    setCategoryCode(category.category_code);
    setCategoryName(category.category_name);
    setSelectedCategory(null);
    setError("");
    setSuccess("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setCategoryCode("");
    setCategoryName("");
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
        // UPDATE (PUT /category/:id)
        await apiClient(`${CONFIG.ENDPOINTS.CATEGORY}/${editingId}`, {
          method: "PUT",
          requiresAuth: true,
          body: JSON.stringify({
            category_code: categoryCode,
            category_name: categoryName,
            id: userId,
          }),
        });
        setSuccess(`Category #${editingId} updated successfully.`);
      } else {
        // CREATE (POST /category)
        await apiClient(CONFIG.ENDPOINTS.CATEGORY, {
          method: "POST",
          requiresAuth: true,
          body: JSON.stringify({
            category_code: categoryCode,
            category_name: categoryName,
            id: userId,
          }),
        });
        setSuccess("New category created successfully.");
      }

      closeForm();
      await fetchCategories();
    } catch (err: any) {
      setError(err.message || "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE (DELETE /category/:id)
  const handleDelete = async (categoryId: number) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete Category #${categoryId}?`
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");
    try {
      await apiClient(`${CONFIG.ENDPOINTS.CATEGORY}/${categoryId}`, {
        method: "DELETE",
        requiresAuth: true,
      });

      if (selectedCategory?.category_id === categoryId) {
        setSelectedCategory(null);
      }
      setSuccess(`Category #${categoryId} deleted successfully.`);
      await fetchCategories();
    } catch (err: any) {
      setError(err.message || "Failed to delete category.");
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
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage categories</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(CONFIG.ROUTES.PRODUCT)}
            >
              <Package className="w-4 h-4 mr-2" />
              Products
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(CONFIG.ROUTES.ORDER_ITEM)}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Order Items
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
                    ? `Update Category #${editingId}`
                    : "Create New Category"}
                </CardTitle>
                <CardDescription>
                  {editingId !== null
                    ? "Modify the category code and name below."
                    : "Fill in the details to add a new category."}
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
                    <Label htmlFor="category_code">Category Code</Label>
                    <Input
                      id="category_code"
                      placeholder="e.g. VM3"
                      value={categoryCode}
                      onChange={(e) => setCategoryCode(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category_name">Category Name</Label>
                    <Input
                      id="category_name"
                      placeholder="e.g. Value Meal 3"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
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
                      : "Create Category"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* READ Single Item Details Card */}
        {selectedCategory && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>
                  Category Details (#{selectedCategory.category_id})
                </CardTitle>
                <CardDescription>
                  Fetched directly from GET /category/
                  {selectedCategory.category_id}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedCategory(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block">Category ID</span>
                <span className="font-medium">
                  {selectedCategory.category_id}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Code</span>
                <span className="font-medium">
                  {selectedCategory.category_code}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Name</span>
                <span className="font-medium">
                  {selectedCategory.category_name}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Created At</span>
                <span className="font-medium">
                  {selectedCategory.created_at
                    ? new Date(selectedCategory.created_at).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Table Card */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                A list of all categories stored in the backend.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={fetchCategories}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Read / Refresh
              </Button>
              <Button onClick={openCreateForm}>
                <Plus className="w-4 h-4 mr-2" />
                Create Category
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[90px]">ID</TableHead>
                    <TableHead>Category Code</TableHead>
                    <TableHead>Category Name</TableHead>
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
                        Loading categories...
                      </TableCell>
                    </TableRow>
                  ) : categories.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No categories found. Click &quot;Create Category&quot;
                        to add one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((cat) => (
                      <TableRow key={cat.category_id}>
                        <TableCell className="font-medium">
                          {cat.category_id}
                        </TableCell>
                        <TableCell>{cat.category_code}</TableCell>
                        <TableCell>{cat.category_name}</TableCell>
                        <TableCell>
                          {cat.created_at
                            ? new Date(cat.created_at).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewCategory(cat.category_id)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Read
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openEditForm(cat)}
                            >
                              <Pencil className="w-4 h-4 mr-1" />
                              Update
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(cat.category_id)}
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