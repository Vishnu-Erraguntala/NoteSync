import htmlPdf from "html-pdf-node";

export async function htmlToPdfBuffer(html: string) {
  const file = { content: html };
  const options = {
    format: "A4" as const,
    printBackground: true,
    margin: {
      top: "12mm",
      bottom: "18mm",
      left: "12mm",
      right: "12mm",
    },
  };

  return htmlPdf.generatePdf(file, options);
}

