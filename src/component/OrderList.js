import React, { useState, useEffect } from 'react';
import Layout from "./Layout";
import axios from 'axios';
import Loader from './Loader';
import Swal from "sweetalert2";
import getCookie from './GetCookie';

//아래는 개발 환경 
//const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
// nginx 프록시 활용하기에 아래처럼 작성.
const API_URL = '';

const OrderList = () => {
  const accessTokenCookie = getCookie('accessToken');
  const [orders, setOrders] = useState([]);
  const [orderList, setOrderList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [isoTime, setIsoTime] = useState('');
  const [confirmedTime, setConfirmedTime] = useState('');
  const [startTime, setStartTime] = useState(''); // 사용자 보기 편한 시작 시간
  const [endTime, setEndTime] = useState(''); // 사용자 보기 편한 종료 시간


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

  const handleTimeChange = (event) => {
    const inputTime = event.target.value; // 사용자가 입력한 datetime-local 값
    const date = new Date(inputTime); // 문자열을 Date 객체로 변환
    const isoString = date.toISOString(); // ISO-8601 형식으로 변환
    setSelectedTime(inputTime);
    setIsoTime(isoString);
  };

  const handleConfirmTime = () => {
    if (!isoTime) {
      Swal.fire({
        text: '시간을 먼저 선택해주세요.',
        icon:'warning'
      });
      return;
    }
    setConfirmedTime(isoTime); // 쿼리 파라미터로 form 으로 보낼 시간 설정

    const startDate = new Date(isoTime);
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // 24시간 추가

    setStartTime(comfyFormatDate(startDate)); // 사용자 친화적인 포맷으로 시작 시간 설정
    setEndTime(comfyFormatDate(endDate)); // 사용자 친화적인 포맷으로 종료 시간 설정

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

  //이미 발송된 주문건 처리 (재료 재고 감소 이후 주문건 삭제 처리)
  const manageDeliveredOrder = async () => {
    try {
      const response = await fetch(`${API_URL}/api/processingDeliveredOrders`, {
        method: "POST",
        headers: { "Authorization": "Bearer " + accessTokenCookie }
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error Details:', errorData); // 서버에서 반환된 에러 메시지 출력
        throw new Error('주문 데이터 저장에 실패했습니다.');
      }
      Swal.fire({
        text: '이미 발송된 주문건이 성공적으로 처리되었습니다.',
        icon: 'success'
      });
      await fetchOrder();
    } catch (err) {
      console.error('이미 발송된 주문건 처리 실패:', err);
      setError('이미 발송된 주문건 처리에 실패했습니다.');
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      
      if (!confirmedTime) return; // 시간이 설정되지 않았다면 API 호출하지 않음

      setLoading(true);
      setError(null); // 이전 에러 상태 초기화
      const rangeType = 'PAYED_DATETIME';
      const productOrderStatuses = 'PAYED,DELIVERING,DELIVERED';

      try {
        const response = await fetch(
          `${API_URL}/api/fetch-orders?from=${encodeURIComponent(confirmedTime)}&rangeType=${rangeType}&productOrderStatuses=${productOrderStatuses}`, {
            method: "GET",
            headers: { "Authorization": "Bearer " + accessTokenCookie }
          });

        if (!response.ok) {
          throw new Error('API 호출에 실패했습니다.');
        }

        const data = await response.json();
        //console.log(data);  // 응답 확인
        setOrders(data?.data?.contents || []);

        // 주문 데이터를 saveOrders 서버로 POST 전송
        await saveOrders(data?.data?.contents || []);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [confirmedTime]); // confirmedTime이 변경될 때만 실행


  //주문 데이터를 가져오는 useEffect
  useEffect(() => {
    fetchOrder();
  }, []);


   // 주문 데이터를 DB에 저장하는 함수
   const saveOrders = async (orderData) => {
    try {
      const response = await fetch(`${API_URL}/api/saveOrders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${accessTokenCookie}`
        },
        body: JSON.stringify({ data: { contents: orderData } }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error Details:', errorData); // 서버에서 반환된 에러 메시지 출력
        throw new Error('주문 데이터 저장에 실패했습니다.');
      }
      Swal.fire({
        text: '주문 데이터가 성공적으로 저장되었습니다.',
        icon: 'success'
      });
      await manageDeliveredOrder();
      
    } catch (err) {
      console.error('저장 실패:', err);
      setError('주문 데이터 저장에 실패했습니다.');
    }
  };

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
        const response = await axios.delete(`${API_URL}/order/delete-all`, {
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
        <h1>주문 조회 기간 설정 </h1>
        <br />
        
        <label style={{fontWeight: 'bold', fontSize: '20px'}}>
          주문 건 확인 날짜 : 
          <input
            type="datetime-local"
            value={selectedTime}
            onChange={handleTimeChange}
            style={{
              marginLeft: '10px',
              padding: '8px',
              fontSize: '14px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              transition: 'border-color 0.3s',
              outline: 'none',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#007BFF')}
            onBlur={(e) => (e.target.style.borderColor = '#ccc')}
          />
        </label> &nbsp;
        <button 
          onClick={handleConfirmTime} 
          style={{
            padding: '8px 8px',
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
          시간 설정
        </button>
        <br />
        <p style={{marginTop: '10px'}}> (위의 시간으로부터 <span style={{color: 'red'}}>24시간 동안</span> 발송되지 않은 신규 주문건을 조회합니다)</p>
        <br /><br />
        <h4>주의 : 최대한 이 쪽은 건드리지 않으시는 것을 추천드립니다.</h4>
          <p>주문건들이 자동으로 업데이트 되는 시간과 겹치게 되며, 겹치는 주문건이 중복으로 처리되면서 재고도 중복으로 출고처리 될 수 있습니다.
          <br />이 점 참고하시어, 만약 여기서 주문건 조회를 통해 중복으로 처리된 주문건이 있다면, <span style={{color: 'red'}}>상품주문번호</span>를 통해 확인하시어 재료 재고를 수정 부탁드립니다.
          </p>

        {startTime && endTime && (
          <p>
            주문 조회 기간: <strong>{startTime}</strong> ~ <strong>{endTime}</strong>
          </p>
        )}
        <br />
        <br />
      
        
        <h1 style={{marginBottom: '20px'}}>주문 목록</h1>
        <button 
          style={{ 
            backgroundColor: 'red', 
            color: 'white', 
            border: 'none', 
            padding: '5px 10px', 
            cursor: 'pointer',
            marginBottom: '10px'
          }} 
          onClick={DeleteAll} // 삭제 버튼 클릭 시 주문 삭제 함수 호출
        >
          주문건 전체 삭제
        </button>
        
        <div style={{display:'flex', justifyContent: 'center'}}>
        
          {loading ? (
              <Loader />
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
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
                {orderList.map((dborder) => (
                    dborder.productOrders && dborder.productOrders.length > 0 ? (
                      dborder.productOrders.map(productOrder => (
                        <tr key={productOrder.productOrderId}>
                          <td style={{ border: '1px solid #ddd', padding: '6px', width: '5px' }}>{dborder.orderId}</td>
                          <td style={{ border: '1px solid #ddd', padding: '6px' }}>{comfyFormatDate(new Date(dborder.paymentDate))}</td>
                          <td style={{ border: '1px solid #ddd', padding: '6px' }}>{dborder.ordererName}</td>
                          <td style={{ border: '1px solid #ddd', padding: '6px', width: '250px' }}>{productOrder.productName}</td>
                          <td style={{ border: '1px solid #ddd', padding: '6px' }}>{productOrder.productOption}</td>
                          <td style={{ border: '1px solid #ddd', padding: '6px' }}>{productOrder.quantity}</td>
                          <td style={{ border: '1px solid #ddd', padding: '6px' }}>{formatCurrency(productOrder.totalPaymentAmount)}</td>
                          <td style={{ border: '1px solid #ddd', padding: '6px' }}>
                          <button 
                              style={{ 
                                backgroundColor: 'red', 
                                color: 'white', 
                                border: 'none', 
                                padding: '3px 5px', 
                                cursor: 'pointer' 
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
                        <td style={{ border: '1px solid #ddd', padding: '6px', fontSize:'10px' }}>{dborder.orderId}</td>
                        <td style={{ border: '1px solid #ddd', padding: '6px', fontSize:'10px' }}>없음</td>
                        <td style={{ border: '1px solid #ddd', padding: '6px' }}>{comfyFormatDate(new Date(dborder.paymentDate))}</td>
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
                                cursor: 'pointer' 
                              }} 
                              onClick={() => handleDeleteOrder(dborder.orderId)} // 삭제 버튼 클릭 시 주문 삭제 함수 호출
                            >
                              삭제
                            </button>
                          </td>
                      </tr>
                    )
                  ))}
                </tbody>
            </table>
          )}
        </div>
      </Layout>
    </div>
  );
};

export default OrderList;
