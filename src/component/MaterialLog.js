import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from "./Layout";
import Loader from './Loader';
import getCookie from './GetCookie';
import { useNavigate } from 'react-router-dom';
import Swal from "sweetalert2";
import '../resources/css/totalStyle.css';
import { BsFillPatchQuestionFill, BsFillPatchMinusFill, BsFillPatchPlusFill } from 'react-icons/bs';


const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';


const MaterialLog = () => {
    const accessTokenCookie = getCookie('accessToken');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [materials, setMaterials] = useState([]);
    const [logs, setLogs] = useState([]);
    const navigate = useNavigate();
    const [modalType, setModalType] = useState('');
    const [newMaterials, setNewMaterials] = useState([{ materialId: '', quantity: 1, content:'', type: 'outbound', isBad: false, isUserInput: 'Y' }]);

    //재료 목록 가져오기
    const fetchMaterialList = async () => {
        try {
            const response = await axios.get(`${API_URL}/material/list`, {
                headers: { "Authorization": `Bearer ${accessTokenCookie}` }
            });
            setMaterials(response.data);
        } catch (error) {
            console.error('재료데이터 가져오기 실패:', error.message);
        }
    };

    const fetchLog = async () => {
        try {
            const response = await axios.get(`${API_URL}/material/log/list`, {
                headers: { "Authorization": `Bearer ${accessTokenCookie}` }
            });
            setLogs(response.data);
        } catch (error) {
            console.error('로그 데이터 가져오기 실패:', error.message);
        }
    };


    useEffect(() =>{
        // 컴포넌트가 마운트되면 호출
        fetchMaterialList();
        fetchLog();
    }, []);


    //button 클릭 시
    const handleButtonClick = async (type) => {
        setModalType(type);
        setNewMaterials([{ materialId: '', quantity: 1, content: '', type: '', isBad: false, isUserInput: 'Y' }]);
        setIsModalOpen(true);
    };


    //stockLog 추가 및 재고 증감 관리 이벤트 핸들러
    const handleStockLog = async (e, modalType) => {
        e.preventDefault();
        const updatedMaterials = newMaterials.map(material => ({
            ...material,
            type: material.isBad ? 'bad' : modalType
        }));
        //console.log("서버에 보낼 정보:", updatedMaterials);
        try {
            const results = await Promise.all(updatedMaterials.map(async (material) => {
                const endpoint = `${API_URL}/material/addLog`;
                return await axios.post(endpoint, {
                        materialId: material.materialId,
                        quantity: material.quantity,
                        content: material.content,
                        type: material.type,
                        isUserInput: material.isUserInput
                    }, {
                    headers: {
                      "Content-Type": "application/json",
                      'Authorization': `Bearer ${accessTokenCookie}`
                    }
                });
            }));

            if (results.status === 201){
                Swal.fire({
                    text:'성공적으로 재고 처리가 완료되었습니다.',
                    icon: 'success'
                });
            }
            console.log("API 호출 결과:", results);
            setNewMaterials([{ materialId: '', quantity: 1, content: '', type: 'outbound', isBad: false, isUserInput: 'Y' }]);
            setIsModalOpen(false);
            fetchLog();
        } catch (error) {
            console.error("재고 처리 에러:", error);
        }
    };


    //MaterialList 로 이동하는 이벤트 핸들러
    const handleNavigateClick = () => {
        Swal.fire({
            title: '재료 목록 화면으로 이동합니다.',
            html: "지금까지 설정한 정보들은 임시저장 되지 않으니,<br>미리 저장해두시길 바랍니다.",
            icon: 'warning',

            showCancelButton: true, // cancel버튼 보이기. 기본은 원래 없음
            confirmButtonColor: '#3085d6', 
            cancelButtonColor: '#d33', 
            confirmButtonText: '이동하기',
            cancelButtonText: '취소', 
            
            reverseButtons: true, // 버튼 순서 거꾸로
        }).then(result => {
            if (result.isConfirmed) {
                navigate('./../MaterialList');
            }
        })
    };

    //재료 선택 또는 수량 변경 시 상태를 업데이트하는 이벤트 핸들러
    const handleMaterialChange = (index, field, value) => {
        setNewMaterials((prevMaterials) => {
            const updatedMaterials = [...prevMaterials];
                if (field === 'isBad') {
                updatedMaterials[index] = {
                    ...updatedMaterials[index],
                    isBad: value,
                    type: value ? 'bad' : 'outbound'
                };
                } else {
                updatedMaterials[index] = {
                    ...updatedMaterials[index],
                    [field]: value
                };
            }
            if (field === 'materialId') {
                const isDuplicate = updatedMaterials.some((material, i) =>
                    i !== index && material.materialId === value && value !== ''
                );
                if (isDuplicate) {
                    Swal.fire({
                        title: '중복 선택',
                        text: '이미 선택된 재료입니다. 다른 재료를 선택해주세요.',
                        icon: 'warning',
                        confirmButtonColor: '#3085d6',
                        confirmButtonText: '확인'
                    });
                    return prevMaterials; // 기존 상태를 반환하여 업데이트 방지
                }
            }
            return updatedMaterials; // 업데이트된 상태 반환
        });
    };
    
    
    // 날짜와 시간 포맷팅 함수
    const formatDate = (isoString) => {
        if (!isoString) return { date: '', time: '' };
        const date = new Date(isoString);

        // 날짜 포맷팅 (yyyy-MM-dd)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        // 시간 포맷팅 (HH:mm)
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const formattedTime = `${hours}:${minutes}`;

        return `${formattedDate} ${formattedTime}`;
    };

    //새로운 재료 입력 필드를 추가하는 이벤트 핸들러
    const addMaterialField = () => {
        setNewMaterials([...newMaterials, { materialId: '', quantity: 1, content:'', type: '', isBad: false, isUserInput: 'Y'  }]);
    };

    //재료 입력 필드를 제거하는 이벤트 핸들러
    const removeMaterialField = (index) => {
        const updatedMaterials = newMaterials.filter((_, i) => i !== index);
        setNewMaterials(updatedMaterials);
    };


    //Log 한 건씩 삭제 
    const handleDeleteLog = async (id) => {
        if (window.confirm('정말로 이 로그를 삭제하시겠습니까? \n삭제 이후에는 로그 복구가 불가능합니다.')){
        try {
            const response = await axios.delete(`${API_URL}/material/log/delete/${id}`, {
                headers: { "Authorization": `Bearer ${accessTokenCookie}` }
            });
            if (response.status === 200) {
            Swal.fire({
                text:'로그가 성공적으로 삭제되었습니다.',
                icon: 'success'
            });
            fetchLog();
            }
        } catch (error) {
            console.error('로그 삭제 실패:', error.message);
            Swal.fire({
            text:'로그 삭제에 실패했습니다.',
            icon: 'error'
            });
        }
        }
    };


    //Log 전체 삭제
    const DeleteAll = async () => {
        const result = await Swal.fire({
        title: '전체 로그 삭제',
        html: '전체 로그를 삭제하시겠습니까?<br />삭제 이후에는 로그 복구가 불가능합니다.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: '삭제',
        cancelButtonText: '취소'
        });
    
        if (result.isConfirmed) {
            try {
                const response = await axios.delete(`${API_URL}/material/log/delete-all`, {
                    headers: { "Authorization": `Bearer ${accessTokenCookie}` }
                });
                Swal.fire({
                    text:'모든 로그가 성공적으로 삭제되었습니다.',
                    icon: 'success'
                });
                await fetchLog();
            } catch (error) {
                console.error('로그 삭제 실패:', error.message);
                Swal.fire({
                    text:'로그 삭제에 실패했습니다.',
                    icon: 'error'
                });
            }
        }
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
                        alignItems: 'center',
                        padding: '20px', 
                        margin: '10px',
                        textAlign: 'center',
                        display: 'flex', /* Flexbox 사용 */
                        flexWrap: 'wrap', /* 필요시 줄 바꿈 */
                        justifyContent: 'center' /* 가운데 정렬 */
                    }}
                >
                    <button className='log-button log-add-button' onClick={() => handleButtonClick('inbound')}>
                    <span className='log-button-icon'><BsFillPatchPlusFill /></span>
                        <span className='log-button-text'>입고하기</span>
                    </button>

                    <button className='log-button log-hold-button' onClick={() => handleButtonClick('onhold')}>
                    <span className='log-button-icon'><BsFillPatchQuestionFill /></span>
                        <span className='log-button-text'>보류하기</span>
                    </button>

                    <button className='log-button log-minus-button' onClick={() => handleButtonClick('outbound')}>
                        <span className='log-button-icon'><BsFillPatchMinusFill /></span>
                        <span className='log-button-text'>재고 빼기</span>
                    </button>

                </div>


                <h2 style={{marginBottom: '20px'}}>전체 재료 입출고 내역</h2>
                <button className="delete-all-button" onClick={DeleteAll}>
                    로그 전체 삭제
                </button>
                <div style={{display:'flex', justifyContent: 'center'}}>
                
                    {loading ? (
                        <Loader />
                    ) : (
                        <table className="order-table">
                            <thead>
                                <tr style={{ backgroundColor: '#ffde00', color: 'black' }}>
                                    <th style={{ border: '1px solid #ddd', padding: '5px', width:'70px' }}>분류</th>
                                    <th style={{ border: '1px solid #ddd', padding: '5px', width:'70px' }}>사용자 작성</th>
                                    <th style={{ border: '1px solid #ddd', padding: '5px' }}>재료명</th>
                                    <th style={{ border: '1px solid #ddd', padding: '5px' }}>증감 재고 수</th>
                                    <th style={{ border: '1px solid #ddd', padding: '5px' }}>기록 시간</th>
                                    <th style={{ border: '1px solid #ddd', padding: '5px' }}>내용</th>
                                    <th style={{ border: '1px solid #ddd', padding: '5px' }}>개별 삭제</th>
                                </tr>
                            </thead>
                            <tbody>
                            {logs.map((log) => 
                                <tr key={log.id}>
                                    <td style={{ border: '1px solid #ddd', padding: '5px' }}>
                                        {log.type === 'inbound' ? '입고' : 
                                         log.type === 'bad' ? '불량' : 
                                         log.type === 'onhold' ? '보류' : '출고'}
                                        </td>
                                    <td style={{ border: '1px solid #ddd', padding: '5px' }}>{log.isUserInput}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '5px' }}>{log.materialName}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '5px' }}>
                                        {log.type === 'inbound' ? '+' : 
                                         log.type === 'outbound' || log.type === 'bad' ? '-' :
                                         log.type === 'onhold' ? '···' : ''}{log.quantity}
                                    </td>
                                    <td style={{ border: '1px solid #ddd', padding: '5px' }}>{formatDate(log.logDate)}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '5px' }}>{log.content}</td>
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
                                            onClick={() => handleDeleteLog(log.id)} 
                                        >
                                        삭제
                                        </button>
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
            {isModalOpen && (
                <div className="modal-overlay">
                <div className="modal-content">
                    <div className="modal-header">
                        <span className="modal-title">
                            {modalType === 'inbound' ? '재료 입고하기' : 
                            modalType === 'outbound' || modalType === 'bad' ? '재고 빼기' : 
                            modalType === 'onhold' ? '재고 보류하기' : '재고 빼기'}
                        </span>
                        <button className="close-button" onClick={() => setIsModalOpen(false)}>X</button>
                    </div>
                    <div className="modal-header">
                        {(modalType === 'outbound' || modalType === 'bad') && (
                            <span style={{fontSize: '14px', fontWeight: 'bold', color: 'black'}}>
                                불량품이나 반품/교환 등으로 인해 별도로 출고된 건을 기록하세요
                            </span>
                        )}
                        {(modalType === 'onhold') && (
                            <span style={{fontSize: '14px', fontWeight: 'bold', color: 'black'}}>
                                판매가 애매하거나 그렇다고 불량 처리도 애매한 제품을 기록해두세요
                            </span>
                        )}
                    </div>
                    <div className="modal-body">
                    <form onSubmit={(e) => handleStockLog(e, modalType)}>
                        {newMaterials.map((material, index) => (
                        <div key={index} className="material-row">
                             {(modalType === 'outbound' || modalType === 'bad') && (
                                <div className="bad-checkbox-container">
                                    <label htmlFor={`bad-checkbox-${index}`} className="bad-checkbox-label" data-tooltip="불량이면 체크">
                                        <input
                                            type="checkbox"
                                            id={`bad-checkbox-${index}`}
                                            checked={material.isBad || false}
                                            onChange={(e) => {
                                                handleMaterialChange(index, 'isBad', e.target.checked);
                                            }}
                                        /><span class="checkmark"></span>불량
                                    </label>
                                </div>
                            )}
                            <select
                                className="material-name-select"
                                value={material.materialId}
                                onChange={(e) => handleMaterialChange(index, 'materialId', e.target.value)}
                                required
                            >
                            <option value="">재료 선택</option>
                            {materials.map((m) => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                            </select>
                            <input
                                className="material-quantity"
                                type="number"
                                value={material.quantity}
                                onChange={(e) => handleMaterialChange(index, 'quantity', Number(e.target.value))}
                                min="1"
                                required
                            />
                           
                            <input
                                className="material-content"
                                type="text"
                                value={material.content}
                                placeholder='필요 시 코멘트를 입력하세요'
                                onChange={(e) => handleMaterialChange(index, 'content', e.target.value)}
                            />
                            {index > 0 && (
                                <button type="button" className="remove-button" onClick={() => removeMaterialField(index)}>-</button>
                            )}
                            <button type="button" className="add-button" onClick={addMaterialField}>+</button>
                        </div>
                        ))}
                        <div className="form-actions">
                        {modalType === 'inbound' && (
                            <button type="button" className="new-material-button" onClick={handleNavigateClick}>
                                새로운 재료 등록
                            </button>
                        )}
                        <button type="submit" style={{
                            padding:'5px 10px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            backgroundColor: '#ffde00',
                            color:'black',
                            border:'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}>
                            저장
                        </button>
                        </div>
                    </form>
                    </div>
                </div>
                </div>
            )}
        </Layout>
    );
}

export default MaterialLog;