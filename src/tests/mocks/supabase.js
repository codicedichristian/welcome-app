import { vi } from 'vitest'

// In-memory "database" backing the mock Supabase client.
export const mockState = { data: {}, idCounter: 1000 }

function matchesFilters(row, filters) {
  return filters.every(([column, value]) => row[column] === value)
}

// Simulates Supabase's nested-relation count selects, e.g.
// `select('*, midweek_rsvps(count)')`.
function applySelectShape(rows, table, selectArg) {
  if (table === 'midweek_groups' && typeof selectArg === 'string' && selectArg.includes('midweek_rsvps')) {
    const rsvps = mockState.data.midweek_rsvps ?? []
    return rows.map((row) => ({
      ...row,
      midweek_rsvps: [{ count: rsvps.filter((rsvp) => rsvp.group_id === row.id).length }],
    }))
  }
  return rows
}

// Builds a chainable, thenable query builder that mimics the subset of the
// Supabase JS client used by src/lib/api.js, operating on mockState.data.
function createBuilder(table) {
  const filters = []
  let operation = 'select'
  let payload = null
  let selectArg = null
  let selectCalled = false
  let selectOptions = null
  let orderState = null
  let limitN = null
  let singleMode = null

  const builder = {
    select(arg, options) {
      selectCalled = true
      selectArg = arg
      selectOptions = options
      return builder
    },
    insert(value) {
      operation = 'insert'
      payload = value
      return builder
    },
    update(value) {
      operation = 'update'
      payload = value
      return builder
    },
    upsert(value) {
      operation = 'upsert'
      payload = value
      return builder
    },
    delete() {
      operation = 'delete'
      return builder
    },
    eq(column, value) {
      filters.push([column, value])
      return builder
    },
    order(column, opts = {}) {
      orderState = { column, ascending: opts.ascending ?? true }
      return builder
    },
    limit(n) {
      limitN = n
      return builder
    },
    single() {
      singleMode = 'single'
      return builder
    },
    maybeSingle() {
      singleMode = 'maybeSingle'
      return builder
    },
    then(resolve, reject) {
      return execute().then(resolve, reject)
    },
  }

  async function execute() {
    const rows = (mockState.data[table] ??= [])

    if (operation === 'insert' || operation === 'upsert') {
      const incoming = Array.isArray(payload) ? payload : [payload]
      const inserted = incoming.map((row) => ({
        id: `mock-${mockState.idCounter++}`,
        created_at: new Date().toISOString(),
        ...row,
      }))
      rows.push(...inserted)

      if (selectCalled) {
        return singleMode ? { data: inserted[0], error: null } : { data: inserted, error: null }
      }
      return { data: inserted, error: null }
    }

    if (operation === 'update') {
      const matched = rows.filter((row) => matchesFilters(row, filters))
      matched.forEach((row) => Object.assign(row, payload))

      if (selectCalled) {
        return singleMode ? { data: matched[0] ?? null, error: null } : { data: matched, error: null }
      }
      return { data: matched, error: null }
    }

    if (operation === 'delete') {
      mockState.data[table] = rows.filter((row) => !matchesFilters(row, filters))
      return { data: null, error: null }
    }

    // select
    let result = rows.filter((row) => matchesFilters(row, filters))
    result = applySelectShape(result, table, selectArg)

    if (orderState) {
      const { column, ascending } = orderState
      result = [...result].sort((a, b) => {
        if (a[column] === b[column]) return 0
        const cmp = a[column] > b[column] ? 1 : -1
        return ascending ? cmp : -cmp
      })
    }

    if (limitN != null) result = result.slice(0, limitN)

    if (selectOptions?.count === 'exact') {
      return { data: null, error: null, count: result.length }
    }

    if (singleMode === 'single') {
      return result.length ? { data: result[0], error: null } : { data: null, error: { message: 'No rows found' } }
    }

    if (singleMode === 'maybeSingle') {
      return { data: result[0] ?? null, error: null }
    }

    return { data: result, error: null }
  }

  return builder
}

export const mockSupabase = {
  from: vi.fn((table) => createBuilder(table)),
  auth: {
    getSession: vi.fn(async () => ({ data: { session: { user: { id: 'auth-user-1' } } }, error: null })),
    signOut: vi.fn(async () => ({ error: null })),
    getUser: vi.fn(async () => ({ data: { user: { id: 'auth-user-1' } }, error: null })),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  },
}

// Resets the in-memory tables and mock call history. `initialData` is deep
// cloned so each test starts from a clean, isolated snapshot.
export function resetMockSupabase(initialData = {}) {
  mockState.data = JSON.parse(JSON.stringify(initialData))
  mockState.idCounter = 1000

  mockSupabase.from.mockClear()

  mockSupabase.auth.getSession.mockReset()
  mockSupabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'auth-user-1' } } }, error: null })

  mockSupabase.auth.signOut.mockClear()
  mockSupabase.auth.getUser.mockClear()
}
