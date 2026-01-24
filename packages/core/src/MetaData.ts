import { MetaKey, MetaType } from './common/types';

export class MetaData {
  readonly #map = new Map<MetaKey, string | undefined>();
  private readonly mutationObserver: MutationObserver;

  constructor() {
    this.mutationObserver = new MutationObserver(
      this.observeMutations.bind(this)
    );
    const { head } = document;
    this.mutationObserver.observe(head, {
      childList: true,
    });

    Array.from(head.querySelectorAll('meta')).forEach(node => {
      this.mutationObserver.observe(node, {
        attributes: true,
      });
    });

    Array.from(
      head.querySelectorAll('meta')).forEach(this.metaDataFromNode.bind(this)
    );
  }

  public get(key: string | MetaType) {
    const metaKey = this.formatMetaKey(key);

    const metaContent = this.#map.get(metaKey);
    if (!metaContent) return undefined;

    let content: string | [string, string][];
    if (metaContent.includes(',') && metaContent.includes('=')) {
      content = metaContent
        .split(/,\s*/)
        .map(keyVal => keyVal.split('=') as [string, string]);
    } else {
      content = metaContent;
    }

    return content;
  }

  public set(key: string | MetaType, content?: string | [string, string][]) {
    const metaKey = this.formatMetaKey(key);
    const metaContent = this.formatMetaContent(content);

    this.#map.set(metaKey, metaContent);
    if (typeof key === 'string')
      key = ['name', key];
    this.updateMetaElement(key, metaContent);
  }

  public has(key: string | MetaType) {
    const metaKey = this.formatMetaKey(key);

    return this.#map.has(metaKey);
  }

  public delete(key: string | MetaType) {
    const metaKey = this.formatMetaKey(key);

    this.#map.delete(metaKey);
    document.head.querySelector(`meta[${metaKey}]`)?.remove();
  }

  public clear() {
    document.head.querySelectorAll('meta').forEach(node => node.remove());
  }

  public entries() {
    return this.#map.entries();
  }

  public [Symbol.iterator]() {
    return this.entries();
  }

  public get size() {
    return this.#map.size;
  }
    
  private observeMutations(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        const node = mutation.target;

        this.metaDataFromNode(node as HTMLMetaElement);
      }

      if (mutation.type !== 'childList') return;

      mutation.removedNodes.forEach((node) => {
        if (node.nodeName === 'META') {
          const type = Array
            .from((node as HTMLMetaElement).attributes)
            .find(attribute => attribute.nodeName !== 'content');
          if (!type) return;
          if (!type.value) return;
          const metaType: MetaType = [type.nodeName, type.value];

          const key = this.formatMetaKey(metaType);
          if (this.#map.has(key)) {
            this.#map.delete(key);
          }
        }
      });
      mutation.addedNodes.forEach(node => {
        if (node.nodeName === 'META') {
          this.metaDataFromNode(node as HTMLMetaElement);
        }
      });
    }
  }

  private metaDataFromNode(node: HTMLMetaElement) {
    const type = Array
      .from(node.attributes)
      .find(attribute => attribute.nodeName !== 'content');
    const content = Array
      .from(node.attributes)
      .find(attribute => attribute.nodeName === 'content');
    if (!type) return;
    if (!type.value) return;
    const metaType: MetaType = [type.nodeName, type.value];

    const key = this.formatMetaKey(metaType);
    this.#map.set(key, content?.value);
  }

  private formatMetaKey(key: string | MetaType) {
    let metaKey: MetaKey;
    if (typeof key === 'string') {
      metaKey = `name="${key}"` as MetaKey;
    } else {
      const [attribute, value] = key;
      metaKey = `${attribute}="${value}"`;
    }

    return metaKey;
  }

  private formatMetaContent(content: string | [string, string][] | undefined) {
    if (!content) return undefined;

    let metaContent: string;
    if (typeof content === 'string') {
      metaContent = content;
    } else {
      metaContent = content.map(contentTuple => contentTuple.join('=')).join(', ');
    }

    return metaContent;
  }

  private updateMetaElement(key: MetaType, content?: string) {
    const meta =
      document.querySelector(`meta[${this.formatMetaKey(key)}]`)
      || document.createElement('meta');

    const [qualifiedName, value] = key;
    meta.setAttribute(qualifiedName, value);
    if (content) meta.setAttribute('content', content);
    else meta.removeAttribute('content');

    if (!meta.parentElement) {
      document.head.appendChild(meta);
    }
  }
}