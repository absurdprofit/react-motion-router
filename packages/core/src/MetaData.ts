import { MetaKey, MetaType, MetaTypeKey } from "./common/types";

export class MetaData {
    #map = new Map<MetaKey, string | undefined>();
    private mutationObserver: MutationObserver;

    constructor() {
        this.mutationObserver = new MutationObserver(this.observeMutations.bind(this));
        const {head} = document;
        this.mutationObserver.observe(head, {
            childList: true
        });

        Array.from(head.querySelectorAll('meta')).forEach(node => {
            this.mutationObserver.observe(node, {
                attributes: true
            });
        });

        Array.from(head.querySelectorAll('meta')).forEach(this.metaDataFromNode.bind(this));
    }

    get(key: string | MetaType) {
        const metaKey = this.getMetaKey(key);

        const metaContent = this.#map.get(metaKey);
        if (!metaContent) return undefined;

        let content: string | [string, string][];
        if (metaContent.includes(',') && metaContent.includes('=')) {
            content = metaContent.split(/,\s*/).map(keyVal => keyVal.split('=') as [string, string]);
        } else {
            content = metaContent;
        }

        return content;
    }

    set(key: string | MetaType, content?: string | [string, string][]) {
        const metaKey = this.getMetaKey(key);
        const metaContent = this.getMetaContent(content);

        this.#map.set(metaKey, metaContent);
        this.updateMetaElement(metaKey, metaContent);
    }

    has(key: string | MetaType) {
        const metaKey = this.getMetaKey(key);

        return this.#map.has(metaKey);
    }

    delete(key: string | MetaType) {
        const metaKey = this.getMetaKey(key);

        this.#map.delete(metaKey);
        document.head.querySelector(`meta[${metaKey}]`)?.remove();
    }

    clear() {
        document.head.querySelectorAll('meta').forEach(node => node.remove());
    }

    entries() {
        return this.#map.entries();
    }

    [Symbol.iterator]() {
        return this.entries();
    }

    get size() {
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
                    const [type] = Array.from((node as HTMLMetaElement).attributes).filter(attribute => attribute.nodeName !== "content");
                    const metaType: MetaType = [type.nodeName as MetaTypeKey, type.value];

                    const key = metaType.join('=') as MetaKey;
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
        const [type] = Array.from((node as HTMLMetaElement).attributes).filter(attribute => attribute.nodeName !== "content");
        const [content] = Array.from((node as HTMLMetaElement).attributes).filter(attribute => attribute.nodeName === "content");
        const metaType: MetaType = [type.nodeName as MetaTypeKey, type.value];

        const key = metaType.join('=') as MetaKey;
        this.#map.set(key, content?.value);
    }

    private getMetaKey(key: string | MetaType) {
        let metaKey: MetaKey;
        if (typeof key === "string") {
            metaKey = `name=${key}` as MetaKey;
        } else {
            metaKey = key.join('=') as MetaKey;
        }

        return metaKey;
    }

    private getMetaContent(content: string | [string, string][] | undefined) {
        if (!content) return undefined;

        let metaContent: string;
        if (typeof content === "string") {
            metaContent = content;
        } else {
            metaContent = content.map(contentTuple => contentTuple.join('=')).join(', ');
        }

        return metaContent;
    }

    private updateMetaElement(key: MetaKey, content?: string) {
        const meta = document.querySelector(`meta[${key}]`) || document.createElement('meta');
        const metaType = key.split('=') as MetaType;

        meta.setAttribute(...metaType);
        if (content) meta.setAttribute('content', content);
        else meta.removeAttribute('content');

        if (!meta.parentElement) {
            document.head.appendChild(meta);
        }
    }
}