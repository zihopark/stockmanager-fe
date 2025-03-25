import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../resources/css/member.css';


//아래는 개발 환경 
//const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
// nginx 프록시 활용하기에 아래처럼 작성.
const API_URL = '';

const Signup = () => {

   //회원 등록 정보 - state/Ref 등록
    const [email, setEmail] = useState('');
    const emailRef = useRef();
    const [message, setMessage] = useState('');
    const emailChange = async (e) =>{
        setEmail(e.target.value);
        let formData = new FormData();
        formData.append("email",emailRef.current.value);
        await fetch(`${API_URL}/member/idCheck`,{method : 'POST', body: formData})
                .then((response) => response.json())
                .then((data) => {
                    if(data.status === 'good') setMessage('사용 가능한 이메일입니다.');
                        else setMessage('이미 사용중인 이메일입니다.');                        
                }).catch((error)=> { console.log("error = " + error);} );     
    }
    const [username, setUsername] = useState('');
    const usernameRef = useRef();
    const [password, setPassword] = useState('');
    const [password1, setPassword1] = useState('');
    const passwordRef = useRef();
    const password1Ref = useRef();
    const navigate = useNavigate();
    const [telno, setTelno] = useState('');
    const telnoRef = useRef();
    
    
    const goHome = () => {
        navigate(-1);
    }


    const handleRegister = async () => {

        //유효성 검사
		if(emailRef.current.value === '') { alert("이메일을 입력하세요."); emailRef.current.focus();  return false; }
		if(usernameRef.current.value === '') { alert("이름을 입력하세요."); usernameRef.current.focus(); return false; }
	
        //패스워드 유효성 검사
		const Pass = passwordRef.current.value;
		const Pass1 = password1Ref.current.value;
		if(Pass === '') { alert("암호를 입력하세요."); passwordRef.current.focus(); return false; }
		if(Pass1 === '') { alert("암호를 입력하세요."); password1Ref.current.focus(); return false; }
		if(Pass !== Pass1) 
			{ alert("입력된 비밀번호를 확인하세요"); password1Ref.current.focus(); return false; }		
		//자바스크립트의 정규식(Regular Expression)을 이용한 패스워드 조건 검사
		let num = Pass.search(/[0-9]/g); // 0-9까지의 숫자가 들어 있는지 검색. 검색이 안되면 -1을 리턴
	 	let eng = Pass.search(/[a-z]/ig); //i : 알파벳 대소문자 구분 없이... 
	 	let spe = Pass.search(/[`~!@@#$%^&*|₩₩₩'₩";:₩/?]/gi);	//특수문자가 포함되어 있는가 검색
		if(Pass.length < 8 || Pass.length > 20) { alert("암호는 8자리 ~ 20자리 이내로 입력해주세요."); return false; }
		else if(Pass.search(/\s/) !== -1){ alert("암호는 공백 없이 입력해주세요."); return false; }
		else if(num < 0 || eng < 0 || spe < 0 ){ alert("암호는 영문,숫자,특수문자를 혼합하여 입력해주세요."); return false; }
			
        if(telnoRef.current.value === '') { alert("전화번호를 입력하세요."); telnoRef.current.focus(); return false; }
        //전화번호 문자열 정리
		const beforeTelno = telnoRef.current.value;
        const afterTelno = beforeTelno.replace(/-/gi,"").replace(/ /gi,"").trim();
        telnoRef.current.value = afterTelno;
        
		let formData = new FormData();

        formData.append("email", emailRef.current.value);
        formData.append("username", usernameRef.current.value);
        formData.append("password", passwordRef.current.value);
        formData.append("telno",telnoRef.current.value);
        formData.append("kind", "I");
		
		await fetch(`${API_URL}/member/signup`, {
			method: 'POST',
			body: formData,
			
		}).then((response) => response.json())
		  .then((data) => {
			  if(data.status === 'good'){
				  alert(decodeURIComponent(data.username) + "님, 회원 가입을 축하 드립니다.");				  
                  navigate('/Login');
			  } else {
				  alert("서버 장애로 회원 가입에 실패했습니다.");
			  }
		});	
    }


    return (
        <div className='main'>
            <form className="WriteForm">
                <h1 style={{color: 'black', marginBottom: '25px', textAlign:'center'}}>회원 가입</h1><br />
                <div>
                    <input type="text" className="input_field" ref={emailRef} value={email} onChange={(e) => emailChange(e)} placeholder="여기에 이메일을 입력해 주세요." /><br/>
                    <p style={{color:'#166fe5', textAlign: 'center', marginBottom: '15px'}}>{message}</p>			
                    <input type="text" className="input_field" ref={usernameRef} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="여기에 이름을 입력해 주세요."/>
                    <input type="password" className="input_field" ref={passwordRef} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="여기에 패스워드를 입력해 주세요."/>
                    <input type="password" className="input_field" ref={password1Ref} value={password1} onChange={(e) => setPassword1(e.target.value)} placeholder="여기에 패스워드를 한번 더 입력해 주세요."/>
                    <input type="text" value={telno} ref={telnoRef} onChange={(e) => setTelno(e.target.value)} className="input_field" placeholder="전화번호를 입력하세요." />
                    <br /><p className='noti' style={{color: 'red'}}>일반 사용자 권한으로 등록되며,<br />관리자 승인 시 서비스 이용이 가능합니다.</p>
                    <div className="SearchFormDivision">
                        <input type="button" className="btn_write" onClick={handleRegister} value="회원 등록"/>
                        <input type="button" className="btn_cancel" value="홈으로" onClick={goHome} /> 
                    </div>
                </div>
            </form>
        </div>
    )

}

export default Signup;