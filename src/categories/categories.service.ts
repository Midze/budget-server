import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { GraphQLError } from 'graphql';
import { Model, Types } from 'mongoose';
import { CreateCategoryInput } from './categories-input.dto';
import { Categories, CategoriesDocument } from './categories.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Categories.name) private CategoriesModel: Model<CategoriesDocument>,

    ) {}

  async removeCategory(ids: [string], userId: string) {
    try {
      const { ok } = await this.CategoriesModel.deleteMany({_id: ids });
      return ok ? await this.CategoriesModel.find({
        userId: {$in: [userId, "default"]}
      }) : new GraphQLError(`Error occurred while deleting category`);
    } catch (err) {
      console.error(err);
    }
  }

  async createCategory(createCategoryInput: CreateCategoryInput) {
    try {
      const { name, userId } = createCategoryInput;
      const category = await this.CategoriesModel.findOne({ $or: [ {name, userId: 'default'}, {name, userId} ] });
      return category ? new GraphQLError(`Category with this name: '${name}' already exist`)
      : await new this.CategoriesModel(createCategoryInput).save();
    } catch (err) {
      console.error(err);
    }
  }

  async find(userId: string) {
    try {
      return await this.CategoriesModel.find({
        userId: {$in: [userId, "default"]}
      }).sort({
        name: 1
    }).exec();
    } catch (err) {
      console.error(err);
    }
  }
}
