import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { GraphQLError } from 'graphql';
import { Model, Types } from 'mongoose';
import { CreateCategoryInput } from './categories-input.dto';
import { Categories, CategoriesDocument } from './categories.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Categories.name) private CategoriesModel: Model<CategoriesDocument>
  ) {}

  async removeCategory(_id: Types.ObjectId) {
    try {
      await this.CategoriesModel.findByIdAndRemove(_id);
      return await this.CategoriesModel.find();
    } catch (err) {
      console.error(err);
    }
  }

  async createCategory(createCategoryInput: CreateCategoryInput) {
    try {
      const { name } = createCategoryInput;
      const category = await this.CategoriesModel.findOne({name});
      return category ? new GraphQLError(`Category with this name: '${name}' already exist`)
      : await new this.CategoriesModel(createCategoryInput).save();
    } catch (err) {
      console.error(err);
    }
  }
  async find(userId: string) {
    try {
      return await this.CategoriesModel.find({userId: {$in: [userId, "default"]}}).exec();
    } catch (err) {
      console.error(err);
    }
  }
}