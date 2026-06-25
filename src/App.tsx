import { useEffect, useMemo, useState } from 'react';
import { Anchor, Send, Loader2, Sparkles, Activity, Wifi, WifiOff } from 'lucide-react';
import { supabase, listFlyers, loadContacts, type Template, type Contact } from '../lib/supabase';
import { AudiencePanel } from './components/AudiencePanel';
import { TemplateGallery } from './components/TemplateGallery';
import { EmailPreview } from './components/EmailPreview';
import { RecipientModal } from './components/RecipientModal';
import { Toast, type ToastType } from './components/Toast';
import { EmailCanvasEditor, createDefaultBlocks, blocksToHtml, defaultCanvasSettings, type EmailBlock, type CanvasSettings } from './components/EmailCanvasEditor';
import { blocksToEmailHtml } from '../lib/wrapEmailHtml';

const MANAGED_BUILDINGS = [
  '10 Regent',
  'Brownstone Condominiums',
  '123 River St',
  '30 regent',
  '333 Grand St',
  '50 Regent',
  '88 Regent',
  '9 Regent',
  'TEST',
];

function App() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedBuildings, setSelectedBuildings] = useState<string[]>([]);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
  const [emailBlocks, setEmailBlocks] = useState<EmailBlock[]>([]);
  const [htmlBody, setHtmlBody] = useState<string>('');
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [canvasSettings, setCanvasSettings] = useState<CanvasSettings>(defaultCanvasSettings);
  const [subjectLine, setSubjectLine] = useState('');

  useEffect(() => {
    setEmailBlocks([]);
    setHtmlBody('');
    setSubjectLine(selectedTemplate?.name || '');
  }, [selectedTemplateId]);

  const refreshFlyers = async () => {
    try {
      const flyers = await listFlyers();
      setTemplates(flyers);
      if (flyers.length > 0 && !flyers.some((f) => f.id === selectedTemplateId)) {
        setSelectedTemplateId(flyers[0].id);
      } else if (flyers.length === 0) {
        setSelectedTemplateId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [flyers, allContacts] = await Promise.all([
          listFlyers(),
          loadContacts({ forceRefresh: true }),
        ]);
        if (!mounted) return;
        setTemplates(flyers);
        setContacts(allContacts);
        if (flyers.length > 0) setSelectedTemplateId(flyers[0].id);
        setConnectionError(null);
      } catch (e) {
        console.error(e);
        if (mounted) setConnectionError('Unable to connect to the contact directory. Please retry.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const buildingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    contacts.forEach((c) => {
      counts[c.building] = (counts[c.building] || 0) + 1;
    });
    return counts;
  }, [contacts]);

  const recipients = useMemo(() => {
    const set = new Set<string>();
    const result: Contact[] = [];
    contacts.forEach((c) => {
      if (MANAGED_BUILDINGS.includes(c.building) && selectedBuildings.includes(c.building)) {
        if (!set.has(c.id)) {
          set.add(c.id);
          result.push(c);
        }
      }
    });
    return result;
  }, [contacts, selectedBuildings]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) || null,
    [templates, selectedTemplateId]
  );

  const toggleBuilding = (building: string) => {
    setSelectedBuildings((prev) =>
      prev.includes(building) ? prev.filter((b) => b !== building) : [...prev, building]
    );
  };

  const handleConfirmSend = async () => {
    if (!selectedTemplate) return;
    setSending(true);
    setSendError(null);
    try {
      const sentAt = new Date().toISOString();
      const activeBlocks = emailBlocks.length > 0 ? emailBlocks : createDefaultBlocks(selectedTemplate.name);
      const emailReadyHtml = blocksToEmailHtml(activeBlocks, canvasSettings, selectedTemplate.image_url);
      const payload = {
        template: {
          id: selectedTemplate.id,
          name: selectedTemplate.name,
          description: selectedTemplate.description,
          category: selectedTemplate.category,
          image_url: selectedTemplate.image_url,
          storage_path: selectedTemplate.storage_path ?? null,
        },
        audience: {
          buildings: selectedBuildings,
          include_ten_regent: selectedBuildings.includes('10 Regent'),
        },
        recipients: recipients.map((r) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          building: r.building,
          number: r.number,
          is_static: r.is_static,
        })),
        content_html: emailReadyHtml,
        subject_line: subjectLine || selectedTemplate.name,
      };

      const dispatchUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dispatch-notification`;
      const webhookRes = await fetch(dispatchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(payload),
      });
      if (!webhookRes.ok) {
        let detail = '';
        try {
          const data = await webhookRes.json();
          detail = data?.error || data?.detail || '';
        } catch {
          // ignore
        }
        throw new Error(detail || `Dispatcher responded with ${webhookRes.status}`);
      }

      const { error } = await supabase.from('notifications').insert({
        template_id: null,
        template_name: selectedTemplate.name,
        template_image_url: selectedTemplate.image_url,
        buildings: selectedBuildings,
        include_ten_regent: selectedBuildings.includes('10 Regent'),
        recipient_count: recipients.length,
        status: 'sent',
        sent_at: sentAt,
      });
      if (error) throw error;

      setModalOpen(false);
      setToast({
        type: 'success',
        message: `Delivered "${selectedTemplate.name}" to ${recipients.length} resident${
          recipients.length === 1 ? '' : 's'
        }.`,
      });
    } catch (e) {
      console.error(e);
      setSendError(
        e instanceof Error
          ? `Failed to dispatch notification: ${e.message}`
          : 'Failed to dispatch notification. Check your connection and try again.'
      );
    } finally {
      setSending(false);
    }
  };

  const canSend = selectedTemplate && recipients.length > 0 && !connectionError;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-cyan-400 rounded-lg flex items-center justify-center shadow-sm">
              <Anchor className="w-5 h-5 text-white" strokeWidth={2.25} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Liberty Harbor
              </h1>
              <p className="text-xs text-slate-500 leading-tight">Resident Notification Center</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                connectionError
                  ? 'bg-red-50 text-red-700'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {connectionError ? (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  Offline
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  Yardi Synced
                </>
              )}
            </div>
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-700">
              <Activity className="w-3.5 h-3.5" />
              {contacts.length} residents
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {connectionError && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-red-900">Connection error</div>
              <div className="text-xs text-red-700">{connectionError}</div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-sm font-medium text-red-700 hover:text-red-900 underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              Compose Notification
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Select an audience, pick a template, and send announcements to residents.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-4 space-y-5">
            <AudiencePanel
              selectedBuildings={selectedBuildings}
              toggleBuilding={toggleBuilding}
              recipientCount={recipients.length}
              buildingCounts={buildingCounts}
            />
          </div>

          <div className="xl:col-span-4 space-y-5 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto xl:sticky xl:top-24 xl:self-start">
            <TemplateGallery
              templates={templates}
              selectedTemplateId={selectedTemplateId}
              onSelect={setSelectedTemplateId}
              loading={loading}
              onChanged={refreshFlyers}
            />
          </div>

          <div className="xl:col-span-4 xl:sticky xl:top-24 xl:self-start xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto">
            <EmailPreview
              template={selectedTemplate}
              recipientCount={recipients.length}
              htmlBody={htmlBody}
              subjectLine={subjectLine}
              onSubjectChange={setSubjectLine}
              onOpenEditor={() => {
                if (emailBlocks.length === 0) {
                  setEmailBlocks(createDefaultBlocks(selectedTemplate?.name));
                }
                setCanvasOpen(true);
              }}
            />
          </div>
        </div>
      </main>

      <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur border-t border-slate-200 shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.08)]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 text-sm">
            <div>
              <div className="text-xs text-slate-500">Recipients</div>
              <div className="font-semibold text-slate-900">
                {recipients.length} resident{recipients.length === 1 ? '' : 's'}
              </div>
            </div>
            <div className="hidden sm:block w-px h-8 bg-slate-200" />
            <div className="hidden sm:block">
              <div className="text-xs text-slate-500">Template</div>
              <div className="font-semibold text-slate-900 truncate max-w-[200px]">
                {selectedTemplate ? selectedTemplate.name : 'None selected'}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setSendError(null);
              setModalOpen(true);
            }}
            disabled={!canSend}
            className="px-6 py-2.5 bg-brand-400 hover:bg-brand-500 text-white text-sm font-semibold rounded-lg shadow-sm transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send Notification
          </button>
        </div>
      </div>

      <RecipientModal
        open={modalOpen}
        onClose={() => {
          if (!sending) setModalOpen(false);
        }}
        recipients={recipients}
        onConfirm={handleConfirmSend}
        templateName={selectedTemplate?.name || ''}
        sending={sending}
        error={sendError}
      />

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <EmailCanvasEditor
        open={canvasOpen}
        onClose={() => setCanvasOpen(false)}
        blocks={emailBlocks.length > 0 ? emailBlocks : createDefaultBlocks(selectedTemplate?.name)}
        onSave={(blocks, settings) => {
          setEmailBlocks(blocks);
          setCanvasSettings(settings);
          setHtmlBody(blocksToHtml(blocks, settings, selectedTemplate?.image_url));
        }}
        templateImageUrl={selectedTemplate?.image_url}
        canvasSettings={canvasSettings}
      />
    </div>
  );
}

export default App;
