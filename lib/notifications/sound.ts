const SOUND_DEBOUNCE_MS = 900;

function now() {
  return Date.now();
}

export function createDashboardNotificationPlayer() {
  let audioContext: AudioContext | null = null;
  let removeUnlockListeners: (() => void) | null = null;
  let lastPlayedAt = 0;

  function getAudioContext() {
    if (audioContext) {
      return audioContext;
    }

    const Context =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!Context) {
      return null;
    }

    audioContext = new Context();
    return audioContext;
  }

  async function unlock() {
    const context = getAudioContext();
    if (!context) {
      return false;
    }

    if (context.state === "suspended") {
      try {
        await context.resume();
      } catch {
        return false;
      }
    }

    return context.state === "running";
  }

  function attachUnlockListeners() {
    if (removeUnlockListeners) {
      return removeUnlockListeners;
    }

    const handleUnlock = () => {
      void unlock().then((didUnlock) => {
        if (didUnlock) {
          removeUnlockListeners?.();
          removeUnlockListeners = null;
        }
      });
    };

    const options: AddEventListenerOptions = {
      passive: true
    };

    window.addEventListener("pointerdown", handleUnlock, options);
    window.addEventListener("keydown", handleUnlock, options);

    removeUnlockListeners = () => {
      window.removeEventListener("pointerdown", handleUnlock, options);
      window.removeEventListener("keydown", handleUnlock, options);
    };

    return removeUnlockListeners;
  }

  async function play() {
    const context = getAudioContext();
    if (!context) {
      return false;
    }

    if (context.state !== "running") {
      return false;
    }

    if (now() - lastPlayedAt < SOUND_DEBOUNCE_MS) {
      return false;
    }

    lastPlayedAt = now();

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const masterGain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      660,
      context.currentTime + 0.18
    );

    gainNode.gain.setValueAtTime(0.0001, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + 0.34
    );

    masterGain.gain.setValueAtTime(0.9, context.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(masterGain);
    masterGain.connect(context.destination);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.35);

    return true;
  }

  function dispose() {
    removeUnlockListeners?.();
    removeUnlockListeners = null;
  }

  return {
    attachUnlockListeners,
    dispose,
    play,
    unlock
  };
}
