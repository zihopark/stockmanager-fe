import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import Layout from "./Layout";
import Loader from './Loader';
import '../resources/css/totalStyle.css';
import { useNavigate } from 'react-router-dom';
import Swal from "sweetalert2";
import getCookie from './GetCookie';

//아래는 개발 환경 
//const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
// nginx 프록시 활용하기에 아래처럼 작성.
const API_URL = '';

const ProductDetailList = () => {
    const accessTokenCookie = getCookie('accessToken');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);  // 초기값을 false로 변경
    const [error, setError] = useState(null);
    const [combinedData, setCombinedData] = useState([]); // 새로운 상태 추가
    const navigate = useNavigate();
    const [materials, setMaterials] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [newMaterials, setNewMaterials] = useState([{ id: null, materialId: '', quantity: 1 }]);
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);


    //옵션 및 추가 상품 저장 API 호출
    const Api = useCallback(async () => {
        try {
            setError(null);
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/saveOptionSupplements`, {
                headers: { "Authorization": `Bearer ${accessTokenCookie}` }
            });
            setData(response.data);
            await fetchProductList(); // 데이터 갱신
        } catch (error) {
            setError('상품 옵션 및 추가 상품을 불러오는 데 실패했습니다.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []); // 의존성 배열을 비워두어 컴포넌트가 마운트 될 때만 실행


    //서버에서 데이터 가져오기 함수
    const fetchProductList = async () => {
        try {
            setError(null); //이전 에러 초기화
            setLoading(true);
            const combined = await axios.get(`${API_URL}/product/combined-list`, {
                headers: { "Authorization": `Bearer ${accessTokenCookie}` }
            });
            
            setCombinedData(combined.data); // 정렬된 데이터를 상태에 저장

        } catch (error) {
            setError('상품 옵션 및 추가 상품을 불러오는 데 실패했습니다.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };


    //재료 목록 가져오기
    const fetchMaterialList = async () => {
        try {
            const response = await axios.get(`${API_URL}/material/listOrderByName`, {
                headers: { "Authorization": `Bearer ${accessTokenCookie}` }
            });
            setMaterials(response.data);
        } catch (error) {
            console.error('데이터 가져오기 실패:', error.message);
        }
    };

    const triggerRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    useEffect(() => {
        // refreshTrigger 가 발생하면 fetchMaterialList호출
        fetchMaterialList();
    }, [refreshTrigger]);

    useEffect(() =>{
         // 컴포넌트가 마운트되면 fetchProductList 호출
        fetchProductList();
    }, []);


    //현재 설정되어 있는 재료를 보여줌
    const showMaterials = async (itemId, type) => {
        let url = '';
        switch (type) {
            case '단일상품':
                url = `${API_URL}/material/ofProduct/${itemId}`;
                break;
            case '옵션':
                url = `${API_URL}/material/ofOption/${itemId}`;
                break;
            case '추가상품':
                url = `${API_URL}/material/ofSupplement/${itemId}`;
                break;
            default:
                throw new Error('Unknown type');
        }
        try {
            const response = await axios.get(url, {
                headers: { "Authorization": `Bearer ${accessTokenCookie}` }
            });
            setMaterials(response.data); // 재료 데이터 설정
        } catch (error) {
            console.error('Error fetching materials:', error);
        } finally {
            setShowModal(true); // 모달 열기
        }
    };

    //상품명 클릭 시 모달 열기 위한 준비 
    const handleProductNameClick = (item) => {
        setSelectedItem(item);
        // 단일상품일 경우 originProductNo 사용해야 함.
        const itemId = item.type === '단일상품' ? item.productEntity.originProductNo : item.id;
        showMaterials(itemId, item.type); // item의 id와 type에 맞게 API 호출
    };



    //재료 추가 or 변경 버튼 클릭 시 모달을 열고 선택된 상품을 설정하는 이벤트 핸들러
    const handleProductClick = async (item) => {
        setSelectedProduct(item);
        let url;
        switch (item.type) {
            case '단일상품':
                url = `${API_URL}/material/ofProduct/${item.productEntity.originProductNo}`;
                break;
            case '옵션':
                url = `${API_URL}/material/ofOption/${item.id}`;
                break;
            case '추가상품':
                url = `${API_URL}/material/ofSupplement/${item.id}`;
                break;
            default:
                console.error('Unknown product type');
                return;
        }
        try {
            const response = await axios.get(url, {
                headers: { "Authorization": `Bearer ${accessTokenCookie}` }
            });
            if (response.data.length > 0) {
                setNewMaterials(response.data.map(material => ({
                    id: material.id,
                    materialId: material.materialId,
                    quantity: material.quantity
                })));
            } else {
                // 설정된 재료가 없는 경우 기본 필드 하나를 제공
                setNewMaterials([{ id: null, materialId: '', quantity: 1 }]);
            }
            triggerRefresh();
        } catch (error) {
            console.error("Error fetching materials:", error);
            // 에러 발생 시에도 기본 필드 하나를 제공
            setNewMaterials([{ id: null, materialId: '', quantity: 1 }]);
        }
    };
    

    //선택된 상품에 재료 추가하는 이벤트 핸들러
    const handleAddMaterial = async (e) => {
        e.preventDefault();
        console.log("Selected Product:", selectedProduct);
        
        try {
            let endpoint = "";
            let payload = newMaterials.map((material) => ({
                id: material.id,
                materialId: material.materialId,
                quantity: material.quantity,
            }));
    
            switch (selectedProduct.type) {
                case '옵션':
                    endpoint = `${API_URL}/material/match/option`;
                    payload = payload.map((item) => ({ ...item, optionId: selectedProduct.id }));
                    break;
                case '추가상품':
                    endpoint = `${API_URL}/material/match/supplement`;
                    payload = payload.map((item) => ({ ...item, supplementId: selectedProduct.id }));
                    break;
                case '단일상품':
                    endpoint = `${API_URL}/material/match/product`;
                    payload = payload.map((item) => ({ ...item, productId: selectedProduct.id }));
                    break;
                default:
                    throw new Error(`Unknown type: ${selectedProduct.type}`);
            }
    
            // 기존 payload를 변환하는 함수
            const sanitizePayload = (payload) => {
                return payload.map(item => ({
                    ...item,
                    id: item.id === "" ? null : item.id, // id가 빈 문자열이면 null로 변경
                    materialId: Number(item.materialId), // materialId를 숫자로 변환
                    productId: item.productId ? Number(item.productId) : null, // productId를 숫자로 변환
                    supplementId: item.supplementId ? Number(item.supplementId) : null, // supplementId를 숫자로 변환
                    optionId: item.optionId ? Number(item.optionId) : null, // optionId를 숫자로 변환
                }));
            };
            

            // payload 수정 후 axios 요청
            const sanitizedPayload = sanitizePayload(payload);

            const result = await axios.post(endpoint, JSON.stringify(sanitizedPayload), {
                headers: { 
                    "Authorization": `Bearer ${accessTokenCookie}`,
                    "Content-Type": "application/json" // JSON 요청 명확히 지정
                }
            });
            
    
            console.log("API 호출 결과:", result);
            fetchProductList();
            setSelectedProduct(null);
            setNewMaterials([{ id: null, materialId: '', quantity: 1 }]);
            triggerRefresh();
        } catch (error) {
            console.error("Error adding material:", error);
            setError("Failed to add material. Please check all fields are filled correctly");
        }
    };
    


    //재료 선택 또는 수량 변경 시 상태를 업데이트하는 이벤트 핸들러
    const handleMaterialChange = (index, field, value) => {
        const updatedMaterials = [...newMaterials];

        if (field === 'materialId') {
            // 이미 선택된 재료인지 확인
            const isDuplicate = updatedMaterials.some((material, i) => 
                i !== index && material.materialId === value && value !== ''
            );
        
            if (isDuplicate) {
              // 중복 선택 시 경고 메시지 표시
              Swal.fire({
                title: '중복 선택',
                text: '이미 선택된 재료입니다. 다른 재료를 선택해주세요.',
                icon: 'warning',
                confirmButtonColor: '#3085d6',
                confirmButtonText: '확인'
              });
              return; // 함수 종료
            }
          }
        // 기존 정보 유지를 위해 spread 연산자 사용
        updatedMaterials[index] = { ...updatedMaterials[index], [field]: value };
        setNewMaterials(updatedMaterials);
        triggerRefresh();
    };

    //새로운 재료 입력 필드를 추가하는 이벤트 핸들러
    const addMaterialField = () => {
        setNewMaterials([...newMaterials, { id: '', materialId: '', quantity: 1 }]);
    };

    //재료 입력 필드를 제거하는 이벤트 핸들러
    const removeMaterialField = (index) => {
        const updatedMaterials = newMaterials.filter((_, i) => i !== index);
        setNewMaterials(updatedMaterials);
    };

    //MaterialList 로 이동하는 이벤트 핸들러
    const handleNewMaterialClick = () => {
        Swal.fire({
            title: '재료 목록 화면으로 이동합니다.',
            html: "지금까지 설정한 재료 정보들은 임시저장 되지 않으니,<br>미리 저장해두시길 바랍니다.",
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

    if (error) {
        return <div>Error: {error}</div>;
    }


    // 그룹화된 데이터 생성
    const groupedData = combinedData.reduce((acc, item) => {
        const key = item.productEntity?.name;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(item);
        return acc;
    }, {});


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
                {/* 데이터 저장 버튼 */}
                <button 
                    onClick={Api}  // 버튼 클릭 시 실행되도록 설정
                    disabled={loading}
                    style={{
                        padding: '5px 10px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: 'black',
                        backgroundColor: loading ? '#aaa' : '#ffde00',
                        border: 'none',
                        borderRadius: '4px',
                        marginBottom : '20px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                        transition: 'background-color 0.3s ease',
                    }}
                >
                    {loading ? '로딩 중...' : '상품 업데이트'}
                </button>

                {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}


                <h2 style={{marginBottom: '20px'}}>상품 옵션 및 추가상품</h2>
                <div style={{display:'flex', justifyContent: 'center'}}>
                    {loading ? (
                        <Loader />
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#ffde00', color: 'black' }}>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>이미지</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px', width: '25%' }}>원 상품명</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>판매가</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>구분</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>상품 번호</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>상품명</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>추가 금액</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>재고 수량</th>
                                    <th style={{ border: '1px solid #ddd', padding: '8px' }}>재료 업데이트</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(groupedData).map(([productId, group]) => (
                                    group.map((item, index) => (
                                        <tr key={item.id}>
                                            {index === 0 && (
                                                <>
                                                    <td
                                                        rowSpan={group.length}
                                                        style={{ border: '1px solid #ddd', padding: '8px' }}
                                                    >
                                                        {item.productEntity?.representativeImage ? (
                                                            <img
                                                                src={item.productEntity.representativeImage}
                                                                alt="대표 이미지"
                                                                style={{
                                                                    width: '50px',
                                                                    height: '50px',
                                                                    objectFit: 'cover',
                                                                }}
                                                            />
                                                        ) : (
                                                            <span>이미지 없음</span>
                                                        )}
                                                    </td>
                                                    <td
                                                        rowSpan={group.length}
                                                        style={{ border: '1px solid #ddd', padding: '8px' }}
                                                    >
                                                        {item.productEntity?.name || '상품명 없음'}
                                                    </td>
                                                    <td
                                                        rowSpan={group.length}
                                                        style={{ border: '1px solid #ddd', padding: '8px' }}
                                                    >
                                                        {item.price.toLocaleString()}원
                                                    </td>
                                                </>
                                            )}
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.type}</td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.id}</td>
                                            <td 
                                                onClick={() => handleProductNameClick(item)} 
                                                style={{ 
                                                    border: '1px solid #ddd', 
                                                    padding: '8px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease',
                                                    position: 'relative',
                                                    overflow: 'hidden'
                                                }}
                                                className="product-name-cell"
                                            >
                                                {item.type === '단일상품'
                                                    ? item.name.length > 15 
                                                        ? `${item.name.substring(0, 10)}ㆍㆍㆍ` 
                                                        : item.name
                                                    : item.name
                                                }
                                            </td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                                {item.type === '옵션'
                                                    ? item.addedPrice
                                                        ? `+${item.addedPrice.toLocaleString()}원`
                                                        : 'X'
                                                    : `${item.addedPrice.toLocaleString()}원`}
                                            </td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                                {item.stockQuantity}
                                            </td>
                                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                                                <button 
                                                    onClick={() => handleProductClick(item)}
                                                    style={{
                                                        padding: '2px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                   추가 or 변경
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ))}
                            </tbody>
                        </table>
                    )}    
                </div>
                {showModal && selectedItem && ( //상품명 클릭 - 현재 설정된 재료 보여줌
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <span className="modal-title">
                                {selectedItem.name.length > 12 
                                    ? `${selectedItem.name.substring(0, 10)}ㆍㆍㆍ` 
                                    : selectedItem.name}의 구성 재료
                                </span>
                                <button 
                                    className="close-button"
                                    onClick={() => setShowModal(false)}
                                >
                                    X
                                </button>
                            </div>
                            <div className="modal-body">
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                border: '1px solid #ddd'
                            }}>
                                    <thead>
                                        <tr style={{backgroundColor: '#2E2E2E', color: 'white' }}>
                                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>재료 이미지</th>
                                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>재료 이름</th>
                                            <th style={{ border: '1px solid #ddd', padding: '8px' }}>수량</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {materials.length > 0 ? (
                                            materials.map((material, index) => (
                                                <tr key={material.materialId || index}>
                                                    <td style={{ border: '1px solid #ddd', padding: '5px', color: 'black' }}>
                                                        {material.materialImageUrl ? (
                                                            <img
                                                                src={material.materialImageUrl}
                                                                alt="대표 이미지"
                                                                style={{
                                                                    width: '50px',
                                                                    height: '50px',
                                                                    objectFit: 'cover',
                                                                }}
                                                            />
                                                        ) : (
                                                            <span>이미지 없음</span>
                                                        )}
                                                    </td>
                                                    <td style={{ border: '1px solid #ddd', padding: '8px', color: 'black' }}>{material.materialName}</td>
                                                    <td style={{ border: '1px solid #ddd', padding: '8px', color: 'black' }}>{material.quantity}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" style={{ border: '1px solid #ddd', padding: '8px', color: 'black', textAlign: 'center' }}>
                                                    아직 재료가 설정되지 않았습니다.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {selectedProduct && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <span className="modal-title">{selectedProduct.name}</span>
                                <button 
                                    className="close-button"
                                    onClick={() => setSelectedProduct(null)}
                                    disabled={loading}
                                >
                                    X
                                </button>
                            </div>
                            <div className="modal-body">
                                <img
                                    className="product-image"
                                    src={selectedProduct.productEntity.representativeImage}
                                    alt={selectedProduct.name}
                                />
                                <span className="modal-subtitle">[ 재료 설정/업데이트 ]</span>
                                <form onSubmit={handleAddMaterial}>
                                    {newMaterials.map((material, index) => (
                                        <div key={index} className="material-row">
                                            <input type="hidden" value={material.id || ''} />
                                            <select
                                                className="material-name-select"
                                                value={material.materialId}
                                                onChange={(e) => handleMaterialChange(index, 'materialId', e.target.value)}
                                                required
                                            >
                                                <option value="">재료 선택</option>
                                                {materials.map((m) => (
                                                    <option key={m.id} value={m.id}>
                                                        {m.name}
                                                    </option>
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
                                            {index > 0 && (
                                                <button
                                                    type="button"
                                                    className="remove-button"
                                                    onClick={() => removeMaterialField(index)}
                                                >
                                                    -
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                className="add-button"
                                                onClick={addMaterialField}
                                            >
                                                +
                                            </button>
                                        </div>
                                    ))}
                                    <div className="form-actions">
                                        <button 
                                            type="button" 
                                            className="new-material-button"
                                            onClick={handleNewMaterialClick}
                                        >
                                            새로운 재료 등록
                                        </button>
                                        <button type="submit" className="submit-button">
                                            재료 설정 완료
                                        </button>
                                    </div>
                                </form>
                                
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

export default ProductDetailList;
