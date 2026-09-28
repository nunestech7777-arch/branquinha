import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const NO_TEXT_SEQUENCE = [
  "NÃO 😔",
  "TEM CERTEZA? 🥺",
  "PENSA BEM...",
  "EI 😭",
  "NÃO FAZ ISSO 🥺",
  "VAI NO SIM ❤️",
  "NEM TENTA 😂",
  "POR FAVOR 😭",
  "SIM É MELHOR ❤️",
  "DESISTE 😂",
];

interface RunawayButtonProps {
  avoidRef?: React.RefObject<HTMLElement | null>;
}

// The 12 slots the button is allowed to occupy, arranged in circular order
// around the question card (like points on a clock face) so that "adjacent"
// slots can be rejected to keep every jump visually noticeable.
type OrbitSlot =
  | 'top-left' | 'top-center' | 'top-right'
  | 'right-top' | 'right-center' | 'right-bottom'
  | 'bottom-right' | 'bottom-center' | 'bottom-left'
  | 'left-bottom' | 'left-center' | 'left-top';

const ORBIT_SLOTS: OrbitSlot[] = [
  'top-left', 'top-center', 'top-right',
  'right-top', 'right-center', 'right-bottom',
  'bottom-right', 'bottom-center', 'bottom-left',
  'left-bottom', 'left-center', 'left-top',
];

const MIN_GAP = 20; // px from the card's outer edge
const MAX_GAP = 100; // px from the card's outer edge
const CARD_SAFETY_PADDING = 20; // never allowed to overlap the card inside this padding

const VIEWPORT_MARGIN_SIDE = 16;
const VIEWPORT_MARGIN_TOP = 80; // keeps clear of the "POR FAVOR" badge
const VIEWPORT_MARGIN_BOTTOM = 16;

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

// Pure position math, kept outside the component so it can be exercised by
// a standalone test without needing a rendered DOM.
function computeSlotPosition(
  slot: OrbitSlot,
  card: Rect,
  buttonW: number,
  buttonH: number,
  gap: number,
): { left: number; top: number } {
  switch (slot) {
    case 'top-left':
      return { left: card.left, top: card.top - gap - buttonH };
    case 'top-center':
      return { left: card.left + card.width / 2 - buttonW / 2, top: card.top - gap - buttonH };
    case 'top-right':
      return { left: card.right - buttonW, top: card.top - gap - buttonH };
    case 'right-top':
      return { left: card.right + gap, top: card.top };
    case 'right-center':
      return { left: card.right + gap, top: card.top + card.height / 2 - buttonH / 2 };
    case 'right-bottom':
      return { left: card.right + gap, top: card.bottom - buttonH };
    case 'bottom-right':
      return { left: card.right - buttonW, top: card.bottom + gap };
    case 'bottom-center':
      return { left: card.left + card.width / 2 - buttonW / 2, top: card.bottom + gap };
    case 'bottom-left':
      return { left: card.left, top: card.bottom + gap };
    case 'left-bottom':
      return { left: card.left - gap - buttonW, top: card.bottom - buttonH };
    case 'left-center':
      return { left: card.left - gap - buttonW, top: card.top + card.height / 2 - buttonH / 2 };
    case 'left-top':
      return { left: card.left - gap - buttonW, top: card.top };
  }
}

