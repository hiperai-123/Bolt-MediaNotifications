import { X, Send, Loader2, Search, AlertCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { Contact } from '../../lib/supabase';

type Props = {
  open: boolean;
  onClose: () => void;
  recipients: Contact[];
  onConfirm: () => Promise<void>;
  templateName: string;
  sending: boolean;
  error: string | null;
};

export function RecipientModal({
  open,
  onClose,
  recipients,
  onConfirm,
  templateName,
  sending,
  error,
}: Props) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return recipients;
    const q = search.toLowerCase();
    return recipients.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.building.toLowerCase().includes(q)
    );
  }, [recipients, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Contact[]>();
    filtered.forEach((r) => {
      if (!map.has(r.building)) map.set(r.building, []);
      map.get(r.building)!.push(r);
    });
    return Array.from(map.entries());
  }, [filtered]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Confirm Recipients</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Sending <span className="font-medium text-slate-700">{templateName}</span> to{' '}
              <span className="font-semibold text-brand-400">{recipients.length}</span> resident
              {recipients.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={sending}
            className="p-2 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or building..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-brand-200 focus:border-brand-300"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {grouped.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">No recipients match your search</p>
            </div>
          ) : (
            <div className="space-y-5">
              {grouped.map(([building, contacts]) => (
                <div key={building}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {building}
                    </h3>
                    <span className="text-xs text-slate-400">
                      {contacts.length} recipient{contacts.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
                    {contacts.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between px-3 py-2.5 hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-cyan-400 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {c.name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">
                              {c.name}
                            </div>
                            <div className="text-xs text-slate-500 truncate">{c.email}</div>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 flex-shrink-0 ml-3">
                          {c.number}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="mx-6 mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3 bg-slate-50 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={sending || recipients.length === 0}
            className="px-5 py-2 text-sm font-semibold text-white bg-brand-400 hover:bg-brand-500 rounded-lg transition flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Confirm & Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
