import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeKey, ToolCallInput } from 'claude-code'

import type { Activity, ActivityKind, AgentRow, Board, CheckState, PrRow, UsageWindow } from '../types'

const PANE = 'team-board'
const TITLE = 'Team'
/** The activity key of the session's own loop: the lead. */
const LEAD = 'main'
const AGENT_POLL_MS = 3_000
const PR_POLL_MS = 30_000
/** How often the open panel asks the account for its usage: one small GET. */
const USAGE_POLL_MS = 60_000
/** A turn's measurement asks again sooner, but not more often than this. */
const USAGE_NUDGE_MS = 15_000
/** How long an account reading outranks this session's own rate-limit figures. */
const ACCOUNT_FRESH_MS = 3 * USAGE_POLL_MS
/**
 * The account's usage, as claude.ai's usage page and Claude Code's /usage read it:
 * every surface's usage (other terminals, claude.ai, the apps), not this session's
 * alone. Undocumented, so any failure falls back to the session's own figures.
 */
const USAGE_URL = 'https://api.anthropic.com/api/oauth/usage'
const TICK_MS = 5_000

// Change a tag when that value's fields change: it declines what an earlier
// version stored, which outlives a reload.
const activity = atom(
  { plugin: 'team-board', key: 'activity' } as const,
  {} as Record<string, Activity>,
  { shape: 'activity-3' },
)
const tick = atom({ plugin: 'team-board', key: 'tick' } as const, 0, { shape: 'tick-1' })
const agents = atom({ plugin: 'team-board', key: 'agents' } as const, [] as AgentRow[], {
  shape: 'agents-1',
})
const prs = atom({ plugin: 'team-board', key: 'prs' } as const, [] as PrRow[], {
  shape: 'prs-2',
})
const board = atom({ plugin: 'team-board', key: 'board' } as const, {} as Board, {
  shape: 'board-1',
})
const usage = atom({ plugin: 'team-board', key: 'usage' } as const, [] as UsageWindow[], {
  shape: 'usage-1',
})

type Api = EngineInterface

/** Starts work nobody waits for, so a failure never surfaces as an unhandled rejection. */
const quietly = (work: Promise<unknown>) => void work.catch(() => undefined)

// ---------- what an agent is doing ----------

const baseName = (path: unknown) => String(path ?? '').split('/').pop() ?? ''
const firstLine = (text: unknown) => String(text ?? '').split('\n')[0] ?? ''

/** A tool's name as people say it: `mcp__claude_ai_Linear__get_issue` → `get_issue`. */
const toolName = (tool: string) => (tool.startsWith('mcp__') ? tool.split('__').slice(2).join(' ') : tool)

/** What a tool call is doing, as a verb: `running: Run the tests`, `editing booking.ts`. */
export function describe(e: ToolCallInput): string {
  const a = e as unknown as Record<string, unknown>
  const tool: string = e.tool
  switch (tool) {
    case 'Bash':
      return `running: ${firstLine(a.description || a.command)}`
    case 'Read':
      return `reading ${baseName(a.file_path)}`
    case 'Edit':
    case 'NotebookEdit':
      return `editing ${baseName(a.file_path ?? a.notebook_path)}`
    case 'Write':
      return `writing ${baseName(a.file_path)}`
    case 'Grep':
    case 'Glob':
      return `searching ${firstLine(a.pattern)}`
    case 'Skill':
      return `skill: ${String(a.skill ?? '')}`
    case 'Agent':
      return `delegating: ${firstLine(a.description)}`
    case 'SendMessage':
      return `messaging ${String(a.to ?? '')}`
    case 'AskUserQuestion':
      return 'waiting for your answer'
    case 'WebSearch':
      return 'searching the web'
    case 'WebFetch':
      return 'reading a web page'
    default:
      return `using ${toolName(tool)}`
  }
}

const elapsed = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}

/** The activity as one line; a tool running 5s or more shows how long. */
export function activityLine(act: Activity, now: number): string {
  switch (act.kind) {
    case 'tool':
      return now - act.since >= 5_000 ? `${act.text} · ${elapsed(now - act.since)}` : act.text
    case 'done':
      return `${act.text} ✓`
    case 'idle':
      return 'working…'
    default:
      return act.text
  }
}

