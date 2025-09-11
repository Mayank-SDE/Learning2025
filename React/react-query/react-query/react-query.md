# React Query: Beginner to Advanced (Single Source of Truth)

This guide is rebuilt from scratch for clarity, depth, and progressive learning. It starts with fundamentals and moves into advanced production patterns. Skim headings first, then deep dive.

---
## 1. Philosophy & Mental Model
React Query treats **server state** as a cached, async, shared, and invalidatable resource — different from local UI state. Instead of imperative "fetch, setState" cycles, you declare *what* data you need and React Query handles:
- Caching & de‑duplication
- Background refreshing
- Staleness vs freshness
- Mutation lifecycles (optimistic update, rollback, revalidation)
- Garbage collection

Think of it like a mini data CDN living in your app.

---
## 2. Core Glossary (Read Once – Refer Often)
| Term | Meaning | Defaults / Notes |
|------|---------|------------------|
| Query | Read (GET-ish) operation returning data | Identified by a *query key* |
| Query Key | Stable identity (string/array) for cache slot | `['todos', userId]` preferred over concatenated strings |
| Query Function | Async function returning data | Must throw on error |
| Mutation | Write (POST/PUT/PATCH/DELETE) side effect | No caching by default |
| Stale | Data can be shown but considered eligible for refetch | Default: immediately stale (`staleTime=0`) |
| Fresh | Within `staleTime` window; won’t auto-refetch on focus/mount | Set `staleTime` > 0 |
| gcTime | How long inactive cached data lives before GC | Default 5 min (300_000 ms) |
| Inactive Query | No mounted observers (no component currently using it) | May still stay cached until GC |
| Invalidation | Mark queries stale so they refetch on next trigger | `invalidateQueries` |
| Prefetch | Warm cache before user navigates | `prefetchQuery` |
| Optimistic Update | Temporarily assume mutation success | Roll back on error |

---
## 3. Install & Bootstrap
```bash
npm install @tanstack/react-query
npm install @tanstack/react-query-devtools --save-dev
```

```jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 3,
            refetchOnWindowFocus: true,
            staleTime: 0,
        }
    }
});

export function AppRoot() {
    return (
        <QueryClientProvider client={queryClient}>
            <App />
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}
```

---
## 4. Minimal First Query
```jsx
import { useQuery } from '@tanstack/react-query';

function TodoList() {
    const { data, error, isLoading } = useQuery({
        queryKey: ['todos'],
        queryFn: () => fetch('/api/todos').then(r => {
            if (!r.ok) throw new Error('Network');
            return r.json();
        })
    });

    if (isLoading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;
    return <ul>{data.map(t => <li key={t.id}>{t.title}</li>)}</ul>;
}
```

### What Just Happened?
- First mount triggers fetch.
- Response cached under `['todos']`.
- Re-mounting elsewhere reuses cache (instant paint) + auto refetch if stale.

---
## 5. Anatomy of `useQuery` Return Object (Most Useful Fields)
| Field | Type | Purpose |
|-------|------|---------|
| data | any | Resolved result (undefined until success) |
| error | Error | Thrown error from queryFn |
| isLoading | boolean | True initial load (no cached data yet) |
| isFetching | boolean | Any in-flight fetch (includes background refresh) |
| isError | boolean | Derived from error existence |
| refetch | fn | Manual refetch trigger |
| status | 'pending'|'error'|'success' | Finite state indicator |

> Use `isFetching` (not `isLoading`) to show subtle background spinners.

---
## 6. Stale vs Fresh vs Inactive (Mental Timeline)
```
Mount -> (no cache) fetch -> success -> data fresh (staleTime window)
             -> staleTime expires -> still usable but *stale*
UI unmounts -> query becomes *inactive* (kept until gcTime) -> GC removes
```
Set `staleTime` > 0 to reduce unnecessary refetches when user bounces between pages.

---
## 7. Customizing Defaults
```jsx
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60_000, // 1m fresh window
            gcTime: 10 * 60_000, // 10m keep in cache
            refetchOnReconnect: true,
            refetchOnWindowFocus: 'always', // or false / true
            retry: (count, err) => count < 2 && err?.status !== 404
        },
        mutations: {
            retry: 0
        }
    }
});
```

---
## 8. Parameterized / Dynamic Query Keys
```jsx
function UserProfile({ userId }) {
    const userQuery = useQuery({
        queryKey: ['user', userId],
        enabled: !!userId,
        queryFn: () => fetch(`/api/users/${userId}`).then(r => r.json())
    });
}
```
- Changing `userId` changes the key → new cache slot.
- Keep key parts serializable and stable order.

### Anti-Pattern
`queryKey: ['user', { id: userId, filters }]` (object changes identity if recreated). Use stable primitives or memoize object.

---
## 9. Dependent Queries
```jsx
const user = useQuery({ queryKey: ['user', id], queryFn: fetchUser });
const projects = useQuery({
    queryKey: ['projects', user.data?.orgId],
    enabled: !!user.data?.orgId,
    queryFn: () => fetchProjects(user.data.orgId)
});
```
`enabled` gates execution until dependency resolved.

---
## 10. Mutations – Core Pattern
```jsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

function NewTodoForm() {
    const qc = useQueryClient();
    const createTodo = useMutation({
        mutationFn: todo => fetch('/api/todos', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(todo)
        }).then(r => r.json()),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] })
    });

    return <button onClick={() => createTodo.mutate({ title: 'Learn RQ' })}>Add</button>;
}
```

### Mutation Lifecycle Hooks
| Hook | Purpose |
|------|---------|
| onMutate | Optimistic update setup / snapshot previous value |
| onSuccess | React to success (invalidate or update cache) |
| onError | Rollback optimistic change |
| onSettled | Always runs (success or error) |

