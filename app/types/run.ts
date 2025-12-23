export interface Run {
  runId: string
  url: string
  status: number
  cacheHeaders: Record<string, string>
  durationInMs: number
  reportId?: string
}

export type ApiRun = Omit<Run, 'cacheHeaders'> & {
  headers: Record<string, string>
}
