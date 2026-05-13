import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { GraphQLError } from 'graphql';
import { Model } from 'mongoose';
import * as path from 'path';
import { CategoriesService } from '../categories/categories.service';
import { GlossaryService } from '../glossary/glossary.service';
import { ExpensesService } from '../expenses/expenses.service';
import {
  ProcessReceiptInput,
  ProcessReceiptResult,
  ReceiptActionResult,
  ReceiptStoredItemInput,
  UpdateReceiptInput,
} from './receipt-input.dto';
import { ReceiptRecord, ReceiptRecordDocument } from './receipt-record.entity';
import { RECEIPT_STATUSES } from './receipt.constants';

type OpenAIMessageContent =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

@Injectable()
export class ReceiptService {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly glossaryService: GlossaryService,
    private readonly expensesService: ExpensesService,
    @InjectModel(ReceiptRecord.name)
    private readonly receiptModel: Model<ReceiptRecordDocument>,
  ) {}

  async processReceipt(
    input: ProcessReceiptInput,
  ): Promise<ProcessReceiptResult> {
    const fileBuffer = this.decodeBase64(input.fileBase64);
    const fileHash = this.getFileHash(fileBuffer);
    const existingReceipt = await this.receiptModel
      .findOne({ userId: input.userId, fileHash })
      .sort({ createdAt: -1 })
      .exec();

    if (existingReceipt) {
      return this.toProcessResult(existingReceipt, true);
    }

    const storedReceipt = await this.storeReceiptFile(input, fileBuffer);
    const processedReceipt = await this.processStoredReceipt(
      String(storedReceipt._id),
      input.userId,
    );
    return this.toProcessResult(processedReceipt);
  }

  async listReceipts(userId: string) {
    return this.receiptModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async getReceiptForUser(receiptId: string, userId: string) {
    const normalizedUserId = String(userId || '');
    const receipt = await this.receiptModel.findById(receiptId).exec();
    if (!receipt) {
      throw new GraphQLError('Receipt not found');
    }

    if (String(receipt.userId) !== normalizedUserId) {
      throw new GraphQLError('Receipt not found');
    }
    return receipt;
  }

  async processStoredReceipt(receiptId: string, userId: string) {
    const receipt = await this.getReceiptForUser(receiptId, userId);
    await this.receiptModel
      .findByIdAndUpdate(receipt._id, {
        status: RECEIPT_STATUSES.PROCESSING,
        errorMessage: null,
      })
      .exec();

    const fileBuffer = await fs.readFile(this.getReceiptFilePath(receipt));
    const base64 = fileBuffer.toString('base64');
    const parsed = await this.extractReceiptData({
      userId,
      fileBase64: base64,
      fileType: receipt.fileType,
    });

    const effectiveExpenseDate =
      parsed.receiptDate ||
      receipt.effectiveExpenseDate ||
      receipt.selectedDateAtUpload ||
      this.formatDate(new Date());

    const update = {
      status: RECEIPT_STATUSES.PARSED,
      merchantName: parsed.merchantName,
      detectedMerchantName: parsed.merchantName,
      receiptDate: parsed.receiptDate,
      detectedReceiptDate: parsed.receiptDate,
      effectiveExpenseDate,
      total: parsed.total,
      detectedTotal: parsed.total,
      items: parsed.items,
      errorMessage: null,
    };

    return this.receiptModel
      .findByIdAndUpdate(receipt._id, update, { new: true })
      .exec();
  }

  async updateReceipt(userId: string, input: UpdateReceiptInput) {
    const receipt = await this.getReceiptForUser(input.receiptId, userId);
    const normalizedItems = Array.isArray(input.items)
      ? input.items.map((item) => this.normalizeReceiptItem(item))
      : receipt.items;

    return this.receiptModel
      .findByIdAndUpdate(
        receipt._id,
        {
          ...(input.merchantName !== undefined
            ? { merchantName: input.merchantName }
            : {}),
          ...(input.receiptDate !== undefined
            ? { receiptDate: input.receiptDate }
            : {}),
          ...(input.effectiveExpenseDate !== undefined
            ? { effectiveExpenseDate: input.effectiveExpenseDate }
            : {}),
          ...(input.total !== undefined ? { total: input.total } : {}),
          ...(input.items !== undefined ? { items: normalizedItems } : {}),
        },
        { new: true },
      )
      .exec();
  }

  async confirmReceipt(
    userId: string,
    receiptId: string,
  ): Promise<ReceiptActionResult> {
    const receipt = await this.getReceiptForUser(receiptId, userId);
    const effectiveDateRaw =
      receipt.effectiveExpenseDate ||
      receipt.receiptDate ||
      receipt.selectedDateAtUpload;
    if (!effectiveDateRaw) {
      throw new GraphQLError('Receipt date is required before confirmation');
    }

    const effectiveDate = new Date(effectiveDateRaw);
    if (Number.isNaN(effectiveDate.getTime())) {
      throw new GraphQLError('Receipt date is invalid');
    }

    const expenses = receipt.items
      .filter((item) => item.categoryId && item.price)
      .map((item) => ({
        category: item.categoryId as string,
        price: String(item.price),
      }));

    if (!expenses.length) {
      throw new GraphQLError(
        'Add at least one categorized item before confirmation',
      );
    }

    await this.expensesService.upsertExpensesForDate(
      userId,
      effectiveDate,
      expenses as any,
    );
    const updated = await this.receiptModel
      .findByIdAndUpdate(
        receipt._id,
        { status: RECEIPT_STATUSES.CONFIRMED },
        { new: true },
      )
      .exec();

    const message =
      receipt.selectedDateAtUpload &&
      updated.effectiveExpenseDate !== receipt.selectedDateAtUpload
        ? `Receipt was added to ${updated.effectiveExpenseDate} instead of ${receipt.selectedDateAtUpload}`
        : 'Receipt confirmed';

    return { success: true, message, receipt: updated };
  }

  async deleteReceipt(
    userId: string,
    receiptId: string,
  ): Promise<ReceiptActionResult> {
    const receipt = await this.getReceiptForUser(receiptId, userId);
    await this.receiptModel.deleteOne({ _id: receiptId, userId }).exec();
    try {
      await fs.unlink(this.getReceiptFilePath(receipt));
    } catch (error) {
      // Ignore missing file cleanup errors.
    }
    return { success: true, message: 'Receipt deleted' };
  }

  getReceiptFilePath(receipt: Pick<ReceiptRecord, 'storedFileName' | 'storagePath'>) {
    if (receipt.storedFileName) {
      return path.join(this.getStorageDir(), receipt.storedFileName);
    }
    return receipt.storagePath;
  }

  private async extractReceiptData(input: {
    userId: string;
    fileBase64: string;
    fileType: string;
  }): Promise<{
    merchantName: string | null;
    receiptDate: string | null;
    total: string | null;
    items: Array<{
      name: string;
      price: string;
      categoryId?: string | null;
      categoryName?: string | null;
    }>;
  }> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new GraphQLError('OPENAI_API_KEY is not set on the server');
    }

    const isImage = input.fileType?.startsWith('image/');
    const isPdf = input.fileType === 'application/pdf';
    if (!isImage && !isPdf) {
      throw new GraphQLError(
        'Unsupported file type. Upload an image or text PDF.',
      );
    }

    const categories = await this.categoriesService.find(input.userId);
    const categoryList = categories.map((category) => ({
      id: String(category._id),
      name: category.name,
      parentId: category.childOf || null,
    }));

    const glossary = await this.glossaryService.findAll();
    const glossaryList = glossary
      .map((entry) => {
        const category = categories.find(
          (item) => String(item._id) === entry.categoryId,
        );
        if (!category) {
          return null;
        }
        return {
          phrase: entry.phrase,
          categoryId: entry.categoryId,
          categoryName: category.name,
        };
      })
      .filter(Boolean);

    const promptText =
      'Extract receipt merchantName, receiptDate in YYYY-MM-DD if possible, total, and each purchased item as name and price. ' +
      'Match each item to a category from the list if possible. Prefer the most specific child category. ' +
      'Also use glossary mappings when matching items. ' +
      'Return strict JSON only: {"merchantName":"...","receiptDate":"YYYY-MM-DD|null","total":"0.00|null","items":[{"name":"...","price":"0.00","categoryId":"<id>|null","categoryName":"<name>|null"}]}. ' +
      `Categories: ${JSON.stringify(categoryList)}. Glossary: ${JSON.stringify(
        glossaryList,
      )}`;

    const baseMessages = [
      {
        role: 'system',
        content:
          'You extract receipt data in German or English. Return strict JSON only.',
      },
    ];

    const messages: any[] = [...baseMessages];
    if (isImage) {
      const dataUrl = `data:${input.fileType};base64,${input.fileBase64}`;
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: promptText },
          { type: 'image_url', image_url: { url: dataUrl } },
        ] as OpenAIMessageContent[],
      });
    } else {
      const pdfBuffer = Buffer.from(input.fileBase64, 'base64');
      const pdfData = new Uint8Array(pdfBuffer);
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const loadingTask = (pdfjs as any).getDocument({
        data: pdfData,
        disableWorker: true,
      });
      const pdf = await loadingTask.promise;
      let text = '';
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const pageText = (content.items || [])
          .map((item: any) => (item?.str ? String(item.str) : ''))
          .join(' ');
        text += `${pageText}\n`;
        if (text.length >= 12000) {
          break;
        }
      }
      messages.push({
        role: 'user',
        content: `${promptText}\n\nReceipt text:\n${text.slice(0, 12000)}`,
      });
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-5.4-nano',
          messages,
          temperature: 0.1,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const content = response.data?.choices?.[0]?.message?.content ?? '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new GraphQLError('OpenAI response did not contain JSON');
      }
      const parsed = JSON.parse(jsonMatch[0]);
      const items = Array.isArray(parsed.items) ? parsed.items : [];

      return {
        merchantName: parsed.merchantName ?? null,
        receiptDate: parsed.receiptDate ?? null,
        total: parsed.total ?? null,
        items: items.map((item) => this.normalizeReceiptItem(item)),
      };
    } catch (error) {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data ||
        error?.message ||
        error;
      throw new GraphQLError(String(message || 'Failed to process receipt'));
    }
  }

  private toProcessResult(
    receipt: ReceiptRecordDocument,
    isDuplicate = false,
  ): ProcessReceiptResult {
    return {
      receiptId: String(receipt._id),
      isDuplicate,
      merchantName: receipt.merchantName ?? null,
      receiptDate: receipt.receiptDate ?? null,
      effectiveExpenseDate: receipt.effectiveExpenseDate ?? null,
      total: receipt.total ?? null,
      items: receipt.items ?? [],
    };
  }

  private normalizeReceiptItem(item: ReceiptStoredItemInput | any) {
    return {
      name: String(item?.name ?? '').trim(),
      price: String(item?.price ?? '0.00').trim() || '0.00',
      categoryId: item?.categoryId ?? null,
      categoryName: item?.categoryName ?? null,
    };
  }

  private decodeBase64(base64: string): Buffer {
    try {
      const buffer = Buffer.from(base64, 'base64');
      if (!buffer.length) {
        throw new Error('Empty file');
      }
      return buffer;
    } catch (error) {
      throw new GraphQLError('Failed to decode uploaded receipt');
    }
  }

  private async storeReceiptFile(
    input: ProcessReceiptInput,
    fileBuffer: Buffer,
  ) {
    const storageDir = this.getStorageDir();
    await fs.mkdir(storageDir, { recursive: true });

    const extension = this.resolveFileExtension(input.fileName, input.fileType);
    const storedFileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}${extension}`;
    const absolutePath = path.join(storageDir, storedFileName);

    await fs.writeFile(absolutePath, fileBuffer);
    const fileHash = this.getFileHash(fileBuffer);

    return this.receiptModel.create({
      userId: input.userId,
      originalFileName: input.fileName || storedFileName,
      fileHash,
      storedFileName,
      fileType: input.fileType,
      storagePath: absolutePath,
      fileSizeBytes: fileBuffer.byteLength,
      status: RECEIPT_STATUSES.UPLOADED,
      items: [],
      selectedDateAtUpload: input.selectedDate || null,
      effectiveExpenseDate: input.selectedDate || null,
    });
  }

  private getStorageDir() {
    return (
      process.env.RECEIPT_STORAGE_DIR ||
      path.join(process.cwd(), 'uploads', 'receipts')
    );
  }

  private resolveFileExtension(fileName?: string, fileType?: string) {
    const fromName = fileName ? path.extname(fileName).trim() : '';
    if (fromName) {
      return fromName.startsWith('.') ? fromName : `.${fromName}`;
    }
    if (fileType === 'application/pdf') return '.pdf';
    if (fileType === 'image/png') return '.png';
    if (fileType === 'image/webp') return '.webp';
    return '.jpg';
  }

  private formatDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getFileHash(fileBuffer: Buffer) {
    return createHash('sha256').update(fileBuffer).digest('hex');
  }
}
