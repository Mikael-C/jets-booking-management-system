"use client";

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export interface PdfExportOptions {
  fileName?: string;
  quality?: number;
  scale?: number;
}

/**
 * Preloads and waits for all images inside an element to be completely loaded.
 */
async function waitForImagesToLoad(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll<HTMLImageElement>("img"));
  if (images.length === 0) return;

  const loadPromises = images.map((img) => {
    if (img.complete && img.naturalWidth > 0) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      const handleDone = () => {
        img.removeEventListener("load", handleDone);
        img.removeEventListener("error", handleDone);
        resolve();
      };
      img.addEventListener("load", handleDone, { once: true });
      img.addEventListener("error", handleDone, { once: true });
      // Safety timeout in case of blocked remote network images
      setTimeout(handleDone, 4000);
    });
  });

  await Promise.all(loadPromises);
}

/**
 * Exports a DOM container or set of .doc-page elements into a pixel-perfect,
 * un-scattered multi-page A4 PDF file that looks identical to the preview.
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

    // Ensure all web fonts are loaded
    if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (fontErr) {
        console.warn("[pdfExporter] Font ready warning:", fontErr);
      }
    }

    // Ensure all remote and local images are loaded before rasterizing
    await waitForImagesToLoad(container);

    // Standard A4 dimensions in mm (Portrait)
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
      scale: options.scale || 2.5, // 2.5x scale delivers crisp 300+ DPI vector-like clarity
      useCORS: true,
      allowTaint: false, // Prevents canvas security taint crashes
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 12000,
      windowWidth: 1024,
      onclone: (clonedDoc: Document) => {
        // Strip preview-only shadows, rounded corners, and margins for clean paper rendering
        const clonedPages = clonedDoc.querySelectorAll<HTMLElement>(".doc-page");
        clonedPages.forEach((page) => {
          page.style.boxShadow = "none";
          page.style.border = "none";
          page.style.borderRadius = "0px";
          page.style.margin = "0px";
          page.style.width = "794px"; // Standard A4 width at 96 DPI
          page.style.minHeight = "1123px"; // Standard A4 height at 96 DPI
          page.style.boxSizing = "border-box";
          page.style.backgroundColor = "#ffffff";
        });

        // Ensure background is pure clean white
        if (clonedDoc.body) {
          clonedDoc.body.style.backgroundColor = "#ffffff";
        }
      },
    };

    if (pageElements && pageElements.length > 0) {
      // Capture each page individually to guarantee zero sliced text or chopped tables
      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i];

        const canvas = await html2canvas(pageEl, html2canvasOptions);
        const imgData = canvas.toDataURL("image/jpeg", options.quality || 0.98);

        // Calculate aspect-ratio fitting
        const imgWidth = pdfPageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (i > 0) {
          pdf.addPage("a4", "portrait");
        }

        // If the captured page matches standard A4 proportions within ~10mm, fit full-bleed
        const heightDiff = Math.abs(imgHeight - pdfPageHeight);
        if (heightDiff <= 10) {
          pdf.addImage(imgData, "JPEG", 0, 0, pdfPageWidth, pdfPageHeight, undefined, "FAST");
        } else if (imgHeight > pdfPageHeight) {
          // If taller than A4, scale proportionally so footer or bottom signatures never clip
          const scale = pdfPageHeight / imgHeight;
          const scaledWidth = imgWidth * scale;
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
