// src/app.module.ts
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserService } from './user/user.service';
import { UserResolver } from './user/user.resolver';
import { UserModule } from './user/user.module';
import { userProviders } from './user/user.providers';
import { databaseProviders } from './database/database.providers';
import { DatabaseModule } from './database/database.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ExpensesService } from './expenses/expenses.service';
import { ExpensesResolver } from './expenses/expenses.resolver';
import { expensesProviders } from './expenses/expenses.providers';

@Module({
  imports: [
    GraphQLModule.forRoot({
      autoSchemaFile: 'schema.gql',
    }),
    UserModule,
    ExpensesModule,
    DatabaseModule,
  ],
  // controllers: [AppController],
  providers: [
    AppService,
    ExpensesService,
    ExpensesResolver,
    ...databaseProviders,
    ...userProviders,
    ...expensesProviders,
  ],
})
export class AppModule {}
