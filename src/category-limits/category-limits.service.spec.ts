import { BadRequestException } from '@nestjs/common';
import { CategoryLimitsService } from './category-limits.service';
import { CategoryLimitSchema } from './category-limit.entity';

const food = '61eafc104b88e154caa58616';
const cafe = '61eafc104b88e154caa58617';
const groceries = '61eafc104b88e154caa58619';
const privateCategory = '61eafc104b88e154caa58618';
const query = rows => ({
  exec: jest.fn().mockResolvedValue(rows),
  sort: jest.fn().mockImplementation(order => query([...rows].sort((a, b) => {
    const field = Object.keys(order)[0];
    return String(a[field]).localeCompare(String(b[field]));
  }))),
});

describe('CategoryLimitsService', () => {
  let records;
  let limits;
  let categories;
  let service: CategoryLimitsService;

  beforeEach(() => {
    records = [];
    const categoryRows = [
      { _id: food, name: 'food', userId: 'default', childOf: null },
      { _id: cafe, name: 'cafe', userId: 'user-a', childOf: food },
      { _id: groceries, name: 'groceries', userId: 'user-a', childOf: food },
      { _id: privateCategory, name: 'private', userId: 'user-b', childOf: null },
    ];
    categories = { find: jest.fn().mockImplementation(filter => query(categoryRows.filter(row =>
      filter.userId.$in.includes(row.userId) && (!filter._id || filter._id.$in.includes(row._id)),
    ))) };
    limits = {
      find: jest.fn().mockImplementation(filter => query(records.filter(record =>
        record.userId === filter.userId && (record.scope === 'default'
          ? record.period <= filter.$or[0].period.$lte : record.period === filter.$or[1].period),
      ))),
      bulkWrite: jest.fn().mockImplementation(async operations => {
        for (const operation of operations) {
          const { filter } = operation.updateOne || operation.deleteOne;
          const index = records.findIndex(record => Object.entries(filter).every(([key, value]) => record[key] === value));
          if (operation.deleteOne) { if (index >= 0) records.splice(index, 1); }
          else {
            const next = { ...filter, ...operation.updateOne.update.$set };
            if (index >= 0) records[index] = next;
            else records.push(next);
          }
        }
      }),
    };
    service = new CategoryLimitsService(limits, categories);
  });

  const foodLimit = (result) => result.find(limit => limit.categoryId === food);

  it('keeps default history and applies a monthly override only to its month', async () => {
    await service.saveLimits('user-a', 2026, 9, 'default', [{ categoryId: food, monthlyLimit: 400 }]);
    await service.saveLimits('user-a', 2026, 10, 'month', [{ categoryId: food, monthlyLimit: 500 }]);
    await service.saveLimits('user-a', 2026, 11, 'default', [{ categoryId: food, monthlyLimit: 450 }]);
    expect(foodLimit(await service.getLimits('user-a', 2026, 8)).monthlyLimit).toBeNull();
    expect(foodLimit(await service.getLimits('user-a', 2026, 9)).monthlyLimit).toBe(400);
    expect(foodLimit(await service.getLimits('user-a', 2026, 10))).toMatchObject({ monthlyLimit: 500, defaultLimit: 400, isOverride: true });
    expect(foodLimit(await service.getLimits('user-a', 2026, 11)).monthlyLimit).toBe(450);
    expect(foodLimit(await service.getLimits('user-a', 2027, 1)).monthlyLimit).toBe(450);
  });

  it('supports zero, disabling a limit for one month, and restoring its default', async () => {
    await service.saveLimits('user-a', 2026, 9, 'default', [{ categoryId: food, monthlyLimit: 400 }]);
    await service.saveLimits('user-a', 2026, 10, 'month', [{ categoryId: food, monthlyLimit: 0 }]);
    expect(foodLimit(await service.getLimits('user-a', 2026, 10)).monthlyLimit).toBe(0);
    await service.saveLimits('user-a', 2026, 10, 'month', [{ categoryId: food, monthlyLimit: null }]);
    expect(foodLimit(await service.getLimits('user-a', 2026, 10))).toMatchObject({ monthlyLimit: null, defaultLimit: 400, isOverride: true });
    await service.saveLimits('user-a', 2026, 10, 'month', [{ categoryId: food, resetToDefault: true }]);
    expect(foodLimit(await service.getLimits('user-a', 2026, 10))).toMatchObject({ monthlyLimit: 400, isOverride: false });
  });

  it('makes a new default effective immediately and preserves earlier months', async () => {
    await service.saveLimits('user-a', 2026, 9, 'default', [{ categoryId: food, monthlyLimit: 400 }]);
    await service.saveLimits('user-a', 2026, 10, 'month', [{ categoryId: food, monthlyLimit: 600 }]);
    await service.saveLimits('user-a', 2026, 10, 'default', [{ categoryId: food, monthlyLimit: 500 }]);
    expect(foodLimit(await service.getLimits('user-a', 2026, 10))).toMatchObject({ monthlyLimit: 500, isOverride: false });
    expect(foodLimit(await service.getLimits('user-a', 2026, 9)).monthlyLimit).toBe(400);
  });

  it('keeps shared-category limits personal and supports child categories', async () => {
    await service.saveLimits('user-a', 2026, 10, 'default', [
      { categoryId: food, monthlyLimit: 400 }, { categoryId: cafe, monthlyLimit: 100 },
    ]);
    await service.saveLimits('user-b', 2026, 10, 'default', [{ categoryId: food, monthlyLimit: 200 }]);
    expect(foodLimit(await service.getLimits('user-a', 2026, 10)).monthlyLimit).toBe(400);
    expect(foodLimit(await service.getLimits('user-b', 2026, 10)).monthlyLimit).toBe(200);
    expect((await service.getLimits('user-a', 2026, 10)).find(limit => limit.categoryId === cafe))
      .toMatchObject({ monthlyLimit: 100, childOf: food });
    expect((await service.getLimits('user-a', 2026, 10)).some(limit => limit.categoryId === privateCategory)).toBe(false);
  });

  it('rejects invalid batches before writing any limits', async () => {
    const invalidBatches = [
      [{ categoryId: food, monthlyLimit: -1 }],
      [{ categoryId: food, monthlyLimit: NaN }],
      [{ categoryId: food, monthlyLimit: Infinity }],
      [{ categoryId: food, monthlyLimit: Number.MAX_SAFE_INTEGER }],
      [{ categoryId: food }, { categoryId: food }],
      [{ categoryId: 'invalid' }],
      [{ categoryId: food, monthlyLimit: 400 }, { categoryId: privateCategory, monthlyLimit: 100 }],
    ];
    for (const changes of invalidBatches) {
      await expect(service.saveLimits('user-a', 2026, 10, 'month', changes)).rejects.toBeInstanceOf(BadRequestException);
    }
    await expect(service.saveLimits('user-a', 2026, 10, 'invalid', [{ categoryId: food }])).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.saveLimits('user-a', 2026, 10, 'default', [{ categoryId: food, resetToDefault: true }])).rejects.toBeInstanceOf(BadRequestException);
    expect(limits.bulkWrite).not.toHaveBeenCalled();
  });

  it('validates the period and stores amounts rounded to cents under a unique version key', async () => {
    for (const [year, month] of [[2026, 0], [2026, 13], [2026, 1.5], [NaN, 1]]) {
      await expect(service.getLimits('user-a', year, month)).rejects.toBeInstanceOf(BadRequestException);
    }
    await service.saveLimits('user-a', 2026, 10, 'default', [{ categoryId: food, monthlyLimit: 12.345 }]);
    expect(foodLimit(await service.getLimits('user-a', 2026, 10)).monthlyLimit).toBe(12.35);
    expect(CategoryLimitSchema.indexes()).toEqual(expect.arrayContaining([
      [expect.objectContaining({ userId: 1, categoryId: 1, scope: 1, period: 1 }), expect.objectContaining({ unique: true })],
    ]));
  });

  it('raises a recurring parent to the sum of edited and unchanged child limits', async () => {
    await service.saveLimits('user-a', 2026, 9, 'default', [
      { categoryId: food, monthlyLimit: 300 }, { categoryId: cafe, monthlyLimit: 100 },
      { categoryId: groceries, monthlyLimit: 150 },
    ]);
    const result = await service.saveLimits('user-a', 2026, 10, 'default', [{ categoryId: cafe, monthlyLimit: 200 }]);
    expect(foodLimit(result)).toMatchObject({ monthlyLimit: 350, defaultLimit: 350, isOverride: false });
    expect(records).toContainEqual({ userId: 'user-a', categoryId: food, period: '2026-10', scope: 'default', monthlyLimit: 350 });
    expect(foodLimit(await service.getLimits('user-a', 2026, 9)).monthlyLimit).toBe(300);
    expect(foodLimit(await service.getLimits('user-a', 2026, 11)).monthlyLimit).toBe(350);
  });

  it('enforces the minimum when lowering a parent in a batch regardless of change order', async () => {
    for (const changes of [
      [{ categoryId: food, monthlyLimit: 50 }, { categoryId: cafe, monthlyLimit: 80 }, { categoryId: groceries, monthlyLimit: 90 }],
      [{ categoryId: groceries, monthlyLimit: 90 }, { categoryId: cafe, monthlyLimit: 80 }, { categoryId: food, monthlyLimit: 50 }],
    ]) {
      expect(foodLimit(await service.saveLimits('user-a', 2026, 10, 'default', changes)))
        .toMatchObject({ monthlyLimit: 170, defaultLimit: 170, isOverride: false });
    }
  });

  it('adjusts only the selected month for a monthly child exception and for a reset', async () => {
    await service.saveLimits('user-a', 2026, 9, 'default', [
      { categoryId: food, monthlyLimit: 300 }, { categoryId: cafe, monthlyLimit: 200 },
      { categoryId: groceries, monthlyLimit: 100 },
    ]);
    const result = await service.saveLimits('user-a', 2026, 10, 'month', [{ categoryId: cafe, monthlyLimit: 250 }]);
    expect(foodLimit(result)).toMatchObject({ monthlyLimit: 350, defaultLimit: 300, isOverride: true });
    expect(foodLimit(await service.getLimits('user-a', 2026, 11)).monthlyLimit).toBe(300);
    expect(foodLimit(await service.saveLimits('user-a', 2026, 10, 'month', [{ categoryId: food, resetToDefault: true }])))
      .toMatchObject({ monthlyLimit: 350, defaultLimit: 300, isOverride: true });
    await service.saveLimits('user-a', 2026, 10, 'month', [
      { categoryId: cafe, monthlyLimit: 50 }, { categoryId: food, monthlyLimit: 150 },
    ]);
    expect(foodLimit(await service.saveLimits('user-a', 2026, 10, 'month', [{ categoryId: cafe, resetToDefault: true }])))
      .toMatchObject({ monthlyLimit: 300, defaultLimit: 300, isOverride: true });
  });

  it('does not copy one-month child exceptions into a recurring parent limit', async () => {
    await service.saveLimits('user-a', 2026, 9, 'default', [
      { categoryId: food, monthlyLimit: 300 }, { categoryId: cafe, monthlyLimit: 100 },
      { categoryId: groceries, monthlyLimit: 100 },
    ]);
    await service.saveLimits('user-a', 2026, 10, 'month', [{ categoryId: cafe, monthlyLimit: 600 }]);
    const result = await service.saveLimits('user-a', 2026, 10, 'default', [{ categoryId: groceries, monthlyLimit: 250 }]);
    expect(foodLimit(result)).toMatchObject({ monthlyLimit: 850, defaultLimit: 350, isOverride: true });
    expect(foodLimit(await service.getLimits('user-a', 2026, 11)).monthlyLimit).toBe(350);
  });

  it('keeps unlimited and larger parents unchanged and handles zero and cents exactly', async () => {
    expect(foodLimit(await service.saveLimits('user-a', 2026, 10, 'default', [
      { categoryId: cafe, monthlyLimit: 100 },
    ])).monthlyLimit).toBeNull();
    expect(foodLimit(await service.saveLimits('user-a', 2026, 10, 'default', [
      { categoryId: food, monthlyLimit: 500 }, { categoryId: cafe, monthlyLimit: 50 },
    ])).monthlyLimit).toBe(500);
    expect(foodLimit(await service.saveLimits('user-a', 2026, 10, 'default', [
      { categoryId: food, monthlyLimit: 0 }, { categoryId: cafe, monthlyLimit: 0.1 },
      { categoryId: groceries, monthlyLimit: 0.2 },
    ])).monthlyLimit).toBe(0.3);
    expect(foodLimit(await service.saveLimits('user-a', 2026, 10, 'default', [
      { categoryId: cafe, monthlyLimit: null }, { categoryId: groceries, monthlyLimit: 0 },
    ])).monthlyLimit).toBe(0.3);
  });

  it('rejects overflowing child totals before writing and canonicalizes category IDs', async () => {
    await expect(service.saveLimits('user-a', 2026, 10, 'default', [
      { categoryId: food, monthlyLimit: 100 }, { categoryId: cafe, monthlyLimit: 60000000000000 },
      { categoryId: groceries, monthlyLimit: 60000000000000 },
    ])).rejects.toBeInstanceOf(BadRequestException);
    expect(limits.bulkWrite).not.toHaveBeenCalled();
    expect(foodLimit(await service.saveLimits('user-a', 2026, 10, 'default', [
      { categoryId: food.toUpperCase(), monthlyLimit: 100 },
    ])).monthlyLimit).toBe(100);
    await expect(service.saveLimits('user-a', 2026, 10, 'default', [
      { categoryId: food, monthlyLimit: 100 }, { categoryId: food.toUpperCase(), monthlyLimit: 200 },
    ])).rejects.toBeInstanceOf(BadRequestException);
  });
});
