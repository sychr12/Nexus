import type { GeneratedDocKey } from "./config";
import { isValidDateInput } from "@/app/_lib/dateInput";
import { normalizeCoordinate, validateLatitude, validateLongitude } from "./coordinate-utils";

export function normalizeDocumentDraft(document: GeneratedDocKey, draft: Record<string, string>) {
  if (document !== "fac" && document !== "declaracao_produtor") {
    return draft;
  }

  return {
    ...draft,
    latitude: normalizeCoordinate(draft.latitude || "", "latitude"),
    longitude: normalizeCoordinate(draft.longitude || "", "longitude"),
  };
}

export function validateDocumentDraft(document: GeneratedDocKey, draft: Record<string, string>) {
  const invalidDateKey = Object.keys(draft).find((key) => {
    const value = draft[key]?.trim();
    return value && (key === "data" || key.toLowerCase().startsWith("data")) && !isValidDateInput(value);
  });

  if (invalidDateKey) {
    return "Use uma data valida no formato dia/mes/ano.";
  }

  if (document !== "fac") {
    const latitude = draft.latitude?.trim();
    const longitude = draft.longitude?.trim();

    if (latitude) {
      const latitudeError = validateLatitude(latitude);
      if (latitudeError) return latitudeError;
    }

    if (longitude) {
      const longitudeError = validateLongitude(longitude);
      if (longitudeError) return longitudeError;
    }

    return "";
  }

  const latitudeError = validateLatitude(draft.latitude || "");
  if (latitudeError) return latitudeError;

  return validateLongitude(draft.longitude || "");
}

export function printActiveDocument() {
  const source = document.querySelector(".sicpr-print-area .sicpr-print-document");
  if (!source) return;

  const styles = Array.from(document.querySelectorAll<HTMLLinkElement | HTMLStyleElement>("link[rel='stylesheet'], style"))
    .map((node) => node.outerHTML)
    .join("\n");

  const printFrame = document.createElement("iframe");
  printFrame.title = "FAC - Impressao";
  printFrame.style.position = "fixed";
  printFrame.style.right = "0";
  printFrame.style.bottom = "0";
  printFrame.style.width = "0";
  printFrame.style.height = "0";
  printFrame.style.border = "0";
  document.body.appendChild(printFrame);

  const printDocument = printFrame.contentDocument || printFrame.contentWindow?.document;
  if (!printDocument) {
    printFrame.remove();
    window.print();
    return;
  }

  printDocument.open();
  printDocument.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>FAC - Impressao</title>
        ${styles}
        <style>
          @page {
            size: A4 portrait;
            margin: 5mm;
          }

          html,
          body {
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
            background: #ffffff;
          }

          body {
            display: flex;
            justify-content: center;
            align-items: flex-start;
            box-sizing: border-box;
            overflow: hidden;
          }

          .sicpr-print-document {
            box-sizing: border-box !important;
            width: 188mm !important;
            max-width: 188mm !important;
            margin: 0 auto !important;
            background: #ffffff !important;
            box-shadow: none !important;
          }

          .sicpr-fac-document {
            min-height: 0 !important;
            padding: 2mm !important;
            transform-origin: top center;
            zoom: 0.9;
            break-after: avoid;
            break-before: avoid;
            break-inside: avoid;
            page-break-after: avoid;
            page-break-before: avoid;
            page-break-inside: avoid;
          }

          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        </style>
      </head>
      <body>
        ${source.outerHTML}
        <script>
          window.addEventListener("load", function () {
            setTimeout(function () {
              window.focus();
              window.print();
            }, 120);
          });
        </script>
      </body>
    </html>
  `);
  printDocument.close();

  const removeFrame = () => {
    setTimeout(() => printFrame.remove(), 300);
  };
  printFrame.contentWindow?.addEventListener("afterprint", removeFrame, { once: true });
}
