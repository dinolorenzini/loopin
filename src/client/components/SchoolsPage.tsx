import React, { useState } from "react";
import {
  GraduationCap,
  ShieldCheck,
  Lock,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  FileText,
  Clock,
  Layers,
  HeartHandshake,
  UserCheck,
  Download,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { LoopinLogo } from "./LoopinLogo";

interface SchoolsPageProps {
  onBack: () => void;
  onStartClassroom: (roomName: string) => void;
}

export const SchoolsPage: React.FC<SchoolsPageProps> = ({
  onBack,
  onStartClassroom,
}) => {
  const [eduSubject, setEduSubject] = useState("");

  const handleLaunchEduRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = eduSubject.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    const roomName = clean ? `edu-${clean}` : `edu-classroom-${Math.floor(100 + Math.random() * 900)}`;
    onStartClassroom(roomName);
  };

  const sampleRooms = [
    "edu-algebra-101",
    "edu-biology-lab",
    "edu-history-group4",
    "edu-literature-review",
  ];

  return (
    <div className="schools-page-root">
      {/* Navigation Header */}
      <header className="schools-header">
        <div className="schools-nav-container">
          <div className="schools-brand-row">
            <button
              type="button"
              className="schools-back-btn"
              onClick={onBack}
              title="Return to Home"
              aria-label="Return to Home"
            >
              <ArrowLeft size={18} />
              <span>Back to Home</span>
            </button>

            <div className="schools-brand-badge">
              <LoopinLogo size={28} />
              <span className="schools-brand-name">Loopin for Schools</span>
            </div>
          </div>

          <div className="schools-header-right">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onStartClassroom(`edu-room-${Math.floor(100 + Math.random() * 900)}`)}
            >
              <Sparkles size={14} />
              <span>Instant Class Room</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Scroll Area */}
      <main className="schools-main-scroll">
        <div className="schools-hero-section">
          <div className="schools-hero-badge">
            <ShieldCheck size={15} className="text-accent" />
            <span>FERPA Compliant &bull; Strictly 13+ &bull; 100% Ephemeral</span>
          </div>

          <h1 className="schools-hero-title">
            Safe, Ephemeral Student Collaboration Built for Modern Education
          </h1>
          <p className="schools-hero-subtitle">
            Loopin gives teachers and students instant, distraction-free breakout chat rooms. Zero user accounts, zero student profiling, automated PII protection, and total memory purge when class ends.
          </p>

          {/* Interactive Classroom Launcher */}
          <div className="schools-launcher-card">
            <h2 className="launcher-title">Start an Educational Classroom Room</h2>
            <p className="launcher-desc">
              Educational rooms automatically activate <strong>FERPA Protection</strong> and grant the teacher immediate <strong>Host &amp; Waiting Room</strong> controls.
            </p>

            <form onSubmit={handleLaunchEduRoom} className="schools-launch-form">
              <div className="launch-input-group">
                <span className="launch-prefix">#edu-</span>
                <input
                  type="text"
                  value={eduSubject}
                  onChange={(e) => setEduSubject(e.target.value.toLowerCase().slice(0, 24))}
                  placeholder="e.g. physics-period3"
                  className="launch-input"
                  maxLength={24}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-launch">
                <span>Open Classroom Room</span>
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="schools-quick-chips">
              <span className="quick-label">Or choose a template:</span>
              {sampleRooms.map((slug) => (
                <button
                  key={slug}
                  type="button"
                  className="quick-chip-btn"
                  onClick={() => onStartClassroom(slug)}
                >
                  #{slug}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Why Loopin for Schools: Core Pillars Grid */}
        <div className="schools-pillars-container">
          <h2 className="pillars-section-title">Why School Administrators Choose Loopin</h2>
          <p className="pillars-section-sub">
            Built from the ground up to solve the real safety, compliance, and IT challenges faced by schools.
          </p>

          <div className="schools-pillars-grid">
            {/* Pillar 1 */}
            <div className="pillar-card">
              <div className="pillar-icon-box">
                <ShieldCheck size={24} className="text-accent" />
              </div>
              <h3 className="pillar-title">100% FERPA Compliant (34 CFR &sect; 99.31)</h3>
              <p className="pillar-body">
                Loopin aligns with the <strong>School Official Exception</strong>. We operate under the direct control of your educational institution. We <strong>never</strong> build student marketing profiles, sell student data, or use student writing for unauthorized AI training.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="pillar-card">
              <div className="pillar-icon-box">
                <HeartHandshake size={24} className="text-accent" />
              </div>
              <h3 className="pillar-title">Safe Student Contact Without PII</h3>
              <p className="pillar-body">
                Students can collaborate on group assignments, science labs, and peer reviews <strong>without sharing personal phone numbers</strong>, home addresses, or social media handles. Built-in PII Guard actively blocks student directory information leaks.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="pillar-card">
              <div className="pillar-icon-box">
                <Lock size={24} className="text-accent" />
              </div>
              <h3 className="pillar-title">Teacher Ownership &amp; Waiting Room</h3>
              <p className="pillar-body">
                The educator who starts the room becomes the <strong>Room Host</strong>. Teachers can lock the room so students must <strong>knock to request permission to join</strong>, approve or deny entry, mute/remove disruptive participants, and delete messages.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="pillar-card">
              <div className="pillar-icon-box">
                <ShieldAlert size={24} className="text-accent" />
              </div>
              <h3 className="pillar-title">Strict Age Gating (13+ Only)</h3>
              <p className="pillar-body">
                Loopin strictly prohibits users under 13 from using the platform. Designed specifically for high schools, colleges, and students 13 and older, eliminating COPPA exposure and protecting school districts from parental consent liabilities.
              </p>
            </div>

            {/* Pillar 5 */}
            <div className="pillar-card">
              <div className="pillar-icon-box">
                <Clock size={24} className="text-accent" />
              </div>
              <h3 className="pillar-title">Ephemeral Auto-Wipe (Zero IT Overhead)</h3>
              <p className="pillar-body">
                No accounts, no lost passwords for IT helpdesks to reset. Messages live solely in temporary volatile RAM. When class ends and everyone disconnects, the room automatically <strong>purges completely from memory and storage</strong>.
              </p>
            </div>

            {/* Pillar 6 */}
            <div className="pillar-card">
              <div className="pillar-icon-box">
                <Download size={24} className="text-accent" />
              </div>
              <h3 className="pillar-title">Session Summaries for Teachers</h3>
              <p className="pillar-body">
                Before the class ends and the ephemeral room wipes, teachers have the option to export a structured session summary or transcript for participation grading, attendance, or educational recordkeeping under school oversight.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="schools-comparison-section">
          <h2 className="comparison-title">Loopin vs. Commercial Consumer Chat</h2>
          <p className="comparison-subtitle">
            Why consumer apps like Discord, WhatsApp, or standard SMS fail school safety standards:
          </p>

          <div className="comparison-table-wrapper">
            <table className="schools-comparison-table">
              <thead>
                <tr>
                  <th>Compliance &amp; Safety Feature</th>
                  <th>Loopin Classroom</th>
                  <th>Discord / Slack</th>
                  <th>SMS / WhatsApp</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>FERPA School Official Exception</strong></td>
                  <td className="table-highlight"><span className="table-status status-good"><CheckCircle2 size={15} /> Fully Compliant</span></td>
                  <td><span className="table-status status-bad"><XCircle size={15} /> Non-Compliant</span></td>
                  <td><span className="table-status status-bad"><XCircle size={15} /> Non-Compliant</span></td>
                </tr>
                <tr>
                  <td><strong>Protects Student Phone Numbers</strong></td>
                  <td className="table-highlight"><span className="table-status status-good"><CheckCircle2 size={15} /> Zero Phone PII</span></td>
                  <td><span className="table-status status-warn"><AlertTriangle size={15} /> Exposes Handles</span></td>
                  <td><span className="table-status status-bad"><XCircle size={15} /> Discloses Phone #</span></td>
                </tr>
                <tr>
                  <td><strong>Automatic Room Ephemeral Wipe</strong></td>
                  <td className="table-highlight"><span className="table-status status-good"><CheckCircle2 size={15} /> Instant on Exit</span></td>
                  <td><span className="table-status status-bad"><XCircle size={15} /> Permanent Logs</span></td>
                  <td><span className="table-status status-bad"><XCircle size={15} /> Stored on Device</span></td>
                </tr>
                <tr>
                  <td><strong>Teacher Waiting Room (Knock)</strong></td>
                  <td className="table-highlight"><span className="table-status status-good"><CheckCircle2 size={15} /> Built-in 1-Click</span></td>
                  <td><span className="table-status status-warn"><AlertTriangle size={15} /> Complex Roles</span></td>
                  <td><span className="table-status status-bad"><XCircle size={15} /> No Approval Gate</span></td>
                </tr>
                <tr>
                  <td><strong>Student Accounts Required</strong></td>
                  <td className="table-highlight"><span className="table-status status-good"><CheckCircle2 size={15} /> Zero Accounts</span></td>
                  <td><span className="table-status status-bad"><XCircle size={15} /> Email/Password Needed</span></td>
                  <td><span className="table-status status-bad"><XCircle size={15} /> Phone SIM Needed</span></td>
                </tr>
                <tr>
                  <td><strong>Chromebook &amp; iPad Native</strong></td>
                  <td className="table-highlight"><span className="table-status status-good"><CheckCircle2 size={15} /> Instant Web App</span></td>
                  <td><span className="table-status status-warn"><AlertTriangle size={15} /> Heavy Resource Use</span></td>
                  <td><span className="table-status status-bad"><XCircle size={15} /> Mobile Only</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="schools-faq-section">
          <h2 className="faq-title">Frequently Asked Questions for School Administrators</h2>
          <div className="faq-grid">
            <div className="faq-card">
              <h3 className="faq-q">Do students need to create an account or sign in with Google?</h3>
              <p className="faq-a">
                No. Loopin requires no email addresses, passwords, or personal accounts. Students simply open the room link provided by their teacher, pick their display name or safe animal alias, and begin collaborating immediately.
              </p>
            </div>

            <div className="faq-card">
              <h3 className="faq-q">How does the teacher control who enters the room?</h3>
              <p className="faq-a">
                The first person to enter the room becomes the Room Host. The teacher can click the Lock icon in the header to lock the room. New students who arrive are placed in a Waiting Room and must be approved by the teacher before they can see or send messages.
              </p>
            </div>

            <div className="faq-card">
              <h3 className="faq-q">What happens if a student types inappropriate content or personal information?</h3>
              <p className="faq-a">
                Loopin features an automated real-time PII Guard that detects and blocks phone numbers, emails, and street addresses before they are transmitted. The teacher can delete any inappropriate message in real-time or remove disruptive students.
              </p>
            </div>

            <div className="faq-card">
              <h3 className="faq-q">Can students access external or unrated GIFs and distractions?</h3>
              <p className="faq-a">
                In Educational Mode, external GIF search engines (GIPHY/Tenor) are disabled, keeping classroom discussions focused, fast, and free of unmonitored external media.
              </p>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="schools-cta-box">
          <GraduationCap size={40} className="text-accent" />
          <h2 className="cta-title">Ready to Bring Safe Ephemeral Chat to Your District?</h2>
          <p className="cta-desc">
            Have custom compliance requirements, need an institutional Data Protection Agreement (DPA), or want to schedule a walkthrough with your curriculum technology team?
          </p>
          <div className="cta-contact-row">
            <a href="mailto:schools@peretas.live" className="btn btn-primary">
              <span>Contact Education Team (schools@peretas.live)</span>
              <ExternalLink size={15} />
            </a>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onStartClassroom(`edu-demo-${Math.floor(100 + Math.random() * 900)}`)}
            >
              <span>Test a Demo Classroom</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
