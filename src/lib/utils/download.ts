export function downloadBlob(content: Blob | string, filename: string, mimeType = 'text/plain'): void {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(text: string, filename: string, mimeType = 'text/plain'): void {
  downloadBlob(text, filename, mimeType);
}

export function safeFilename(value: string): string {
  return value.replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'echo-export';
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}`));
    reader.readAsText(file);
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}
