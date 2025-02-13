import clsx from 'clsx';
import {
  type CSSProperties,
  type ForwardedRef,
  type HTMLAttributes,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import Input from '../input';
import * as styles from './inline-edit.css';

export interface InlineEditHandle {
  triggerEdit: () => void;
}

export interface InlineEditProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'onChange' | 'onInput'> {
  /**
   * Content to be displayed
   */
  value?: string;
  /**
   * Whether the content is editable
   */
  editable?: boolean;

  onInput?: (v: string) => void;
  onChange?: (v: string) => void;

  /**
   * Trigger edit by `click` or `doubleClick`
   * @default `'doubleClick'`
   */
  trigger?: 'click' | 'doubleClick';

  /**
   * whether to auto select all text when trigger edit
   */
  autoSelect?: boolean;

  /**
   * Placeholder when value is empty
   */
  placeholder?: string;
  /**
   * Custom placeholder `className`
   */
  placeholderClassName?: string;
  /**
   * Custom placeholder `style`
   */
  placeholderStyle?: CSSProperties;

  handleRef?: ForwardedRef<InlineEditHandle>;

  /**
   * Customize attrs for the input
   */
  inputAttrs?: Omit<HTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur'>;
}

export const InlineEdit = ({
  value,
  editable,
  className,
  style,
  trigger = 'doubleClick',
  autoSelect,

  onInput,
  onChange,

  placeholder,
  placeholderClassName,
  placeholderStyle,

  handleRef,
  inputAttrs,

  ...attrs
}: InlineEditProps) => {
  const [editing, setEditing] = useState(false);
  const [editingValue, setEditingValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle<InlineEditHandle, InlineEditHandle>(handleRef, () => ({
    triggerEdit,
  }));

  const triggerEdit = useCallback(() => {
    if (!editable) return;
    setEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      autoSelect && inputRef.current?.select();
    }, 0);
  }, [autoSelect, editable]);

  const onDoubleClick = useCallback(() => {
    if (trigger !== 'doubleClick') return;
    triggerEdit();
  }, [triggerEdit, trigger]);

  const onClick = useCallback(() => {
    if (trigger !== 'click') return;
    triggerEdit();
  }, [triggerEdit, trigger]);

  const submit = useCallback(() => {
    onChange?.(editingValue || '');
  }, [editingValue, onChange]);

  const onEnter = useCallback(() => {
    inputRef.current?.blur();
  }, []);

  const onBlur = useCallback(() => {
    setEditing(false);
    submit();
    // to reset input's scroll position to match actual display
    inputRef.current?.scrollTo(0, 0);
  }, [submit]);

  const inputHandler = useCallback(
    (v: string) => {
      setEditingValue(v);
      onInput?.(v);
    },
    [onInput]
  );

  // update editing value when value prop changes
  useEffect(() => {
    setEditingValue(value);
  }, [value]);

  // to make sure text is not wrapped, and multi-space is shown normally
  const displayValue = useMemo(() => {
    return editingValue ? editingValue.replace(/\n/g, '') : '';
  }, [editingValue]);

  // to make sure input's style is the same as displayed text
  const inputWrapperInheritsStyles = {
    margin: 'inherit',
    padding: 'inherit',
    borderRadius: 'inherit',
    fontSize: 'inherit',
    fontFamily: 'inherit',
    lineHeight: 'inherit',
    fontWeight: 'inherit',
    letterSpacing: 'inherit',
    textAlign: 'inherit',
    color: 'inherit',
    backgroundColor: 'inherit',
  } as CSSProperties;
  const inputInheritsStyles = {
    ...inputWrapperInheritsStyles,
    padding: undefined,
    margin: undefined,
  };

  return (
    <div
      data-editing={editing}
      className={clsx(styles.inlineEditWrapper, className)}
      style={{ ...style }}
      {...attrs}
    >
      {/* display area, will be transparent when input */}
      <div
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        className={clsx(styles.inlineEdit)}
      >
        {displayValue}

        {!displayValue && (
          <Placeholder
            className={placeholderClassName}
            label={placeholder}
            style={placeholderStyle}
          />
        )}
      </div>

      {/* actual input */}
      {
        <Input
          ref={inputRef}
          className={styles.inlineEditInput}
          value={editingValue}
          placeholder={placeholder}
          onBlur={onBlur}
          onEnter={onEnter}
          onChange={inputHandler}
          style={inputWrapperInheritsStyles}
          inputStyle={inputInheritsStyles}
          {...inputAttrs}
        />
      }
    </div>
  );
};

interface PlaceholderProps
  extends PropsWithChildren,
    HTMLAttributes<HTMLSpanElement> {
  label?: string;
}
const Placeholder = ({
  label,
  children,
  className,
  style,
  ...attrs
}: PlaceholderProps) => {
  return (
    <div
      className={clsx(styles.placeholder, className)}
      style={style}
      {...attrs}
    >
      {children ?? label}
    </div>
  );
};
