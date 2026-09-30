"use client";

import React, { useState } from "react";
import { Image as ImageIcon, Download, Maximize2, X, FileText, ExternalLink } from "lucide-react";

export interface ExtractedAttachment {
  name: string;
  url: string;
  isImage: boolean;
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

  // 1. Markdown image syntax: ![alt](url)
  const markdownImgRegex = /!\[(.*?)\]\((data:image\/[^)]+|https?:\/\/[^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = markdownImgRegex.exec(text)) !== null) {
    const name = match[1] || "Attached_Image.png";
    const url = match[2];
    attachments.push({
      name,
      url,
      isImage: true,
    });
  }
  clean = clean.replace(markdownImgRegex, "");

  // 2. Data URL detection: data:image/...
  const dataUrlRegex = /(data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=]+)/g;
  while ((match = dataUrlRegex.exec(text)) !== null) {
    const url = match[1];
    if (!attachments.some((a) => a.url === url)) {
      attachments.push({
        name: "attachment_image.png",
        url,
        isImage: true,
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
  const [activeModalImage, setActiveModalImage] = useState<{ name: string; url: string } | null>(null);

  const { cleanText, attachments } = extractAttachments(content);

  const handleDownload = (e: React.MouseEvent, url: string, filename: string) => {
    e.stopPropagation();
    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || "downloaded-image.png";
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

      {/* Render Attached Images if present */}
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
                maxWidth: "320px",
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
                  onClick={() => setActiveModalImage({ name: att.name, url: att.url })}
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
                    gap: "5px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: 600,
                  }}
                  title={att.name}
                >
                  <ImageIcon size={14} color={isCurrentUser ? "#FFFFFF" : "#FF5500"} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{att.name}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => setActiveModalImage({ name: att.name, url: att.url })}
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

      {/* Lightbox Modal for Full-Size Image Preview */}
      {activeModalImage && (
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
          onClick={() => setActiveModalImage(null)}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "92vw",
              maxHeight: "92vh",
              backgroundColor: "#1E293B",
              borderRadius: "16px",
              padding: "16px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
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
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ImageIcon size={18} color="#FF5500" />
                <span style={{ fontWeight: 700, fontSize: "14px" }}>{activeModalImage.name}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  onClick={(e) => handleDownload(e, activeModalImage.url, activeModalImage.name)}
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
                  onClick={() => setActiveModalImage(null)}
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

            {/* Modal Image Display */}
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
                src={activeModalImage.url}
                alt={activeModalImage.name}
                style={{
                  maxWidth: "100%",
                  maxHeight: "75vh",
                  borderRadius: "8px",
                  objectFit: "contain",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default TicketAttachmentRenderer;
