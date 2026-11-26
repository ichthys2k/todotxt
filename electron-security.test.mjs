import { describe, it, expect } from 'vitest'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const {
  isSafeExternalUrl,
  comparablePath,
  samePath,
  isAllowedFile,
  isAllowedNavigation,
} = require('./electron-security.cjs')

describe('isSafeExternalUrl', () => {
  it('erlaubt https, http und mailto', () => {
    expect(isSafeExternalUrl('https://www.lipponer.de/2do/auth.html?x=1')).toBe(true)
    expect(isSafeExternalUrl('http://example.com/')).toBe(true)
    expect(isSafeExternalUrl('mailto:dev@lipponer.de')).toBe(true)
  })

  it.each([
    'file:///etc/passwd',
    'file:///C:/Windows/System32/calc.exe',
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'ms-msdt:/id PCWDiagnostic',
    'smb://evil/share',
    'vscode://file/x',
    'todotxt://auth',
    '\\\\evil\\share',
    'calc.exe',
    '',
  ])('lehnt %s ab', (url) => {
    expect(isSafeExternalUrl(url)).toBe(false)
  })

  it('lehnt Nicht-Strings und überlange Adressen ab', () => {
    expect(isSafeExternalUrl(undefined)).toBe(false)
    expect(isSafeExternalUrl(null)).toBe(false)
    expect(isSafeExternalUrl(42)).toBe(false)
    expect(isSafeExternalUrl({ toString: () => 'https://example.com' })).toBe(false)
    expect(isSafeExternalUrl('https://example.com/' + 'a'.repeat(5000))).toBe(false)
  })
})

describe('Pfadprüfung', () => {
  const todo = '/home/user/sync/todo.txt'
  const archive = '/home/user/sync/archive.txt'

  it('erlaubt genau die gespeicherten Pfade', () => {
    expect(isAllowedFile(todo, [todo, archive])).toBe(true)
    expect(isAllowedFile(archive, [todo, archive])).toBe(true)
  })

  it('erkennt denselben Pfad in anderer Schreibweise (../, doppelte Schrägstriche)', () => {
    expect(isAllowedFile('/home/user/sync/../sync/todo.txt', [todo, null])).toBe(true)
    expect(isAllowedFile('/home/user//sync/./todo.txt', [todo, null])).toBe(true)
  })

  it('lehnt andere Dateien ab', () => {
    expect(isAllowedFile('/etc/passwd', [todo, archive])).toBe(false)
    expect(isAllowedFile('/home/user/.ssh/id_ed25519', [todo, archive])).toBe(false)
    expect(isAllowedFile('/home/user/sync/todo.txt.bak', [todo, archive])).toBe(false)
    expect(isAllowedFile('/home/user/sync/', [todo, archive])).toBe(false)
  })

  it('lehnt Pfad-Tricks ab, die aus dem Ordner herausführen', () => {
    expect(isAllowedFile('/home/user/sync/../../../etc/passwd', [todo, archive])).toBe(false)
    expect(isAllowedFile('/home/user/sync/todo.txt/../../.bashrc', [todo, archive])).toBe(false)
  })

  it('lehnt relative, leere und ungültige Pfade ab', () => {
    expect(isAllowedFile('todo.txt', [todo, archive])).toBe(false)
    expect(isAllowedFile('../todo.txt', [todo, archive])).toBe(false)
    expect(isAllowedFile('', [todo, archive])).toBe(false)
    expect(isAllowedFile(null, [todo, archive])).toBe(false)
    expect(isAllowedFile(undefined, [todo, archive])).toBe(false)
    expect(isAllowedFile({}, [todo, archive])).toBe(false)
    expect(isAllowedFile(todo + '\0.png', [todo, archive])).toBe(false)
  })

  it('erlaubt nichts, wenn noch keine Pfade gespeichert sind', () => {
    expect(isAllowedFile(todo, [null, null])).toBe(false)
    expect(isAllowedFile(todo, [])).toBe(false)
  })

  it('samePath / comparablePath', () => {
    expect(samePath('/a/b/../c', '/a/c')).toBe(true)
    expect(samePath('/a/c', '/a/d')).toBe(false)
    expect(comparablePath('relativ/pfad')).toBe(null)
  })
})

describe('isAllowedNavigation', () => {
  const app = 'file:///opt/todotxt/resources/app/dist/index.html'

  it('erlaubt die App selbst (auch mit Query und Hash)', () => {
    expect(isAllowedNavigation(app, app)).toBe(true)
    expect(isAllowedNavigation(app + '?view=widget', app)).toBe(true)
    expect(isAllowedNavigation(app + '#/liste', app)).toBe(true)
  })

  it('lehnt fremde Seiten und andere Dateien ab', () => {
    expect(isAllowedNavigation('https://evil.example/', app)).toBe(false)
    expect(isAllowedNavigation('file:///etc/passwd', app)).toBe(false)
    expect(isAllowedNavigation('file:///opt/todotxt/resources/app/dist/other.html', app)).toBe(false)
    expect(isAllowedNavigation('javascript:alert(1)', app)).toBe(false)
    expect(isAllowedNavigation('data:text/html,x', app)).toBe(false)
    expect(isAllowedNavigation('not a url', app)).toBe(false)
  })

  it('im Entwicklungsmodus gilt derselbe Ursprung', () => {
    const dev = 'http://localhost:5173/'
    expect(isAllowedNavigation('http://localhost:5173/?view=widget', dev)).toBe(true)
    expect(isAllowedNavigation('http://localhost:5174/', dev)).toBe(false)
    expect(isAllowedNavigation('https://localhost:5173/', dev)).toBe(false)
    expect(isAllowedNavigation('http://evil.example:5173/', dev)).toBe(false)
  })
})
