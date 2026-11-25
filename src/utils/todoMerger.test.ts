import { describe, it, expect } from 'vitest'
import { mergeTodoContents } from './todoMerger'

const lines = (s: string) => s.split('\n').filter(Boolean)

describe('mergeTodoContents mit Basis (Drei-Wege-Merge)', () => {
  const base = 'A erledigen\nB erledigen\nC erledigen\n'

  it('holt lokal gelöschte Aufgaben nicht zurück', () => {
    const local = 'A erledigen\nC erledigen\n'          // B lokal gelöscht
    const remote = 'A erledigen\nB erledigen\nC erledigen\nD neu extern\n'
    expect(lines(mergeTodoContents(local, remote, base))).toEqual([
      'A erledigen', 'C erledigen', 'D neu extern',
    ])
  })

  it('übernimmt extern gelöschte Aufgaben', () => {
    const local = 'A erledigen\nB erledigen\nC erledigen\nE neu lokal\n'
    const remote = 'A erledigen\nC erledigen\n'          // B extern gelöscht
    expect(lines(mergeTodoContents(local, remote, base))).toEqual([
      'A erledigen', 'C erledigen', 'E neu lokal',
    ])
  })

  it('erzeugt bei lokal bearbeitetem Text keine Doppelten', () => {
    const local = 'A erledigen\nB erledigen +Projekt\nC erledigen\n' // B bearbeitet
    const remote = 'A erledigen\nB erledigen\nC erledigen\nD neu extern\n'
    expect(lines(mergeTodoContents(local, remote, base))).toEqual([
      'A erledigen', 'B erledigen +Projekt', 'C erledigen', 'D neu extern',
    ])
  })

  it('übernimmt extern erledigte Aufgaben ohne Doppelte', () => {
    const local = 'A erledigen\nB erledigen\nC erledigen\nE neu lokal\n'
    const remote = 'A erledigen\nx 2026-11-25 B erledigen\nC erledigen\n'
    expect(lines(mergeTodoContents(local, remote, base))).toEqual([
      'A erledigen', 'C erledigen', 'E neu lokal', 'x 2026-11-25 B erledigen',
    ])
  })

  it('behält beide Fassungen, wenn dieselbe Aufgabe auf beiden Seiten anders bearbeitet wurde', () => {
    const local = 'A erledigen\nB lokal geändert\nC erledigen\n'
    const remote = 'A erledigen\nB extern geändert\nC erledigen\n'
    const result = lines(mergeTodoContents(local, remote, base))
    expect(result).toContain('B lokal geändert')
    expect(result).toContain('B extern geändert')
    expect(result).not.toContain('B erledigen')
  })

  it('verliert nichts, wenn beide Seiten dieselbe Zeile hinzufügen', () => {
    const local = base + 'F doppelt\n'
    const remote = base + 'F doppelt\n'
    expect(lines(mergeTodoContents(local, remote, base))).toEqual([
      'A erledigen', 'B erledigen', 'C erledigen', 'F doppelt',
    ])
  })

  it('behält die Priorität erledigter Aufgaben (kein verlustbehaftetes Neu-Serialisieren)', () => {
    const local = 'x 2026-11-25 (A) Wichtig\nNeu lokal\n'
    const remote = 'x 2026-11-25 (A) Wichtig\n'
    const b = 'x 2026-11-25 (A) Wichtig\n'
    expect(lines(mergeTodoContents(local, remote, b))).toEqual(['x 2026-11-25 (A) Wichtig', 'Neu lokal'])
  })

  it('löst gleiche id: nach upd: auf (neuere Fassung gewinnt)', () => {
    const b = 'Aufgabe id:1 upd:100\n'
    const local = 'Aufgabe lokal id:1 upd:200\n'
    const remote = 'Aufgabe extern id:1 upd:300\n'
    expect(lines(mergeTodoContents(local, remote, b))).toEqual(['Aufgabe extern id:1 upd:300'])
  })

  it('ignoriert Windows-Zeilenenden und Leerzeilen', () => {
    const local = 'A erledigen\r\n\r\nC erledigen\r\n'
    const remote = 'A erledigen\r\nB erledigen\r\nC erledigen\r\n'
    expect(lines(mergeTodoContents(local, remote, base))).toEqual(['A erledigen', 'C erledigen'])
  })
})

describe('mergeTodoContents ohne Basis (bisheriges Verfahren)', () => {
  it('vereinigt beide Seiten und bevorzugt erledigte Fassungen', () => {
    const local = 'A erledigen\nNeu lokal\n'
    const remote = 'x 2026-11-25 A erledigen\nNeu extern\n'
    const result = lines(mergeTodoContents(local, remote))
    expect(result).toContain('x 2026-11-25 A erledigen')
    expect(result).toContain('Neu lokal')
    expect(result).toContain('Neu extern')
    expect(result).not.toContain('A erledigen')
  })
})
