import { UnauthorizedException, UseGuards } from '@nestjs/common';
import { Args, Context, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlCategoriesGuard } from '../categories/categories.guard';
import { CategoryLimit, CategoryLimitChange } from './category-limit.entity';
import { CategoryLimitsService } from './category-limits.service';

@Resolver()
@UseGuards(GqlCategoriesGuard)
export class CategoryLimitsResolver {
  constructor(private readonly service: CategoryLimitsService) {}

  private userId(context): string {
    if (!context.req.user?._id) throw new UnauthorizedException();
    return String(context.req.user._id);
  }

  @Query(() => [CategoryLimit])
  getCategoryLimits(
    @Context() context,
    @Args('year', { type: () => Int }) year: number,
    @Args('month', { type: () => Int }) month: number,
  ) {
    return this.service.getLimits(this.userId(context), year, month);
  }

  @Mutation(() => [CategoryLimit])
  saveCategoryLimits(
    @Context() context,
    @Args('year', { type: () => Int }) year: number,
    @Args('month', { type: () => Int }) month: number,
    @Args('scope') scope: string,
    @Args('changes', { type: () => [CategoryLimitChange] }) changes: CategoryLimitChange[],
  ) {
    return this.service.saveLimits(this.userId(context), year, month, scope, changes);
  }
}
