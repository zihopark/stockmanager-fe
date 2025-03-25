import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Layout from "./Layout";
import Loader from './Loader';
import { DateContext } from "./DateContext";
import getCookie from './GetCookie';

//아래는 개발 환경 
//const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
// nginx 프록시 활용하기에 아래처럼 작성.
const API_URL = '';

const ProductList = () => {
    const accessTokenCookie = getCookie('accessToken');
    const { fromDate } = useContext(DateContext); // 컨텍스트 값 가져오기
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);

    //상품 목록 가져오기
    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/product/total/list`, {
                headers: { "Authorization": `Bearer ${accessTokenCookie}` }
            });
            //console.log(response.data); // data 확인
            setProducts(response.data);
            
        } catch (error) {
            console.error('데이터 가져오기 실패:', error.message);
        } finally {
            setLoading(false);
        }
    };

    // 상품 저장 API 호출
    const saveProducts = async () => {

        setLoading(true);
        setMessage('');

        try {
            const response = await axios.post(
                `${API_URL}/api/saveProducts`, 
                {}, // 빈 객체를 전달
                {
                    params: { fromDate },
                    headers: { "Authorization": `Bearer ${accessTokenCookie}` }
                }
            );
            
            
            setMessage(response.data);
            await fetchData(); //데이터 갱신
        } catch (error) {
            setMessage('오류 발생: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };


    // 데이터 가져오기
    useEffect(() => {
        fetchData();
    }, []);

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

    return (
        <Layout>
        <div
            style={{
                alignItems: 'center',
                padding: '20px', 
                margin: '10px',
                textAlign: 'center' 
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '10px', // 간격 설정
                    marginBottom: '30px',
                }}
            >
                <button
                    onClick={saveProducts}
                    disabled={loading}
                    style={{
                        padding: '5px 10px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'black',
                        backgroundColor: loading ? '#aaa' : '#ffde00',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                        transition: 'background-color 0.3s ease',
                    }}
                >
                    {loading ? '로딩 중...' : '업데이트'}
                </button>{message && <div>{message}</div>}<br />
            </div>
            
            <h2 style={{marginBottom: '20px'}}>상품 목록</h2>
            <div style={{display:'flex', justifyContent: 'center'}}>
                {loading ? (
                    <Loader />
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#ffde00', color: 'black' }}>
                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>상품 번호</th>
                                <th style={{ width: '30%', border: '1px solid #ddd', padding: '8px' }}>상품명</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>실 판매가</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>전체 재고</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>이미지</th>
                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>제품 등록일</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.originProductNo}>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{product.originProductNo}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{product.name}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{(product.discountedPrice).toLocaleString()}원</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{product.stockQuantity}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                        <img
                                            src={product.representativeImage}
                                            alt={product.name}
                                            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                        />
                                    </td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatDate(product.regDate)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}    
            </div>

        </div>
        </Layout>
    );
};



export default ProductList;
