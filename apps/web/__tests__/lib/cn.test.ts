import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/cn'

describe('cn', () => {
  it('joins multiple class strings with a space', () => {
    expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz')
  })

  it('filters out falsy — false', () => {
    expect(cn('foo', false, 'bar')).toBe('foo bar')
  })

  it('filters out falsy — null', () => {
    expect(cn('foo', null, 'bar')).toBe('foo bar')
  })

  it('filters out falsy — undefined', () => {
    expect(cn('foo', undefined, 'bar')).toBe('foo bar')
  })

  it('returns an empty string when all values are falsy', () => {
    expect(cn(false, null, undefined)).toBe('')
  })

  it('returns a single class unchanged', () => {
    expect(cn('solo')).toBe('solo')
  })

  it('handles conflicting Tailwind-style classes by keeping last occurrence in input order', () => {
    // cn is a simple join — it does NOT deduplicate conflicting utilities.
    // The output preserves the caller's order; callers are responsible for ordering.
    const result = cn('text-red-500', 'text-blue-500')
    expect(result).toBe('text-red-500 text-blue-500')
  })

  it('handles mixed truthy and falsy in one call', () => {
    expect(cn('a', false, 'b', null, 'c', undefined)).toBe('a b c')
  })
})
