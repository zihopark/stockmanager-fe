import {useState, useRef} from 'react';
import { useNavigate } from 'react-router-dom';
import '../resources/css/member.css';

//아래는 개발 환경 
//const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
// nginx 프록시 활용하기에 아래처럼 작성.
const API_URL = '';

const SearchID = () => {

    const IDSearchResultStyle = {
        width: "100%",
        height: "auto",
        padding: "20px, 10px",
        backgroundColor: "#FFFFFF",
        textAlign: "center",
        borderRadius: "20px",
        color: "black"
    }    

    const [username, setUsername] = useState('');
    const usernameRef = useRef();
    const [telno, setTelno] = useState('');
    const telnoRef = useRef();
    const [IDSearchResult, setIDSearchResult] = useState('');
    const navigate = useNavigate();

    const IDSearchCheck = async () => {
        if(usernameRef.current.value === '') { alert("이름을 입력하세요."); usernameRef.current.focus();  return false; }
        if(telnoRef.current.value === '') { alert("전화번호를 입력하세요."); telnoRef.current.focus(); return false; }
        
        let formData = new FormData();
        formData.append("username", usernameRef.current.value);
        formData.append("telno", telnoRef.current.value);
        
        await fetch(`${API_URL}/member/searchID`, {			
            method: 'POST',
            body: formData
        }).then((response)=> response.json())
          .then((data) => {
              if(data.message !== 'ID_NOT_FOUND'){				
                setIDSearchResult("<br/><h3>아이디 : " + data.message + "</h3><br />");					                
              } else {
                alert("해당 조건에 맞는 아이디가 존재하지 않습니다.");
              }
        }).catch((error)=> {			
            console.log(error);
        });
    }
    
    const press = (e) => {
        if(e.keyCode === 13){ IDSearchCheck (); }
    }

    const goHome = () => {
        navigate(-1);
    }

    return(
        <div className='main'>
            <div className="ModifyForm">
                <h1 style={{color: 'black', marginBottom: '25px', textAlign:'center'}}>아이디 찾기</h1>
     			<div className="SearchFormDivision">
         			<input type="text" className="input_field" value={username} ref={usernameRef} onChange={(e) => setUsername(e.target.value)} placeholder="이름을 입력하세요." />
         			<input type="text" className="input_field" value={telno} ref={telnoRef} onChange={(e) => setTelno(e.target.value)} onKeyDown={press} placeholder="전화번호를 입력하세요." />
         			<input type="button" className="btn_write" value="아이디 찾기" onClick={IDSearchCheck} />
            		<input type="button" className="btn_cancel" value="홈으로" onClick={goHome} /> 
     			</div>
                <div dangerouslySetInnerHTML={{ __html: IDSearchResult }} style={IDSearchResultStyle}></div>	
			</div>
    	</div>
    );

}

export default SearchID;