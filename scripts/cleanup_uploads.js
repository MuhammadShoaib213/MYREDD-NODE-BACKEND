/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const User = require('../models/User');
const Customer = require('../models/Customer');
const Property = require('../models/Property');
const Note = require('../models/Note');
const Message = require('../models/Message');

const uploadsDir = path.join(__dirname, '..', 'uploads');
const shouldDelete = process.argv.includes('--delete');

const normalizeStoredPath = (value) => {
  if (!value || typeof value !== 'string') return null;
  let s = value.replace(/\\/g, '/');

  if (s.startsWith('http://') || s.startsWith('https://')) {
    const idx = s.indexOf('/uploads/');
    if (idx === -1) return null;
    s = s.slice(idx + '/uploads/'.length);
  } else if (s.startsWith('/uploads/')) {
    s = s.slice('/uploads/'.length);
  } else if (s.startsWith('uploads/')) {
    s = s.slice('uploads/'.length);
  } else if (s.includes('/uploads/')) {
    s = s.split('/uploads/')[1];
  }

  return s;
};

const addPath = (set, value) => {
  const normalized = normalizeStoredPath(value);
  if (normalized) set.add(normalized);
};

const addArray = (set, arr) => {
  if (!Array.isArray(arr)) return;
  arr.forEach((value) => addPath(set, value));
};

const listFiles = (dir, baseDir, out) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listFiles(full, baseDir, out);
      return;
    }
    if (!entry.isFile()) return;
    const rel = path.relative(baseDir, full).replace(/\\/g, '/');
    out.push(rel);
  });
};

const run = async () => {
  if (!fs.existsSync(uploadsDir)) {
    console.error(`Uploads directory not found: ${uploadsDir}`);
    process.exit(1);
  }

  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is required');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const referenced = new Set();

  const users = await User.find({}, 'profilePicture businessLogo').lean();
  users.forEach((u) => {
    addPath(referenced, u.profilePicture);
    addPath(referenced, u.businessLogo);
  });

  const customers = await Customer.find({}, 'profilePicture').lean();
  customers.forEach((c) => addPath(referenced, c.profilePicture));

  const properties = await Property.find({}, 'frontPictures propertyPictures video images').lean();
  properties.forEach((p) => {
    addArray(referenced, p.frontPictures);
    addArray(referenced, p.propertyPictures);
    addArray(referenced, p.images);
    addPath(referenced, p.video);
  });

  const notes = await Note.find({}, 'audioURL').lean();
  notes.forEach((n) => addPath(referenced, n.audioURL));

  const messages = await Message.find({}, 'attachments').lean();
  messages.forEach((m) => {
    if (!Array.isArray(m.attachments)) return;
    m.attachments.forEach((att) => addPath(referenced, att?.url));
  });

  const files = [];
  listFiles(uploadsDir, uploadsDir, files);

  const orphans = files.filter((f) => !referenced.has(f));

  console.log(`Uploads found: ${files.length}`);
  console.log(`Referenced files: ${referenced.size}`);
  console.log(`Orphan files: ${orphans.length}`);

  if (!shouldDelete) {
    console.log('Dry run only. Re-run with --delete to remove orphan files.');
    await mongoose.disconnect();
    return;
  }

  let deleted = 0;
  orphans.forEach((rel) => {
    const full = path.join(uploadsDir, rel);
    try {
      fs.unlinkSync(full);
      deleted += 1;
    } catch (err) {
      console.error(`Failed to delete ${full}: ${err.message}`);
    }
  });

  console.log(`Deleted ${deleted} orphan file(s).`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
