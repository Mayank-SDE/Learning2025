import { useEffect, useState } from "react"
import { deletePost, fetchPosts, fetchPostsWithPagination, updatePost } from './../API/api';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NavLink } from "react-router-dom";

const FetchRQ = () => {
const queryClient = useQueryClient();
  const [pageNumber,setPageNumber]=useState(1);

 // For data fetching we have one hook which is useQuery() Hook

 // useQuery() hook takes two minimum arguments: a unique key (queryKey) and a function that returns a promise
 // useQuery() hook is used for fetching the data from the server.
 // The queryKey is typically a array of string that uniquely ientifies a query. 
 // It allows React Query to determine if the data in the cache is associated with a particular request.
 // It is used to cache data with a specific key and refetch or update data when certain dependencies change.
// Using useQuery() you will have the following advantages:
// 1. Error Handling
// 2. Loading States
// 3. Caching
// 4. Automatic Refetching
// 5. Query Invalidation
// 6. Devtools
// 7. Pagination
// 8. Query Deduplication
// 9. Optimistic Updates
// 10. Query Cancellation
// 11. Query Prefetching
// 12. Query Dehydration
// 13. Query Suspense
// 14. Query Batching
// 15. Query Pagination
// Keep exploring the documentation for latest changes.
const { data: posts, error, isPending ,isError} = useQuery({
  queryKey:['posts',pageNumber], // useState ka kam kar rha hai
  queryFn:() => fetchPostsWithPagination(pageNumber),
  //fetchPosts, // useEffect ka kam kar rha hai
  // gcTime: 1000 * 60 * 5 // 5 minutes removing data from cache
  // staleTime: 10000,// 1000 * 60 * 1 // 1 minute storing data from fresh into the stale section. explore it in the react-query-devtools
  // At the background until the data is fresh, it will be served from the cache and when the data is stale, it will be refetched in the background. i.e. API request will be made
  refetchInterval: 10000, // 1000 * 60 * 1 // 1 minute refetching the data from the server
// The difference between staleTime and refetchInterval is that staleTime determines how long the data is considered fresh, while refetchInterval determines how often to refetch the data in the background.
  refetchIntervalInBackground: true, // Even if the user is not focused on the tab, the data will be refetched in the background
  placeholderData: keepPreviousData , // This will keep the previous data while the new data is being fetched which will not show loading state
 })

  // IMPORTANT: All hooks (including useMutation) must run on every render *before* any conditional returns.
  // Move useMutation above early returns to avoid 'Rendered more hooks than during the previous render.'
  const deleteMutation = useMutation({
    mutationFn: (id) => deletePost(id),
    onSuccess: (data,id) => {
      queryClient.setQueryData(['posts', pageNumber], (oldData) => {
        return oldData.filter((post) => post.id !== id);
      });
      // it is used for updating the cache associated with the key we passed as first argument.
    },
  });
 const updateMutation=useMutation({
    mutationFn:(id)=>updatePost(id),
    onSuccess:(postData,postId)=>{
      queryClient.setQueryData(['posts', pageNumber], (oldData) => {
        return oldData.map((post) => post.id === postId ? postData : post);
      });
    }
   });
  if (isPending) return <p>Loading...</p>;
  if (isError) return <p>Error : {error.message || "Something went wrong."}</p>;

  /*
    useQuery() is used for get request.
    useMutation() is used for post, put, delete requests.
    useMutation() is a part of react-query and is used for operations that modify data on the server like CRUD operations.
    Syntax:
    const { mutate } = useMutation({
      mutationFn,
      {
       i.e  Optional configuration Function
      }
    });
    We can provide various configuration options to customize the behavior of the mutation, such as : 
    1. onSuccess : A callback function that runs when the mutation is successful.
    2. onError : A callback function that runs when the mutation fails.
    3. onSettled : A callback function that runs when the mutation is either successful or fails.
    mutationKey : A unique key that identifies the mutation in the cache.

  */

  // (moved useMutation higher to keep hook order stable)
    /*
      mutate() frunction is used to execute the mutation in React query.
      The process is same whether you're:
        1. Deleting data
        2. Creating data
        3. Updating data
      When you call the mutate function, it tells the react query to execute the mutation function defined in the useMutation hook.
      This is needed because mutation is an action that changes data, unlike queries which is uesd to fetch data and are often auto-executed.
    */
  
  return (
    <div>
      <ul className="section-accordion">
        {/* Optional Chaining */}
        {posts?.map((post) => {
          const { id, title, body } = post;
          return (
            <li key={id}>
            <NavLink  to={`/rq/${id}`}>
              <h3>{id} - {title}</h3>
              <p>{title}</p>
              <p>{body}</p>
            </NavLink>
              <button onClick={() => deleteMutation.mutate(id)} disabled={deleteMutation.isPending}>Delete</button>
              <button onClick={()=>updateMutation.mutate(id)}>Update</button>
          </li>)
        })}
      </ul>
      <div className="pagination-section container">
        <button disabled={pageNumber === 1} onClick={() => setPageNumber((prev) => prev - 1)}>Prev</button>
        <h2>{pageNumber}</h2>
        <button onClick={() => setPageNumber((prev) => prev + 1)}>Next</button>
      </div>
    </div>
  )
}

export default FetchRQ
