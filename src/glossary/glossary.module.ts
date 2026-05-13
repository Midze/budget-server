import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GlossaryResolver } from './glossary.resolver';
import { GlossaryService } from './glossary.service';
import { GlossaryEntry, GlossaryEntrySchema } from './glossary.entity';

@Module({
  imports: [MongooseModule.forFeature([{ name: GlossaryEntry.name, schema: GlossaryEntrySchema }])],
  providers: [GlossaryResolver, GlossaryService],
  exports: [GlossaryService],
})
export class GlossaryModule {}
