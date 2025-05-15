import multer from 'multer';

const upload = multer({
    storage: multer.memoryStorage(),
})

export default upload;
