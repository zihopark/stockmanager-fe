import React, { useState, useEffect } from 'react';
import Layout from "./Layout";
import axios from 'axios';
import Loader from './Loader';
import Swal from "sweetalert2";
import getCookie from './GetCookie';
import '../resources/css/totalStyle.css';
import { useTime } from "./TimeContext";
import { Link } from 'react-router-dom';


const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';


const AutoOrderList = () => {
  const accessTokenCookie = getCookie('accessToken');
  const [orderList, setOrderList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { deliveredTime } = useTime();



  // 보기 편한 포맷으로 날짜 변환
  const comfyFormatDate = (date) => {
      const options = {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false // AM/PM 표시를 위해 설정
      };

      // 날짜를 포맷하여 문자열로 변환
      const formattedDate = date.toLocaleString('ko-KR', options);

      // 슬래시 중복 문제 해결 및 AM/PM 형식 조정
      return formattedDate.replace(/\/\s+/g, '/').replace(/\s+/g, ' ').trim(); 
  };

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/order/list`, {
        headers: { "Authorization": `Bearer ${accessTokenCookie}` }
      });
      if (Array.isArray(response.data)) {
        setOrderList(response.data);  // 데이터를 배열로 설정
      } else {
        setOrderList([]);  // 배열이 아닐 경우 빈 배열 설정
      }
    } catch (error) {
      console.error('데이터 가져오기 실패:', error.message);
      setError('주문 데이터를 가져오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  //주문 데이터를 가져오고 useEffect
  useEffect(() => {
    fetchOrder();
  }, []);


  //주문 한 건씩 삭제 
  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('정말로 이 주문을 삭제하시겠습니까? \n삭제 이후에는 주문 건 복구가 불가능합니다.')){
      try {
        const response = await axios.delete(`${API_URL}/order/delete/${orderId}`, {
          headers: { "Authorization": `Bearer ${accessTokenCookie}` }
        });
        if (response.status === 200) {
          Swal.fire({
            text:'주문이 성공적으로 삭제되었습니다.',
            icon: 'success'
          });
          // 목록에서 삭제된 주문 제거
          setOrderList(orderList.filter(order => order.orderId !== orderId));
        }
      } catch (error) {
        console.error('주문 삭제 실패:', error.message);
        Swal.fire({
          text:'주문 삭제에 실패했습니다.',
          icon: 'error'
        });
      }
    }
  };

  //주문 전체 삭제
  const DeleteAll = async () => {
    const result = await Swal.fire({
      title: '전체 주문 삭제',
      html: '전체 주문을 삭제하시겠습니까?<br />삭제 이후에는 전체 복구가 불가능합니다.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: '삭제',
      cancelButtonText: '취소'
    });
  
    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/order/delete-all`, {
          headers: { "Authorization": `Bearer ${accessTokenCookie}` }
        });
        Swal.fire({
          text:'모든 주문이 성공적으로 삭제되었습니다.',
          icon: 'success'
        });
        await fetchOrder();
      } catch (error) {
        console.error('주문 삭제 실패:', error.message);
        Swal.fire({
          text:'주문 삭제에 실패했습니다.',
          icon: 'error'
        });
      }
    }
  };

  // 금액 포맷팅 함수
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount); // 한국 형식으로 포맷팅
  };

  return (
    <div>
      <Layout>
      <div className="order-list-container">
        <div className="orderlist-container">
        <Link to="/Settings" style={{ textDecoration: 'none', color: 'black' }}>
          <h3>자동 업데이트 시간 → {deliveredTime}</h3>
        </Link>
        </div>
        <br /><br />
        
        <h1>주문 목록</h1><br />
        <button className="delete-all-button" onClick={DeleteAll}>
          주문건 전체 삭제
        </button>
        
        <div style={{display:'flex', justifyContent: 'center'}}>
        
          {loading ? (
              <Loader />
          ) : (
            <table className="order-table">
                <thead>
                    <tr style={{ backgroundColor: '#ffde00', color: 'black' }}>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>주문 번호</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>결제일</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>주문자</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>주문 제품</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>옵션</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>수량</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>결제 금액</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px' }}>삭제</th>
                    </tr>
                </thead>
                <tbody>
                  {/* 주문 목록이 비었는지 확인 */}
                  {orderList.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '15px', fontSize: '18px' }}>
                        현재 신규 주문건이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    orderList.map((dborder) =>
                      dborder.productOrders && dborder.productOrders.length > 0 ? (
                        dborder.productOrders.map((productOrder) => (
                          <tr key={productOrder.productOrderId}>
                            <td style={{ border: '1px solid #ddd', padding: '6px', width: '5px' }}>
                              {dborder.orderId}
                            </td>
                            <td style={{ border: '1px solid #ddd', padding: '6px' }}>
                              {comfyFormatDate(new Date(dborder.paymentDate))}
                            </td>
                            <td style={{ border: '1px solid #ddd', padding: '6px' }}>{dborder.ordererName}</td>
                            <td style={{ border: '1px solid #ddd', padding: '6px', width: '250px' }}>
                              {productOrder.productName}
                            </td>
                            <td style={{ border: '1px solid #ddd', padding: '6px' }}>
                              {productOrder.productOption}
                            </td>
                            <td style={{ border: '1px solid #ddd', padding: '6px' }}>{productOrder.quantity}</td>
                            <td style={{ border: '1px solid #ddd', padding: '6px' }}>
                              {formatCurrency(productOrder.totalPaymentAmount)}
                            </td>
                            <td style={{ border: '1px solid #ddd', padding: '6px' }}>
                              <button
                                style={{
                                  backgroundColor: 'red',
                                  color: 'white',
                                  border: 'none',
                                  padding: '3px 5px',
                                  cursor: 'pointer',
                                }}
                                onClick={() => handleDeleteOrder(dborder.orderId)} // 삭제 버튼 클릭 시 주문 삭제 함수 호출
                              >
                                X
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr key={dborder.orderId}>
                          <td style={{ border: '1px solid #ddd', padding: '6px', fontSize: '10px' }}>
                            {dborder.orderId}
                          </td>
                          <td style={{ border: '1px solid #ddd', padding: '6px', fontSize: '10px' }}>없음</td>
                          <td style={{ border: '1px solid #ddd', padding: '6px' }}>
                            {comfyFormatDate(new Date(dborder.paymentDate))}
                          </td>
                          <td style={{ border: '1px solid #ddd', padding: '6px' }}>{dborder.ordererName}</td>
                          <td colSpan="4">상품 정보가 없습니다.</td>
                          <td style={{ border: '1px solid #ddd', padding: '6px' }}>
                            <button
                              style={{
                                backgroundColor: 'red',
                                color: 'white',
                                border: 'none',
                                fontWeight: 'bold',
                                padding: '3px 5px',
                                cursor: 'pointer',
                              }}
                              onClick={() => handleDeleteOrder(dborder.orderId)} // 삭제 버튼 클릭 시 주문 삭제 함수 호출
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
            </table>
          )}
        </div>
        </div>
      </Layout>
    </div>
  );
};

export default AutoOrderList;
