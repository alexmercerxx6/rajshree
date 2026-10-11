import { createClient } from '@supabase/supabase-js'

// In-memory fallback database for AI Studio environment
export interface DBResult {
  id: string;
  date: string;
  time_slot: string;
  display_time: string;
  ra: string;
  rb: string;
  rc: string;
  rd: string;
  re: string;
  created_at: string;
}

function getTodayDateIST(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  return istDate.toISOString().split('T')[0];
}

const todayDate = getTodayDateIST();

// Seed initial mock records matching the user's reference board
const initialResults: DBResult[] = [
  {
    id: 'seed-1',
    date: todayDate,
    time_slot: '10:40',
    display_time: '10:40 AM',
    ra: '75',
    rb: '01',
    rc: '79',
    rd: '96',
    re: '69',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'seed-2',
    date: todayDate,
    time_slot: '11:00',
    display_time: '11:00 AM',
    ra: '46',
    rb: '76',
    rc: '25',
    rd: '36',
    re: '41',
    created_at: new Date(Date.now() - 3600000 * 4.6).toISOString(),
  },
  {
    id: 'seed-3',
    date: todayDate,
    time_slot: '11:20',
    display_time: '11:20 AM',
    ra: '72',
    rb: '22',
    rc: '17',
    rd: '17',
    re: '65',
    created_at: new Date(Date.now() - 3600000 * 4.3).toISOString(),
  },
  {
    id: 'seed-4',
    date: todayDate,
    time_slot: '11:40',
    display_time: '11:40 AM',
    ra: '88',
    rb: '71',
    rc: '88',
    rd: '21',
    re: '19',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'seed-5',
    date: todayDate,
    time_slot: '12:00',
    display_time: '12:00 PM',
    ra: '29',
    rb: '19',
    rc: '74',
    rd: '48',
    re: '81',
    created_at: new Date(Date.now() - 3600000 * 3.6).toISOString(),
  },
  {
    id: 'seed-6',
    date: todayDate,
    time_slot: '12:20',
    display_time: '12:20 PM',
    ra: '43',
    rb: '94',
    rc: '30',
    rd: '23',
    re: '28',
    created_at: new Date(Date.now() - 3600000 * 3.3).toISOString(),
  },
  {
    id: 'seed-7',
    date: todayDate,
    time_slot: '12:40',
    display_time: '12:40 PM',
    ra: '43',
    rb: '98',
    rc: '46',
    rd: '66',
    re: '19',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'seed-8',
    date: todayDate,
    time_slot: '13:00',
    display_time: '01:00 PM',
    ra: '39',
    rb: '86',
    rc: '17',
    rd: '03',
    re: '52',
    created_at: new Date(Date.now() - 3600000 * 2.6).toISOString(),
  },
  {
    id: 'seed-9',
    date: todayDate,
    time_slot: '13:20',
    display_time: '01:20 PM',
    ra: '84',
    rb: '21',
    rc: '56',
    rd: '08',
    re: '89',
    created_at: new Date(Date.now() - 3600000 * 2.3).toISOString(),
  },
  {
    id: 'seed-10',
    date: todayDate,
    time_slot: '13:40',
    display_time: '01:40 PM',
    ra: '56',
    rb: '33',
    rc: '31',
    rd: '78',
    re: '08',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'seed-11',
    date: todayDate,
    time_slot: '14:00',
    display_time: '02:00 PM',
    ra: '36',
    rb: '12',
    rc: '57',
    rd: '10',
    re: '05',
    created_at: new Date(Date.now() - 3600000 * 1.6).toISOString(),
  },
];

let inMemoryStore: DBResult[] = [...initialResults];

class MockQueryBuilder {
  private _data: DBResult[];
  private _isSingle = false;
  private _isDelete = false;
  private _isInsert = false;
  private _insertPayload: any = null;
  private _error: any = null;

  constructor(table: string) {
    this._data = [...inMemoryStore];
  }

  select(fields?: string) {
    return this;
  }

  insert(values: any) {
    this._isInsert = true;
    this._insertPayload = values;
    // Check unique constraint: date + time_slot
    const exists = inMemoryStore.find(
      (r) => r.date === values.date && r.time_slot === values.time_slot
    );
    if (exists) {
      this._error = {
        code: '23505',
        message: 'duplicate key value violates unique constraint "unique_date_time_slot"',
      };
      return this;
    }
    const newRecord: DBResult = {
      id: values.id || `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: values.date,
      time_slot: values.time_slot,
      display_time: values.display_time,
      ra: values.ra || values.RA || '00',
      rb: values.rb || values.RB || '00',
      rc: values.rc || values.RC || '00',
      rd: values.rd || values.RD || '00',
      re: values.re || values.RE || '00',
      created_at: values.created_at || new Date().toISOString(),
    };
    inMemoryStore.push(newRecord);
    this._data = [newRecord];
    return this;
  }

  delete() {
    this._isDelete = true;
    return this;
  }

  eq(field: string, value: any) {
    if (this._isDelete) {
      const idx = inMemoryStore.findIndex((r: any) => r[field] === value);
      if (idx !== -1) {
        const deleted = inMemoryStore.splice(idx, 1)[0];
        this._data = [deleted];
      } else {
        this._data = [];
      }
    } else {
      this._data = this._data.filter((r: any) => r[field] === value);
    }
    return this;
  }

  gte(field: string, value: any) {
    this._data = this._data.filter((r: any) => r[field] >= value);
    return this;
  }

  lte(field: string, value: any) {
    this._data = this._data.filter((r: any) => r[field] <= value);
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    const asc = options?.ascending !== false;
    this._data.sort((a: any, b: any) => {
      if (a[field] < b[field]) return asc ? -1 : 1;
      if (a[field] > b[field]) return asc ? 1 : -1;
      return 0;
    });
    return this;
  }

  range(from: number, to: number) {
    this._data = this._data.slice(from, to + 1);
    return this;
  }

  single() {
    this._isSingle = true;
    return this;
  }

  async then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    const result = {
      data: this._error ? null : this._isSingle ? (this._data[0] || null) : this._data,
      error: this._error,
    };
    if (onfulfilled) {
      return onfulfilled(result);
    }
    return result as any;
  }
}

function createMockSupabaseClient() {
  return {
    from: (table: string) => new MockQueryBuilder(table),
  } as any;
}

const config = useRuntimeConfig();

const hasValidSupabaseConfig =
  typeof config.supabaseUrl === 'string' &&
  config.supabaseUrl.startsWith('http') &&
  typeof config.supabaseKey === 'string' &&
  config.supabaseKey.trim().length > 0;

let client: any;

if (hasValidSupabaseConfig) {
  try {
    client = createClient(
      config.supabaseUrl as string,
      config.supabaseKey as string,
      {
        auth: {
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );
  } catch (err) {
    console.warn('[AI Studio] Supabase client initialization fallback:', err);
    client = createMockSupabaseClient();
  }
} else {
  client = createMockSupabaseClient();
}

export const supabase = client;
