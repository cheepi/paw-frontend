"use client";

import { useEffect, useState } from "react";
import { getAuthToken } from "@/lib/auth";
import { Loader2, Trash2, Plus, X } from "lucide-react";
import type { User } from "@/types"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { colors } from "@/styles/colors";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: "user" | "admin";
}

const defaultFormState: UserFormData = {
  name: "",
  email: "",
  password: "",
  role: "user",
};

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<UserFormData>(defaultFormState);
  const [error, setError] = useState<string | null>(null);

  const token = getAuthToken();

  async function fetchUsers() {
    setIsLoading(true);
    const res = await fetch(`${API_URL}/api/users`, { 
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setUsers(data || []);
    } else {
        console.error("Gagal fetch users:", res.statusText);
        setUsers([]);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleDelete = async (userId: string) => {
    if (!confirm("Yakin mau hapus user ini? Ini gak bisa di-undo.")) return;
    
    await fetch(`${API_URL}/api/users/${userId}`, { 
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    fetchUsers(); 
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.password || formData.password.length < 6) {
        setError("Password wajib diisi, minimal 6 karakter.");
        return;
    }

    const res = await fetch(`${API_URL}/api/users`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    });

    if (!res.ok) {
        const errData = await res.json();
        setError(errData.message || "Gagal membuat user.");
    } else {
        closeModal();
        fetchUsers();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData(defaultFormState);
    setError(null);
  };

  if (isLoading && !showModal) {
    return (
      <div className="flex items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
        <p style={{ color: colors.textSecondary }}>Loading users...</p>
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
            className="p-6 rounded-lg shadow-xl w-full max-w-md relative border"
            style={{
              backgroundColor: colors.bgPrimary,
              borderColor: colors.bgTertiary,
            }}
          >
            <button 
              onClick={closeModal} 
              className="absolute top-4 right-4 transition-colors rounded-lg p-1 hover:bg-slate-100"
              style={{ color: colors.textSecondary }}
            >
              <X className="w-6 h-6" />
            </button>
            <h2 
              className="text-2xl font-bold mb-5"
              style={{ color: colors.textPrimary }}
            >
              Tambah User Baru
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label 
                  className="text-sm font-medium block mb-2"
                  style={{ color: colors.textPrimary }}
                >
                  Nama Lengkap
                </label>
                <Input 
                  name="name" 
                  value={formData.name} 
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
                  Email
                </label>
                <Input 
                  name="email" 
                  type="email" 
                  value={formData.email} 
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
                  Password (Minimal 6 karakter)
                </label>
                <Input 
                  name="password" 
                  type="password" 
                  value={formData.password} 
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
                  Role
                </label>
                <select 
                  name="role" 
                  value={formData.role} 
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
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {error && (
                <p className="text-sm" style={{ color: colors.danger }}>
                  {error}
                </p>
              )}
              
              <Button 
                type="submit" 
                variant="primary" 
                className="w-full mt-6 py-3 font-semibold text-white rounded-lg transition-all hover:opacity-90"
                style={{
                  backgroundColor: colors.primary,
                }}
              >
                Simpan User
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
          Manage Users
        </h1>
        <Button 
          onClick={() => setShowModal(true)} 
          variant="primary" 
          className="flex items-center gap-2 px-4 py-2.5 font-semibold rounded-lg text-white transition-all hover:opacity-90"
          style={{
            backgroundColor: colors.primary,
          }}
        >
          <Plus className="w-4 h-4" />
          Tambah User
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
            <table className="w-full min-w-[600px]">
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
                  Nama
                </th>
                <th 
                  className="text-left p-4 font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  Email
                </th>
                <th 
                  className="text-left p-4 font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  Role
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
                {users.map((user) => (
                <tr 
                  key={user._id || user.id} 
                  className="border-b transition-colors hover:opacity-80"
                  style={{
                    borderColor: colors.bgTertiary,
                    backgroundColor: colors.bgPrimary,
                  }}
                >
                    <td 
                      className="p-4"
                      style={{ color: colors.textPrimary }}
                    >
                      {user.name}
                    </td>
                    <td 
                      className="p-4"
                      style={{ color: colors.textPrimary }}
                    >
                      {user.email}
                    </td>
                    <td className="p-4">
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: user.role === 'admin' ? `${colors.primary}15` : `${colors.textSecondary}15`,
                        color: user.role === 'admin' ? colors.primary : colors.textSecondary,
                      }}
                    >
                        {user.role.toUpperCase()}
                    </span>
                    </td>
                    <td className="p-4">
                    <button 
                        onClick={() => handleDelete(user._id || user.id)} 
                        className="p-2 rounded-lg transition-colors hover:opacity-80 disabled:opacity-50"
                        style={{
                          backgroundColor: `${colors.danger}15`,
                          color: colors.danger,
                        }}
                        title="Delete"
                        disabled={user.email.includes('main_admin')}
                    >
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