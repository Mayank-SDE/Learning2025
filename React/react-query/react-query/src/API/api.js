import axios from 'axios';
const api=axios.create({
    baseURL:"https://jsonplaceholder.typicode.com"
});
// to fetch the data
export const fetchPosts=async ()=>{
    try {
        const response = await api.get('/posts?_start=0&_limit=3');
        return response.status === 200 ? response.data : [];
    } catch (error) {
        console.error("Error fetching posts:", error);
        return [];
    }
    const response = await api.get('/posts?_start=0&_limit=3');
    return response.status===200 ? response.data : [];
}
export const fetchPostsWithPagination=async (pageNumber)=>{
    try {
        const response = await api.get(`/posts?_start=${(pageNumber-1)*3}&_limit=3`);
        return response.status === 200 ? response.data : [];
    } catch (error) {
        console.error("Error fetching posts with pagination:", error);
        return [];
    }
}
export const fetchPostById=async(id)=>{
    try {
        const response=await api.get(`/posts/${id}`);
        return response.status===200 ? response.data : null;
    } catch (error) {
        console.error("Error fetching post by ID:", error);
        return null;
    }
}

export const deletePost=async(id)=>{
    try {
        const response=await api.delete(`/posts/${id}`);
        return response.status===200 ? response.data : null;
    } catch (error) {
        console.error("Error deleting post:", error);
        return null;
    }
}
export const updatePost = async (id) => {
    try {
        const response = await api.put(`/posts/${id}`, {
            title: "Updated Title",
            body: "Updated Body"
        });
        return response.status === 200 ? response.data : null;
    } catch (error) {
        console.error("Error updating post:", error);
        return null;
    }
}