
import React from 'react';

const Box = (props) => {
    return (
        <>
            <div className="col-lg-4 col-md-6 col-12">
                <div className="full text-center  p-3">
                    <div className="icon">
                    {props.icons}
                        {/* <GetAppIcon  className="icon1" /> */}
                    </div>
                    <div className="main mt-3">
                        <h3>{props.title}</h3>
                    </div>
                    <div className="para">
                        <p>{props.para}</p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Box;
