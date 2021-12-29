import { Args, Query, Mutation, Resolver, ID } from '@nestjs/graphql';
import { Types } from 'mongoose';
import { CreateCategoryInput } from './categories-input.dto';
import { Categories } from './categories.entity';
import { CategoriesService } from './categories.service';

@Resolver()
export class CategoriesResolver {
    constructor (private readonly categoriesService: CategoriesService){}

    @Query(() => [Categories])
    async getCategories(
        @Args('userId') userId: string
    ) {
        try {
            return await this.categoriesService.find(userId);
        } catch (error) {
            console.error(error);
        }
    }

    @Mutation(() => Categories)
    async createCategory(
        @Args('createCategoryInput') createCategoryInput: CreateCategoryInput
    ) {
        try {
            return await this.categoriesService.createCategory(createCategoryInput);
        } catch (error) {
            console.error(error);
        }
    }

    @Mutation(() => [Categories])
    async removeCategory(
        @Args('_id', { type: () => String }) _id: Types.ObjectId,
    ) {
        try {
            return await this.categoriesService.removeCategory(_id);
        } catch (error) {
            console.error(error);
        }
    }

}
