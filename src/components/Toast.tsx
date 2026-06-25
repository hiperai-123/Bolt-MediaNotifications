import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useEffect } from 'react';

export type ToastType = 'success' | 'error';

type Props = {
  type: ToastType;
  message: string;
  onClose: () => void;
};

export function Toast({ type, message, onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [onClose]);

  const isSuccess = type === 'success';

  return (
    <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-top">
      <div
        className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border ${
          isSuccess
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-red-50 border-red-200 text-red-900'
        } max-w-sm`}
      >
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <div className="text-sm font-semibold">
            {isSuccess ? 'Notification sent' : 'Something went wrong'}
          </div>
          <div className="text-xs mt-0.5 leading-relaxed opacity-90">{message}</div>
        </div>
        <button onClick={onClose} className="flex-shrink-0 hover:opacity-70">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
