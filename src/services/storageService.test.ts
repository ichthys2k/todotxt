import { describe, it, expect, vi, beforeEach } from 'vitest'

// Die echten Provider ziehen Capacitor, MSAL usw. nach – für diese Tests reicht ein
// gemeinsamer Fake, der für jeden Speicherort verwendet wird.
const fake = vi.hoisted(() => ({
  fetchArchiveContent: vi.fn(),
  saveArchiveContent: vi.fn(),
  fetchTodoContent: vi.fn(),
  saveTodoContent: vi.fn(),
}))

vi.mock('./providers/LocalSyncProvider', () => ({ LocalSyncProvider: class { constructor() { return fake } } }))
vi.mock('./providers/OneDriveSyncProvider', () => ({ OneDriveSyncProvider: class {} }))
vi.mock('./providers/WebDavSyncProvider', () => ({ WebDavSyncProvider: class {} }))
vi.mock('./providers/GitSyncProvider', () => ({ GitSyncProvider: class {} }))
vi.mock('./providers/GoogleDriveSyncProvider', () => ({ GoogleDriveSyncProvider: class {} }))

const { archiveTasks } = await import('./storageService')

describe('archiveTasks', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    fake.saveArchiveContent.mockImplementation(async (c: string) => c)
  })

  it('hängt neue Einträge an das bestehende Archiv an', async () => {
    fake.fetchArchiveContent.mockResolvedValue('x 2026-01-01 Alt\n')
    await archiveTasks('local', 'x 2026-11-25 Neu')
    expect(fake.saveArchiveContent).toHaveBeenCalledWith('x 2026-01-01 Alt\nx 2026-11-25 Neu')
  })

  it('legt bei leerem (noch nicht vorhandenem) Archiv nur die neuen Einträge ab', async () => {
    fake.fetchArchiveContent.mockResolvedValue('')
    await archiveTasks('local', 'x 2026-11-25 Neu')
    expect(fake.saveArchiveContent).toHaveBeenCalledWith('x 2026-11-25 Neu')
  })

  it('überschreibt das Archiv NICHT, wenn es nicht gelesen werden kann', async () => {
    fake.fetchArchiveContent.mockRejectedValue(new Error('ARCHIVE_FILE_READ_FAILED'))
    await expect(archiveTasks('local', 'x 2026-11-25 Neu')).rejects.toThrow('ARCHIVE_FILE_READ_FAILED')
    expect(fake.saveArchiveContent).not.toHaveBeenCalled()
  })
})
