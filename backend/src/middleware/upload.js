import multer from "multer";

const maxBytes = 10 * 1024 * 1024; // 10 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxBytes, files: 2 },
  fileFilter(_req, file, cb) {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF uploads are allowed"));
      return;
    }
    cb(null, true);
  },
});

export const uploadResumeAndJd = upload.fields([
  { name: "resume", maxCount: 1 },
  { name: "jobDescription", maxCount: 1 },
]);

/** Optional single PDF for /api/send (multipart) */
export const uploadOptionalResume = upload.single("resume");
