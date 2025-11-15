"use client";

import { useEffect, useState } from "react";
import { getAuthToken } from "@/lib/auth";
import { Loader2, Edit, Plus, X, Trash2 } from "lucide-react";
import type { Room } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { colors } from "@/styles/colors";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const defaultFormState: Partial<Room> = {
  name: "",
  description: "",
  capacity: 1,
  price: 0,
  facilities: [],
  photos: [],
  status: "available",
};

export default function ManageRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultFormState);
  
  const [facilitiesString, setFacilitiesString] = useState("");
  const [photosString, setPhotosString] = useState("");

  const token = getAuthToken();

  async function fetchRooms() {
    setIsLoading(true);
    const res = await fetch(`${API_URL}/api/rooms`);
    const data = await res.json();
    setRooms(data || []);
    setIsLoading(false);
  }

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleDelete = async (roomId: string) => {
    if (!confirm("Yakin mau hapus ruangan ini?")) return;
    await fetch(`${API_URL}/api/rooms/${roomId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    fetchRooms();
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumberField = ['capacity', 'price'].includes(name);
    setFormData({ 
      ...formData, 
      [name]: isNumberField ? Number(value) : value 
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = isEditing ? "PUT" : "POST";
    const endpoint = isEditing 
      ? `${API_URL}/api/rooms/${isEditing}`
      : `${API_URL}/api/rooms`;
    
    const splitRegex = /[\s,]+/; 
    
    const finalFormData = {
      ...formData,
      facilities: facilitiesString
        .split(splitRegex) 
        .map(f => f.trim())
        .filter(f => f),
      photos: photosString
        .split(splitRegex)
        .map(p => p.trim())
        .filter(p => p && p.startsWith("http"))
    };

    await fetch(endpoint, {
      method: method,
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(finalFormData)
    });

    closeModal();
    fetchRooms();
  };

  const openCreateModal = () => {
    setIsEditing(null);
    setFormData(defaultFormState);
    setFacilitiesString("");
    setPhotosString("");
    setShowModal(true);
  };

  const openEditModal = (room: Room) => {
    setIsEditing(room._id || room.id);
    setFormData(room);
    setFacilitiesString((room.facilities || []).join(', '));
    setPhotosString((room.photos || []).join(', '));
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
              {isEditing ? "Edit Ruangan" : "Tambah Ruangan Baru"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
              <div>
                <label 
                  className="text-sm font-medium block mb-2"
                  style={{ color: colors.textPrimary }}
                >
                  Nama Ruangan
                </label>
                <Input 
                  name="name" 
                  value={formData.name || ""} 
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
                  Deskripsi
                </label>
                <textarea 
                  name="description" 
                  value={formData.description || ""} 
                  onChange={handleFormChange} 
                  rows={3} 
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
                    Kapasitas
                  </label>
                  <Input 
                    name="capacity" 
                    type="number" 
                    value={formData.capacity || 1} 
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
                <div className="w-1/3">
                  <label 
                    className="text-sm font-medium block mb-2"
                    style={{ color: colors.textPrimary }}
                  >
                    Harga/Jam
                  </label>
                  <Input 
                    name="price" 
                    type="number" 
                    value={formData.price || 0} 
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
                    value={formData.status} 
                    onChange={handleFormChange} 
                    className="w-full h-[42px] px-4 py-2 rounded-lg border transition-all focus:outline-none"
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
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label 
                  className="text-sm font-medium block mb-2"
                  style={{ color: colors.textPrimary }}
                >
                  Fasilitas (Pisahkan dgn koma/spasi/enter)
                </label>
                <textarea 
                  name="facilities" 
                  value={facilitiesString || ""} 
                  onChange={(e) => setFacilitiesString(e.target.value)} 
                  placeholder="Contoh: AC, Proyektor, Papan Tulis" 
                  rows={3}
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
                  Photo URLs (Pisahkan dgn koma/spasi/enter)
                </label>
                <textarea 
                  name="photos" 
                  value={photosString || ""} 
                  onChange={(e) => setPhotosString(e.target.value)} 
                  placeholder="https://.../img1.jpg, https://.../img2.jpg" 
                  rows={3}
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
              
              <Button 
                type="submit" 
                variant="primary" 
                className="w-full !mt-6 !py-3 font-semibold text-white rounded-lg transition-all hover:opacity-90"
                style={{
                  backgroundColor: colors.primary,
                }}
              >
                {isEditing ? "Simpan Perubahan" : "Simpan Ruangan"}
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
          Manage Rooms
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
          Tambah Ruangan
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
          <table className="w-full min-w-[900px]">
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
                  Nama Ruangan
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
                  Kapasitas
                </th>
                <th 
                  className="text-left p-4 font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  Harga/jam
                </th>
                <th 
                  className="text-left p-4 font-semibold"
                  style={{ color: colors.textPrimary }}
                >
                  Fasilitas
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
              {rooms.map((room) => (
                <tr 
                  key={room._id || room.id} 
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
                    {room.name}
                  </td>
                  <td className="p-4 align-top">
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: room.status === 'available' ? `${colors.success}15` : `${colors.warning}15`,
                        color: room.status === 'available' ? colors.success : colors.warning,
                      }}
                    >
                      {room.status}
                    </span>
                  </td>
                  <td 
                    className="p-4 align-top"
                    style={{ color: colors.textPrimary }}
                  >
                    {room.capacity}
                  </td>
                  <td 
                    className="p-4 align-top"
                    style={{ color: colors.textPrimary }}
                  >
                    Rp {room.price?.toLocaleString('id-ID')}
                  </td>
                  <td 
                    className="p-4 align-top text-sm"
                    style={{ color: colors.textSecondary }}
                  >
                    {(room.facilities || []).join(', ')}
                  </td>
                  <td className="p-4 align-top flex gap-3">
                    <button 
                      onClick={() => openEditModal(room)} 
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
                      onClick={() => handleDelete(room._id || room.id)} 
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}