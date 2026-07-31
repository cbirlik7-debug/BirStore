import { useState } from 'react';
import { commitShelving } from '../api/shelving.api';
import type { PendingItem } from '../types';

export function CommitButton({
  shelfId,
  items,
  onCommitted,
}: {
  shelfId: string;
  items: PendingItem[];
  onCommitted: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleClick() {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await commitShelving(shelfId, items);
      setSuccess(`İstiflendi: ${items.length} ürün`);
      onCommitted();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'İstifleme başarısız');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="commit-button">
      <button type="button" disabled={items.length === 0 || submitting} onClick={handleClick}>
        {submitting ? 'İstifleniyor...' : 'İstifle'}
      </button>
      {error && <p role="alert">{error}</p>}
      {success && <p>{success}</p>}
    </div>
  );
}
