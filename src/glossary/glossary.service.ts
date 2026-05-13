import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GlossaryEntry, GlossaryEntryDocument } from './glossary.entity';
import { GlossaryEntryInput } from './glossary-input.dto';

@Injectable()
export class GlossaryService {
  constructor(
    @InjectModel(GlossaryEntry.name) private GlossaryModel: Model<GlossaryEntryDocument>,
  ) {}

  async upsertEntries(entries: GlossaryEntryInput[]) {
    const normalized = entries
      .map((entry) => ({
        phrase: entry.phrase.trim().toLowerCase(),
        categoryId: entry.categoryId,
      }))
      .filter((entry) => entry.phrase && entry.categoryId);

    if (!normalized.length) {
      return [];
    }

    const ops = normalized.map((entry) => ({
      updateOne: {
        filter: { phrase: entry.phrase },
        update: { $set: { categoryId: entry.categoryId } },
        upsert: true,
      },
    }));

    await this.GlossaryModel.bulkWrite(ops, { ordered: false });
    return this.GlossaryModel.find({ phrase: { $in: normalized.map((entry) => entry.phrase) } }).exec();
  }

  async findAll() {
    return this.GlossaryModel.find().exec();
  }
}
