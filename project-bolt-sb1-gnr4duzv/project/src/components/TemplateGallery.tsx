import { Check, LayoutGrid, Image as ImageIcon, Upload, Loader2, Trash2, AlertCircle, Pencil, X } from 'lucide-react';
import { useRef, useState, type DragEvent } from 'react';
import { uploadFlyer, deleteFlyer, renameFlyer, type Template } from '../../lib/supabase';

type Props = {
  templates: Template[];
  selectedTemplateId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  onChanged: () => Promise<void> | void;
};

const categoryStyles: Record<string, string> = {
  newsletter: 'bg-brand-50 text-brand-600',
  event: 'bg-emerald-50 text-emerald-700',
  notice: 'bg-amber-50 text-amber-700',
  wellness: 'bg-teal-50 text-teal-700',
  dining: 'bg-orange-50 text-orange-700',
  general: 'bg-slate-100 text-slate-700',
};

export function TemplateGallery({
  templates,
  selectedTemplateId,
  onSelect,
  loading,
  onChanged,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [pendingFiles, setPendingFiles] = useState<{ file: File; name: string }[]>([]);

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => /^image\//.test(f.type));
    if (arr.length === 0) {
      setUploadError('Please select image files only.');
      return;
    }
    setUploadError(null);
    const pending = arr.map((f) => {
      const base = f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
      return { file: f, name: base };
    });
    setPendingFiles(pending);
  };

  const confirmUpload = async () => {
    setUploading(true);
    setProgress({ current: 0, total: pendingFiles.length });
    try {
      for (let i = 0; i < pendingFiles.length; i++) {
        const { file, name } = pendingFiles[i];
        await uploadFlyer(file, name.trim() || undefined);
        setProgress({ current: i + 1, total: pendingFiles.length });
      }
      await onChanged();
    } catch (e) {
      console.error(e);
      setUploadError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(false);
      setProgress({ current: 0, total: 0 });
      setPendingFiles([]);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (template: Template) => {
    if (!template.storage_path) return;
    if (!confirm(`Delete "${template.name}" from the flyer bank?`)) return;
    setDeletingPath(template.storage_path);
    try {
      await deleteFlyer(template.storage_path);
      await onChanged();
    } catch (e) {
      console.error(e);
      setUploadError(e instanceof Error ? e.message : 'Delete failed.');
    } finally {
      setDeletingPath(null);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    const count = selected.size;
    if (!confirm(`Delete ${count} selected flyer${count > 1 ? 's' : ''} from the bank?`)) return;
    setBulkDeleting(true);
    setUploadError(null);
    try {
      const paths = templates
        .filter((t) => selected.has(t.id) && t.storage_path)
        .map((t) => t.storage_path!);
      for (const path of paths) {
        await deleteFlyer(path);
      }
      setSelected(new Set());
      setEditMode(false);
      await onChanged();
    } catch (e) {
      console.error(e);
      setUploadError(e instanceof Error ? e.message : 'Bulk delete failed.');
    } finally {
      setBulkDeleting(false);
    }
  };

  const exitEditMode = () => {
    setEditMode(false);
    setSelected(new Set());
    setRenamingId(null);
  };

  const startRename = (template: Template) => {
    setRenamingId(template.id);
    setRenameValue(template.name);
  };

  const submitRename = async (template: Template) => {
    const trimmed = renameValue.trim();
    if (!trimmed || !template.storage_path) {
      setRenamingId(null);
      return;
    }
    try {
      await renameFlyer(template.storage_path, trimmed);
      await onChanged();
    } catch (e) {
      console.error(e);
      setUploadError(e instanceof Error ? e.message : 'Rename failed.');
    }
    setRenamingId(null);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 bg-emerald-50 rounded-lg flex-shrink-0">
            <LayoutGrid className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">Flyer Bank</h2>
            <p className="text-xs text-slate-500 truncate">
              {templates.length} flyer{templates.length === 1 ? '' : 's'} in bucket
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {editMode ? (
            <>
              <button
                onClick={handleBulkDelete}
                disabled={selected.size === 0 || bulkDeleting}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
              >
                {bulkDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Delete{selected.size > 0 ? ` (${selected.size})` : ''}
              </button>
              <button
                onClick={exitEditMode}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            </>
          ) : (
            <>
              {templates.length > 0 && (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
              )}
              <button
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-brand-400 hover:bg-brand-500 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition shadow-sm"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {progress.current}/{progress.total}
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                  </>
                )}
              </button>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {uploadError && (
        <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 flex-1">{uploadError}</p>
          <button
            onClick={() => setUploadError(null)}
            className="text-xs text-red-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`relative rounded-lg transition ${
          dragOver ? 'ring-2 ring-blue-400 ring-offset-2' : ''
        }`}
      >
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full text-center py-12 px-6 border-2 border-dashed border-slate-300 hover:border-brand-400 hover:bg-brand-50/30 rounded-lg transition group"
          >
            <ImageIcon className="w-10 h-10 mx-auto mb-3 text-slate-300 group-hover:text-blue-400 transition" />
            <p className="text-sm font-semibold text-slate-700">Drop flyers here</p>
            <p className="text-xs mt-1 text-slate-500">
              or click to upload PNG, JPG, WEBP, or GIF
            </p>
            <p className="text-[11px] mt-3 text-slate-400">
              Saved to the <code className="px-1 py-0.5 bg-slate-100 rounded">flyer-bank</code> Supabase bucket
            </p>
          </button>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {templates.map((template) => {
              const isSelected = selectedTemplateId === template.id;
              const isDeleting = deletingPath === template.storage_path;
              const isEditSelected = editMode && selected.has(template.id);
              return (
                <div
                  key={template.id}
                  onClick={editMode ? () => toggleSelect(template.id) : undefined}
                  className={`group relative rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    editMode
                      ? isEditSelected
                        ? 'border-red-400 ring-2 ring-red-100 shadow-md cursor-pointer'
                        : 'border-slate-200 hover:border-red-300 cursor-pointer'
                      : isSelected
                        ? 'border-brand-500 ring-2 ring-brand-100 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
                    <img
                      src={template.image_url}
                      alt={template.name}
                      className={`w-full h-full object-cover transition-transform duration-300 ${
                        editMode ? (isEditSelected ? 'opacity-75 scale-95' : '') : 'group-hover:scale-105'
                      }`}
                    />
                    {editMode && isEditSelected && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg">
                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                      </div>
                    )}
                    {editMode && !isEditSelected && (
                      <div className="absolute top-2 right-2 bg-white/80 border-2 border-slate-300 rounded-full w-6 h-6" />
                    )}
                    {!editMode && isSelected && (
                      <div className="absolute top-2 right-2 bg-brand-400 text-white rounded-full p-1.5 shadow-lg">
                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                      </div>
                    )}
                    <span
                      className={`absolute top-2 left-2 text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full ${
                        categoryStyles[template.category] || categoryStyles.general
                      }`}
                    >
                      {template.category}
                    </span>
                    {!editMode && (
                      <button
                        onClick={() => handleDelete(template)}
                        disabled={isDeleting}
                        className="absolute bottom-2 right-2 p-1.5 bg-white/90 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition disabled:opacity-100"
                        aria-label="Delete flyer"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                  <div className="p-3 bg-white">
                    {renamingId === template.id ? (
                      <form
                        onSubmit={(e) => { e.preventDefault(); submitRename(template); }}
                        className="flex items-center gap-1 mb-1"
                      >
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => submitRename(template)}
                          onKeyDown={(e) => { if (e.key === 'Escape') setRenamingId(null); }}
                          className="flex-1 text-sm font-semibold text-slate-900 bg-white border border-brand-300 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-brand-400 min-w-0"
                        />
                      </form>
                    ) : (
                      <h3
                        className="text-sm font-semibold text-slate-900 mb-1 truncate cursor-pointer hover:text-brand-500 transition flex items-center gap-1"
                        title="Click to rename"
                        onClick={(e) => { e.stopPropagation(); startRename(template); }}
                      >
                        <span className="truncate">{template.name}</span>
                        <Pencil className="w-3 h-3 flex-shrink-0 text-slate-400" />
                      </h3>
                    )}
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                      {template.description}
                    </p>
                    {!editMode && (
                      <button
                        onClick={() => onSelect(template.id)}
                        className={`w-full text-xs font-semibold py-2 rounded-md transition-all ${
                          isSelected
                            ? 'bg-brand-400 text-white hover:bg-brand-500'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {dragOver && templates.length > 0 && (
          <div className="absolute inset-0 bg-brand-50/90 border-2 border-dashed border-brand-400 rounded-lg flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <Upload className="w-10 h-10 mx-auto mb-2 text-brand-400" />
              <p className="text-sm font-semibold text-brand-900">Drop to upload</p>
            </div>
          </div>
        )}
      </div>

      {pendingFiles.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">Name Your Flyers</h3>
              <p className="text-xs text-slate-500 mt-0.5">Set the poster title for each flyer before uploading.</p>
            </div>
            <div className="px-6 py-4 space-y-3 max-h-80 overflow-y-auto">
              {pendingFiles.map((pf, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <img
                    src={URL.createObjectURL(pf.file)}
                    alt=""
                    className="w-12 h-12 object-cover rounded-md border border-slate-200 flex-shrink-0"
                  />
                  <input
                    value={pf.name}
                    onChange={(e) => {
                      setPendingFiles((prev) =>
                        prev.map((item, i) => i === idx ? { ...item, name: e.target.value } : item)
                      );
                    }}
                    placeholder="e.g. Paint and Sip"
                    className="flex-1 text-sm font-medium text-slate-900 bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition placeholder:text-slate-400"
                  />
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => { setPendingFiles([]); if (inputRef.current) inputRef.current.value = ''; }}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpload}
                disabled={uploading}
                className="px-4 py-2 text-sm font-semibold text-white bg-brand-400 hover:bg-brand-500 rounded-lg transition shadow-sm disabled:opacity-60 flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading {progress.current}/{progress.total}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload {pendingFiles.length} Flyer{pendingFiles.length > 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
