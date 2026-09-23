import React, {useEffect , useState} from 'react';
import {NavLink } from 'react-router-dom';

const Navbar = () => {

   //navbar scroll when active state
   const [navbar, setNavbar] = useState(false)

 
   //navbar scroll changeBackground function
   const changeBackground = () => {
     console.log(window.scrollY)
     if (window.scrollY >= 120) {
       setNavbar(true)
     } else {
       setNavbar(false)
     }
   }
 
   useEffect(() => {
     changeBackground()
     // adding the event when scroll change background
     window.addEventListener("scroll", changeBackground)
   },[])
 



    return (
        <>
           <nav className= {navbar ? "navbar active navbar-expand-lg navbar-light" : "navbar navbar-expand-lg navbar-light"} >
                <div className="container">
                    <NavLink to="/" className="navbar-brand" style={{fontSize:"24px", color:'white'}}>HLEMONET</NavLink>
                    <button type="button" className="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#navbarCollapse">
                    <i className="fa fa-bars" aria-hidden="true"></i>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarCollapse">
                        <div className="navbar-nav menus navbar-collapse">
                            <NavLink to="/" className=" nav-link" exact activeClassName="active_class" aria-current="page">Home</NavLink>
                            <NavLink to="/" className=" nav-link" exact activeClassName="active_class">About</NavLink>
                            <NavLink to="/" className=" nav-link" exact activeClassName="active_class">Why</NavLink>
                            <NavLink to="/" className=" nav-link" exact activeClassName="active_class">Benefit</NavLink>
                            <NavLink to="/" className=" nav-link" exact activeClassName="active_class">Roadmap</NavLink>
                            <NavLink to="/" className=" nav-link" exact activeClassName="active_class">FAQ</NavLink>
                        </div>
                        <div className="navbar-nav mx-auto">
                            <NavLink to="/signup" className=" my-1 text-center  signup">Register</NavLink>
                            <NavLink to="/Wallet" className="my-1 text-center  login">Connect Wallet</NavLink>
                        </div>
                    </div>
                </div>
            </nav>
        </>
    )
}

export default Navbar;
