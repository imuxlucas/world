import { useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createPortal } from 'react-dom';
import { RxPopover } from '@tencent/tad-universal-biz-mx/lib/RxPopover';
import { RxTextarea } from '@tencent/tad-universal-biz-mx/lib/RxTextarea';
import { MxButton } from '@tencent/tad-universal-biz-mx/lib/MxButton';
import { useInputModality } from '@tencent/tad-universal-biz-mx';
import '@tencent/tad-universal-biz-mx/lib/themes/mx.css';
import './lipPromptPopover.css';
import './slotDeleteGuard';

const previousProduct = '梦妆桃粉色唇蜜';

function SlotPopover({ input, icon }: { input: HTMLInputElement; icon: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(input.value);
  const [focusRing, setFocusRing] = useState(false);
  const [anchor, setAnchor] = useState<{ x: number; y: number; height: number } | null>(null);
  const modality = useInputModality();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const outsideInteraction = useRef(false);
  const label = input.closest('.slot')?.querySelector('.slot-label')?.textContent || '商品名称';

  useEffect(() => {
    const sync = () => setValue(input.value);
    input.addEventListener('input', sync);
    return () => input.removeEventListener('input', sync);
  }, [input]);

  function updateValue(next: string) {
    setValue(next);
    input.value = next.replace(/\n/g, ' ');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  return <RxPopover.Root modal={false} open={open} onOpenChange={next => {
    if (next) {
      const rect = input.closest('.slot')!.getBoundingClientRect();
      setAnchor({ x: rect.left + rect.width / 2, y: rect.top, height: rect.height });
      outsideInteraction.current = false; setValue(input.value); setFocusRing(modality === 'keyboard');
    }
    setOpen(next);
  }}>
    {open && anchor && createPortal(<RxPopover.Anchor asChild><span aria-hidden="true" className="slot-fixed-anchor" style={{ left: anchor.x, top: anchor.y, height: anchor.height }} /></RxPopover.Anchor>, document.body)}
    <RxPopover.Trigger asChild>
      <button type="button" className="slot-expand" aria-label={`放大${label}输入框`} dangerouslySetInnerHTML={{ __html: icon }} />
    </RxPopover.Trigger>
    <RxPopover.Portal>
      <RxPopover.Content className="product-popover" side="top" align="center" sideOffset={6}
        aria-label={`${label}展开编辑`}
        onOpenAutoFocus={event => { event.preventDefault(); textarea.current?.focus(); }}
        onInteractOutside={() => { outsideInteraction.current = true; }}
        onCloseAutoFocus={event => { event.preventDefault(); if (!outsideInteraction.current && input.isConnected) input.focus(); }}>
        <div className="product-popover__editor">
          <div className="product-popover__text-viewport">
            <RxTextarea ref={textarea} variant="filled" className="product-popover__textarea"
              aria-label={label} placeholder={input.placeholder} value={value}
              data-focus-ring={focusRing ? 'true' : 'false'}
              onFocus={() => setFocusRing(modality === 'keyboard')}
              onPointerDown={() => setFocusRing(false)}
              onBlur={() => setFocusRing(false)}
              onChange={event => updateValue(event.target.value)} />
          </div>
          <div className="product-popover__footer">
            <button className="product-popover__previous" type="button" onClick={() => updateValue(previousProduct)}>
              上次使用：<span>{previousProduct}</span>
            </button>
            <MxButton variant="primary" size="sm" type="button" onClick={() => setOpen(false)}>完成</MxButton>
          </div>
        </div>
        <RxPopover.Arrow />
      </RxPopover.Content>
    </RxPopover.Portal>
  </RxPopover.Root>;
}

// The prompt remains a native editable document. Mount the library control as an
// island, and remount after native undo restores a deleted slot.
const prompt = document.querySelector('.prompt')!;
const icon = prompt.querySelector('.slot-expand')!.innerHTML;
const roots = new Map<HTMLElement, Root>();
function syncSlots() {
  roots.forEach((root, host) => {
    if (!prompt.contains(host)) { root.unmount(); roots.delete(host); }
  });
  prompt.querySelectorAll<HTMLElement>('.slot-value').forEach(slot => {
    let host = slot.querySelector<HTMLElement>('.slot-popover-host');
    if (host && roots.has(host)) return;
    if (!host) {
      slot.querySelector('.slot-expand')?.remove();
      host = document.createElement('span');
      host.className = 'slot-popover-host';
      slot.append(host);
    }
    const root = createRoot(host);
    roots.set(host, root);
    root.render(<SlotPopover input={slot.querySelector('input')!} icon={icon} />);
  });
}
syncSlots();
new MutationObserver(syncSlots).observe(prompt, { childList: true, subtree: true });
