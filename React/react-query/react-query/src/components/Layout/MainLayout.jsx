import { Outlet } from "react-router-dom"
import Header from './Header';
import Footer from './Footer';
const MainLayout = () => {
    // All the children defined inside the MainLayout equivalent to element property while efining router
    // will get replaced by the <Outlet/> imported from react-router-dom and the <Header /> and <Footer /> component will be constant.
  return (
    <>
      <Header/>
      <Outlet/>
      <Footer />
    </>
  )
}

export default MainLayout
