import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import Header from "./Header";
import { useData } from "./util";

import { Upload, X, Trash2, Calendar, FileText, Trash } from "lucide-react";

export default function PhotoGallery() {
  const navigate = useNavigate();
  const { photoId } = useParams();
  const { t } = useTranslation();
  const [selectedPhoto, setSelectedPhoto] = useState(null);
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
    data: { photos, user },
    loading,
    refetch,
  } = useData("photos");
  const isAdmin = user?.is_admin;
  const isVideo = filename => {
    const videoExtensions = [
      ".mp4",
      ".webm",
      ".ogg",
      ".mov",
      ".avi",
      ".mkv",
      ".m4v",
    ];
    const extension = filename.toLowerCase().slice(filename.lastIndexOf("."));
    return videoExtensions.includes(extension);
  };

  const isImage = filename => {
    const imageExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".svg",
      ".bmp",
    ];
    const extension = filename.toLowerCase().slice(filename.lastIndexOf("."));
    return imageExtensions.includes(extension);
  };
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
      alert("Failed to upload photo or video: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Delete photo
  const handleDelete = async photoId => {
    if (!confirm("Are you sure you want to delete this photo or video?"))
      return;

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

  const openModal = photo => navigate(`/gallery/${photo.id}`);
  const closeModal = () => navigate(-1);

  useEffect(() => {
    if (photoId && photos) {
      const photo = photos.find(p => p.id.toString() === photoId);
      if (photo) {
        setSelectedPhoto(photo);
      }
    } else {
      setSelectedPhoto(null);
    }
  }, [photoId, photos]);

  return (
    <>
      {/* <div className="min-h-screen bg-gray-50"> */}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <Header isAdmin={isAdmin} />
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
                {t("Upload Photo or Video")}
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
                  onClick={() => openModal(photo)}
                  className="dark:bg-gray-600 bg-gray-100 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="relative aspect-w-4 aspect-h-3 bg-gray-200">
                    {isVideo(photo.filename) ? (
                      <video
                        src={`/api/photos/${photo.filename}`}
                        className="w-full h-64 object-contain p-4 dark:bg-gray-700 bg-white dark:border-gray-300"
                        controls
                        loading="lazy"
                      />
                    ) : isImage(photo.filename) ? (
                      <img
                        src={`/api/photos/${photo.filename}`}
                        alt={photo.notes || "Photo"}
                        className="w-full h-64 object-contain p-4 dark:bg-gray-700 bg-white dark:border-gray-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-64 bg-gray-300 dark:bg-gray-700 text-gray-500">
                        Unsupported file type
                      </div>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(photo.id)}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="p-4 dark:bg-gray-600 bg-gray-100">
                    <div className="flex items-center gap-2 text-sm dark:text-white text-gray-600 mb-2">
                      <Calendar size={16} />
                      <span>{new Date(photo.date).toLocaleDateString()}</span>
                    </div>
                    {photo.notes && (
                      <div className="flex gap-2 text-sm dark:text-white text-gray-500">
                        <FileText size={16} className="flex-shrink-0 mt-0.5" />
                        <p className="line-clamp-3">{photo.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {/* Modal */}
              {selectedPhoto && (
                <div
                  className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
                  onClick={closeModal}
                >
                  <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
                  >
                    <X size={40} />
                  </button>

                  <div
                    className="relative max-w-6xl max-h-full"
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Large Image */}
                    <img
                      src={`/api/photos/${selectedPhoto.filename}`}
                      className="max-w-full max-h-screen object-contain rounded-lg"
                    />

                    {/* Image Info */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6 rounded-b-lg">
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {selectedPhoto.title}
                      </h2>
                      <div className="flex items-center gap-2 text-white text-sm mb-2">
                        <Calendar size={16} />
                        <span>
                          {new Date(selectedPhoto.date).toLocaleDateString()}
                        </span>
                      </div>
                      {selectedPhoto.notes && (
                        <p className="text-white text-sm">
                          {selectedPhoto.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
                    {isVideo(uploadForm.file.name) ? (
                      <video
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                        controls
                        muted
                        loop
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    )}
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
