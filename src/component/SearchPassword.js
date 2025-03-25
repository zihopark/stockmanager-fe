import {useState,useRef} from 'react';
import { useNavigate } from 'react-router-dom';
import '../resources/css/member.css';

//아래는 개발 환경 
//const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
// nginx 프록시 활용하기에 아래처럼 작성.
const API_URL = '';

const SearchPassword = () => {

    const temporalPasswordStyle = {
        width: "100%",
        height: "auto",
        padding: "20px, 20px",
        backgroundColor: "#FFFFFF",
        textAlign: "center",
        border: "5px",
        borderRadius: "30px",
        color: "black"
      }

    const [email, setEmail] = useState('');
    const emailRef = useRef();
    const [telno, setTelno] = useState('');
    const telnoRef = useRef();
    const [temporalPassword, setTemporalPassword] = useState('');
    const navigate = useNavigate();

    const pwSearchCheck = async() => {

        if(emailRef.current.value === "") { alert("아이디를 입력하세요."); emailRef.current.focus();  return false; }
        if(telnoRef.current.value === '') { alert("전화번호를 입력하세요."); telnoRef.current.focus(); return false; }
    
        let formData = new FormData();
        formData.append("email", emailRef.current.value);
        formData.append("telno", telnoRef.current.value);
        
        await fetch(`${API_URL}/member/searchPassword`, {			
            method: 'POST',
            body: formData		
        }).then((response)=> response.json())
          .then((data) => {
              if(data.status === 'good'){				
                setTemporalPassword("<br /><h3>임시패스워드 : " + data.password + "</h3><br />비밀번호 변경은 로그인 후, <br />설정에서 비밀번호를 변경할 수 있습니다.");					                
              } else if(data.status === 'ID_NOT_FOUND'){
                  alert("해당 아이디를 가진 사용자가 없습니다.");
              }	else if(data.status === 'TELNO_NOT_FOUND'){
                  alert("전화번호 입력이 잘못 되었습니다.");
              }
        }).catch((error)=> {			
            console.log((error)=> console.log(error));
        });
    }
    
    const press = (e) => {
        if(e.keyCode === 13){ pwSearchCheck(); }
    }

    const goHome = () => {
        navigate(-1);
    }

    return (
        <div className="main">
            <div className="ModifyForm">
                <h1 style={{color: 'black', marginBottom: '25px', textAlign:'center'}}>임시 패스워드 발급</h1>
                <div className="SearchFormDivision">
                    <input type="text" className="input_field" value={email} ref={emailRef} onChange={(e)=>setEmail(e.target.value)} placeholder="아이디를 입력하세요." />
                    <input type="text" className="input_field" value={telno} ref={telnoRef} onChange={(e)=>setTelno(e.target.value)} onKeyDown={press} placeholder="전화번호를 입력하세요." />
                    <input type="button" className="btn_write" value="임시 패스워드 발급" onClick={pwSearchCheck} />
                    <input type="button" className="btn_cancel" value="홈으로" onClick={goHome} />
        		</div> 
                <div dangerouslySetInnerHTML={{ __html: temporalPassword }} style={temporalPasswordStyle}></div>
		</div>
        </div>
    );
}

export default SearchPassword;