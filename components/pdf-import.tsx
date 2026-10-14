"use client";
import { useRef, useState, useEffect } from "react";
export default function PdfImport({
  onText,
}: {
  onText: (text: string, title: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  async function read(file: File) {
    setError("");
    setNotice("");
    if (file.size > 5 * 1024 * 1024) {
      setError("Choose a PDF smaller than 5 MB.");
      return;
    }
    setBusy(true);
    let task: import("pdfjs-dist").PDFDocumentLoadingTask | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const buffer = await file.arrayBuffer();
      if (new TextDecoder().decode(buffer.slice(0, 5)) !== "%PDF-")
        throw new Error(
          "This file is not a valid PDF. Paste your objectives instead.",
        );
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      task = pdfjs.getDocument({
        data: new Uint8Array(buffer),
      });
      const parse = async () => {
        const pdf = await task!.promise;
        if (pdf.numPages > 40)
          throw new Error(
            "Choose a PDF with 40 pages or fewer, or paste the relevant objectives.",
          );
        let text = "";
        let truncated = false;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          for (const item of content.items) {
            if ("str" in item) text += item.str + (item.hasEOL ? "\n" : " ");
          }
          text += "\n";
          if (text.length > 15000) {
            truncated = true;
            break;
          }
        }
        if (text.trim().length < 10)
          throw new Error(
            "No readable text found. This may be a scanned PDF. Paste its learning objectives instead; OCR is not included.",
          );
        return { text: text.slice(0, 15000).trim(), truncated };
      };
      const result = await Promise.race([
        parse(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () =>
              reject(
                new Error(
                  "This PDF took too long to read. Try a smaller file or paste the objectives.",
                ),
              ),
            20000,
          );
        }),
      ]);
      if (active.current) {
        onText(result.text, file.name.replace(/\.pdf$/i, "").slice(0, 180));
        setNotice(
          result.truncated
            ? "Imported the first 15,000 characters. Keep the relevant objectives below before continuing."
            : "Text imported. Review it below and remove anything that is not part of your module objectives.",
        );
      }
    } catch (e) {
      if (active.current)
        setError(
          e instanceof Error && e.name === "PasswordException"
            ? "This PDF is password protected. Use an unlocked copy or paste its objectives."
            : e instanceof Error
              ? e.message
              : "Unable to read this PDF. Paste the objectives instead.",
        );
    } finally {
      if (timer) clearTimeout(timer);
      await task?.destroy();
      if (active.current) setBusy(false);
    }
  }
  return (
    <div className="pdf-import">
      <label>
        Or import a module PDF
        <input
          type="file"
          accept="application/pdf,.pdf"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void read(file);
            e.target.value = "";
          }}
        />
      </label>
      <small>
        Up to 5 MB / 40 pages. Read locally in your browser. Only the text you
        submit is stored; the PDF is never uploaded.
      </small>
      {busy && <p role="status">Reading PDF text…</p>}
      {notice && <p role="status">{notice}</p>}
      {error && (
        <p role="alert" className="alert">
          {error}
        </p>
      )}
    </div>
  );
}
