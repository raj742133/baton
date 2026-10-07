export type BatonEvent = { at: string; type: string; project?: string; revision?: number; bytes?: number; trigger?: string; to?: string; text?: string }
export type BatonTarget = { label: string; path: string }
export type BatonStatus = {
  version: string
  home: string
  file: string
  bytes: number
  projects: number
  project: { name: string; root: string; id: string; remote: string }
  saved: { revision: number; updated: string } | null
  events: BatonEvent[]
  targets: BatonTarget[]
}

declare module 'claude-code' {
  interface PluginState {
    'baton-overlay': {
      status: BatonStatus | null
      preview: string
      busy: string | null
      flash: string | null
      showPreview: boolean
    }
  }
}
