import './previewOverlay.css';

export default function PreviewControls({ onPrevious, onNext, onClose, previousDisabled = false, nextDisabled = false }: {
  onPrevious: () => void; onNext: () => void; onClose: () => void;
  previousDisabled?: boolean; nextDisabled?: boolean;
}) {
  return <>
    <button type="button" className="preview-control preview-exit" onClick={onClose} autoFocus>Exit</button>
    <button type="button" className="preview-control preview-prev" onClick={onPrevious} disabled={previousDisabled}>Prev</button>
    <button type="button" className="preview-control preview-next" onClick={onNext} disabled={nextDisabled}>Next</button>
  </>;
}
