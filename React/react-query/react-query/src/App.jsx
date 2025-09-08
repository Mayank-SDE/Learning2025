import './App.css';
import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import FetchOld from './Pages/FetchOld';
import FetchRQ from './Pages/FetchRQ';
import Home from './Pages/Home';
import MainLayout from './components/Layout/MainLayout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import FetchInd from './components/UI/FetchInd';
const router=createBrowserRouter([{
  path:"/",
  element:<MainLayout/>,
  children:[
    {
      path:"/",
      element:<Home />
    },
    {
      path:"/trad",
      element:<FetchOld />
    },{
      path:"/rq",
      element:<FetchRQ />
    },
    {
      path:"/rq/:id",
      element:<FetchInd />
    }
  ]  
}])
const App = () => {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryDevtools isInitialOpen={false} />
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

export default App