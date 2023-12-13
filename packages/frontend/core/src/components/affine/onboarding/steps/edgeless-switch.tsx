import { IconButton } from '@affine/component';
import { ArrowLeftSmallIcon } from '@blocksuite/icons';
import { debounce } from 'lodash-es';
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { OnboardingBlock } from '../switch-widgets/block';
import { EdgelessSwitchButtons } from '../switch-widgets/switch';
import { ToolbarSVG } from '../switch-widgets/toolbar';
import type {
  ArticleOption,
  EdgelessSwitchMode,
  EdgelessSwitchState,
} from '../types';
import * as styles from './edgeless-switch.css';

interface EdgelessSwitchProps {
  article: ArticleOption;
  onBack?: () => void;
}

const offsetXRanges = [-2000, 2000];
const offsetYRanges = [-2000, 2000];
const scaleRange = [0.2, 2];

const defaultState: EdgelessSwitchState = {
  scale: 0.5,
  offsetX: 0,
  offsetY: 0,
};

export const EdgelessSwitch = ({ article, onBack }: EdgelessSwitchProps) => {
  const windowRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const mouseDownRef = useRef(false);
  const prevStateRef = useRef<EdgelessSwitchState | null>(
    article.initState ?? null
  );
  const enableScrollTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const turnOffScalingRef = useRef<() => void>(() => {});

  const [scrollable, setScrollable] = useState(false);
  const [mode, setMode] = useState<EdgelessSwitchMode>('page');
  const [state, setState] = useState<EdgelessSwitchState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });

  const onSwitchToPageMode = useCallback(() => setMode('page'), []);
  const onSwitchToEdgelessMode = useCallback(() => setMode('edgeless'), []);
  const toggleGrabbing = useCallback((v: boolean) => {
    if (!windowRef.current) return;
    windowRef.current.classList.toggle('grabbing', v);
  }, []);
  const turnOnScaling = useCallback(() => {
    if (!windowRef.current) return;
    windowRef.current.classList.add('scaling');
  }, []);

  const enableScrollWithDelay = useCallback(() => {
    return new Promise<any>(resolve => {
      enableScrollTimerRef.current = setTimeout(() => {
        setScrollable(true);
        resolve(true);
      }, 500);
    });
  }, []);
  const disableScroll = useCallback(() => {
    if (enableScrollTimerRef.current)
      clearTimeout(enableScrollTimerRef.current);
    setScrollable(false);
  }, []);
  const setStateAndSave = useCallback((state: EdgelessSwitchState) => {
    setState(state);
    prevStateRef.current = state;
  }, []);

  useEffect(() => {
    turnOffScalingRef.current = debounce(() => {
      if (!windowRef.current) return;
      windowRef.current.classList.remove('scaling');
    }, 100);
  }, []);

  useEffect(() => {
    if (mode === 'page') return;
    const canvas = canvasRef.current;
    const win = windowRef.current;
    if (!win || !canvas) return;

    const onWheel = (e: WheelEvent) => {
      turnOnScaling();
      const { deltaY } = e;
      const newScale = state.scale - deltaY * 0.001;
      const safeScale = Math.max(
        Math.min(newScale, scaleRange[1]),
        scaleRange[0]
      );
      setStateAndSave({ ...state, scale: safeScale });
      turnOffScalingRef.current?.();
    };

    // TODO: mobile support
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-no-drag]')) return;
      e.preventDefault();
      mouseDownRef.current = true;
      toggleGrabbing(true);
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!mouseDownRef.current) return;
      const offsetX = state.offsetX + e.movementX / state.scale;
      const offsetY = state.offsetY + e.movementY / state.scale;

      const safeOffsetX = Math.max(
        Math.min(offsetX, offsetXRanges[1]),
        offsetXRanges[0]
      );
      const safeOffsetY = Math.max(
        Math.min(offsetY, offsetYRanges[1]),
        offsetYRanges[0]
      );

      setStateAndSave({
        scale: state.scale,
        offsetX: safeOffsetX,
        offsetY: safeOffsetY,
      });
    };
    const onMouseUp = (_: MouseEvent) => {
      mouseDownRef.current = false;
      toggleGrabbing(false);
    };

    win.addEventListener('wheel', onWheel);
    win.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);

    return () => {
      win.removeEventListener('wheel', onWheel);
      win.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [
    mode,
    state,
    state.offsetX,
    state.offsetY,
    state.scale,
    setStateAndSave,
    toggleGrabbing,
    turnOnScaling,
  ]);

  // to avoid `overflow: auto` clip the content before animation ends
  useEffect(() => {
    if (mode === 'page') {
      enableScrollWithDelay()
        .then(() => {
          // handle scroll
          canvasRef.current?.scrollTo({ top: 0 });
        })
        .catch(console.error);

      setState({ scale: 1, offsetX: 0, offsetY: 0 });
    } else {
      disableScroll();
      canvasRef.current?.scrollTo({ top: 0 });

      // save state when switching between modes
      setState(prevStateRef.current ?? defaultState);
    }
  }, [disableScroll, enableScrollWithDelay, mode]);

  const canvasStyle = {
    '--scale': state.scale,
    '--offset-x': state.offsetX + 'px',
    '--offset-y': state.offsetY + 'px',
  } as CSSProperties;

  return (
    <div
      ref={windowRef}
      data-mode={mode}
      data-scroll={scrollable}
      className={styles.edgelessSwitchWindow}
      style={canvasStyle}
    >
      <div className={styles.canvas} ref={canvasRef}>
        <div className={styles.page}>
          {
            /* render blocks */
            article.blocks.map((block, key) => {
              return <OnboardingBlock key={key} mode={mode} {...block} />;
            })
          }
        </div>
      </div>

      <div data-no-drag className={styles.noDragWrapper}>
        <EdgelessSwitchButtons
          className={styles.switchButtons}
          mode={mode}
          onSwitchToPageMode={onSwitchToPageMode}
          onSwitchToEdgelessMode={onSwitchToEdgelessMode}
        />

        <div className={styles.toolbar}>
          <ToolbarSVG />
        </div>

        <IconButton className={styles.backButton} onClick={onBack}>
          <ArrowLeftSmallIcon />
        </IconButton>
      </div>
    </div>
  );
};