---
## 11. Optimistic Update Example
```jsx
const mutation = useMutation({
    mutationFn: patchTodo,
    onMutate: async (partial) => {
        await qc.cancelQueries({ queryKey: ['todos'] });
        const prev = qc.getQueryData(['todos']);
        qc.setQueryData(['todos'], old => old.map(t => t.id === partial.id ? { ...t, ...partial } : t));
        return { prev };
    },
    onError: (_err, _vars, ctx) => ctx?.prev && qc.setQueryData(['todos'], ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['todos'] })
});
```

---
## 12. Manual Cache Updates (Fine-Grained)
```jsx
qc.setQueryData(['user', id], draft => ({ ...draft, displayName: 'Temp' }));
```
Use when you know the deterministic next state (e.g., toggling like / increment counter) to avoid an extra roundtrip.

---
## 13. Prefetching & Warming
```jsx
await qc.prefetchQuery({ queryKey: ['product', pid], queryFn: () => fetchProduct(pid) });
// Navigate – view renders instantly
```
Good for hover previews or anticipating navigation.

---
## 14. Background Refresh Triggers
- Window focus (configurable)
- Network reconnect
- Query invalidation
- Time-based (refetchInterval)

```jsx
useQuery({
    queryKey: ['stock', symbol],
    queryFn: fetchQuote,
    refetchInterval: 5_000, // polling
    refetchIntervalInBackground: true
});
```

---
## 15. Stale Strategy Cheat Sheet
| Goal | Setting |
|------|---------|
| Realtime-esque list | `staleTime: 0`, maybe `refetchInterval` |
| Rarely changing config | `staleTime: Infinity`, manual invalidation |
| Dashboard snapshots | `staleTime: 60_000` |
| Mobile / bandwidth save | Increase `staleTime`, disable focus refetch |

### 15.1 Polling Strategies (`refetchInterval`)

Use polling when you need recurring updates but a full push / websocket channel is overkill. Configure with `refetchInterval` (ms or function) and optionally `refetchIntervalInBackground`.

| Need | Suggested Approach |
|------|--------------------|
| Simple periodic refresh | Fixed `refetchInterval: 5000` |
| Poll only while item pending | Function returning ms or `false` when done |
| Backoff on failures | Dynamic function using `fetchFailureCount` |
| Avoid CPU/battery when hidden | Keep `refetchIntervalInBackground: false` (default) |
| Continue hidden (monitor dashboards) | Set `refetchIntervalInBackground: true` |

#### Basic Fixed Poll

```jsx
useQuery({
    queryKey: ['jobs'],
    queryFn: fetchJobs,
    staleTime: 0,           // force evaluation each poll
    refetchInterval: 5000,  // 5s
});
```

#### Conditional Poll (stop when status no longer pending)

```jsx
useQuery({
    queryKey: ['task', taskId],
    queryFn: fetchTask,
    refetchInterval: (query) => {
        const status = query.state.data?.status;
        return status === 'pending' ? 2000 : false; // stop polling
    }
});
```

#### Exponential Backoff (reduce pressure under failures)

```jsx
useQuery({
    queryKey: ['feed'],
    queryFn: fetchFeed,
    refetchInterval: (q) => {
        // base 2s, double up to 30s if consecutive failures
        const failures = q.state.fetchFailureCount;
        const next = 2000 * (2 ** failures);
        return Math.min(next, 30000);
    },
});
```

#### Polling + Freshness

If data is expensive but you want quick tab switching, combine:

```jsx
useQuery({
    queryKey: ['metrics'],
    queryFn: fetchMetrics,
    staleTime: 10_000,         // treat as fresh for 10s
    refetchInterval: 15_000,   // poll every 15s
});
```

This prevents extra fetch on focus within the fresh window while still polling periodically.

#### Pausing Polling Manually

Wrap enabled flag around a state variable:

```jsx
const [live, setLive] = useState(true);
const metrics = useQuery({
    queryKey: ['metrics'],
    queryFn: fetchMetrics,
    enabled: live,
    refetchInterval: live ? 5000 : false,
});
```

#### Performance & Battery Tips

- Prefer conditional polling that stops when terminal state reached.
- Avoid intervals < 1000ms; consider WebSockets/SSE for near real-time.
- Align interval with backend update cadence to prevent wasted requests.
- Use `select` to transform data and reduce re-renders during frequent polls.

#### Common Mistakes

| Mistake | Impact | Fix |
|---------|--------|-----|
| Polling with `staleTime: Infinity` | Data never refetches | Set finite staleTime or remove Infinity |
| High-frequency + heavy payload | Bandwidth spike | Lower interval / slim response fields |
| Forgetting to stop after success | Wasted requests | Return `false` in interval fn when complete |
| Background polling draining battery | Mobile UX issues | Keep `refetchIntervalInBackground: false` |

> Rule of thumb: If you need <2s latency updates continuously, evaluate real-time push instead of aggressive polling.

---
## 16. Error Handling Patterns
### Inline
```jsx
if (query.isError) return <ErrorBox msg={query.error.message} />;
```
### Global Boundary (wrap children)
Intercept error fields; do **not** throw inside queryFn unless you want error state.

### Custom Retry Logic
```jsx
retry: (attempt, error) => {
    if (error.status === 404) return false;
    return attempt < 3;
}
```

---
## 17. Parallel Queries
```jsx
const users = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
const tags  = useQuery({ queryKey: ['tags'], queryFn: fetchTags });
```
React Query schedules them concurrently; no need for `Promise.all` manually.

