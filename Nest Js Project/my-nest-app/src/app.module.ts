// import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
// import { ProductService } from './product/product.service';
// import { ProductController } from './product/product.controller';
// import { EmployeeModule } from './employee/employee.module';
// import { CustomerService } from './customer/customer.service';
// import { CustomerController } from './customer/customer.controller';
// import { MynameController } from './myname/myname.controller';
// import { UserRolesController } from './user-roles/user-roles.controller';
// import { ExceptionController } from './exception/exception.controller';
// import { LoggerMiddleware } from './middleware/logger/logger.middleware';
// import { DatabseService } from './databse/databse.service';
// import { DatabaseController } from './databse/databse.controller';
// import { ConfigModule } from '@nestjs/config';
// import { EvService } from './ev/ev.service';
// import { EvController } from './ev/ev.controller';
// import { MongooseModule } from '@nestjs/mongoose';
// import { UserModule } from './user/user.module';
// import { SportsModule } from './sports/sports.module';

// @Module({
//   imports: [
//     EmployeeModule,
//     ConfigModule.forRoot({
//       envFilePath: '.env',
//       isGlobal: true,
//     }),
//     MongooseModule.forRoot(process.env.DATABASE_URL!),
//     UserModule,
//     SportsModule,
//   ],
//   controllers: [
//     AppController,
//     ProductController,
//     CustomerController,
//     MynameController,
//     UserRolesController,
//     ExceptionController,
//     DatabaseController,
//     EvController,
//   ],
//   providers: [AppService, ProductService, CustomerService, DatabseService, EvService],
// })
// export class AppModule implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer.apply(LoggerMiddleware).forRoutes('*');
//   }
// }

//  POST GREsqL

// import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
// import { ConfigModule } from '@nestjs/config';
// import { LoggerMiddleware } from './middleware/logger/logger.middleware';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { PostgreUserModule } from './postgre-user/postgre-user.module';
// import { Employee2Module } from './post-gre-sql/employee2/employee2.module';
// import { AuthModule } from './auth/post-gre-auth/post-gre-auth.module';

// @Module({
//   imports: [
//     ConfigModule.forRoot({
//       isGlobal: true,
//     }),
//     TypeOrmModule.forRoot({
//       type: 'postgres',
//       // host: 'localhost',
//       // port: 5432,
//       // username: 'adnanhassan1234',
//       // password: 'adnanhassan1234',
//       url: process.env.POSTGRE_DATABASE_URL!,
//       autoLoadEntities: true, // Automatically find your @Entity classes
//       synchronize: true,
//       ssl: {
//         rejectUnauthorized: false,
//       },
//     }),
//     PostgreUserModule,
//     Employee2Module,
//     AuthModule,
//   ],
//   controllers: [],
//   providers: [],
// })
// export class AppModule implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer.apply(LoggerMiddleware).forRoutes('*');
//   }
// }

// again mongoose db databse

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggerMiddleware } from './middleware/logger/logger.middleware';
// import { AuthModule } from './auth/post-gre-auth/post-gre-auth.module';
// import { MongooseModule } from '@nestjs/mongoose';
import { BookModule } from './book/book.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppService } from './app.service';
import { AppController } from './app.controller';
// import { APP_GUARD } from '@nestjs/core';
// import { ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60000,
          limit: 3,
        },
      ],
    }),
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    BookModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard,
    // },
    AppService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
