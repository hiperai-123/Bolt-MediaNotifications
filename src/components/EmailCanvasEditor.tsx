import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Plus, Type, Image, MousePointerClick, Minus, MoveVertical,
  Trash2, ChevronUp, ChevronDown, AlignLeft, AlignCenter, AlignRight,
  ArrowLeft, Upload, FolderOpen, GripVertical,
  Layers, Settings, PaintBucket, Link as LinkIcon, Undo2, Redo2,
} from 'lucide-react';
import { uploadGraphic, listGraphics, deleteGraphic, type UserGraphic } from '../../lib/supabase';

// ─── Block Types ───────────────────────────────────────────────────────────────

export type EmailBlock =
  | { id: string; type: 'text'; content: string; styles: TextStyles; blockBg?: string }
  | { id: string; type: 'title'; content: string; styles: TextStyles; blockBg?: string }
  | { id: string; type: 'image'; src: string; alt: string; styles: ImageStyles; blockBg?: string }
  | { id: string; type: 'button'; label: string; url: string; styles: ButtonStyles; blockBg?: string }
  | { id: string; type: 'divider'; styles: DividerStyles; blockBg?: string }
  | { id: string; type: 'spacer'; height: number; blockBg?: string }
  | { id: string; type: 'social'; links: SocialLink[]; styles: SocialStyles; blockBg?: string }
  | { id: string; type: 'flyer'; blockBg?: string }
  | { id: string; type: 'link'; label: string; url: string; styles: LinkStyles; blockBg?: string };

type SocialLink = {
  platform: string;
  url: string;
  iconUrl: string;
};

type SocialStyles = {
  iconSize: number;
  gap: number;
  align: 'left' | 'center' | 'right';
  labelColor: string;
  labelSize: number;
  showLabel: boolean;
};

type TextStyles = {
  fontFamily: string;
  fontWeight: string;
  fontSize: number;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
};

type ImageStyles = {
  maxWidth: string;
  borderRadius: number;
};

type ButtonStyles = {
  bgColor: string;
  textColor: string;
  borderRadius: number;
  fontSize: number;
  paddingX: number;
  paddingY: number;
  align: 'left' | 'center' | 'right';
};

type DividerStyles = {
  color: string;
  thickness: number;
  width: string;
};

type LinkStyles = {
  color: string;
  fontSize: number;
  fontWeight: string;
  textAlign: 'left' | 'center' | 'right';
};

export type CanvasSettings = {
  bgColor: string;
  bgImage: string;
  bgType: 'solid' | 'gradient' | 'image';
  bgGradient: string;
  showFlyer: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  blocks: EmailBlock[];
  onSave: (blocks: EmailBlock[], settings: CanvasSettings) => void;
  templateImageUrl?: string;
  canvasSettings: CanvasSettings;
};

let blockIdCounter = 0;
function genId() {
  return `block_${Date.now()}_${blockIdCounter++}`;
}

