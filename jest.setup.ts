import '@testing-library/jest-dom'

// Polyfills para Web APIs requeridas por Firebase Auth en Node.js
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      headers: new Map(),
    })
  ) as jest.Mock
}

// Polyfill para Response
if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    ok = true
    status = 200
    statusText = 'OK'
    headers = new Map()
    body = null
    
    constructor(body?: BodyInit | null, init?: ResponseInit) {
      this.body = body as unknown as ReadableStream<Uint8Array> | null
      if (init?.status) this.status = init.status
      if (init?.statusText) this.statusText = init.statusText
    }
    
    json() { return Promise.resolve({}) }
    text() { return Promise.resolve('') }
    clone() { return new Response() }
  } as unknown as typeof Response
}

// Polyfill para Request
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    url: string
    method = 'GET'
    headers = new Map()
    
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      this.url = typeof input === 'string' ? input : input.toString()
      if (init?.method) this.method = init.method
    }
  } as unknown as typeof Request
}

// Polyfill para Headers
if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    private map = new Map<string, string>()
    
    append(name: string, value: string) { this.map.set(name.toLowerCase(), value) }
    get(name: string) { return this.map.get(name.toLowerCase()) || null }
    has(name: string) { return this.map.has(name.toLowerCase()) }
    set(name: string, value: string) { this.map.set(name.toLowerCase(), value) }
    delete(name: string) { this.map.delete(name.toLowerCase()) }
  } as unknown as typeof Headers
}

// Polyfills para jsdom - TextEncoder y TextDecoder
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util')
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder
}

// Mock de IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
} as any

// Mock de ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any

// Mock de matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock de window.scroll
window.scroll = jest.fn()
window.scrollTo = jest.fn()

// Suprimir warnings de React 19
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Not implemented: HTMLFormElement.prototype.requestSubmit'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
