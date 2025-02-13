import { cssVar } from '@toeverything/theme';
import { createVar, style } from '@vanilla-extract/css';

const gap = createVar();
const borderRadius = createVar();

export const splitViewRoot = style({
  vars: {
    [gap]: '0px',
    [borderRadius]: '0px',
  },
  display: 'flex',
  flexDirection: 'row',
  borderRadius,
  gap,

  selectors: {
    '&[data-client-border="true"]': {
      vars: {
        [gap]: '6px',
        [borderRadius]: '6px',
      },
    },
    '&[data-orientation="vertical"]': {
      flexDirection: 'column',
    },
  },
});

export const splitViewPanel = style({
  flexShrink: 0,
  flexGrow: 'var(--size, 1)',
  position: 'relative',
  borderRadius: 'inherit',

  selectors: {
    '[data-orientation="vertical"] &': {
      height: 0,
    },
    '[data-orientation="horizontal"] &': {
      width: 0,
    },
    '[data-client-border="false"] &:not(:last-child):not([data-is-dragging="true"])':
      {
        borderRight: `1px solid ${cssVar('borderColor')}`,
      },
    '&[data-is-dragging="true"]': {
      zIndex: 1,
    },
  },
});

export const splitViewPanelDrag = style({
  width: '100%',
  height: '100%',
  borderRadius: 'inherit',

  selectors: {
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      pointerEvents: 'none',
      zIndex: 10,
    },

    '[data-is-dragging="true"] &::after': {
      boxShadow: `inset 0 0 0 2px ${cssVar('brandColor')}`,
    },
  },
});

export const splitViewPanelContent = style({
  width: '100%',
  height: '100%',
  borderRadius: 'inherit',
  overflow: 'hidden',
});

export const resizeHandle = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  right: -5,
  width: 10,
  // to make sure it's above all-pages's header
  zIndex: 3,

  display: 'flex',
  justifyContent: 'center',
  alignItems: 'stretch',
  cursor: 'col-resize',

  selectors: {
    '[data-client-border="true"] &': {
      right: `calc(-5px - ${gap} / 2)`,
    },

    // horizontal
    '[data-orientation="horizontal"] &::before, [data-orientation="horizontal"] &::after':
      {
        content: '""',
        width: 2,
        position: 'absolute',
        height: '100%',
        background: 'transparent',
        transition: 'background 0.1s',
        borderRadius: 10,
      },
    '[data-orientation="horizontal"] &[data-resizing]::before, [data-orientation="horizontal"] &[data-resizing]::after':
      {
        width: 3,
      },

    '&:hover::before, &[data-resizing]::before': {
      background: cssVar('brandColor'),
    },
    '&:hover::after, &[data-resizing]::after': {
      boxShadow: `0px 12px 21px 4px ${cssVar('brandColor')}`,
      opacity: 0.15,
    },

    // vertical
    // TODO
  },
});

export const menuTrigger = style({
  position: 'absolute',
  left: '50%',
  top: 3,
  transform: 'translateX(-50%)',
  zIndex: 10,
});
