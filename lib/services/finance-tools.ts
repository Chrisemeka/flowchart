type BreakdownRow = {
  category: string;
  debit_total: string | number;
  debit_count: string | number;
  credit_total: string | number;
  credit_count: string | number;
};

type TxRow = {
  id: string;
  date: string;
  amount: string | number;
  type: 'Debit' | 'Credit';
  category: string;
  clean_name: string | null;
  narration: string | null;
  statements: { user_id: string; bank_name: string } | { user_id: string; bank_name: string }[];
};

import { SupabaseClient } from '@supabase/supabase-js';
import { TRANSACTION_CATEGORIES } from '../constants';

export type DateRange = { startDate: string; endDate: string };

export async function listBanks(
  supabase: SupabaseClient,
  userId: string
): Promise<{ banks: string[] }> {
  const { data, error } = await supabase
    .from('statements')
    .select('bank_name')
    .eq('user_id', userId);

  if (error) throw error;

  const banks = Array.from(
    new Set((data ?? []).map(s => s.bank_name).filter(Boolean))
  );
  return { banks };
}


//rpc
export async function getSpendingByCategory(
  supabase: SupabaseClient,
  userId: string,
  args: {
    category: string;
    startDate: string;
    endDate: string;
    bank?: string;
  }
): Promise<{ total: number; count: number; currency: 'NGN' }> {
  const { data, error } = await supabase.rpc('get_spending_by_category', {
    p_user_id: userId,
    p_category: args.category,
    p_start_date: args.startDate,
    p_end_date: args.endDate,
    p_bank: args.bank ?? null,
  });

  if (error) throw error;

  const row = (data as any[])?.[0] ?? { total: 0, count: 0 };
  return {
    total: Number(row.total),
    count: Number(row.count),
    currency: 'NGN',
  };
}

//rpc
export async function listCategories(
  supabase: SupabaseClient,
  userId: string
): Promise<{ categories: string[] }> {
  const { data, error } = await supabase.rpc('list_categories', {
    p_user_id: userId,
  });

  if (error) throw error;

  const rows = (data as { category: string }[] | null) ?? [];
  return { categories: rows.map(r => r.category).filter(Boolean) }; 
}

export async function listStatementPeriods(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  periods: { bank: string; month: number; year: number; startDate: string; endDate: string }[];
}> {
  const { data, error } = await supabase
    .from('statements')
    .select('bank_name, month, year, start_date, end_date')
    .eq('user_id', userId)
    .order('start_date', { ascending: false });

  if (error) throw error;

  return {
    periods: (data ?? []).map(s => ({
      bank: s.bank_name,
      month: s.month,
      year: s.year,
      startDate: s.start_date,
      endDate: s.end_date,
    })),
  };
}

//rpc
export async function getSpendingBreakdown(
  supabase: SupabaseClient,
  userId: string,
  args: { startDate: string; endDate: string; bank?: string }
): Promise<{
  byCategory: { category: string; total: number; count: number }[];
  totalDebits: number;
  totalCredits: number;
}> {
  const { data, error } = await supabase.rpc('get_spending_breakdown', {
    p_user_id:    userId,
    p_start_date: args.startDate,
    p_end_date:   args.endDate,
    p_bank:       args.bank ?? null,
  });
  if (error) throw error;

  const rows = (data as BreakdownRow[] | null) ?? [];

  let totalDebits = 0;
  let totalCredits = 0;
  const byCategory = rows
    .map((r) => {
      const total = Number(r.debit_total);
      totalDebits  += total;
      totalCredits += Number(r.credit_total);
      return { category: r.category, total, count: Number(r.debit_count) };
    })
    .filter(g => g.count > 0)
    .sort((a, b) => b.total - a.total);

  return { byCategory, totalDebits, totalCredits };
}

//rpc
export async function getIncomeVsExpense(
  supabase: SupabaseClient,
  userId: string,
  args: { startDate: string; endDate: string; bank?: string }
): Promise<{ income: number; expense: number; net: number }> {
  const { data, error } = await supabase.rpc('get_income_vs_expense', {
    p_user_id:    userId,
    p_start_date: args.startDate,
    p_end_date:   args.endDate,
    p_bank:       args.bank ?? null,
  });
  if (error) throw error;

  const row = (data as any[])?.[0] ?? { income: 0, expense: 0 };
  const income  = Number(row.income);
  const expense = Number(row.expense);
  return { income, expense, net: income - expense };
}

//rpc
export async function getTopMerchants(
  supabase: SupabaseClient,
  userId: string,
  args: {
    startDate: string;
    endDate: string;
    limit?: number;
    bank?: string;
  }
): Promise<{
  merchants: { name: string; total: number; count: number }[];
}> {
  const limit = Math.min(Math.max(args.limit ?? 10, 1), 50);

  const { data, error } = await supabase.rpc('get_top_merchants', {
    p_user_id: userId,
    p_start_date: args.startDate,
    p_end_date: args.endDate,
    p_limit: limit,
    p_bank: args.bank ?? null,
  });

  if (error) throw error;

  const rows = (data as { name: string; total: string | number; count: string | number }[] | null) ?? [];
  return {
    merchants: rows.map(r => ({
      name:  r.name,
      total: Number(r.total),
      count: Number(r.count),
    })),
  };
}

