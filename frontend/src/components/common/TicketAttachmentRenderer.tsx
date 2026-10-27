"use client";

import React, { useState, useEffect } from "react";
import { Image as ImageIcon, Download, Maximize2, X, FileText, ExternalLink, Copy, Check, Loader2 } from "lucide-react";

export interface ExtractedAttachment {
  name: string;
  url: string;
  isImage: boolean;
  isText?: boolean;
}

export function isImageFile(name: string = "", url: string = "", type: string = ""): boolean {
  if (type && type.toLowerCase().startsWith("image/")) return true;
  if (/\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/i.test(name)) return true;
  if (url.startsWith("data:image/")) return true;
  return false;
}

export function isPdfFile(name: string = "", url: string = "", type: string = ""): boolean {
  if (type && type.toLowerCase().includes("pdf")) return true;
  if (name.toLowerCase().endsWith(".pdf")) return true;
  if (url.startsWith("data:application/pdf") || url.toLowerCase().includes(".pdf")) return true;
  return false;
}

export function isTextFile(name: string = "", url: string = "", type: string = ""): boolean {
  if (type && (type.toLowerCase().startsWith("text/") || type.toLowerCase().includes("json") || type.toLowerCase().includes("csv"))) return true;
  if (/\.(txt|log|csv|json|md|xml|env|ini|conf|tsv|sql)$/i.test(name)) return true;
  if (url.startsWith("data:text/") || url.startsWith("data:application/json")) return true;
  return false;
}

export function decodeDataUrlToText(dataUrl: string): string {
  try {
    const commaIdx = dataUrl.indexOf(",");
    if (commaIdx === -1) return dataUrl;
    const meta = dataUrl.slice(0, commaIdx);
    const rawData = dataUrl.slice(commaIdx + 1);
    if (meta.includes(";base64")) {
      const binStr = atob(rawData);
      const bytes = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) {
        bytes[i] = binStr.charCodeAt(i);
      }
      return new TextDecoder("utf-8").decode(bytes);
    } else {
      return decodeURIComponent(rawData);
    }
  } catch (err) {
    console.error("Failed to decode dataUrl to text:", err);
    return "";
  }
}

/**
 * Parses markdown images, data URLs, and image links out of a message string.
 */
export function extractAttachments(text: string): {
  cleanText: string;
  attachments: ExtractedAttachment[];
} {
  if (!text || typeof text !== "string") {
    return { cleanText: "", attachments: [] };
  }

  const attachments: ExtractedAttachment[] = [];
  let clean = text;

  // 1. Explicit Attachment syntax: [Attachment: name|type]\n(url or data:...)
  const attachmentTagRegex = /\[Attachment:\s*([^\]|]+)(?:\|([^\]]+))?\]\s*(data:[a-zA-Z0-9+.-]+\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=]+|https?:\/\/[^\s\n]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = attachmentTagRegex.exec(text)) !== null) {
    const name = match[1]?.trim() || "Attached_File";
    const type = match[2]?.trim() || "";
    const url = match[3]?.trim();
    if (url && !attachments.some((a) => a.url === url)) {
      attachments.push({
        name,
        url,
        isImage: isImageFile(name, url, type),
        isText: isTextFile(name, url, type),
      });
    }
  }
  clean = clean.replace(attachmentTagRegex, "");
  clean = clean.replace(/\[Attachment:\s*[^\]]+\]\s*/gi, "");

  // 2. Markdown image syntax: ![alt](url)
  const markdownImgRegex = /!\[(.*?)\]\((data:[^)]+|https?:\/\/[^)]+)\)/g;
  while ((match = markdownImgRegex.exec(clean)) !== null) {
    const name = match[1] || "Attached_File";
    const url = match[2];
    if (!attachments.some((a) => a.url === url)) {
      attachments.push({
        name,
        url,
        isImage: isImageFile(name, url),
        isText: isTextFile(name, url),
      });
    }
  }
  clean = clean.replace(markdownImgRegex, "");

  // 3. Raw Data URL detection: data:image/... or data:text/...
  const dataUrlRegex = /(data:[a-zA-Z0-9+.-]+\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=]+)/g;
  while ((match = dataUrlRegex.exec(clean)) !== null) {
    const url = match[1];
    if (!attachments.some((a) => a.url === url)) {
      const isImg = isImageFile("", url);
      const isTxt = isTextFile("", url);
      attachments.push({
        name: isTxt ? "attachment.txt" : "attachment_image.png",
        url,
        isImage: isImg,
        isText: isTxt,
      });
    }
  }
  clean = clean.replace(dataUrlRegex, "");

  // Clean trailing empty lines or redundant spacing
  clean = clean
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { cleanText: clean, attachments };
}

