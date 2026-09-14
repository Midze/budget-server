import axios from 'axios';
import { ReceiptService } from './receipt.service';

jest.mock('axios', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));
jest.mock('../expenses/expenses.service', () => ({ ExpensesService: class {} }));

describe('ReceiptService category matching', () => {
  const foodCategory = {
    _id: '61cbeee614376b38d308a8d6',
    name: 'food',
    childOf: null,
  };

  let service: ReceiptService;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key';
    service = new ReceiptService(
      { find: jest.fn().mockResolvedValue([foodCategory]) } as any,
      { findAll: jest.fn().mockResolvedValue([]) } as any,
      {} as any,
      {} as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
  });

  it('normalizes a model category id that contains the category name suffix', async () => {
    (axios.post as jest.Mock).mockResolvedValue({
      data: {
        choices: [
          {
            message: {
              content: JSON.stringify({
                merchantName: 'Test',
                receiptDate: null,
                total: '1.00',
                items: [
                  {
                    name: 'Kartoffeln',
                    price: '1.00',
                    categoryId: `${foodCategory._id}|${foodCategory.name}`,
                    categoryName: foodCategory.name,
                  },
                ],
              }),
            },
          },
        ],
      },
    } as any);

    const result = await (service as any).extractReceiptData({
      userId: 'user-id',
      fileBase64: 'AA==',
      fileType: 'image/jpeg',
    });

    expect(result.items[0]).toEqual({
      name: 'Kartoffeln',
      price: '1.00',
      categoryId: foodCategory._id,
      categoryName: foodCategory.name,
    });
  });

  it('matches a category by name when the model omits the category id', async () => {
    (axios.post as jest.Mock).mockResolvedValue({
      data: {
        choices: [
          {
            message: {
              content: JSON.stringify({
                merchantName: 'Test',
                receiptDate: null,
                total: '1.00',
                items: [
                  {
                    name: 'Kartoffeln',
                    price: '1.00',
                    categoryId: null,
                    categoryName: ' Food ',
                  },
                ],
              }),
            },
          },
        ],
      },
    } as any);

    const result = await (service as any).extractReceiptData({
      userId: 'user-id',
      fileBase64: 'AA==',
      fileType: 'image/jpeg',
    });

    expect(result.items[0].categoryId).toBe(foodCategory._id);
    expect(result.items[0].categoryName).toBe(foodCategory.name);
  });
});
