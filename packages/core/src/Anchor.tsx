import React from 'react';
import {
  FIRST_INDEX,
  LAST_INDEX,
  SINGLE_ELEMENT_LENGTH
} from './common/constants';
import { omit } from './common/utils';

interface AnchorProps extends React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> {
  href?: string;
  rel?: string;
  historyEntryKey?: string;
  navigateInfo?: unknown;
  navigateState?: unknown;
  reload?: boolean;
  replace?: boolean;
  traverse?: boolean;
  children?: React.ReactNode;
}

type AnchorState = {
  href?: string | null;
};

export class Anchor extends React.Component<
  AnchorProps,
  AnchorState
> {
  constructor(props: AnchorProps) {
    super(props);

    this.state = {
      href: this.href,
    };
  }

  private readonly anchorRef = React.createRef<HTMLAnchorElement>();

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
    const direction = rel
      ?.split(' ')
      .findLast(dir => dir === 'next' || dir === 'prev')
      ?? 'prev';
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
    const direction = rel
      ?.split(' ')
      .findLast(dir => dir === 'next' || dir === 'prev')
      ?? 'prev';
    
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
        entry = Anchor.findClosestEntry(
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

  private readonly handleClick = (event: React.PointerEvent<HTMLAnchorElement>) => {
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

    if (traverse && href) {
      const entries = navigation.entries();
      const entry =
        Anchor.findClosestEntryByHref(
          href,
          rel,
          entries,
          navigation.currentEntry?.index ?? FIRST_INDEX
        );

      if (historyEntryKey || entry) {
        navigation.traverseTo(historyEntryKey || entry!.key, { info });
        return;
      }
    }

    if (replace) {
      if (href === undefined)
        return;
      navigation.navigate(href, { info, state, history: 'replace' });
    } else if (reload) {
      navigation.reload({ info, state });
    } else {
      if (href === undefined)
        return;
      navigation.navigate(href, { info, state });
    }
  };

  public render() {
    const {
      rel,
      children,
    } = this.props;
    const { href } = this.state;
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
        href={href ?? undefined}
        rel={rel}
        onClick={this.handleClick}
      >
        {children}
      </a>
    );
  }
}
