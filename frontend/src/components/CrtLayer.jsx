// The DAEMON CRT layer: a single pointer-transparent plane of fixed overlays that gives the
// daemon theme its tube. It only mounts for daemon; the stylesheet owns every visual and the
// reduced-motion block turns the moving parts off while keeping the static scanning/vignette.
//
// Nothing here is interactive (aria-hidden, pointer-events:none) and nothing paints a large
// blur, so it cannot block a tap or cost a composited backdrop on scroll.
export default function CrtLayer({ active }) {
  if (!active) return null
  return (
    <div className="crt" aria-hidden="true">
      <span className="crt-bloom" />
      <span className="crt-scan" />
      <span className="crt-roll" />
      <span className="crt-tear" />
      <span className="crt-vig" />
    </div>
  )
}
