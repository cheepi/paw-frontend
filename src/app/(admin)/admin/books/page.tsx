"use client";

import { useEffect, useState } from "react";
import { getAuthToken } from "@/lib/auth";
import { Loader2, Trash2, Edit, Plus, X } from "lucide-react";
import type { Book } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      body: JSON.stringify(formData)
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
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 transition-colors">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold mb-5">{isEditing ? "Edit Buku" : "Tambah Buku Baru"}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
              <div>
                <label className="text-sm font-medium">Judul</label>
                <Input name="title" value={formData.title || ""} onChange={handleFormChange} required />
              </div>
              <div>
                <label className="text-sm font-medium">Author</label>
                <Input name="author" value={formData.author || ""} onChange={handleFormChange} required />
              </div>
              
              <div className="flex gap-4">
                <div className="w-1/3">
                  <label className="text-sm font-medium">Stock</label>
                  <Input name="stock" type="number" value={formData.stock || 0} onChange={handleFormChange} required />
                </div>
                <div className="w-1/3">
                  <label className="text-sm font-medium">Tahun</label>
                  <Input name="year" type="number" value={formData.year || new Date().getFullYear()} onChange={handleFormChange} />
                </div>
                <div className="w-1/3">
                  <label className="text-sm font-medium">Status</label>
                  <select 
                    name="status" 
                    value={formData.status} 
                    onChange={handleFormChange} 
                    className="w-full h-[42px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Kategori</label>
                <Input name="category" value={formData.category || ""} onChange={handleFormChange} />
              </div>

              <div>
                <label className="text-sm font-medium">Publisher</label>
                <Input name="publisher" value={formData.publisher || ""} onChange={handleFormChange} placeholder="Penerbit..." />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium">ISBN</label>
                  <Input name="isbn" value={formData.isbn || ""} onChange={handleFormChange} placeholder="978-..." />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium">Lokasi Rak</label>
                  <Input name="location" value={formData.location || ""} onChange={handleFormChange} placeholder="Contoh: Rak A-1" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Cover URL</label>
                <Input name="cover" value={formData.cover || ""} onChange={handleFormChange} placeholder="https://..." />
              </div>
              <div>
                <label className="text-sm font-medium">Sinopsis</label>
                <textarea name="synopsis" value={formData.synopsis || ""} onChange={handleFormChange} className="w-full h-24 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              
              <Button type="submit" variant="primary" className="w-full !mt-6 !py-3">
                {isEditing ? "Simpan Perubahan" : "Simpan Buku"}
              </Button>
            </form>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Books</h1>
        <Button onClick={openCreateModal} variant="primary" className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Tambah Buku
        </Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left p-4 font-semibold">Judul</th>
                <th className="text-left p-4 font-semibold">Author</th>
                <th className="text-left p-4 font-semibold">Stock</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book._id || book.id} className="border-b hover:bg-slate-50">
                  <td className="p-4 align-top">{book.title}</td>
                  <td className="p-4 align-top">{book.author}</td>
                  <td className="p-4 align-top">{book.stock}</td>
                  <td className="p-4 align-top">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      book.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {book.status}
                    </span>
                  </td>
                  <td className="p-4 align-top flex gap-3">
                    <button onClick={() => openEditModal(book)} className="text-blue-600 hover:text-blue-800" title="Edit">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(book._id || book.id)} className="text-red-600 hover:text-red-800" title="Delete">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}