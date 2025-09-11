import { useQuery } from "@tanstack/react-query"
import { getUsers, type GetUserFilters } from "./api/user.api"
import useUserStore from "./store/user.store";

const App = () => {
  const {filters}=useUserStore();
  const {data:users}=useQuery({
    queryKey:["users"],
    queryFn:()=>getUsers(filters as GetUserFilters)
  })


  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {users?.map((user) => {
        return (
          <div key={user.id} className="bg-slate-900 text-slate-100 my-auto mt-20 p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-gray-600">Age: {user.age}</p>
          </div>
        )
      })}
      <FilterComponent />
    </div>
  )
}

export default App

const FilterComponent=()=>{
  const {setFilters}=useUserStore();
  return null;
}