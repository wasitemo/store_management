import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/purchase");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const uploadPurchaseMiddleware = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default uploadPurchaseMiddleware;
