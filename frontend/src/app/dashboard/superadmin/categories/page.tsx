"use client";

import React, { useState, useEffect } from "react";
import { fetchApi } from "@/lib/fetch-api";
import { Plus, Trash2, FolderPlus, Layers, Folder, Image, FileImage } from "lucide-react";

export default function FoodCategoriesPage() {
    const [foodCategories, setFoodCategories] = useState<any[]>([]);
    const [parentCategories, setParentCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Form inputs
    const [newCatName, setNewCatName] = useState("");
    const [selectedParentId, setSelectedParentId] = useState("");
    const [catImage, setCatImage] = useState<File | null>(null);

    const [newSubNames, setNewSubNames] = useState<Record<string, string>>({});
    const [subImages, setSubImages] = useState<Record<string, File | null>>({});

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetchApi("/api/superadmin/food-categories");
            if (res.ok) {
                const data = await res.json();
                setFoodCategories(data.foodCategories || []);
                setParentCategories(data.parentCategories || []);
                if (data.parentCategories && data.parentCategories.length > 0 && !selectedParentId) {
                    setSelectedParentId(data.parentCategories[0].id);
                }
            } else {
                console.error("Failed to load categories");
            }
        } catch (error) {
            console.error("Error loading categories:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateFoodCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCatName.trim() || !selectedParentId) return;
        
        setActionLoading(true);
        try {
            const formData = new FormData();
            formData.append("name", newCatName);
            formData.append("categoryId", selectedParentId);
            if (catImage) {
                formData.append("image", catImage);
            }

            const res = await fetchApi("/api/superadmin/food-categories", {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                setNewCatName("");
                setCatImage(null);
                // Reset file input element if any
                const fileInput = document.getElementById("cat-image-input") as HTMLInputElement;
                if (fileInput) fileInput.value = "";
                fetchData();
            } else {
                const err = await res.json();
                alert(err.message || "Failed to create category");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteFoodCategory = async (id: string) => {
        if (!confirm("Are you sure you want to delete this food category? This will also delete all sub-categories under it and disassociate any menu items.")) return;
        
        setActionLoading(true);
        try {
            const res = await fetchApi(`/api/superadmin/food-categories/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchData();
            } else {
                alert("Failed to delete category");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateSubCategory = async (foodCategoryId: string) => {
        const subName = newSubNames[foodCategoryId];
        const subImage = subImages[foodCategoryId];
        if (!subName || !subName.trim()) return;

        setActionLoading(true);
        try {
            const formData = new FormData();
            formData.append("name", subName);
            formData.append("foodCategoryId", foodCategoryId);
            if (subImage) {
                formData.append("image", subImage);
            }

            const res = await fetchApi("/api/superadmin/food-subcategories", {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                setNewSubNames(prev => ({ ...prev, [foodCategoryId]: "" }));
                setSubImages(prev => ({ ...prev, [foodCategoryId]: null }));
                // Reset file input element if any
                const fileInput = document.getElementById(`sub-image-input-${foodCategoryId}`) as HTMLInputElement;
                if (fileInput) fileInput.value = "";
                fetchData();
            } else {
                const err = await res.json();
                alert(err.message || "Failed to create sub-category");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteSubCategory = async (id: string) => {
        if (!confirm("Are you sure you want to delete this sub-category? Menu items belonging to it will lose this sub-category tag.")) return;

        setActionLoading(true);
        try {
            const res = await fetchApi(`/api/superadmin/food-subcategories/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchData();
            } else {
                alert("Failed to delete sub-category");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "var(--background)", padding: "var(--spacing-6)", fontFamily: "var(--font-sans)" }}>
            <div style={{ marginBottom: "var(--spacing-8)" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--text-main)", marginBottom: "var(--spacing-2)" }}>Food Categories</h1>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                    Configure the food categories and sub-categories available to sellers, including custom category/subcategory images.
                </p>
            </div>

            {/* Creation Area */}
            <div style={{
                backgroundColor: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--spacing-6)",
                boxShadow: "var(--shadow-sm)",
                marginBottom: "var(--spacing-8)"
            }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "var(--spacing-4)", display: "flex", alignItems: "center", gap: "10px", color: "var(--text-main)" }}>
                    <FolderPlus size={20} color="var(--primary)" /> Add Food Category
                </h2>
                <form onSubmit={handleCreateFoodCategory} style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-end" }}>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "5px", color: "var(--text-muted)" }}>
                            Category Name
                        </label>
                        <input
                            type="text"
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            placeholder="e.g. Cake, Pastry, Cone"
                            className="input-field"
                            style={{ marginBottom: 0, width: "100%" }}
                            required
                            disabled={actionLoading}
                        />
                    </div>
                    <div style={{ width: "200px" }}>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "5px", color: "var(--text-muted)" }}>
                            Seller Category Type (Parent)
                        </label>
                        <select
                            value={selectedParentId}
                            onChange={(e) => setSelectedParentId(e.target.value)}
                            className="input-field"
                            style={{ marginBottom: 0, appearance: "auto", width: "100%" }}
                            required
                            disabled={actionLoading}
                        >
                            {parentCategories.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                            {parentCategories.length === 0 && (
                                <option value="">No food type seller categories found</option>
                            )}
                        </select>
                    </div>
                    <div style={{ width: "260px" }}>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", marginBottom: "5px", color: "var(--text-muted)" }}>
                            Category Image (Optional)
                        </label>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <input
                                id="cat-image-input"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setCatImage(e.target.files?.[0] || null)}
                                style={{
                                    flex: 1,
                                    fontSize: "0.8rem",
                                    padding: "8px",
                                    border: "1px solid var(--border)",
                                    borderRadius: "var(--radius-md)",
                                    backgroundColor: "var(--background)",
                                    color: "var(--text-main)",
                                    outline: "none"
                                }}
                                disabled={actionLoading}
                            />
                            {catImage && (
                                <img
                                    src={URL.createObjectURL(catImage)}
                                    alt="Preview"
                                    style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }}
                                />
                            )}
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="btn btn-coral"
                        style={{ height: "40px", padding: "0 25px", display: "flex", alignItems: "center", gap: "8px" }}
                        disabled={actionLoading || parentCategories.length === 0}
                    >
                        <Plus size={16} /> Add Category
                    </button>
                </form>
            </div>

            {/* Categories View Hierarchy */}
            <h2 style={{ fontSize: "1.4rem", fontWeight: "bold", color: "var(--text-main)", marginBottom: "var(--spacing-6)", display: "flex", alignItems: "center", gap: "10px" }}>
                <Layers size={22} color="var(--primary)" /> Category & Subcategory Catalog
            </h2>

            {loading ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Loading catalog data...</div>
            ) : parentCategories.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", color: "var(--text-muted)" }}>
                    No seller category types found. Please configure seller categories in the "Sellers & Categories" tab first.
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
                    {parentCategories.map((parent) => {
                        const categoriesInParent = foodCategories.filter((fc) => fc.categoryId === parent.id);

                        return (
                            <div key={parent.id} style={{
                                backgroundColor: "var(--surface)",
                                border: "1px solid var(--border)",
                                borderRadius: "var(--radius-lg)",
                                padding: "var(--spacing-6)",
                                boxShadow: "var(--shadow-sm)"
                            }}>
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    borderBottom: "2px solid var(--border)",
                                    paddingBottom: "12px",
                                    marginBottom: "20px"
                                }}>
                                    <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "var(--primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                                        <Folder size={18} /> {parent.name} Business Category
                                    </h3>
                                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", backgroundColor: "var(--background)", padding: "4px 10px", borderRadius: "12px", border: "1px solid var(--border)" }}>
                                        {categoriesInParent.length} Food Categories
                                    </span>
                                </div>

                                {categoriesInParent.length === 0 ? (
                                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontStyle: "italic", margin: "20px 0" }}>
                                        No food categories configured for {parent.name} yet.
                                    </p>
                                ) : (
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "25px" }}>
                                        {categoriesInParent.map((fc) => (
                                            <div key={fc.id} style={{
                                                border: "1px solid var(--border)",
                                                borderRadius: "var(--radius-md)",
                                                padding: "18px",
                                                backgroundColor: "var(--background)",
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "space-between",
                                                boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                                                minHeight: "280px"
                                            }}>
                                                <div>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                            {fc.imageUrl ? (
                                                                <img
                                                                    src={fc.imageUrl}
                                                                    alt={fc.name}
                                                                    style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }}
                                                                />
                                                            ) : (
                                                                <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                    <Folder size={14} color="var(--primary)" />
                                                                </div>
                                                            )}
                                                            <h4 style={{ fontSize: "1.1rem", fontWeight: "bold", color: "var(--text-main)", margin: 0 }}>
                                                                {fc.name}
                                                            </h4>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteFoodCategory(fc.id)}
                                                            style={{
                                                                background: "none",
                                                                border: "none",
                                                                color: "var(--coral)",
                                                                cursor: "pointer",
                                                                padding: "4px",
                                                                borderRadius: "4px"
                                                            }}
                                                            title="Delete category"
                                                            disabled={actionLoading}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>

                                                    {/* Subcategories list */}
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px", maxHeight: "150px", overflowY: "auto" }}>
                                                        {fc.subCategories && fc.subCategories.length > 0 ? (
                                                            fc.subCategories.map((sub: any) => (
                                                                <div key={sub.id} style={{
                                                                    display: "flex",
                                                                    justifyContent: "space-between",
                                                                    alignItems: "center",
                                                                    padding: "6px 12px",
                                                                    backgroundColor: "var(--surface)",
                                                                    border: "1px solid var(--border)",
                                                                    borderRadius: "6px",
                                                                    fontSize: "0.85rem"
                                                                }}>
                                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                        {sub.imageUrl && (
                                                                            <img
                                                                                src={sub.imageUrl}
                                                                                alt={sub.name}
                                                                                style={{ width: "20px", height: "20px", borderRadius: "4px", objectFit: "cover" }}
                                                                            />
                                                                        )}
                                                                        <span style={{ color: "var(--text-main)", fontWeight: "500" }}>{sub.name}</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleDeleteSubCategory(sub.id)}
                                                                        style={{
                                                                            background: "none",
                                                                            border: "none",
                                                                            color: "var(--text-muted)",
                                                                            cursor: "pointer",
                                                                            fontSize: "0.95rem"
                                                                        }}
                                                                        title="Delete subcategory"
                                                                        disabled={actionLoading}
                                                                    >
                                                                        &times;
                                                                    </button>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic", padding: "5px 0" }}>
                                                                No sub-categories yet
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Add subcategory form inside category card */}
                                                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                                                    <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                                                        <input
                                                            type="text"
                                                            placeholder="Subcategory name (e.g. Chocolate)"
                                                            value={newSubNames[fc.id] || ""}
                                                            onChange={(e) => setNewSubNames({ ...newSubNames, [fc.id]: e.target.value })}
                                                            style={{
                                                                flex: 1,
                                                                padding: "8px",
                                                                border: "1px solid var(--border)",
                                                                borderRadius: "6px",
                                                                fontSize: "0.8rem",
                                                                outline: "none",
                                                                backgroundColor: "var(--surface)",
                                                                color: "var(--text-main)"
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    e.preventDefault();
                                                                    handleCreateSubCategory(fc.id);
                                                                }
                                                            }}
                                                            disabled={actionLoading}
                                                        />
                                                    </div>
                                                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                                        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
                                                            <input
                                                                id={`sub-image-input-${fc.id}`}
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => setSubImages({ ...subImages, [fc.id]: e.target.files?.[0] || null })}
                                                                style={{
                                                                    flex: 1,
                                                                    fontSize: "0.75rem",
                                                                    padding: "4px",
                                                                    border: "1px solid var(--border)",
                                                                    borderRadius: "6px",
                                                                    backgroundColor: "var(--surface)",
                                                                    color: "var(--text-main)"
                                                                }}
                                                                disabled={actionLoading}
                                                            />
                                                            {subImages[fc.id] && (
                                                                <img
                                                                    src={URL.createObjectURL(subImages[fc.id]!)}
                                                                    alt="Preview"
                                                                    style={{ width: "24px", height: "24px", borderRadius: "4px", objectFit: "cover", border: "1px solid var(--border)" }}
                                                                />
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => handleCreateSubCategory(fc.id)}
                                                            className="btn btn-primary"
                                                            style={{ width: "auto", padding: "6px 12px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem" }}
                                                            disabled={actionLoading}
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
