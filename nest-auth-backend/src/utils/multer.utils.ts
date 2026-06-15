/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { diskStorage } from 'multer';
import { extname } from 'path';

export const multerOptions = {
  storage: diskStorage({
    destination: './uploads',

    filename: (req, file, callback) => {
      const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);

      callback(null, uniqueName + extname(file.originalname));
    },
  }),

  limits: {
    fileSize: 1024 * 1024 * 5,
  },

  fileFilter: (req, file, callback) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|pdf|webp)$/i)) {
      return callback(new Error('Only image/pdf files allowed'), false);
    }

    callback(null, true);
  },
};
