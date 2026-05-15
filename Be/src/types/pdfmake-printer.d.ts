declare module 'pdfmake/js/Printer' {
  export default class PdfPrinter {
    constructor(fonts: Record<string, unknown>);
    createPdfKitDocument(
      docDefinition: unknown,
      options?: unknown,
    ): Promise<any>;
  }
}
