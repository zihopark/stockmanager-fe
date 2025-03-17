import logo from '../logo.svg'
import {Link} from 'react-router-dom'

function Title(){
	return(
		<div className='App'>
			<img src={logo} className='App-logo' alt='title logo'/>
			<h1 className='title'>스마트스토어 제품 재료 재고관리 서비스</h1>

			<Link to='/Login' style={{
				backgroundColor:'white', 
				opacity:'0.5', 
				width:'400px', 
				height:'auto',
				margin:'0 auto',
				textDecoration:'none'
				}}>
				<p style={{
					fontSize:'24px',
					color:'black',
					textAlign:'center',
				}}>들어가기</p>
			</Link>
		</div>
	)
}

export default Title;