export interface ResolveAccountParams {
  accountNumber: string;
  bankCode: string;
}

export interface ResolveAccountResult {
  account_name: string;
}

export const resolvePaystackAccountName = async ({ accountNumber, bankCode }: ResolveAccountParams): Promise<string | null> => {
  try {
    const res = await fetch('/.netlify/functions/resolve-account-name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountNumber, bankCode }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ResolveAccountResult;
    return data?.account_name ?? null;
  } catch (e) {
    console.error('resolvePaystackAccountName:', e);
    return null;
  }
};
