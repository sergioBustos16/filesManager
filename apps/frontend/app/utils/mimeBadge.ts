export function mimeBadgeLabel(mime: string): string {
  if (mime.includes('pdf')) return 'pdf';
  if (mime.startsWith('image/')) {
    const sub = mime.split('/')[1] ?? 'img';
    return sub.slice(0, 4);
  }
  if (mime.includes('html')) return 'html';
  if (mime.includes('javascript') || mime.includes('typescript')) return 'js';
  if (mime.includes('json')) return 'json';
  const ext = mime.split('/').pop() ?? 'file';
  return ext.slice(0, 6);
}
