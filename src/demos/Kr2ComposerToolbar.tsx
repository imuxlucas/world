import { ReactNode, useRef, useState } from 'react';
import { MsSubjectLibraryButton, type MsSubjectAvatar } from '@tencent/tad-universal-biz-ms/lib/MsSubjectLibraryButton';

type Props = {
  subjects: MsSubjectAvatar[];
  avatarVisibility: 'always' | 'hover';
  tabs?: ReactNode;
};

// Copied from KR1's demos/lip-prompt/index.html toolbar.
// Keep the original icons and shell; this variant has no editable prompt.
export default function Kr2ComposerToolbar({ subjects, avatarVisibility, tabs }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState('');

  return <form className="kr2-composer" aria-label="主体创作操作栏" onSubmit={event => {
    event.preventDefault();
    setStatus('操作栏演示：已点击发送');
  }}>
    {tabs && <div className="kr2-composer__tabs">{tabs}</div>}
    <div className="kr2-composer__toolbar">
      <div className="kr2-composer__left">
        <button className="kr2-composer__add" type="button" aria-label="添加参考图片" onClick={() => fileInput.current?.click()}>
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8.00041 1.75586C8.30707 1.75605 8.55596 2.00471 8.55596 2.31141V7.4451H13.6888C13.9956 7.4451 14.2443 7.69383 14.2443 8.00065C14.2442 8.30733 13.9955 8.55621 13.6888 8.55621H8.55596V13.689C8.55596 13.9957 8.30707 14.2444 8.00041 14.2446C7.69358 14.2446 7.44485 13.9958 7.44485 13.689V8.55621H2.31117C2.00445 8.55621 1.75579 8.30733 1.75562 8.00065C1.75562 7.69383 2.00435 7.4451 2.31117 7.4451H7.44485V2.31141C7.44485 2.00459 7.69358 1.75586 8.00041 1.75586Z" fill="black"/></svg>
        </button>
        <MsSubjectLibraryButton
          subjects={subjects}
          avatarVisibility={avatarVisibility}
          onOpenLibrary={() => setStatus('操作栏演示：已点击主体库')}
          onSelectSubject={subject => setStatus(`已选择主体：${subject.name}`)}
        />
      </div>
      <div className="kr2-composer__right">
        <span className="kr2-composer__credits" aria-label="每秒 3 积分">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4.44572 8.86697C4.71055 8.86697 4.93858 9.05391 4.99052 9.31359C5.08221 9.77204 5.25869 10.1503 5.51951 10.4312C5.77538 10.7067 6.14066 10.9196 6.67038 11.0079C6.93826 11.0525 7.13461 11.2843 7.13461 11.5559C7.13461 11.8274 6.93826 12.0592 6.67038 12.1039C6.14066 12.1922 5.77538 12.405 5.51951 12.6805C5.25869 12.9614 5.08221 13.3397 4.99052 13.7981C4.93858 14.0578 4.71055 14.2447 4.44572 14.2447C4.1809 14.2447 3.95287 14.0578 3.90093 13.7981C3.80924 13.3397 3.63276 12.9614 3.37194 12.6805C3.11607 12.405 2.75079 12.1922 2.22107 12.1039C1.95319 12.0592 1.75684 11.8274 1.75684 11.5559C1.75684 11.2843 1.95319 11.0525 2.22107 11.0079C2.75079 10.9196 3.11607 10.7067 3.37194 10.4312C3.63276 10.1503 3.80924 9.77204 3.90093 9.31359C3.95287 9.05391 4.1809 8.86697 4.44572 8.86697ZM9.24573 1.75586C9.51055 1.75586 9.73858 1.94279 9.79052 2.20247C9.99776 3.2387 10.4054 4.13694 11.0417 4.82227C11.6732 5.50226 12.5584 6.00401 13.7815 6.20786C14.0494 6.2525 14.2457 6.48428 14.2457 6.75586C14.2457 7.02744 14.0494 7.25922 13.7815 7.30386C12.5584 7.50771 11.6732 8.00945 11.0417 8.68945C10.4054 9.37478 9.99776 10.273 9.79052 11.3092C9.73858 11.5689 9.51055 11.7559 9.24573 11.7559C8.9809 11.7559 8.75287 11.5689 8.70093 11.3092C8.49368 10.273 8.08609 9.37478 7.44972 8.68945C6.81829 8.00945 5.93303 7.50771 4.70996 7.30386C4.44208 7.25922 4.24572 7.02744 4.24572 6.75586C4.24572 6.48428 4.44208 6.2525 4.70996 6.20786C5.93303 6.00401 6.81829 5.50226 7.44972 4.82227C8.08609 4.13694 8.49368 3.2387 8.70093 2.20247C8.75287 1.94279 8.9809 1.75586 9.24573 1.75586Z" fill="black" fillOpacity=".61"/></svg>
          <span><span className="kr2-composer__credits-number">3</span>/s</span>
        </span>
        <button className="kr2-composer__send" type="submit" aria-label="发送">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8.01294 1.40126C8.04064 1.4019 8.06802 1.40519 8.0954 1.40994C8.10474 1.41156 8.114 1.41307 8.12318 1.41515C8.14711 1.42057 8.17031 1.42823 8.19349 1.43685C8.20305 1.44042 8.21283 1.4432 8.22214 1.44727C8.24846 1.45874 8.27388 1.47232 8.29852 1.48806C8.30279 1.49079 8.30736 1.49304 8.31154 1.49588C8.34017 1.5153 8.36778 1.53737 8.39314 1.56272L12.6596 5.83008C12.8763 6.04706 12.8765 6.39881 12.6596 6.61567C12.4427 6.83242 12.091 6.8323 11.874 6.61567L8.55547 3.29709V14.0445C8.55535 14.3512 8.30666 14.6 7.99991 14.6C7.69324 14.5999 7.44448 14.3512 7.44436 14.0445V3.29709L4.12667 6.61567C3.90975 6.83256 3.55718 6.83251 3.34022 6.61567C3.12348 6.39883 3.12367 6.04704 3.34022 5.83008L7.60756 1.56272C7.63257 1.53773 7.65977 1.51488 7.68915 1.49501L7.69436 1.49154C7.75189 1.45358 7.81496 1.42773 7.88012 1.41341C7.88897 1.41146 7.89803 1.41059 7.90703 1.40907C7.9341 1.4045 7.96125 1.40182 7.98863 1.40126C7.99239 1.40118 7.99614 1.40039 7.99991 1.40039C8.00421 1.40039 8.00866 1.40116 8.01294 1.40126Z" fill="white" stroke="white" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
    <input ref={fileInput} type="file" accept="image/*" hidden onChange={event => {
      const file = event.target.files?.[0];
      if (file) setStatus(`已添加参考图片：${file.name}`);
    }} />
    <span className="kr2-composer__status" role="status" aria-live="polite">{status}</span>
  </form>;
}
