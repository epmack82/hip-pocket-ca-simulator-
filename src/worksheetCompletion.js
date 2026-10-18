import { getProductWorksheet } from './productTemplates';

// Measure actual entries against the expected scaffold, not disappearance of
// placeholders. Removing a blank field or pasting unrelated prose earns zero.
export function worksheetCompletion(name, scenario = {}, content = '') {
  const template = getProductWorksheet(name, scenario);
  const lines = template.split('\n');
  const entries = String(content).split('\n');
  let total = 0;
  let completed = 0;
  const placeholder = '[Trainee entry required]';
  const used = new Set();
  lines.forEach((line, index) => {
    if (!line.includes(placeholder)) return;
    total += 1;
    const prefix = line.slice(0, line.indexOf(placeholder));
    const suffix = line.slice(line.indexOf(placeholder) + placeholder.length);
    const anchor = prefix.trim() || lines.slice(0, index).reverse().find(value => value.trim()) || '';
    const found = entries.findIndex((value, i) => !used.has(i) && (prefix.trim() ? value.startsWith(prefix) : value === anchor));
    if (found < 0) return;
    const value = prefix.trim() ? entries[found].slice(prefix.length) : entries[found + 1] || '';
    const answer = (suffix && value.endsWith(suffix) ? value.slice(0, -suffix.length) : value).trim();
    if (!answer || answer.includes(placeholder) || /^[_.\-\s]+$/.test(answer)) return;
    // A new heading immediately after a deleted standalone placeholder is not an entry.
    if (!prefix.trim() && lines.includes(answer)) return;
    used.add(found);
    completed += 1;
  });
  return { total, completed, percent: total ? Math.round(100 * completed / total) : 0 };
}
