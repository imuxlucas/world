import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RxTooltip } from '@tencent/tad-universal-biz-mx/lib/RxTooltip';

const prompt = document.querySelector<HTMLElement>('.prompt')!;

// Walk backwards from a collapsed caret, ignoring markup-only whitespace.
function slotBeforeCaret(): HTMLElement | null {
  const selection = window.getSelection();
  if (!selection?.isCollapsed || !selection.rangeCount) return null;
  const range = selection.getRangeAt(0);
  if (!prompt.contains(range.startContainer)) return null;
  let node: Node | null = range.startContainer;
  if (node.nodeType === Node.TEXT_NODE && range.startOffset > 0 && node.textContent?.slice(0, range.startOffset).replace(/\u200b/g, '')) return null;
  function previous(current: Node): Node | null {
    while (current !== prompt) {
      if (current.previousSibling) return current.previousSibling;
      if (!current.parentNode) return null;
      current = current.parentNode;
    }
    return null;
  }
  node = node.nodeType === Node.ELEMENT_NODE && range.startOffset > 0
    ? node.childNodes[range.startOffset - 1] : previous(node);
  while (node) {
    if (node instanceof HTMLElement) {
      if (node.matches('.slot')) return node;
      if (node.contentEditable === 'false') return null;
    }
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.replace(/[\s\u200b]/g, '')) return null;
    node = node.lastChild || previous(node);
  }
  return null;
}

function SlotDeleteGuard() {
  const [warning, setWarning] = useState<{ x: number; y: number; height: number } | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let armed: HTMLElement | null = null;
    let animation: Animation | undefined;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    // Retain the anchor while Radix plays the exit animation.
    const reset = () => { armed = null; clearTimeout(hideTimer); setVisible(false); };
    const keydown = (event: KeyboardEvent) => {
      if (event.isComposing) return;
      if (event.key !== 'Backspace' || event.altKey || event.metaKey || event.ctrlKey || (event.target instanceof Element && event.target.closest('input,textarea'))) { reset(); return; }
      const slot = slotBeforeCaret();
      if (!slot) { reset(); return; }
      event.preventDefault();
      if (event.repeat) return;
      if (armed === slot) {
        animation?.cancel();
        reset();
        const range = document.createRange();
        range.selectNode(slot);
        const selection = window.getSelection()!;
        selection.removeAllRanges(); selection.addRange(range);
        // Native editing keeps the deletion in the browser's undo history.
        document.execCommand('delete');
        return;
      }
      armed = slot;
      const rect = slot.getBoundingClientRect();
      setWarning({ x: rect.left + rect.width / 2, y: rect.top, height: rect.height });
      clearTimeout(hideTimer);
      setVisible(true);
      hideTimer = setTimeout(() => setVisible(false), 3000);
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        animation = slot.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(0)' }], { duration: 300, easing: 'ease-out' });
      }
    };
    const selectionChanged = () => { if (armed && slotBeforeCaret() !== armed) reset(); };
    document.addEventListener('keydown', keydown, true);
    document.addEventListener('pointerdown', reset, true);
    document.addEventListener('selectionchange', selectionChanged);
    return () => {
      animation?.cancel();
      clearTimeout(hideTimer);
      document.removeEventListener('keydown', keydown, true);
      document.removeEventListener('pointerdown', reset, true);
      document.removeEventListener('selectionchange', selectionChanged);
    };
  }, []);

  return <RxTooltip.Provider><RxTooltip.Root open={visible}>
    <RxTooltip.Trigger asChild><span aria-hidden="true" className="slot-fixed-anchor" style={{ left: warning?.x || 0, top: warning?.y || 0, height: warning?.height || 0 }} /></RxTooltip.Trigger>
    <RxTooltip.Portal><RxTooltip.Content size="md" className="slot-delete-tooltip" side="top" align="center" sideOffset={8}>
      再次按下 ⌫ 键删除<RxTooltip.Arrow />
    </RxTooltip.Content></RxTooltip.Portal>
  </RxTooltip.Root></RxTooltip.Provider>;
}

const guardHost = document.createElement('div');
document.body.append(guardHost);
createRoot(guardHost).render(<SlotDeleteGuard />);
