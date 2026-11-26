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
  const pdf = await renderDocumentPdf(containerElementOrId, options);
  if (!pdf) return false;
  pdf.save(options.fileName || "Orbelo_Charter_Document.pdf");
  return true;
}

/** The same PDF as a data URI (e.g. the signed agreement stored with the trip). */
export async function documentPdfDataUri(containerElementOrId: HTMLElement | string, options: PdfExportOptions = {}): Promise<string | null> {
  const pdf = await renderDocumentPdf(containerElementOrId, options);
  return pdf ? (pdf.output("datauristring") as string).replace(/^data:application\/pdf;filename=[^;]*;/, "data:application/pdf;") : null;
}

/** Clickable links: every <a href> on the page becomes a link area at the same place in the PDF. */
function addLinks(pdf: jsPDF, pageEl: HTMLElement, x0: number, y0: number, wMm: number) {
  const rect = pageEl.getBoundingClientRect();
  if (!rect.width) return;
  const k = wMm / rect.width;
  pageEl.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href)) return;
    const r = a.getBoundingClientRect();
    if (!r.width || !r.height) return;
    try {
      pdf.link(x0 + (r.left - rect.left) * k, y0 + (r.top - rect.top) * k, r.width * k, r.height * k, { url: href });
    } catch {
      /* link areas are a nicety */
    }
  });
}


const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

/**
 * A copy of the document laid out at true A4 width, where any page taller than one sheet continues on a new
 * page: whole blocks (tables, aircraft cards, paragraphs) move to the next page and a heading stays with what
 * follows it. Page footers are renumbered ("Page 2 / 3"). The copy sits off screen and is removed afterwards.
 */
async function paginatedCopy(container: HTMLElement): Promise<{ root: HTMLElement; cleanup: () => void } | null> {
  if (!container.querySelector(".doc-page")) return null;
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = `position:fixed;left:-20000px;top:0;width:${A4_WIDTH_PX + 40}px;pointer-events:none;z-index:-1;`;
  const root = container.cloneNode(true) as HTMLElement;
  root.removeAttribute("id");
  host.appendChild(root);
  document.body.appendChild(host);
  const cleanup = () => host.remove();

  try {
    const pages = Array.from(root.querySelectorAll<HTMLElement>(".doc-page"));
    // Heights are only right once the photos in the copy have loaded
    await waitForImagesToLoad(root);
    pages.forEach((page) => {
      page.style.width = `${A4_WIDTH_PX}px`;
      page.style.maxWidth = `${A4_WIDTH_PX}px`;
      page.style.margin = "0";
    });

    const isHeading = (el: Element | null) => !!el && /^H[1-6]$/.test(el.tagName);
    const tall = (page: HTMLElement) => page.getBoundingClientRect().height > A4_HEIGHT_PX + 1;

    for (const first of pages) {
      let page = first;
      let guard = 0;
      while (tall(page) && guard++ < 10) {
        const body = page.querySelector<HTMLElement>(":scope > [data-doc-body]") || (page.firstElementChild as HTMLElement | null);
        const footer = page.querySelector<HTMLElement>(":scope > [data-doc-footer]") || (page.lastElementChild as HTMLElement | null);
        if (!body || !footer || body === footer || body.children.length < 2) break;

        const next = page.cloneNode(false) as HTMLElement;
        const nextBody = body.cloneNode(false) as HTMLElement;
        next.appendChild(nextBody);
        next.appendChild(footer.cloneNode(true));
        page.after(next);

        // Move blocks from the end until this page fits (always leave at least one block behind)
        while (tall(page) && body.children.length > 1) {
          nextBody.insertBefore(body.lastElementChild as Element, nextBody.firstChild);
        }
        // A heading never ends a page: it goes with the block it introduces
        while (body.children.length > 1 && isHeading(body.lastElementChild)) {
          nextBody.insertBefore(body.lastElementChild as Element, nextBody.firstChild);
        }
        if (!nextBody.children.length) {
          next.remove();
          break;
        }
        page = next;
      }
    }

    // Renumber every page footer
    const all = Array.from(root.querySelectorAll<HTMLElement>(".doc-page"));
    all.forEach((page, i) => {
      const footer = page.querySelector<HTMLElement>(":scope > [data-doc-footer]");
      const num = footer?.querySelector<HTMLElement>("[data-doc-pageno]");
      if (num) num.textContent = `Page ${i + 1} / ${all.length}`;
    });
    return { root, cleanup };
  } catch (err) {
    console.warn("[pdfExporter] Could not lay out continuation pages:", err);
    cleanup();
    return null;
  }
}

async function renderDocumentPdf(containerElementOrId: HTMLElement | string, options: PdfExportOptions = {}): Promise<jsPDF | null> {
  try {
    let container: HTMLElement | null = null;
    if (typeof containerElementOrId === "string") {
      container = document.getElementById(containerElementOrId);
    } else {
      container = containerElementOrId;
    }

    if (!container) {
      console.error("[pdfExporter] Target container not found");
      return null;
    }

    // Ensure all web fonts are loaded
    if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (fontErr) {
        console.warn("[pdfExporter] Font ready warning:", fontErr);
      }
    }

    // Lay the pages out at A4 width; a page that runs past one sheet continues on a new full-width page
    const laidOut = await paginatedCopy(container);
    if (laidOut) {
      try {
        return await renderPages(laidOut.root, options);
      } finally {
        laidOut.cleanup();
      }
    }
    return await renderPages(container, options);
  } catch (err) {
    console.error("[pdfExporter] Error generating PDF:", err);
    return null;
  }
}

async function renderPages(container: HTMLElement, options: PdfExportOptions): Promise<jsPDF | null> {
  try {
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
          addLinks(pdf, pageEl, 0, 0, pdfPageWidth);
        } else if (imgHeight > pdfPageHeight) {
          // If taller than A4, scale proportionally so footer or bottom signatures never clip
          const scale = pdfPageHeight / imgHeight;
          const scaledWidth = imgWidth * scale;
          const offsetX = (pdfPageWidth - scaledWidth) / 2;
          pdf.addImage(imgData, "JPEG", offsetX, 0, scaledWidth, pdfPageHeight, undefined, "FAST");
          addLinks(pdf, pageEl, offsetX, 0, scaledWidth);
        } else {
          // Fit to width and position at top of page
          pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight, undefined, "FAST");
          addLinks(pdf, pageEl, 0, 0, imgWidth);
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

    return pdf;
  } catch (err) {
    console.error("[pdfExporter] Error generating PDF:", err);
    return null;
  }
}