---
## 18. Combined Loading UX
```jsx
const q1 = useQuery({ queryKey: ['a'], queryFn: fa });
const q2 = useQuery({ queryKey: ['b'], queryFn: fb });
const busy = q1.isLoading || q2.isLoading;
```
Or use `useIsFetching()` for a global spinner.

---
## 19. Infinite Queries
```jsx
import { useInfiniteQuery } from '@tanstack/react-query';

const feed = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam = 0 }) => fetch(`/api/feed?cursor=${pageParam}`).then(r => r.json()),
    getNextPageParam: (lastPage) => lastPage.nextCursor \u00a0?? undefined
});
```
Render pages: `feed.data.pages.flatMap(...)`.

---
## 20. Canceling In-Flight Requests
```jsx
await qc.cancelQueries({ queryKey: ['todos'] });
```
Make your queryFn abort-aware for better UX (pass AbortSignal via `signal` param if using Query Function signature that accepts context in newer versions).

---
## 21. Window Focus Behavior
Disable if noisy:
```jsx
useQuery({ queryKey: ['stats'], queryFn: fetchStats, refetchOnWindowFocus: false });
```
Or `'always'` for real-time freshness.

---
## 22. Select Transformation
```jsx
const userNames = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    select: data => data.map(u => u.name).sort()
});
```
Avoids copying transformation logic in components.

---
## 23. Placeholders vs Initial Data
```jsx
useQuery({
    queryKey: ['repo', id],
    queryFn: fetchRepo,
    placeholderData: { stars: 0 }, // ephemeral, replaced on success
});

useQuery({
    queryKey: ['repo', id],
    queryFn: fetchRepo,
    initialData: () => qc.getQueryData(['repo', prevId]) // seeds and treated as real
});
```

---
## 24. Persisting Cache (Offline / Reload)
Use a persistence plugin (e.g., localStorage) for offline-friendly UX.

Pseudo:
```jsx
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

persistQueryClient({
    queryClient,
    persister: createSyncStoragePersister({ storage: window.localStorage }),
    maxAge: 24 * 60 * 60 * 1000
});
```

---
## 25. Mutation Error UX Pattern
```jsx
const save = useMutation({ mutationFn: saveForm, onError: setFormErrors });
```
Or surface toast notifications in `onError`.

---
## 26. Batched Invalidation
```jsx
qc.invalidateQueries({ predicate: q => q.queryKey[0] === 'products' });
```
Precision invalidation → performance win.

---
## 27. Avoiding Waterfalls
Fetch independent queries in parallel; use dependent gating only when necessary. For sequential transforms, consider a single query that returns compound payload.

---
## 28. Splitting Large Lists
If list rarely changes but items frequently mutate, query list separately from each item detail to minimize invalidations.

---
## 29. Optimizing Refetch Storms
- Consolidate invalidations (invalidate broad key once after batch mutation)
- Use manual cache updates instead of invalidation when change is deterministic

---
## 30. GraphQL Integration
```jsx
const fetchGql = ({ query, variables }) => fetch('/graphql', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
}).then(r => r.json()).then(({ data, errors }) => { if (errors) throw errors[0]; return data; });

useQuery({
    queryKey: ['gql', 'User', id],
    queryFn: () => fetchGql({ query: USER_Q, variables: { id } })
});
```

---
## 31. Access Tokens & Auth
Inject headers inside queryFn. Rotate tokens by invalidating authenticated queries on logout:
```jsx
qc.clear(); // wipe all on logout if desired
```

---
## 32. Testing Strategies
- Mock fetch/axios and assert `useQuery` states.
- Use React Testing Library and wrap with a real QueryClientProvider.

---
## 33. Performance Checklist
| Symptom | Fix |
|---------|-----|
| Frequent network spam | Increase `staleTime`; disable focus refetch |
| Slow re-render list | Use `select` to pre-shape data; memo list items |
| Cache memory growth | Lower `gcTime`; narrow invalidations |
| Flicker on tab switch | Add `staleTime`; use placeholderData |

---
## 34. Common Pitfalls
| Pitfall | Avoidance |
|---------|-----------|
| Non-stable query key objects | Use primitives or memoize |
| Calling mutation inside render | Wrap in event handler |
| Forgetting error UI | Check `isError` everywhere critical |
| Unneeded refetch after optimistic update | Use manual `setQueryData` only |
| Storing server data in Redux *and* cache | Prefer single source (React Query) |

---
## 35. Full CRUD Example (Condensed)
```jsx
function TodosModule() {
    const qc = useQueryClient();
    const list = useQuery({ queryKey: ['todos'], queryFn: fetchTodos, staleTime: 30_000 });

    const create = useMutation({
        mutationFn: addTodo,
        onSuccess: (newItem) => qc.setQueryData(['todos'], old => [...(old||[]), newItem])
    });

    const toggle = useMutation({
        mutationFn: ({ id, done }) => patchTodo(id, { done }),
        onMutate: async vars => {
            await qc.cancelQueries({ queryKey: ['todos'] });
            const prev = qc.getQueryData(['todos']);
            qc.setQueryData(['todos'], old => old.map(t => t.id === vars.id ? { ...t, done: vars.done } : t));
            return { prev };
        },
        onError: (_e,_v,ctx) => ctx?.prev && qc.setQueryData(['todos'], ctx.prev),
        onSettled: () => qc.invalidateQueries({ queryKey: ['todos'] })
    });

    if (list.isLoading) return 'Loading';
    return (
        <div>
            <button onClick={() => create.mutate({ title: 'New' })}>Add</button>
            <ul>
                {list.data.map(t => (
                    <li key={t.id}>
                        <label>
                            <input type="checkbox" checked={t.done} onChange={e => toggle.mutate({ id: t.id, done: e.target.checked })} />
                            {t.title}
                        </label>
                    </li>
                ))}
            </ul>
        </div>
    );
}
```

