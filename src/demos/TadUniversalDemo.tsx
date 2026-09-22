import { publicUrl } from '../publicUrl';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RxTabs } from '@tencent/tad-universal-biz-mx/lib/RxTabs';
import { RxSlider } from '@tencent/tad-universal-biz-mx/lib/RxSlider';
import type { MsSubjectAvatar } from '@tencent/tad-universal-biz-ms/lib/MsSubjectLibraryButton';
import Kr2ComposerToolbar from './Kr2ComposerToolbar';
import '@tencent/tad-universal-biz-mx/lib/themes/mx.css';
import './tadUniversalDemo.css';

// User-supplied portraits; display names match the original filenames.
const subjects: MsSubjectAvatar[] = [
  { id: 'winter', name: '我担·Winter', avatarUrl: publicUrl('/demos/tad-universal/subjects/我担·Winter.png') },
  { id: 'mimi', name: '永远守护的幂幂', avatarUrl: publicUrl('/demos/tad-universal/subjects/永远守护的幂幂.png') },
  { id: 'sohee', name: '豆兵·Sohee', avatarUrl: publicUrl('/demos/tad-universal/subjects/豆兵·Sohee.png') },
];
const marks = Array.from({ length: 11 }, (_, index) => index * 10);
const thumbnail = new URLSearchParams(window.location.search).has('thumbnail');

function TadUniversalDemo() {
  const [visibility, setVisibility] = useState<'always' | 'hover'>('hover');
  const [value, setValue] = useState([50]);

  return <main className={`tad-demo${thumbnail ? ' tad-demo--thumbnail' : ''}`} aria-label="tad-universal 交互组件展示">
    <div className="tad-demo__controls">
      <Kr2ComposerToolbar
        subjects={subjects}
        avatarVisibility={visibility}
        tabs={<RxTabs.Root
          className="tad-demo__tabs"
          variant="segment"
          size="md"
          value={visibility}
          onValueChange={next => setVisibility(next === 'hover' ? 'hover' : 'always')}
        >
          <RxTabs.List aria-label="主体头像显示方式">
            <RxTabs.Trigger value="hover">hover</RxTabs.Trigger>
            <RxTabs.Trigger value="always">always</RxTabs.Trigger>
          </RxTabs.List>
        </RxTabs.Root>}
      />

      <div className="tad-demo__slider">
        <RxSlider.Root
          value={value}
          onValueChange={setValue}
          variant="block"
          min={0}
          max={100}
          step={10}
          tickCount={marks.length}
        >
          <RxSlider.Track><RxSlider.Range /></RxSlider.Track>
          <RxSlider.Thumb aria-label="数值" />
        </RxSlider.Root>
        <div className="tad-demo__marks" aria-hidden="true">
          {marks.map(mark => <span key={mark}>{mark}</span>)}
        </div>
      </div>
    </div>
  </main>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><TadUniversalDemo /></StrictMode>);
