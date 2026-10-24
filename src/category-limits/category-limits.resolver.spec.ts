import { UnauthorizedException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { GraphQLSchemaBuilderModule, GraphQLSchemaFactory } from '@nestjs/graphql';
import { Test } from '@nestjs/testing';
import { parse, validate } from 'graphql';
import { GqlCategoriesGuard } from '../categories/categories.guard';
import { CategoryLimitsResolver } from './category-limits.resolver';

describe('CategoryLimitsResolver', () => {
  const service = { getLimits: jest.fn(), saveLimits: jest.fn() };
  const resolver = new CategoryLimitsResolver(service as any);

  beforeEach(() => jest.clearAllMocks());

  it('uses authenticated ownership and guards every operation', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, CategoryLimitsResolver)).toContain(GqlCategoriesGuard);
    const context = { req: { user: { _id: 'user-a' } } };
    resolver.getCategoryLimits(context, 2026, 10);
    resolver.saveCategoryLimits(context, 2026, 10, 'month', []);
    expect(service.getLimits).toHaveBeenCalledWith('user-a', 2026, 10);
    expect(service.saveLimits).toHaveBeenCalledWith('user-a', 2026, 10, 'month', []);
    expect(() => resolver.getCategoryLimits({ req: {} }, 2026, 10)).toThrow(UnauthorizedException);
  });

  it('generates the query and batch mutation expected by the frontend', async () => {
    const module = await Test.createTestingModule({ imports: [GraphQLSchemaBuilderModule] }).compile();
    try {
      const schema = await module.get(GraphQLSchemaFactory).create([CategoryLimitsResolver]);
      expect(validate(schema, parse(`
        query GetCategoryLimits($year: Int!, $month: Int!) {
          getCategoryLimits(year: $year, month: $month) {
            categoryId name childOf monthlyLimit defaultLimit isOverride
          }
        }
        mutation SaveCategoryLimits($year: Int!, $month: Int!, $scope: String!, $changes: [CategoryLimitChange!]!) {
          saveCategoryLimits(year: $year, month: $month, scope: $scope, changes: $changes) {
            categoryId name childOf monthlyLimit defaultLimit isOverride
          }
        }
      `))).toEqual([]);
    } finally { await module.close(); }
  });
});
