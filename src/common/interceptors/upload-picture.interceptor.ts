import * as path from 'path';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor, mixin, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

export function UploadPictureInterceptorFactory(fieldName: string) {
  @Injectable()
  class UploadPictureInterceptor implements NestInterceptor {
    public readonly interceptor: NestInterceptor;

    constructor(public configService: ConfigService) {
      const uploadOptions = {
        fileFilter: (req, file, cb) => {
          const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
          if (!allowedMimeTypes.includes(file.mimetype)) {
            return cb(new BadRequestException( 'Only jpg, jpeg, and png image types are allowed!'), false);
          }
          if (file.size > 2 * 1024 * 1024) {
            return cb(new BadRequestException('Max file size is 2MB'), false);
          }
          cb(null, true);
        },
        storage: diskStorage({
          destination: this.configService.get<string>('NODE_ENV') === 'production'
            ? `/var/www/uploads/${fieldName}`
            : `./uploads/${fieldName}`,
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
          },
        }),
      };

      this.interceptor = new (FileInterceptor(fieldName, uploadOptions))();
    }

    intercept(context: ExecutionContext, next: CallHandler) {
      return this.interceptor.intercept(context, next);
    }
  }

  return mixin(UploadPictureInterceptor);
}
