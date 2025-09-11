import { create } from "zustand";
import type { GetUserFilters } from "../api/user.api";

type UserStore={
    filters?:GetUserFilters;
    setFilters:(filters?:GetUserFilters)=>void;
}
const useUserStore=create<UserStore>((set)=>{
    return {
        filters:{limit:10,page:1},
        setFilters:(filters)=>set({filters})
    }
});
export default useUserStore;