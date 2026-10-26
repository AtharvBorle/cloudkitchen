"use client";

import React, { useState } from "react";
import { Image as ImageIcon, Download, Maximize2, X, FileText, ExternalLink } from "lucide-react";

export interface ExtractedAttachment {
  name: string;
  url: string;
  isImage: boolean;
  isPdf: boolean;
}

export const isPdfUrl = (url: string | null | undefined, name?: string | null, type?: string | null): boolean => {
  const cleanUrl = (url || "").trim().toLowerCase();
  const cleanName = (name || "").trim().toLowerCase();
  const cleanType = (type || "").trim().toLowerCase();

  return (
    cleanType.includes("application/pdf") ||
    cleanType.includes("pdf") ||
    cleanName.endsWith(".pdf") ||
    cleanUrl.startsWith("data:application/pdf") ||
    cleanUrl.includes(".pdf")
  );
};

/**
 * Parses markdown images, data URLs, and image/document links out of a message string.
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
    const name = match[1]?.trim() || "attachment";
    const type = match[2]?.trim() || "";
    const url = match[3]?.trim();
    if (url && !attachments.some((a) => a.url === url)) {
      const isPdf = isPdfUrl(url, name, type);
      const isImage = !isPdf && (
        (type ? type.startsWith("image/") : false) ||
        url.startsWith("data:image/") ||
        /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i.test(name)
      );
      attachments.push({
        name,
        url,
        isImage,
        isPdf,
      });
    }
  }
  clean = clean.replace(attachmentTagRegex, "");
  clean = clean.replace(/\[Attachment:\s*[^\]]+\]\s*/gi, "");

  // 2. Markdown image syntax: ![alt](url)
  const markdownImgRegex = /!\[(.*?)\]\((data:image\/[^)]+|https?:\/\/[^)]+)\)/g;
  while ((match = markdownImgRegex.exec(clean)) !== null) {
    const name = match[1] || "Attached_Image.png";
    const url = match[2];
    if (!attachments.some((a) => a.url === url)) {
      const isPdf = isPdfUrl(url, name);
      attachments.push({
        name,
        url,
        isImage: !isPdf,
        isPdf,
      });
    }
  }
  clean = clean.replace(markdownImgRegex, "");

  // 3. Raw Data URL detection: data:image/... OR data:application/pdf...
  const dataUrlRegex = /(data:(?:image\/[a-zA-Z0-9+.-]+|application\/pdf);base64,[A-Za-z0-9+/=]+)/g;
  while ((match = dataUrlRegex.exec(clean)) !== null) {
    const url = match[1];
    if (!attachments.some((a) => a.url === url)) {
      const isPdf = url.startsWith("data:application/pdf");
      attachments.push({
        name: isPdf ? "document.pdf" : "attachment_image.png",
        url,
        isImage: !isPdf,
        isPdf,
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
  const [activeModalDoc, setActiveModalDoc] = useState<{ name: string; url: string; isPdf?: boolean } | null>(null);

  const { cleanText, attachments } = extractAttachments(content);

  const handleDownload = (e: React.MouseEvent, url: string, filename: string) => {
    e.stopPropagation();
    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || "downloaded-file";
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

      {/* Render Attached Images & PDF Documents if present */}
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
              {/* Image Preview Thumbnail */}
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
                  onClick={() => setActiveModalDoc({ name: att.name, url: att.url, isPdf: false })}
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

              {/* PDF Preview Thumbnail Card */}
              {att.isPdf && (
                <div
                  style={{
                    position: "relative",
                    borderRadius: "8px",
                    backgroundColor: isCurrentUser ? "rgba(0,0,0,0.2)" : "#F1F5F9",
                    border: "1px solid #E2E8F0",
                    padding: "14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    transition: "all 0.15s ease",
                  }}
                  onClick={() => setActiveModalDoc({ name: att.name, url: att.url, isPdf: true })}
                  title="Click to preview PDF document"
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "8px",
                      backgroundColor: "#FEE2E2",
                      color: "#DC2626",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={20} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                      <span
                        style={{
                          backgroundColor: "#EF4444",
                          color: "#FFFFFF",
                          fontSize: "10px",
                          fontWeight: 800,
                          padding: "1px 5px",
                          borderRadius: "4px",
                          letterSpacing: "0.4px",
                        }}
                      >
                        PDF
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: isCurrentUser ? "#FFFFFF" : "#1E293B",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "block",
                        }}
                      >
                        {att.name}
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", color: isCurrentUser ? "rgba(255,255,255,0.75)" : "#64748B" }}>
                      Click to open in-app viewer
                    </span>
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
                    gap: "5px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: 600,
                  }}
                  title={att.name}
                >
                  {att.isPdf ? (
                    <FileText size={14} color="#EF4444" />
                  ) : att.isImage ? (
                    <ImageIcon size={14} color={isCurrentUser ? "#FFFFFF" : "#FF5500"} />
                  ) : (
                    <FileText size={14} color={isCurrentUser ? "#FFFFFF" : "#FF5500"} />
                  )}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{att.name}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => setActiveModalDoc({ name: att.name, url: att.url, isPdf: att.isPdf })}
                    style={{
                      background: "none",
                      border: "none",
                      color: isCurrentUser ? "#FFFFFF" : (att.isPdf ? "#2563EB" : "#FF5500"),
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

      {/* Lightbox Modal for Full-Size Image & In-App PDF Document Preview */}
      {activeModalDoc && (() => {
        const isPdf = Boolean(
          activeModalDoc.isPdf ||
          isPdfUrl(activeModalDoc.url, activeModalDoc.name)
        );

        return (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.88)",
              backdropFilter: "blur(6px)",
              zIndex: 999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
              boxSizing: "border-box",
            }}
            onClick={() => setActiveModalDoc(null)}
          >
            <div
              style={{
                position: "relative",
                width: isPdf ? "92vw" : "auto",
                maxWidth: isPdf ? "1100px" : "92vw",
                maxHeight: "92vh",
                backgroundColor: "#1E293B",
                borderRadius: "16px",
                padding: "16px",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
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
                  paddingBottom: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                  {isPdf ? (
                    <div
                      style={{
                        backgroundColor: "#EF4444",
                        color: "#FFFFFF",
                        borderRadius: "6px",
                        padding: "3px 8px",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        flexShrink: 0,
                      }}
                    >
                      <FileText size={13} color="#FFFFFF" />
                      <span>PDF</span>
                    </div>
                  ) : (
                    <ImageIcon size={18} color="#FF5500" style={{ flexShrink: 0 }} />
                  )}
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "14px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={activeModalDoc.name}
                  >
                    {activeModalDoc.name}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                  {isPdf && (
                    <a
                      href={activeModalDoc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open PDF in new tab"
                      style={{
                        backgroundColor: "#2563EB",
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
                        textDecoration: "none",
                      }}
                    >
                      <ExternalLink size={13} />
                      <span>Full Window</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleDownload(e, activeModalDoc.url, activeModalDoc.name)}
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
                    onClick={() => setActiveModalDoc(null)}
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

              {/* Viewer Frame: PDF in-app viewer vs Image viewer */}
              {isPdf ? (
                <div
                  style={{
                    width: "100%",
                    height: "75vh",
                    backgroundColor: "#33383B",
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: "1px solid #334155",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                  }}
                >
                  <object
                    data={activeModalDoc.url}
                    type="application/pdf"
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                      backgroundColor: "#525659",
                    }}
                  >
                    <iframe
                      src={activeModalDoc.url}
                      title={activeModalDoc.name || "PDF Document Viewer"}
                      style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                        backgroundColor: "#525659",
                      }}
                    >
                      <div
                        style={{
                          padding: "30px",
                          color: "#F8FAFC",
                          textAlign: "center",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          height: "100%",
                          gap: "12px",
                        }}
                      >
                        <FileText size={48} color="#EF4444" />
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>
                          Your browser does not support in-app PDF embedding.
                        </p>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <a
                            href={activeModalDoc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              backgroundColor: "#2563EB",
                              color: "#FFFFFF",
                              padding: "8px 16px",
                              borderRadius: "8px",
                              fontSize: "13px",
                              fontWeight: 700,
                              textDecoration: "none",
                            }}
                          >
                            Open in New Tab
                          </a>
                          <a
                            href={activeModalDoc.url}
                            download={activeModalDoc.name}
                            style={{
                              backgroundColor: "#FF5500",
                              color: "#FFFFFF",
                              padding: "8px 16px",
                              borderRadius: "8px",
                              fontSize: "13px",
                              fontWeight: 700,
                              textDecoration: "none",
                            }}
                          >
                            Download PDF
                          </a>
                        </div>
                      </div>
                    </iframe>
                  </object>
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
                    src={activeModalDoc.url}
                    alt={activeModalDoc.name}
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
        );
      })()}
    </div>
  );
};

export default TicketAttachmentRenderer;
