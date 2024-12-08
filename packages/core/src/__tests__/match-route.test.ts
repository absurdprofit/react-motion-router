import { expect, test } from 'vitest';
import { matchRoute } from '../common/utils';

test('returns null when there is no match', () => {
  expect(matchRoute('posts', 'details')).toBeNull();
});

test('returns object with key "params" when there is a match', () => {
  const result = matchRoute('posts', 'posts');
  expect(typeof result?.params).toBe('object');
  expect(result).toHaveProperty('params');
});

test('match case sensitive by default', () => {
  expect(matchRoute('posts', 'POSTS')).toBeNull();
});

test('match case insensitive with flag set to false', () => {
  const result = matchRoute('posts', 'POSTS', undefined, false);
  expect(typeof result?.params).toBe('object');
  expect(result).toHaveProperty('params');
});

test('match pattern with optional param', () => {
  expect(matchRoute('posts/:id?', 'posts')).toHaveProperty('params');
  expect(matchRoute('posts/:id?', 'posts/1')).toHaveProperty('params');
});

test('returns params object with parsed path param as key value pair', () => {
  const paramKey = 'id';
  const result = matchRoute(`posts/:${paramKey}`, 'posts/1');
  expect(typeof result?.params).toBe('object');
  expect(result).toHaveProperty('params');
  expect(result?.params).toHaveProperty(paramKey);
  expect(result?.params?.[paramKey]).toEqual('1');
});

test('match pattern with optional base path', () => {
  expect(matchRoute('posts', 'posts', '/(react-motion-router/)?')).toHaveProperty('params');
  expect(matchRoute('posts', '/react-motion-router/posts', '/(react-motion-router/)?')).toHaveProperty('params');
});

test('match pattern with constrained optional path param', () => {
  expect(matchRoute('{step/:step(1|2)}?', '/signup/', '/signup/')).toHaveProperty('params');
  expect(matchRoute('{step/:step(1|2)}?', '/signup/step/1', '/signup/')).toHaveProperty('params');
  expect(matchRoute('{step/:step(1|2)}?', '/signup/step/2', '/signup/')).toHaveProperty('params');
  expect(matchRoute('{step/:step(1|2)}?', '/signup/step/3', '/signup/')).toBeNull();
});

test('match patterns with wildcards', () => {
  expect(matchRoute('posts/*', 'posts/10')).toHaveProperty('params');
  expect(matchRoute('posts/**', 'posts/explore/10')).toHaveProperty('params');
  expect(matchRoute('posts/*.png', 'posts/me.png')).toHaveProperty('params');
});

test('match pattern with regex', () => {
  expect(matchRoute('books/:isbn([\\d\\-]{10,13})', 'books/1-56619-909-3')?.params).toHaveProperty('isbn');
});