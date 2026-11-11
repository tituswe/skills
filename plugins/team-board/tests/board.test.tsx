import { expect, test } from 'claude-code/testing'
import type { AgentInfo } from 'claude-code'

import {
  activityLine, barCells, clockTime, endsInQuestion, groupOf, leadNeed, mergePrs, nowLine, orderWindows, paceLine,
  parseAccountUsage, parsePrs, percentLabel, phaseOf, prFor, resetLine, teammateNeed,
} from '../hooks/register'
import type { PrRow } from '../types'
import type { AgentRow } from '../types'

const PANE = {
  plugin: 'team-board',
  component: 'Pane',
  requestId: 'team-board',
  props: {
    title: 'Team',
    isFocused: false,
    bodyColumns: 48,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
  },
} as const

const AGENTS: AgentInfo[] = [
  { id: 'a1', teammateId: 'abc-479@team', name: 'abc-479', description: 'abc-479', type: 'teammate', status: 'running' },
  { id: 'a2', teammateId: 'abc-497@team', name: 'abc-497', description: 'abc-497', type: 'teammate', status: 'idle' },
  { id: 'a3', teammateId: 'abc-498@team', name: 'abc-498', description: 'abc-498', type: 'teammate', status: 'running' },
  { id: 'r1', description: 'PR 392 round 2 code review', type: 'general-purpose', status: 'running' },
]

const RUN = {
  origin: { kind: 'composer' },
  presentation: { isFullscreen: true, columns: 200 },
} as const

const check = (name: string, conclusion = 'SUCCESS') => ({
  __typename: 'CheckRun', name, status: 'COMPLETED', conclusion,
})
const gate = (state: string, description = '') => ({
  __typename: 'StatusContext', context: 'pr-review', state, description,
})

const PRS = [
  {
    number: 391, title: 'feat: add the widget (ABC-479)', headRefName: 'feat/abc-479-widget',
    state: 'OPEN', isDraft: false,
    statusCheckRollup: [check('server tests'), gate('FAILURE', '0 blockers, 1 important open')],
  },
  {
    number: 392, title: 'fix: handle empty input (ABC-497)', headRefName: 'fix/abc-497-empty-input',
    state: 'OPEN', isDraft: false,
    statusCheckRollup: [check('server tests')],
  },
  {
    number: 390, title: 'docs: add a decision record', headRefName: 'docs/decision-record',
    state: 'MERGED', isDraft: false, statusCheckRollup: [],
  },
]