/** What a teammate is doing now: its loop's status first, then its activity. */
export function nowLine(a: AgentRow, act: Activity | undefined, now: number): string {
  switch (a.status) {
    case 'idle':
      // Its last act was a message to the lead: the lead owes it an answer.
      return act?.kind === 'idle' && /^messaging \S*lead\b/.test(act.text)
        ? 'idle · waiting on lead'
        : 'idle · waiting for a message'
    case 'waiting':
      return 'waiting on background work'
    case 'pending':
      return 'starting…'
    case 'completed':
      return 'finished'
    case 'failed':
      return 'failed'
    case 'killed':
      return 'stopped'
    default:
      return act ? activityLine(act, now) : 'working…'
  }
}

// ---------- what waits on the person ----------

/** Why a teammate waits on the person, or undefined: an approval, a question, a PR to merge. */
export function teammateNeed(
  a: AgentRow,
  act: Activity | undefined,
  pr: PrRow | undefined,
  phase: { label: string },
): string | undefined {
  if (isLive(a) && act?.kind === 'approval') return act.text
  if (isLive(a) && act?.kind === 'tool' && act.isForYou) return act.text
  // A teammate still at work on its PR is not waiting on you, whatever the checks say.
  if (pr && phase.label === 'ready to merge' && !isLive(a)) return `#${pr.number} ready to merge`
  return undefined
}

/** Why the lead waits on the person, or undefined. */
export function leadNeed(act: Activity | undefined): string | undefined {
  if (act?.kind === 'approval') return act.text
  if (act?.kind === 'tool' && act.isForYou) return act.text
  if (act?.kind === 'idle' && act.isQuestion) return 'asked you something'
  return undefined
}

