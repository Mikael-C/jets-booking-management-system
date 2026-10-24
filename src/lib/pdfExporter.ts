"use client";

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export interface PdfExportOptions {
  fileName?: string;
  quality?: number;
  scale?: number;
}

/**
 * Exports a DOM container or set of .doc-page elements into a pixel-perfect,
 * un-scattered multi-page A4 PDF file.
 */
export async function downloadDocumentAsPdf(
  containerElementOrId: HTMLElement | string,
  options: PdfExportOptions = {}
): Promise<boolean> {
  try {
    let container: HTMLElement | null = null;
    if (typeof containerElementOrId === "string") {
      container = document.getElementById(containerElementOrId);
    } else {
      container = containerElementOrId;
    }

    if (!container) {
      console.error("[pdfExporter] Target container not found");
      return false;
    }

    // A4 dimensions in mm (Portrait)
    const pdfPageWidth = 210;
    const pdfPageHeight = 297;
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    // Check if the document has explicitly structured .doc-page sections
    const pageElements = container.querySelectorAll<HTMLElement>(".doc-page");

    const html2canvasOptions = {
      scale: options.scale || 2, // High resolution for crisp text & SVGs
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: 1024,
    };

    if (pageElements && pageElements.length > 0) {
      // Capture each page individually to guarantee zero sliced text or chopped tables
      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i];

        // Temporarily ensure background is pure white and borders match print
        const canvas = await html2canvas(pageEl, html2canvasOptions);
        const imgData = canvas.toDataURL("image/jpeg", options.quality || 0.98);

        // Calculate aspect-ratio fitting
        const imgWidth = pdfPageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (i > 0) {
          pdf.addPage("a4", "portrait");
        }

        if (imgHeight > pdfPageHeight) {
          // If slightly taller than A4, scale proportionally to fit page height
          const scaledWidth = (canvas.width * pdfPageHeight) / canvas.height;
          const offsetX = (pdfPageWidth - scaledWidth) / 2;
          pdf.addImage(imgData, "JPEG", offsetX, 0, scaledWidth, pdfPageHeight, undefined, "FAST");
        } else {
          // Fit to width and position at top of page
          pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight, undefined, "FAST");
        }
      }
    } else {
      // Fallback for single container without .doc-page tags
      const canvas = await html2canvas(container, html2canvasOptions);
      const imgData = canvas.toDataURL("image/jpeg", options.quality || 0.98);

      const imgWidth = pdfPageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pdfPageHeight;

      while (heightLeft > 0) {
        position -= pdfPageHeight;
        pdf.addPage("a4", "portrait");
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pdfPageHeight;
      }
    }

    const safeFileName = options.fileName || "Orbelo_Charter_Document.pdf";
    pdf.save(safeFileName);
    return true;
  } catch (err) {
    console.error("[pdfExporter] Error generating PDF:", err);
    return false;
  }
}