interface TicketAttachmentRendererProps {
  content: string;
  isCurrentUser?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const TicketAttachmentRenderer: React.FC<TicketAttachmentRendererProps> = ({
  content,
  isCurrentUser = false,
  className,
  style,
}) => {
  const [activeModalAttachment, setActiveModalAttachment] = useState<ExtractedAttachment | null>(null);
  const [textContent, setTextContent] = useState<string>("");
  const [loadingText, setLoadingText] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  const { cleanText, attachments } = extractAttachments(content);

  useEffect(() => {
    if (!activeModalAttachment) {
      setTextContent("");
      setLoadingText(false);
      setCopiedText(false);
      return;
    }

    const { name, url } = activeModalAttachment;
    if (isTextFile(name, url)) {
      setLoadingText(true);
      // Try sync decode for data URLs first
      if (url.startsWith("data:")) {
        try {
          const decoded = decodeDataUrlToText(url);
          if (decoded) {
            setTextContent(decoded);
            setLoadingText(false);
            return;
          }
        } catch {
          // fallback to fetch below
        }
      }

      // Fetch fallback for data URLs or remote URLs
      fetch(url)
        .then((res) => res.text())
        .then((txt) => {
          setTextContent(txt);
        })
        .catch((err) => {
          console.error("Error reading text attachment:", err);
          setTextContent("Failed to display text content.");
        })
        .finally(() => {
          setLoadingText(false);
        });
    }
  }, [activeModalAttachment]);

  const handleDownload = (e: React.MouseEvent, url: string, filename: string) => {
    e.stopPropagation();
    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || (isTextFile(filename, url) ? "document.txt" : "downloaded-image.png");
      document.body.appendChild(link);
      link.click();
      if (link.parentNode) link.parentNode.removeChild(link);
    } catch {
      window.open(url, "_blank");
    }
  };

  return (
    <div className={className} style={{ display: "flex", flexDirection: "column", gap: "8px", ...style }}>
      {/* Clean text with markdown formatting and line breaks preserved */}
      {cleanText && (
        <div style={{ whiteSpace: "pre-line", wordBreak: "break-word" }}>
          {(() => {
            const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
            const parseBold = (str: string, keyPrefix: string) => {
              const boldRegex = /\*\*([^*]+)\*\*/g;
              const segments: (string | React.ReactNode)[] = [];
              let lastIdx = 0;
              let bMatch: RegExpExecArray | null;
              while ((bMatch = boldRegex.exec(str)) !== null) {
                if (bMatch.index > lastIdx) {
                  segments.push(str.substring(lastIdx, bMatch.index));
                }
                segments.push(
                  <strong key={`${keyPrefix}-b-${bMatch.index}`} style={{ fontWeight: "750", color: "inherit" }}>
                    {bMatch[1]}
                  </strong>
                );
                lastIdx = boldRegex.lastIndex;
              }
              if (lastIdx < str.length) {
                segments.push(str.substring(lastIdx));
              }
              return segments;
            };

            const parts: (string | React.ReactNode)[] = [];
            let lastIndex = 0;
            let match: RegExpExecArray | null;

            while ((match = linkRegex.exec(cleanText)) !== null) {
              const [fullMatch, linkText, linkUrl] = match;
              const index = match.index;

              if (index > lastIndex) {
                parts.push(...parseBold(cleanText.substring(lastIndex, index), `txt-${index}`));
              }

              parts.push(
                <a
                  key={`link-${index}`}
                  href={linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: isCurrentUser ? "#FFFFFF" : "#FF5500",
                    fontWeight: "700",
                    textDecoration: "underline",
                  }}
                >
                  {linkText}
                </a>
              );

              lastIndex = linkRegex.lastIndex;
            }

            if (lastIndex < cleanText.length) {
              parts.push(...parseBold(cleanText.substring(lastIndex), `txt-end`));
            }

            return parts.length > 0 ? parts : cleanText;
          })()}
        </div>
      )}

