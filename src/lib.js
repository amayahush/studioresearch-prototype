import React from 'react';
import htm from 'htm';

export const html = htm.bind(React.createElement);
export const { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback, useContext, createContext, useReducer, Fragment } = React;

export const cx = (...parts) => parts.filter(Boolean).join(' ');

// Compact layout (phones and portrait tablets): one panel at a time, drawers and bottom sheets.
export const PHONE = '(max-width: 900px)';
// Landscape tablets and small laptops: desktop layout, but side panels start collapsed.
export const TABLET = '(max-width: 1100px)';
export function useMedia(query) {
  const get = () => typeof window !== 'undefined' && window.matchMedia(query).matches;
  const [on, setOn] = React.useState(get);
  React.useEffect(() => {
    const m = window.matchMedia(query);
    const f = () => setOn(m.matches);
    f();
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, [query]);
  return on;
}

// Touch screens: say "tap" instead of "click" and drop keyboard-only hints from instructions.
export const TOUCH = typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches;
export const touchCopy = (s) => (!TOUCH || typeof s !== 'string' ? s : s
  .replace(/\s*\(or (press )?(Alt\+P|Space)\)/g, '')
  .replace(/ or press Space/g, '')
  .replace(/\bDrag the canvas\b/g, 'Swipe the canvas')
  .replace(/\bClick\b/g, 'Tap').replace(/\bclick\b/g, 'tap')
  .replace(/ on the right\b/g, '').replace(/ in the right panel\b/g, ' in its panel'));
