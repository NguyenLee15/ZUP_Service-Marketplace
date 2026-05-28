declare module 'pdfmake/js/Printer' {
  export interface PdfKitDocument {
    pipe(stream: NodeJS.WritableStream): void;
    end(): void;
  }

  export default class PdfPrinter {
    constructor(fonts: Record<string, unknown>);
    createPdfKitDocument(
      docDefinition: unknown,
      options?: unknown,
    ): PdfKitDocument;
  }
}
