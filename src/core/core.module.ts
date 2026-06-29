import { HttpStatus, Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE, HttpAdapterHost } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { HttpException } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DatabaseService } from '../database/database.service';
import { AllExceptionFilter } from '@libs/common/filters/all-exception.filter';
import { validate } from '@libs/common/validators/env.validator';
import { VALIDATION_ERROR_CODE } from '@libs/common/constants/error-codes';
import jwtConfig from '../config/jwt.config';
import googleConfig from '../config/google.config';
import appConfig from '../config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      load: [jwtConfig, googleConfig, appConfig],
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
      plugins: [
        new ClsPluginTransactional({
          imports: [DatabaseModule],
          adapter: new TransactionalAdapterPrisma({
            prismaInjectionToken: DatabaseService,
          }),
        }),
      ],
    }),
    DatabaseModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
          exceptionFactory: (errors) => {
            const messages = errors.map((e) => ({
              field: e.property,
              message: Object.values(e.constraints ?? {}).join(', '),
            }));
            return new HttpException(
              { code: VALIDATION_ERROR_CODE, errors: messages },
              HttpStatus.BAD_REQUEST,
            );
          },
        }),
    },
    {
      provide: APP_FILTER,
      useFactory: (httpAdapterHost: HttpAdapterHost) => new AllExceptionFilter(httpAdapterHost),
      inject: [HttpAdapterHost],
    },
  ],
  exports: [DatabaseModule],
})
export class CoreModule {}
