const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

let supabase = null;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'ddcet-resources';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (process.env.SUPABASE_URL && supabaseKey) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(process.env.SUPABASE_URL, supabaseKey, {
      auth: { persistSession: false }
    });
    console.log(`[Storage] Initialized Supabase Storage client (Bucket: ${BUCKET})`);
  } catch (err) {
    console.warn(`[Storage] Failed to initialize Supabase client:`, err.message);
  }
} else {
  console.log(`[Storage] Supabase credentials not found. Using local disk storage in server/uploads.`);
}

/**
 * Validates that buffer starts with '%PDF-' magic bytes (0x25, 0x50, 0x44, 0x46)
 */
const validatePdfBuffer = (buffer) => {
  if (!buffer || buffer.length < 5) {
    throw new Error('File buffer is empty or too small.');
  }
  const magic = buffer.subarray(0, 5).toString('ascii');
  if (!magic.startsWith('%PDF')) {
    throw new Error('Invalid file signature. Uploaded file is not a valid PDF document.');
  }
};

/**
 * Sanitizes filename to prevent directory traversal and special character injection
 */
const sanitizeFilename = (originalname) => {
  const ext = path.extname(originalname).toLowerCase() || '.pdf';
  if (ext !== '.pdf') {
    throw new Error('Only .pdf files are permitted.');
  }
  const base = path.basename(originalname, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 50);
  const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1e6);
  return `${base || 'document'}_${uniqueId}${ext}`;
};

/**
 * Upload a resource file (PDF) to Supabase Storage or local disk fallback
 */
const uploadResourceFile = async ({ buffer, originalname, category = 'general' }) => {
  validatePdfBuffer(buffer);
  const safeFilename = sanitizeFilename(originalname);
  const safeCategory = category.replace(/[^a-zA-Z0-9_-]/g, '') || 'resources';

  if (supabase) {
    const storagePath = `${safeCategory}/${safeFilename}`;
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (error) {
      throw new Error(`Supabase Storage upload failed: ${error.message}`);
    }

    const { data: publicData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(storagePath);

    return {
      storageType: 'supabase',
      storagePath,
      fileUrl: publicData.publicUrl,
      fileSize: buffer.length
    };
  }

  // Local disk fallback
  const localFilePath = path.join(uploadsDir, safeFilename);
  fs.writeFileSync(localFilePath, buffer);
  return {
    storageType: 'local',
    storagePath: safeFilename,
    fileUrl: `/uploads/${safeFilename}`,
    fileSize: buffer.length
  };
};

/**
 * Safely generate a signed URL for a file in Supabase Storage if configured,
 * or return the original URL / relative path.
 */
const getSignedUrl = async (filePathOrUrl, expiresIn = 3600) => {
  if (!filePathOrUrl) return null;

  try {
    if (supabase && filePathOrUrl.includes(BUCKET)) {
      const parts = filePathOrUrl.split(`${BUCKET}/`);
      if (parts.length > 1) {
        const storagePath = decodeURIComponent(parts[1].split('?')[0]);
        const { data, error } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(storagePath, expiresIn);

        if (!error && data?.signedUrl) {
          return data.signedUrl;
        }
      }
    }
  } catch (err) {
    console.warn('[Storage] Error creating signed URL:', err.message);
  }

  return filePathOrUrl;
};

/**
 * Safely delete a resource file
 */
const deleteResourceFile = async (filePathOrUrl) => {
  if (!filePathOrUrl) return false;

  try {
    if (supabase && filePathOrUrl.includes(BUCKET)) {
      // Extract relative path inside bucket from URL
      const parts = filePathOrUrl.split(`${BUCKET}/`);
      if (parts.length > 1) {
        const storagePath = decodeURIComponent(parts[1].split('?')[0]);
        const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
        if (error) console.warn('[Storage] Error deleting from Supabase:', error.message);
        return !error;
      }
    }

    // Check if local file
    if (filePathOrUrl.startsWith('/uploads/')) {
      const filename = path.basename(filePathOrUrl);
      const safePath = path.resolve(uploadsDir, filename);
      // Prevent directory traversal
      if (safePath.startsWith(uploadsDir) && fs.existsSync(safePath)) {
        fs.unlinkSync(safePath);
        return true;
      }
    }
  } catch (err) {
    console.warn(`[Storage] Failed to delete file ${filePathOrUrl}:`, err.message);
  }
  return false;
};

module.exports = {
  uploadResourceFile,
  deleteResourceFile,
  validatePdfBuffer,
  sanitizeFilename,
  getSignedUrl,
  isSupabaseConfigured: () => Boolean(supabase)
};
