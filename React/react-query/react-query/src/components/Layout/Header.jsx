import {NavLink} from 'react-router-dom';
const Header = () => {
//   I used Emmet Abbreviation for generating the boilerplate HTML+JS+CSS code
    return (
    <header>
    
        <div>
            <NavLink to="/">Mayank-react-query</NavLink>
            <ul>
                <li>
                    <NavLink to="/">Home</NavLink>
                </li>
                <li>
                    <NavLink to="/trad">Fetch Old</NavLink>
                </li>
                <li>
                    <NavLink to="/rq">FetchRQ</NavLink>
                </li>
            </ul>
        </div>
    </header>
  )
}

export default Header