// Guarantees the whole button stays inside the viewport and, if the clamp
// pushed it into the card's safety padding, shoves it back out along
// whichever side of the card currently has the most free space.
function clampToViewport(
  target: { left: number; top: number },
  vw: number,
  vh: number,
  buttonW: number,
  buttonH: number,
  card: Rect | null,
): { left: number; top: number } {
  const minX = VIEWPORT_MARGIN_SIDE;
  const maxX = Math.max(minX, vw - buttonW - VIEWPORT_MARGIN_SIDE);
  const minY = VIEWPORT_MARGIN_TOP;
  const maxY = Math.max(minY, vh - buttonH - VIEWPORT_MARGIN_BOTTOM);

  let x = Math.min(Math.max(target.left, minX), maxX);
  let y = Math.min(Math.max(target.top, minY), maxY);

  if (card) {
    const pad = CARD_SAFETY_PADDING;
    // Touching at exactly `pad` counts as clear (<=/>=), so a corrected
    // position that lands exactly on the safety boundary isn't re-flagged.
    const overlapsCard = !(
      x + buttonW + pad <= card.left ||
      x - pad >= card.right ||
      y + buttonH + pad <= card.top ||
      y - pad >= card.bottom
    );

    if (overlapsCard) {
      const spaceTop = card.top - minY;
      const spaceBottom = maxY + buttonH - card.bottom;
      const spaceLeft = card.left - minX;
      const spaceRight = maxX + buttonW - card.right;
      const bestSpace = Math.max(spaceTop, spaceBottom, spaceLeft, spaceRight);

      // Randomize the gap/alignment within whatever room this side has, so
      // the fallback doesn't always collapse to the same exact spot.
      const randomBetween = (min: number, max: number) => (max > min ? min + Math.random() * (max - min) : min);
      const alignRoll = Math.random();

      if (bestSpace === spaceTop || bestSpace === spaceBottom) {
        const available = Math.max(bestSpace - buttonH, pad);
        const gap = randomBetween(pad, Math.min(MAX_GAP, available));
        y = bestSpace === spaceTop ? card.top - gap - buttonH : card.bottom + gap;
        x = alignRoll < 0.33
          ? card.left
          : alignRoll < 0.66
            ? card.left + card.width / 2 - buttonW / 2
            : card.right - buttonW;
      } else {
        const available = Math.max(bestSpace - buttonW, pad);
        const gap = randomBetween(pad, Math.min(MAX_GAP, available));
        x = bestSpace === spaceLeft ? card.left - gap - buttonW : card.right + gap;
        y = alignRoll < 0.33
          ? card.top
          : alignRoll < 0.66
            ? card.top + card.height / 2 - buttonH / 2
            : card.bottom - buttonH;
      }

      x = Math.min(Math.max(x, minX), maxX);
      y = Math.min(Math.max(y, minY), maxY);
    }
  }

  return { left: x, top: y };
}

function isAdjacentSlot(a: number, b: number): boolean {
  const diff = Math.abs(a - b);
  return diff === 1 || diff === ORBIT_SLOTS.length - 1;
}

