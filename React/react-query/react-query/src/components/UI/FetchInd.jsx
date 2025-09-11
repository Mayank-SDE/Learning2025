import { useQuery } from "@tanstack/react-query";
import { fetchPostById } from "../../API/api";
import { NavLink, useParams } from "react-router-dom";

const FetchInd = () => {

    const {id}=useParams();
    const {data:post, error, isPending, isError} = useQuery({
        queryKey:[`post-${id}`],// useState // Whenever the id changes, this query will re-fetch i.e. it will create a new query with a new key and the function assigned to queryFn will get executed.
        queryFn:() => fetchPostById(id) // useEffect
    });
    if (isPending) return <p>Loading...</p>;
    if (isError) return <p>Error: {error.message || "Something went wrong."}</p>;
  return (
    <div className="section-accordion">
      <h1>Post ID Number :- {post?.id}</h1>
      <div>
        <p>ID : {post?.id}</p>
        <p>Title : {post?.title}</p>
        <p>Body : {post?.body}</p>
      </div>
      <NavLink to="/rq">
        <button>Go Back</button>
      </NavLink>
    </div>
  )
}

export default FetchInd
