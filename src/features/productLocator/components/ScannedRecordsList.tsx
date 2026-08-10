import type { ScannedRecord } from '../api/productLocator.api';

const SOURCE_LABELS: Record<ScannedRecord['source'], string> = {
  mal_kabul: 'Mal Kabul',
  transfer: 'Transfer/İade',
};

export function ScannedRecordsList({ records }: { records: ScannedRecord[] }) {
  if (records.length === 0) return null;

  return (
    <div className="scanned-records-list">
      <h4>Okutulmuş Kayıtlar</h4>
      <ul>
        {records.map((r) => (
          <li key={r.id}>
            <span className="badge badge-blue">{SOURCE_LABELS[r.source]}</span>
            <span>{r.context}</span>
            {r.siparisNo && <span>Sipariş: {r.siparisNo}</span>}
            {Object.entries(r.identifiers).map(([key, value]) => (
              <span key={key} className="badge">
                {key}: {value}
              </span>
            ))}
            {r.rawBarkod && Object.keys(r.identifiers).length === 0 && <span>{r.rawBarkod}</span>}
            <span>{new Date(r.createdAt).toLocaleString('tr-TR')}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