---
## 36. FAQ (Curated)
**Should I still use Redux?** Only for complex client-only state (wizards, feature flags). Use React Query for server state.

**How to clear all cache?** `queryClient.clear()`.

**How to refetch everything after login?** Invalidate queries with auth dependencies or clear cache.

**Pagination or infinite?** Use `useInfiniteQuery` when you need cursor-based growing list; plain queries with page param for simple numbered pages.

---
## 37. Expansion Roadmap (You Can Extend Here)
Suggested future sections to append if you want >2000 lines:
- WebSockets + manual cache hydration
- Offline mutation queueing
- Suspense mode integration
- SSR / hydration patterns (Next.js / Remix)
- Error boundary recipes
- Multi-window tab sync
- Analytics of cache hits/misses

Add below this line to keep structure clean.

---
## 38. Resources
- Official Docs: https://tanstack.com/query/latest
- GitHub: https://github.com/TanStack/query
- Examples Repo: https://github.com/TanStack/query/tree/main/examples
- Blog Patterns: Search “Kent C. Dodds React Query patterns”

---
_End of current compiled version. Continue appending more deep-dive sections below to extend length as needed._

---
## 39. SSR & Hydration (Next.js / Remix)
### Why
Avoid double-fetch (server + client) and show instant HTML.

### Flow
1. On server: create a QueryClient
2. Prefetch queries (`await queryClient.prefetchQuery(...)`)
3. Dehydrate with `dehydrate(queryClient)` and embed JSON in HTML
4. On client: rehydrate via `<Hydrate state={pageProps.dehydratedState}>`

### Next.js Example (App Router idea simplified)
```tsx
// server-component loader
import { dehydrate, QueryClient } from '@tanstack/react-query';

export async function getServerSideProps() {
    const qc = new QueryClient();
    await qc.prefetchQuery({ queryKey: ['todos'], queryFn: fetchTodos });
    return { props: { dehydratedState: dehydrate(qc) } };
}
```
```tsx
// _app.tsx
import { Hydrate } from '@tanstack/react-query';
<QueryClientProvider client={client}> <Hydrate state={pageProps.dehydratedState}> <Component {...pageProps}/> </Hydrate> </QueryClientProvider>
```
### Tips
- Keep server/query fn logic isomorphic (no window usage).
- Avoid secret exposure—query results become page source.

---
## 40. Suspense & Error Boundaries
Enable Suspense for smoother loading fallbacks.
```jsx
const queryClient = new QueryClient({ defaultOptions: { queries: { suspense: true, useErrorBoundary: true }}});
```
Then wrap UI:
```jsx
<ErrorBoundary fallback={<ErrorUI/>}>
    <Suspense fallback={<Spinner/>}>
        <TodoList />
    </Suspense>
</ErrorBoundary>
```
Pros: Centralized loading/error UI. Cons: Harder granular control. Use for high-level shells.

---
## 41. Offline & Network Resilience
| Concern | Strategy |
|---------|----------|
| User offline | Use persistence + show cached data + disable mutations |
| Mutation during offline | Queue & replay (custom) |
| Slow network | Increase `staleTime`; show background spinner only |

Detect offline:
```jsx
window.addEventListener('online', () => queryClient.invalidateQueries());
```
Disable background refetch offline by default (browser events already integrated).

---
## 42. Realtime (WebSockets / SSE)
React Query not a realtime transport; integrate manually:
```jsx
useEffect(() => {
    const socket = openSocket();
    socket.on('todoUpdated', payload => {
        qc.setQueryData(['todos'], old => old?.map(t => t.id===payload.id? payload: t));
    });
    return () => socket.close();
}, []);
```
Throttle high-frequency events (e.g., requestAnimationFrame batching).

---
## 43. Mutation Queue (Offline-First Pattern)
Pseudo workflow:
1. Intercept `mutationFn` when `!navigator.onLine`
2. Push payload into IndexedDB queue
3. On `online` event: drain queue calling original mutationFn, performing optimistic reconciliation

Key: Ensure idempotency (server can safely apply duplicates) or track client-generated UUIDs for dedupe.

---
## 44. Multi-Tab Synchronization
Use `BroadcastChannel` to broadcast invalidations.
```js
const channel = new BroadcastChannel('rq-sync');
channel.onmessage = e => { if (e.data.type==='invalidate') qc.invalidateQueries({ queryKey: e.data.key }); };
function crossTabInvalidate(key){ channel.postMessage({ type:'invalidate', key }); }
```
Call `crossTabInvalidate(['todos'])` post mutation.

---
## 45. Advanced Query Key Architecture
Structure suggestion:
```ts
const keys = {
    all: ['app'] as const,
    todos: () => [...keys.all, 'todos'] as const,
    todo: (id: string) => [...keys.todos(), id] as const,
    search: (term: string) => [...keys.todos(), 'search', term] as const,
};
```
Benefits: Central place, autocompletion, avoids typos, safe predicate invalidations.

---
## 46. Data Normalization & Partial Updates
React Query stores blobs per key. For *heavily shared sub-entities* consider manual slice queries or layer a tiny entity cache:
```js
qc.setQueryData(['user', id], mergeUser);
// Optionally surface selectors around query data for reuse.
```
Avoid over-normalizing unless performance issues manifest.

