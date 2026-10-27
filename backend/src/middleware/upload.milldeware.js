import multer from "multer";


const storage = multer.memoryStorage();

export const upload = multer({ 
  storage,
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      const error = new Error("Please select an image file");
      error.statusCode = 400;
      return callback(error);
    }
    callback(null, true);
  },
  limits: { fileSize: 50 * 1024 * 1024 } 
}).single("file");
