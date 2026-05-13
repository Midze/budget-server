import { Controller, Get, Param, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { ReceiptService } from './receipt.service';

@Controller('receipts')
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  @Get(':id/download')
  @UseGuards(AuthGuard('jwt'))
  async downloadReceipt(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const userId = String(req.user?._id || '');
    const receipt = await this.receiptService.getReceiptForUser(id, userId);
    return res.download(
      this.receiptService.getReceiptFilePath(receipt),
      receipt.originalFileName,
    );
  }

  @Get(':id/file')
  @UseGuards(AuthGuard('jwt'))
  async viewReceiptFile(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const userId = String(req.user?._id || '');
    const receipt = await this.receiptService.getReceiptForUser(id, userId);
    res.setHeader('Content-Type', receipt.fileType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${receipt.originalFileName}"`);
    return createReadStream(this.receiptService.getReceiptFilePath(receipt)).pipe(res);
  }
}
