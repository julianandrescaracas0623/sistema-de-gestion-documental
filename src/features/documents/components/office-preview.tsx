"use client";

import { useEffect, useRef, useState } from "react";

import { DOCX_MIME } from "@/features/documents/lib/mime-utils";

async function renderDocx(arrayBuffer: ArrayBuffer, container: HTMLElement): Promise<void> {
  const { renderAsync } = await import("docx-preview");
  await renderAsync(arrayBuffer, container, undefined, {
    className: "docx-preview",
    inWrapper: true,
    ignoreWidth: false,
    ignoreHeight: false,
    ignoreFonts: false,
    breakPages: true,
    useBase64URL: true,
  });
}

interface XlsxWorkbook {
  sheetNames: string[];
  sheets: Record<string, string>; // name → sanitized HTML
}

async function loadXlsx(url: string): Promise<XlsxWorkbook> {
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  const XLSX = await import("xlsx");
  const DOMPurify = (await import("dompurify")).default;

  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  const sanitize = (html: string) =>
    DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ["script", "iframe", "object", "embed", "form"],
      FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "action"],
    });

  const sheets: Record<string, string> = {};
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    sheets[name] = sheet !== undefined ? sanitize(XLSX.utils.sheet_to_html(sheet)) : "<p>Sin datos.</p>";
  }

  return { sheetNames: workbook.SheetNames, sheets };
}

function DocxViewer({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (containerRef.current === null) return;
    const container = containerRef.current;

    const load = async () => {
      try {
        const res = await fetch(url);
        const arrayBuffer = await res.arrayBuffer();
        await renderDocx(arrayBuffer, container);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al renderizar el documento.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [url]);

  if (error !== null) {
    return <p className="text-sm text-destructive p-4">{error}</p>;
  }

  return (
    <div className="relative">
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <p className="text-sm text-muted-foreground animate-pulse">Cargando vista previa…</p>
        </div>
      ) : null}
      <div ref={containerRef} className="docx-container" />
    </div>
  );
}

function XlsxViewer({ url }: { url: string }) {
  const [workbook, setWorkbook] = useState<XlsxWorkbook | null>(null);
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadXlsx(url)
      .then((wb) => {
        setWorkbook(wb);
        setActiveSheet(wb.sheetNames[0] ?? null);
      })
      .catch((e: unknown) => { setError(e instanceof Error ? e.message : "Error al renderizar."); });
  }, [url]);

  if (error !== null) return <p className="text-sm text-destructive p-4">{error}</p>;
  if (workbook === null || activeSheet === null) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-sm text-muted-foreground animate-pulse">Cargando vista previa…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {workbook.sheetNames.length > 1 ? (
        <div className="flex gap-0 border-b overflow-x-auto shrink-0">
          {workbook.sheetNames.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => { setActiveSheet(name); }}
              className={`px-4 py-2 text-sm whitespace-nowrap border-r transition-colors ${
                name === activeSheet
                  ? "bg-white font-medium border-b-white -mb-px"
                  : "bg-muted text-muted-foreground hover:bg-background"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      ) : null}
      <div
        className="overflow-auto max-h-[70vh] p-4 [&_table]:border-collapse [&_td]:border [&_td]:border-gray-300 [&_td]:px-2 [&_td]:py-1 [&_td]:text-sm [&_th]:border [&_th]:border-gray-300 [&_th]:px-2 [&_th]:py-1 [&_th]:bg-gray-100 [&_th]:text-sm"
        dangerouslySetInnerHTML={{ __html: workbook.sheets[activeSheet] ?? "" }}
      />
    </div>
  );
}

export function OfficePreview({ url, mime }: { url: string; mime: string }) {
  if (mime === DOCX_MIME) {
    return (
      <div className="overflow-auto max-h-[80vh] bg-gray-100">
        <style>{`
          .docx-container .docx-wrapper {
            padding: 2rem;
            background: #f3f4f6;
          }
          .docx-container .docx-wrapper > section.docx {
            background: white;
            box-shadow: 0 1px 4px rgba(0,0,0,0.15);
            margin-bottom: 1rem;
          }
        `}</style>
        <DocxViewer url={url} />
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-[80vh]">
      <XlsxViewer url={url} />
    </div>
  );
}