      {/* Render Attached Images & Files if present */}
      {attachments.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginTop: cleanText ? "6px" : "0",
          }}
        >
          {attachments.map((att, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: isCurrentUser ? "rgba(255, 255, 255, 0.12)" : "#F8FAFC",
                border: isCurrentUser ? "1px solid rgba(255, 255, 255, 0.25)" : "1.5px solid #E2E8F0",
                borderRadius: "12px",
                padding: "8px 10px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                maxWidth: "340px",
                boxSizing: "border-box",
                overflow: "hidden",
              }}
            >
              {/* Image Preview Thumbnail (only for images) */}
              {att.isImage && (
                <div
                  style={{
                    position: "relative",
                    borderRadius: "8px",
                    overflow: "hidden",
                    backgroundColor: isCurrentUser ? "rgba(0,0,0,0.15)" : "#0F172A",
                    maxHeight: "180px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onClick={() => setActiveModalAttachment(att)}
                  title="Click to view full size image"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={att.url}
                    alt={att.name}
                    style={{
                      width: "100%",
                      maxHeight: "180px",
                      objectFit: "contain",
                      display: "block",
                      transition: "transform 0.2s ease",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: "6px",
                      right: "6px",
                      backgroundColor: "rgba(15, 23, 42, 0.75)",
                      color: "#FFFFFF",
                      padding: "3px 7px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <Maximize2 size={11} />
                    <span>Zoom</span>
                  </div>
                </div>
              )}

              {/* Attachment Footer bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  color: isCurrentUser ? "#FFFFFF" : "#475569",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: 600,
                  }}
                  title={att.name}
                >
                  {att.isImage ? (
                    <ImageIcon size={15} color={isCurrentUser ? "#FFFFFF" : "#FF5500"} style={{ flexShrink: 0 }} />
                  ) : (
                    <FileText size={15} color={isCurrentUser ? "#FFFFFF" : "#FF5500"} style={{ flexShrink: 0 }} />
                  )}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{att.name}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => setActiveModalAttachment(att)}
                    style={{
                      background: "none",
                      border: "none",
                      color: isCurrentUser ? "#FFFFFF" : "#FF5500",
                      cursor: "pointer",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      padding: "2px 4px",
                    }}
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDownload(e, att.url, att.name)}
                    style={{
                      background: isCurrentUser ? "rgba(255,255,255,0.2)" : "#FFF1E8",
                      border: "none",
                      color: isCurrentUser ? "#FFFFFF" : "#FF5500",
                      borderRadius: "6px",
                      cursor: "pointer",
                      padding: "4px 8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                    title="Download attachment"
                  >
                    <Download size={12} />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Preview Modal (Supports Images and Text Files) */}
      {activeModalAttachment && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(6px)",
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            boxSizing: "border-box",
          }}
          onClick={() => setActiveModalAttachment(null)}
        >
          <div
            style={{
              position: "relative",
              width: isTextFile(activeModalAttachment.name, activeModalAttachment.url) ? "100%" : "auto",
              maxWidth: isTextFile(activeModalAttachment.name, activeModalAttachment.url) ? "780px" : "92vw",
              maxHeight: "92vh",
              backgroundColor: "#1E293B",
              borderRadius: "16px",
              padding: "16px 20px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              boxSizing: "border-box",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: "#FFFFFF",
                borderBottom: "1px solid #334155",
                paddingBottom: "12px",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                {isTextFile(activeModalAttachment.name, activeModalAttachment.url) ? (
                  <FileText size={18} color="#FF5500" style={{ flexShrink: 0 }} />
                ) : (
                  <ImageIcon size={18} color="#FF5500" style={{ flexShrink: 0 }} />
                )}
                <span style={{ fontWeight: 700, fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {activeModalAttachment.name}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                {isTextFile(activeModalAttachment.name, activeModalAttachment.url) && textContent && (
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== "undefined" && navigator.clipboard) {
                        navigator.clipboard.writeText(textContent);
                        setCopiedText(true);
                        setTimeout(() => setCopiedText(false), 2000);
                      }
                    }}
                    style={{
                      backgroundColor: copiedText ? "#059669" : "#334155",
                      border: "none",
                      color: "#FFFFFF",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      fontWeight: 700,
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      transition: "all 0.15s ease",
                    }}
                    title="Copy full text content"
                  >
                    {copiedText ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedText ? "Copied!" : "Copy"}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => handleDownload(e, activeModalAttachment.url, activeModalAttachment.name)}
                  style={{
                    backgroundColor: "#FF5500",
                    border: "none",
                    color: "#FFFFFF",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <Download size={14} /> Download
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalAttachment(null)}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    color: "#94A3B8",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-label="Close Preview"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Modal Body: Text or Image */}
            {isTextFile(activeModalAttachment.name, activeModalAttachment.url) ? (
              <div
                style={{
                  width: "100%",
                  maxHeight: "72vh",
                  backgroundColor: "#0F172A",
                  borderRadius: "8px",
                  border: "1px solid #334155",
                  padding: "16px",
                  overflow: "auto",
                  boxSizing: "border-box",
                }}
              >
                {loadingText ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0", color: "#94A3B8", gap: "8px" }}>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Loading text content...</span>
                  </div>
                ) : (
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                      fontSize: "0.88rem",
                      lineHeight: "1.6",
                      color: "#F8FAFC",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      userSelect: "text",
                    }}
                  >
                    {textContent || "(Empty file content)"}
                  </pre>
                )}
              </div>
            ) : isPdfFile(activeModalAttachment.name, activeModalAttachment.url) ? (
              <div style={{ width: "100%", height: "72vh" }}>
                <iframe src={activeModalAttachment.url} title={activeModalAttachment.name} style={{ width: "100%", height: "100%", border: "none", borderRadius: "8px" }} />
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "auto",
                  maxHeight: "75vh",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeModalAttachment.url}
                  alt={activeModalAttachment.name}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "75vh",
                    borderRadius: "8px",
                    objectFit: "contain",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketAttachmentRenderer;
