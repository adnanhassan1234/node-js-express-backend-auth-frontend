import React from 'react';
import Button from '@material-ui/core/Button';
import DoubleArrowRoundedIcon from '@material-ui/icons/DoubleArrowRounded';

const Hero = (props) => {

    return (
        <>
            {/* ====================   hero-section  ========================== */}
            <div className="hero-section">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-12 col-12">
                            <div className="full m-auto  text-center">
                                <div className="title text-white">
                                    <h2> {props.title} <br /> Likes have Value </h2>
                                </div>
                                <div className="para">
                                    <p> {props.para} </p>
                                </div>
                                <div className="search">
                                    <form action="">
                                        <div className="row">
                                            <div className="col">
                                                <Button type="button"
                                                    variant="contained"
                                                    color="primary"
                                                    className='mx-1 my-2'
                                                >  {props.get} &nbsp; <DoubleArrowRoundedIcon /> </Button>
                                                <Button type="button"
                                                    variant="contained"
                                                    color="primary"
                                                    className='mx-3 my-2'
                                                >  {props.sale} &nbsp; <DoubleArrowRoundedIcon /></Button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Hero;
