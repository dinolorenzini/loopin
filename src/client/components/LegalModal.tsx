import React, { useState, useRef, useEffect } from "react";
import { Shield, FileText, X, Check, Lock, Globe, GraduationCap, Sparkles, AlertCircle } from "lucide-react";

export type LegalDocType = "tos" | "privacy" | "eu_dsa" | "ferpa" | "coppa";

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

  const getDocTitle = () => {
    switch (activeDoc) {
      case "tos":
        return "Terms of Service";
      case "privacy":
        return "Privacy Policy (GDPR)";
      case "eu_dsa":
        return "EU Laws & Digital Services Act";
      case "ferpa":
        return "FERPA Student Privacy Notice";
      case "coppa":
        return "COPPA Direct Notice for Parents";
      default:
        return "Legal & Compliance";
    }
  };

  const getDocIcon = () => {
    switch (activeDoc) {
      case "tos":
        return <FileText size={18} className="text-accent" />;
      case "privacy":
        return <Shield size={18} className="text-accent" />;
      case "eu_dsa":
        return <Globe size={18} className="text-accent" />;
      case "ferpa":
        return <GraduationCap size={18} className="text-accent" />;
      case "coppa":
        return <Sparkles size={18} className="text-accent" />;
      default:
        return <Shield size={18} className="text-accent" />;
    }
  };

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
            <div className="legal-badge">{getDocIcon()}</div>
            <div>
              <h2 id="legal-dialog-title" className="modal-title">
                {getDocTitle()}
              </h2>
              <p className="modal-subtitle">Loopin &bull; Privacy-First Ephemeral Collaboration</p>
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
            <span>Terms</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeDoc === "privacy"}
            className={`legal-tab-btn ${activeDoc === "privacy" ? "active" : ""}`}
            onClick={() => setActiveDoc("privacy")}
          >
            <Shield size={14} />
            <span>Privacy (GDPR)</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeDoc === "eu_dsa"}
            className={`legal-tab-btn ${activeDoc === "eu_dsa" ? "active" : ""}`}
            onClick={() => setActiveDoc("eu_dsa")}
          >
            <Globe size={14} />
            <span>EU &amp; DSA</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeDoc === "ferpa"}
            className={`legal-tab-btn ${activeDoc === "ferpa" ? "active" : ""}`}
            onClick={() => setActiveDoc("ferpa")}
          >
            <GraduationCap size={14} />
            <span>FERPA (Schools)</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeDoc === "coppa"}
            className={`legal-tab-btn ${activeDoc === "coppa" ? "active" : ""}`}
            onClick={() => setActiveDoc("coppa")}
          >
            <Sparkles size={14} />
            <span>COPPA (Under 13)</span>
          </button>
        </div>

        {/* Document Scrollable Body */}
        <div className="legal-doc-scroll">
          {/* 1. TERMS OF SERVICE */}
          {activeDoc === "tos" && (
            <div className="legal-prose">
              <div className="legal-callout">
                <Lock size={15} className="text-accent" />
                <span>
                  <strong>Key Summary:</strong> Loopin is a volatile, private ephemeral chat service. We never permanently store your chats, profile, or sell data to advertisers.
                </span>
              </div>

              <h3>1. Agreement to Terms</h3>
              <p>
                By accessing, browsing, or connecting to any Loopin room or chat channel (collectively, the &ldquo;Service&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you disagree with any part of these Terms, you may not use the Service.
              </p>

              <h3>2. Nature of the Ephemeral Service</h3>
              <p>
                Loopin is designed solely for instant, short-lived communications. Messages, attachments, and participant states exist exclusively in volatile computer memory (RAM) powered by Cloudflare Durable Objects. Once all participants leave a room or the session expires, chat messages are erased permanently and cannot be recovered or restored by Loopin or any third party.
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

              <h3>6. Modifications &amp; Inquiries</h3>
              <p>
                We reserve the right to revise these Terms at any time by updating this document. For inquiries, contact <code>legal@peretas.live</code>.
              </p>
            </div>
          )}

          {/* 2. PRIVACY POLICY (GDPR & ePrivacy) */}
          {activeDoc === "privacy" && (
            <div className="legal-prose">
              <div className="legal-callout">
                <Shield size={15} className="text-accent" />
                <span>
                  <strong>GDPR Compliance:</strong> Data minimization by design, zero behavioral advertising, no tracking cookies, and full Data Subject Rights under Articles 15&ndash;22.
                </span>
              </div>

              <h3>1. Data Controller Information</h3>
              <p>
                Loopin Technology Operations acts as the Data Controller under Regulation (EU) 2016/679 (General Data Protection Regulation &ldquo;GDPR&rdquo;). Our designated Data Protection Officer (DPO) may be reached at <code>dpo@peretas.live</code>.
              </p>

              <h3>2. Lawful Bases for Processing (GDPR Art. 6)</h3>
              <ul>
                <li>
                  <strong>Performance of a Contract (Art. 6(1)(b)):</strong> Transient processing of real-time WebSocket frames to deliver messages between room participants.
                </li>
                <li>
                  <strong>Legitimate Interests (Art. 6(1)(f)):</strong> Edge DDoS prevention, rate limiting, and technical routing performed in volatile memory.
                </li>
                <li>
                  <strong>Consent (Art. 6(1)(a) &amp; ePrivacy):</strong> Explicit consent obtained through our Consent Banner for saving cosmetic preferences (themes, audio) and recent rooms in client <code>localStorage</code>.
                </li>
              </ul>

              <h3>3. Data Minimization &amp; Retention</h3>
              <p>
                All room communication (messages, emojis, reactions, images) exists exclusively in volatile edge RAM during active room connections. As soon as all room participants disconnect, all messages and in-memory states are instantly wiped with zero disk persistence.
              </p>

              <h3>4. Exercise of Data Subject Rights</h3>
              <ul>
                <li>
                  <strong>Right to Access &amp; Portability (Art. 15, 20):</strong> You can export a full JSON package of all client data stored on your browser at any time in Settings &gt; Privacy &amp; Data &gt; &ldquo;Export My Data&rdquo;.
                </li>
                <li>
                  <strong>Right to Erasure (&ldquo;Right to be Forgotten&rdquo;, Art. 17):</strong> Clicking &ldquo;Wipe All Data&rdquo; instantaneously purges all local storage and triggers an HTTP <code>Clear-Site-Data</code> directive.
                </li>
                <li>
                  <strong>Right to Rectification (Art. 16):</strong> You may edit your display identity or message contents in real-time.
                </li>
              </ul>

              <h3>5. International Transfers &amp; Infrastructure</h3>
              <p>
                Routing is provided through Cloudflare&rsquo;s edge network in accordance with European Commission Standard Contractual Clauses (SCCs) and ISO 27001/27701 certified data security standards.
              </p>
            </div>
          )}

          {/* 3. EU LAWS & DIGITAL SERVICES ACT (DSA) */}
          {activeDoc === "eu_dsa" && (
            <div className="legal-prose">
              <div className="legal-callout">
                <Globe size={15} className="text-accent" />
                <span>
                  <strong>EU Digital Services Act (Regulation EU 2022/2065):</strong> Transparent Notice &amp; Action mechanism, single point of contact, and moderation transparency.
                </span>
              </div>

              <h3>1. Single Point of Contact (DSA Art. 11 &amp; 12)</h3>
              <p>
                For communications with the European Commission, European Board for Digital Services, EU Member State authorities, and service recipients:
              </p>
              <ul>
                <li><strong>Electronic Point of Contact:</strong> <code>dsa@peretas.live</code></li>
                <li><strong>Supported Languages:</strong> English, German, French</li>
              </ul>

              <h3>2. Notice &amp; Action Mechanism (DSA Art. 16)</h3>
              <p>
                Loopin provides an integrated in-app reporting system. Any user or trusted flagger can click the <strong>Flag</strong> icon on any message to report illicit content (hate speech, CSAM, violent extremism, copyright infringement, harassment).
              </p>
              <p>
                Upon submitting a report:
              </p>
              <ul>
                <li>The reported content is immediately hidden from the reporting user&rsquo;s screen.</li>
                <li>The notice is dispatched to our compliance queue for rapid evaluation and room disconnection if confirmed illegal.</li>
              </ul>

              <h3>3. Content Moderation &amp; Out-of-Court Dispute Resolution (Art. 21)</h3>
              <p>
                Loopin maintains zero algorithmic profiling, zero automated ranking feeds, and zero recommender systems. If any account or IP is rate-limited or disconnected for abusive behavior, recipients have the right to select any out-of-court dispute settlement body certified under DSA Article 21.
              </p>
            </div>
          )}

          {/* 4. FERPA (STUDENT PRIVACY) */}
          {activeDoc === "ferpa" && (
            <div className="legal-prose">
              <div className="legal-callout">
                <GraduationCap size={15} className="text-accent" />
                <span>
                  <strong>FERPA Compliance (34 CFR Part 99):</strong> Protection of student education records, no commercialization or student profiling, and School Official Exception alignment.
                </span>
              </div>

              <h3>1. School Official Exception (34 CFR &sect; 99.31(a)(1)(i))</h3>
              <p>
                When educational agencies, school districts, or universities utilize Loopin for classroom breakout sessions, study groups, or peer communication, Loopin operates under the FERPA <strong>&ldquo;School Official&rdquo;</strong> exception:
              </p>
              <ul>
                <li>Loopin performs an institutional service for which the school would otherwise employ internal staff.</li>
                <li>Loopin remains under the direct control of the educational institution with respect to the use and maintenance of any temporary educational records.</li>
                <li>Loopin is subject to 34 CFR &sect; 99.33(a) governing the prohibition on re-disclosure of personally identifiable information (PII).</li>
              </ul>

              <h3>2. Strict Prohibition on Student Profiling &amp; Data Mining</h3>
              <p>
                Loopin will <strong>never</strong>:
              </p>
              <ul>
                <li>Build advertising profiles of students.</li>
                <li>Sell or license student data to third parties.</li>
                <li>Use student communications or media for artificial intelligence training without institutional consent.</li>
              </ul>

              <h3>3. FERPA Classroom Mode Safeguards</h3>
              <p>
                Schools and educators can activate <strong>&ldquo;FERPA Classroom Mode&rdquo;</strong> in Settings or use <code>edu-</code> room names:
              </p>
              <ul>
                <li>External GIF queries are suppressed to prevent third-party IP logging or unmonitored media.</li>
                <li>Automated PII detection blocks accidental transmission of student email addresses and phone numbers.</li>
                <li>Full room ephemerality ensures no permanent student records linger post-class.</li>
              </ul>
            </div>
          )}

          {/* 5. COPPA (CHILDREN UNDER 13) */}
          {activeDoc === "coppa" && (
            <div className="legal-prose">
              <div className="legal-callout">
                <Sparkles size={15} className="text-accent" />
                <span>
                  <strong>COPPA Direct Notice (16 CFR Part 312):</strong> Verified child safety for children under 13, zero PII collection, algorithmic safe aliases, and parental rights.
                </span>
              </div>

              <h3>1. Operator Information (16 CFR &sect; 312.4(c))</h3>
              <p>
                Loopin Child Safety &amp; Compliance Team<br />
                Email: <code>coppa@peretas.live</code><br />
                Address: Loopin Operations, Privacy Dept., PO Box 8812, Wilmington, DE 19899
              </p>

              <h3>2. Data Collection Practices for Children Under 13</h3>
              <p>
                Loopin is designed to protect child privacy by collecting <strong>zero personal identifiable information</strong>:
              </p>
              <ul>
                <li><strong>No Real Names:</strong> Children selecting &ldquo;Under 13&rdquo; are assigned friendly, randomized animal aliases (e.g. <em>&ldquo;Cosmic Dolphin 77&rdquo;</em>). Custom name typing is blocked to prevent revealing real names.</li>
                <li><strong>No Photo Uploads:</strong> Image and file attachments are disabled in Child-Safe Mode to prevent sharing real-world photos of minors or EXIF GPS metadata.</li>
                <li><strong>No Third-Party Tracking or External Media:</strong> External GIF searches are disabled.</li>
                <li><strong>Zero Telemetry:</strong> No persistent cookies, no device fingerprinting, and no marketing trackers.</li>
              </ul>

              <h3>3. Parental Rights (16 CFR &sect; 312.4(e))</h3>
              <p>
                Parents and legal guardians have the right to:
              </p>
              <ul>
                <li>Review any ephemeral session data associated with their child.</li>
                <li>Direct Loopin to delete any stored local preferences immediately.</li>
                <li>Refuse any further data processing without penalizing access to ephemeral room communication.</li>
              </ul>
              <p>
                To exercise any parental rights, contact our COPPA representative at <code>coppa@peretas.live</code>.
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
