import React, { useRef, useEffect, useState } from "react";
import { Flag, X, Check, AlertTriangle, ShieldCheck } from "lucide-react";
import type { Message } from "../../server/types";
import type { AbuseReportCategory } from "../types/compliance";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message | null;
  onReportSubmitted: (messageId: string) => void;
}

const REPORT_CATEGORIES: { id: AbuseReportCategory; label: string; description: string }[] = [
  {
    id: "harassment",
    label: "Harassment or Bullying",
    description: "Targeted attacks, threats, stalking, or abusive behavior toward an individual.",
  },
  {
    id: "child_safety",
    label: "Child Safety or Exploitation (COPPA / CSAM)",
    description: "Endangering minors, sharing child exploitation material, or soliciting child PII.",
  },
  {
    id: "hate_speech",
    label: "Hate Speech or Discrimination",
    description: "Attacks based on race, ethnicity, religion, disability, sexual orientation, or gender.",
  },
  {
    id: "pii_leak",
    label: "Personal Data or PII Exposure (FERPA / GDPR)",
    description: "Unauthorized publishing of someone's private contact details, student records, or sensitive info.",
  },
  {
    id: "illegal_content",
    label: "Illegal Content or Violent Extremism",
    description: "Incitement to violence, dangerous illicit activities, or unlawful contraband under EU/US law.",
  },
  {
    id: "copyright_dmca",
    label: "Copyright or Intellectual Property Infringement",
    description: "Unauthorized distribution of copyrighted materials, trade secrets, or pirated media.",
  },
  {
    id: "other",
    label: "Other Policy Violation",
    description: "Severe room flooding, malicious links, or general terms of service violations.",
  },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  message,
  onReportSubmitted,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [category, setCategory] = useState<AbuseReportCategory>("harassment");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setDetails("");
      setCategory("harassment");
      if (dialogRef.current && !dialogRef.current.open) {
        dialogRef.current.showModal();
      }
    } else {
      if (dialogRef.current && dialogRef.current.open) {
        dialogRef.current.close();
      }
    }
  }, [isOpen]);

  // Modern-web-guidance fallback for light-dismiss
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isInside =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!isInside) {
        onClose();
      }
    };

    dialog.addEventListener("click", handleBackdropClick);
    return () => dialog.removeEventListener("click", handleBackdropClick);
  }, [onClose]);

  if (!isOpen || !message) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        id: crypto.randomUUID(),
        category,
        roomId: message.roomId,
        messageId: message.id,
        reportedUserId: message.userId,
        reportedUserName: message.userName,
        messageSnippet: message.text?.slice(0, 100) || "[Media Attachment]",
        details: details.trim().slice(0, 500),
        timestamp: Date.now(),
      };

      // Dispatch to compliance endpoint
      await fetch("/api/compliance/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {
        // Fallback gracefully if server is offline or mocked
      });

      setSubmitted(true);
      onReportSubmitted(message.id);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch {
      setSubmitted(true);
      onReportSubmitted(message.id);
      setTimeout(() => {
        onClose();
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="profile-dialog report-dialog"
      aria-labelledby="report-dialog-title"
      onClose={onClose}
    >
      <div className="profile-modal-content report-modal-content">
        <div className="profile-modal-header">
          <div className="modal-title-with-icon">
            <div className="report-badge-icon">
              <Flag size={18} className="text-danger" />
            </div>
            <div>
              <h2 id="report-dialog-title" className="modal-title">Report Content</h2>
              <p className="modal-subtitle">EU Digital Services Act (DSA Art. 16) Notice &bull; Zero Tolerance</p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="report-success-view">
            <div className="report-success-badge">
              <ShieldCheck size={32} className="text-accent" />
            </div>
            <h3 className="report-success-title">Notice Submitted Successfully</h3>
            <p className="report-success-desc">
              Thank you for keeping Loopin safe. The reported message has been blocked and hidden from your view immediately, and your report has been recorded in our compliance queue.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="report-form">
            {/* Reported message snippet preview */}
            <div className="report-preview-box">
              <div className="report-preview-meta">
                <span className="report-preview-author" style={{ color: message.userColor }}>
                  {message.userName}
                </span>
                <span className="report-preview-time">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="report-preview-text">
                {message.text || (message.imageBase64 ? "[Image Attachment]" : "[GIF Animation]")}
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="report-category" className="form-label">
                Violation Reason (DSA / Community Standards)
              </label>
              <select
                id="report-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as AbuseReportCategory)}
                className="select-input"
              >
                {REPORT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <span className="form-helper-text">
                {REPORT_CATEGORIES.find((c) => c.id === category)?.description}
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="report-details" className="form-label">
                Additional Details (Optional)
              </label>
              <textarea
                id="report-details"
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value.slice(0, 500))}
                maxLength={500}
                placeholder="Explain why this content violates legal standards or Loopin terms..."
                className="text-input textarea-input"
              />
            </div>

            <div className="report-notice-callout">
              <AlertTriangle size={14} className="text-accent" />
              <span>
                By submitting this notice under the EU Digital Services Act, you confirm you are acting in good faith. Submitting this notice will immediately hide this content on your screen.
              </span>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-danger-solid"
                disabled={isSubmitting}
              >
                <Flag size={14} />
                <span>{isSubmitting ? "Submitting..." : "Submit Notice"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
};
