const path = require('path');

const buildAssetUrl = (req, value) => {
  if (!value || typeof value !== 'string') return value;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;

  const normalized = value.replace(/\\/g, '/');
  let relative = normalized;

  if (normalized.startsWith('/uploads/')) {
    relative = normalized;
  } else if (normalized.startsWith('uploads/')) {
    relative = `/${normalized}`;
  } else if (normalized.includes('/uploads/')) {
    relative = normalized.slice(normalized.indexOf('/uploads/'));
  } else {
    relative = `/uploads/${path.basename(normalized)}`;
  }

  if (!req) return relative;
  const base = `${req.protocol}://${req.get('host')}`;
  return encodeURI(`${base}${relative}`);
};

module.exports = { buildAssetUrl };
