import { useEffect } from 'react'
import { useUI } from '../store/useUI.js'

// Blinks the whole app instead of laying an opaque black/white rectangle over the screen — the
// alert reads as the app itself flashing. It used to flip data-theme between dark and light,
// which was fine while there was one skin; now that a real second theme exists, flipping the
// theme would momentarily repaint the app in the other skin. The blink is therefore a dedicated
// transient attribute the stylesheet inverts off, independent of which theme is selected.
export default function TimerFlash() {
  const id = useUI(s => s.timerFlashId)
  useEffect(() => {
    if (!id) return
    const de = document.documentElement
    const show = () => de.setAttribute('data-flash', 'on')
    const hide = () => de.removeAttribute('data-flash')
    const steps = [show, hide, show, hide]
    const timers = steps.map((fn, i) => setTimeout(fn, i * 600))
    return () => {
      timers.forEach(clearTimeout)
      hide()
    }
  }, [id])
  return null
}
