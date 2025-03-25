import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import getCookie from './GetCookie';
import { Link } from 'react-router-dom';
import Layout from "./Layout";
import Loader from './Loader';
import '../resources/css/totalStyle.css';

//아래는 개발 환경 
//const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
// nginx 프록시 활용하기에 아래처럼 작성.
const API_URL = '/api';

const MasterPage = () => {
    const accessTokenCookie = getCookie('accessToken');
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState([]);


    //회원 목록 다 가져오기
    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/master/memberList`, {
                method: 'GET',
                headers: { "Authorization": "Bearer " + accessTokenCookie }
            });
            const data = await response.json(); // response.json()으로 데이터 파싱
            //console.log(data); // 파싱된 데이터 확인
            setMembers(data);
        } catch (error) {
            console.error('데이터 가져오기 실패:', error.message);
            setMembers([]); // 에러 발생 시 빈 배열로 설정
        } finally {
            setLoading(false);
        }
    };
    
    
    // 날짜 포맷팅 함수
    const formatDate = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
    
        // 년, 월, 일을 추출하여 "yyyy-MM-dd" 형식으로 반환
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
        const day = String(date.getDate()).padStart(2, '0');
    
        return `${year}-${month}-${day}`;
    };

    // 데이터 가져오기
    useEffect(() => {
        fetchData();
    }, [accessTokenCookie]);


    //역할 바꾸기
    const handleRoleChange = (email, newRole) => {
        setMembers(prevMembers => 
            prevMembers.map(member => 
                member.email === email ? {...member, role: newRole} : member
            )
        );
    };
    

    //설정 저장하기
    const saveSettings = async () => {
        try {
            const response = await axios.post(`${API_URL}/master/updateRole`, 
                members.map(({email, role}) => ({email, role})),
                {
                    headers: {
                        "Content-Type": "application/json",
                        'Authorization': `Bearer ${accessTokenCookie}`
                    }
                }
            );
            if (response.status === 200) {
                alert("회원 Role 업데이트 완료");
            } else {
                alert("회원 Role 업데이트 실패");
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert("설정 저장 중 오류가 발생했습니다.");
        }
    };
    

    return(
        <div>
            <Layout>
                <div className="settings-container">
                    <h1 className="settings-title">회원 관리</h1>
                    <div className="setting-group">
                        <label className="setting-label">회원 전체 목록</label>
                        <div style={{display:'flex', justifyContent: 'center'}}>
                        {loading ? (
                            <Loader />
                        ) : members && members.length > 0 ? (
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#ffde00', color: 'black' }}>
                                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>회원 이름</th>
                                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>역할</th>
                                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>이메일</th>
                                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>전화번호</th>
                                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>최근 로그인 날짜</th>
                                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>회원 등록일</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {members.map((member) => (
                                            <tr key={member.email}>
                                                <td style={{ border: '1px solid #ddd', color: 'black', padding: '8px' }}>{member.username}</td>
                                                <td style={{ border: '1px solid #ddd', color: 'black', padding: '8px' }}>
                                                    <select
                                                        value={member.role}
                                                        onChange={(e) => handleRoleChange(member.email, e.target.value)}
                                                        style={{ width: '100%', padding: '5px' }}
                                                    >
                                                        <option value="USER">USER</option>
                                                        <option value="MANAGER">MANAGER</option>
                                                        <option value="MASTER">MASTER</option>
                                                    </select>
                                                </td>
                                                <td style={{ border: '1px solid #ddd', color: 'black', padding: '8px' }}>{member.email}</td>
                                                <td style={{ border: '1px solid #ddd', color: 'black', padding: '8px' }}>{member.telno}</td>
                                                <td style={{ border: '1px solid #ddd', color: 'black', padding: '8px' }}>{formatDate(member.lastlogindate)}</td>
                                                <td style={{ border: '1px solid #ddd', color: 'black', padding: '8px' }}>{formatDate(member.regdate)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p>데이터가 없습니다.</p>
                            )}   
                        </div><br />
                        <p className="setting-description"><b>회원 Role 기준</b><br /> * USER: 회원 가입만 한 회원<br /> * MANAGER: 서비스 전체 이용 가능</p><br />
                    </div>
                    
                    <button onClick={saveSettings} className="save-button">
                        설정 저장
                    </button>
                    <br />
                </div>
            </Layout>
        </div>
    );
    
}

export default MasterPage;