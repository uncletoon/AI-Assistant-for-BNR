import multer from 'multer';

// Memory storage to process buffers directly with Gemini 3 Flash / pdf parsers
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max per document
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'text/plain',
      'text/csv',
      'application/octet-stream',
    ];
    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(pdf|png|jpe?g|txt|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Please upload a PDF, PNG, JPG, or TXT file.`));
    }
  },
});
