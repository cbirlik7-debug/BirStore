import { jsPDF } from 'jspdf';
import type { Tutanak } from './types';

const DURUM_LABELS: Record<string, string> = { eksik: 'Eksik', fazla: 'Fazla', hasarli: 'Hasarlı' };

async function fetchAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Fotoğraf okunamadı'));
    reader.readAsDataURL(blob);
  });
}

function detectImageFormat(dataUrl: string): string {
  if (dataUrl.startsWith('data:image/png')) return 'PNG';
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP';
  return 'JPEG';
}

export async function generateTutanakPdf(tutanak: Tutanak): Promise<void> {
  const doc = new jsPDF();
  const marginX = 15;
  let y = 20;

  doc.setFontSize(16);
  doc.text('TUTANAK', marginX, y);
  y += 10;
  doc.setFontSize(11);
  doc.text(`Tutanak No: ${tutanak.tutanakNo}`, marginX, y);
  y += 7;
  doc.text(`Sipariş No: ${tutanak.siparisNo ?? '—'}`, marginX, y);
  y += 7;
  doc.text(`Tarih: ${new Date(tutanak.createdAt).toLocaleString('tr-TR')}`, marginX, y);
  y += 12;

  doc.setFontSize(12);
  doc.text('Satırlar', marginX, y);
  y += 8;
  doc.setFontSize(10);

  for (const line of tutanak.satirlar) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    const urun = line.articleNo ? `${line.articleNo} — ${line.productName ?? ''}` : 'Beklenmeyen ürün';
    doc.text(
      `${DURUM_LABELS[line.durum] ?? line.durum} · ${urun} · Adet: ${line.adet}${line.aciklama ? ` · ${line.aciklama}` : ''}`,
      marginX,
      y,
    );
    y += 7;
  }

  y += 15;
  if (y > 260) {
    doc.addPage();
    y = 20;
  }
  doc.line(marginX, y, marginX + 70, y);
  doc.line(marginX + 100, y, marginX + 170, y);
  y += 5;
  doc.text('Depo Görevlisi', marginX, y);
  doc.text('Tedarikçi Yetkilisi', marginX + 100, y);

  const photoLines = tutanak.satirlar.filter((l) => l.fotoUrl);
  if (photoLines.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Fotoğraflı Kanıtlar', marginX, 20);
    let py = 30;
    for (const line of photoLines) {
      if (!line.fotoUrl) continue;
      try {
        const dataUrl = await fetchAsDataUrl(line.fotoUrl);
        if (py > 200) {
          doc.addPage();
          py = 20;
        }
        doc.setFontSize(10);
        doc.text(
          `${DURUM_LABELS[line.durum] ?? line.durum} · ${line.articleNo ?? 'Beklenmeyen ürün'}`,
          marginX,
          py,
        );
        py += 5;
        doc.addImage(dataUrl, detectImageFormat(dataUrl), marginX, py, 80, 60);
        py += 70;
      } catch {
        // fotoğraf yüklenemedi, PDF'in geri kalanını etkilemesin
      }
    }
  }

  doc.save(`${tutanak.tutanakNo}.pdf`);
}
