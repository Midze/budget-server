import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Categories, CategoriesSchema } from '../categories/categories.entity';
import { CategoryLimitRecord, CategoryLimitSchema } from './category-limit.entity';
import { CategoryLimitsService } from './category-limits.service';
import { CategoryLimitsResolver } from './category-limits.resolver';

@Module({
  imports: [MongooseModule.forFeature([
    { name: CategoryLimitRecord.name, schema: CategoryLimitSchema },
    { name: Categories.name, schema: CategoriesSchema },
  ])],
  providers: [CategoryLimitsService, CategoryLimitsResolver],
})
export class CategoryLimitsModule {}
