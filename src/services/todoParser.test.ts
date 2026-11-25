import { describe, it, expect, vi, afterEach } from 'vitest'
import { parseTask, serializeTask, completeTask } from './todoParser'

describe('parseTask / serializeTask', () => {
  it('liest Priorität, Datum, Projekte, Kontexte und Tags', () => {
    const t = parseTask('(A) 2026-11-01 Mathe vorbereiten +Schule @Büro due:2026-11-30')
    expect(t.priority).toBe('A')
    expect(t.creationDate).toBe('2026-11-01')
    expect(t.projects).toEqual(['Schule'])
    expect(t.contexts).toEqual(['Büro'])
    expect(t.tags.due).toBe('2026-11-30')
    expect(serializeTask(t)).toBe('(A) 2026-11-01 Mathe vorbereiten +Schule @Büro due:2026-11-30')
  })

  it('liest erledigte Aufgaben mit Erledigungs- und Erstellungsdatum', () => {
    const t = parseTask('x 2026-11-20 2026-11-01 Erledigt')
    expect(t.isCompleted).toBe(true)
    expect(t.completionDate).toBe('2026-11-20')
    expect(t.creationDate).toBe('2026-11-01')
    expect(serializeTask(t)).toBe('x 2026-11-20 2026-11-01 Erledigt')
  })
})

describe('completeTask mit Wiederholung (rec:)', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('verschiebt das Fälligkeitsdatum nur bei der neuen Aufgabe', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 25, 12, 0, 0)) // 25.11.2026

    const original = parseTask('Müll rausbringen due:2026-11-25 rec:1w')
    const [done, next] = completeTask(original)

    // Neue Aufgabe: eine Woche später
    expect(next.tags.due).toBe('2026-12-02')
    expect(next.description).toContain('due:2026-12-02')
    expect(next.isCompleted).toBe(false)

    // Erledigte Aufgabe behält das alte Datum – in Text UND Tags
    expect(done.isCompleted).toBe(true)
    expect(done.description).toContain('due:2026-11-25')
    expect(done.tags.due).toBe('2026-11-25')

    // Das Original-Objekt wird nicht verändert
    expect(original.tags.due).toBe('2026-11-25')
    expect(original.isCompleted).toBe(false)
  })

  it('verschiebt bei strikter Wiederholung (+) vom alten Fälligkeitsdatum aus', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 25, 12, 0, 0))

    const original = parseTask('Bericht due:2026-11-20 t:2026-11-18 rec:+1w')
    const [done, next] = completeTask(original)

    expect(next.tags.due).toBe('2026-11-27')
    expect(next.tags.t).toBe('2026-11-25')
    expect(done.tags.due).toBe('2026-11-20')
    expect(done.tags.t).toBe('2026-11-18')
  })

  it('gibt der neuen Aufgabe eigene Listen für Projekte und Kontexte', () => {
    const original = parseTask('Gießen +Garten @Haus due:2026-11-25 rec:1d')
    const [done, next] = completeTask(original)
    next.projects.push('Neu')
    expect(done.projects).toEqual(['Garten'])
    expect(original.projects).toEqual(['Garten'])
  })
})
