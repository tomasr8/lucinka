import { useState, useEffect, useCallback, useRef, forwardRef } from "react";
import {
  BookOpen,
  Calendar,
  Trash2,
  Upload,
  Save,
  X,
  Search,
  Image,
  Video,
  Mic,
  Plus,
  Pencil,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Header from "./Header";
import { useData } from "./util";

const MEDIA_ICONS = { photo: Image, video: Video, audio: Mic };

const DiaryCard = forwardRef(function DiaryCard(
  { entry, date, isToday, isAdmin, onRefresh },
  ref
) {
  const { t, i18n } = useTranslation();
  const [text, setText] = useState(entry?.text || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(!entry?.id);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setText(entry?.text || "");
  }, [entry?.text]);

  useEffect(() => {
    if (entry?.id) setIsEditing(false);
  }, [entry?.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, text }),
      });
      await onRefresh();
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      let entryId = entry?.id;
      if (!entryId) {
        const res = await fetch("/api/diary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, text }),
        });
        const data = await res.json();
        entryId = data.id;
      }
      const formData = new FormData();
      formData.append("file", file);
      await fetch(`/api/diary/${entryId}/media`, { method: "POST", body: formData });
      await onRefresh();
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    await fetch(`/api/diary/media/${mediaId}`, { method: "DELETE" });
    onRefresh();
  };

  const handleDeleteEntry = async () => {
    if (!entry?.id) return;
    await fetch(`/api/diary/${entry.id}`, { method: "DELETE" });
    setConfirmDelete(false);
    onRefresh();
  };

  const formattedDate = new Date(date + "T12:00:00").toLocaleDateString(
    i18n.language || "en",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <div
      ref={ref}
      className={`dark:bg-gray-800 bg-white rounded-2xl shadow-lg p-4 md:p-6 scroll-mt-4 ${
        isToday ? "border-2 border-purple-400 dark:border-purple-500" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar
            className={`w-5 h-5 flex-shrink-0 ${
              isToday ? "text-purple-500" : "text-gray-400 dark:text-gray-500"
            }`}
          />
          <div>
            <h3
              className={`font-bold text-base md:text-lg leading-tight ${
                isToday
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-gray-800 dark:text-white"
              }`}
            >
              {formattedDate}
            </h3>
            {isToday && (
              <span className="text-xs font-medium text-purple-500 dark:text-purple-400">
                {t("Today")}
              </span>
            )}
          </div>
        </div>

        {isAdmin && entry?.id && (
          confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">{t("Delete entry?")}</span>
              <button
                onClick={handleDeleteEntry}
                className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                {t("Yes")}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg"
              >
                {t("No")}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )
        )}
      </div>

      {/* Text */}
      {isAdmin && isEditing ? (
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={t("Write about today...")}
          rows={4}
          className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none transition-all"
        />
      ) : entry?.text ? (
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
          {entry.text}
        </p>
      ) : (
        <p className="text-gray-400 dark:text-gray-500 italic text-sm">{t("No notes for this day.")}</p>
      )}

      {/* Media grid */}
      {entry?.media?.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
          {entry.media.map(m => (
            <div key={m.id} className="relative group rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
              {m.media_type === "photo" && (
                <img
                  src={`/api/diary/media/${m.filename}`}
                  alt=""
                  className="w-full h-32 object-cover"
                />
              )}
              {m.media_type === "video" && (
                <video
                  src={`/api/diary/media/${m.filename}`}
                  className="w-full h-32 object-cover"
                  controls
                />
              )}
              {m.media_type === "audio" && (
                <div className="h-20 flex flex-col items-center justify-center gap-1 px-3">
                  <Mic className="w-5 h-5 text-purple-500" />
                  <audio
                    src={`/api/diary/media/${m.filename}`}
                    controls
                    className="w-full"
                    style={{ height: "32px" }}
                  />
                </div>
              )}
              {isAdmin && (
                <button
                  onClick={() => handleDeleteMedia(m.id)}
                  className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {isAdmin && isEditing && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? t("Saving...") : t("Save")}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            {uploading ? t("Uploading...") : t("Add Media")}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,audio/*,.heic,.heif"
            className="hidden"
            onChange={e => {
              if (e.target.files?.[0]) handleUpload(e.target.files[0]);
              e.target.value = "";
            }}
          />
        </div>
      )}
    </div>
  );
});

export default function DiaryPage() {
  const { t } = useTranslation();
  const {
    data: { user },
    loading,
  } = useData("user");
  const isAdmin = user?.is_admin;

  const [entries, setEntries] = useState([]);
  const [searchDate, setSearchDate] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [pendingDates, setPendingDates] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addDateInput, setAddDateInput] = useState("");
  const entryRefs = useRef({});

  const fetchEntries = useCallback(async () => {
    const res = await fetch("/api/diary");
    if (res.ok) {
      const data = await res.json();
      setEntries(data);
      // Remove pending dates that now exist in the DB
      const dbDates = new Set(data.map(e => e.date));
      setPendingDates(prev => prev.filter(d => !dbDates.has(d)));
    }
  }, []);

  useEffect(() => {
    if (!loading && isAdmin) fetchEntries();
  }, [loading, isAdmin, fetchEntries]);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayEntry = entries.find(e => e.date === todayStr);

  // Merge DB entries + pending dates (no duplicates, sorted desc)
  const allPastItems = [
    ...entries.filter(e => e.date !== todayStr).map(e => ({ date: e.date, entry: e })),
    ...pendingDates
      .filter(d => d !== todayStr && !entries.find(e => e.date === d))
      .map(d => ({ date: d, entry: null })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const handleSearch = e => {
    const dateStr = e.target.value;
    setSearchDate(dateStr);
    setNotFound(false);
    if (!dateStr) return;
    const el = entryRefs.current[dateStr];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      setNotFound(true);
    }
  };

  const handleAddDay = () => {
    if (!addDateInput) return;
    const dateStr = addDateInput;
    setAddDateInput("");
    setShowAddForm(false);
    if (dateStr === todayStr) {
      entryRefs.current[todayStr]?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    // Scroll to existing entry or create a new pending card
    if (entryRefs.current[dateStr]) {
      entryRefs.current[dateStr].scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      setPendingDates(prev => prev.includes(dateStr) ? prev : [...prev, dateStr]);
      setTimeout(() => {
        entryRefs.current[dateStr]?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto p-6">
          <Header isAdmin={isAdmin} />
          <p className="text-gray-500 dark:text-gray-400 text-center mt-12">{t("Loading data...")}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">{t("Access denied")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-6xl mx-auto p-6">
        <Header isAdmin={isAdmin} />

        {/* Page title */}
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-8 h-8 text-purple-500 flex-shrink-0" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {t("Diary")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("Daily notes about Lucinka")}</p>
          </div>
        </div>

        {/* Search + Add Day toolbar */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 dark:bg-gray-800 bg-white rounded-2xl shadow-lg p-4 flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              type="date"
              value={searchDate}
              onChange={handleSearch}
              className="flex-1 bg-transparent dark:text-gray-100 text-gray-800 focus:outline-none text-sm cursor-pointer"
            />
            {searchDate && (
              <button
                onClick={() => { setSearchDate(""); setNotFound(false); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg font-medium text-sm transition-colors ${
              showAddForm
                ? "bg-purple-500 text-white"
                : "dark:bg-gray-800 bg-white dark:text-gray-200 text-gray-700 hover:bg-purple-50 dark:hover:bg-gray-700"
            }`}
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">{t("Add Day")}</span>
          </button>
        </div>

        {/* Add day form */}
        {showAddForm && (
          <div className="dark:bg-gray-800 bg-white rounded-2xl shadow-lg p-4 mb-6 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-purple-500 flex-shrink-0" />
            <input
              type="date"
              value={addDateInput}
              onChange={e => setAddDateInput(e.target.value)}
              className="flex-1 bg-transparent dark:text-gray-100 text-gray-800 focus:outline-none text-sm cursor-pointer"
            />
            <button
              onClick={handleAddDay}
              disabled={!addDateInput}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {t("Open")}
            </button>
            <button
              onClick={() => { setShowAddForm(false); setAddDateInput(""); }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {notFound && searchDate && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mb-4 px-1">
            {t("No entry found for this date.")}
          </p>
        )}

        {/* Today */}
        <DiaryCard
          ref={el => { entryRefs.current[todayStr] = el; }}
          entry={todayEntry}
          date={todayStr}
          isToday={true}
          isAdmin={isAdmin}
          onRefresh={fetchEntries}
        />

        {/* Past entries (DB + pending) */}
        {allPastItems.length > 0 && (
          <div className="mt-6 space-y-6">
            {allPastItems.map(({ date, entry }) => (
              <DiaryCard
                key={date}
                ref={el => { entryRefs.current[date] = el; }}
                entry={entry}
                date={date}
                isToday={false}
                isAdmin={isAdmin}
                onRefresh={fetchEntries}
              />
            ))}
          </div>
        )}

        {entries.length === 0 && pendingDates.length === 0 && (
          <div className="mt-6 text-center py-12 dark:bg-gray-800 bg-white rounded-2xl shadow-lg">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">{t("No diary entries yet. Start writing today!")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
