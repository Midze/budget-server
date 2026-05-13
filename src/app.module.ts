import { Module } from '@nestjs/common';
import { AppResolver } from './app.resolver';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { UserModule } from './user/user.module';
import { ExpensesModule } from './expenses/expenses.module';
import { CategoriesModule } from './categories/categories.module';
import { ConfigModule } from '@nestjs/config';
import { ReceiptModule } from './receipt/receipt.module';
import { GlossaryModule } from './glossary/glossary.module';

@Module({
  imports: [
    ConfigModule.forRoot({}), 
    MongooseModule.forRoot(process.env.MONO_DB_CONNECTION_STRING),
    GraphQLModule.forRoot({
      autoSchemaFile: 'schema.gql',
    }),
    UserModule,
    ExpensesModule,
    CategoriesModule,
    ReceiptModule,
    GlossaryModule,
  ],
  providers: [AppService, AppResolver],
})
export class AppModule {}
