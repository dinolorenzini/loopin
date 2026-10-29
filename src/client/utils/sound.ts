// Web Audio API synthesized notification sound (zero external asset requests, zero latency)
class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Check localStorage for muted preference
    if (typeof window !== "undefined") {
      this.isMuted = localStorage.getItem("loopin_sound_muted") === "true";
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (typeof window !== "undefined") {
      localStorage.setItem("loopin_sound_muted", muted ? "true" : "false");
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playNotificationChime(): void {
    if (this.isMuted) return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Create two harmonic oscillators for a warm, soft chime (marimba / glass bell)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";

      // F frequencies: A5 (880Hz) and E6 (1318.5Hz)
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5

      osc2.frequency.setValueAtTime(880, now); // A5
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.08); // D6

      // Soft envelope
      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);

      osc1.stop(now + 0.36);
      osc2.stop(now + 0.36);
    } catch {
      // AudioContext unavailable or autoplay blocked
    }
  }
}

export const soundManager = new SoundManager();