function pickNextSlotIndex(currentIndex: number): number {
  if (currentIndex === -1) {
    return Math.floor(Math.random() * ORBIT_SLOTS.length);
  }
  const candidates = ORBIT_SLOTS.map((_, i) => i).filter(
    (i) => i !== currentIndex && !isAdjacentSlot(i, currentIndex),
  );
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export const RunawayButton: React.FC<RunawayButtonProps> = ({ avoidRef }) => {
  const [hasMoved, setHasMoved] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const [textIndex, setTextIndex] = useState(0);

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const isMovingRef = useRef(false);
  const orbitIndexRef = useRef<number>(-1);
  const cursorRef = useRef<{ x?: number; y?: number }>({});
  // Tracks the last textIndex we actually repositioned for. Comparing
  // against this (instead of a one-shot "skip the first run" flag) keeps
  // the effect a no-op when React re-fires it without textIndex changing —
  // which StrictMode's dev-only double-invoke does, and a one-shot flag
  // can't tell apart from a real second render.
  const lastHandledTextIndexRef = useRef(0);

  const computeAndApplyPosition = useCallback(() => {
    const buttonEl = buttonRef.current;
    if (!buttonEl) {
      isMovingRef.current = false;
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const buttonRect = buttonEl.getBoundingClientRect();
    const buttonW = buttonRect.width || 160;
    const buttonH = buttonRect.height || 52;

    const cardEl = avoidRef?.current;
    const cardRect = cardEl ? cardEl.getBoundingClientRect() : null;

    const { x: cursorX, y: cursorY } = cursorRef.current;

    let finalPos: { left: number; top: number } | null = null;

    // Try a handful of non-adjacent slots so we can also dodge the cursor;
    // fall back to whatever slot comes up if none of them clear the cursor.
    const attempts = 4;
    let fallbackPos: { left: number; top: number } | null = null;
    let fallbackIndex = orbitIndexRef.current;

    for (let attempt = 0; attempt < attempts; attempt++) {
      const nextIndex = pickNextSlotIndex(orbitIndexRef.current);
      const slot = ORBIT_SLOTS[nextIndex];

      let candidate: { left: number; top: number };
      if (cardRect) {
        const gap = MIN_GAP + Math.random() * (MAX_GAP - MIN_GAP);
        candidate = computeSlotPosition(slot, cardRect, buttonW, buttonH, gap);
      } else {
        candidate = { left: vw / 2 - buttonW / 2, top: vh / 2 - buttonH / 2 };
      }

      candidate = clampToViewport(candidate, vw, vh, buttonW, buttonH, cardRect);

      if (attempt === 0) {
        fallbackPos = candidate;
        fallbackIndex = nextIndex;
      }

      if (cursorX !== undefined && cursorY !== undefined) {
        const distFromCursor = Math.hypot(
          candidate.left + buttonW / 2 - cursorX,
          candidate.top + buttonH / 2 - cursorY,
        );
        if (distFromCursor < 120) {
          continue;
        }
      }

      finalPos = candidate;
      orbitIndexRef.current = nextIndex;
      break;
    }

    if (!finalPos) {
      finalPos = fallbackPos ?? { left: pos.left, top: pos.top };
      orbitIndexRef.current = fallbackIndex;
    }

    setPos(finalPos);
    setHasMoved(true);

    setTimeout(() => {
      isMovingRef.current = false;
    }, 240);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avoidRef]);

  // Runs after each text change (i.e. after the DOM has the new label, so
  // buttonRect reflects the real width/height of the current text).
  useEffect(() => {
    if (textIndex === lastHandledTextIndexRef.current) {
      return;
    }
    lastHandledTextIndexRef.current = textIndex;
    computeAndApplyPosition();
  }, [textIndex, computeAndApplyPosition]);

  const moveButton = useCallback((cursorX?: number, cursorY?: number) => {
    if (isMovingRef.current) return;
    isMovingRef.current = true;
    cursorRef.current = { x: cursorX, y: cursorY };

    if (!hasMoved && buttonRef.current) {
      // Anchor the very first jump at the button's current in-flow spot so
      // it animates away from where it actually is, not from (0, 0).
      const initialRect = buttonRef.current.getBoundingClientRect();
      setPos({ left: initialRect.left, top: initialRect.top });
      setHasMoved(true);
    }

    setTextIndex((i) => (i + 1) % NO_TEXT_SEQUENCE.length);
  }, [hasMoved]);

  // Desktop: proximity detection (~75px) so it flees before the cursor lands
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const btnCenterX = rect.left + rect.width / 2;
        const btnCenterY = rect.top + rect.height / 2;

        const dist = Math.hypot(e.clientX - btnCenterX, e.clientY - btnCenterY);

        if (dist < 75) {
          moveButton(e.clientX, e.clientY);
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, [moveButton]);

  // Window resize: re-clamp the button around the card so it never ends up
  // stranded outside the viewport or drifted away after a layout change.
  useEffect(() => {
    const handleResize = () => {
      if (!hasMoved || !buttonRef.current) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const rect = buttonRef.current.getBoundingClientRect();
      const cardEl = avoidRef?.current;
      const cardRect = cardEl ? cardEl.getBoundingClientRect() : null;

      setPos((prev) => clampToViewport(prev, vw, vh, rect.width, rect.height, cardRect));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [hasMoved, avoidRef]);

  // Mobile / touch or click interaction: escape immediately before any click fires
  const handleInteraction = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    moveButton();
  };

  const currentText = NO_TEXT_SEQUENCE[textIndex];

  if (!hasMoved) {
    return (
      <button
        ref={buttonRef}
        type="button"
        className="btn-no-initial"
        onPointerDown={handleInteraction}
        onPointerEnter={handleInteraction}
        onTouchStart={handleInteraction}
        onClick={handleInteraction}
        aria-label="Botão não"
      >
        {currentText}
      </button>
    );
  }

  // Rendered via a portal straight into <body>: any filtered/transformed
  // ancestor (e.g. .content-box's backdrop-filter) would otherwise turn
  // itself into the containing block for this `position: fixed` button,
  // making left/top resolve relative to that ancestor instead of the
  // viewport and silently shoving the button off-screen.
  return createPortal(
    <button
      ref={buttonRef}
      type="button"
      className="btn-no-runaway"
      style={{
        left: `${pos.left}px`,
        top: `${pos.top}px`,
      }}
      onPointerDown={handleInteraction}
      onPointerEnter={handleInteraction}
      onTouchStart={handleInteraction}
      onClick={handleInteraction}
      aria-label="Botão não que foge"
    >
      {currentText}
    </button>,
    document.body,
  );
};

export default RunawayButton;
