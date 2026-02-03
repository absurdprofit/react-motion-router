import React, { RefObject, useRef } from 'react';
import {
  FIRST_INDEX,
  SINGLE_ELEMENT_LENGTH
} from './common/constants';
import { omit } from './common/utils';

type AnchorState = {
  href?: string | null;
};

interface AnchorBaseProps extends Omit<
  AnchorProps,
  'ref'
> {
  ref?: RefObject<AnchorBase | null>;
}

export class AnchorBase extends React.Component<
  AnchorBaseProps,
  AnchorState
> {
  constructor(props: AnchorBaseProps) {
    super(props);

    this.state = {
      href: this.href,
    };
  }

  public readonly anchorRef = React.createRef<HTMLAnchorElement>();

  private static directionFromRel(rel: string | undefined) {
    return rel
      ?.split(' ')
      .findLast(dir => dir === 'next' || dir === 'prev')
      ?? 'prev';
  }

  private static findClosestEntryByHref(
    href: string,
    rel: string | undefined,
    entries: NavigationHistoryEntry[],
    index: number
  ) {
    if (
      !Array.isArray(entries)
      || index < FIRST_INDEX
      || index >= entries.length
      || entries.length === SINGLE_ELEMENT_LENGTH
    ) {
      return undefined;
    }

    let left = index - SINGLE_ELEMENT_LENGTH;
    let right = index + SINGLE_ELEMENT_LENGTH;
    const direction = AnchorBase.directionFromRel(rel);
    // if direction is next, prevent searching left
    if (direction === 'next') left = FIRST_INDEX;
    // if direction is prev, prevent searching right
    if (direction === 'prev') right = entries.length;

    while (left >= FIRST_INDEX || right < entries.length) {
      if (
        left >= FIRST_INDEX
        && entries[left]?.url === href
      ) return entries[left];
      if (
        right < entries.length
        && entries[right]?.url === href
      ) return entries[right];
      left--;
      right++;
    }

    return undefined;
  }

  private static findClosestEntry(
    rel: string | undefined,
    entries: NavigationHistoryEntry[],
    index: number
  ) {
    const direction = AnchorBase.directionFromRel(rel);
    
    switch (direction) {
      case 'prev':
        return entries[index - SINGLE_ELEMENT_LENGTH];
      case 'next':
        return entries[index + SINGLE_ELEMENT_LENGTH];
    }
  }

  public componentDidMount() {
    window.navigation?.addEventListener('navigatesuccess', this.onNavigate);
  }

  public componentWillUnmount() {
    window.navigation?.removeEventListener('navigatesuccess', this.onNavigate);
  }

  private readonly onNavigate = () => {
    const { href } = this;
    this.setState({ href });
  };

  private get href() {
    const { href, traverse, reload, historyEntryKey, rel } = this.props;
    if (href === undefined && traverse) {
      let entry: NavigationHistoryEntry | undefined;

      if (historyEntryKey) {
        entry = window.navigation
          ?.entries()
          .find(e => e.key === historyEntryKey);
      } else if (rel) {
        if (href)
          entry = AnchorBase.findClosestEntryByHref(
            href,
            rel,
            window.navigation.entries(),
            window.navigation.currentEntry?.index ?? FIRST_INDEX
          );
        else
          entry = AnchorBase.findClosestEntry(
            rel,
            window.navigation.entries(),
            window.navigation.currentEntry?.index ?? FIRST_INDEX
          );
      }

      return entry?.url;
    } else if (reload) {
      return '.';
    }
    return href;
  }

  private get search() {
    if (this.props.search)
      // Adding leading '?' if it doesn't already exist
      if (this.props.search.startsWith('?'))
        return this.props.search;
      else
        return `?${this.props.search}`;
    return '';
  }

  private readonly handleClick = (
    event: React.PointerEvent<HTMLAnchorElement>
  ) => {
    this.props.onClick?.(event);
    if (event.defaultPrevented) return;
    event.preventDefault();

    const navigation = window.navigation;

    const {
      rel,
      historyEntryKey,
      reload,
      replace,
      traverse,
      navigateInfo: info,
      navigateState: state,
    } = this.props;

    const href = this.anchorRef.current?.href;

    // history entry key takes trumps all
    if (historyEntryKey) {
      navigation.traverseTo(historyEntryKey, { info });
      return;
    }

    if (traverse) {
      const entries = navigation.entries();
      let entry;
      // if traverse has href hint, use that to find closest entry
      if (href)
        entry = AnchorBase.findClosestEntryByHref(
          href,
          rel,
          entries,
          navigation.currentEntry?.index ?? FIRST_INDEX
        );
      else // if not, use sibling entry
        entry = AnchorBase.findClosestEntry(
          rel,
          entries,
          navigation.currentEntry?.index ?? FIRST_INDEX
        );

      // if we have an entry, then navigate
      if (entry) {
        navigation.traverseTo(entry.key, { info });
        // if not, fall through to replace/reload/push
        return;
      }
    }

    // only replace if we have a valid href
    if (replace && href) {
      navigation.navigate(href, { info, state, history: 'replace' });
      // if replace but no href, fall through to reload/push
      return;
    }
    
    if (reload) {
      navigation.reload({ info, state });
      return;
    }
    
    // default: push navigation if we have a valid href
    if (href) {
      navigation.navigate(href, { info, state });
    }
  };

  public render() {
    const {
      rel,
      children,
    } = this.props;
    const { href } = this.state;
    const { search } = this;
    const props = omit(this.props, [
      'historyEntryKey',
      'navigateInfo',
      'navigateState',
      'reload',
      'replace',
      'traverse',
    ]);

    return (
      <a
        {...props}
        ref={this.anchorRef}
        href={href ? `${href}${search}` : undefined}
        rel={rel}
        onClick={this.handleClick}
      >
        {children}
      </a>
    );
  }
}

export interface AnchorProps extends React.DetailedHTMLProps<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
> {
  href?: string;
  rel?: string;
  historyEntryKey?: string;
  navigateInfo?: unknown;
  navigateState?: unknown;
  reload?: boolean;
  replace?: boolean;
  traverse?: boolean;
  children?: React.ReactNode;
  search?: string;
}

export function Anchor({ ref: forwardedRef, ...props }: AnchorProps) {
  const ref = useRef<AnchorBase>(null);

  React.useImperativeHandle<
    HTMLAnchorElement | null, HTMLAnchorElement | null
  >(
    forwardedRef,
    () => ref.current?.anchorRef.current ?? null
  );

  return (
    <AnchorBase ref={ref} {...props} />
  );
}