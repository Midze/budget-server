import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlExpensesGuard } from '../expenses/expenses.guard';
import { GlossaryEntry } from './glossary.entity';
import { GlossaryEntryInput } from './glossary-input.dto';
import { GlossaryService } from './glossary.service';

@Resolver()
export class GlossaryResolver {
  constructor(private readonly glossaryService: GlossaryService) {}

  @Mutation(() => [GlossaryEntry])
  @UseGuards(GqlExpensesGuard)
  async upsertGlossaryEntries(
    @Args('entries', { type: () => [GlossaryEntryInput] }) entries: GlossaryEntryInput[],
  ) {
    return this.glossaryService.upsertEntries(entries);
  }
}
