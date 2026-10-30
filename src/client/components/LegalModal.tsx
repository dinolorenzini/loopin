import React, { useState, useRef, useEffect } from "react";
import { Shield, FileText, X, Check, Lock } from "lucide-react";

export type LegalDocType = "tos" | "privacy";

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDoc?: LegalDocType;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialDoc = "tos",
}) => {
  const [activeDoc, setActiveDoc] = useState<LegalDocType>(initialDoc);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setActiveDoc(initialDoc);
  }, [initialDoc]);

  useEffect(() => {
    if (isOpen) {
      if (dialogRef.current && !dialogRef.current.open) {
        dialogRef.current.showModal();
      }
    } else {
      if (dialogRef.current && dialogRef.current.open) {
        dialogRef.current.close();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="profile-dialog legal-dialog"
      aria-labelledby="legal-dialog-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      <div className="profile-modal-content legal-modal-content">
        {/* Modal Header */}
        <div className="profile-modal-header legal-modal-header">
          <div className="modal-title-with-icon">
            <div className="legal-badge">
              {activeDoc === "tos" ? <FileText size={18} className="text-accent" /> : <Shield size={18} className="text-accent" />}
            </div>
            <div>
              <h2 id="legal-dialog-title" className="modal-title">
                {activeDoc === "tos" ? "Terms of Service" : "Privacy Policy"}
              </h2>
              <p className="modal-subtitle">Loopin &bull; Private Ephemeral Real-Time Chat</p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close legal documents"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="legal-tabs-row" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeDoc === "tos"}
            className={`legal-tab-btn ${activeDoc === "tos" ? "active" : ""}`}
            onClick={() => setActiveDoc("tos")}
          >
            <FileText size={14} />
            <span>Terms of Service</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeDoc === "privacy"}
            className={`legal-tab-btn ${activeDoc === "privacy" ? "active" : ""}`}
            onClick={() => setActiveDoc("privacy")}
          >
            <Shield size={14} />
            <span>Privacy Policy</span>
          </button>
        </div>

        {/* Document Scrollable Body */}
        <div className="legal-doc-scroll">
          {activeDoc === "tos" ? (
            <div className="legal-prose">
              <div className="legal-callout">
                <Lock size={15} className="text-accent" />
                <span>
                  <strong>Key Summary:</strong> Loopin is a volatile, private ephemeral chat service. We never permanently store your chats or sell data.
                </span>
              </div>

              <h3>1. Agreement to Terms</h3>
              <p>
                By accessing, browsing, or connecting to any Loopin room or chat channel (collectively, the &ldquo;Service&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you disagree with any part of these Terms, you may not use the Service.
              </p>

              <h3>2. Nature of the Ephemeral Service</h3>
              <p>
                Loopin is designed solely for instant, short-lived communications. Messages, attachments, and participant states exist exclusively in volatile computer memory (RAM) powered by edge compute workers. Once all participants leave a room or the session expires, chat messages are erased permanently and cannot be recovered or restored by Loopin or any third party.
              </p>

              <h3>3. Acceptable Use Policy</h3>
              <p>You agree not to use Loopin to transmit, link, or exchange:</p>
              <ul>
                <li>Any illegal content, CSAM, exploitation, or non-consensual imagery.</li>
                <li>Malware, viruses, trojans, ransomware, or exploits.</li>
                <li>Harassment, threats, stalking, hate speech, or incitement to violence.</li>
                <li>Automated high-frequency scraping, flooding, or denial-of-service attempts.</li>
              </ul>

              <h3>4. No Warranties (&ldquo;As-Is&rdquo;)</h3>
              <p>
                THE SERVICE IS PROVIDED ON AN &ldquo;AS-IS&rdquo; AND &ldquo;AS-AVAILABLE&rdquo; BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, UPTIME, AND NON-INFRINGEMENT.
              </p>

              <h3>5. Limitation of Liability</h3>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, LOOPIN, ITS DIRECTORS, EMPLOYEES, AND PARTNERS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES, OR FOR LOSS OF PROFITS, DATA, OR PRIVACY ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE.
              </p>

              <h3>6. Modifications &amp; Legal Inquiries</h3>
              <p>
                We reserve the right to revise these Terms at any time by updating this document. Continued use of Loopin constitutes acceptance of any revisions. For legal notices, DMCA requests, or abuse reports, contact <code>legal@peretas.live</code>.
              </p>
            </div>
          ) : (
            <div className="legal-prose">
              <div className="legal-callout">
                <Shield size={15} className="text-accent" />
                <span>
                  <strong>Privacy First:</strong> No user accounts, no tracking cookies, no advertising profiling, zero persistent server databases.
                </span>
              </div>

              <h3>1. What Data We Collect &amp; Process</h3>
              <p>
                Loopin was engineered from day one to respect complete user privacy and anonymity:
              </p>
              <ul>
                <li>
                  <strong>Chat Messages &amp; Media:</strong> Messages and images transmitted through Loopin reside strictly in temporary volatile memory (RAM) on Cloudflare Durable Objects. They are <strong>never</strong> recorded in persistent databases or long-term disk logs.
                </li>
                <li>
                  <strong>Display Name &amp; Color:</strong> Your chosen nickname and accent colors are stored solely on your own device in your browser&rsquo;s <code>localStorage</code>.
                </li>
                <li>
                  <strong>No User Accounts:</strong> You do not register with an email address, phone number, password, or real identity.
                </li>
              </ul>

              <h3>2. Zero Third-Party Tracking</h3>
              <p>
                We do not use advertising tracking networks, Google Analytics, Facebook pixels, or fingerprinting scripts. We do not sell, rent, or monetize your data under any circumstances.
              </p>

              <h3>3. Infrastructure &amp; Technical Routing</h3>
              <p>
                To deliver WebSocket packets across edge nodes and safeguard against network attacks, traffic passes through Cloudflare&rsquo;s secure global edge network. Cloudflare handles transient network packet routing in compliance with international privacy standards.
              </p>

              <h3>4. Local Data Control &amp; Deletion</h3>
              <p>
                You hold complete control over client data. You can erase all stored nicknames, room histories, and preference configurations at any time by clicking <strong>&ldquo;Clear all local data&rdquo;</strong> in Settings &gt; Privacy &amp; Data.
              </p>

              <h3>5. Contact &amp; Questions</h3>
              <p>
                If you have inquiries regarding privacy practices or technical security, contact the Loopin security team at <code>privacy@peretas.live</code>.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="legal-modal-footer">
          <button
            type="button"
            className="btn btn-primary legal-done-btn"
            onClick={onClose}
          >
            <Check size={15} />
            <span>Understood</span>
          </button>
        </div>
      </div>
    </dialog>
  );
};
