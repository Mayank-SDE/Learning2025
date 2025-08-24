import { create } from 'zustand';

const useStore = create<{
    count: number;
    increase: () => void;
    decrease:()=>void;
}>((set) => ({
    count: 0,
    increase: () => set((state) => ({
        count: state.count + 1
    })),
    decrease:()=>set((state)=>({count:state.count>=1?state.count-1:0}))
}));
export default useStore;