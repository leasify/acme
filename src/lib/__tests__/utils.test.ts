import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
      expect(cn('foo', true && 'bar', false && 'baz')).toBe('foo bar')
    })

    it('should merge tailwind classes correctly', () => {
      expect(cn('p-2', 'p-4')).toBe('p-4')
    })

    it('should handle empty inputs', () => {
      expect(cn()).toBe('')
      expect(cn('')).toBe('')
    })

    it('should handle arrays', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar')
    })

    it('should handle complex combinations', () => {
      expect(cn(
        'base-class',
        'text-white',
        true && 'active',
        false && 'inactive',
        { 'conditional': true, 'not-applied': false }
      )).toBe('base-class text-white active conditional')
    })
  })
})