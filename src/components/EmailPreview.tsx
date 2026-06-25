import { Mail, Pencil, Type } from 'lucide-react';
import type { Template } from '../../lib/supabase';

type Props = {
  template: Template | null;
  recipientCount: number;
  htmlBody: string;
  subjectLine: string;
  onSubjectChange: (value: string) => void;
  onOpenEditor: () => void;
};

export function EmailPreview({ template, recipientCount, htmlBody, subjectLine, onSubjectChange, onOpenEditor }: Props) {

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Mail className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Email Preview</h2>
            <p className="text-xs text-slate-500">Live render of the outgoing message</p>
          </div>
        </div>
        <button
          onClick={onOpenEditor}
          className="flex items-center gap-2 px-3.5 py-2 bg-brand-400 hover:bg-brand-500 text-white text-sm font-semibold rounded-lg transition shadow-sm"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit Content
        </button>
      </div>

      <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/50">
        <label className="flex items-center gap-2">
          <Type className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-slate-500 flex-shrink-0">Subject</span>
          <input
            type="text"
            value={subjectLine}
            onChange={(e) => onSubjectChange(e.target.value)}
            placeholder="Email subject line..."
            className="flex-1 text-sm font-medium text-slate-900 bg-white border border-slate-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition placeholder:text-slate-400"
          />
        </label>
      </div>

      <div className="flex-1 bg-slate-100 p-4 sm:p-6 overflow-y-auto">
        <div
          className="mx-auto bg-white shadow-md rounded-md flex flex-col max-w-2xl"
          style={{ minHeight: '480px' }}
        >
          {/* Email header */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-md">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span className="font-medium">From: notifications@libertyharbor.com</span>
              <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="text-base font-semibold text-slate-900">
              {subjectLine || (template ? template.name : 'No template selected')}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              To: {recipientCount} resident{recipientCount === 1 ? '' : 's'}
            </div>
          </div>

          {/* Body content */}
          {htmlBody ? (
            <div className="flex-1">
              <div
                className="[&_img]:max-w-full [&_img]:h-auto"
                dangerouslySetInnerHTML={{ __html: htmlBody }}
              />
            </div>
          ) : (
            <>
              {template ? (
                <div className="px-6 pt-6 pb-3 text-center">
                  <h1 className="text-xl font-semibold text-brand-400">{template.name}</h1>
                </div>
              ) : null}
              {template ? (
                <div className="px-6 py-4">
                  <img src={template.image_url} alt={template.name} className="w-full rounded-md object-cover" style={{ maxHeight: '400px' }} />
                </div>
              ) : (
                <div className="bg-slate-50 flex items-center justify-center flex-1" style={{ minHeight: '220px' }}>
                  <div className="text-center text-slate-400">
                    <Mail className="w-10 h-10 mx-auto mb-2" strokeWidth={1.5} />
                    <p className="text-sm">Select a template to preview</p>
                  </div>
                </div>
              )}
              <div className="px-6 py-5 flex-1">
                <p className="text-base text-slate-600 leading-relaxed">
                  Click "Edit Email Content" to design the full message your residents will receive.
                </p>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="mt-auto border-t border-slate-200 bg-slate-50 px-6 py-5 rounded-b-md">
            <div className="text-center">
              <p className="text-xs text-slate-500 leading-relaxed">
                You received this email because you are a resident at a Liberty Harbor property.
              </p>
              <p className="text-xs text-slate-500 mt-2">
                <a href="#" className="text-brand-400 hover:underline font-medium">Unsubscribe</a>
                <span className="mx-2 text-slate-300">|</span>
                <a href="#" className="text-brand-400 hover:underline font-medium">Update preferences</a>
                <span className="mx-2 text-slate-300">|</span>
                <a href="#" className="text-brand-400 hover:underline font-medium">Contact</a>
              </p>
              <p className="text-[11px] text-slate-400 mt-2.5">
                Liberty Harbor Property Management, Jersey City, NJ
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
