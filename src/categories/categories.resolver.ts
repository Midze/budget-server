import { Args, Query, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Types } from 'mongoose';
import { CreateCategoryInput } from './categories-input.dto';
import { Categories } from './categories.entity';
import { CategoriesService } from './categories.service';
import { GqlCategoriesGuard } from './categories.guard';

@Resolver()
export class CategoriesResolver {
    constructor (private readonly categoriesService: CategoriesService){}

    @Query(() => [Categories])
    @UseGuards(GqlCategoriesGuard)
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
    @UseGuards(GqlCategoriesGuard)
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
    @UseGuards(GqlCategoriesGuard)
    async removeCategory(
        @Args('id',{ type: () => String }) id: string,
        @Args('userId', { type: () => String }) userId: string,
    ) {
        try {
            return await this.categoriesService.removeCategory(id, userId);
        } catch (error) {
            console.error(error);
        }
    }

}
