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

    const stream = createReadStream(this.receiptService.getReceiptFilePath(receipt));
    stream.on('error', (error: NodeJS.ErrnoException) => {
      if (res.headersSent) {
        res.destroy();
        return;
      }

      if (error.code === 'ENOENT') {
        res.status(404).json({ message: 'Receipt file not found' });
        return;
      }

      res.status(500).json({ message: 'Unable to read receipt file' });
    });

    return stream.pipe(res);
  }
}