---
## 47. Suggested Folder Structure (Scale)
```
src/
    api/ (HTTP clients, axios instances)
    features/
        todos/
            queries.js (query key defs & hooks)
            mutations.js
            components/
            types.ts
    lib/react-query/ (queryClient, hydration, listeners)
```
Keep query key factory co-located with feature.

---
## 48. Security & Auth Patterns
Rotate tokens:
1. Store refresh logic outside query fn.
2. On 401: attempt silent refresh then retry (custom fetch wrapper).
3. On logout: `queryClient.clear()` to purge private data.

Prevent leaking sensitive fields into dehydrated state (omit or request minimal server data for SSR pages).

---
## 49. Performance Profiling
Devtools tabs:
- Query Explorer: inspect statuses
- Actions: trigger GC / invalidate

Custom metrics: wrap fetch with timing, aggregate hits vs misses:
```js
const metrics = { hits:0, misses:0 };
function instrumentedQuery(key, fn){
    const cached = qc.getQueryData(key);
    cached ? metrics.hits++ : metrics.misses++;
    return fn();
}
```
Alert if miss ratio > threshold to tune staleTime.

---
## 50. Testing Recipes
Setup:
```tsx
function renderWithRQ(ui){
    const qc = new QueryClient({ defaultOptions:{ queries:{ retry:false }}});
    return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}
```
Use MSW to mock network for realism; assert final UI not internal states (avoid brittle tests on isFetching).

---
## 51. Migration Strategy (Manual Fetch -> React Query)
Order:
1. Introduce QueryClientProvider
2. Convert isolated, read-only screens
3. Replace global stores holding server data
4. Add mutations with optimistic paths
5. Fine-tune performance (staleTime) last

Track removed custom hooks to ensure no dead code remains.

---
## 52. Pattern Catalog
| Problem | Pattern | Hook Elements |
|---------|---------|---------------|
| Slow return when revisiting list | Longer `staleTime` | queries.staleTime |
| Flicker due to refetch | `placeholderData` | placeholderData |
| Edit latency | Optimistic patch | onMutate/onError |
| Pre-navigation fetch | Prefetch + warm | prefetchQuery |
| Large cold start | SSR hydration | dehydrate/hydrate |

---
## 53. Anti-Patterns (Deep Dive)
| Anti-Pattern | Why Bad | Fix |
|--------------|---------|-----|
| Invalidate broad root constantly | Causes network storm | Targeted keys / setQueryData |
| Sharing a singleton QueryClient test-wide | Cross-test leakage | Create per test instance |
| Returning non-serializable from query fn | Hard to debug caching | Serialize or map to POJO |
| Storing same server data in Redux | Duplication & drift | Remove duplicate store |
| Massive query keys with objects recreated each render | Causes extra fetch | Use factories / memo |

---
## 54. Configuration Reference Snapshot
| Option | Scope | Default | Common Tweaks |
|--------|-------|---------|---------------|
| staleTime | Query | 0 | 30s dashboards / Infinity constants |
| gcTime | Query | 5m | Lower mobile memory |
| retry | Query/Mutation | 3 (queries) | Fn conditional |
| refetchOnWindowFocus | Query | true | false for stable data |
| refetchInterval | Query | undefined | polling dashboards |
| suspense | Query | false | true for shell |
| useErrorBoundary | Query/Mutation | false | true with Suspense |

---
## 55. Decision Tree: Choosing staleTime
1. Does data change more than once per minute? -> staleTime small (0-5s)
2. Is user cost of stale view high (financial, trading)? -> smaller
3. Is network constrained? -> larger staleTime + manual invalidation
4. Need instant return when toggling tabs? -> at least a few seconds

---
## 56. ASCII Architecture Diagram
```
[UI Components]
         |  (declare data needs)
         v
[React Query Hooks] --(queryKey)--> [Cache Store]
         |                                 |
         | miss -> fetch                   | hit -> serve
         v                                 v
[Query Function]  <---- invalidation ----  (Fresh/Stale Logic)
         |
 [HTTP / GraphQL / WS]
```

---
## 57. Cheat Sheets
### When to use setQueryData vs invalidate
| Situation | Use |
|-----------|-----|
| Deterministic local result (toggle flag) | setQueryData |
| Server may compute extra fields | invalidate |
| Bulk small adjustments | batched setQueryData |
| After external event (websocket) | setQueryData |

### Mutation Lifecycle Pseudocode
```
onMutate -> snapshot -> optimistic set -> try server
    success -> maybe refine or invalidate
    error -> rollback snapshot -> surface toast
settled -> cleanup side effects
```

---
## 58. Troubleshooting Matrix
| Symptom | Likely Cause | Remedy |
|---------|--------------|--------|
| Fetch runs twice rapidly dev | React StrictMode double-invoke | Ignore dev; production fine |
| Cache not updating | Wrong key mismatch | Centralize key factory |
| Optimistic flicker revert | Missing rollback or mismatch | Ensure snapshot & id stable |
| Infinite refetch loop | Query fn referencing changing closure | Stabilize dependencies |
| Memory climb | gcTime too large | Reduce gcTime / clear rarely used |

---
## 59. Extended Glossary Adds
| Term | Definition |
|------|------------|
| Dehydrate/Hydrate | Serialize & revive cache across environments |
| Observer | Internal subscriber representing a mounted hook instance |
| Structural Sharing | Reusing unchanged object references to minimize renders |
| Predicate Invalidation | Invalidate by custom function across all queries |

---
## 60. Customization Next Steps
Choose track:
1. Production Hardening: add error boundaries, logging plugin.
2. Offline Mode: implement mutation queue & cache persistence.
3. Realtime: integrate websocket diff patches.
4. Performance: instrument hit/miss + adjust staleTime heuristics.

