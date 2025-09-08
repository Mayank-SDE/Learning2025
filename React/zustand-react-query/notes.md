---
# Comprehensive Guide: Using Zustand with React Query in React

## Table of Contents
1. Introduction
2. Core Concepts
3. When to Use Zustand vs React Query
4. Integrating Zustand and React Query
5. Best Practices
6. Advanced Patterns
7. Example Projects
8. Common Pitfalls
9. Performance Tips
10. Testing Strategies
11. Useful Resources

---

## 1. Introduction

Zustand and React Query are two powerful libraries for state management in React applications. While Zustand excels at managing client-side state, React Query is designed for efficient server-state management, caching, and synchronization.

### What is Zustand?

- A small, fast, and scalable state-management solution for React.
- Uses hooks for accessing and updating state.
- Minimal boilerplate, easy to use.

### What is React Query?

- Handles asynchronous server state (data fetching, caching, updating).
- Provides hooks for queries and mutations.
- Automatic caching, background updates, and stale data management.

### Why Use Both?

- Zustand for UI/client state (e.g., modals, form inputs, theme).
- React Query for server state (e.g., API data, remote resources).
- Clean separation of concerns, improved maintainability.

---

## 2. Core Concepts

### Zustand Core Concepts

- Store: Centralized state container.
- Actions: Functions to update state.
- Selectors: Functions to read state.

#### Example Zustand Store

```ts
import { create } from 'zustand';

interface UserState {
	user: string | null;
	setUser: (user: string) => void;
	clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
	user: null,
	setUser: (user) => set({ user }),
	clearUser: () => set({ user: null }),
}));
```

### React Query Core Concepts

- Query: Fetches and caches data.
- Mutation: Modifies server data.
- QueryClient: Manages queries and cache.

#### Example React Query Usage

```ts
import { useQuery, useMutation, QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			{/* ... */}
		</QueryClientProvider>
	);
}

function useUserData(userId: string) {
	return useQuery(['user', userId], () => fetchUser(userId));
}

function fetchUser(userId: string) {
	return fetch(`/api/user/${userId}`).then(res => res.json());
}
```

---

## 3. When to Use Zustand vs React Query

### Zustand (Client State)

- UI state: modals, toggles, theme, form inputs.
- Temporary data not persisted to server.
- State shared across components but not fetched from server.

### React Query (Server State)

- Data fetched from APIs (users, posts, products).
- Data that needs caching, refetching, or background updates.
- Handles loading, error, and success states automatically.

### Example: Combining Both

```ts
// Zustand for modal state
const useModalStore = create((set) => ({
	isOpen: false,
	open: () => set({ isOpen: true }),
	close: () => set({ isOpen: false }),
}));

// React Query for user data
const { data, isLoading } = useQuery(['user', userId], () => fetchUser(userId));
```

---

## 4. Integrating Zustand and React Query

### Pattern 1: Use Zustand for UI, React Query for Data
```tsx
import React from 'react';
import { useUserStore } from './store/user.store';
import { useQuery } from '@tanstack/react-query';

function UserProfile({ userId }: { userId: string }) {
	const { user, setUser } = useUserStore();
	const { data, isLoading } = useQuery(['user', userId], () => fetchUser(userId));

	React.useEffect(() => {
		if (data) setUser(data.name);
	}, [data, setUser]);

	if (isLoading) return <div>Loading...</div>;
	return <div>User: {user}</div>;
}
```

### Pattern 2: Store React Query Data in Zustand (Rarely Needed)
- Only do this if you need to persist server data in client state for offline use or complex workflows.

---

## 5. Best Practices

### 1. Keep UI and Server State Separate
- Use Zustand for UI state, React Query for server state.
- Avoid duplicating server data in Zustand unless necessary.

### 2. Use Selectors for Performance
- Zustand selectors prevent unnecessary re-renders.
```ts
const user = useUserStore((state) => state.user);
```

### 3. Use React Query for Data Fetching
- Let React Query handle caching, background updates, and error states.

### 4. Use Zustand Actions for UI Events
- Example: open/close modal, set theme, update form fields.

### 5. Avoid Overfetching
- Use React Query’s staleTime and cacheTime to optimize network requests.
```ts
useQuery(['user', userId], fetchUser, { staleTime: 1000 * 60 });
```

### 6. Use Devtools for Debugging
- Zustand: [zustand devtools](https://github.com/pmndrs/zustand#devtools)
- React Query: [react-query devtools](https://tanstack.com/query/v4/docs/devtools)

---
## 6. Advanced Patterns

### Pattern: Syncing Server State to Client State
Sometimes you need to sync server data to Zustand for offline use or complex UI workflows.

#### Example: Persisting Fetched Data
```ts
const useUserStore = create((set) => ({
	user: null,
	setUser: (user) => set({ user }),
}));

function useSyncUser(userId: string) {
	const setUser = useUserStore((state) => state.setUser);
	const { data } = useQuery(['user', userId], fetchUser);

	React.useEffect(() => {
		if (data) setUser(data);
	}, [data, setUser]);
}
```

---
## 7. Example Projects

### Example 1: User Dashboard
// ...more examples to follow...