export function createDefaultBlocks(templateName?: string): EmailBlock[] {
  const blocks: EmailBlock[] = [];

  // Title at very top
  blocks.push({
    id: genId(),
    type: 'title',
    content: templateName || 'Email Title',
    styles: { fontFamily: 'sans-serif', fontWeight: '700', fontSize: 22, color: '#3aaee0', textAlign: 'center', lineHeight: 1.3 },
  });

  blocks.push({ id: genId(), type: 'spacer', height: 12 });

  // Flyer below title
  blocks.push({ id: genId(), type: 'flyer' });

  blocks.push({ id: genId(), type: 'spacer', height: 16 });

  // CTA button below flyer
  blocks.push({
    id: genId(),
    type: 'button',
    label: 'Learn More',
    url: 'https://www.libertyharbor.com',
    styles: { bgColor: '#1e457f', textColor: '#ffffff', borderRadius: 6, fontSize: 14, paddingX: 28, paddingY: 12, align: 'center' },
  });

  blocks.push({ id: genId(), type: 'spacer', height: 24 });

  // Liberty Harbor Events logo image
  blocks.push({
    id: genId(),
    type: 'image',
    src: 'https://ci3.googleusercontent.com/meips/ADKq_Nbh0scve2cZRUusXtQjOQaWv4ZYTcEZBJnNjwoluN2y6bJKSHTUkyivY6DWHPt5AMrFJIG4CQmXXbJ1pvqgM-SC2sS1Zhlpp06s0OZTCcw4WctNxU0_CxK-uTZCbsA8F32zN44hduwuh_TZZzUjBquGMw=s0-d-e1-ft#https://livlycontent.azureedge.net/client-images/54/fbf13078-2558-457a-949e-90c67e91da86.jpg',
    alt: 'Liberty Harbor Events',
    styles: { maxWidth: '80%', borderRadius: 0 },
  });

  blocks.push({ id: genId(), type: 'spacer', height: 16, blockBg: '#f1f5f9' });

  // FOLLOW US
  blocks.push({
    id: genId(),
    type: 'text',
    content: 'FOLLOW US',
    styles: { fontFamily: 'sans-serif', fontWeight: '300', fontSize: 14, color: '#1e293b', textAlign: 'center', lineHeight: 1.4 },
    blockBg: '#f1f5f9',
  });

  blocks.push({ id: genId(), type: 'spacer', height: 12, blockBg: '#f1f5f9' });

  blocks.push({
    id: genId(),
    type: 'social',
    links: [
      { platform: 'Facebook', url: 'https://www.facebook.com/libertyharborapts', iconUrl: 'https://cdn-icons-png.flaticon.com/512/733/733547.png' },
      { platform: 'Instagram', url: 'https://www.instagram.com/libertyharbor', iconUrl: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png' },
    ],
    styles: { iconSize: 36, gap: 16, align: 'center', labelColor: '#64748b', labelSize: 11, showLabel: false },
    blockBg: '#f1f5f9',
  });

  blocks.push({ id: genId(), type: 'spacer', height: 16, blockBg: '#f1f5f9' });

  blocks.push({
    id: genId(),
    type: 'divider',
    styles: { color: '#d1d5db', thickness: 1, width: '100%' },
    blockBg: '#f1f5f9',
  });

  blocks.push({ id: genId(), type: 'spacer', height: 16, blockBg: '#f1f5f9' });

  blocks.push({
    id: genId(),
    type: 'link',
    label: 'www.libertyharbor.com',
    url: 'https://www.libertyharbor.com',
    styles: { color: '#3b82f6', fontSize: 13, fontWeight: '400', textAlign: 'center' },
    blockBg: '#f1f5f9',
  });

  blocks.push({ id: genId(), type: 'spacer', height: 20, blockBg: '#f1f5f9' });

  blocks.push({
    id: genId(),
    type: 'text',
    content: 'If you unsubscribe from this email, you will also unsubscribe from ALL Livly\ncommunications & rent information.',
    styles: { fontFamily: 'sans-serif', fontWeight: '400', fontSize: 13, color: '#ef4444', textAlign: 'center', lineHeight: 1.6 },
    blockBg: '#f1f5f9',
  });

  blocks.push({ id: genId(), type: 'spacer', height: 20, blockBg: '#f1f5f9' });

  return blocks;
}

export const defaultCanvasSettings: CanvasSettings = {
  bgColor: '#ffffff',
  bgImage: '',
  bgType: 'solid',
  bgGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  showFlyer: true,
};

export function blocksToHtml(blocks: EmailBlock[], settings: CanvasSettings, templateImageUrl?: string): string {
  const parts: string[] = [];

  const bgStyle = settings.bgType === 'solid'
    ? `background-color:${settings.bgColor};`
    : settings.bgType === 'gradient'
      ? `background:${settings.bgGradient};`
      : `background-image:url('${settings.bgImage}');background-size:cover;background-position:center;`;

  parts.push(`<div style="max-width:620px;margin:0 auto;${bgStyle}padding:0 24px;">`);

  blocks.forEach((block) => {
    const wrapBg = block.blockBg ? `background-color:${block.blockBg};padding:12px 20px;` : '';
    switch (block.type) {
      case 'flyer':
        if (templateImageUrl) {
          parts.push(`<div style="text-align:center;${wrapBg}"><img src="${escapeAttr(templateImageUrl)}" alt="Flyer" style="max-width:100%;border-radius:8px;" /></div>`);
        }
        break;
      case 'title':
        parts.push(`<div style="font-family:${block.styles.fontFamily};font-weight:${block.styles.fontWeight};font-size:${block.styles.fontSize}px;color:${block.styles.color};text-align:${block.styles.textAlign};line-height:${block.styles.lineHeight};white-space:pre-wrap;${wrapBg}">${escapeHtml(block.content)}</div>`);
        break;
      case 'text':
        parts.push(`<div style="font-family:${block.styles.fontFamily};font-weight:${block.styles.fontWeight};font-size:${block.styles.fontSize}px;color:${block.styles.color};text-align:${block.styles.textAlign};line-height:${block.styles.lineHeight};white-space:pre-wrap;${wrapBg}">${escapeHtml(block.content)}</div>`);
        break;
      case 'image':
        if (block.src) parts.push(`<div style="text-align:center;${wrapBg}"><img src="${escapeAttr(block.src)}" alt="${escapeAttr(block.alt)}" style="max-width:${block.styles.maxWidth};border-radius:${block.styles.borderRadius}px;display:inline-block;" /></div>`);
        break;
      case 'button':
        parts.push(`<div style="text-align:${block.styles.align};${wrapBg}"><a href="${escapeAttr(block.url)}" style="display:inline-block;background-color:${block.styles.bgColor};color:${block.styles.textColor};padding:${block.styles.paddingY}px ${block.styles.paddingX}px;border-radius:${block.styles.borderRadius}px;font-size:${block.styles.fontSize}px;text-decoration:none;font-weight:600;">${escapeHtml(block.label)}</a></div>`);
        break;
      case 'divider':
        parts.push(`<hr style="border:none;border-top:${block.styles.thickness}px solid ${block.styles.color};width:${block.styles.width};margin:0;${wrapBg ? `padding:8px;${wrapBg}` : ''}" />`);
        break;
      case 'spacer':
        parts.push(`<div style="height:${block.height}px;${wrapBg}"></div>`);
        break;
      case 'social':
        parts.push(`<div style="text-align:${block.styles.align};${wrapBg}">`);
        if (block.styles.showLabel) {
          parts.push(`<div style="font-size:${block.styles.labelSize}px;color:${block.styles.labelColor};margin-bottom:8px;font-weight:600;">FOLLOW US</div>`);
        }
        block.links.forEach((link, i) => {
          const marginRight = i < block.links.length - 1 ? `margin-right:${block.styles.gap}px;` : '';
          parts.push(`<a href="${escapeAttr(link.url)}" style="display:inline-block;${marginRight}"><img src="${escapeAttr(link.iconUrl)}" alt="${escapeAttr(link.platform)}" style="width:${block.styles.iconSize}px;height:${block.styles.iconSize}px;border-radius:50%;" /></a>`);
        });
        parts.push('</div>');
        break;
      case 'link':
        parts.push(`<div style="text-align:${block.styles.textAlign};${wrapBg}"><a href="${escapeAttr(block.url)}" style="color:${block.styles.color};font-size:${block.styles.fontSize}px;font-weight:${block.styles.fontWeight};font-family:sans-serif;text-decoration:underline;">${escapeHtml(block.label)}</a></div>`);
        break;
    }
  });

  parts.push('</div>');
  return parts.join('\n');
}

function escapeHtml(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
}
function escapeAttr(str: string) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Preset Colors ─────────────────────────────────────────────────────────────

const PRESET_BG_COLORS = ['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#1e293b', '#0f172a', '#1e40af', '#059669', '#dc2626', '#ea580c', '#0891b2', '#4338ca'];
const PRESET_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(180deg, #1e3a5f 0%, #0f172a 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
];

const FONT_OPTIONS = ['sans-serif', 'serif', 'monospace', 'Georgia', 'Arial', 'Verdana', 'Trebuchet MS', 'Helvetica'];
const WEIGHT_OPTIONS = ['300', '400', '500', '600', '700', '800'];

// ─── Sidebar Tabs ──────────────────────────────────────────────────────────────

type SidebarTab = 'content' | 'design' | 'graphics' | 'add';

// ─── Main Component ────────────────────────────────────────────────────────────

export function EmailCanvasEditor({ open, onClose, blocks: initialBlocks, onSave, templateImageUrl, canvasSettings: initialSettings }: Props) {
  const [blocks, setBlocksRaw] = useState<EmailBlock[]>(initialBlocks);
  const [settings, setSettings] = useState<CanvasSettings>(initialSettings);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [multiSelectedIds, setMultiSelectedIds] = useState<Set<string>>(new Set());
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('content');
  const [graphics, setGraphics] = useState<UserGraphic[]>([]);
  const [graphicsLoading, setGraphicsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const graphicFileInputRef = useRef<HTMLInputElement>(null);

  // ── History ──
  const historyRef = useRef<EmailBlock[][]>([initialBlocks]);
  const historyPosRef = useRef(0);
  const [, setHistoryTick] = useState(0);

  const setBlocks = useCallback((updater: EmailBlock[] | ((prev: EmailBlock[]) => EmailBlock[]), skipHistory = false) => {
    setBlocksRaw((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (!skipHistory) {
        historyRef.current = historyRef.current.slice(0, historyPosRef.current + 1);
        historyRef.current.push(next);
        historyPosRef.current = historyRef.current.length - 1;
        setHistoryTick((t) => t + 1);
      }
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    if (historyPosRef.current <= 0) return;
    historyPosRef.current -= 1;
    setBlocksRaw(historyRef.current[historyPosRef.current]);
    setHistoryTick((t) => t + 1);
  }, []);

  const redo = useCallback(() => {
    if (historyPosRef.current >= historyRef.current.length - 1) return;
    historyPosRef.current += 1;
    setBlocksRaw(historyRef.current[historyPosRef.current]);
    setHistoryTick((t) => t + 1);
  }, []);

  const canUndo = historyPosRef.current > 0;
  const canRedo = historyPosRef.current < historyRef.current.length - 1;

  // Deselect when clicking canvas background (not on a block)
  function handleCanvasMouseDown(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      setSelectedId(null);
      setMultiSelectedIds(new Set());
      setInsertIndex(null);
    }
  }

  useEffect(() => {
    if (open) {
      setBlocksRaw(initialBlocks);
      setSettings(initialSettings);
      historyRef.current = [initialBlocks];
      historyPosRef.current = 0;
      loadGraphicsLibrary();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      // Don't intercept when focus is in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.key === 'z' && e.shiftKey) || e.key === 'y') { e.preventDefault(); redo(); }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, undo, redo]);

  async function loadGraphicsLibrary() {
    setGraphicsLoading(true);
    try {
      const data = await listGraphics();
      setGraphics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setGraphicsLoading(false);
    }
  }

  if (!open) return null;

  const selectedBlock = blocks.find((b) => b.id === selectedId) || null;

  function updateBlock(id: string, patch: Partial<EmailBlock>) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } as EmailBlock : b)));
  }

  function updateBlockStyles(id: string, styles: Record<string, unknown>) {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        if ('styles' in b) {
          return { ...b, styles: { ...(b.styles as Record<string, unknown>), ...styles } } as EmailBlock;
        }
        return b;
      })
    );
  }

  function deleteBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function moveBlock(id: string, direction: -1 | 1) {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  }

  function addBlock(type: EmailBlock['type'], atIndex?: number) {
    let newBlock: EmailBlock;
    switch (type) {
      case 'title':
        newBlock = { id: genId(), type: 'title', content: 'Section Title', styles: { fontFamily: 'sans-serif', fontWeight: '700', fontSize: 22, color: '#3aaee0', textAlign: 'center', lineHeight: 1.3 } };
        break;
      case 'text':
        newBlock = { id: genId(), type: 'text', content: 'New text block', styles: { fontFamily: 'sans-serif', fontWeight: '400', fontSize: 14, color: '#334155', textAlign: 'left', lineHeight: 1.6 } };
        break;
      case 'image':
        newBlock = { id: genId(), type: 'image', src: '', alt: 'Image', styles: { maxWidth: '100%', borderRadius: 0 } };
        break;
      case 'button':
        newBlock = { id: genId(), type: 'button', label: 'Click Here', url: '#', styles: { bgColor: '#3aaee0', textColor: '#ffffff', borderRadius: 6, fontSize: 14, paddingX: 28, paddingY: 12, align: 'center' } };
        break;
      case 'divider':
        newBlock = { id: genId(), type: 'divider', styles: { color: '#e2e8f0', thickness: 1, width: '100%' } };
        break;
      case 'spacer':
        newBlock = { id: genId(), type: 'spacer', height: 24 };
        break;
      case 'social':
        newBlock = { id: genId(), type: 'social', links: [
          { platform: 'Facebook', url: 'https://www.facebook.com/libertyharborapts', iconUrl: 'https://cdn-icons-png.flaticon.com/512/733/733547.png' },
          { platform: 'Instagram', url: 'https://www.instagram.com/libertyharbor', iconUrl: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png' },
        ], styles: { iconSize: 36, gap: 16, align: 'center', labelColor: '#64748b', labelSize: 11, showLabel: false } };
        break;
      case 'flyer':
        newBlock = { id: genId(), type: 'flyer' };
        break;
      case 'link':
        newBlock = { id: genId(), type: 'link', label: 'www.libertyharbor.com', url: 'https://www.libertyharbor.com', styles: { color: '#3b82f6', fontSize: 13, fontWeight: '400', textAlign: 'center' } };
        break;
    }
    if (atIndex !== undefined) {
      setBlocks((prev) => [...prev.slice(0, atIndex), newBlock, ...prev.slice(atIndex)]);
    } else {
      setBlocks((prev) => [...prev, newBlock]);
    }
    setSelectedId(newBlock.id);
    setInsertIndex(null);
    setSidebarTab('content');
  }

  function handleDragStart(idx: number) {
    setDragIdx(idx);
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null) return;
    setDragOverIdx(idx);
  }

  function handleDrop(idx: number) {
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    setBlocks((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(dragIdx, 1);
      copy.splice(idx > dragIdx ? idx - 1 : idx, 0, moved);
      return copy;
    });
    setDragIdx(null);
    setDragOverIdx(null);
  }

  function handleDragEnd() {
    setDragIdx(null);
    setDragOverIdx(null);
  }

  function insertGraphicAsBlock(graphic: UserGraphic) {
    const newBlock: EmailBlock = { id: genId(), type: 'image', src: graphic.url, alt: graphic.name, styles: { maxWidth: '100%', borderRadius: 0 } };
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedId(newBlock.id);
    setSidebarTab('content');
  }

  async function handleGraphicUpload(file: File) {
    setUploading(true);
    try {
      const graphic = await uploadGraphic(file);
      setGraphics((prev) => [graphic, ...prev]);
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteGraphic(graphic: UserGraphic) {
    try {
      await deleteGraphic(graphic);
      setGraphics((prev) => prev.filter((g) => g.id !== graphic.id));
    } catch (e) {
      console.error(e);
    }
  }

  function handleImageUploadForBlock(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (selectedBlock && selectedBlock.type === 'image') {
        updateBlock(selectedBlock.id, { src: dataUrl });
      }
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    onSave(blocks, settings);
    onClose();
  }

  const canvasBgStyle: React.CSSProperties = settings.bgType === 'solid'
    ? { backgroundColor: settings.bgColor }
    : settings.bgType === 'gradient'
      ? { background: settings.bgGradient }
      : { backgroundImage: `url('${settings.bgImage}')`, backgroundSize: 'cover', backgroundPosition: 'center' };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/70 backdrop-blur-sm">
      {/* Top toolbar */}
      <div className="h-14 bg-white border-b border-slate-200 relative flex items-center justify-between px-5 shrink-0 z-10">
        <button onClick={onClose} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Compose
        </button>
        <h2 className="absolute left-1/2 -translate-x-1/2 text-sm font-bold text-slate-900">Content Editor</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Cmd+Z)"
            className="p-2 rounded-lg transition text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Cmd+Shift+Z)"
            className="p-2 rounded-lg transition text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg transition">
            Discard
          </button>
          <button onClick={handleSave} className="px-5 py-2 bg-brand-400 hover:bg-brand-500 text-white text-sm font-semibold rounded-lg transition shadow-sm">
            Save Design
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main canvas area */}
        <div
          className="flex-1 overflow-y-auto bg-slate-200 p-8"
          onMouseDown={handleCanvasMouseDown}
        >
          <div
            className="max-w-[620px] mx-auto shadow-xl pt-4"
            style={canvasBgStyle}
          >
            {/* Insert at very top */}
            <InsertButton
              active={insertIndex === 0}
              onClick={() => setInsertIndex(insertIndex === 0 ? null : 0)}
              onAdd={(type) => addBlock(type, 0)}
            />

            {/* Blocks with drag & drop */}
            <div>
              {blocks.map((block, idx) => (
                <div key={block.id}>
                  {/* Drop zone above this block */}
                  {dragIdx !== null && dragIdx !== idx && dragOverIdx === idx && (
                    <div className="h-1 bg-brand-400 rounded-full mx-4 my-1 transition-all" />
                  )}
                  <div
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={() => handleDrop(idx)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      if (e.shiftKey) {
                        setMultiSelectedIds((prev) => {
                          const next = new Set(prev);
                          // Include current single-selected block in multi-set
                          if (selectedId && !next.has(selectedId)) next.add(selectedId);
                          if (next.has(block.id)) next.delete(block.id);
                          else next.add(block.id);
                          return next;
                        });
                        setSelectedId(null);
                        setSidebarTab('content');
                      } else {
                        setSelectedId(block.id);
                        setMultiSelectedIds(new Set());
                        setSidebarTab('content');
                      }
                    }}
                    className={`relative group cursor-pointer transition-colors ${
                      selectedId === block.id
                        ? 'outline outline-2 outline-brand-400 z-[5]'
                        : multiSelectedIds.has(block.id)
                          ? 'outline outline-2 outline-brand-300 bg-brand-50/30'
                          : 'hover:outline hover:outline-1 hover:outline-brand-200'
                    } ${dragIdx === idx ? 'opacity-40' : ''}`}
                  >
                    {/* Drag handle — only this initiates drag */}
                    <div
                      draggable
                      onDragStart={(e) => { e.stopPropagation(); handleDragStart(idx); }}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 opacity-0 group-hover:opacity-100 transition cursor-grab active:cursor-grabbing"
                    >
                      <GripVertical className="w-4 h-4 text-slate-400" />
                    </div>
                    <BlockRenderer block={block} templateImageUrl={templateImageUrl} />
                    {selectedId === block.id && (
                      <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-white/95 shadow-lg rounded-md border border-slate-200 px-1 py-0.5 z-10">
                        <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, -1); }} className="p-1 hover:bg-slate-100 rounded" title="Move up"><ChevronUp className="w-3.5 h-3.5 text-slate-600" /></button>
                        <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 1); }} className="p-1 hover:bg-slate-100 rounded" title="Move down"><ChevronDown className="w-3.5 h-3.5 text-slate-600" /></button>
                        {block.type !== 'flyer' && (
                          <button onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }} className="p-1 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Inline insert between blocks */}
                  {selectedId === block.id && idx < blocks.length - 1 && (
                    <InsertButton
                      active={insertIndex === idx + 1}
                      onClick={() => setInsertIndex(insertIndex === idx + 1 ? null : idx + 1)}
                      onAdd={(type) => addBlock(type, idx + 1)}
                    />
                  )}
                </div>
              ))}
              {/* Drop at end */}
              {dragIdx !== null && (
                <div
                  onDragOver={(e) => handleDragOver(e, blocks.length)}
                  onDrop={() => handleDrop(blocks.length)}
                  className="h-8"
                />
              )}
              {blocks.length === 0 && (
                <div className="py-16 text-center text-slate-400 bg-white/50 rounded-lg border-2 border-dashed border-slate-300 mx-4 my-4">
                  <Plus className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">Use the Add tab on the right to add content</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar - tabbed */}
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col overflow-hidden shrink-0">
          {/* Tab navigation */}
          <div className="flex border-b border-slate-200 shrink-0">
            <TabButton active={sidebarTab === 'add'} onClick={() => setSidebarTab('add')} icon={<Plus className="w-4 h-4" />} label="Add" />
            <TabButton active={sidebarTab === 'content'} onClick={() => setSidebarTab('content')} icon={<Layers className="w-4 h-4" />} label="Properties" />
            <TabButton active={sidebarTab === 'design'} onClick={() => setSidebarTab('design')} icon={<PaintBucket className="w-4 h-4" />} label="Design" />
            <TabButton active={sidebarTab === 'graphics'} onClick={() => setSidebarTab('graphics')} icon={<FolderOpen className="w-4 h-4" />} label="Graphics" />
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Add Content tab */}
            {sidebarTab === 'add' && (
              <div className="p-3 space-y-1">
                <AddBtn icon={<span className="text-brand-400 font-bold text-base leading-none">T</span>} label="Title" onClick={() => addBlock('title')} />
                <AddBtn icon={<Type className="w-4 h-4" />} label="Text" onClick={() => addBlock('text')} />
                <AddBtn icon={<Image className="w-4 h-4" />} label="Image" onClick={() => addBlock('image')} />
                <AddBtn icon={<MousePointerClick className="w-4 h-4" />} label="Button" onClick={() => addBlock('button')} />
                <AddBtn icon={<Minus className="w-4 h-4" />} label="Divider" onClick={() => addBlock('divider')} />
                <AddBtn icon={<MoveVertical className="w-4 h-4" />} label="Spacer" onClick={() => addBlock('spacer')} />
                <AddBtn icon={<FolderOpen className="w-4 h-4" />} label="Graphics Library" onClick={() => setSidebarTab('graphics')} />
                <AddBtn icon={<LinkIcon className="w-4 h-4" />} label="Link" onClick={() => addBlock('link')} />
              </div>
            )}
            {sidebarTab === 'content' && (
              <div className="p-4">
                {multiSelectedIds.size > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                      <div className="p-1.5 bg-brand-50 rounded">
                        <PaintBucket className="w-3.5 h-3.5 text-brand-400" />
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{multiSelectedIds.size} Blocks Selected</span>
                    </div>
                    <p className="text-xs text-slate-500">Apply a background color to all selected blocks at once.</p>
                    <MultiBlockBgEditor
                      blockIds={multiSelectedIds}
                      blocks={blocks}
                      onUpdate={(bgColor) => {
                        setBlocks((prev) =>
                          prev.map((b) =>
                            multiSelectedIds.has(b.id) ? { ...b, blockBg: bgColor } as EmailBlock : b
                          )
                        );
                      }}
                    />
                  </div>
                ) : selectedBlock ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                      <div className="p-1.5 bg-brand-50 rounded">
                        <Settings className="w-3.5 h-3.5 text-brand-400" />
                      </div>
                      <span className="text-sm font-semibold text-slate-800 capitalize">{selectedBlock.type} Block</span>
                    </div>
                    {(selectedBlock.type === 'text' || selectedBlock.type === 'title') && <TextBlockEditor block={selectedBlock as Extract<EmailBlock, { type: 'text' }>} onUpdate={(patch) => updateBlock(selectedBlock.id, patch)} onUpdateStyles={(styles) => updateBlockStyles(selectedBlock.id, styles)} />}
                    {selectedBlock.type === 'image' && <ImageBlockEditor block={selectedBlock} onUpdate={(patch) => updateBlock(selectedBlock.id, patch)} onUpdateStyles={(styles) => updateBlockStyles(selectedBlock.id, styles)} onUpload={() => fileInputRef.current?.click()} graphics={graphics} onUseGraphic={(g) => updateBlock(selectedBlock.id, { src: g.url, alt: g.name })} />}
                    {selectedBlock.type === 'button' && <ButtonBlockEditor block={selectedBlock} onUpdate={(patch) => updateBlock(selectedBlock.id, patch)} onUpdateStyles={(styles) => updateBlockStyles(selectedBlock.id, styles)} />}
                    {selectedBlock.type === 'divider' && <DividerBlockEditor block={selectedBlock} onUpdateStyles={(styles) => updateBlockStyles(selectedBlock.id, styles)} />}
                    {selectedBlock.type === 'spacer' && <SpacerBlockEditor block={selectedBlock} onUpdate={(patch) => updateBlock(selectedBlock.id, patch)} />}
                    {selectedBlock.type === 'social' && <SocialBlockEditor block={selectedBlock} onUpdate={(patch) => updateBlock(selectedBlock.id, patch)} onUpdateStyles={(styles) => updateBlockStyles(selectedBlock.id, styles)} />}
                    {selectedBlock.type === 'link' && <LinkBlockEditor block={selectedBlock} onUpdate={(patch) => updateBlock(selectedBlock.id, patch)} onUpdateStyles={(styles) => updateBlockStyles(selectedBlock.id, styles)} />}
                    {selectedBlock.type === 'flyer' && (
                      <div className="text-sm text-slate-500 leading-relaxed">
                        The flyer block displays your selected template image. Drag it to reorder its position relative to other blocks.
                      </div>
                    )}
                    {/* Block Background Color */}
                    <BlockBgEditor block={selectedBlock} onUpdate={(patch) => updateBlock(selectedBlock.id, patch)} />
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Layers className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Select a block to edit its properties</p>
                  </div>
                )}
              </div>
            )}

            {/* Design tab */}
            {sidebarTab === 'design' && (
              <div className="p-4 space-y-5">
                <div>
                  <SectionLabel>Background Type</SectionLabel>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(['solid', 'gradient', 'image'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setSettings((s) => ({ ...s, bgType: t }))}
                        className={`px-3 py-2 text-xs font-medium rounded-lg border transition capitalize ${
                          settings.bgType === t ? 'bg-brand-50 border-brand-300 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {settings.bgType === 'solid' && (
                  <div>
                    <SectionLabel>Background Color</SectionLabel>
                    <div className="mt-2 grid grid-cols-6 gap-2">
                      {PRESET_BG_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setSettings((s) => ({ ...s, bgColor: c }))}
                          className={`w-9 h-9 rounded-lg border-2 transition ${settings.bgColor === c ? 'border-brand-500 scale-110' : 'border-slate-200 hover:border-slate-400'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <input type="color" value={settings.bgColor} onChange={(e) => setSettings((s) => ({ ...s, bgColor: e.target.value }))} className="w-9 h-9 rounded border border-slate-200 cursor-pointer" />
                      <input type="text" value={settings.bgColor} onChange={(e) => setSettings((s) => ({ ...s, bgColor: e.target.value }))} className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-xs font-mono" />
                    </div>
                  </div>
                )}

                {settings.bgType === 'gradient' && (
                  <div>
                    <SectionLabel>Gradient Preset</SectionLabel>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {PRESET_GRADIENTS.map((g, i) => (
                        <button
                          key={i}
                          onClick={() => setSettings((s) => ({ ...s, bgGradient: g }))}
                          className={`h-10 rounded-lg border-2 transition ${settings.bgGradient === g ? 'border-brand-500 scale-105' : 'border-slate-200 hover:border-slate-400'}`}
                          style={{ background: g }}
                        />
                      ))}
                    </div>
                    <div className="mt-3">
                      <input type="text" value={settings.bgGradient} onChange={(e) => setSettings((s) => ({ ...s, bgGradient: e.target.value }))} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-mono" placeholder="linear-gradient(...)" />
                    </div>
                  </div>
                )}

                {settings.bgType === 'image' && (
                  <div>
                    <SectionLabel>Background Image</SectionLabel>
                    <input type="text" value={settings.bgImage} onChange={(e) => setSettings((s) => ({ ...s, bgImage: e.target.value }))} className="w-full mt-2 px-2 py-1.5 border border-slate-200 rounded text-xs" placeholder="Paste image URL..." />
                    {graphics.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[11px] text-slate-500 mb-1.5">Or use from library:</p>
                        <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto">
                          {graphics.map((g) => (
                            <button key={g.id} onClick={() => setSettings((s) => ({ ...s, bgImage: g.url }))} className="h-12 rounded border border-slate-200 overflow-hidden hover:border-brand-400 transition">
                              <img src={g.url} alt={g.name} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Graphics Library tab */}
            {sidebarTab === 'graphics' && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-900">Graphics Library</h3>
                  <button
                    onClick={() => graphicFileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-400 hover:bg-brand-500 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mb-4">Upload and store custom images. Click to insert into your email.</p>

                {graphicsLoading ? (
                  <div className="text-center py-8 text-slate-400 text-sm">Loading...</div>
                ) : graphics.length === 0 ? (
                  <div className="text-center py-8">
                    <Image className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm text-slate-400">No graphics yet</p>
                    <p className="text-xs text-slate-400 mt-1">Upload images to build your library</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {graphics.map((g) => (
                      <div key={g.id} className="relative group rounded-lg border border-slate-200 overflow-hidden hover:border-brand-400 transition">
                        <button onClick={() => insertGraphicAsBlock(g)} className="w-full">
                          <img src={g.url} alt={g.name} className="w-full h-24 object-cover" />
                          <div className="px-2 py-1.5 bg-white">
                            <p className="text-[10px] text-slate-600 truncate">{g.name}</p>
                          </div>
                        </button>
                        <button
                          onClick={() => handleDeleteGraphic(g)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUploadForBlock(file);
          e.target.value = '';
        }}
      />
      <input
        ref={graphicFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleGraphicUpload(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function InsertButton({ active, onClick, onAdd }: { active: boolean; onClick: () => void; onAdd: (type: EmailBlock['type']) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClick(); // toggle off
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [active, onClick]);

  return (
    <div ref={ref} className="relative h-0 flex items-center justify-center z-10">
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={onClick}
        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all z-10 ${
          active ? 'bg-brand-400 border-brand-400 text-white scale-110' : 'bg-white border-slate-300 text-slate-400 hover:border-brand-300 hover:text-brand-400'
        }`}
        title="Insert block here"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
      {!active && <div className="absolute left-8 right-8 top-1/2 border-t border-dashed border-slate-300/70" />}
      {active && (
        <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl border border-slate-200 p-2 flex items-center gap-1 z-20">
          <InsertOption icon={<span className="text-brand-400 font-bold text-sm leading-none">T</span>} label="Title" onClick={() => onAdd('title')} />
          <InsertOption icon={<Type className="w-3.5 h-3.5" />} label="Text" onClick={() => onAdd('text')} />
          <InsertOption icon={<Image className="w-3.5 h-3.5" />} label="Image" onClick={() => onAdd('image')} />
          <InsertOption icon={<MousePointerClick className="w-3.5 h-3.5" />} label="Button" onClick={() => onAdd('button')} />
          <InsertOption icon={<Minus className="w-3.5 h-3.5" />} label="Divider" onClick={() => onAdd('divider')} />
          <InsertOption icon={<MoveVertical className="w-3.5 h-3.5" />} label="Spacer" onClick={() => onAdd('spacer')} />
        </div>
      )}
    </div>
  );
}

function InsertOption({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-md hover:bg-brand-50 transition text-slate-600 hover:text-brand-400"
      title={label}
    >
      {icon}
      <span className="text-[9px] font-medium">{label}</span>
    </button>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition border-b-2 ${
        active ? 'border-brand-400 text-brand-700 bg-brand-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function DropdownSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-2">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-2 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wider hover:bg-slate-50 rounded-md transition">
        {title}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && <div className="pl-1 space-y-0.5">{children}</div>}
    </div>
  );
}

function AddBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition text-left group">
      <span className="text-slate-500 group-hover:text-brand-400 transition w-4 h-4 flex items-center justify-center">{icon}</span>
      <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{label}</span>
    </button>
  );
}

function BlockRenderer({ block, templateImageUrl }: { block: EmailBlock; templateImageUrl?: string }) {
  const bgStyle: React.CSSProperties = block.blockBg ? { backgroundColor: block.blockBg } : {};

  switch (block.type) {
    case 'flyer':
      return (
        <div className="px-4" style={bgStyle}>
          {templateImageUrl ? (
            <img src={templateImageUrl} alt="Flyer" className="w-full rounded-lg" />
          ) : (
            <div className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg py-12 text-center text-slate-400 text-sm">
              <Image className="w-10 h-10 mx-auto mb-2" />
              Flyer will appear here when a template is selected
            </div>
          )}
        </div>
      );
    case 'title':
      return (
        <div
          className="px-5"
          style={{
            ...bgStyle,
            fontFamily: block.styles.fontFamily,
            fontWeight: block.styles.fontWeight,
            fontSize: `${block.styles.fontSize}px`,
            color: block.styles.color,
            textAlign: block.styles.textAlign,
            lineHeight: block.styles.lineHeight,
            whiteSpace: 'pre-wrap',
          }}
        >
          {block.content}
        </div>
      );
    case 'text':
      return (
        <div
          className="px-5"
          style={{
            ...bgStyle,
            fontFamily: block.styles.fontFamily,
            fontWeight: block.styles.fontWeight,
            fontSize: `${block.styles.fontSize}px`,
            color: block.styles.color,
            textAlign: block.styles.textAlign,
            lineHeight: block.styles.lineHeight,
            whiteSpace: 'pre-wrap',
          }}
        >
          {block.content}
        </div>
      );
    case 'image':
      return (
        <div className="px-5 text-center" style={bgStyle}>
          {block.src ? (
            <img src={block.src} alt={block.alt} className="inline-block" style={{ maxWidth: block.styles.maxWidth, borderRadius: `${block.styles.borderRadius}px` }} />
          ) : (
            <div className="bg-white/80 border-2 border-dashed border-slate-300 rounded-lg py-8 text-slate-400 text-sm">
              <Image className="w-8 h-8 mx-auto mb-2" />
              Upload or select from library
            </div>
          )}
        </div>
      );
    case 'button':
      return (
        <div className="px-5" style={{ ...bgStyle, textAlign: block.styles.align }}>
          <span className="inline-block cursor-default" style={{ backgroundColor: block.styles.bgColor, color: block.styles.textColor, padding: `${block.styles.paddingY}px ${block.styles.paddingX}px`, borderRadius: `${block.styles.borderRadius}px`, fontSize: `${block.styles.fontSize}px`, fontWeight: 600 }}>
            {block.label}
          </span>
        </div>
      );
    case 'divider':
      return (
        <div className="py-3" style={bgStyle}>
          <div className="px-5">
            <hr style={{ border: 'none', borderTop: `${block.styles.thickness}px solid ${block.styles.color}`, width: block.styles.width, margin: '0 auto' }} />
          </div>
        </div>
      );
    case 'spacer':
      return <div style={{ height: `${block.height}px`, ...bgStyle }} className="relative"><div className="absolute inset-x-5 top-1/2 border-t border-dashed border-slate-300/60" /></div>;
    case 'social':
      return (
        <div className="px-5" style={{ ...bgStyle, textAlign: block.styles.align }}>
          {block.styles.showLabel && (
            <div style={{ fontSize: `${block.styles.labelSize}px`, color: block.styles.labelColor, marginBottom: '8px', fontWeight: 600 }}>FOLLOW US</div>
          )}
          <div className="inline-flex items-center" style={{ gap: `${block.styles.gap}px` }}>
            {block.links.map((link) => (
              <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-block hover:opacity-80 transition">
                <img src={link.iconUrl} alt={link.platform} style={{ width: `${block.styles.iconSize}px`, height: `${block.styles.iconSize}px`, borderRadius: '50%' }} />
              </a>
            ))}
          </div>
        </div>
      );
    case 'link':
      return (
        <div className="px-5" style={{ ...bgStyle, textAlign: block.styles.textAlign }}>
          <a
            href={block.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: block.styles.color, fontSize: `${block.styles.fontSize}px`, fontWeight: block.styles.fontWeight, textDecoration: 'underline', fontFamily: 'sans-serif' }}
          >
            {block.label}
          </a>
        </div>
      );
  }
}

function SectionLabel({ children }: { children: string }) {
  return <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{children}</label>;
}

function TextBlockEditor({ block, onUpdate, onUpdateStyles }: { block: Extract<EmailBlock, { type: 'text' }>; onUpdate: (p: Partial<typeof block>) => void; onUpdateStyles: (s: Partial<TextStyles>) => void }) {
  return (
    <>
      <div>
        <SectionLabel>Content</SectionLabel>
        <textarea value={block.content} onChange={(e) => onUpdate({ content: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm resize-y min-h-[120px] focus:outline-none focus:ring-1 focus:ring-brand-300" />
      </div>
      <DropdownSection title="Typography">
        <div className="space-y-3 px-1">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <SectionLabel>Font</SectionLabel>
              <select value={block.styles.fontFamily} onChange={(e) => onUpdateStyles({ fontFamily: e.target.value })} className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded text-xs">
                {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <SectionLabel>Weight</SectionLabel>
              <select value={block.styles.fontWeight} onChange={(e) => onUpdateStyles({ fontWeight: e.target.value })} className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded text-xs">
                {WEIGHT_OPTIONS.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <SectionLabel>Size</SectionLabel>
              <div className="flex items-center gap-1 mt-1">
                <input type="number" value={block.styles.fontSize} onChange={(e) => onUpdateStyles({ fontSize: Number(e.target.value) })} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs" min={8} max={72} />
                <span className="text-[10px] text-slate-500">px</span>
              </div>
            </div>
            <div>
              <SectionLabel>Line Height</SectionLabel>
              <input type="number" step={0.1} value={block.styles.lineHeight} onChange={(e) => onUpdateStyles({ lineHeight: Number(e.target.value) })} className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded text-xs" min={1} max={3} />
            </div>
          </div>
          <div>
            <SectionLabel>Color</SectionLabel>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" value={block.styles.color} onChange={(e) => onUpdateStyles({ color: e.target.value })} className="w-8 h-8 rounded border border-slate-200 cursor-pointer" />
              <input type="text" value={block.styles.color} onChange={(e) => onUpdateStyles({ color: e.target.value })} className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-xs font-mono" />
            </div>
          </div>
          <div>
            <SectionLabel>Align</SectionLabel>
            <div className="flex items-center gap-1 mt-1">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button key={align} onClick={() => onUpdateStyles({ textAlign: align })} className={`flex-1 p-2 rounded border transition ${block.styles.textAlign === align ? 'bg-brand-50 border-brand-300 text-brand-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                  {align === 'left' && <AlignLeft className="w-4 h-4 mx-auto" />}
                  {align === 'center' && <AlignCenter className="w-4 h-4 mx-auto" />}
                  {align === 'right' && <AlignRight className="w-4 h-4 mx-auto" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DropdownSection>
    </>
  );
}

function ImageBlockEditor({ block, onUpdate, onUpdateStyles, onUpload, graphics, onUseGraphic }: { block: Extract<EmailBlock, { type: 'image' }>; onUpdate: (p: Partial<typeof block>) => void; onUpdateStyles: (s: Partial<ImageStyles>) => void; onUpload: () => void; graphics: UserGraphic[]; onUseGraphic: (g: UserGraphic) => void }) {
  return (
    <>
      <DropdownSection title="Image Source">
        <div className="space-y-3 px-1">
          <button onClick={onUpload} className="w-full px-3 py-2.5 border border-dashed border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" />
            {block.src ? 'Replace Image' : 'Upload Image'}
          </button>
          <div>
            <SectionLabel>Image URL</SectionLabel>
            <input type="text" value={block.src} onChange={(e) => onUpdate({ src: e.target.value })} placeholder="https://..." className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-brand-300" />
          </div>
          {graphics.length > 0 && (
            <div>
              <SectionLabel>From Library</SectionLabel>
              <div className="grid grid-cols-3 gap-1.5 mt-1 max-h-28 overflow-y-auto">
                {graphics.map((g) => (
                  <button key={g.id} onClick={() => onUseGraphic(g)} className="h-14 rounded border border-slate-200 overflow-hidden hover:border-brand-400 transition">
                    <img src={g.url} alt={g.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DropdownSection>
      <DropdownSection title="Display">
        <div className="space-y-3 px-1">
          <div>
            <SectionLabel>Alt Text</SectionLabel>
            <input type="text" value={block.alt} onChange={(e) => onUpdate({ alt: e.target.value })} className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <SectionLabel>Max Width</SectionLabel>
              <input type="text" value={block.styles.maxWidth} onChange={(e) => onUpdateStyles({ maxWidth: e.target.value })} className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded text-xs" />
            </div>
            <div>
              <SectionLabel>Radius</SectionLabel>
              <div className="flex items-center gap-1 mt-1">
                <input type="number" value={block.styles.borderRadius} onChange={(e) => onUpdateStyles({ borderRadius: Number(e.target.value) })} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs" min={0} />
                <span className="text-[10px] text-slate-500">px</span>
              </div>
            </div>
          </div>
        </div>
      </DropdownSection>
    </>
  );
}

function ButtonBlockEditor({ block, onUpdate, onUpdateStyles }: { block: Extract<EmailBlock, { type: 'button' }>; onUpdate: (p: Partial<typeof block>) => void; onUpdateStyles: (s: Partial<ButtonStyles>) => void }) {
  return (
    <>
      <DropdownSection title="Button Content">
        <div className="space-y-3 px-1">
          <div>
            <SectionLabel>Label</SectionLabel>
            <input type="text" value={block.label} onChange={(e) => onUpdate({ label: e.target.value })} className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded text-xs" />
          </div>
          <div>
            <SectionLabel>URL</SectionLabel>
            <input type="url" value={block.url} onChange={(e) => onUpdate({ url: e.target.value })} className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded text-xs" />
          </div>
        </div>
      </DropdownSection>
      <DropdownSection title="Style">
        <div className="space-y-3 px-1">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <SectionLabel>Background</SectionLabel>
              <div className="flex items-center gap-1 mt-1">
                <input type="color" value={block.styles.bgColor} onChange={(e) => onUpdateStyles({ bgColor: e.target.value })} className="w-7 h-7 rounded border border-slate-200 cursor-pointer" />
                <input type="text" value={block.styles.bgColor} onChange={(e) => onUpdateStyles({ bgColor: e.target.value })} className="flex-1 px-1 py-1 border border-slate-200 rounded text-[10px] font-mono" />
              </div>
            </div>
            <div>
              <SectionLabel>Text</SectionLabel>
              <div className="flex items-center gap-1 mt-1">
                <input type="color" value={block.styles.textColor} onChange={(e) => onUpdateStyles({ textColor: e.target.value })} className="w-7 h-7 rounded border border-slate-200 cursor-pointer" />
                <input type="text" value={block.styles.textColor} onChange={(e) => onUpdateStyles({ textColor: e.target.value })} className="flex-1 px-1 py-1 border border-slate-200 rounded text-[10px] font-mono" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <SectionLabel>Radius</SectionLabel>
              <input type="number" value={block.styles.borderRadius} onChange={(e) => onUpdateStyles({ borderRadius: Number(e.target.value) })} className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded text-xs" min={0} />
            </div>
            <div>
              <SectionLabel>Font Size</SectionLabel>
              <input type="number" value={block.styles.fontSize} onChange={(e) => onUpdateStyles({ fontSize: Number(e.target.value) })} className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded text-xs" min={10} max={32} />
            </div>
          </div>
          <div>
            <SectionLabel>Alignment</SectionLabel>
            <div className="flex items-center gap-1 mt-1">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button key={align} onClick={() => onUpdateStyles({ align })} className={`flex-1 p-2 rounded border transition ${block.styles.align === align ? 'bg-brand-50 border-brand-300 text-brand-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                  {align === 'left' && <AlignLeft className="w-4 h-4 mx-auto" />}
                  {align === 'center' && <AlignCenter className="w-4 h-4 mx-auto" />}
                  {align === 'right' && <AlignRight className="w-4 h-4 mx-auto" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DropdownSection>
    </>
  );
}

function DividerBlockEditor({ block, onUpdateStyles }: { block: Extract<EmailBlock, { type: 'divider' }>; onUpdateStyles: (s: Partial<DividerStyles>) => void }) {
  return (
    <DropdownSection title="Divider Style">
      <div className="space-y-3 px-1">
        <div>
          <SectionLabel>Color</SectionLabel>
          <div className="flex items-center gap-2 mt-1">
            <input type="color" value={block.styles.color} onChange={(e) => onUpdateStyles({ color: e.target.value })} className="w-8 h-8 rounded border border-slate-200 cursor-pointer" />
            <input type="text" value={block.styles.color} onChange={(e) => onUpdateStyles({ color: e.target.value })} className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-xs font-mono" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <SectionLabel>Thickness</SectionLabel>
            <input type="number" value={block.styles.thickness} onChange={(e) => onUpdateStyles({ thickness: Number(e.target.value) })} className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded text-xs" min={1} max={10} />
          </div>
          <div>
            <SectionLabel>Width</SectionLabel>
            <input type="text" value={block.styles.width} onChange={(e) => onUpdateStyles({ width: e.target.value })} className="w-full mt-1 px-2 py-1.5 border border-slate-200 rounded text-xs" />
          </div>
        </div>
      </div>
    </DropdownSection>
  );
}

function SpacerBlockEditor({ block, onUpdate }: { block: Extract<EmailBlock, { type: 'spacer' }>; onUpdate: (p: Partial<typeof block>) => void }) {
  return (
    <div className="px-1">
      <SectionLabel>Height</SectionLabel>
      <div className="flex items-center gap-3 mt-2">
        <input type="range" min={4} max={100} value={block.height} onChange={(e) => onUpdate({ height: Number(e.target.value) })} className="flex-1" />
        <span className="text-xs text-slate-600 font-mono w-12 text-right">{block.height}px</span>
      </div>
    </div>
  );
}

function SocialBlockEditor({ block, onUpdate, onUpdateStyles }: { block: Extract<EmailBlock, { type: 'social' }>; onUpdate: (p: Partial<typeof block>) => void; onUpdateStyles: (s: Partial<SocialStyles>) => void }) {
  return (
    <>
      <DropdownSection title="Icons">
        <div className="space-y-3 px-1">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <SectionLabel>Icon Size</SectionLabel>
              <div className="flex items-center gap-1 mt-1">
                <input type="number" value={block.styles.iconSize} onChange={(e) => onUpdateStyles({ iconSize: Number(e.target.value) })} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs" min={16} max={64} />
                <span className="text-[10px] text-slate-500">px</span>
              </div>
            </div>
            <div>
              <SectionLabel>Gap</SectionLabel>
              <div className="flex items-center gap-1 mt-1">
                <input type="number" value={block.styles.gap} onChange={(e) => onUpdateStyles({ gap: Number(e.target.value) })} className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs" min={4} max={48} />
                <span className="text-[10px] text-slate-500">px</span>
              </div>
            </div>
          </div>
          <div>
            <SectionLabel>Alignment</SectionLabel>
            <div className="flex items-center gap-1 mt-1">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button key={align} onClick={() => onUpdateStyles({ align })} className={`flex-1 p-2 rounded border transition ${block.styles.align === align ? 'bg-brand-50 border-brand-300 text-brand-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                  {align === 'left' && <AlignLeft className="w-4 h-4 mx-auto" />}
                  {align === 'center' && <AlignCenter className="w-4 h-4 mx-auto" />}
                  {align === 'right' && <AlignRight className="w-4 h-4 mx-auto" />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <SectionLabel>Show Label</SectionLabel>
            <button
              onClick={() => onUpdateStyles({ showLabel: !block.styles.showLabel })}
              className={`w-9 h-5 rounded-full transition-colors relative ${block.styles.showLabel ? 'bg-brand-400' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${block.styles.showLabel ? 'left-4' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
      </DropdownSection>
      <DropdownSection title="Links">
        <div className="space-y-2 px-1">
          {block.links.map((link, i) => (
            <div key={i} className="p-2 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-1.5">
                <img src={link.iconUrl} alt={link.platform} className="w-5 h-5 rounded" />
                <span className="text-xs font-medium text-slate-700">{link.platform}</span>
              </div>
              <input
                type="url"
                value={link.url}
                onChange={(e) => {
                  const newLinks = [...block.links];
                  newLinks[i] = { ...link, url: e.target.value };
                  onUpdate({ links: newLinks });
                }}
                className="w-full px-2 py-1 border border-slate-200 rounded text-[11px] font-mono"
              />
            </div>
          ))}
        </div>
      </DropdownSection>
    </>
  );
}

const BLOCK_BG_PRESETS = ['', '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3', '#1e293b'];

function LinkBlockEditor({ block, onUpdate, onUpdateStyles }: { block: Extract<EmailBlock, { type: 'link' }>; onUpdate: (p: Partial<typeof block>) => void; onUpdateStyles: (s: Partial<LinkStyles>) => void }) {
  return (
    <div className="space-y-3 px-1">
      <div>
        <SectionLabel>Label</SectionLabel>
        <input type="text" value={block.label} onChange={(e) => onUpdate({ label: e.target.value })} className="mt-1 w-full px-2 py-1.5 border border-slate-200 rounded text-sm" />
      </div>
      <div>
        <SectionLabel>URL</SectionLabel>
        <input type="url" value={block.url} onChange={(e) => onUpdate({ url: e.target.value })} className="mt-1 w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-mono" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <SectionLabel>Color</SectionLabel>
          <div className="flex items-center gap-1 mt-1">
            <input type="color" value={block.styles.color} onChange={(e) => onUpdateStyles({ color: e.target.value })} className="w-8 h-8 rounded border border-slate-200 cursor-pointer" />
            <input type="text" value={block.styles.color} onChange={(e) => onUpdateStyles({ color: e.target.value })} className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-xs font-mono" />
          </div>
        </div>
        <div>
          <SectionLabel>Font Size</SectionLabel>
          <input type="number" value={block.styles.fontSize} onChange={(e) => onUpdateStyles({ fontSize: Number(e.target.value) })} className="mt-1 w-full px-2 py-1.5 border border-slate-200 rounded text-xs" min={10} max={32} />
        </div>
      </div>
      <div>
        <SectionLabel>Alignment</SectionLabel>
        <div className="flex items-center gap-1 mt-1">
          {(['left', 'center', 'right'] as const).map((align) => (
            <button key={align} onClick={() => onUpdateStyles({ textAlign: align })} className={`flex-1 p-2 rounded border transition ${block.styles.textAlign === align ? 'bg-brand-50 border-brand-300 text-brand-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              {align === 'left' && <AlignLeft className="w-4 h-4 mx-auto" />}
              {align === 'center' && <AlignCenter className="w-4 h-4 mx-auto" />}
              {align === 'right' && <AlignRight className="w-4 h-4 mx-auto" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function BlockBgEditor({ block, onUpdate }: { block: EmailBlock; onUpdate: (p: Partial<EmailBlock>) => void }) {
  return (
    <div className="pt-3 border-t border-slate-100">
      <SectionLabel>Block Background</SectionLabel>
      <div className="mt-2 grid grid-cols-5 gap-2">
        {BLOCK_BG_PRESETS.map((c, i) => (
          <button
            key={i}
            onClick={() => onUpdate({ blockBg: c || undefined } as Partial<EmailBlock>)}
            className={`w-8 h-8 rounded-md border-2 transition ${
              (block.blockBg || '') === c ? 'border-brand-400 scale-110' : 'border-slate-200 hover:border-slate-400'
            }`}
            style={{ backgroundColor: c || 'transparent' }}
            title={c || 'None'}
          >
            {!c && <span className="text-[9px] text-slate-400 font-medium">--</span>}
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input type="color" value={block.blockBg || '#ffffff'} onChange={(e) => onUpdate({ blockBg: e.target.value } as Partial<EmailBlock>)} className="w-8 h-8 rounded border border-slate-200 cursor-pointer" />
        <input type="text" value={block.blockBg || ''} onChange={(e) => onUpdate({ blockBg: e.target.value || undefined } as Partial<EmailBlock>)} placeholder="Custom hex..." className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-xs font-mono" />
        {block.blockBg && (
          <button onClick={() => onUpdate({ blockBg: undefined } as Partial<EmailBlock>)} className="text-xs text-red-500 hover:text-red-700">Clear</button>
        )}
      </div>
    </div>
  );
}

function MultiBlockBgEditor({ blockIds, blocks, onUpdate }: { blockIds: Set<string>; blocks: EmailBlock[]; onUpdate: (bg: string | undefined) => void }) {
  const selectedBlocks = blocks.filter((b) => blockIds.has(b.id));
  const commonBg = selectedBlocks.every((b) => b.blockBg === selectedBlocks[0]?.blockBg) ? (selectedBlocks[0]?.blockBg || '') : '';

  return (
    <div>
      <SectionLabel>Block Background</SectionLabel>
      <div className="mt-2 grid grid-cols-5 gap-2">
        {BLOCK_BG_PRESETS.map((c, i) => (
          <button
            key={i}
            onClick={() => onUpdate(c || undefined)}
            className={`w-8 h-8 rounded-md border-2 transition ${
              commonBg === c ? 'border-brand-400 scale-110' : 'border-slate-200 hover:border-slate-400'
            }`}
            style={{ backgroundColor: c || 'transparent' }}
            title={c || 'None'}
          >
            {!c && <span className="text-[9px] text-slate-400 font-medium">--</span>}
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input type="color" value={commonBg || '#ffffff'} onChange={(e) => onUpdate(e.target.value)} className="w-8 h-8 rounded border border-slate-200 cursor-pointer" />
        <input type="text" value={commonBg} onChange={(e) => onUpdate(e.target.value || undefined)} placeholder="Custom hex..." className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-xs font-mono" />
        {commonBg && (
          <button onClick={() => onUpdate(undefined)} className="text-xs text-red-500 hover:text-red-700">Clear</button>
        )}
      </div>
    </div>
  );
}
