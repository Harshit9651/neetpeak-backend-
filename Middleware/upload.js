const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (allowedTypes = []) => {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Only ${allowedTypes.join(', ')} files are allowed`), false);
    }
  };
};

const uploadFile = (allowedExtensions = []) => {
  return multer({ storage, fileFilter: fileFilter(allowedExtensions) });
};

const uploadImagesArray = multer({
  storage,
  fileFilter: fileFilter([".jpg", ".jpeg", ".png", ".webp"]),
}).array("images", 10);

const uploadVideoAndThumbnail = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const videoTypes = ['.mp4', '.mov', '.avi'];
    const imageTypes = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (
      (file.fieldname === 'video' && videoTypes.includes(ext)) ||
      (file.fieldname === 'thumbnail' && imageTypes.includes(ext))
    ) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type for field "${file.fieldname}".`), false);
    }
  },
}).fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);
const uploadBlogMedia = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (
      (file.fieldname === 'images' || file.fieldname === 'thumbnail') &&
      allowedImageTypes.includes(ext)
    ) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type for "${file.fieldname}".`), false);
    }
  },
}).fields([
  { name: 'images', maxCount: 10 },
  { name: 'thumbnail', maxCount: 1 },
]);


module.exports = {
  uploadImage: uploadFile(['.jpg', '.jpeg', '.png']),
  uploadVideo: uploadFile(['.mp4', '.mov', '.avi']),
  uploadXLS: uploadFile(['.xls', '.xlsx']),
  uploadPDF: uploadFile(['.pdf']),
  uploadAny: multer({ storage }),
  uploadImagesArray,
  uploadVideoAndThumbnail,
  uploadBlogMedia, 
};
