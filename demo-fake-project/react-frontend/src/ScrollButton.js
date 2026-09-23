import React, { useState } from 'react';
import ExpandLessRoundedIcon from '@material-ui/icons/ExpandLessRounded';
import { Button } from './Styles';

const ScrollButton = () => {

	const [visible, setVisible] = useState(false)

	const toggleVisible = () => {
		const scrolled = document.documentElement.scrollTop;
		if (scrolled > 300) {
			setVisible(true)
		}
		else if (scrolled <= 300) {
			setVisible(false)
		}
	};

	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth'
			/* you can also use 'auto' behaviour
				in place of 'smooth' */
		});
	};

	window.addEventListener('scroll', toggleVisible);

	return (
		<div className='scrollTop_Function'>
			<Button>
				<ExpandLessRoundedIcon className='arrow_button' onClick={scrollToTop}
					style={{ display: visible ? 'inline' : 'none' }} />
			</Button>
		</div>
	);
}

export default ScrollButton;