Document chosen strategy inside a `/docs/react-query-strategy.md` file for team alignment.


## Why React Query?

Traditional React apps often use local state (useState, useReducer) or global state managers (Redux, MobX) for all data. But server state—data that lives on a remote server—has unique challenges:

- It can change outside your app (other users, server processes)
- It needs to be fetched, updated, and synchronized
- It requires handling loading, error, and success states
- It must be cached and invalidated efficiently

React Query solves these problems with a declarative API for data fetching, caching, and synchronization. It makes your code cleaner, your app faster, and your user experience smoother.

---

## Installation & Setup

Install React Query using npm or yarn:

```bash
npm install @tanstack/react-query
# or
yarn add @tanstack/react-query
```

Set up the QueryClient and QueryClientProvider at the root of your app:

```jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            {/* Your app components go here */}
        </QueryClientProvider>
    );
}
```

---

## Core Concepts

### What is Server State?

Server state is data that lives outside your application, typically on a remote server or database. Unlike local state, server state can be changed by other users, processes, or systems. Keeping server state in sync with your UI is a major challenge in modern web development.

**Examples:**
- User profiles from a database
- Product lists from an e-commerce API
- Comments on a blog post
- Notifications from a messaging service
- Analytics data from a backend

### Query
A query is a request for data from a server. React Query manages queries, caches their results, and keeps your UI in sync.

### Mutation
A mutation is a request to change data on the server (create, update, delete). React Query helps you manage mutations and update your UI optimistically.

### Query Key
A unique identifier for each query. Used for caching and refetching.

### Query Function
The function that fetches your data (using fetch, axios, etc.).

### Query Client
The central manager for all queries and mutations in your app.

---

## Basic Usage

### Fetching Data with useQuery

The `useQuery` hook is the heart of React Query. It lets you fetch data, cache it, and keep your UI in sync with the server.

**Example:**
```jsx
import { useQuery } from '@tanstack/react-query';

function Todos() {
    const { data, error, isLoading } = useQuery({
        queryKey: ['todos'],
        queryFn: () => fetch('/api/todos').then(res => res.json())
    });

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <ul>
            {data.map(todo => (
                <li key={todo.id}>{todo.title}</li>
            ))}
        </ul>
    );
}
```

### Creating, Updating, and Deleting Data with useMutation

The `useMutation` hook is used for POST, PUT, PATCH, and DELETE requests. It helps you update server data and manage UI state during mutations.

**Example:**
```jsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

function AddTodo() {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: newTodo => fetch('/api/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTodo)
        }).then(res => res.json()),
        onSuccess: () => {
            queryClient.invalidateQueries(['todos']);
        }
    });

    const handleAdd = () => {
        mutation.mutate({ title: 'New Todo' });
    };

    return (
        <button onClick={handleAdd} disabled={mutation.isLoading}>
            Add Todo
        </button>
    );
}
```

---

**Example:**
```jsx
useMutation({
    mutationFn: updateTodo,
    onMutate: async (newTodo) => {
        await queryClient.cancelQueries(['todos']);
        const previousTodos = queryClient.getQueryData(['todos']);
        queryClient.setQueryData(['todos'], old => [...old, newTodo]);
        return { previousTodos };
    },
    onError: (err, newTodo, context) => {
        queryClient.setQueryData(['todos'], context.previousTodos);
    },
    onSettled: () => {
        queryClient.invalidateQueries(['todos']);
    }
});
```

---

## Devtools

React Query Devtools is a browser extension or component that helps you visualize queries, mutations, cache, and more.

### Installation
```bash
npm install @tanstack/react-query-devtools
```

### Usage
```jsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            {/* ... */}
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}
```

---

## Error Handling

React Query provides built-in error handling for queries and mutations. You can access error states and display messages to users.

**Example:**
```jsx
const { data, error, isError } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos
});

if (isError) {
    return <div>Error: {error.message}</div>;
}
```

---

## Pagination & Infinite Queries

Use `useInfiniteQuery` for paginated or infinite scrolling data.

**Example:**
```jsx
const fetchPage = ({ pageParam = 1 }) => fetch(`/api/items?page=${pageParam}`).then(res => res.json());

const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
} = useInfiniteQuery({
    queryKey: ['items'],
    queryFn: fetchPage,
    getNextPageParam: (lastPage, pages) => lastPage.nextPage
});
```

---

## Dependent Queries

Sometimes you need to fetch data that depends on another query. Use the `enabled` option to control when a query should run.

**Example:**
```jsx
const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId)
});

const { data: posts } = useQuery({
    queryKey: ['posts', user?.id],
    queryFn: () => fetchPosts(user.id),
    enabled: !!user?.id
});
```

---

## Prefetching & Background Sync

Prefetch data before it's needed, or keep data fresh in the background.

**Example:**
```jsx
queryClient.prefetchQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos
});
```

---

## Query Invalidation

Invalidate queries to force refetching when data changes.

**Example:**
```jsx
queryClient.invalidateQueries(['todos']);
```

---

## Optimistic Updates

Optimistically update the UI before the server confirms the change. Roll back if the mutation fails.

See the Mutations section for a full example.

---

## React Query Client

The Query Client is the central manager for all queries and mutations. Use it to prefetch, invalidate, and manipulate cache.

**Example:**
```jsx
import { useQueryClient } from '@tanstack/react-query';
const queryClient = useQueryClient();
```

---

## Custom Query Functions

You can write custom query functions to fetch data from any source (REST, GraphQL, etc.).

**Example:**
```jsx
const fetchUser = async (userId) => {
    const res = await fetch(`/api/user/${userId}`);
    if (!res.ok) throw new Error('User not found');
    return res.json();
};

useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId)
});
```

