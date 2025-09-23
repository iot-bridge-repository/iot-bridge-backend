import * as path from 'path';
import * as fs from 'fs';
import { Injectable, ExecutionContext, CallHandler, NestInterceptor, mixin, Logger, BadRequestException,  } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export function UploadPictureInterceptorFactory(fieldName: string) {
  @Injectable()
  class UploadPictureInterceptor implements NestInterceptor {
    public readonly logger = new Logger("UploadPictureInterceptor");
    public readonly interceptor: NestInterceptor;
    constructor(public configService: ConfigService) {
      this.interceptor = new (FileInterceptor(fieldName, {
        fileFilter: (req, file, cb) => {
          const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
          if (!allowedMimeTypes.includes(file.mimetype)) {
            this.logger.warn(`UploadPictureInterceptor: Failed to upload file. Invalid file type: ${file.mimetype}`);
            return cb(new BadRequestException('Only jpg, jpeg, and png image types are allowed!'), false);
          }
          if (file.size > 2 * 1024 * 1024) {
            this.logger.warn(`UploadPictureInterceptor: Failed to upload file. File size exceeds limit: ${file.size}`);
            return cb(new BadRequestException('Max file size is 2MB'), false);
          }
          cb(null, true);
        },
        storage: diskStorage({
          destination: `./uploads/${fieldName}`,
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
          },
        }),
      }))();
    }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
      // Run Interceptors (pre-handler)
      this.logger.log('UploadPictureInterceptor: Intercepting request for file upload...');
      await this.interceptor.intercept(context, next);

      // Run Interceptors (post-handler)
      return next.handle().pipe(
        catchError((err) => {
          const request = context.switchToHttp().getRequest();
          if (request.file) {
            try {
              this.logger.log(`UploadPictureInterceptor: Deleting file due to error: ${err.message}`);
              fs.unlinkSync(request.file.path);
            } catch (err) {
              this.logger.error(`UploadPictureInterceptor: Failed to delete file ${request.file.path}: ${err.message}`);
            }
          }
          return throwError(() => err);
        }),
      );
    }
  }

  return mixin(UploadPictureInterceptor);
}