test('the panel shows each teammate, its phase, its activity and its PR', async ($, on) => {
  // Nothing sits beneath the mod: each hook here stands for the engine.
  on('command.register', () => ({ value: { command: 'team' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('agent.list', () => ({ value: AGENTS }))
  on('ui.panes', () => ({ value: [] }))
  on('clock.every', () => ({ value: undefined }))
  on('process.run', (_, e) =>
    e.argv[0] === 'gh'
      ? { value: { exitCode: 0, stdout: JSON.stringify(PRS), stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
      : { value: { exitCode: 0, stdout: '/repo\n', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } },
  )
  on('tool.call', () => ({ result: {} }))

  await $.session.start({ cwd: '/repo', surface: 'terminal', isInteractive: true })
  // `/team` refreshes agents and PRs; `/team repo` waits for the PR fetch.
  await $.command.run({ command: 'team', args: '', ...RUN })
  await $.command.run({ command: 'team', args: 'repo /repo', ...RUN })
  await $.tool.call({ tool: 'Bash', command: 'npm test', description: 'Run the server tests', agentId: 'a1' })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const text = async (pattern: RegExp) => (await ui.find({ type: 'Text', text: pattern }))?.text

  expect(await text(/^fixing$/)).toBe('fixing') // abc-479: gate failed
  expect(await text(/^in review$/)).toBe('in review') // abc-497: a reviewer names #392
  expect(await text(/^coding$/)).toBe('coding') // abc-498: no PR, working
  expect(await text(/Run the server tests/)).toContain('running: Run the server tests ✓')
  expect(await text(/1 important open/)).toContain('0 blockers, 1 important open')
  expect(await text(/1 agent running/)).toContain('1 agent running')
  await ui.unmount()
})

test('/team opens the panel, and closes it when it is open', async ($, on) => {
  let isOpen = false
  on('command.register', () => ({ value: { command: 'team' } }))
  on('ui.open', () => {
    isOpen = true
    return { value: { isPlaced: true } }
  })
  on('ui.close', () => {
    isOpen = false
    return { value: undefined }
  })
  on('ui.panes', () => ({
    value: isOpen
      ? [{ id: 'team-board', title: 'Team', isShown: true, isFocused: false, isPlaced: true }]
      : [],
  }))
  on('agent.list', () => ({ value: [] }))
  on('process.run', () => ({
    value: { exitCode: 1, stdout: '', stderr: 'not a repo', isStdoutTruncated: false, isStderrTruncated: false },
  }))

  const opened = await $.command.run({ command: 'team', args: '', ...RUN })
  expect(isOpen).toBe(true)
  expect(JSON.stringify(opened)).toContain('Team panel opened.')

  const closed = await $.command.run({ command: 'team', args: '', ...RUN })
  expect(isOpen).toBe(false)
  expect(JSON.stringify(closed)).toContain('Team panel closed.')
})

test('the activity line says what a teammate is doing now', () => {
  const running: AgentRow = { id: 'a1', name: 'abc-479', type: 'teammate', status: 'running', description: 'abc-479' }
  const at = 1_000_000

  expect(nowLine(running, { kind: 'thinking', text: 'thinking…', since: at }, at)).toBe('thinking…')
  expect(nowLine(running, { kind: 'writing', text: 'writing a reply…', since: at }, at)).toBe('writing a reply…')
  // A tool shows its elapsed time from 5 seconds on.
  const tests = { kind: 'tool', text: 'running: Run the server tests', since: at } as const
  expect(nowLine(running, tests, at + 3_000)).toBe('running: Run the server tests')
  expect(nowLine(running, tests, at + 83_000)).toBe('running: Run the server tests · 1m 23s')
  expect(nowLine(running, { ...tests, kind: 'done' }, at)).toBe('running: Run the server tests ✓')
  expect(nowLine(running, { kind: 'approval', text: 'waiting for approval: Bash', since: at }, at)).toBe(
    'waiting for approval: Bash',
  )
  // The loop's own status wins over the last activity.
  expect(nowLine({ ...running, status: 'idle' }, tests, at)).toBe('idle · waiting for a message')
  expect(nowLine({ ...running, status: 'waiting' }, tests, at)).toBe('waiting on background work')
  expect(nowLine(running, undefined, at)).toBe('working…')
  expect(activityLine({ kind: 'idle', text: 'idle', since: at }, at)).toBe('working…')
})

test('a model request streams through unchanged, and the panel follows it', async ($, on) => {
  const CHUNKS = [
    { kind: 'thinking', index: 0, text: 'Let me look.' },
    { kind: 'thinking', index: 0, text: ' More.' },
    { kind: 'text', index: 1, text: 'Running the tests.' },
    { kind: 'tool', index: 2, id: 'tu1', name: 'Bash' },
  ] as const
  const RESULT = {
    turnId: 't1', index: 0, answer: 'Running the tests.', toolUses: [],
    stopReason: 'tool_use', usage: null,
  } as const
  on('turn.step', async function* () {
    for (const chunk of CHUNKS) yield chunk
    return RESULT
  })
  on('agent.list', () => ({ value: [AGENTS[0]!] }))
  on('ui.panes', () => ({ value: [] }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('process.run', () => ({
    value: { exitCode: 1, stdout: '', stderr: 'no repo', isStdoutTruncated: false, isStderrTruncated: false },
  }))
  on('command.register', () => ({ value: { command: 'team' } }))

  const stream = $.turn.step({ turnId: 't1', index: 0, model: 'm', messageCount: 1, agentId: 'a1' })
  const seen: unknown[] = []
  let result: unknown
  for (;;) {
    const step = await stream.next()
    if (step.done) {
      result = step.value
      break
    }
    seen.push(step.value)
  }
  expect(seen).toEqual([...CHUNKS])
  expect(result).toEqual(RESULT)

  await $.command.run({ command: 'team', args: '', ...RUN }) // loads the agent list
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await ui.find({ type: 'Text', text: /preparing/ }))?.text).toContain('preparing Bash…')
  await ui.unmount()
})

test('who waits on the person, and the order rows take', () => {
  const at = 1_000_000
  const row: AgentRow = { id: 'a1', name: 'abc-479', type: 'teammate', status: 'running', description: 'abc-479' }
  const open = { number: 392, title: 't', branch: 'b', state: 'OPEN', isDraft: false, hasConflicts: false, ci: 'pass', gate: 'pass' } as const
  const approval = { kind: 'approval', text: 'waiting for approval: Bash', since: at } as const
  const asking = { kind: 'tool', text: 'waiting for your answer', since: at, isForYou: true } as const

  expect(teammateNeed(row, approval, undefined, { label: 'coding' })).toBe('waiting for approval: Bash')
  expect(teammateNeed(row, asking, undefined, { label: 'coding' })).toBe('waiting for your answer')
  expect(teammateNeed({ ...row, status: 'idle' }, undefined, open, { label: 'ready to merge' })).toBe(
    '#392 ready to merge',
  )
  // A stale approval on a teammate that has since gone idle is no longer waiting.
  expect(teammateNeed({ ...row, status: 'idle' }, approval, undefined, { label: 'no PR yet' })).toBeUndefined()
  expect(teammateNeed(row, { kind: 'thinking', text: 'thinking…', since: at }, undefined, { label: 'coding' })).toBeUndefined()

  expect(leadNeed({ kind: 'idle', text: 'idle', since: at, isQuestion: true })).toBe('asked you something')
  expect(leadNeed({ kind: 'idle', text: 'idle', since: at })).toBeUndefined()
  expect(leadNeed(approval)).toBe('waiting for approval: Bash')

  expect(endsInQuestion('Should I merge it?')).toBe(true)
  expect(endsInQuestion('Want me to add it to the panel?**\n')).toBe(true)
  expect(endsInQuestion('Done.')).toBe(false)

  expect(groupOf(row, { label: 'coding' }, 'waiting for your answer')).toBe(0)
  expect(groupOf(row, { label: 'coding' }, undefined)).toBe(1)
  expect(groupOf({ ...row, status: 'idle' }, { label: 'awaiting review' }, undefined)).toBe(2)
  expect(groupOf({ ...row, status: 'idle' }, { label: 'merged' }, undefined)).toBe(3)

  // An idle teammate whose last act was a message to the lead waits on the lead.
  const told = { kind: 'idle', text: 'messaging team-lead', since: at } as const
  expect(nowLine({ ...row, status: 'idle' }, told, at)).toBe('idle · waiting on lead')
})

test('teammates waiting on you come first, under a count', async ($, on) => {
  const TEAM: AgentInfo[] = [
    { id: 'a1', teammateId: 'abc-479@team', name: 'abc-479', description: 'abc-479', type: 'teammate', status: 'running' },
    { id: 'a2', teammateId: 'abc-497@team', name: 'abc-497', description: 'abc-497', type: 'teammate', status: 'idle' },
    { id: 'a3', teammateId: 'abc-498@team', name: 'abc-498', description: 'abc-498', type: 'teammate', status: 'running' },
    { id: 'a4', teammateId: 'abc-480@team', name: 'abc-480', description: 'abc-480', type: 'teammate', status: 'idle' },
  ]
  const READY = [
    {
      number: 392, title: 'fix (ABC-497)', headRefName: 'fix/abc-497', state: 'OPEN', isDraft: false,
      statusCheckRollup: [check('server tests'), gate('SUCCESS', '0 blockers, 0 important open')],
    },
    { number: 380, title: 'feat (ABC-480)', headRefName: 'feat/abc-480', state: 'MERGED', isDraft: false, statusCheckRollup: [] },
  ]
  // The question to the person stays open until the test answers it.
  let answer: () => void = () => undefined
  const answered = new Promise<void>(resolve => (answer = resolve))
  on('tool.call', async () => {
    await answered
    return { result: {} }
  })
  on('command.register', () => ({ value: { command: 'team' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.panes', () => ({ value: [] }))
  on('agent.list', () => ({ value: TEAM }))
  on('process.run', (_, e) =>
    e.argv[0] === 'gh'
      ? { value: { exitCode: 0, stdout: JSON.stringify(READY), stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
      : { value: { exitCode: 0, stdout: '/repo\n', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } },
  )

  await $.command.run({ command: 'team', args: 'repo /repo', ...RUN })
  await $.command.run({ command: 'team', args: '', ...RUN }) // loads the agent list
  const asking = $.tool.call({ tool: 'AskUserQuestion', questions: [], agentId: 'a1' })
  // A round trip through the mod (`/team repo` with no path only reports), so the call's activity write lands first.
  await $.command.run({ command: 'team', args: 'repo', ...RUN })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await ui.find({ type: 'Text', text: /need/ }))?.text).toBe('! 2 need you')
  const names = (await ui.findAll({ type: 'Text', text: /^abc-\d+$/ })).map(found => found.text)
  expect(names).toEqual(['abc-479', 'abc-497', 'abc-498', 'abc-480'])
  expect((await ui.find({ type: 'Text', text: /your answer/ }))?.text).toContain('waiting for your answer')
  expect((await ui.find({ type: 'Text', text: /#392 ready to merge/ }))?.text).toContain('#392 ready to merge')
  await ui.unmount()

  answer()
  await asking
})

test('only a real approval dialog marks an agent as waiting on you', async ($, on) => {
  const TEAM: AgentInfo[] = [
    { id: 'a1', teammateId: 'abc-479@team', name: 'abc-479', description: 'abc-479', type: 'teammate', status: 'running' },
  ]
  // The kit raises PermissionRequest for every ask (nobody can be asked in a test),
  // so an ask auto mode settles without a dialog can't be played here.
  on('tool.call', () => ({ result: {} }))
  on('classic.PermissionRequest', () => ({}))
  on('command.register', () => ({ value: { command: 'team' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.panes', () => ({ value: [] }))
  on('agent.list', () => ({ value: TEAM }))
  on('process.run', () => ({
    value: { exitCode: 1, stdout: '', stderr: 'no repo', isStdoutTruncated: false, isStderrTruncated: false },
  }))
  await $.command.run({ command: 'team', args: '', ...RUN }) // loads the agent list
  const header = async () => {
    const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
    const found = (await ui.find({ type: 'Text', text: /need/ }))?.text
    const line = (await ui.find({ type: 'Text', text: /approval|running:/ }))?.text
    await ui.unmount()
    return { found, line }
  }

  expect((await header()).found).toBeUndefined()

  // A real dialog: the agent waits on you until the call ends.
  await $.classic.PermissionRequest({ tool_name: 'Bash', tool_input: {}, agent_id: 'a1' })
  await $.command.run({ command: 'team', args: 'repo', ...RUN }) // a round trip, so the write lands
  const asking = await header()
  expect(asking.found).toBe('! 1 needs you')
  expect(asking.line).toContain('waiting for approval: Bash')

  await $.tool.call({ tool: 'Bash', command: 'ls', description: 'List files', agentId: 'a1' })
  await $.command.run({ command: 'team', args: 'repo', ...RUN })
  const after = await header()
  expect(after.found).toBeUndefined()
  expect(after.line).toContain('running: List files ✓')
})

const pr = (number: number, more: Partial<PrRow> = {}): PrRow => ({
  number, title: `PR ${number}`, branch: `feat/x-${number}`, state: 'OPEN', isDraft: false,
  hasConflicts: false, ci: 'pass', gate: 'pass', ...more,
})

test('a teammate finds its PR by the PR its description names, else by its ticket ID', () => {
  const list = [pr(401, { branch: 'docs/end-date', title: 'docs: end date' }), pr(399, { branch: 'feat/abc-480-export' })]
  expect(prFor('docs-401', list, 'Look after PR 401')?.number).toBe(401)
  expect(prFor('abc-480', list, 'Look after PR 399')?.number).toBe(399)
  expect(prFor('abc-480', list, 'abc-480')?.number).toBe(399)
  // A description naming a PR that isn't listed falls back to the ticket ID.
  expect(prFor('abc-480', list, 'Look after PR 999')?.number).toBe(399)
  expect(prFor('docs-401', list, 'docs-401')).toBeUndefined()
  // A name that says what the work is still finds its PR by the ID at its front.
  expect(prFor('abc-480-csv-export', list, 'abc-480-csv-export')?.number).toBe(399)
})

test('merge conflicts block ready to merge, and a working teammate is not waiting on you', () => {
  const row: AgentRow = { id: 'a1', name: 'abc-479', type: 'teammate', status: 'idle', description: 'abc-479' }
  const clashing = pr(391, { hasConflicts: true })
  const phase = phaseOf(row, clashing, 0)
  expect(phase.label).toBe('merge conflicts')
  expect(teammateNeed(row, undefined, clashing, phase)).toBeUndefined()

  const ready = pr(391)
  expect(phaseOf(row, ready, 0).label).toBe('ready to merge')
  expect(teammateNeed(row, undefined, ready, { label: 'ready to merge' })).toBe('#391 ready to merge')
  expect(teammateNeed({ ...row, status: 'running' }, undefined, ready, { label: 'ready to merge' })).toBeUndefined()

  const parsed = parsePrs(JSON.stringify([
    { number: 1, title: 't', headRefName: 'b', state: 'OPEN', isDraft: false, mergeable: 'CONFLICTING' },
    { number: 2, title: 't', headRefName: 'b', state: 'OPEN', isDraft: false, mergeStateStatus: 'DIRTY' },
    { number: 3, title: 't', headRefName: 'b', state: 'OPEN', isDraft: false, mergeable: 'MERGEABLE', mergeStateStatus: 'UNSTABLE' },
  ]))
  expect(parsed.map(p => p.hasConflicts)).toEqual([true, true, false])
  // Open PRs keep their check data; the recent list only adds closed and merged ones.
  expect(mergePrs([pr(5, { gate: 'fail' })], [pr(5), pr(4, { state: 'MERGED' })]).map(p => `${p.number}${p.gate}`)).toEqual([
    '5fail',
    '4pass',
  ])
})

test('the panel fetches checks for open PRs only, and says when gh output is cut off', async ($, on) => {
  const TEAM: AgentInfo[] = [
    { id: 'a1', teammateId: 'docs-401@team', name: 'docs-401', description: 'Look after PR 401', type: 'teammate', status: 'idle' },
  ]
  const OPEN = [{
    number: 401, title: 'docs: end date', headRefName: 'docs/end-date', state: 'OPEN', isDraft: false,
    mergeable: 'CONFLICTING', mergeStateStatus: 'DIRTY', statusCheckRollup: [check('server tests'), gate('SUCCESS')],
  }]
  const calls: string[][] = []
  let isCutOff = false
  on('command.register', () => ({ value: { command: 'team' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.panes', () => ({ value: [] }))
  on('agent.list', () => ({ value: TEAM }))
  on('process.run', (_, e) => {
    if (e.argv[0] !== 'gh') return { value: { exitCode: 0, stdout: '/repo\n', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
    calls.push([...e.argv])
    const isOpen = e.argv.includes('open')
    return {
      value: {
        exitCode: 0, stdout: isOpen ? JSON.stringify(OPEN) : '[]', stderr: '',
        isStdoutTruncated: isOpen && isCutOff, isStderrTruncated: false,
      },
    }
  })

  await $.command.run({ command: 'team', args: 'repo /repo', ...RUN })
  await $.command.run({ command: 'team', args: '', ...RUN }) // loads the agent list
  const all = calls.find(argv => argv.includes('all'))
  expect(all?.join(' ')).not.toContain('statusCheckRollup')
  expect(calls.find(argv => argv.includes('open'))?.join(' ')).toContain('statusCheckRollup')

  let ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await ui.find({ type: 'Text', text: /^merge conflicts$/ }))?.text).toBe('merge conflicts')
  expect((await ui.find({ type: 'Text', text: /conflicts$/ }))?.text).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /ready to merge/ })).toBeUndefined()
  await ui.unmount()

  isCutOff = true
  await $.command.run({ command: 'team', args: 'repo /repo', ...RUN })
  ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await ui.find({ type: 'Text', text: /^PRs:/ }))?.text).toContain('output was cut off')
  await ui.unmount()
})

test('plan usage: reset times, percentages, bars and the weekly pace', () => {
  const now = new Date(2026, 10, 11, 15, 0).getTime() // Wed 11 Nov, 3:00 PM local
  expect(clockTime(new Date(2026, 10, 11, 20, 10))).toBe('8:10 PM')
  expect(clockTime(new Date(2026, 10, 11, 0, 5))).toBe('12:05 AM')
  expect(clockTime(new Date(2026, 10, 14, 12, 0))).toBe('12:00 PM')
  expect(resetLine(new Date(2026, 10, 11, 20, 10).toISOString(), now)).toBe('Resets at 8:10 PM')
  expect(resetLine(new Date(2026, 10, 14, 12, 0).toISOString(), now)).toBe('Resets Saturday 12:00 PM')
  expect(resetLine(undefined, now)).toBeUndefined()

  expect(percentLabel(56)).toBe('56% used')
  expect(percentLabel(7.25)).toBe('7.3% used')
  expect(barCells(56, 40)).toEqual({ used: 22, left: 18 })
  expect(barCells(130, 10)).toEqual({ used: 10, left: 0 })

  expect(orderWindows([
    { kind: 'seven_day', percentUsed: 40 },
    { kind: 'five_hour', percentUsed: 56 },
  ]).map(w => w.kind)).toEqual(['five_hour', 'seven_day'])

  // 40% used with the week 4.5 days gone (resets Sat noon): on track.
  const saturday = new Date(2026, 10, 14, 12, 0).toISOString()
  expect(paceLine({ kind: 'seven_day', percentUsed: 40, resetsAt: saturday }, now)).toEqual({
    text: "On track. You should reach Saturday's reset with room to spare.",
    isAhead: false,
  })
  // 90% used by the same point: ahead of pace.
  const ahead = paceLine({ kind: 'seven_day', percentUsed: 90, resetsAt: saturday }, now)
  expect(ahead?.isAhead).toBe(true)
  expect(ahead?.text).toContain("before Saturday's reset")
  // In the week's first hours, no pace yet.
  const fresh = new Date(now + 7 * 86_400_000 - 3_600_000).toISOString()
  expect(paceLine({ kind: 'seven_day', percentUsed: 2, resetsAt: fresh }, now)).toBeUndefined()
})

test('the panel shows plan usage at its foot, and follows the engine\'s measurements', async ($, on) => {
  const inFiveHours = new Date(Date.now() + 2 * 3_600_000).toISOString()
  const inThreeDays = new Date(Date.now() + 3 * 86_400_000).toISOString()
  on('command.register', () => ({ value: { command: 'team' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.panes', () => ({ value: [] }))
  on('agent.list', () => ({ value: [] }))
  on('clock.every', () => ({ value: undefined }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('process.run', () => ({
    value: { exitCode: 1, stdout: '', stderr: 'no repo', isStdoutTruncated: false, isStderrTruncated: false },
  }))
  on('session.usage', () => ({
    value: {
      startedAt: 0,
      context: { window: 200_000 },
      rateLimits: [
        { kind: 'seven_day', percentUsed: 40, resetsAt: inThreeDays },
        { kind: 'five_hour', percentUsed: 56, resetsAt: inFiveHours },
      ],
    },
  }))
  on('session.measure', (_, e) => ({ changed: e.changed }))

  await $.session.start({ cwd: '/repo', surface: 'terminal', isInteractive: true })
  await $.command.run({ command: 'team', args: '', ...RUN })

  let ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const text = async (pattern: RegExp) => (await ui.find({ type: 'Text', text: pattern }))?.text
  expect(await text(/^Your usage$/)).toBe('Your usage')
  expect(await text(/^Current session$/)).toBe('Current session')
  expect(await text(/^56% used$/)).toBe('56% used')
  expect(await text(/^This week$/)).toBe('This week')
  expect(await text(/^40% used$/)).toBe('40% used')
  expect(await text(/^Resets at /)).toMatch(/^Resets at \d{1,2}:\d\d [AP]M$/)
  await ui.unmount()

  await $.session.measure({
    context: { window: 200_000 },
    rateLimits: [
      { kind: 'five_hour', percentUsed: 61, resetsAt: inFiveHours },
      { kind: 'seven_day', percentUsed: 41, resetsAt: inThreeDays },
    ],
    changed: ['rateLimits'],
  })
  ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await text(/^61% used$/)).toBe('61% used')
  expect(await text(/^41% used$/)).toBe('41% used')
  await ui.unmount()
})

const ACCOUNT_BODY = (session: number, week: number) => JSON.stringify({
  five_hour: { utilization: session, resets_at: new Date(Date.now() + 2 * 3_600_000).toISOString() },
  seven_day: { utilization: week, resets_at: new Date(Date.now() + 3 * 86_400_000).toISOString() },
  seven_day_opus: null,
  extra_usage: { is_enabled: false },
})

test('the account usage body becomes the session and weekly windows', () => {
  const windows = parseAccountUsage(ACCOUNT_BODY(76, 42.04))
  expect(windows.map(w => [w.kind, w.percentUsed])).toEqual([['five_hour', 76], ['seven_day', 42]])
  expect(parseAccountUsage(JSON.stringify({ five_hour: null, seven_day: { utilization: null } }))).toEqual([])
})

test('the open panel shows the account usage, and it outranks the session figures', async ($, on) => {
  const fetched: Array<{ url: string; auth?: string }> = []
  let body = ACCOUNT_BODY(76, 42)
  on('command.register', () => ({ value: { command: 'team' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.panes', () => ({ value: [{ id: 'team-board', title: 'Team', isShown: true, isFocused: false, isPlaced: true }] }))
  on('ui.close', () => ({ value: undefined }))
  on('agent.list', () => ({ value: [] }))
  on('clock.every', () => ({ value: undefined }))
  on('process.run', () => ({
    value: { exitCode: 1, stdout: '', stderr: 'no repo', isStdoutTruncated: false, isStderrTruncated: false },
  }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 200_000 }, rateLimits: [] } }))
  on('session.authorize', () => ({ value: { handle: 'h1', kind: 'bearer' } }))
  on('http.fetch', (_, e) => {
    fetched.push({ url: e.url, auth: e.init?.auth })
    return { value: { status: 200, ok: true, headers: {}, text: body } }
  })
  on('session.measure', (_, e) => ({ changed: e.changed }))

  await $.session.start({ cwd: '/repo', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const text = async (pattern: RegExp) => (await ui.find({ type: 'Text', text: pattern }))?.text
  expect(fetched[0]).toEqual({ url: 'https://api.anthropic.com/api/oauth/usage', auth: 'h1' })
  expect(await text(/^76% used$/)).toBe('76% used')
  expect(await text(/^42% used$/)).toBe('42% used')

  // A fresh account reading is not overwritten by this session's own figures.
  body = ACCOUNT_BODY(77, 42)
  await $.session.measure({
    context: { window: 200_000 },
    rateLimits: [{ kind: 'five_hour', percentUsed: 50 }, { kind: 'seven_day', percentUsed: 30 }],
    changed: ['rateLimits'],
  })
  expect(await text(/^50% used$/)).toBeUndefined()
  await ui.unmount()
})

test('when the account usage fails, the session figures stand in and the panel says why', async ($, on) => {
  on('command.register', () => ({ value: { command: 'team' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.panes', () => ({ value: [{ id: 'team-board', title: 'Team', isShown: true, isFocused: false, isPlaced: true }] }))
  on('agent.list', () => ({ value: [] }))
  on('clock.every', () => ({ value: undefined }))
  on('process.run', () => ({
    value: { exitCode: 1, stdout: '', stderr: 'no repo', isStdoutTruncated: false, isStderrTruncated: false },
  }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 200_000 }, rateLimits: [] } }))
  on('session.authorize', () => ({ value: { handle: 'h1', kind: 'bearer' } }))
  on('http.fetch', () => ({ value: { status: 401, ok: false, headers: {}, text: '' } }))
  on('session.measure', (_, e) => ({ changed: e.changed }))

  await $.session.start({ cwd: '/repo', surface: 'terminal', isInteractive: true })
  await $.session.measure({
    context: { window: 200_000 },
    rateLimits: [{ kind: 'five_hour', percentUsed: 50 }],
    changed: ['rateLimits'],
  })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const text = async (pattern: RegExp) => (await ui.find({ type: 'Text', text: pattern }))?.text
  expect(await text(/^50% used$/)).toBe('50% used')
  expect(await text(/unavailable/)).toContain('HTTP 401')
  await ui.unmount()
})
