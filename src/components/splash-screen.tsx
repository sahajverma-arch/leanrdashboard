'use client'

import { useEffect, useState } from 'react'
import LeanrLogo from '@/components/leanr-logo'

// Total lifetime of the splash overlay. The exit fade is pure CSS (starts at
// 2.45s, lasts 0.55s); this timer only removes the node from the DOM after it.
const SPLASH_DURATION_MS = 3150

/**
 * Animated brand intro shown on every full page load.
 *
 * Animates the shared LeanrLogo lockup via its lnr-* class hooks. All motion
 * is CSS keyframes with delays (scoped under .lnr-splash so other LeanrLogo
 * instances on the page stay static); JS only unmounts the overlay at the
 * end. Rendered in the initial HTML so it covers the page before hydration.
 */
export default function SplashScreen() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), SPLASH_DURATION_MS)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  return (
    <div className="lnr-splash" aria-hidden="true">
      <style>{SPLASH_CSS}</style>
      <div className="lnr-splash-glow" />
      <div className="lnr-splash-logo">
        <LeanrLogo withRule className="lnr-splash-svg" />
      </div>
    </div>
  )
}

const SPLASH_CSS = `
.lnr-splash {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse 90% 70% at 50% 45%, #101010 0%, #000000 70%);
  animation: lnrExit 0.55s cubic-bezier(0.4, 0, 0.2, 1) 2.45s forwards;
}

.lnr-splash-glow {
  position: absolute;
  width: 70vmin;
  height: 44vmin;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(255, 237, 0, 0.12), transparent 72%);
  opacity: 0;
  animation: lnrGlowIn 1.2s ease-out 0.35s forwards;
}

.lnr-splash-logo {
  position: relative;
  width: min(72vw, 520px);
  animation: lnrLogoExit 0.55s cubic-bezier(0.4, 0, 0.2, 1) 2.45s forwards;
}

.lnr-splash-svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.lnr-splash .lnr-letters {
  animation: lnrPulse 1.3s ease-in-out 1.15s;
}

/* Each letter starts off-screen left, blurred, and slams into place. */
.lnr-splash .lnr-letter {
  opacity: 0;
  transform: translateX(-48px);
  filter: blur(7px);
  animation: lnrLetterIn 0.5s cubic-bezier(0.2, 1.25, 0.4, 1) forwards;
}
.lnr-splash .lnr-letter:nth-child(1) { animation-delay: 0.15s; }
.lnr-splash .lnr-letter:nth-child(2) { animation-delay: 0.24s; }
.lnr-splash .lnr-letter:nth-child(3) { animation-delay: 0.33s; }
.lnr-splash .lnr-letter:nth-child(4) { animation-delay: 0.42s; }
.lnr-splash .lnr-letter:nth-child(5) { animation-delay: 0.51s; }

.lnr-splash .lnr-rule {
  transform: scaleX(0);
  transform-box: fill-box;
  transform-origin: left center;
  animation: lnrRuleIn 0.45s cubic-bezier(0.65, 0, 0.35, 1) 0.95s forwards;
}

.lnr-splash .lnr-by {
  opacity: 0;
  transform: translateY(10px);
  animation: lnrByIn 0.55s cubic-bezier(0.2, 0.8, 0.3, 1) 1.25s forwards;
}

@keyframes lnrLetterIn {
  to { opacity: 1; transform: translateX(0); filter: blur(0); }
}
@keyframes lnrRuleIn {
  to { transform: scaleX(1); }
}
@keyframes lnrByIn {
  to { opacity: 1; transform: translateY(0); }
}
@keyframes lnrGlowIn {
  to { opacity: 1; }
}
@keyframes lnrPulse {
  0%, 100% { filter: drop-shadow(0 0 0 rgba(255, 237, 0, 0)); }
  50% { filter: drop-shadow(0 0 22px rgba(255, 237, 0, 0.45)); }
}
@keyframes lnrExit {
  to { opacity: 0; visibility: hidden; }
}
@keyframes lnrLogoExit {
  to { transform: scale(1.06); }
}

@media (prefers-reduced-motion: reduce) {
  .lnr-splash .lnr-letter, .lnr-splash .lnr-by, .lnr-splash-glow { animation: none; opacity: 1; transform: none; filter: none; }
  .lnr-splash .lnr-rule { animation: none; transform: scaleX(1); }
  .lnr-splash .lnr-letters { animation: none; }
}
`
