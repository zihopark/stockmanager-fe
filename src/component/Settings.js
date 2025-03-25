import React, {useEffect, useState} from 'react';
import { useDate } from "./DateContext";
import { useTime } from "./TimeContext";
import Layout from "./Layout";
import { Link } from 'react-router-dom';
import '../resources/css/totalStyle.css';
import getCookie from './GetCookie';


//아래는 개발 환경 
//const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
// nginx 프록시 활용하기에 아래처럼 작성.
const API_URL = '';

const Settings = () => {
    const accessTokenCookie = getCookie('accessToken');
    const { fromDate, setFromDate } = useDate();
    const { deliveredTime, setDeliveredTime } = useTime();
    const [showWarning, setShowWarning] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch(`${API_URL}/api/get-settings`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessTokenCookie}`
                    }
                });
                const data = await response.json();
                if (data) {
                    setFromDate(data.fromDate || '');
                    setDeliveredTime(data.deliveredTime || '');
                }
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            }
        };

        fetchSettings();
    }, [setFromDate, setDeliveredTime]);


    const handleDateChange = (e) => {
        setFromDate(e.target.value);
    };

    const handleTimeChange = (e) => {
        setDeliveredTime(e.target.value);
    };

    

     // 시간 저장 시 서버로 전송하도록 수정
     const saveSettings = async () => {

        try {
            localStorage.setItem("fromDate", fromDate);
            localStorage.setItem("deliveredTime", deliveredTime);

            const response = await fetch(`${API_URL}/api/save-settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessTokenCookie}`
                },
                body: JSON.stringify({ fromDate, deliveredTime }),
            });

            if (response.ok) {
                alert("발송 처리 시간이 저장되었습니다.");
            } else {
                alert("발송 처리 시간 저장에 실패했습니다.");
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert("설정 저장 중 오류가 발생했습니다.");
        }

    };
    
    return (
        <Layout>
            <div className="settings-container">
                <h1 className="settings-title">시스템 설정</h1>
                <div className="setting-group">
                    <label htmlFor="fromDate" className="setting-label">스토어 오픈 날짜</label>
                    <input
                        type="date"
                        id="fromDate"
                        value={fromDate}
                        onChange={handleDateChange}
                        className="setting-input"
                    />
                    <p className="setting-description">상품 조회 시, 이 날짜 이후부터 업로드된 상품들을 조회합니다.</p><br />
                </div>
                
                <div className="setting-group">
                    <label htmlFor="deliveredTime" className="setting-label">발송 처리가 완료되는 시간</label>
                    <select
                        id="deliveredTime"
                        value={deliveredTime}
                        onChange={handleTimeChange}
                        className="setting-input"
                        onMouseEnter={() => setShowWarning(true)}
                        onMouseLeave={() => setShowWarning(false)}
                    >
                        {Array.from({ length: 48 }, (_, i) => {
                            const hours = Math.floor(i / 2).toString().padStart(2, '0');
                            const minutes = i % 2 === 0 ? '00' : '30';
                            const timeValue = `${hours}:${minutes}`;
                            return (
                                <option key={timeValue} value={timeValue}>
                                    {timeValue}
                                </option>
                            );
                        })}
                    </select>
                    {showWarning && (
                        <div className="warning-message">
                            <h3>시간을 바꿀 시, 주의하세요!</h3>
                            원래 시간과 수정하신 시간 사이 동안 있던 주문건이 중복으로 처리되면서 재고도 중복으로 출고처리 될 수 있습니다.
                            <br />▶시간 변경 시, 향후 재료 입출고 내역의 <span style={{color: 'red'}}>상품주문번호</span>를 통해 중복 주문건을 확인 후, 재고를 알맞게 수정하세요.
                        </div>
                    )}
                    <p className="setting-description">
                        매일 이 시간에 자동으로 주문 및 발송 내역을 업데이트하고 재고 상황을 업데이트합니다.<br />
                        설정하신 이 시간 '이후'에 현 재고 상황 확인하시면 정확한 재고 현황을 확인할 수 있습니다.
                    </p>
                </div>

                <button onClick={saveSettings} className="save-button">
                    설정 저장
                </button>
                <br />
                <div className="bulletin-board">
                    <h2>부가 서비스</h2>
                    <ul>
                        <li>
                            <Link to="/ModifyMemberPassword" className="token-link">비밀번호 변경</Link>
                        </li>
                        <li>
                            <Link to="/TokenRequestForm" className="token-link">인증토큰 직접 발급</Link>
                        </li>
                        <li>
                            <Link to="/OrderList" className="token-link">주문 내역 직접 확인</Link>
                        </li>
                    </ul>
                </div>
            </div>
            <br />
        </Layout>
    )
};

export default Settings;