import React from 'react';
import {
  FIRST_INDEX,
  LAST_INDEX,
  SINGLE_ELEMENT_LENGTH
} from './common/constants';

type AnchorBaseProps = {
  href?: string;
  rel?: string;
  historyEntryKey?: string;
  navigateInfo?: unknown;
  navigateState?: unknown;
  reload?: boolean;
  replace?: boolean;
  traverse?: boolean;
  children?: React.ReactNode;
};

type AnchorBaseState = {
  computedHref?: string | null;
};

export class AnchorBase extends React.Component<
  AnchorBaseProps,
  AnchorBaseState
> {
  public readonly state: AnchorBaseState = {
    computedHref: undefined,
  };

  private readonly anchorRef = React.createRef<HTMLAnchorElement>();

  private static findClosestEntryHref(
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
    if (rel?.includes('next')) left = FIRST_INDEX;
    if (rel?.includes('prev')) right = entries.length;

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
    if (
      !Array.isArray(entries)
      || index < FIRST_INDEX
      || index >= entries.length
      || entries.length === SINGLE_ELEMENT_LENGTH
    ) {
      return undefined;
    }

    let left = LAST_INDEX;
    let right = entries.length;
    if (rel?.includes('prev')) left = index - SINGLE_ELEMENT_LENGTH;
    if (rel?.includes('next')) right = index + SINGLE_ELEMENT_LENGTH;

    while (left >= FIRST_INDEX || right < entries.length) {
      if (left >= FIRST_INDEX) return entries[left];
      if (right < entries.length) return entries[right];
      left--;
      right++;
    }

    return undefined;
  }

  public componentDidMount() {
    this.onNavigate();
    window.navigation?.addEventListener('navigatesuccess', this.onNavigate);
  }

  public componentWillUnmount() {
    window.navigation?.removeEventListener('navigatesuccess', this.onNavigate);
  }

  private readonly onNavigate = () => {
    const { href, traverse, historyEntryKey, rel } = this.props;
    if (!href && traverse) {
      let entry: NavigationHistoryEntry | undefined;

      if (historyEntryKey) {
        entry = window.navigation
          ?.entries()
          .find(e => e.key === historyEntryKey);
      } else if (rel) {
        entry = AnchorBase.findClosestEntry(
          rel,
          window.navigation.entries(),
          window.navigation.currentEntry?.index ?? FIRST_INDEX
        );
      }

      this.setState({ computedHref: entry?.url });
    }
  };

  private readonly handleClick = (event: React.PointerEvent<HTMLAnchorElement>) => {
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
        AnchorBase.findClosestEntryHref(
          href,
          rel,
          entries,
          navigation.currentEntry?.index ?? FIRST_INDEX
        )
        ?? AnchorBase.findClosestEntry(
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
      href,
      rel,
      reload,
      traverse,
      historyEntryKey,
      children,
    } = this.props;
    let { computedHref } = this.state;

    if (reload) {
      computedHref = '.';
    }

    if (traverse && historyEntryKey) {
      computedHref =
        window.navigation
          ?.entries()
          .find(e => e.key === historyEntryKey)?.url ?? undefined;
    }

    return (
      <a
        ref={this.anchorRef}
        href={href ?? computedHref ?? undefined}
        rel={rel}
        onClick={this.handleClick}
      >
        {children}
      </a>
    );
  }
}
