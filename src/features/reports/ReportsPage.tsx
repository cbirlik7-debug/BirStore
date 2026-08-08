import { useState } from 'react';
import { UnexpectedProductsPanel } from './components/UnexpectedProductsPanel';
import { DuplicateRecordsPanel } from './components/DuplicateRecordsPanel';
import { SupplierPerformancePanel } from './components/SupplierPerformancePanel';
import { DailyReportPanel } from './components/DailyReportPanel';

type Tab = 'beklenmeyen' | 'mukerrer' | 'tedarikci' | 'gunluk';

const TABS: { id: Tab; label: string }[] = [
  { id: 'beklenmeyen', label: 'Beklenmeyen Ürünler' },
  { id: 'mukerrer', label: 'Mükerrer Kayıtlar' },
  { id: 'tedarikci', label: 'Tedarikçi Performansı' },
  { id: 'gunluk', label: 'Günlük Rapor' },
];

export function ReportsPage() {
  const [tab, setTab] = useState<Tab>('beklenmeyen');

  return (
    <div className="reports-page">
      <h2>Raporlar</h2>
      <div className="reports-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? 'reports-tab active' : 'reports-tab'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'beklenmeyen' && <UnexpectedProductsPanel />}
      {tab === 'mukerrer' && <DuplicateRecordsPanel />}
      {tab === 'tedarikci' && <SupplierPerformancePanel />}
      {tab === 'gunluk' && <DailyReportPanel />}
    </div>
  );
}
