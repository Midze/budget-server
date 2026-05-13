declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  export const getDocument: (params: { data: Buffer; disableWorker?: boolean }) => {
    promise: Promise<{
      numPages: number;
      getPage: (pageNumber: number) => Promise<{
        getTextContent: () => Promise<{ items: Array<{ str?: string }> }>;
      }>;
    }>;
  };
}
