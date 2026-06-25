import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Template = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  category: string;
  created_at: string;
  storage_path?: string;
};

export const FLYER_BUCKET = 'flyer-bank';

function prettifyName(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, '');
  return base
    .replace(/^\d{10,}-/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s*\d+(\.\d+)?\s*[xX]\s*\d+(\.\d+)?\s*/g, ' ')
    .replace(/\(\d+\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function inferCategory(name: string): string {
  const n = name.toLowerCase();
  if (/(class|workshop|tour|peak|golf|wellness)/.test(n)) return 'wellness';
  if (/(supper|brunch|milk|fruit|club)/.test(n)) return 'dining';
  if (/(salsa|bachata|game|trivia|social|night|party)/.test(n)) return 'event';
  if (/(news|letter|notice|maintenance|lease)/.test(n)) return 'notice';
  return 'event';
}

export async function uploadFlyer(file: File, displayName?: string): Promise<void> {
  const safeName = file.name.replace(/[^\w.\-() ]/g, '_');
  const path = `${Date.now()}-${safeName}`;
  const { error } = await supabase.storage
    .from(FLYER_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (error) throw error;
  if (displayName) {
    await supabase
      .from('flyer_names')
      .upsert({ storage_path: path, display_name: displayName }, { onConflict: 'storage_path' });
  }
}

export async function deleteFlyer(path: string): Promise<void> {
  const { error } = await supabase.storage.from(FLYER_BUCKET).remove([path]);
  if (error) throw error;
  await supabase.from('flyer_names').delete().eq('storage_path', path);
}

export async function renameFlyer(storagePath: string, displayName: string): Promise<void> {
  const { error } = await supabase
    .from('flyer_names')
    .upsert({ storage_path: storagePath, display_name: displayName }, { onConflict: 'storage_path' });
  if (error) throw error;
}

export async function listFlyers(): Promise<Template[]> {
  const [storageResult, namesResult] = await Promise.all([
    supabase.storage
      .from(FLYER_BUCKET)
      .list('', { limit: 200, sortBy: { column: 'name', order: 'asc' } }),
    supabase.from('flyer_names').select('storage_path, display_name'),
  ]);

  if (storageResult.error) throw storageResult.error;
  if (!storageResult.data) return [];

  const nameMap = new Map<string, string>();
  if (namesResult.data) {
    for (const row of namesResult.data) {
      nameMap.set(row.storage_path, row.display_name);
    }
  }

  return storageResult.data
    .filter((f) => f.name && !f.name.startsWith('.') && /\.(png|jpe?g|webp|gif)$/i.test(f.name))
    .map((f) => {
      const { data: pub } = supabase.storage.from(FLYER_BUCKET).getPublicUrl(f.name);
      const pretty = nameMap.get(f.name) || prettifyName(f.name);
      return {
        id: f.id || f.name,
        name: pretty || f.name,
        description: `${pretty} event flyer from the Liberty Harbor flyer bank.`,
        image_url: pub.publicUrl,
        category: inferCategory(pretty),
        created_at: (f as { created_at?: string }).created_at || new Date().toISOString(),
        storage_path: f.name,
      } as Template;
    });
}

export type Contact = {
  id: string;
  name: string;
  email: string;
  building: string;
  number: string | null;
  is_static: boolean;
  created_at: string;
};

const CONTACTS_CACHE_KEY = 'lh:contacts:v4';
const CONTACTS_CACHE_TTL_MS = 30 * 60 * 1000;

type ContactsCache = { ts: number; data: Contact[] };

function readContactsCache(): Contact[] | null {
  try {
    const raw = localStorage.getItem(CONTACTS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ContactsCache;
    if (!parsed?.ts || !Array.isArray(parsed.data)) return null;
    if (Date.now() - parsed.ts > CONTACTS_CACHE_TTL_MS) return null;
    if (parsed.data.length === 0) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeContactsCache(data: Contact[]): void {
  try {
    localStorage.setItem(CONTACTS_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // quota exceeded or storage disabled — ignore
  }
}

let contactsInflight: Promise<Contact[]> | null = null;

async function fetchAllContactsFromDb(): Promise<Contact[]> {
  const pageSize = 1000;
  const all: Contact[] = [];
  let page = 0;
  while (true) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('building')
      .order('name')
      .range(from, to);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as Contact[]));
    if (data.length < pageSize) break;
    page++;
    if (page > 100) break;
  }
  return all;
}

export async function loadContacts(opts: { forceRefresh?: boolean } = {}): Promise<Contact[]> {
  if (!opts.forceRefresh) {
    const cached = readContactsCache();
    if (cached) return cached;
  }
  if (contactsInflight) return contactsInflight;
  contactsInflight = (async () => {
    try {
      const data = await fetchAllContactsFromDb();
      writeContactsCache(data);
      return data;
    } finally {
      contactsInflight = null;
    }
  })();
  return contactsInflight;
}

export function invalidateContactsCache(): void {
  try {
    localStorage.removeItem(CONTACTS_CACHE_KEY);
  } catch {
    // ignore
  }
}

export type Notification = {
  id: string;
  template_id: string | null;
  buildings: string[];
  include_ten_regent: boolean;
  recipient_count: number;
  status: string;
  sent_at: string | null;
  created_at: string;
};

export type UserGraphic = {
  id: string;
  name: string;
  url: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

const GRAPHICS_BUCKET = 'user-graphics';

export async function uploadGraphic(file: File): Promise<UserGraphic> {
  const safeName = file.name.replace(/[^\w.\-() ]/g, '_');
  const path = `${Date.now()}-${safeName}`;
  const { error: uploadError } = await supabase.storage
    .from(GRAPHICS_BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (uploadError) throw uploadError;

  const { data: pub } = supabase.storage.from(GRAPHICS_BUCKET).getPublicUrl(path);

  const record: Omit<UserGraphic, 'id' | 'created_at'> = {
    name: file.name,
    url: pub.publicUrl,
    storage_path: path,
    mime_type: file.type,
    size_bytes: file.size,
  };

  const { data, error } = await supabase
    .from('user_graphics')
    .insert(record)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as UserGraphic;
}

export async function listGraphics(): Promise<UserGraphic[]> {
  const { data, error } = await supabase
    .from('user_graphics')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as UserGraphic[];
}

export async function deleteGraphic(graphic: UserGraphic): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from(GRAPHICS_BUCKET)
    .remove([graphic.storage_path]);
  if (storageError) throw storageError;

  const { error: dbError } = await supabase
    .from('user_graphics')
    .delete()
    .eq('id', graphic.id);
  if (dbError) throw dbError;
}