---

## Best Practices

- Use unique and descriptive query keys
- Set appropriate `staleTime` and `gcTime` for your use case
- Use mutations for data-changing operations
- Handle errors and loading states in your UI
- Use Devtools for debugging
- Avoid unnecessary refetches
- Prefetch data for smoother navigation

---

## Troubleshooting

### Common Issues
- Queries not refetching: Check your query keys and `enabled` option
- Data not updating: Use `invalidateQueries` after mutations
- Network errors: Handle errors in your UI
- Stale data: Adjust `staleTime` and `gcTime`

### Debugging Tips
- Use React Query Devtools
- Log query and mutation states
- Check network requests in browser devtools

---

## Real-World Examples

### Example 1: Fetching User Profile
```jsx
const { data, isLoading, error } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetch(`/api/profile/${userId}`).then(res => res.json())
});
```

### Example 2: Creating a New Post
```jsx
const mutation = useMutation({
    mutationFn: newPost => fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost)
    }).then(res => res.json()),
    onSuccess: () => {
        queryClient.invalidateQueries(['posts']);
    }
});
```

### Example 3: Infinite Scroll
```jsx
const fetchPage = ({ pageParam = 1 }) => fetch(`/api/items?page=${pageParam}`).then(res => res.json());
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['items'],
    queryFn: fetchPage,
    getNextPageParam: (lastPage, pages) => lastPage.nextPage
});
```

---

## FAQ

**Q: Can I use React Query with GraphQL?**
A: Yes! Just write your query function to use your GraphQL client.

**Q: Does React Query replace Redux?**
A: React Query is for server state, Redux is for client state. They can be used together.

**Q: How do I cancel a query?**
A: Use `queryClient.cancelQueries(queryKey)`.

**Q: How do I refetch data manually?**
A: Use the `refetch` function returned by `useQuery`.

---

## Resources

