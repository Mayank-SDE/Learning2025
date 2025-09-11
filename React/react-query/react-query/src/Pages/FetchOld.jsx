import { useEffect, useState } from "react"
import { fetchPosts } from './../API/api';

const FetchOld = () => {
  const [posts,setPosts]=useState([]);
  const [isLoading,setIsLoading]=useState(false);
  const [isError,setIsError]=useState(null);
 
  useEffect(()=>{
      const fetchData=async ()=>{
        try {
          setIsLoading(true);
          const data=await fetchPosts();
          setPosts(data);
          setIsLoading(false);
        } catch (error) {
          setIsError(error);
          setIsLoading(false);
        }
      }
       fetchData();
  },[]);
  if (isLoading) return <p>Loading...</p>;

  if (isError) return <p>Error: {isError.message}</p>;

  return (
    <div>
      <ul className="section-accordion">
        {/* Optional Chaining */}
        {posts?.map((post) => {
          const { id, title, body } = post;
          return (
            <li key={id}>
              <p>{title}</p>
              <p>{body}</p>
            </li>
          );
        })}
      </ul>
    </div>
  )
}

export default FetchOld
