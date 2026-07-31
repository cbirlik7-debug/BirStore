import { useState } from 'react';
import type { FormEvent } from 'react';
import { ScannerInput } from '../../../shared/scanner/ScannerInput';

export function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [text, setText] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (text.trim()) onSearch(text.trim());
  }

  return (
    <div className="search-bar">
      <p>Ürün EAN'ını okutun veya artikel numarasıyla arayın.</p>
      <ScannerInput onScan={onSearch} placeholder="EAN okutun" />
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Artikel no ara"
        />
        <button type="submit">Ara</button>
      </form>
    </div>
  );
}
