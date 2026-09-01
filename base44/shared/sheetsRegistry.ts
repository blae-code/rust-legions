// The War Record spreadsheet — the Ministry's archival registry.
export const SPREADSHEET_ID = '1SM95xZ_tuBxajlG1JMfAIF_7cqLb9qzs36EkbmnxFSA';

const url = (path, qs = '') =>
  `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}${path}${qs}`;

// Create the tab if the registry has no such ledger yet; returns true if created.
export async function ensureTab(accessToken, tab) {
  const res = await fetch(url(':batchUpdate'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title: tab } } }] }),
  });
  return res.ok;
}

// Append rows to a tab. Throws with the Sheets error message on refusal.
export async function appendRows(accessToken, tab, values) {
  if (!values.length) return 0;
  const res = await fetch(
    url(`/values/${encodeURIComponent(tab + '!A1')}:append`, '?valueInputOption=USER_ENTERED'),
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || 'Sheets append failed');
  }
  return values.length;
}