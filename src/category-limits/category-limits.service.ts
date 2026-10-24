import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Categories, CategoriesDocument } from '../categories/categories.entity';
import { CategoryLimit, CategoryLimitChange, CategoryLimitDocument, CategoryLimitRecord } from './category-limit.entity';

@Injectable()
export class CategoryLimitsService {
  constructor(
    @InjectModel(CategoryLimitRecord.name) private readonly limits: Model<CategoryLimitDocument>,
    @InjectModel(Categories.name) private readonly categories: Model<CategoriesDocument>,
  ) {}

  private period(year: number, month: number): string {
    if (!Number.isInteger(year) || year < 1900 || year > 9999 ||
      !Number.isInteger(month) || month < 1 || month > 12) {
      throw new BadRequestException('Invalid month');
    }
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  async getLimits(userId: string, year: number, month: number): Promise<CategoryLimit[]> {
    const period = this.period(year, month);
    const [categories, records] = await Promise.all([
      this.categories.find({ userId: { $in: [userId, 'default'] } }).sort({ name: 1 }).exec(),
      this.limits.find({ userId, $or: [
        { scope: 'default', period: { $lte: period } }, { scope: 'month', period },
      ] }).sort({ period: 1 }).exec(),
    ]);
    const defaults = new Map<string, number | null>();
    const overrides = new Map<string, number | null>();
    for (const record of records) {
      (record.scope === 'month' ? overrides : defaults).set(record.categoryId, record.monthlyLimit);
    }
    return categories.map(category => {
      const categoryId = String(category._id);
      const defaultLimit = defaults.has(categoryId) ? defaults.get(categoryId) : null;
      return {
        categoryId, name: category.name, childOf: category.childOf || null,
        defaultLimit, isOverride: overrides.has(categoryId),
        monthlyLimit: overrides.has(categoryId) ? overrides.get(categoryId) : defaultLimit,
      };
    });
  }

  private parentAdjustments(categories: CategoryLimit[], field: 'monthlyLimit' | 'defaultLimit'): Map<string, number> {
    const children = new Map<string, CategoryLimit[]>();
    for (const category of categories) {
      if (category.childOf) children.set(category.childOf, [...(children.get(category.childOf) || []), category]);
    }
    const resolved = new Map<string, number | null>();
    const visiting = new Set<string>();
    const adjustments = new Map<string, number>();
    const resolve = (category: CategoryLimit): number | null => {
      if (resolved.has(category.categoryId)) return resolved.get(category.categoryId);
      if (visiting.has(category.categoryId)) throw new BadRequestException('Invalid category hierarchy');
      visiting.add(category.categoryId);
      const totalCents = (children.get(category.categoryId) || []).reduce((sum, child) => {
        const next = sum + Math.round((resolve(child) || 0) * 100);
        if (!Number.isSafeInteger(next)) throw new BadRequestException('Combined child limits are too large');
        return next;
      }, 0);
      const current = category[field];
      const value = current != null && Math.round(current * 100) < totalCents ? totalCents / 100 : current;
      if (value !== current) adjustments.set(category.categoryId, value);
      visiting.delete(category.categoryId);
      resolved.set(category.categoryId, value);
      return value;
    };
    categories.forEach(resolve);
    return adjustments;
  }

  async saveLimits(userId: string, year: number, month: number, scope: string, changes: CategoryLimitChange[]) {
    const period = this.period(year, month);
    if (!['default', 'month'].includes(scope) || !changes.length || changes.length > 500) {
      throw new BadRequestException('Invalid limit changes');
    }
    if (changes.some(change => !Types.ObjectId.isValid(change.categoryId))) {
      throw new BadRequestException('Invalid categories');
    }
    changes = changes.map(change => ({ ...change, categoryId: new Types.ObjectId(change.categoryId).toHexString() }));
    const ids = changes.map(change => change.categoryId);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Invalid categories');
    }
    for (const change of changes) {
      if (change.resetToDefault && scope !== 'month') throw new BadRequestException('Only monthly overrides can be reset');
      if (change.monthlyLimit != null && (!Number.isFinite(change.monthlyLimit) || change.monthlyLimit < 0 ||
        change.monthlyLimit > Number.MAX_SAFE_INTEGER / 100)) {
        throw new BadRequestException('Limits must be non-negative amounts');
      }
    }
    const accessible = await this.categories.find({
      _id: { $in: ids }, userId: { $in: [userId, 'default'] },
    }).exec();
    if (accessible.length !== ids.length) throw new BadRequestException('Category not found');
    const current = await this.getLimits(userId, year, month);
    const byId = new Map(current.map(limit => [limit.categoryId, limit]));
    const operations = [];
    const setLimit = (categoryId: string, recordScope: string, monthlyLimit: number | null) => {
      operations.push({ updateOne: { filter: { userId, categoryId, period, scope: recordScope },
        update: { $set: { monthlyLimit } }, upsert: true } });
    };
    for (const change of changes) {
      const limit = byId.get(change.categoryId);
      const filter = { userId, categoryId: change.categoryId, period, scope };
      if (change.resetToDefault) {
        operations.push({ deleteOne: { filter } });
        limit.monthlyLimit = limit.defaultLimit;
        limit.isOverride = false;
      } else {
        const monthlyLimit = change.monthlyLimit == null ? null
          : Math.round((change.monthlyLimit + Number.EPSILON) * 100) / 100;
        setLimit(change.categoryId, scope, monthlyLimit);
        limit.monthlyLimit = monthlyLimit;
        limit.isOverride = scope === 'month';
        // Applying a new default also makes it effective in the selected month.
        if (scope === 'default') {
          limit.defaultLimit = monthlyLimit;
          operations.push({ deleteOne: { filter: { ...filter, scope: 'month' } } });
        }
      }
    }
    // Recurring limits and one-month exceptions must not leak into each other's scope.
    if (scope === 'default') {
      for (const [categoryId, amount] of this.parentAdjustments(current, 'defaultLimit')) {
        const limit = byId.get(categoryId);
        limit.defaultLimit = amount;
        if (!limit.isOverride) limit.monthlyLimit = amount;
        setLimit(categoryId, 'default', amount);
      }
    }
    for (const [categoryId, amount] of this.parentAdjustments(current, 'monthlyLimit')) {
      setLimit(categoryId, 'month', amount);
    }
    await this.limits.bulkWrite(operations);
    return this.getLimits(userId, year, month);
  }
}
