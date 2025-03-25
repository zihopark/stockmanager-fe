import React, { useState } from 'react';
import axios from 'axios';
import Layout from "./Layout";
import getCookie from './GetCookie';
import { useNavigate } from 'react-router-dom';


//아래는 개발 환경 
//const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
// nginx 프록시 활용하기에 아래처럼 작성.
const API_URL = '';

const TokenRequestForm = () => {
    const accessTokenCookie = getCookie('accessToken');
    const [clientId, setClientId] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // POST 요청을 백엔드로 보냄
            const response = await axios.post(`${API_URL}/api/token`, {
                clientId: clientId.trim(),
                clientSecret: clientSecret.trim(),
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessTokenCookie}`
                },
            });

        } catch (error) {
            setError('요청 중 오류 발생: ' + (error.response?.data?.message || error.message));
        }
    };

    const goBack = () => {
        navigate(-1);
    }

    return (
        <Layout>
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
            <div style={{ maxWidth: '400px', margin: 'auto auto', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
                <h2>토큰 요청 폼</h2> <br />
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '10px' }}>
                        <label htmlFor="clientId">애플리케이션 ID:</label>
                        <input
                            type="text"
                            id="clientId"
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                            required
                            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label htmlFor="clientSecret">애플리케이션 시크릿:</label>
                        <input
                            type="password"
                            id="clientSecret"
                            value={clientSecret}
                            onChange={(e) => setClientSecret(e.target.value)}
                            required
                            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                        />
                    </div><br />
                    <button type="submit" style={{ padding: '10px 20px', marginRight: '10px', backgroundColor: '#ffde00', color: 'black', border: 'none', borderRadius: '5px' }}>
                        <b>토큰 요청</b>
                    </button>
                    <input type="button" style={{ padding: '10px 20px', backgroundColor: '#white', color: 'black', border: 'none', borderRadius: '5px' }} value="취소" onClick={goBack} />
                    
                </form>

                {token && (
                    <div style={{ marginTop: '20px', color: 'green' }}>
                        <strong>발급된 토큰:</strong>
                        <p>{token}</p>
                    </div>
                )}

                {error && (
                    <div style={{ marginTop: '20px', color: 'red' }}>
                        <strong>에러:</strong>
                        <p>{error}</p>
                    </div>
                )}
            </div>
        </div>
        </Layout>
    );
};

export default TokenRequestForm;