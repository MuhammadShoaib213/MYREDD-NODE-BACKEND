// utils/fileCleanup.js
// Utility to safely delete files when records are deleted
// IMPORTANT: Use this when deleting customers or properties with images

const fs = require('fs');
const path = require('path');

/**
 * Safely delete a file from the uploads directory
 * @param {string} filePath - Relative or absolute path to the file
 * @param {string} uploadsDir - Base uploads directory (default from env)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const deleteFile = async (filePath, uploadsDir = process.env.UPLOAD_DIR || 'uploads') => {
  try {
    if (!filePath) {
      return { success: true }; // No file to delete
    }

    // Handle both relative and absolute paths
    let absolutePath = filePath;
    if (!path.isAbsolute(filePath)) {
      absolutePath = path.join(process.cwd(), uploadsDir, filePath);
    }

    // Security: Ensure file is within uploads directory
    const uploadsAbsolute = path.resolve(process.cwd(), uploadsDir);
    const fileAbsolute = path.resolve(absolutePath);
    
    if (!fileAbsolute.startsWith(uploadsAbsolute)) {
      console.error(`[FileCleanup] Security: Attempted to delete file outside uploads: ${filePath}`);
      return { success: false, error: 'Invalid file path' };
    }

    // Check if file exists
    if (!fs.existsSync(fileAbsolute)) {
      return { success: true }; // File already doesn't exist
    }

    // Delete the file
    await fs.promises.unlink(fileAbsolute);
    console.log(`[FileCleanup] Deleted: ${filePath}`);
    return { success: true };

  } catch (error) {
    console.error(`[FileCleanup] Error deleting ${filePath}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Delete multiple files
 * @param {string[]} filePaths - Array of file paths
 * @param {string} uploadsDir - Base uploads directory
 * @returns {Promise<{deleted: number, failed: number, errors: string[]}>}
 */
const deleteFiles = async (filePaths, uploadsDir) => {
  if (!Array.isArray(filePaths) || filePaths.length === 0) {
    return { deleted: 0, failed: 0, errors: [] };
  }

  let deleted = 0;
  let failed = 0;
  const errors = [];

  for (const filePath of filePaths) {
    const result = await deleteFile(filePath, uploadsDir);
    if (result.success) {
      deleted++;
    } else {
      failed++;
      if (result.error) {
        errors.push(`${filePath}: ${result.error}`);
      }
    }
  }

  return { deleted, failed, errors };
};

/**
 * Extract file paths from a record (customer or property)
 * Handles various field names used in your schema
 * @param {Object} record - The database record
 * @returns {string[]} Array of file paths to delete
 */
const extractFilePaths = (record) => {
  if (!record) return [];

  const paths = [];

  // Customer image fields
  if (record.image) paths.push(record.image);
  if (record.imageUrl) paths.push(record.imageUrl);
  if (record.photo) paths.push(record.photo);
  if (record.profileImage) paths.push(record.profileImage);

  // Property image fields (arrays)
  if (Array.isArray(record.images)) {
    paths.push(...record.images);
  }
  if (Array.isArray(record.photos)) {
    paths.push(...record.photos);
  }
  if (Array.isArray(record.frontPictures)) {
    paths.push(...record.frontPictures);
  }
  if (Array.isArray(record.propertyPictures)) {
    paths.push(...record.propertyPictures);
  }

  // Filter out empty/null values and URLs (only delete local files)
  return paths.filter(p => {
    if (!p || typeof p !== 'string') return false;
    // Don't try to delete external URLs
    if (p.startsWith('http://') || p.startsWith('https://')) return false;
    return true;
  });
};

/**
 * Cleanup files when deleting a record
 * Use this in your delete handlers
 * 
 * @example
 * // In your delete route handler:
 * const customer = await Customer.findOneAndDelete({ _id: id, userId: req.user.id });
 * if (customer) {
 *   await cleanupRecordFiles(customer);
 * }
 * 
 * @param {Object} record - The deleted database record
 * @returns {Promise<{deleted: number, failed: number, errors: string[]}>}
 */
const cleanupRecordFiles = async (record) => {
  const filePaths = extractFilePaths(record);
  
  if (filePaths.length === 0) {
    return { deleted: 0, failed: 0, errors: [] };
  }

  console.log(`[FileCleanup] Cleaning up ${filePaths.length} files for record`);
  return await deleteFiles(filePaths);
};

/**
 * Cleanup orphaned files (files not referenced by any record)
 * Run this periodically as a maintenance task
 * 
 * @param {Object} options
 * @param {string} options.uploadsDir - Directory to scan
 * @param {Function} options.isOrphaned - Async function that returns true if file is orphaned
 * @param {boolean} options.dryRun - If true, only report without deleting
 * @returns {Promise<{scanned: number, orphaned: string[], deleted: number}>}
 */
const cleanupOrphanedFiles = async ({ uploadsDir, isOrphaned, dryRun = true }) => {
  const uploadsPath = path.resolve(process.cwd(), uploadsDir || 'uploads');
  
  if (!fs.existsSync(uploadsPath)) {
    return { scanned: 0, orphaned: [], deleted: 0 };
  }

  const files = await fs.promises.readdir(uploadsPath, { withFileTypes: true });
  const orphaned = [];
  let deleted = 0;

  for (const file of files) {
    if (!file.isFile()) continue;

    const filePath = path.join(file.name);
    const orphan = await isOrphaned(filePath);
    
    if (orphan) {
      orphaned.push(filePath);
      
      if (!dryRun) {
        const result = await deleteFile(filePath, uploadsDir);
        if (result.success) deleted++;
      }
    }
  }

  return { scanned: files.length, orphaned, deleted };
};

module.exports = {
  deleteFile,
  deleteFiles,
  extractFilePaths,
  cleanupRecordFiles,
  cleanupOrphanedFiles,
};

/**
 * USAGE EXAMPLES:
 * 
 * // 1. In customer delete route:
 * router.delete('/:id', authenticateToken, async (req, res) => {
 *   const customer = await Customer.findOneAndDelete({
 *     _id: req.params.id,
 *     userId: req.user.id
 *   });
 *   
 *   if (!customer) {
 *     return res.status(404).json({ error: 'Customer not found' });
 *   }
 *   
 *   // Cleanup associated files
 *   const cleanup = await cleanupRecordFiles(customer);
 *   console.log(`Cleaned up ${cleanup.deleted} files`);
 *   
 *   res.json({ success: true });
 * });
 * 
 * // 2. In property delete route:
 * router.delete('/:id', authenticateToken, async (req, res) => {
 *   const property = await Property.findOneAndDelete({
 *     _id: req.params.id,
 *     userId: req.user.id
 *   });
 *   
 *   if (!property) {
 *     return res.status(404).json({ error: 'Property not found' });
 *   }
 *   
 *   // Cleanup all property images
 *   const cleanup = await cleanupRecordFiles(property);
 *   console.log(`Cleaned up ${cleanup.deleted} files, ${cleanup.failed} failed`);
 *   
 *   res.json({ success: true });
 * });
 */
