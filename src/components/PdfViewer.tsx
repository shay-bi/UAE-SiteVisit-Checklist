"use client";

import { useEffect, useId, useRef, useState } from "react";

type PdfViewerProps = {
  src: string;
  title: string;
};

/**
 * Renders PDF pages to canvas so mobile browsers can scroll normally.
 * Native iframe PDF viewers often block touch scrolling on iOS.
 */
export function PdfViewer({ src, title }: PdfViewerProps) {
  const pagesId = useId();
  const shellRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [renderWidth, setRenderWidth] = useState(0);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    let frame = 0;
    let lastWidth = 0;

    const updateWidth = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = Math.floor(shell.clientWidth - 16); // account for padding
        if (next <= 0) return;
        if (Math.abs(next - lastWidth) < 12) return;
        lastWidth = next;
        setRenderWidth(next);
      });
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(shell);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (renderWidth <= 0) return;

    let cancelled = false;
    const pagesHost = pagesRef.current;

    async function renderPdf() {
      if (!pagesHost) return;
      setLoading(true);
      setError(null);
      pagesHost.replaceChildren();

      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const pdf = await pdfjs.getDocument({ url: src }).promise;
        if (cancelled) {
          await pdf.cleanup();
          return;
        }

        setPageCount(pdf.numPages);

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          if (cancelled) {
            page.cleanup();
            break;
          }

          const baseViewport = page.getViewport({ scale: 1 });
          const scale = renderWidth / baseViewport.width;
          const viewport = page.getViewport({
            scale: Math.min(Math.max(scale, 0.75), 2.5),
          });

          const canvas = document.createElement("canvas");
          canvas.className = "mb-3 block w-full bg-white shadow-sm last:mb-0";
          canvas.setAttribute(
            "aria-label",
            `${title}, page ${pageNum} of ${pdf.numPages}`,
          );

          const context = canvas.getContext("2d", { alpha: false });
          if (!context) {
            throw new Error("Canvas is not supported in this browser.");
          }

          const outputScale = window.devicePixelRatio || 1;
          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          context.setTransform(outputScale, 0, 0, outputScale, 0, 0);

          pagesHost.appendChild(canvas);

          await page
            .render({
              canvasContext: context,
              viewport,
              canvas,
            })
            .promise;

          page.cleanup();
        }

        await pdf.cleanup();
      } catch (err) {
        console.error("PDF render failed:", err);
        if (!cancelled) {
          setError(
            "Could not display the PDF here. Use Open PDF for the full document.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void renderPdf();

    return () => {
      cancelled = true;
    };
  }, [src, title, renderWidth]);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted sm:hidden">
        Scroll inside the viewer below, or use Open PDF for a full-screen view.
      </p>

      <div
        ref={shellRef}
        className="pdf-viewer relative h-[min(75dvh,800px)] overflow-y-auto overscroll-y-contain rounded-xl border border-border bg-white p-2 [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:#f05a28_#e5e5e5]"
        style={{ WebkitOverflowScrolling: "touch" }}
        role="region"
        aria-label={title}
        aria-busy={loading}
        tabIndex={0}
      >
        {loading && (
          <p className="px-2 py-6 text-center text-sm text-neutral-600">
            Loading PDF…
          </p>
        )}

        {error && (
          <div className="space-y-3 px-2 py-6 text-center">
            <p className="text-sm text-neutral-700">{error}</p>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-orange px-4 text-sm font-semibold text-white"
            >
              Open PDF
            </a>
          </div>
        )}

        <div
          ref={pagesRef}
          id={pagesId}
          className={loading || error ? "hidden" : undefined}
        />

        {!loading && !error && pageCount > 0 && (
          <p className="sr-only">
            {title} loaded with {pageCount} pages.
          </p>
        )}
      </div>
    </div>
  );
}
