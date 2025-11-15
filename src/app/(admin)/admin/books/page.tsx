"use client";

import { useEffect, useState } from "react";
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

export default function ManageBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultFormState);

  const token = getAuthToken();

  async function fetchBooks() {
    setIsLoading(true);
    const res = await fetch(`${API_URL}/api/books`);
    const data = await res.json();
    setBooks(data.data || []);
    setIsLoading(false);
  }

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleDelete = async (bookId: string) => {
    if (!confirm("Yakin mau hapus buku ini?")) return;
    await fetch(`${API_URL}/api/books/${bookId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    fetchBooks();
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumberField = ['stock', 'year'].includes(name);
    setFormData({ 
      ...formData, 
      [name]: isNumberField ? Number(value) : value 
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto set status to unavailable jika stock 0
    const finalFormData = {
      ...formData,
      status: (formData.stock as number) === 0 ? 'unavailable' : formData.status
    };

    const method = isEditing ? "PUT" : "POST";
    const endpoint = isEditing 
      ? `${API_URL}/api/books/${isEditing}` 
      : `${API_URL}/api/books`;
    
    await fetch(endpoint, {
      method: method,
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(finalFormData)
    });

    closeModal();
    fetchBooks();
  };

  const openCreateModal = () => {
    setIsEditing(null);
    setFormData(defaultFormState);
    setShowModal(true);
  };

  const openEditModal = (book: Book) => {
    setIsEditing(book._id || book.id);
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
            >
              <X className="w-6 h-6" />
            </button>
            <h2 
              className="text-2xl font-bold mb-5"
              style={{ color: colors.textPrimary }}
            >
              {isEditing ? "Edit Buku" : "Tambah Buku Baru"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
              <div>
                <label 
                  className="text-sm font-medium block mb-2"
                  style={{ color: colors.textPrimary }}
                >
                  Judul
                </label>
                <Input 
                  name="title" 
                  value={formData.title} 
                  onChange={handleFormChange} 
                  required 
                  className="w-full px-4 py-2 rounded-lg border transition-all focus:outline-none"
                  style={{
                    backgroundColor: colors.bgSecondary,
                    color: colors.textPrimary,
                    borderColor: colors.bgTertiary,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}20`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.bgTertiary;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
              <div>
                <label 
                  className="text-sm font-medium block mb-2"
                  style={{ color: colors.textPrimary }}
                >
                  Author
                </label>
                <Input 
                  name="author" 
                  value={formData.author} 
                  onChange={handleFormChange} 
                  required 
                  className="w-full px-4 py-2 rounded-lg border transition-all focus:outline-none"
                  style={{
                    backgroundColor: colors.bgSecondary,
                    color: colors.textPrimary,
                    borderColor: colors.bgTertiary,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}20`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.bgTertiary;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
              <div className="flex gap-4">
                <div className="w-1/3">
                  <label 
                    className="text-sm font-medium block mb-2"
                    style={{ color: colors.textPrimary }}
                  >
                    Stock
                  </label>
                  <Input 
                    name="stock" 
                    type="number" 
                    value={formData.stock} 
                    onChange={handleFormChange} 
                    required 
                    className="w-full px-4 py-2 rounded-lg border transition-all focus:outline-none"
                    style={{
                      backgroundColor: colors.bgSecondary,
                      color: colors.textPrimary,
                      borderColor: colors.bgTertiary,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = colors.primary;
                      e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}20`;
                    }}
                    onBlur={(e) => {
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
                  <label 
                    className="text-sm font-medium block mb-2"
                    style={{ color: colors.textPrimary }}
                  >
                    Tahun
                  </label>
                  <Input 
                    name="year" 
                    type="number" 
                    value={formData.year} 
                    onChange={handleFormChange} 
                    className="w-full px-4 py-2 rounded-lg border transition-all focus:outline-none"
                    style={{
                      backgroundColor: colors.bgSecondary,
                      color: colors.textPrimary,
                      borderColor: colors.bgTertiary,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = colors.primary;
                      e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}20`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = colors.bgTertiary;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
                <div className="w-1/3">
                  <label 
                    className="text-sm font-medium block mb-2"
                    style={{ color: colors.textPrimary }}
                  >
                    Status
                  </label>
                  <select 
                    name="status" 
                    value={(formData.stock as number) === 0 ? 'unavailable' : formData.status} 
                    onChange={handleFormChange} 
                    disabled={(formData.stock as number) === 0}
                    className="w-full h-[42px] px-4 py-2 rounded-lg focus:outline-none transition-all border disabled:opacity-50"
                    style={{
                      backgroundColor: colors.bgSecondary,
                      color: colors.textPrimary,
                      borderColor: colors.bgTertiary,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = colors.primary;
                      e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}20`;
                    }}
                    onBlur={(e) => {
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
                <label 
                  className="text-sm font-medium block mb-2"
                  style={{ color: colors.textPrimary }}
                >
                  Kategori
                </label>
                <Input 
                  name="category" 
                  value={formData.category} 
                  onChange={handleFormChange} 
                  className="w-full px-4 py-2 rounded-lg border transition-all focus:outline-none"
                  style={{
                    backgroundColor: colors.bgSecondary,
                    color: colors.textPrimary,
                    borderColor: colors.bgTertiary,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}20`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.bgTertiary;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
              <div>
                <label 
                  className="text-sm font-medium block mb-2"
                  style={{ color: colors.textPrimary }}
                >
                  Cover URL
                </label>
                <Input 
                  name="cover" 
                  value={formData.cover} 
                  onChange={handleFormChange} 
                  placeholder="https://..." 
                  className="w-full px-4 py-2 rounded-lg border transition-all focus:outline-none"
                  style={{
                    backgroundColor: colors.bgSecondary,
                    color: colors.textPrimary,
                    borderColor: colors.bgTertiary,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}20`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.bgTertiary;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
              <div>
                <label 
                  className="text-sm font-medium block mb-2"
                  style={{ color: colors.textPrimary }}
                >
                  Sinopsis
                </label>
                <textarea 
                  name="synopsis" 
                  value={formData.synopsis} 
                  onChange={handleFormChange} 
                  className="w-full h-24 px-4 py-2 rounded-lg border transition-all focus:outline-none"
                  style={{
                    backgroundColor: colors.bgSecondary,
                    color: colors.textPrimary,
                    borderColor: colors.bgTertiary,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.primary}20`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.bgTertiary;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
              
              <Button 
                type="submit" 
                variant="primary" 
                className="w-full !mt-6 !py-3 font-semibold text-white rounded-lg transition-all hover:opacity-90"
                style={{
                  backgroundColor: colors.primary,
                }}
              >
                {isEditing ? "Simpan Perubahan" : "Simpan Buku"}
              </Button>
            </form>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 
          className="text-3xl font-bold"
          style={{ color: colors.textPrimary }}
        >
          Manage Books
        </h1>
        <Button 
          onClick={openCreateModal} 
          variant="primary" 
          className="flex items-center gap-2 px-4 py-2.5 font-semibold rounded-lg text-white transition-all hover:opacity-90"
          style={{
            backgroundColor: colors.primary,
          }}
        >
          <Plus className="w-4 h-4" />
          Tambah Buku
        </Button>
      </div>

      <div 
        className="rounded-lg border shadow-sm overflow-hidden"
        style={{
          backgroundColor: colors.bgPrimary,
          borderColor: colors.bgTertiary,
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead 
              className="border-b"
              style={{
                backgroundColor: colors.bgSecondary,
                borderColor: colors.bgTertiary,
              }}
            >
              <tr>
                <th 
                  className="text-left p-4 font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  Judul
                </th>
                <th 
                  className="text-left p-4 font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  Author
                </th>
                <th 
                  className="text-left p-4 font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  Stock
                </th>
                <th 
                  className="text-left p-4 font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  Status
                </th>
                <th 
                  className="text-left p-4 font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => {
                // Auto check status berdasarkan stock
                const displayStatus = (book.stock as number) === 0 ? 'unavailable' : book.status;
                
                return (
                  <tr 
                    key={book._id || book.id} 
                    className="border-b transition-colors hover:opacity-80"
                    style={{
                      borderColor: colors.bgTertiary,
                      backgroundColor: colors.bgPrimary,
                    }}
                  >
                    <td 
                      className="p-4 align-top"
                      style={{ color: colors.textPrimary }}
                    >
                      {book.title}
                    </td>
                    <td 
                      className="p-4 align-top"
                      style={{ color: colors.textPrimary }}
                    >
                      {book.author}
                    </td>
                    <td 
                      className="p-4 align-top"
                      style={{ color: colors.textPrimary }}
                    >
                      {book.stock}
                    </td>
                    <td className="p-4 align-top">
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: displayStatus === 'available' ? `${colors.success}15` : `${colors.danger}15`,
                          color: displayStatus === 'available' ? colors.success : colors.danger,
                        }}
                      >
                        {displayStatus}
                      </span>
                    </td>
                    <td className="p-4 align-top flex gap-3">
                      <button 
                        onClick={() => openEditModal(book)} 
                        className="p-1.5 rounded-lg transition-colors hover:opacity-80"
                        style={{
                          backgroundColor: `${colors.info}15`,
                          color: colors.info,
                        }}
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(book._id || book.id)} 
                        className="p-1.5 rounded-lg transition-colors hover:opacity-80"
                        style={{
                          backgroundColor: `${colors.danger}15`,
                          color: colors.danger,
                        }}
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
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