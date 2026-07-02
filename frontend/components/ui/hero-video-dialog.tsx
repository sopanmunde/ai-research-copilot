"use client"

import { useState, useRef } from "react"
import { Play, XIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"

type AnimationStyle =
  | "from-bottom"
  | "from-center"
  | "from-top"
  | "from-left"
  | "from-right"
  | "fade"
  | "top-in-bottom-out"
  | "left-in-right-out"

interface HeroVideoProps {
  animationStyle?: AnimationStyle
  videoSrc?: string
  thumbnailSrc?: string
  thumbnailAlt?: string
  className?: string
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
}

const animationVariants = {
  "from-bottom": {
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
  "from-center": {
    initial: { scale: 0.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.5, opacity: 0 },
  },
  "from-top": {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
  },
  "from-left": {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
  },
  "from-right": {
    initial: { x: "100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  "top-in-bottom-out": {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
  "left-in-right-out": {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
}

export function HeroVideoDialog({
  animationStyle = "from-center",
  videoSrc = "/demo.mp4",
  thumbnailSrc = "/chat_dashboard.png",
  thumbnailAlt = "Video thumbnail",
  className,
  isOpen,
  onOpenChange,
  hideTrigger = false,
}: HeroVideoProps) {
  const [isOpenInternal, setIsOpenInternal] = useState(false)
  const isVideoOpen = isOpen !== undefined ? isOpen : isOpenInternal
  const setIsVideoOpen = onOpenChange || setIsOpenInternal

  const selectedAnimation = animationVariants[animationStyle]
  const isLocalVideo = videoSrc.endsWith(".mp4") || videoSrc.endsWith(".webm") || videoSrc.startsWith("/") || !videoSrc.startsWith("http");

  return (
    <div className={cn(!hideTrigger && "relative", className)}>
      {!hideTrigger && (
        <button
          type="button"
          aria-label="Play video"
          className="group relative cursor-pointer border-0 bg-transparent p-0"
          onClick={() => setIsVideoOpen(true)}
        >
          <img
            src={thumbnailSrc}
            alt={thumbnailAlt}
            width={1920}
            height={1080}
            className="w-full rounded-md border shadow-lg transition-all duration-200 ease-out group-hover:brightness-[0.8]"
          />
          <div className="absolute inset-0 flex scale-[0.9] items-center justify-center rounded-2xl transition-all duration-200 ease-out group-hover:scale-100">
            <div className="bg-primary/10 flex size-28 items-center justify-center rounded-full backdrop-blur-md">
              <div
                className={`from-primary/30 to-primary relative flex size-20 scale-100 items-center justify-center rounded-full bg-linear-to-b shadow-md transition-all duration-200 ease-out group-hover:scale-[1.2]`}
              >
                <Play
                  className="size-8 scale-100 fill-white text-white transition-transform duration-200 ease-out group-hover:scale-105"
                  style={{
                    filter:
                      "drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06))",
                  }}
                />
              </div>
            </div>
          </div>
        </button>
      )}
      <AnimatePresence>
        {isVideoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
                setIsVideoOpen(false)
              }
            }}
            onClick={() => setIsVideoOpen(false)}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
          >
            <motion.div
              {...selectedAnimation}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative mx-4 aspect-video w-full max-w-4xl md:mx-0"
            >
              <motion.button className="absolute -top-16 right-0 rounded-full bg-neutral-900/50 p-2 text-xl text-white ring-1 backdrop-blur-md dark:bg-neutral-100/50 dark:text-black">
                <XIcon className="size-5" />
              </motion.button>
              <div className="relative isolate z-1 size-full overflow-hidden rounded-2xl border-2 border-white">
                {isLocalVideo ? (
                  <LocalVideoPlayer src={videoSrc} />
                ) : (
                  <iframe
                    src={videoSrc}
                    title="Hero Video player"
                    className="mt-0 size-full rounded-2xl"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  ></iframe>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function LocalVideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent closing the main modal dialog
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch((err) => {
          console.error("Failed to play video:", err)
        })
      }
    }
  }

  return (
    <div className="relative size-full group/video">
      <video
        ref={videoRef}
        src={src}
        controls
        autoPlay
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="size-full rounded-2xl object-cover"
        onClick={(e) => e.stopPropagation()} // Prevent modal close on click
      />
      {!isPlaying && (
        <div
          onClick={handlePlayPause}
          className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] rounded-2xl cursor-pointer transition-all duration-300"
        >
          <div className="bg-black/50 hover:bg-black/60 flex size-24 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 shadow-2xl border border-white/20">
            <Play className="size-10 fill-white text-white translate-x-1" />
          </div>
        </div>
      )}
    </div>
  )
}
