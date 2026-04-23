import { motion } from "motion/react";

interface SkeletonProps {
  className?: string;
  variant?: "rect" | "circle" | "text";
}

export function Skeleton({ className = "", variant = "rect" }: SkeletonProps) {
  const baseClass = "bg-surface-container-high relative overflow-hidden";
  const variantClass = variant === "circle" ? "rounded-full" : variant === "text" ? "rounded-md h-4 w-full" : "rounded-2xl";

  return (
    <div className={`${baseClass} ${variantClass} ${className}`}>
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "linear",
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent w-full h-full"
      />
    </div>
  );
}

export function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-surface-container-low rounded-[2rem] p-4 space-y-4 border border-outline-variant/5">
          <Skeleton className="h-48 w-full" />
          <div className="space-y-2 px-2 pb-2">
            <Skeleton variant="text" className="w-3/4" />
            <Skeleton variant="text" className="w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReviewSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2].map((i) => (
        <div key={i} className="bg-surface-container-low rounded-[2rem] p-6 border border-outline-variant/10 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton variant="circle" className="w-12 h-12" />
            <div className="space-y-2 flex-1">
              <Skeleton variant="text" className="w-32" />
              <Skeleton variant="text" className="w-24" />
            </div>
          </div>
          <Skeleton variant="text" />
          <Skeleton variant="text" className="w-5/6" />
        </div>
      ))}
    </div>
  );
}
