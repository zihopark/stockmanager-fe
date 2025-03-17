import { useNavigate } from 'react-router-dom';

const logoutButtonStyle = {
    padding: "8px 15px",
    backgroundColor:" #dedede",
    color: "black",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  };

const InfoForUser = () => {
    const navigate = useNavigate();

    const goBack = () => {
        navigate(-1);
    }
    
    
    return (
        <div className='App'>
            <span style={{marginBottom: '20px'}}>
                관리자가 권한을 부여해야만 서비스를 이용할 수 있습니다.<br />
                관리자에게 접근 권한을 요청하세요.
            </span>
            <button onClick={goBack} style={logoutButtonStyle}>돌아가기</button>        
        </div>
    )
}

export default InfoForUser;