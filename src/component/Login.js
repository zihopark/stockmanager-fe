import getCookie from './GetCookie';
import { useState, useRef, useEffect } from 'react';
import { Link,useNavigate } from 'react-router-dom';
import CryptoJS from 'crypto-js'; //AES 암호화 알고리즘으로 패스워드 쿠키를 암호화/복호화
import '../resources/css/member.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';


const Login = () =>{

    //state 초기화
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    //Ref 초기화
    const emailRef = useRef();
    const passwordRef = useRef(); 
    const rememberEmailRef = useRef();   
    const rememberPasswordRef = useRef();   
    const rememberMeRef = useRef(); 
     
    //Cookie 가져 오기
    let emailCookie = getCookie('email');
    let passwordCookie = getCookie('password');
    let authkeyCookie = getCookie('authkey'); 
    
    //secret key 생성
    const secretKey = "secretKey";

    //첫번째 렌더링 시 쿠키를 읽어 email, password,자동로그인 여부 확인한 후 
    //쿠키에 저장된 email, password값을 input value에 넣어준다.    
    useEffect(()=> {        
        checkBoxConfirm() 
    },[]);

    const checkBoxConfirm = async () => {

        //email 쿠키 존재 여부 확인 후 email 쿠키가 존재하면 email state에 할당
        if(emailCookie !== undefined){ //email 쿠키가 존재하면 
            setEmail(emailCookie); //email state에 email 쿠키값을 할당
            rememberEmailRef.current.checked = true; //email 기억 체크
        } else rememberEmailRef.current.checked = false;
        
        //패스워드 쿠키 존재 여부 확인 후 패스워드 쿠키가 존재하면 패스워드 state에 할당
        if(passwordCookie !== undefined){ //패스워드 쿠키가 존재하면
            //password를 디코딩
            try{
                const bytes = CryptoJS.AES.decrypt(passwordCookie, secretKey);
                const decrypted = bytes.toString(CryptoJS.enc.Utf8);
                setPassword(decrypted);  //password state에 디코팅 된 패스워드 쿠키 값 할당 
                rememberPasswordRef.current.checked = true; //password 기억 체크
            } catch(error) {
                console.log(error);
            }
        } else rememberPasswordRef.current.checked = false;
        
        //자동로그인 쿠키 존재 여부 확인 후 자동로그인 쿠키가 존재하면
        //authkey 쿠키를 읽어 들여 서버로 비동기 전송
        if(authkeyCookie !== undefined){ 
     
			let formData = new FormData();
			formData.append("authkey",authkeyCookie);
            formData.append("autoLogin","PASS"); //예전 로그인 과정에서 저장된 authkey 쿠키로 로그인

			await fetch(`${API_URL}/member/loginCheck`,{
				method : 'POST',
				body : formData
			}).then((response) => response.json())
			  .then((data) => {
				 if(data.message === 'good'){
                    navigate('/AutoOrderList'); //가상돔을 사용 
				} else {
                    alert("시스템 장애로 자동 로그인이 실패 했습니다.");
                }		  
		    }).catch((error)=> { console.log(error);} );
		}	

    }    

	//이메일 체크 관리 
    //이메일 저장 체크하면 자동 로그인 체크를 해제
	const checkRememberEmail = (e) => {
		if(e.target.checked) {
            rememberMeRef.current.checked = false;
        }   
    }
	
	//패스워드 체크 관리
    //패스워드 저장 체크하면 자동 로그인 체크를 해제
	const checkRememberPassword = (e) => {
		if(e.target.checked) {
            rememberMeRef.current.checked = false;
        }    
 	}	

    //자동로그인 체크 관리
    //자동로그인 저장 체크하면 이메일, 패스워드 저장 체크를 해제
	const checkRememberMe = (e) => {
		if(e.target.checked) {
            rememberEmailRef.current.checked = false;
            rememberPasswordRef.current.checked = false;
		}
	}

    //아이디, 패스워드 검증 이후 아이디, 패스워드 쿠키 등록
    const cookieManage = (username, role, authkey, accessToken, refreshToken) => { 
        //email 쿠키 등록 
        /*       
        if(rememberEmailRef.current.checked){
            document.cookie = 'email=' + email + ';path=/; expires=Wed, 31, Dec 2025 23:59:59 GMT';        
        } else 
        {
            document.cookie = 'email=' + email + '; path=/; max-age=0';
        }    
        */
        //password 쿠키 등록  
        let hash = '';
        if(rememberPasswordRef.current.checked) {
            //Base64(양방향 복호화 알고리즘)로 패스워드 인코딩
		    hash = CryptoJS.AES.encrypt(password, secretKey);
            setPassword(hash.toString());
            document.cookie = 'password=' + hash + ';path=/; expires=Wed, 31, Dec 2025 23:59:59 GMT';
        } else {
            document.cookie = 'password=' + hash + '; path=/; max-age=0';
        }    

        //자동로그인 쿠키 등록
        if(rememberMeRef.current.checked) {
            document.cookie = 'authkey=' + authkey + ';path=/; expires=Wed, 31, Dec 2025 23:59:59 GMT';
            //React에서는 Session이 아니라 Cookie로 email 값을 웹브라우저에 저장해야 하기 때문에
            //자동저장 클릭시 email Cookie도 같이 만들어 줘야 함
            document.cookie = 'email=' + email + ';path=/; expires=Wed, 31, Dec 2025 23:59:59 GMT';        
		} else document.cookie = 'authkey=' + authkey + ';path=/; max-age=0';

        //JWT 쿠키 등록
        document.cookie = 'accessToken=' + accessToken + ';path=/; expires=Wed, 31, Dec 2025 23:59:59 GMT';
        document.cookie = 'refreshToken=' + refreshToken + ';path=/; expires=Wed, 31, Dec 2025 23:59:59 GMT';
        
        //email, username, role, FromSocial 쿠키 등록
        document.cookie = 'email=' + email + ';path=/; expires=Wed, 31, Dec 2025 23:59:59 GMT'; 
        document.cookie = 'username=' + decodeURIComponent(username) + ';path=/; expires=Wed, 31, Dec 2025 23:59:59 GMT';
        document.cookie = 'role=' + role + ';path=/; expires=Wed, 31 Dec 2025 23:59:59 GMT';        
    } 
    
    //REST API 서버와의 비동기 통신으로 아이디/패스워드 검증 및 
    //email, password, username, role, accessToken, refreshToken 생성
    const loginCheck = async () =>{
        //아이디, 패스워드 입력 유효성 확인
        if(emailRef.current.value === ''){
            alert('아이디를 입력하세요.');            
            emailRef.current.focus();
            return false;
        }
        if(passwordRef.current.value === ''){
            alert('패스워드를 입력하세요');
            passwordRef.current.focus();
            return false;
        }

        //Form 데이터로 이메일, 패스워드값 서버로 전송
        let formData = new FormData();
		formData.append("email", emailRef.current.value);
		formData.append("password", passwordRef.current.value);
        formData.append("autoLogin", "NEW"); //Form에서 읽은 email, 패스워드 값으로 로그인
   
        await fetch(`${API_URL}/member/loginCheck`, {
            method: 'POST',
            body: formData
        }).then((response) => response.json())
        .then((data) => {
            if (data.message === 'good') {    
                cookieManage(data.username, data.role, data.authkey, data.accessToken, data.refreshToken);
                
                // 사용자 역할에 따라 다른 페이지로 리다이렉트
                if (data.role === 'USER') {
                    navigate('/InfoForUser');
                } else {
                    navigate('/AutoOrderList');
                }
            } else if (data.message === 'ID_NOT_FOUND') {
                setMessage('존재하지 않는 이메일입니다.');
            } else if (data.message === 'PASSWORD_NOT_FOUND') {
                setMessage('잘못된 패스워드입니다.');
            } else {
                console.log("message = " + data.message);
                alert("시스템 장애로 로그인이 실패 했습니다.");     
            }     
        }).catch((error) => console.log(error));
    }
        
    //패스워드 입력창에서 엔터를 눌렀을때 로그인
    const onKeyDown = (e) => {
        if(e.key === 'Enter'){
            loginCheck();
        }    
    }
    
    return(
        <div className='main'>
            <h2 className='title'>네이버 스마트스토어 원재료 재고관리 시스템</h2><br />
            <div className='login'>
                <h1 style={{color: 'black', marginBottom: '25px', textAlign:'center'}}>로그인</h1>
                <input type="text" ref={emailRef} value={email} className="email" 
                        onChange={(e) => setEmail(e.target.value)} placeholder="이메일을 입력하세요." />
                <input type="password" ref={passwordRef} value={password} className="memberpasswd"  
                        onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호를 입력하세요." onKeyDown={onKeyDown}/>
                <p style={{color: 'red',textAlign:'center', marginBottom: '15px'}}>{message}</p> 
                <div className="checkbox-container">
                    <label className="checkbox-label">
                        <input type="checkbox" ref={rememberEmailRef} onChange={(e) => checkRememberEmail(e)} />
                        이메일 기억
                    </label>
                    <label className="checkbox-label">
                        <input type="checkbox" ref={rememberPasswordRef} onChange={(e) => checkRememberPassword(e)} />
                        패스워드 기억
                    </label>
                    <label className="checkbox-label">
                        <input type="checkbox" ref={rememberMeRef} onChange={(e) => checkRememberMe(e)} />
                        자동 로그인
                    </label>
                </div>
                <br />
                <input type="button" className="login_btn" value="로그인" onClick={loginCheck} />  
                <div className="bottomText">
                <br />
                    [ <Link to="/Signup">회원 가입</Link> | <Link to="/SearchID">아이디 찾기</Link> | <Link to="/SearchPassword" >패스워드 찾기</Link> ]  <br /><br />    
                </div>
            </div> 
            <br/><br/>
        </div>    
    );
};

export default Login;