/** A turn's last words read as a question: `…?`, past closing markdown or quotes. */
export const endsInQuestion = (answer: string) => /\?[\s*_)`"'\]]*$/.test(answer)

/**
 * The panel's order: waiting on you, then working, then idle, then done
 * (merged, closed or ended); by name within each, so rows move only when a
 * teammate changes group.
 */
export function groupOf(a: AgentRow, phase: { label: string }, need: string | undefined): number {
  if (need) return 0
  if (phase.label === 'merged' || phase.label === 'PR closed') return 3
  if (a.status === 'completed' || a.status === 'failed' || a.status === 'killed') return 3
  return isLive(a) ? 1 : 2
}

/** Sets one loop's activity; a tool call's `done` replaces only its own `tool`, or an approval. */
async function setActivity($: Api, key: string, act: Activity) {
  await update($, activity, map => {
    const current = map[key]
    // A call's end clears its own `tool`, and any approval it waited on.
    if (act.kind === 'done' && current?.kind !== 'approval' && current?.toolUseId !== act.toolUseId) return map
    return { ...map, [key]: act }
  })
}

const STREAM_KIND: Record<string, ActivityKind | undefined> = {
  thinking: 'thinking',
  text: 'writing',
  tool: 'preparing',
}

// ---------- PRs ----------

type RollupItem = {
  __typename?: string
  name?: string
  context?: string
  status?: string
  conclusion?: string
  state?: string
  description?: string
}

const FAILED = new Set(['FAILURE', 'ERROR', 'CANCELLED', 'TIMED_OUT', 'ACTION_REQUIRED', 'STARTUP_FAILURE'])

function itemState(item: RollupItem): CheckState {
  if (item.__typename === 'StatusContext') {
    if (item.state === 'SUCCESS') return 'pass'
    if (item.state === 'PENDING' || item.state === 'EXPECTED') return 'pending'
    return 'fail'
  }
  if (item.status !== 'COMPLETED') return 'pending'
  return FAILED.has(item.conclusion ?? '') ? 'fail' : 'pass'
}

/** Folds a PR's checks: any failure fails, else any pending is pending. */
export function summarise(rollup: RollupItem[]): { ci: CheckState; gate: CheckState; gateNote?: string } {
  const gateItem = rollup.find(item => item.context === 'pr-review')
  const states = rollup.filter(item => item !== gateItem).map(itemState)
  const ci: CheckState =
    states.length === 0
      ? 'none'
      : states.includes('fail')
        ? 'fail'
        : states.includes('pending')
          ? 'pending'
          : 'pass'
  return {
    ci,
    gate: gateItem ? itemState(gateItem) : 'none',
    gateNote: gateItem?.description || undefined,
  }
}

export function parsePrs(stdout: string): PrRow[] {
  const raw = JSON.parse(stdout) as Array<{
    number: number
    title: string
    headRefName: string
    state: PrRow['state']
    isDraft: boolean
    statusCheckRollup?: RollupItem[]
    mergeable?: string
    mergeStateStatus?: string
  }>
  return raw.map(pr => ({
    number: pr.number,
    title: pr.title,
    branch: pr.headRefName,
    state: pr.state,
    isDraft: pr.isDraft,
    hasConflicts: pr.mergeable === 'CONFLICTING' || pr.mergeStateStatus === 'DIRTY',
    ...summarise(pr.statusCheckRollup ?? []),
  }))
}

/** Open PRs (with their checks) first, then the recent closed and merged ones not already listed. */
export function mergePrs(open: PrRow[], recent: PrRow[]): PrRow[] {
  const seen = new Set(open.map(pr => pr.number))
  return [...open, ...recent.filter(pr => !seen.has(pr.number))]
}

/**
 * Runs one `gh pr list`. Check data is heavy (tens of checks a PR), so only open PRs
 * carry it: the whole list with checks outgrows what `$.process.run` keeps of stdout.
 */
async function listPrs($: Api, repoDir: string, state: 'open' | 'all', fields: string): Promise<PrRow[]> {
  const run = await $.process.run(
    ['gh', 'pr', 'list', '--state', state, '--limit', '40', '--json', fields],
    { cwd: repoDir, timeoutMs: 20_000 },
  )
  if (run.exitCode !== 0) throw new Error(firstLine(run.stderr) || `gh exited ${run.exitCode}`)
  if (run.isStdoutTruncated) throw new Error(`gh pr list --state ${state} output was cut off`)
  return parsePrs(run.stdout)
}

async function refreshPrs($: Api) {
  const { repoDir } = await read($, board)
  if (!repoDir) return
  try {
    const [open, recent] = await Promise.all([
      listPrs($, repoDir, 'open', 'number,title,headRefName,state,isDraft,statusCheckRollup,mergeable,mergeStateStatus'),
      listPrs($, repoDir, 'all', 'number,title,headRefName,state,isDraft'),
    ])
    const rows = mergePrs(open, recent)
    await update($, prs, () => rows)
    await update($, board, b => ({ ...b, error: undefined, fetchedAt: Date.now() }))
  } catch (err) {
    await update($, board, b => ({ ...b, error: err instanceof Error ? err.message : String(err) }))
  }
}

// ---------- agents ----------

const isTeammate = (a: AgentRow) => a.teammateId !== undefined || a.type === 'teammate'
const isLive = (a: AgentRow) => a.status === 'running' || a.status === 'pending' || a.status === 'waiting'

async function refreshAgents($: Api) {
  const list = await $.agent.list()
  const rows: AgentRow[] = list.map(a => ({
    id: a.id,
    name: a.name ?? a.description,
    teammateId: a.teammateId,
    type: a.type,
    status: a.status,
    description: a.description,
    parentId: a.parentId,
  }))
  const before = await read($, agents)
  if (JSON.stringify(before) !== JSON.stringify(rows)) await update($, agents, () => rows)

  // Open the panel by itself the first time a teammate shows up.
  const state = await read($, board)
  if (!state.isAutoOpened && rows.some(isTeammate)) {
    await update($, board, b => ({ ...b, isAutoOpened: true }))
    quietly($.ui.open({ id: PANE, title: TITLE }))
    quietly(refreshAccountUsage($))
  }
}

// ---------- matching a teammate to its PR, and its phase ----------

/** `abc-479` → `abc-479`; a name without a ticket ID matches on the name itself. */
const ticketOf = (name: string) => (name.match(/[a-z]+-\d+/i)?.[0] ?? name).toLowerCase()

/** The PR a description names: `Look after PR 401`, `#401`. */
const namedPr = (text: string) => Number(text.match(/(?:\bPR\s*#?|#)(\d+)\b/i)?.[1] ?? NaN)

/**
 * A teammate's PR: the one its description names (`Look after PR 401`), else the one
 * whose branch or title holds the ticket ID in its name (`abc-479`).
 */
export function prFor(name: string, list: PrRow[], description = ''): PrRow | undefined {
  const named = list.find(pr => pr.number === namedPr(description))
  if (named) return named
  const ticket = ticketOf(name)
  const hits = list.filter(
    pr => pr.branch.toLowerCase().includes(ticket) || pr.title.toLowerCase().includes(ticket),
  )
  return hits.find(pr => pr.state === 'OPEN') ?? hits.sort((a, b) => b.number - a.number)[0]
}

/** Live agents whose description names the PR: `PR 391 round 3 code review`, `#391`. */
export function reviewersOf(pr: PrRow, all: AgentRow[]): number {
  const names = new RegExp(`(?:\\bPR\\s*#?|#)${pr.number}\\b`, 'i')
  return all.filter(a => !isTeammate(a) && isLive(a) && names.test(a.description)).length
}

export function phaseOf(
  a: AgentRow,
  pr: PrRow | undefined,
  reviewers: number,
): { label: string; color: ThemeKey } {
  if (!pr) return isLive(a) ? { label: 'coding', color: 'claude' } : { label: 'no PR yet', color: 'subtle' }
  if (pr.state === 'MERGED') return { label: 'merged', color: 'merged' }
  if (pr.state === 'CLOSED') return { label: 'PR closed', color: 'subtle' }
  if (pr.hasConflicts) return { label: 'merge conflicts', color: 'error' }
  if (reviewers > 0) return { label: 'in review', color: 'suggestion' }
  if (pr.gate === 'fail') return { label: 'fixing', color: 'error' }
  if (pr.gate !== 'pass') return { label: 'awaiting review', color: 'warning' }
  if (pr.ci === 'fail') return { label: 'CI failing', color: 'error' }
  if (pr.ci === 'pending') return { label: 'CI running', color: 'warning' }
  return { label: 'ready to merge', color: 'success' }
}

const STATUS: Record<string, { mark: string; color: ThemeKey }> = {
  running: { mark: '●', color: 'success' },
  pending: { mark: '…', color: 'subtle' },
  waiting: { mark: '◐', color: 'warning' },
  idle: { mark: '○', color: 'subtle' },
  completed: { mark: '✓', color: 'subtle' },
  failed: { mark: '✗', color: 'error' },
  killed: { mark: '✗', color: 'subtle' },
}

const CHECK: Record<CheckState, { mark: string; color: ThemeKey }> = {
  pass: { mark: '✓', color: 'success' },
  fail: { mark: '✗', color: 'error' },
  pending: { mark: '…', color: 'warning' },
  none: { mark: '–', color: 'subtle' },
}

// ---------- plan usage ----------

const HOUR_MS = 3_600_000
const DAY_MS = 24 * HOUR_MS
const WEEK_MS = 7 * DAY_MS
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** What each window is called on claude.ai's usage page, and the order they take. */
const WINDOW: Record<string, { label: string; order: number }> = {
  five_hour: { label: 'Current session', order: 0 },
  seven_day: { label: 'This week', order: 1 },
  spend_limit: { label: 'Spend limit', order: 2 },
}

const windowLabel = (kind: string) => WINDOW[kind]?.label ?? kind.replace(/_/g, ' ')

/** The windows in claude.ai's order: session, week, then anything else. */
export function orderWindows(list: UsageWindow[]): UsageWindow[] {
  const rank = (w: UsageWindow) => WINDOW[w.kind]?.order ?? 9
  return [...list].sort((a, b) => rank(a) - rank(b))
}

/** `8:10 PM`, in the machine's local time. */
export function clockTime(at: Date): string {
  const h = at.getHours()
  const m = String(at.getMinutes()).padStart(2, '0')
  return `${h % 12 || 12}:${m} ${h < 12 ? 'AM' : 'PM'}`
}

/** `Resets at 8:10 PM` within the day, else `Resets Saturday 12:00 PM`. */
export function resetLine(resetsAt: string | undefined, now: number): string | undefined {
  if (!resetsAt) return undefined
  const at = new Date(resetsAt)
  if (Number.isNaN(at.getTime())) return undefined
  if (at.getTime() <= now) return 'Resetting now'
  return at.getTime() - now < DAY_MS
    ? `Resets at ${clockTime(at)}`
    : `Resets ${DAYS[at.getDay()]} ${clockTime(at)}`
}

/** `56% used`; one decimal only below 10, where it still says something. */
export const percentLabel = (p: number) => `${p < 10 ? Math.round(p * 10) / 10 : Math.round(p)}% used`

/** Blue while there is room, amber from 75%, red from 90%. */
export const barColor = (p: number): ThemeKey => (p >= 90 ? 'error' : p >= 75 ? 'warning' : 'suggestion')

/** A bar `width` cells wide: the used part and the rest. */
export function barCells(percent: number, width: number): { used: number; left: number } {
  const used = Math.round((Math.min(100, Math.max(0, percent)) / 100) * width)
  return { used, left: width - used }
}

/**
 * Whether this week's pace reaches the reset: the share used against the share of
 * the week gone. Says nothing in the week's first six hours, when a pace means little.
 */
export function paceLine(week: UsageWindow | undefined, now: number): { text: string; isAhead: boolean } | undefined {
  if (!week?.resetsAt) return undefined
  const reset = new Date(week.resetsAt).getTime()
  if (Number.isNaN(reset) || reset <= now) return undefined
  const gone = now - (reset - WEEK_MS)
  if (gone < 6 * HOUR_MS) return undefined
  const day = DAYS[new Date(reset).getDay()]
  if (week.percentUsed >= 100) return { text: `Weekly limit reached. It resets ${day}.`, isAhead: true }
  const projected = (week.percentUsed / gone) * WEEK_MS
  if (projected <= 100) {
    return { text: `On track. You should reach ${day}'s reset with room to spare.`, isAhead: false }
  }
  const hitsAt = new Date(now + ((100 - week.percentUsed) / week.percentUsed) * gone)
  const when = hitsAt.getTime() - now < DAY_MS ? clockTime(hitsAt) : `${DAYS[hitsAt.getDay()]} ${clockTime(hitsAt)}`
  return { text: `At this pace you'll hit the weekly limit ${when}, before ${day}'s reset.`, isAhead: true }
}

const sameUsage = (a: UsageWindow[], b: UsageWindow[]) => JSON.stringify(a) === JSON.stringify(b)

async function setUsage($: Api, list: readonly UsageWindow[]) {
  const rows = list.map(w => ({ kind: w.kind, percentUsed: w.percentUsed, resetsAt: w.resetsAt }))
  if (!sameUsage(await read($, usage), rows)) await update($, usage, () => rows)
}

type AccountWindow = { utilization?: number | null; resets_at?: string | null } | null | undefined

/** The usage endpoint's body → the session and weekly windows it reports. */
export function parseAccountUsage(text: string): UsageWindow[] {
  const raw = JSON.parse(text) as Record<string, AccountWindow>
  return ['five_hour', 'seven_day'].flatMap(kind => {
    const w = raw[kind]
    if (!w || typeof w.utilization !== 'number') return []
    return [{ kind, percentUsed: Math.round(w.utilization * 10) / 10, resetsAt: w.resets_at ?? undefined }]
  })
}

const isPaneOpen = async ($: Api) => (await $.ui.panes()).some(pane => pane.id === PANE)

/**
 * Asks the account for its usage. The engine holds the credential: the panel gets
 * an opaque handle, never the token, and the engine signs the request.
 */
async function refreshAccountUsage($: Api) {
  try {
    const auth = await $.session.authorize()
    if (!auth) throw new Error('not signed in to a Claude plan')
    const res = await $.http.fetch(USAGE_URL, {
      auth: auth.handle,
      headers: { 'anthropic-beta': 'oauth-2025-04-20' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    await setUsage($, parseAccountUsage(res.text))
    await update($, board, b => ({ ...b, usageAt: Date.now(), usageError: undefined }))
  } catch (err) {
    const usageError = err instanceof Error ? err.message : String(err)
    if ((await read($, board)).usageError !== usageError) await update($, board, b => ({ ...b, usageError }))
  }
}

/**
 * A turn's measurement: this session's figures stand in while no fresh account
 * reading exists, and the open panel asks the account again, at most every 15s.
 */
async function onMeasure($: Api, list: readonly UsageWindow[]) {
  const { usageAt } = await read($, board)
  const age = usageAt === undefined ? Infinity : Date.now() - usageAt
  if (age >= ACCOUNT_FRESH_MS) await setUsage($, list)
  if (age >= USAGE_NUDGE_MS && (await isPaneOpen($))) await refreshAccountUsage($)
}

// ---------- the hooks ----------

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'team',
      description: 'Open or close the team panel; `/team repo <path>` sets the repo its PRs come from',
    })
    const state = await read($, board)
    if (!state.repoDir) await update($, board, b => ({ ...b, repoDir: e.cwd }))

    $.clock.every(AGENT_POLL_MS, () => quietly(refreshAgents($)))
    $.clock.every(PR_POLL_MS, () => quietly(refreshPrs($)))
    // Usage only while the panel is open: nobody reads it otherwise.
    $.clock.every(USAGE_POLL_MS, () =>
      quietly(isPaneOpen($).then(isOpen => (isOpen ? refreshAccountUsage($) : undefined))),
    )
    // Redraw elapsed times, only while some tool call is running.
    $.clock.every(TICK_MS, () =>
      quietly(
        read($, activity).then(async map => {
          if (Object.values(map).some(act => act.kind === 'tool')) await update($, tick, () => Date.now())
        }),
      ),
    )
    quietly(refreshAgents($))
    quietly(refreshPrs($))
    quietly($.session.usage().then(u => setUsage($, u.rateLimits)))
    // A reload keeps the panel open: read the account at once, not a minute on.
    quietly(isPaneOpen($).then(isOpen => (isOpen ? refreshAccountUsage($) : undefined)))

    return next(e)
  })

  // The engine pushes this session's rate-limit windows after each turn, and
  // whenever one moves a whole point: the fallback, and a cue to ask again.
  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('rateLimits')) quietly(onMeasure($, e.rateLimits))
    return next(e)
  }).catch(($, e, next) => next(e))

  on('command.run', { command: 'team' }, async ($, e) => {
    const [verb, ...rest] = e.args.trim().split(/\s+/)
    if (verb === 'repo') {
      const asked = rest.join(' ')
      if (!asked) return { text: `PRs come from ${(await read($, board)).repoDir ?? 'nowhere yet'}.` }
      const run = await $.process.run(['bash', '-c', 'cd -- "${1/#\\~/$HOME}" && pwd', '_', asked])
      if (run.exitCode !== 0) return { text: `No folder at ${asked}.` }
      const repoDir = run.stdout.trim()
      await update($, board, b => ({ ...b, repoDir, error: undefined }))
      await refreshPrs($)
      await $.ui.open({ id: PANE, title: TITLE })
      return { text: `Team panel PRs now come from ${repoDir}.` }
    }
    if ((await $.ui.panes()).some(pane => pane.id === PANE)) {
      await $.ui.close({ id: PANE })
      return { text: 'Team panel closed.' }
    }
    const opened = await $.ui.open({ id: PANE, title: TITLE })
    quietly(refreshAgents($))
    quietly(refreshPrs($))
    quietly(refreshAccountUsage($))
    return { text: opened.isPlaced ? 'Team panel opened.' : `Team panel waiting: ${opened.reason}` }
  })

  // The panel never gets in an agent's way: activity writes are never awaited
  // by the work they describe, and every hook below passes its event on as is.

  on('tool.call', async ($, e, next) => {
    const key = e.agentId ?? LEAD
    const text = describe(e)
    const toolUseId = e.tool_use_id
    const forYou = e.tool === 'AskUserQuestion' ? { isForYou: true as const } : {}
    quietly(setActivity($, key, { kind: 'tool', text, since: Date.now(), toolUseId, ...forYou }))
    const ran = await next(e)
    quietly(setActivity($, key, { kind: 'done', text, since: Date.now(), toolUseId }))
    if (e.tool === 'Bash' && /\bgh pr\b|\bgit push\b/.test(e.command)) quietly(refreshPrs($))
    return ran
  }).catch(($, e, next) => next(e)) // a failure here lets the tool call run as if unhooked

  // One model request: thinking, writing a reply, or filling in a tool call.
  // Writes only when the stream switches kind, not per chunk.
  on('turn.step', async function* ($, e, next) {
    const key = e.agentId ?? LEAD
    quietly(setActivity($, key, { kind: 'thinking', text: 'thinking…', since: Date.now() }))
    let last: string | undefined = 'thinking'
    const stream = next(e)
    // Read by hand, not `for await`, to keep what the stream returns: the step's result.
    for (;;) {
      const step = await stream.next()
      if (step.done) return step.value
      const chunk = step.value
      const kind = STREAM_KIND[chunk.kind]
      const label = kind === 'preparing' && chunk.kind === 'tool' ? `${kind}:${chunk.name}` : kind
      if (kind && label !== last) {
        last = label
        const text =
          chunk.kind === 'tool'
            ? `preparing ${toolName(chunk.name)}…`
            : kind === 'writing'
              ? 'writing a reply…'
              : 'thinking…'
        quietly(setActivity($, key, { kind, text, since: Date.now() }))
      }
      yield chunk
    }
  })

  // An approval dialog is about to be shown to the person: the agent waits on
  // them. This fires only for a real dialog, never for an ask that auto mode's
  // classifier settles, so it is the signal (tool.check's 'ask' is not). It
  // answers nothing: the person's dialog decides.
  on('classic.PermissionRequest', async ($, e, next) => {
    const text = `waiting for approval: ${toolName(e.tool_name)}`
    quietly(setActivity($, e.agent_id ?? LEAD, { kind: 'approval', text, since: Date.now() }))
    return next(e)
  }).catch(($, e, next) => next(e))

  // A turn ended: idle, keeping the last act's words (a message to the lead
  // means it waits on the lead). The lead's turn ending on a question waits on you.
  on('turn.complete', async ($, e, next) => {
    const key = e.agentId ?? LEAD
    const asked = key === LEAD && endsInQuestion(e.answer) ? { isQuestion: true as const } : {}
    quietly(
      update($, activity, map => ({
        ...map,
        [key]: { kind: 'idle' as const, text: map[key]?.text ?? 'idle', since: Date.now(), ...asked },
      })),
    )
    return next(e)
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const [doing, all, prList, state, windows] = await Promise.all([
      read($, activity),
      read($, agents),
      read($, prs),
      read($, board),
      read($, usage),
      read($, tick), // subscribes the panel to the elapsed-time redraws
    ])
    const now = Date.now()
    const leadAgents = all.filter(a => !isTeammate(a) && a.parentId === undefined && isLive(a))
    // Whose conversation is on screen: an agent's id, or none for the lead's own.
    // That name is drawn inverse, the lead's as much as a teammate's.
    const viewing = e.props.view.agentId

    const rows = all
      .filter(isTeammate)
      .map(a => {
        const pr = prFor(a.name, prList, a.description)
        const phase = phaseOf(a, pr, pr ? reviewersOf(pr, all) : 0)
        const act = doing[a.id]
        const need = teammateNeed(a, act, pr, phase)
        return { a, pr, phase, act, need, group: groupOf(a, phase, need) }
      })
      .sort((x, y) => x.group - y.group || x.a.name.localeCompare(y.a.name))

    const lead = doing[LEAD]
    const leadWants = leadNeed(lead)
    const waiting = rows.filter(row => row.need).length + (leadWants ? 1 : 0)

    const leadBlock = (
      <Box flexDirection="column" marginBottom={1}>
        <Box>
          {leadWants ? <Text color="warning" bold>! </Text> : null}
          {viewing ? (
            <Button key="view-lead" plain onPress={() => quietly($.ui.view({}))}>
              <Text bold>lead</Text>
            </Button>
          ) : (
            <Text bold inverse>lead</Text>
          )}
          <Text dimColor>
            {leadAgents.length > 0
              ? `  ${leadAgents.length} agent${leadAgents.length > 1 ? 's' : ''} running`
              : ''}
          </Text>
        </Box>
        <Text dimColor={!leadWants} color={leadWants ? 'warning' : undefined} wrap="truncate-end">
          {'  '}
          {leadWants ?? (lead && lead.kind !== 'idle' ? activityLine(lead, now) : 'idle')}
        </Text>
        {leadAgents.map(s => (
          <Text dimColor wrap="truncate-end">{'  · '}{s.description}</Text>
        ))}
      </Box>
    )

    // Plan usage, at the foot: claude.ai's usage page in the panel's width.
    const barWidth = Math.max(10, e.props.bodyColumns - 1)
    const isAccountFresh = state.usageAt !== undefined && now - state.usageAt < ACCOUNT_FRESH_MS
    const pace = paceLine(windows.find(w => w.kind === 'seven_day'), now)
    const usageBlock = (
      <Box flexDirection="column" marginTop={1}>
        <Text dimColor>{'─'.repeat(barWidth)}</Text>
        <Text bold>Your usage</Text>
        {state.usageError && !isAccountFresh ? (
          <Text dimColor wrap="wrap">
            Account usage unavailable ({state.usageError}): showing this session's figures.
          </Text>
        ) : null}
        {windows.length === 0 ? <Text dimColor wrap="wrap">No reading yet.</Text> : null}
        {pace ? (
          <Text color={pace.isAhead ? 'warning' : undefined} dimColor={!pace.isAhead} wrap="wrap">
            {pace.text}
          </Text>
        ) : null}
        {orderWindows(windows).map(w => {
          const bar = barCells(w.percentUsed, barWidth)
          const reset = resetLine(w.resetsAt, now)
          return (
            <Box flexDirection="column" marginTop={1}>
              <Box justifyContent="space-between">
                <Text>{windowLabel(w.kind)}</Text>
                <Text dimColor>{percentLabel(w.percentUsed)}</Text>
              </Box>
              <Box>
                <Text color={barColor(w.percentUsed)}>{'━'.repeat(bar.used)}</Text>
                <Text color="subtle">{'━'.repeat(bar.left)}</Text>
              </Box>
              {reset ? <Text dimColor>{reset}</Text> : null}
            </Box>
          )
        })}
      </Box>
    )

    // Docked, the panel fills the pane's height so usage sits flush at the foot;
    // inline, the frame fits the tree, so it stays right under the rows.
    const isDocked = e.props.placement === 'dock'

    return (
      <Box flexDirection="column" minHeight={isDocked ? e.props.scroll.bodyRows : undefined}>
        {waiting > 0 ? (
          <Box marginBottom={1}>
            <Text color="warning" bold>
              ! {waiting} need{waiting === 1 ? 's' : ''} you
            </Text>
          </Box>
        ) : null}
        {leadWants ? leadBlock : null}

        {rows.length === 0 && <Text dimColor>No teammates yet.</Text>}
        {rows.map(({ a, pr, phase, act, need }) => {
          const status = need
            ? { mark: '!', color: 'warning' as ThemeKey }
            : (STATUS[a.status] ?? { mark: '?', color: 'subtle' as ThemeKey })
          const inPane = a.id.includes('@')
          const helpers = all.filter(s => s.parentId === a.id && isLive(s)).length
          return (
            <Box flexDirection="column" marginBottom={1}>
              <Box>
                <Text color={status.color} bold={Boolean(need)}>{status.mark} </Text>
                {inPane ? (
                  <Text bold>{a.name}</Text>
                ) : (
                  <Button key={`view-${a.id}`} plain onPress={() => quietly($.ui.view({ agentId: a.id }))}>
                    <Text bold inverse={viewing === a.id}>{a.name}</Text>
                  </Button>
                )}
                <Text>  </Text>
                <Text color={phase.color}>{phase.label}</Text>
              </Box>
              <Text dimColor={!need} color={need ? 'warning' : undefined} wrap="truncate-end">
                {'  '}
                {need ?? (inPane ? 'working in its own tmux pane' : nowLine(a, act, now))}
                {helpers > 0 ? ` · ${helpers} agent${helpers > 1 ? 's' : ''}` : ''}
              </Text>
              {pr ? (
                <Box>
                  <Text dimColor>{'  '}#{pr.number} {pr.isDraft ? 'draft' : pr.state.toLowerCase()} · CI </Text>
                  <Text color={CHECK[pr.ci].color}>{CHECK[pr.ci].mark}</Text>
                  <Text dimColor> · gate </Text>
                  <Text color={CHECK[pr.gate].color}>{CHECK[pr.gate].mark}</Text>
                  {pr.hasConflicts ? <Text color="error"> · conflicts</Text> : null}
                  {pr.gateNote ? <Text dimColor wrap="truncate-end"> {pr.gateNote}</Text> : null}
                </Box>
              ) : null}
            </Box>
          )
        })}

        {leadWants ? null : leadBlock}

        {state.error ? (
          <Text color="warning" wrap="truncate-end">PRs: {state.error} {' (/team repo <path>)'}</Text>
        ) : null}

        {isDocked ? <Box flexGrow={1} /> : null}
        {usageBlock}
      </Box>
    )
  })
}
