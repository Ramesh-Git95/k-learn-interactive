import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FloatingProgress from '../../../components/FloatingProgress'
import type { Section } from '../../../types'

// Rewritten. The previous version tested a component that no longer exists: it
// passed progress, getSectionTotalItems and getSectionCompletedItems, all of
// which were removed when XP/streak became account-synced and SRS moved into a
// context. The component takes activeSection and reads the rest from
// useXPStreak and useSRSContext, so every test died in useSRSContext before
// reaching an assertion — 8 red for months, which is worse than none, because
// a real failure would have hidden among them.
//
// The two hooks are mocked rather than provided for real: useSRS pulls in
// useAuth, which fetches on mount. What is worth testing here is this
// component's own rules — what it shows, and when it shows nothing.

const xp = {
  level: 4,
  xpInLevel: 120,
  xpForLevel: 300,
  totalXP: 2450,
  currentStreak: 7,
  longestStreak: 12,
  studiedToday: true,
  streakAtRisk: false,
  weekHeatmap: Array.from({ length: 7 }, (_, i) => ({
    dateStr: `2026-09-0${i + 1}`,
    label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'][i],
    studied: i > 3,
    isToday: i === 6,
  })),
}

let xpData = { ...xp }
let srsDue = 0

vi.mock('../../../hooks/useXPStreak', () => ({
  useXPStreak: () => xpData,
}))

vi.mock('../../../contexts/SRSContext', () => ({
  useSRSContext: () => ({ stats: { totalDue: srsDue } }),
}))

const renderAt = (section: Section = 'vocabulary') =>
  render(<FloatingProgress activeSection={section} />)

beforeEach(() => {
  xpData = { ...xp }
  srsDue = 0
})

describe('FloatingProgress', () => {
  it('shows the level on the button', () => {
    renderAt()
    const button = screen.getByRole('button', { name: /learning progress/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('LVL')
    expect(button).toHaveTextContent('4')
  })

  it('renders nothing on the dashboard, which shows progress already', () => {
    const { container } = renderAt('dashboard')
    expect(container).toBeEmptyDOMElement()
  })

  it('stays collapsed until it is asked to open', () => {
    renderAt()
    expect(screen.queryByText('Your Progress')).not.toBeInTheDocument()
  })

  it('expands to show XP, streak and the week', async () => {
    const user = userEvent.setup()
    renderAt()
    await user.click(screen.getByRole('button', { name: /learning progress/i }))

    expect(screen.getByText('Your Progress')).toBeInTheDocument()
    expect(screen.getByText(/Level 4 · Intermediate/)).toBeInTheDocument()
    expect(screen.getByText('2,450 XP total')).toBeInTheDocument()
    expect(screen.getByText('120 / 300 XP')).toBeInTheDocument()
    expect(screen.getByText('180 to level 5')).toBeInTheDocument()
    expect(screen.getByText('7 day streak')).toBeInTheDocument()
    expect(screen.getByText('Best: 12 days')).toBeInTheDocument()
    expect(screen.getByText('Last 7 days')).toBeInTheDocument()
  })

  it('closes again', async () => {
    const user = userEvent.setup()
    renderAt()
    await user.click(screen.getByRole('button', { name: /learning progress/i }))
    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByText('Your Progress')).not.toBeInTheDocument()
  })
})

describe('the badge in the corner', () => {
  // Both badges occupy the same spot, and the streak one is deliberately
  // suppressed while cards are due. It is an easy rule to break by editing
  // either branch alone, and nothing on screen would explain the overlap.
  it('shows the due count when cards are waiting', () => {
    srsDue = 12
    renderAt()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('caps a large due count rather than overflowing the badge', () => {
    srsDue = 250
    renderAt()
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('shows the streak only when nothing is due', () => {
    srsDue = 0
    const { rerender } = renderAt()
    expect(screen.getByText('🔥')).toBeInTheDocument()

    srsDue = 5
    rerender(<FloatingProgress activeSection={'vocabulary' as Section} />)
    expect(screen.queryByText('🔥')).not.toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows no streak badge on a zero streak', () => {
    xpData = { ...xp, currentStreak: 0 }
    renderAt()
    expect(screen.queryByText('🔥')).not.toBeInTheDocument()
  })
})

describe('what the streak row says about today', () => {
  it('confirms a day already studied', async () => {
    const user = userEvent.setup()
    renderAt()
    await user.click(screen.getByRole('button', { name: /learning progress/i }))
    expect(screen.getByText(/Studied today/)).toBeInTheDocument()
  })

  it('warns when a streak is about to be lost', async () => {
    xpData = { ...xp, studiedToday: false, streakAtRisk: true }
    const user = userEvent.setup()
    renderAt()
    await user.click(screen.getByRole('button', { name: /learning progress/i }))
    expect(screen.getByText(/Study today to keep your streak/)).toBeInTheDocument()
    expect(screen.queryByText(/Studied today/)).not.toBeInTheDocument()
  })

  it('says neither when the streak is already gone', async () => {
    xpData = { ...xp, studiedToday: false, streakAtRisk: true, currentStreak: 0 }
    const user = userEvent.setup()
    renderAt()
    await user.click(screen.getByRole('button', { name: /learning progress/i }))
    expect(screen.queryByText(/Study today to keep your streak/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Studied today/)).not.toBeInTheDocument()
  })
})
