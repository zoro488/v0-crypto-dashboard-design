/**
 * Unit Tests - Logger Utility
 */

import { logger } from '@/app/lib/utils/logger'

describe('Logger Utility', () => {
  let consoleWarnSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('warn', () => {
    it('should log warning messages', () => {
      logger.warn('Test warning message')
      expect(consoleWarnSpy).toHaveBeenCalled()
      const callArgs = consoleWarnSpy.mock.calls[0][0]
      expect(callArgs).toContain('[WARN]')
      expect(callArgs).toContain('Test warning message')
    })

    it('should include context in warning messages', () => {
      logger.warn('Test warning', { context: 'TestContext' })
      expect(consoleWarnSpy).toHaveBeenCalled()
      const callArgs = consoleWarnSpy.mock.calls[0][0]
      expect(callArgs).toContain('[TestContext]')
    })
  })

  describe('error', () => {
    it('should log error messages', () => {
      logger.error('Test error message')
      expect(consoleErrorSpy).toHaveBeenCalled()
      const callArgs = consoleErrorSpy.mock.calls[0][0]
      expect(callArgs).toContain('[ERROR]')
      expect(callArgs).toContain('Test error message')
    })

    it('should include timestamp by default', () => {
      logger.error('Test error')
      expect(consoleErrorSpy).toHaveBeenCalled()
      const callArgs = consoleErrorSpy.mock.calls[0][0]
      // Verificar formato de timestamp ISO
      expect(callArgs).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should handle Error objects', () => {
      const error = new Error('Test error')
      logger.error('An error occurred', error)
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })
})
