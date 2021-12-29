import { Module } from '@nestjs/common';
import { AppResolver } from './app.resolver';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { UserModule } from './user/user.module';
import { ExpensesModule } from './expenses/expenses.module';
import { CategoriesService } from './categories/categories.service';
import { CategoriesModule } from './categories/categories.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://midze:kapa1989@cluster0.wvxan.mongodb.net/budget?retryWrites=true&w=majority',
    ),
    GraphQLModule.forRoot({
      autoSchemaFile: true,
      playground: true,
      debug: false,
    }),
    UserModule,
    ExpensesModule,
    CategoriesModule,
  ],
  providers: [AppService, AppResolver],
})
export class AppModule {}