- [React Query Docs](https://tanstack.com/query/latest)
- [React Query GitHub](https://github.com/TanStack/query)
- [React Query Devtools](https://tanstack.com/query/latest/docs/devtools)
- [React Query Examples](https://github.com/TanStack/query/tree/main/examples)


# React Query: The Complete Guide

---

## Table of Contents

1. [Introduction](#introduction)
2. [What is Server State?](#what-is-server-state)
3. [Why Use React Query?](#why-use-react-query)
4. [Installation & Setup](#installation--setup)
5. [Core Concepts](#core-concepts)
6. [Basic Hooks](#basic-hooks)
7. [Advanced Hooks](#advanced-hooks)
8. [Query Keys & Query Functions](#query-keys--query-functions)
9. [Caching & Garbage Collection](#caching--garbage-collection)
10. [Stale Time & Refetching](#stale-time--refetching)
11. [Mutations](#mutations)
12. [Devtools](#devtools)
13. [Error Handling](#error-handling)
14. [Pagination & Infinite Queries](#pagination--infinite-queries)
15. [Dependent Queries](#dependent-queries)
16. [Prefetching & Background Sync](#prefetching--background-sync)
17. [Query Invalidation](#query-invalidation)
18. [Optimistic Updates](#optimistic-updates)
19. [React Query Client](#react-query-client)
20. [Custom Query Functions](#custom-query-functions)
21. [Best Practices](#best-practices)
22. [Troubleshooting](#troubleshooting)
23. [Real-World Examples](#real-world-examples)
24. [FAQ](#faq)
25. [Resources](#resources)

---

## Introduction

React Query is a robust data-fetching and state management library for React. It abstracts away the complexity of managing server state, caching, background updates, and synchronization between client and server. React Query is not just a tool for fetching data—it is a complete solution for handling asynchronous data in React applications.

### Why is Data Fetching Hard in React?

Traditional React apps often rely on local state (useState, useReducer) or global state (Redux, MobX) to manage data. However, server state is fundamentally different:

- It can change outside the app (other users, server processes)
- It needs to be fetched, updated, and synchronized
- It requires handling loading, error, and success states
- It must be cached and invalidated efficiently

React Query solves these problems by providing a declarative API for data fetching, caching, and synchronization.

---

## What is Server State?

Server state is any data that lives outside your application, typically on a remote server or database. Unlike local state, server state can be changed by other users, processes, or systems. Keeping server state in sync with your UI is a major challenge in modern web development.

### Characteristics of Server State

- **Remote:** Fetched via HTTP requests (REST, GraphQL, etc.)
- **Shared:** Can be changed by other clients or processes
- **Asynchronous:** Requires handling loading and error states
- **Ephemeral:** May need to be cached, refetched, or invalidated

### Examples of Server State

- User profiles from a database
- Product lists from an e-commerce API
- Comments on a blog post
- Notifications from a messaging service
- Analytics data from a backend

---

## Why Use React Query?

React Query provides a set of tools and patterns for managing server state in React. It is designed to be flexible, efficient, and easy to use.

### Key Benefits

- **Declarative Data Fetching:** Write less code to fetch, cache, and update data
- **Automatic Caching:** Data is cached and reused, reducing network requests
- **Background Updates:** Data can be refetched in the background to stay fresh
- **Instant UI Updates:** Optimistic updates and cache manipulation for fast user feedback
- **Error & Loading States:** Built-in handling for loading, error, and success
- **Polling & Refetching:** Easily set up polling or refetch on window focus/network reconnect
- **Devtools:** Visualize queries, mutations, cache, and more

### When Should You Use React Query?

- Apps that rely heavily on remote data
- Apps with complex data synchronization needs
- Apps that need to optimize network usage and performance
- Apps that require offline support or background sync

### When NOT to Use React Query

- For simple local state (UI toggles, form inputs)
- When you do not need caching or background updates

---

## Installation & Setup

Install React Query using npm or yarn:

```bash
npm install @tanstack/react-query
# or
yarn add @tanstack/react-query
```

Set up the QueryClient and QueryClientProvider at the root of your app:

```jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            {/* Your app components */}
        </QueryClientProvider>
    );
}
```

---

## Core Concepts

### Query
A query is a request for data from a server. React Query manages queries, caches their results, and keeps your UI in sync.

### Mutation
A mutation is a request to change data on the server (create, update, delete). React Query helps you manage mutations and update your UI optimistically.

### Query Key
A unique identifier for each query. Used for caching and refetching.

### Query Function
The function that fetches your data (using fetch, axios, etc.).

### Query Client
The central manager for all queries and mutations in your app.

---

## Basic Hooks

### useQuery
Fetches and caches data. Handles loading, error, and success states.

### useMutation
Creates, updates, or deletes data. Handles loading, error, and success states.

### useQueryClient
Access the query client for advanced cache management.

---

## Advanced Hooks

### useInfiniteQuery
For paginated or infinite scrolling data.

### useIsFetching
Show global loading indicators.

### useIsMutating
Show global mutation indicators.

---

## useQuery()

`useQuery` is a React Query hook for fetching and reading data (usually with GET requests). It automatically caches results and keeps your UI in sync with the server.

**Example:**

```jsx
import { useQuery } from '@tanstack/react-query';

function Todos() {
    const { data, error, isLoading } = useQuery({
        queryKey: ['todos'],
        queryFn: () => fetch('/api/todos').then(res => res.json())
    });

    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <ul>
            {data.map(todo => (
                <li key={todo.id}>{todo.title}</li>
            ))}
        </ul>
    );
}
```

---

## useMutation()

`useMutation` is used for creating, updating, or deleting data (POST, PUT, DELETE requests). It also lets you trigger manual side effects, like updating the cache or showing notifications.

**Example:**

```jsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

function AddTodo() {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: newTodo => fetch('/api/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTodo)
        }),
        onSuccess: () => {
            queryClient.invalidateQueries(['todos']);
        }
    });

    const handleAdd = () => {
        mutation.mutate({ title: 'New Todo' });
    };

    return (
        <button onClick={handleAdd} disabled={mutation.isLoading}>
            Add Todo
        </button>
    );
}
```

---

## Query Keys

A query key is a unique identifier for each query. It helps React Query know which data to cache and refetch. Use an array for complex keys, e.g. `['todos', userId]`.

---

## Query Functions

A query function is the function that fetches your data. It can use `fetch`, `axios`, or any other method to get data from your API.

---

## GC Time (Garbage Collection Time)

When you fetch data using React Query, it is cached locally. The cache is automatically cleaned up (garbage collected) after a certain period if the query is inactive.

- **Default:** Inactive queries are garbage collected after 5 minutes (300,000 ms).
- **Custom:** You can change this by setting the `gcTime` property in `useQuery`.

**Example:**

```jsx
const { data } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    gcTime: 1000 // 1 second
});
```

---

## Stale Time

### What is `staleTime`?

In React Query, `staleTime` is a setting that tells React Query how long your fetched data should be considered "fresh" before it becomes "stale" and needs to be refetched from the server.

### Why is `staleTime` important?

When you fetch data from an API, React Query stores (caches) that data. By default, React Query thinks the data is stale as soon as it is fetched, so it may refetch it often. This can lead to unnecessary network requests and slower performance.

### How does `staleTime` work?

1. **Fresh Data:**
     - When you first fetch or update data, it is considered fresh. React Query will use this cached data and will not refetch it, even if you revisit the page or refocus the browser window.

2. **Stale Data:**
     - After the time you set in `staleTime` (measured in milliseconds) passes, React Query marks the data as stale. The next time you interact with the query (like refocusing the window or remounting the component), React Query will refetch the data to make sure it's up-to-date.

3. **Default Value:**
     - If you do not set `staleTime`, the default is `0`. This means data becomes stale immediately after being fetched, so React Query will refetch it very frequently.

### When should you change `staleTime`?

- If your data does not change often, you can set a higher `staleTime` (for example, 60,000 ms for 1 minute). This means React Query will use the cached data for 1 minute before considering it stale and refetching it. This reduces network requests and makes your app faster.
- If you need real-time updates, keep `staleTime` low or at the default.

### Example

```jsx
const { data } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    staleTime: 60000 // Data is fresh for 1 minute
});
```

### Summary

- `staleTime` helps you control how often React Query refetches data.
- Setting a higher `staleTime` can improve performance and reduce unnecessary API calls.
- For most apps, a reasonable `staleTime` makes the user experience smoother and faster.

---

## Other Useful Hooks

- **useQueryClient:** Access the query client for advanced cache management.
- **useInfiniteQuery:** For paginated or infinite scrolling data.
- **useIsFetching:** Show global loading indicators.

---

## Best Practices

- Use clear and unique query keys.
- Set appropriate `staleTime` and `gcTime` for your use case.
- Use mutations for data-changing operations.
- Handle errors and loading states in your UI.

---

## Resources

- [React Query Docs](https://tanstack.com/query/latest)
- [React Query GitHub](https://github.com/TanStack/query)
- Setting a higher `staleTime` can improve performance and reduce unnecessary API calls.
- For most apps, a reasonable `staleTime` makes the user experience smoother and faster.

```jsx
    const { data } = useQuery({
        queryKey: ['todos'],
        queryFn: fetchTodos,
        staleTime: 60000 // 1 minute
    });
```
