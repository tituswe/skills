/**
 * What one agent loop is doing now. `thinking`, `writing` and `preparing` come
 * from the model's stream; `tool` while a tool call runs, `done` once it
 * returned; `approval` while a call waits on the person; `idle` after a turn.
 */
export type ActivityKind = 'thinking' | 'writing' | 'preparing' | 'tool' | 'done' | 'approval' | 'idle'

export type Activity = {
  kind: ActivityKind
  text: string
  /** When this activity began, in ms since the epoch. */
  since: number
  /** The tool call it belongs to, for `tool` and `done`. */
  toolUseId?: string
  /** A tool call that waits on the person (`AskUserQuestion`). */
  isForYou?: true
  /** An `idle` whose turn ended on a question to the person. */
  isQuestion?: true
}

/** One agent of the session, as `$.agent.list()` gave it at the last poll. */
export type AgentRow = {
  id: string
  name: string
  teammateId?: string
  type: string
  status: string
  description: string
  parentId?: string
}

export type CheckState = 'pass' | 'fail' | 'pending' | 'none'

/** One PR of the repo, from `gh pr list`. */
export type PrRow = {
  number: number
  title: string
  branch: string
  state: 'OPEN' | 'MERGED' | 'CLOSED'
  isDraft: boolean
  /** GitHub can't merge it as it stands: a conflict with its base. Always false for a closed PR. */
  hasConflicts: boolean
  /** Every check and status on the head commit but the gate. */
  ci: CheckState
  /** The `pr-review` commit status on the head commit. */
  gate: CheckState
  gateNote?: string
}

/** Where PRs come from and how the last fetch went. */
export type Board = {
  repoDir?: string
  fetchedAt?: number
  error?: string
  isAutoOpened?: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'team-board': {
      activity: Shaped<Record<string, Activity>>
      agents: Shaped<AgentRow[]>
      prs: Shaped<PrRow[]>
      board: Shaped<Board>
      /** Bumped every few seconds while a tool runs, so elapsed times redraw. */
      tick: Shaped<number>
    }
  }
}
