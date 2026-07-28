"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LandingSkeletonProps {
  isLoading: boolean;
  children: React.ReactNode;
}

function SkeletonBar({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-border ${className ?? ""}`} />;
}

function SkeletonCircle({ size }: { size: number }) {
  return (
    <div
      className="animate-pulse rounded-full bg-border"
      style={{ width: size, height: size }}
    />
  );
}

export function LandingSkeleton({ isLoading, children }: LandingSkeletonProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Server + initial client hydration: render a static placeholder
  // to prevent mismatch (authLoading can differ between server & client)
  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  // After hydration: animated crossfade between skeleton and content
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background px-6"
        >
          {/* Icon placeholder */}
          <SkeletonCircle size={56} />

          {/* Title bar */}
          <SkeletonBar className="mt-8 h-10 w-72 sm:h-12 sm:w-96" />

          {/* Subtitle bar */}
          <SkeletonBar className="mt-4 h-5 w-56 sm:w-80" />

          {/* Button group */}
          <div className="mt-10 flex gap-4">
            <SkeletonBar className="h-12 w-36 rounded-xl" />
            <SkeletonBar className="h-12 w-36 rounded-xl" />
          </div>

          {/* Dashboard preview skeleton */}
          <div className="mt-16 w-full max-w-4xl">
            <div className="overflow-hidden rounded-2xl border border-border bg-surface-alt">
              {/* Traffic light dots */}
              <div className="flex items-center border-b border-border bg-surface px-5 py-3">
                <div className="flex gap-[6px]">
                  <SkeletonBar className="h-[10px] w-[10px] rounded-full" />
                  <SkeletonBar className="h-[10px] w-[10px] rounded-full" />
                  <SkeletonBar className="h-[10px] w-[10px] rounded-full" />
                </div>
              </div>

              <div className="space-y-4 p-5">
                {/* Row 1: Two cards */}
                <div className="flex flex-col md:flex-row gap-4">
                  <SkeletonBar className="h-32 w-full rounded-xl" />
                  <SkeletonBar className="h-32 w-full rounded-xl" />
                </div>

                {/* Row 2: Quick actions */}
                <div className="flex gap-3">
                  <SkeletonBar className="h-4 w-24" />
                  <SkeletonBar className="h-8 w-16 rounded-lg" />
                  <SkeletonBar className="h-8 w-14 rounded-lg" />
                  <SkeletonBar className="h-8 w-20 rounded-lg" />
                </div>

                {/* Row 3: Chart + Insights */}
                <div className="flex flex-col md:flex-row gap-4">
                  <SkeletonBar className="h-40 w-full rounded-xl" />
                  <SkeletonBar className="h-40 w-full rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.4 } }}
          className="min-h-screen"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
