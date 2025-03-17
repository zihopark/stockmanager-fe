import {useState,useRef} from 'react';
import { useNavigate } from 'react-router-dom';
import getCookie from './GetCookie';
import styled from 'styled-components';
import Layout from "./Layout";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';


const ModifyMemberPassword = () => {

    const emailCookie = getCookie('email');
    const [old_password, setOld_password] = useState('');
    const [new_password, setNew_password] = useState('');
    const [new_password1, setNew_password1] = useState('');
    const old_passwordRef = useRef();
    const new_passwordRef = useRef();
    const new_password1Ref = useRef();
    const [msg, setMsg] = useState('');
    const navigate = useNavigate();

    const passwordUpdate = async() => {

        if(old_passwordRef.value === '') { alert("기존 패스워드를 입력하세요."); 
            old_passwordRef.focus(); 
            return false; 
        }
        const Pass = new_passwordRef.current.value;
        const Pass1 = new_password1Ref.current.value;
        if(Pass === '') { alert("신규 패스워드를 입력하세요."); new_passwordRef.current.focus(); return false; }
        if(Pass1 === '') { alert("신규 패스워드를 입력하세요."); new_password1Ref.current.focus(); return false; }
        if(Pass !== Pass1) 
            { alert("입력된 신규패스워드를 확인하세요"); new_password1Ref.current.focus(); return false; }
        
        //패스워드 조건 검사
        let num = Pass.search(/[0-9]/g);
        let eng = Pass.search(/[a-z]/ig);
        let spe = Pass.search(/[`~!@@#$%^&*|₩₩₩'₩";:₩/?]/gi);	
        if(Pass.length < 8 || Pass.length > 20) { alert("암호는 8자리 ~ 20자리 이내로 입력해주세요."); return false; }
        else if(Pass.search(/\s/) !== -1){ alert("암호는 공백 없이 입력해주세요."); return false; }
        else if(num < 0 || eng < 0 || spe < 0 ){ alert("암호는 영문,숫자,특수문자를 혼합하여 입력해주세요."); return false; }
          
        let formData = new FormData();
        formData.append("email", emailCookie);
        formData.append("old_password", old_passwordRef.current.value);
        formData.append("new_password", new_passwordRef.current.value);

        await fetch(`${API_URL}/member/modifyMemberPassword`,{
            method: "POST",
            body: formData
        }).then((response) => response.json())
            .then((data) => {
                if(data.message === 'good'){
                    alert("패스워드가 변경되었습니다.")
                    logout();
                }else if(data.message === 'PASSWORD_NOT_FOUND'){
                    setMsg('기존 패스워드가 잘못되었습니다.');
                }else {
                    alert("시스템 장애로 패스워드 변경이 실패 했습니다.");
                }
            }).catch((error)=> {
                console.log(error);
            })
        
    }
    
    const logout = () => {
        let authkey = getCookie('authkey');
        let userid = getCookie('userid');
        let password = getCookie('password');
        if(authkey !== undefined)
            document.cookie = 'authkey=' + authkey + ";path=/;max-age=0";
        if(userid !== undefined)
            document.cookie = 'userid=' + userid + ";path=/;max-age=0";
        if(password !== undefined)
            document.cookie = 'password=' + password + ";path=/;max-age=0";	            
        navigate('/Login');
    }

    const goBack = () => {
        navigate(-1);
    }

    return(
        <Layout>
        <MainContainer>
            <ModifyFormContainer>
                <Title>패스워드 변경</Title>
                <InputField
                    type="password"
                    value={old_password}
                    ref={old_passwordRef}
                    onChange={(e) => setOld_password(e.target.value)}
                    placeholder="기존 패스워드를 입력하세요"
                />
                <ErrorMessage>{msg}</ErrorMessage>
                <PasswordRequirement>
                    ※ 8~20이내의 영문자, 숫자, 특수문자 조합으로 암호를 만들어 주세요.
                </PasswordRequirement>
                
                <InputField
                    type="password"
                    value={new_password}
                    ref={new_passwordRef}
                    onChange={(e) => setNew_password(e.target.value)}
                    placeholder="신규 패스워드를 입력하세요"
                />
                
                <InputField
                    type="password"
                    value={new_password1}
                    ref={new_password1Ref}
                    onChange={(e) => setNew_password1(e.target.value)}
                    placeholder="신규 패스워드를 한번 더 입력하세요"
                />
                <ButtonContainer>
                    <Button primary onClick={passwordUpdate}>
                        <b>패스워드 변경</b>
                    </Button>
                    <Button onClick={goBack}>취소</Button>
                </ButtonContainer>
            </ModifyFormContainer>
        </MainContainer>
        </Layout>
    )
}


const MainContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 90vh;
    background-color:rgb(0, 0, 0);
`;

const ModifyFormContainer = styled.div`
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
`;

const Title = styled.h1`
    text-align: center;
    color: #333;
    margin-bottom: 1.5rem;
`;

const InputField = styled.input`
    width: 100%;
    padding: 0.75rem;
    margin-bottom: 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    &:focus {
        outline: none;
        border-color: #ffde00;
    }
`;

const ErrorMessage = styled.p`
    color: red;
    text-align: center;
    margin-bottom: 1rem;
`;

const PasswordRequirement = styled.p`
    color: #666;
    font-size: 0.875rem;
    text-align: center;
    margin-bottom: 1rem;
`;

const ButtonContainer = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 1rem;
`;

const Button = styled.button`
    flex: 1;
    padding: 0.75rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s;
    
    ${props => props.primary ? `
        background-color: #ffde00;
        color: black;
        &:hover {
            background-color:rgb(255, 213, 0);
        }
    ` : `
        background-color: #f0f0f0;
        color: #333;
        &:hover {
            background-color: #e0e0e0;
        }
    `}
`;


export default ModifyMemberPassword;