// Baton overlay: every finished turn refreshes BATON.md (state + conversation tail), and /baton opens a live pane
// where you can see what was saved, copy the whole file, or store it in OneDrive / Dropbox / Drive / anywhere.
import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { BatonStatus } from '../types'

const PANE = 'baton'
const status = atom({ plugin: 'baton-overlay', key: 'status' } as const, null)
const preview = atom({ plugin: 'baton-overlay', key: 'preview' } as const, '')
const busy = atom({ plugin: 'baton-overlay', key: 'busy' } as const, null)
const flash = atom({ plugin: 'baton-overlay', key: 'flash' } as const, null)
const showPreview = atom({ plugin: 'baton-overlay', key: 'showPreview' } as const, false)

const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`

function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 10) return 'just now'
  if (s < 90) return `${Math.round(s)}s ago`
  if (s < 5400) return `${Math.round(s / 60)}m ago`
  return `${(s / 3600).toFixed(1)}h ago`
}

async function enginePath($: EngineInterface): Promise<string> {
  const home = (await $.env.get('USERPROFILE')) ?? (await $.env.get('HOME')) ?? ''
  return `${home.replace(/\\/g, '/')}/.baton/bin/baton.mjs`
}

async function baton($: EngineInterface, args: string[], stdin?: string): Promise<string> {
  const r = await $.process.run(['node', await enginePath($), ...args], { stdin: stdin ?? '', timeoutMs: 25_000 })
  if (r.exitCode !== 0) throw new Error((r.stderr || r.stdout).trim().slice(0, 160) || `baton ${args[0]} failed`)
  return r.stdout
}

async function say($: EngineInterface, text: string) {
  await update($, flash, () => text)
  $.ui.toast(text)
}

async function load($: EngineInterface) {
  try {
    const s: BatonStatus = JSON.parse(await baton($, ['status', '--json'], ''))
    await update($, status, () => s)
    const rev = s.saved ? `rev ${s.saved.revision} · saved ${ago(s.saved.updated)}` : 'not saved yet'
    $.ui.status(`baton · ${rev} · /baton`)
  } catch (err) {
    $.ui.status(`baton · engine missing (${String(err).slice(0, 50)})`)
  }
}

// The session's own transcript goes to the engine on stdin, so the conversation tail is exact.
async function save($: EngineInterface, trigger: string) {
  const cwd = await $.session.cwd()
  const msgs = await $.session.messages()
  const payload = JSON.stringify({ cwd, messages: msgs.slice(-60).map(m => ({ role: m.role, text: m.text })) })
  await update($, busy, () => 'Saving handoff…')
  try {
    await baton($, ['save', '--quiet', '--trigger', trigger], payload)
  } finally {
    await update($, busy, () => null)
  }
  await load($)
}

async function loadPreview($: EngineInterface) {
  const s = await read($, status)
  if (!s) return
  try {
    const text = await $.fs.read(s.file)
    await update($, preview, () => (typeof text === 'string' ? text : ''))
  } catch {
    await update($, preview, () => '')
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'baton', description: 'Live session handoff: copy, share or store BATON.md' })
    void load($)
    $.clock.every(30_000, () => void load($))
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    if (e.agentId === undefined) void save($, 'turn').catch(() => load($))
    return done
  })

  on('command.run', { command: 'baton' }, async $ => {
    await load($)
    await loadPreview($)
    await $.ui.open({ id: PANE, title: 'Baton' })
    return { text: 'Baton overlay opened.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button, Markdown } = $.ui.resolve(e)
    const s = await read($, status)
    const working = await read($, busy)
    const note = await read($, flash)
    const open = await read($, showPreview)
    const text = await read($, preview)
    if (!s) return <Text dimColor>Loading Baton…</Text>

    const copy = async (surface: string) => {
      const body = await $.fs.read(s.file)
      const r = await $.ui.copy({ text: typeof body === 'string' ? body : '', surface: surface as never })
      await say($, r.isCopied ? `Copied ${kb(s.bytes)} to the clipboard` : 'Clipboard unavailable here: use Save a copy to…')
    }
    const exportTo = async (label: string, path: string) => {
      try {
        const out = (await baton($, ['export', '--to', path])).trim()
        await say($, `Saved to ${label}: ${out.replace('Exported to ', '')}`)
      } catch (err) {
        await say($, `Could not save to ${label}: ${String(err).slice(0, 80)}`)
      }
      await load($)
    }

    return (
      <Box flexDirection="column" gap={1}>
        <Text bold>BATON · {s.project.name}</Text>
        <Text dimColor wrap="wrap">
          {s.saved ? `rev ${s.saved.revision} · ${kb(s.bytes)} · saved ${ago(s.saved.updated)}` : 'No handoff yet'} · auto-updates every turn
        </Text>
        <Text dimColor wrap="wrap">{s.file}</Text>
        {(working || note) && <Text>{working ?? note}</Text>}

        <Box flexDirection="row" gap={2} flexWrap="wrap">
          <Button key="save" variant="primary" label="Save now" onPress={() => void save($, 'pane')} />
          <Button key="copy" label="Copy whole .md" onPress={press => void copy(press.surface)} />
          <Button key="preview" label={open ? 'Hide preview' : 'Preview'} onPress={() => void loadPreview($).then(() => update($, showPreview, v => !v))} />
        </Box>

        <Text bold>Save a copy to</Text>
        <Box flexDirection="row" gap={2} flexWrap="wrap">
          {s.targets.length === 0 && <Text dimColor>No cloud folders found. Use: baton export --to FOLDER</Text>}
          {s.targets.map(t => (
            <Button key={`t-${t.path}`} label={t.label} onPress={() => void exportTo(t.label, t.path)} />
          ))}
        </Box>

        <Text bold>Live log</Text>
        {s.events.length === 0 && <Text dimColor>Nothing yet. Finish a turn and it appears here.</Text>}
        {s.events.slice(0, 8).map(ev => (
          <Text key={`${ev.at}-${ev.type}`} dimColor={ev.type === 'unchanged'} wrap="truncate-end">
            {ev.type === 'saved' ? '● saved' : ev.type === 'exported' ? '↗ exported' : ev.type === 'copied' ? '⧉ copied' : `· ${ev.type}`}
            {ev.revision ? ` rev ${ev.revision}` : ''}
            {ev.trigger ? ` (${ev.trigger})` : ''}
            {ev.to ? ` → ${ev.to}` : ''} · {ago(ev.at)}
          </Text>
        ))}

        {open && <Markdown text={text.slice(0, 6000) + (text.length > 6000 ? '\n\n…(preview cut; the file is complete)' : '')} />}
      </Box>
    )
  })
}
