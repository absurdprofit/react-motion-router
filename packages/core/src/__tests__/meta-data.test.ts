import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MetaData } from '../MetaData';
import type { MetaType } from '../common/types';
import {
  EMPTY_COLLECTION_LENGTH,
  SINGLE_ELEMENT_LENGTH
} from '../common/constants';

describe('MetaData', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
  });

  afterEach(() => {
    document.head.innerHTML = '';
  });

  it('initializes from existing meta tags in document.head', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    meta.setAttribute('content', 'test description');
    document.head.appendChild(meta);

    const metadata = new MetaData();

    expect(metadata.get('description')).toBe('test description');
    expect(metadata.size).toBe(SINGLE_ELEMENT_LENGTH);
  });

  it('sets a meta tag and reflects it in the DOM', () => {
    const metadata = new MetaData();

    metadata.set('description', 'hello');

    const meta = document.head.querySelector('meta[name="description"]');
    expect(meta).not.toBeNull();
    expect(meta?.getAttribute('content')).toBe('hello');
    expect(metadata.get('description')).toBe('hello');
  });

  it('supports MetaType keys', () => {
    const metadata = new MetaData();
    const key: MetaType = ['property', 'og:title'];

    metadata.set(key, 'My Title');

    expect(metadata.get(key)).toBe('My Title');
    expect(
      document.head.querySelector('meta[property="og:title"]')
    ).not.toBeNull();
  });

  it('parses structured content into tuples on get()', () => {
    const metadata = new MetaData();

    metadata.set('robots', [
      ['index', 'true'],
      ['follow', 'false'],
    ]);

    const value = metadata.get('robots');
    expect(value).toEqual([
      ['index', 'true'],
      ['follow', 'false'],
    ]);
  });

  it('returns undefined for missing or empty content', () => {
    const metadata = new MetaData();

    expect(metadata.get('keywords')).toBeUndefined();
  });

  it('has() reflects presence of metadata', () => {
    const metadata = new MetaData();

    metadata.set('viewport', 'width=device-width');
    expect(metadata.has('viewport')).toBe(true);
    expect(metadata.has('description')).toBe(false);
  });

  it('delete() removes metadata and corresponding meta element', () => {
    const metadata = new MetaData();

    metadata.set('description', 'to be removed');
    metadata.delete('description');

    expect(metadata.has('description')).toBe(false);
    expect(document.head.querySelector('meta[name="description"]')).toBeNull();
  });

  it('clear() removes all meta elements from document.head', () => {
    const metadata = new MetaData();

    metadata.set('description', 'a');
    metadata.set('viewport', 'b');

    metadata.clear();

    expect(
      document.head.querySelectorAll('meta').length
    ).toBe(EMPTY_COLLECTION_LENGTH);
  });

  it('tracks externally added meta tags via MutationObserver', async () => {
    const metadata = new MetaData();

    const meta = document.createElement('meta');
    meta.setAttribute('name', 'author');
    meta.setAttribute('content', 'Ada');
    document.head.appendChild(meta);

    await Promise.resolve(); // allow MutationObserver to flush

    expect(metadata.get('author')).toBe('Ada');
  });

  it('tracks externally removed meta tags via MutationObserver', async () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'generator');
    meta.setAttribute('content', 'vite');
    document.head.appendChild(meta);

    const metadata = new MetaData();
    meta.remove();

    await Promise.resolve();

    expect(metadata.has('generator')).toBe(false);
  });

  it('is iterable and exposes correct size', () => {
    const metadata = new MetaData();
    const EXPECTED_METADATA_SIZE = 2;
    const EXPECTED_ENTRIES_SIZE = 2;

    metadata.set('a', '1');
    metadata.set('b', '2');

    const entries = Array.from(metadata);
    expect(entries.length).toBe(EXPECTED_ENTRIES_SIZE);
    expect(metadata.size).toBe(EXPECTED_METADATA_SIZE);
  });
});
