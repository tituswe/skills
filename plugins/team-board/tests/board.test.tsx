import { expect, test } from 'claude-code/testing'
import type { AgentInfo } from 'claude-code'

import { activityLine, endsInQuestion, groupOf, leadNeed, nowLine, teammateNeed } from '../hooks/register'
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
  const open = { number: 392, title: 't', branch: 'b', state: 'OPEN', isDraft: false, ci: 'pass', gate: 'pass' } as const
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
