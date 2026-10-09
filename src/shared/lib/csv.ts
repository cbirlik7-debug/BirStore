export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n');
}

const UTF8_BOM = '\uFEFF';

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([UTF8_BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * CSV ayrıştırıcı. Virgül (,) ve Türkçe Excel için noktalı virgül (;) ayırıcılarını destekler.
 * Tırnak içi (`"..."`) alanları ve çift tırnak (`""`) kaçışlarını doğru işler.
 */
export function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  // BOM karakterini ve satır sonu boşluklarını temizle
  const clean = text.replace(/^\uFEFF/, '').trim();
  if (!clean) return { headers: [], rows: [] };

  // Satırları ayrıştır
  const rawLines = clean.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (rawLines.length === 0) return { headers: [], rows: [] };

  // Ayırıcıyı tespit et (, veya ;)
  const firstLine = rawLines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ';' : ',';

  function splitLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  const rawHeaders = splitLine(rawLines[0]);
  const headers = rawHeaders.map((h) => h.replace(/^["']|["']$/g, '').trim());

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < rawLines.length; i++) {
    const values = splitLine(rawLines[i]);
    if (values.length === 1 && !values[0]) continue;
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      let val = values[idx] ?? '';
      val = val.replace(/^["']|["']$/g, '').trim();
      row[header] = val;
    });
    rows.push(row);
  }

  return { headers, rows };
}
