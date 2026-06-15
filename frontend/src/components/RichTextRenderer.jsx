import { useMemo } from "react";
import DOMPurify from "dompurify";
import katex from "katex";
import "katex/dist/katex.min.css";

function decodeHtmlEntities(str = "") {
  if (typeof window === "undefined") return str;

  const textarea = document.createElement("textarea");
  textarea.innerHTML = str;
  return textarea.value;
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizeLatex(expr = "") {
  return decodeHtmlEntities(expr)
    .replace(/\u00A0/g, " ")   // non-breaking space -> normal space
    .replace(/&nbsp;/g, " ")
    .trim();
}

function renderMathInText(html) {
  if (!html) return "";

  let output = html;

  // Önce blok formüller
  output = output.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => {
    try {
      return katex.renderToString(normalizeLatex(expr), {
        throwOnError: false,
        displayMode: true,
      });
    } catch {
      return `<div>${escapeHtml(expr)}</div>`;
    }
  });

  // Sonra satır içi formüller
  output = output.replace(/\$([^$\n]+?)\$/g, (_, expr) => {
    try {
      return katex.renderToString(normalizeLatex(expr), {
        throwOnError: false,
        displayMode: false,
      });
    } catch {
      return `<span>${escapeHtml(expr)}</span>`;
    }
  });

  return output;
}

export default function RichTextRenderer({ content, className = "" }) {
  const safeHtml = useMemo(() => {
    const dirty = content || "";

    const sanitized = DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "b",
        "em",
        "i",
        "u",
        "ol",
        "ul",
        "li",
        "span",
        "div",
        "img"
      ],
      ALLOWED_ATTR: ["class", "style", "src", "alt", "width", "height"],
    });

    return renderMathInText(sanitized);
  }, [content]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}