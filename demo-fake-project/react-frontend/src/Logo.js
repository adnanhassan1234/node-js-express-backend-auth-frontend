import React from 'react';
import {  animateScroll as scroll } from "react-scroll";

const Logo = () => {
  return (
    <>
      <div onClick={()=>{
          scroll.scrollToTop();
      }}>
      <div className="navbar-brand" style={{fontSize:"24px", color:'white'}}>HassanTarar</div>
      </div>
    </>
  )
}

export default Logo