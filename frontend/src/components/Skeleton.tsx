import styles from "./Skeleton.module.css";

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
}

export function Skeleton({ width = "100%", height = "16px", borderRadius }: SkeletonProps) {
  return (
    <span
      className={styles.skeleton}
      style={{ width, height, borderRadius: borderRadius ?? "var(--radius)" }}
      aria-hidden="true"
    />
  );
}

interface SkeletonTextProps {
  lines?: number;
}

export function SkeletonText({ lines = 3 }: SkeletonTextProps) {
  return (
    <div className={styles.textBlock} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? "60%" : "100%"}
          height="14px"
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={styles.cardHeader}>
        <Skeleton width="28px" height="28px" borderRadius="6px" />
        <Skeleton width="55%" height="16px" />
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}