export async function getTransactions(
  supabase: SupabaseClient,
  userId: string,
  args: {
    startDate: string;
    endDate: string;
    category?: string;
    minAmount?: number;
    maxAmount?: number;
    search?: string;
    type?: 'Debit' | 'Credit';
    bank?: string;
    limit?: number;
  }
): Promise<{
  transactions: Array<{
    id: string; date: string; amount: number;
    type: 'Debit' | 'Credit'; category: string;
    description: string; bank: string;
  }>;
  truncated: boolean;
}> {
  const cap = 200;
  const requested = Math.min(Math.max(args.limit ?? 50, 1), cap);
  // Fetch one extra to detect truncation
  const fetchLimit = requested + 1;

  let query = supabase
    .from('transactions')
    .select(
      'id, date, amount, type, category, clean_name, narration, ' +
      'statements!inner(user_id, bank_name)'
    )
    .eq('statements.user_id', userId)
    .gte('date', args.startDate)
    .lte('date', args.endDate)
    .order('date', { ascending: false })
    .limit(fetchLimit);

  if (args.category)  query = query.eq('category', args.category);
  if (args.type)      query = query.eq('type', args.type);
  if (args.bank)      query = query.eq('statements.bank_name', args.bank);
  if (args.minAmount != null) query = query.gte('amount', args.minAmount);
  if (args.maxAmount != null) query = query.lte('amount', args.maxAmount);
  if (args.search) {
    query = query.ilike('clean_name', `%${args.search}%`);
  }

  const { data, error } = await query.returns<TxRow[]>();
  if (error) throw error;

  const rows = (data as TxRow[] | null) ?? [];
  const truncated = rows.length > requested;
  const kept = rows.slice(0, requested);

  return {
    transactions: kept.map(r => {
      const s = Array.isArray(r.statements) ? r.statements[0] : r.statements;
      return {
        id:          r.id,
        date:        r.date,
        amount:      Number(r.amount),
        type:        r.type,
        category:    r.category,
        description: r.clean_name || r.narration || '',
        bank:        s?.bank_name ?? 'Unknown',
      };
    }),
    truncated,
  };
}

export async function compareRanges(
  supabase: SupabaseClient,
  userId: string,
  args: {
    rangeA: DateRange;
    rangeB: DateRange;
    groupBy?: 'category' | 'bank' | 'total';
  }
): Promise<{
  a: { total: number; groups?: Record<string, number> };
  b: { total: number; groups?: Record<string, number> };
  delta: { total: number; groups?: Record<string, number> };
}> {
  const groupBy = args.groupBy ?? 'total';

  const summarise = async (range: DateRange) => {
    if (groupBy === 'category') {
      const r = await getSpendingBreakdown(supabase, userId, range);
      const groups: Record<string, number> = {};
      r.byCategory.forEach(c => (groups[c.category] = c.total));
      return { total: r.totalDebits, groups };
    }

    if (groupBy === 'bank') {
      // Fetch and group by bank name in JS.
      const { data, error } = await supabase
        .from('transactions')
        .select('amount, statements!inner(user_id, bank_name)')
        .eq('statements.user_id', userId)
        .eq('type', 'Debit')
        .gte('date', range.startDate)
        .lte('date', range.endDate);
      if (error) throw error;

      const groups: Record<string, number> = {};
      let total = 0;
      for (const row of data ?? []) {
        const bank = (row as any).statements?.bank_name ?? 'Unknown';
        const amt = Number(row.amount);
        groups[bank] = (groups[bank] ?? 0) + amt;
        total += amt;
      }
      return { total, groups };
    }

    // groupBy === 'total'
    const r = await getIncomeVsExpense(supabase, userId, range);
    return { total: r.expense };
  };

  const [a, b] = await Promise.all([
    summarise(args.rangeA),
    summarise(args.rangeB),
  ]);

  const delta: { total: number; groups?: Record<string, number> } = {
    total: b.total - a.total,
  };
  if (a.groups || b.groups) {
    const keys = new Set([
      ...Object.keys(a.groups ?? {}),
      ...Object.keys(b.groups ?? {}),
    ]);
    const g: Record<string, number> = {};
    keys.forEach(k => (g[k] = (b.groups?.[k] ?? 0) - (a.groups?.[k] ?? 0)));
    delta.groups = g;
  }

  return { a, b, delta };
}

//rpc
export async function getBalanceOverTime(
  supabase: SupabaseClient,
  userId: string,
  args: {
    startDate: string;
    endDate: string;
    granularity: 'day' | 'week' | 'month';
    bank?: string;
  }
): Promise<{
  points: {
    period: string;
    income: number;
    expense: number;
    net: number;
  }[];
}> {

  const { data, error } = await supabase.rpc('get_balance_over_time', {
    p_user_id: userId,
    p_start_date: args.startDate,
    p_end_date: args.endDate,
    p_granularity: args.granularity,
    p_bank: args.bank ?? null,
  });

  if (error) throw error;

  const rows = (data as { period: string; income: string | number; expense: string | number; net: string | number }[] | null) ?? [];
  return {
    points: rows.map(r => ({
      period:  r.period,
      income:  Number(r.income),
      expense: Number(r.expense),
      net:     Number(r.net),
    })),
  };
}

export const FINANCE_TOOLS = {
  listBanks,
  listCategories,
  listStatementPeriods,
  getSpendingByCategory,
  getSpendingBreakdown,
  getIncomeVsExpense,
  getTopMerchants,
  getTransactions,
  compareRanges,
  getBalanceOverTime,
} as const;

export type FinanceToolName = keyof typeof FINANCE_TOOLS;