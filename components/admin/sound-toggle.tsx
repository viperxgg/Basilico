"use client";

import styles from "@/components/admin/staff-dashboard.module.css";

type SoundToggleProps = {
  enabled: boolean;
  onToggle: () => void;
};

export function SoundToggle({ enabled, onToggle }: SoundToggleProps) {
  return (
    <button
      type="button"
      className={`${styles.headerControlButton} ${
        enabled ? styles.headerControlButtonActive : ""
      }`}
      onClick={onToggle}
      aria-pressed={enabled}
    >
      {enabled ? "Ljud på" : "Ljud av"}
    </button>
  );
}
