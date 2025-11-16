"use client";

import React, { useEffect, useState } from "react";
import { getAuthToken } from "@/lib/auth";
import { Loader2, Trash2, Edit, Plus, X } from "lucide-react";
import type { Book } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { colors } from "@/styles/colors";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const defaultFormState: Partial<Book> = {
  title: "",
  author: "",
  stock: 1,
  category: "",
  year: new Date().getFullYear(),
  cover: "",
  synopsis: "",
  publisher: "",
  location: "",
  isbn: "",
  status: "available",
};

// Extended Book type with borrowedCount
type BookWithBorrowed = Book & { borrowedCount?: number };

export default function ManageBooksPage(): React.JSX.Element {
  const [books, setBooks] = useState<BookWithBorrowed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Book>>(defaultFormState);

  const token = getAuthToken();

  async function fetchBooks() {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/api/books`);
      const data = await res.json();
      const booksData = data?.data ?? [];
      
      // Fetch borrowed count for each book
      const booksWithBorrowed = await Promise.all(
        booksData.map(async (book: Book) => {
          try {
            const bookId = book._id ?? (book as any).id;
            const loansRes = await fetch(`${API_URL}/api/loans`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (loansRes.ok) {
              const loansData = await loansRes.json();
              const loans = Array.isArray(loansData) ? loansData : Array.isArray(loansData?.data) ? loansData.data : [];
              
              // Count borrowed (status === 'borrowed')
              const borrowedCount = loans.filter((loan: any) => {
                const loanBookId = loan.book?.id || loan.book?._id || loan.bookId;
                return loanBookId === bookId && loan.status === 'borrowed';
              }).length;
              
              return { ...book, borrowedCount };
            }
            return { ...book, borrowedCount: 0 };
          } catch {
            return { ...book, borrowedCount: 0 };
          }
        })
      );
      
      setBooks(booksWithBorrowed);
    } catch (err) {
      console.error("fetchBooks error:", err);
      setBooks([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (bookId?: string) => {
    if (!bookId) return;
    if (!confirm("Yakin mau hapus buku ini?")) return;
    try {
      await fetch(`${API_URL}/api/books/${bookId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchBooks();
    } catch (err) {
      console.error("delete error:", err);
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    const isNumberField = ["stock", "year"].includes(name);
    setFormData((prev) => ({
      ...prev,
      [name]: isNumberField ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalFormData = {
      ...formData,
      status:
        (formData?.stock as number) === 0 ? "unavailable" : formData?.status,
    };

    const method = isEditing ? "PUT" : "POST";
    const endpoint = isEditing
      ? `${API_URL}/api/books/${isEditing}`
      : `${API_URL}/api/books`;

    try {
      await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalFormData),
      });
      closeModal();
      fetchBooks();
    } catch (err) {
      console.error("submit error:", err);
    }
  };

  const openCreateModal = () => {
    setIsEditing(null);
    setFormData(defaultFormState);
    setShowModal(true);
  };

  const openEditModal = (book: Book) => {
    setIsEditing(book._id ?? (book as any).id ?? null);
    setFormData(book);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(null);
    setFormData(defaultFormState);
  };

  if (isLoading && !showModal) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
      </div>
    );
  }

  return (
    <div>
      {showModal && (
        <div
          className="fixed inset-0 z-50 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
        >
          <div
            className="p-6 rounded-lg shadow-xl w-full max-w-lg relative border"
            style={{
              backgroundColor: colors.bgPrimary,
              borderColor: colors.bgTertiary,
            }}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 transition-colors rounded-lg p-1 hover:opacity-80"
              style={{ color: colors.textSecondary }}
              aria-label="Close Modal"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold mb-5" style={{ color: colors.textPrimary }}>
              {isEditing ? "Edit Buku" : "Tambah Buku Baru"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: colors.textPrimary }}>
                  Judul
                </label>
                <Input
                  name="title"
                  value={formData.title ?? ""}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border transition-all focus:outline-none"
                  style={{
                    backgroundColor: colors.bgSecondary,
                    color: colors.textPrimary,
                    borderColor: colors.bgTertiary,
                  }}
                  onFocus={(e: any) => {
                    e.currentTarget.style.borderColor = colors.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}20`;
                  }}
                  onBlur={(e: any) => {
                    e.currentTarget.style.borderColor = colors.bgTertiary;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: colors.textPrimary }}>
                  Author
                </label>
                <Input
                  name="author"
                  value={formData.author ?? ""}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border transition-all focus:outline-none"
                  style={{
                    backgroundColor: colors.bgSecondary,
                    color: colors.textPrimary,
                    borderColor: colors.bgTertiary,
                  }}
                  onFocus={(e: any) => {
                    e.currentTarget.style.borderColor = colors.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}20`;
                  }}
                  onBlur={(e: any) => {
                    e.currentTarget.style.borderColor = colors.bgTertiary;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              <div className="flex gap-4">
                <div className="w-1/3">
                  <label className="text-sm font-medium block mb-2" style={{ color: colors.textPrimary }}>
                    Stock
                  </label>
                  <Input
                    name="stock"
                    type="number"
                    value={String(formData.stock ?? 0)}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border transition-all focus:outline-none"
                    style={{
                      backgroundColor: colors.bgSecondary,
                      color: colors.textPrimary,
                      borderColor: colors.bgTertiary,
                    }}
                    onFocus={(e: any) => {
                      e.currentTarget.style.borderColor = colors.primary;
                      e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}20`;
                    }}
                    onBlur={(e: any) => {
                      e.currentTarget.style.borderColor = colors.bgTertiary;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                  {(formData.stock as number) === 0 && (
                    <p className="text-xs mt-1" style={{ color: colors.warning }}>
                      Stock 0 akan otomatis jadi Unavailable
                    </p>
                  )}
                </div>

                <div className="w-1/3">
                  <label className="text-sm font-medium block mb-2" style={{ color: colors.textPrimary }}>
                    Tahun
                  </label>
                  <Input
                    name="year"
                    type="number"
                    value={String(formData.year ?? new Date().getFullYear())}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 rounded-lg border transition-all focus:outline-none"
                    style={{
                      backgroundColor: colors.bgSecondary,
                      color: colors.textPrimary,
                      borderColor: colors.bgTertiary,
                    }}
                    onFocus={(e: any) => {
                      e.currentTarget.style.borderColor = colors.primary;
                      e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}20`;
                    }}
                    onBlur={(e: any) => {
                      e.currentTarget.style.borderColor = colors.bgTertiary;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                <div className="w-1/3">
                  <label className="text-sm font-medium block mb-2" style={{ color: colors.textPrimary }}>
                    Status
                  </label>
                  <select
                    name="status"
                    value={(formData.stock as number) === 0 ? "unavailable" : formData.status ?? "available"}
                    onChange={handleFormChange}
                    disabled={(formData.stock as number) === 0}
                    className="w-full h-[42px] px-4 py-2 rounded-lg focus:outline-none transition-all border disabled:opacity-50"
                    style={{
                      backgroundColor: colors.bgSecondary,
                      color: colors.textPrimary,
                      borderColor: colors.bgTertiary,
                    }}
                    onFocus={(e: any) => {
                      e.currentTarget.style.borderColor = colors.primary;
                      e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}20`;
                    }}
                    onBlur={(e: any) => {
                      e.currentTarget.style.borderColor = colors.bgTertiary;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: colors.textPrimary }}>
                  Kategori
                </label>
                <Input
                  name="category"
                  value={formData.category ?? ""}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 rounded-lg border transition-all focus:outline-none"
                  style={{
                    backgroundColor: colors.bgSecondary,
                    color: colors.textPrimary,
                    borderColor: colors.bgTertiary,
                  }}
                  onFocus={(e: any) => {
                    e.currentTarget.style.borderColor = colors.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}20`;
                  }}
                  onBlur={(e: any) => {
                    e.currentTarget.style.borderColor = colors.bgTertiary;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: colors.textPrimary }}>
                  Publisher
                </label>
                <Input
                  name="publisher"
                  value={formData.publisher ?? ""}
                  onChange={handleFormChange}
                  placeholder="Penerbit..."
                  className="w-full px-4 py-2 rounded-lg border transition-all focus:outline-none"
                  style={{
                    backgroundColor: colors.bgSecondary,
                    color: colors.textPrimary,
                    borderColor: colors.bgTertiary,
                  }}
                  onFocus={(e: any) => {
                    e.currentTarget.style.borderColor = colors.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}20`;
                  }}
                  onBlur={(e: any) => {
                    e.currentTarget.style.borderColor = colors.bgTertiary;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium block mb-2" style={{ color: colors.textPrimary }}>
                    ISBN
                  </label>
                  <Input
                    name="isbn"
                    value={formData.isbn ?? ""}
                    onChange={handleFormChange}
                    placeholder="978-..."
                    className="w-full px-4 py-2 rounded-lg border transition-all focus:outline-none"
                    style={{
                      backgroundColor: colors.bgSecondary,
                      color: colors.textPrimary,
                      borderColor: colors.bgTertiary,
                    }}
                    onFocus={(e: any) => {
                      e.currentTarget.style.borderColor = colors.primary;
                      e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}20`;
                    }}
                    onBlur={(e: any) => {
                      e.currentTarget.style.borderColor = colors.bgTertiary;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                <div className="flex-1">
                  <label className="text-sm font-medium block mb-2" style={{ color: colors.textPrimary }}>
                    Lokasi Rak
                  </label>
                  <Input
                    name="location"
                    value={formData.location ?? ""}
                    onChange={handleFormChange}
                    placeholder="Contoh: Rak A-1"
                    className="w-full px-4 py-2 rounded-lg border transition-all focus:outline-none"
                    style={{
                      backgroundColor: colors.bgSecondary,
                      color: colors.textPrimary,
                      borderColor: colors.bgTertiary,
                    }}
                    onFocus={(e: any) => {
                      e.currentTarget.style.borderColor = colors.primary;
                      e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}20`;
                    }}
                    onBlur={(e: any) => {
                      e.currentTarget.style.borderColor = colors.bgTertiary;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: colors.textPrimary }}>
                  Cover URL
                </label>
                <Input
                  name="cover"
                  value={formData.cover ?? ""}
                  onChange={handleFormChange}
                  placeholder="https://..."
                  className="w-full px-4 py-2 rounded-lg border transition-all focus:outline-none"
                  style={{
                    backgroundColor: colors.bgSecondary,
                    color: colors.textPrimary,
                    borderColor: colors.bgTertiary,
                  }}
                  onFocus={(e: any) => {
                    e.currentTarget.style.borderColor = colors.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}20`;
                  }}
                  onBlur={(e: any) => {
                    e.currentTarget.style.borderColor = colors.bgTertiary;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: colors.textPrimary }}>
                  Sinopsis
                </label>
                <textarea
                  name="synopsis"
                  value={formData.synopsis ?? ""}
                  onChange={handleFormChange}
                  className="w-full h-24 px-4 py-2 rounded-lg border transition-all focus:outline-none"
                  style={{
                    backgroundColor: colors.bgSecondary,
                    color: colors.textPrimary,
                    borderColor: colors.bgTertiary,
                  }}
                  onFocus={(e: any) => {
                    e.currentTarget.style.borderColor = colors.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}20`;
                  }}
                  onBlur={(e: any) => {
                    e.currentTarget.style.borderColor = colors.bgTertiary;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full !mt-6 !py-3 font-semibold text-white rounded-lg transition-all hover:opacity-90"
                style={{ backgroundColor: colors.primary }}
              >
                {isEditing ? "Simpan Perubahan" : "Simpan Buku"}
              </Button>
            </form>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
          Manage Books
        </h1>
        <Button
          onClick={openCreateModal}
          variant="primary"
          className="flex items-center gap-2 px-4 py-2.5 font-semibold rounded-lg text-white transition-all hover:opacity-90"
          style={{ backgroundColor: colors.primary }}
        >
          <Plus className="w-4 h-4" />
          Tambah Buku
        </Button>
      </div>

      <div className="rounded-lg border shadow-sm overflow-hidden" style={{ backgroundColor: colors.bgPrimary, borderColor: colors.bgTertiary }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="border-b" style={{ backgroundColor: colors.bgSecondary, borderColor: colors.bgTertiary }}>
              <tr>
                <th className="text-left p-4 font-semibold" style={{ color: colors.textPrimary }}>Judul</th>
                <th className="text-left p-4 font-semibold" style={{ color: colors.textPrimary }}>Author</th>
                <th className="text-left p-4 font-semibold" style={{ color: colors.textPrimary }}>Stock</th>
                <th className="text-left p-4 font-semibold" style={{ color: colors.textPrimary }}>Borrowed</th>
                <th className="text-left p-4 font-semibold" style={{ color: colors.textPrimary }}>Status</th>
                <th className="text-center p-4 font-semibold" style={{ color: colors.textPrimary }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {books.map((book) => {
                const key = book._id ?? (book as any).id;
                const displayStatus = (book.stock as number) === 0 ? "unavailable" : book.status;

                return (
                  <tr key={key} className="border-b transition-colors hover:opacity-80" style={{ borderColor: colors.bgTertiary, backgroundColor: colors.bgPrimary }}>
                    <td className="p-4 align-top" style={{ color: colors.textPrimary }}>{book.title}</td>
                    <td className="p-4 align-top" style={{ color: colors.textPrimary }}>{book.author}</td>
                    <td className="p-4 align-top font-semibold" style={{ color: (book.stock as number) === 0 ? colors.danger : colors.textPrimary }}>{book.stock}</td>
                    <td className="p-4 align-top font-semibold" style={{ color: (book.borrowedCount ?? 0) > 0 ? colors.warning : colors.textSecondary }}>{book.borrowedCount ?? 0}</td>
                    <td className="p-4 align-top">
                      <span className="px-3 py-1.5 rounded-full text-xs font-semibold inline-block" style={{ backgroundColor: displayStatus === 'available' ? `${colors.success}20` : `${colors.danger}20`, color: displayStatus === 'available' ? colors.success : colors.danger }}>
                        {displayStatus}
                      </span>
                    </td>
                    <td className="p-4 align-top text-center">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => openEditModal(book)} className="p-1.5 rounded-lg transition-colors hover:opacity-80 inline-flex" style={{ backgroundColor: `${colors.info}15`, color: colors.info }} title="Edit">
                          <Edit className="w-5 h-5" />
                        </button>

                        <button onClick={() => handleDelete(book._id ?? (book as any).id)} className="p-1.5 rounded-lg transition-colors hover:opacity-80 inline-flex" style={{ backgroundColor: `${colors.danger}15`, color: colors.danger }} title="Delete">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}