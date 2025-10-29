// import { useState } from "react";
import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useUser } from "./user.jsx";
import { useTheme } from "./theme.jsx";
import Header from "./Header";
import { useData } from "./util";

import { Upload, X, Trash2, Calendar, FileText, Trash } from "lucide-react";

export default function PhotoGallery() {
  const { darkMode } = useTheme();
  const { isAdmin } = useUser();

  const { t, i18n } = useTranslation();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null,
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const {
    data: { photos },
    loading,
    refetch,
  } = useData("photos");

  // Handle file selection
  const handleFileSelect = e => {
    const file = e.target.files[0];
    if (file) {
      setUploadForm(prev => ({ ...prev, file }));
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Handle upload
  const handleUpload = async e => {
    e.preventDefault();
    if (!uploadForm.file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("photo", uploadForm.file);
    formData.append("date", uploadForm.date);
    formData.append("notes", uploadForm.notes);
    try {
      const response = await fetch("/api/photos", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");
      await refetch();
      // Reset form
      setUploadForm({
        file: null,
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      setPreviewUrl(null);
      setShowUploadModal(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      alert("Failed to upload photo: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Delete photo
  const handleDelete = async photoId => {
    if (!confirm("Are you sure you want to delete this photo?")) return;

    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Delete failed");
      await refetch();
    } catch (err) {
      alert("Failed to delete photo: " + err.message);
    }
  };

  return (
    <>
      {/* <div className="min-h-screen bg-gray-50"> */}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <Header />
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold dark:text-white text-gray-900">
                {t("Photo Gallery")}
              </h1>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Upload size={20} />
                {t("Upload Photo")}
              </button>
            )}
          </div>
          {/* Gallery Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600 text-lg mb-4">{t("No photos yet")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map(photo => (
                <div
                  key={photo.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="relative aspect-w-4 aspect-h-3 bg-gray-200">
                    <img
                      src={`/api/photos/${photo.filename}`}
                      alt={photo.notes || "Photo"}
                      className="w-full h-64 object-contain p-4 bg-white"
                      loading="lazy"
                    />
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="p-4 bg-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Calendar size={16} />
                      <span>{new Date(photo.date).toLocaleDateString()}</span>
                    </div>
                    {photo.notes && (
                      <div className="flex gap-2 text-sm text-gray-700">
                        <FileText size={16} className="flex-shrink-0 mt-0.5" />
                        <p className="line-clamp-3">{photo.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Upload Photo
                </h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setPreviewUrl(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleUpload}>
                {/* File Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photo
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    required
                  />
                </div>

                {/* Preview */}
                {previewUrl && (
                  <div className="mb-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Date Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={uploadForm.date}
                    onChange={e =>
                      setUploadForm(prev => ({ ...prev, date: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Notes Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={uploadForm.notes}
                    onChange={e =>
                      setUploadForm(prev => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Add a note about this photo..."
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      setPreviewUrl(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !uploadForm.file}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {uploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
