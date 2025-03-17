import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import getCookie from './GetCookie';
import Layout from "./Layout";
import Loader from './Loader';
import Swal from "sweetalert2";
import '../resources/css/totalStyle.css';


const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';


const MaterialList = () => {
    
    const accessTokenCookie = getCookie('accessToken');
    const [loading, setLoading] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [materials, setMaterials] = useState([]);
    const [editingMaterialId, setEditingMaterialId] = useState(null); // 수정 중인 재료의 ID
    const [editedMaterial, setEditedMaterial] = useState({}); // 수정 중인 재료의 데이터
    const [error, setError] = useState(null);
    const [logs, setLogs] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false); // 추가 폼 표시 상태
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [finalProducts, setFinalProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPages, setCurrentPages] = useState({});
    const containerRef = useRef(null);
    const [visibleCards, setVisibleCards] = useState(0);
    const [newMaterial, setNewMaterial] = useState({
        name: '',
        stockQuantity: '',
        onHoldStock: '',
        badStock: '',
        unitCost: '',
        imageurl: '',
        type: '제품',
        customType: '',
    });

    
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

    //각 재료에 대한 로그 가져오기 
    const fetchLog = async (material) => {
        try {
            const materialId = material.id;
            const response = await axios.get(`${API_URL}/material/log/specificlist/${materialId}`, {
                headers: { "Authorization": `Bearer ${accessTokenCookie}` }
            });
            setLogs(response.data);
        } catch (error) {
            console.error('로그 데이터 가져오기 실패:', error.message);
        }
    };

    //재료 목록 가져오기
    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/material/list`, {
                headers: { "Authorization": `Bearer ${accessTokenCookie}` }
            });
            setMaterials(response.data);
        } catch (error) {
            console.error('데이터 가져오기 실패:', error.message);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };
      

    
    //Log 한 건씩 삭제 
    const handleDeleteLog = async (id) => {
        if (window.confirm('정말로 이 로그를 삭제하시겠습니까? \n삭제 이후에는 로그 복구가 불가능합니다.')) {
            try {
                const response = await axios.delete(`${API_URL}/material/log/delete/${id}`, {
                    headers: { "Authorization": `Bearer ${accessTokenCookie}` }
                });
                if (response.status === 200) {
                    Swal.fire({
                        text:'로그가 성공적으로 삭제되었습니다.',
                        icon: 'success'
                    });
                    setLogs(prevLogs => prevLogs.filter(log => log.id !== id));
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
    

    // 각 재료에 대한 final product
    const fetchFinalProduct = async (material) => {
        try {
            const materialId = material.id;
            const response = await axios.get(`${API_URL}/material/showFinal/${materialId}`, {
                headers: { "Authorization": `Bearer ${accessTokenCookie}` }
            });
            setFinalProducts(response.data);
        } catch (error) {
            console.error('데이터 가져오기 실패:', error.message);
        }
    };


    //Material Card 클릭 시
    const handleCardClick = async (material) => {
        setSelectedMaterial(material);
        await fetchFinalProduct(material);
        await fetchLog(material);
        setIsModalOpen(true);
    };


    // 데이터 가져오기
    useEffect(() => {
        const fetchData = async () => {
          setLoading(true);
          try {
            const response = await fetch(`${API_URL}/material/list`, {
              method: 'GET',
              headers: { "Authorization": "Bearer " + accessTokenCookie }
            });
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setMaterials(data);
          } catch (error) {
            console.error('데이터 가져오기 실패:', error.message);
            setError(error.message);
          } finally {
            setLoading(false);
          }
        };
        fetchData();
    }, []);
      


    //재료 타입별로 그룹화 
    const groupMaterialsByType = (materials) => {
        if (!materials || materials.length === 0) return {};
        return materials.reduce((acc, material) => {
            if (!acc[material.type]) {
                acc[material.type] = [];
            }
            acc[material.type].push(material);
            return acc;
        }, {});
    };
    

    //타입
    const renderMaterialTypeTable = ( type, materials ) => {
        const containerWidth = document.querySelector('.material-settings-container')?.offsetWidth || 1200;
        const cardWidth = 123; // 카드의 너비
        const margin = 12; // 카드 사이의 여백
        const itemsPerPage = Math.floor((containerWidth + margin) / (cardWidth + margin));
        const currentPage = currentPages[type] || 0;
        const totalPages = Math.ceil(materials.length / itemsPerPage);

    const nextPage = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPages(prev => ({...prev, [type]: currentPage + 1}));
        }
    };

    const prevPage = () => {
        if (currentPage > 0) {
        setCurrentPages(prev => ({...prev, [type]: currentPage - 1}));
        }
    };

    const displayedMaterials = materials.slice(
        currentPage * itemsPerPage,
        (currentPage + 1) * itemsPerPage
    );


        return (
          <div key={type} style={{ marginBottom: '20px' }}>
            <h2>{type} 재료</h2>
            <div style={{ position: 'relative', width: '100%', marginBottom: '20px' }}>
              <button
                onClick={prevPage}
                disabled={currentPage === 0}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 2,
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                ←
              </button>
              <div
                ref={containerRef}
                style={{
                    /*
                  display: 'flex',
                  overflowX: 'auto',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#ffde00 #f1f1f1',
                  padding: '10px 0',*/
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'nowrap',
                overflowX: 'hidden',
                padding: '10px 40px', // 좌우 패딩 추가
                position: 'relative', // 상대 위치 설정
                }}
              >
                {displayedMaterials.map(renderMaterialCard)}
              </div>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages - 1}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 2,
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                →
              </button>
            </div>
          </div>
        );
    };
      
    //재료
    const renderMaterialCard = (material) => (
        <div key={material.id} //카드 스타일
            onClick={() => handleCardClick(material)}
            style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '12px',
            margin: '0 6px',
            width: '123px',
            flexShrink: 0,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            backgroundColor: 'white',
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            cursor: 'pointer'
        }}>
          <div style={{ //재료 이미지
            width: '100px',
            height: '100px',
            margin: '0 auto 12px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f8f8f8',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            {material.imageurl ? (
              <img
                src={material.imageurl}
                alt={material.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <span style={{ color: '#aaa', fontSize: '14px' }}>이미지 없음</span>
            )}
          </div>
          <div style={{
            fontWeight: 'bold',
            fontSize: '15px',
            marginBottom: '6px',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: 'black'
          }}>
            {material.name}
          </div>
          <div style={{
            fontSize: '13px',
            color: '#666',
            textAlign: 'center'
          }}>
            재고: {material.stockQuantity}
          </div>
        </div>
    );

   //if (loading) return <Loader />;
    //if (!loading && (!materials || materials.length === 0)) return <div>No materials found</div>;
    const groupedMaterials = groupMaterialsByType(materials);


    const Modal = ({ isOpen, onClose, material, finalProducts }) => {
        if (!isOpen) return null;
      
        const groupedProducts = finalProducts.reduce((acc, fp) => {
          if (!acc[fp.imageurl]) {
            acc[fp.imageurl] = [];
          }
          acc[fp.imageurl].push(fp);
          return acc;
        }, {});
      
        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'black'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '80%',
              maxHeight: '80%',
              overflow: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3>{material.name} 사용 제품</h3>
                    <button 
                        className="close-button"
                        onClick={onClose}
                    >X</button>
                </div>
                {finalProducts.length === 0 ? (
                <p style={{ textAlign: 'center' }}>아직 재료와 제품 매칭이 되지 않았습니다</p>
                ) : (
                    <table className="order-table">
                        <thead>
                        <tr>
                            <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: 'black', color: 'white' }}>이미지</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: 'black', color: 'white' }}>타입</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: 'black', color: 'white' }}>제품 이름</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: 'black', color: 'white' }}>필요 수량</th>
                        </tr>
                        </thead>
                        <tbody>
                        {Object.entries(groupedProducts).map(([imageurl, products]) => (
                            <React.Fragment key={imageurl}>
                            <tr>
                                <td rowSpan={products.length} style={{ border: '1px solid #ddd', padding: '8px' }}>
                                <img src={imageurl} alt={products[0].name} style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                                </td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{products[0].type}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{products[0].name}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{products[0].quantity}</td>
                            </tr>
                            {products.slice(1).map((fp, index) => (
                                 <tr key={`${fp.id}-${index}`}>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{fp.type}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{fp.name}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{fp.quantity}</td>
                                </tr>
                            ))}
                            </React.Fragment>
                        ))}
                        </tbody>
                    </table>
                )}
                <br />
                <h3>{material.name} 재고 증감 현황</h3><br />
                {logs.length === 0 ? (
                <p style={{ textAlign: 'center' }}>아직 기록된 로그가 없습니다.</p>
                ) : (
                <table className="order-table">
                    <thead>
                        <tr style={{ backgroundColor: '#ffde00', color: 'black' }}>
                            <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: 'black', color: 'white' }}>분류</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: 'black', color: 'white' }}>사용자 작성</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: 'black', color: 'white' }}>증감 재고 수</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: 'black', color: 'white' }}>기록 시간</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: 'black', color: 'white' }}>내용</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: 'black', color: 'white' }}>로그 삭제</th>
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
        );
    };
      
      


    // 입력 값 변경 핸들러
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewMaterial((prevData) => ({ ...prevData, [name]: value }));
    };

    //신규 재료 저장 핸들러
    const handleSaveMaterial = async () => {
        if (!newMaterial.name) {
            Swal.fire({
                text: '재료명은 필수입니다.',
                icon: 'warning',
                confirmButtonColor: '#3085d6',
                confirmButtonText: '확인'
            });
            return;
        }
        if (!newMaterial.stockQuantity) {
            Swal.fire({
                text: '재고 수량은 필수입니다.',
                icon: 'warning',
                confirmButtonColor: '#3085d6',
                confirmButtonText: '확인'
            });
            return;
        }

        const materialData = {
            ...newMaterial,
            stockQuantity: parseInt(newMaterial.stockQuantity, 10),
            onHoldStock: newMaterial.onHoldStock ? parseInt(newMaterial.onHoldStock, 10) : 0,
            badStock: newMaterial.badStock ? parseInt(newMaterial.badStock, 10) : 0,
            unitCost: newMaterial.unitCost ? parseInt(newMaterial.unitCost, 10) : null,
        };

        if (newMaterial.customType) {
            materialData.type = newMaterial.customType;
        }
        delete materialData.customType;

        try {
            const response = await axios.post(`${API_URL}/material/add`, materialData, {
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${accessTokenCookie}`
                }
            });

            //console.log('전송할 데이터', materialData); // 새로 추가된 재료의 내용 확인

            if (response.status === 200) {
                Swal.fire({
                    text:'재료가 성공적으로 추가되었습니다.',
                    icon: 'success'
                });
                setShowAddForm(false); // 폼 닫기
                fetchData(); // 테이블 새로고침
                setNewMaterial({
                    name: '',
                    stockQuantity: '',
                    onHoldStock: '',
                    unitCost: '',
                    badStock: '',
                    imageurl: '',
                    type: '제품',
                    customType: '',
                });
            }
        } catch (err) {
            console.error('저장 실패:', err.message);
            setError(err.message);
        }
    };

    // 삭제 버튼 클릭 핸들러
    const startDeleting = async (material) => {
        const result = await Swal.fire({
            title: '재료 삭제',
            html: '해당 재료를 삭제하시겠습니까?<br />재료에 저장되어 있던 정보들도 모두 삭제됩니다.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: '삭제',
            cancelButtonText: '취소'
          });
        
        if (result.isConfirmed) {
            try {
                const materialId = material.id;
                const response = await axios.delete(`${API_URL}/material/delete/${materialId}`, {
                    headers: {
                        "Authorization": `Bearer ${accessTokenCookie}`
                    }
                });
                if (response.status === 200) {
                    Swal.fire({
                        text:'재료가 성공적으로 삭제되었습니다.',
                        icon: 'success'
                    });
                    fetchData();
                } 
            } catch (error) {
                console.error('재료 삭제 실패:', error.message);
                Swal.fire({
                  text:'재료 삭제에 실패했습니다.',
                  icon: 'error'
                });
            }
        }
    };

    // 수정 버튼 클릭 핸들러
    const startEditing = (material) => {
        setEditingMaterialId(material.id);
        setEditedMaterial({ ...material }); // 현재 재료 데이터 복사
    };

    // 수정 취소 핸들러
    const cancelEditing = () => {
        setEditingMaterialId(null);
        setEditedMaterial({});
    };

    // 입력 값 변경 핸들러
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditedMaterial((prevData) => ({
            ...prevData,
            [name]: name === 'stockQuantity' || name === 'unitCost' || name === 'onHoldStock' || name === 'badStock' 
                ? parseInt(value, 10) 
                : value,
        }));
    };

    // 수정 저장 핸들러
    const saveEditedMaterial = async () => {
        try {
          const response = await axios.post(`${API_URL}/material/edit/${editingMaterialId}`, editedMaterial, {
            headers: {
              "Content-Type": "application/json",
              'Authorization': `Bearer ${accessTokenCookie}`
            }
          });
          if (response.status === 200) {
            Swal.fire({
              text:'재료가 성공적으로 수정되었습니다.',
              icon: 'success'
            });
            setEditingMaterialId(null);
            await fetchData(); // 데이터 즉시 갱신
          }
        } catch (error) {
          console.error('수정 실패:', error.message);
        }
    };
      

    return (
        <Layout>
            <div className='material-settings-container'>
            <div
                style={{
                    alignItems: 'center',
                    padding: '20px', 
                    margin: '10px',
                    textAlign: 'center' 
                }}
            >
                <div style={{display:'flex', justifyContent: 'center', flexDirection: 'column'}}>
                    {loading ? (
                        <Loader />
                    ) : (
                        Object.entries(groupedMaterials).map(([type, materials]) =>
                            renderMaterialTypeTable(type, materials)
                        )
                    )}
                </div>

                <h1 style={{marginBottom: '20px'}}>재료 목록</h1>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    style={{
                        padding: '5px 10px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: showAddForm ? 'white' : 'black',
                        backgroundColor: showAddForm ? '#aaa' : '#ffde00',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                        marginBottom: '20px'
                    }}
                >
                    {showAddForm ? '취소' : '재료 추가'}
                </button>

                {/* 저장 버튼 (재료 추가 폼이 활성화된 경우에만 표시) */}
                {showAddForm && (
                    <button
                        onClick={handleSaveMaterial}
                        style={{
                            padding: '5px 10px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: 'black',
                            backgroundColor: '#ffde00',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s ease',
                            marginBottom: '20px',
                            marginLeft: '5px'
                        }}
                    >
                        저장
                    </button>
                )}

                <div style={{display:'flex', justifyContent: 'center'}}>
                    {loading ? (
                        <Loader />
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#ffde00', color: 'black' }}>
                                    <th style={{ border: '1px solid #ddd', padding: '5px', width:'70px' }}>이미지</th>
                                    <th style={{ border: '1px solid #ddd', padding: '5px' }}>재료명</th>
                                    <th style={{ border: '1px solid #ddd', padding: '5px' }}>재고 수</th>
                                    <th style={{ border: '1px solid #ddd', padding: '5px' }}>단가</th>
                                    <th style={{ border: '1px solid #ddd', padding: '5px' }}>보류 재고</th>
                                    <th style={{ border: '1px solid #ddd', padding: '5px' }}>불량품 수</th>
                                    <th style={{ border: '1px solid #ddd', padding: '5px' }}>타입</th>
                                    <th style={{ border: '1px solid #ddd', padding: '5px' }}>업데이트</th>
                                </tr>
                            </thead>
                            <tbody>
                                {showAddForm && (
                                    <tr>
                                        <td style={{ border: '1px solid #ddd', padding: '5px' }}>
                                            <input
                                                type="text"
                                                name="imageurl"
                                                placeholder="이미지 URL"
                                                value={newMaterial.imageurl}
                                                onChange={handleInputChange}
                                                style={{ width: '100%' }}
                                            />
                                            {newMaterial.imageurl && (
                                                <img
                                                    src={newMaterial.imageurl}
                                                    alt="미리보기"
                                                    style={{ width: '60px', height: '60px', objectFit: 'cover', marginTop: '5px' }}
                                                />
                                            )}
                                        </td>
                                        <td style={{ border: '1px solid #ddd', padding: '5px' }}>
                                            <input
                                                type="text"
                                                name="name"
                                                placeholder="재료명 (필수)"
                                                value={newMaterial.name}
                                                onChange={handleInputChange}
                                                style={{ width: '100%' }}
                                                required
                                            />
                                        </td>
                                        <td style={{ border: '1px solid #ddd', padding: '5px' }}>
                                            <input
                                                type="number"
                                                name="stockQuantity"
                                                placeholder="재고 수량 (필수)"
                                                value={newMaterial.stockQuantity}
                                                onChange={handleInputChange}
                                                style={{ width: '100%' }}
                                                required
                                            />
                                        </td>
                                        <td style={{ border: '1px solid #ddd', padding: '5px' }}>
                                            <input
                                                type="number"
                                                name="unitCost"
                                                placeholder="단가"
                                                value={newMaterial.unitCost}
                                                onChange={handleInputChange}
                                                style={{ width: '100%' }}
                                            />
                                        </td>
                                        <td style={{ border: '1px solid #ddd', padding: '5px' }}>
                                            <input
                                                type="number"
                                                name="onHoldStock"
                                                placeholder="보류 재고"
                                                value={newMaterial.onHoldStock}
                                                onChange={handleInputChange}
                                                style={{ width: '100%' }}
                                            />
                                        </td>
                                        <td style={{ border: '1px solid #ddd', padding: '5px' }}>
                                            <input
                                                type="number"
                                                name="badStock"
                                                placeholder="불량품 수"
                                                value={newMaterial.badStock}
                                                onChange={handleInputChange}
                                                style={{ width: '100%' }}
                                            />
                                        </td>
                                        <td style={{ border: '1px solid #ddd', padding: '5px' }}>
                                            <select
                                                name="type"
                                                value={newMaterial.type}
                                                onChange={handleInputChange}
                                                style={{ width: '100%' }}
                                            >
                                                <option value="">타입 선택</option>
                                                {[...new Set(materials.map(material => material.type))].map((type) => (
                                                    <option key={type} value={type}>
                                                        {type}
                                                    </option>
                                                ))}
                                                <option value="기타">기타</option>
                                            </select>
                                            {newMaterial.type === '기타' && (
                                                <input
                                                    type="text"
                                                    name="customType"
                                                    placeholder="기타 유형"
                                                    value={newMaterial.customType}
                                                    onChange={handleInputChange}
                                                    style={{ width: '100%', marginTop: '5px' }}
                                                    required
                                                />
                                            )}
                                        </td>
                                        <td style={{ border: '1px solid #ddd', padding: '5px' }}>-</td>
                                    </tr>
                                )}
                                 {materials.map((material) =>
                                    editingMaterialId === material.id ? (
                                        <tr key={material.id}>
                                            <td style={{ border: '1px solid #ddd', padding: '5px' }}>
                                                <input
                                                    type="text"
                                                    name="imageurl"
                                                    value={editedMaterial.imageurl}
                                                    onChange={handleEditChange}
                                                    style={{ padding: '3px', width: '100%' }}
                                                />
                                            </td>
                                            <td style={{ border: '1px solid #ddd', padding: '5px' }}>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={editedMaterial.name}
                                                    onChange={handleEditChange}
                                                    style={{ padding: '3px', width: '100%' }}
                                                />
                                            </td>
                                            <td style={{ border: '1px solid #ddd', padding: '5px', position: 'relative' }}>
                                                {editingMaterialId === material.id && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        bottom: '100%',
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        backgroundColor: 'white',
                                                        fontSize: '13px',
                                                        color: 'red',
                                                        padding: '6px 9px',
                                                        borderRadius: '10px',
                                                        whiteSpace: 'nowrap',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                        zIndex: 1,
                                                        opacity: isHovered ? 1 : 0,
                                                        transition: 'opacity 0.3s ease'
                                                    }}>
                                                    전체 재고 수는 여기서 수정하지 않는 것을 추천합니다.<br />여기서 수정할 경우, 재고 로그에 기록이 남지 않습니다!
                                                    </div>
                                                )}
                                                <input
                                                    type="number"
                                                    name="stockQuantity"
                                                    value={editedMaterial.stockQuantity}
                                                    onChange={handleEditChange}
                                                    onMouseEnter={() => setIsHovered(true)}
                                                    onMouseLeave={() => setIsHovered(false)}
                                                    style={{ padding: '3px', width: '100%' }}
                                                />
                                            </td>
                                            <td style={{ border: '1px solid #ddd', padding: '5px' }}>
                                                <input
                                                    type="number"
                                                    name="unitCost"
                                                    value={editedMaterial.unitCost}
                                                    onChange={handleEditChange}
                                                    style={{ padding: '3px', width: '100%' }}
                                                />
                                            </td>
                                            <td style={{ border: '1px solid #ddd', padding: '5px' }}>
                                                <input
                                                    type="number"
                                                    name="onHoldStock"
                                                    value={editedMaterial.onHoldStock}
                                                    onChange={handleEditChange}
                                                    style={{ padding: '3px', width: '100%' }}
                                                />
                                            </td>
                                            <td style={{ border: '1px solid #ddd', padding: '5px' }}>
                                                <input
                                                    type="number"
                                                    name="badStock"
                                                    value={editedMaterial.badStock}
                                                    onChange={handleEditChange}
                                                    style={{ padding: '3px', width: '100%' }}
                                                />
                                            </td>
                                            <td style={{ border: '1px solid #ddd', padding: '5px' }}>
                                                <input
                                                    type="text"
                                                    name="type"
                                                    value={editedMaterial.type}
                                                    onChange={handleEditChange}
                                                    style={{ padding: '3px', width: '100%' }}
                                                />
                                            </td>
                                            <td style={{ border: '1px solid #ddd', padding: '5px' }}>
                                                <button onClick={saveEditedMaterial} style={{ padding: '5px', cursor: 'pointer', marginRight: '4px'}}>저장</button>
                                                <button onClick={cancelEditing} style={{ padding: '5px', cursor: 'pointer' }}>취소</button>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr 
                                            key={material.id} 
                                            style={{ 
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}
                                            className="material-cell"
                                            onClick={() => handleCardClick(material)}
                                        >
                                            <td style={{ border: '1px solid #ddd', padding: '5px' }}>
                                                {material.imageurl ? (
                                                    <img
                                                        src={material.imageurl}
                                                        alt="대표 이미지"
                                                        style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <span>이미지 X</span>
                                                )}
                                            </td>
                                            <td style={{ border: '1px solid #ddd', padding: '5px' }}>{material.name}</td>
                                            <td style={{ border: '1px solid #ddd', padding: '5px' }}>{material.stockQuantity}</td>
                                            <td style={{ border: '1px solid #ddd', padding: '5px' }}>
                                                {material.unitCost?.toLocaleString()}원
                                            </td>
                                            <td style={{ border: '1px solid #ddd', padding: '5px' }}>
                                                {material.onHoldStock || 0}
                                            </td>
                                            <td style={{ border: '1px solid #ddd', padding: '5px' }}>
                                                {material.badStock || 0}
                                            </td>
                                            <td style={{ border: '1px solid #ddd', padding: '5px' }}>{material.type}</td>
                                            <td style={{ border: '1px solid #ddd', padding: '5px' }}>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        startEditing(material);
                                                    }}
                                                    style = {{ padding: '5px', cursor: 'pointer', border:'none', marginRight: '5px'}}
                                                >수정</button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        startDeleting(material);
                                                    }}
                                                    style = {{ padding: '5px', cursor: 'pointer', backgroundColor: 'red', color: 'white', border:'none'}}
                                                >삭제</button>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    )}    
                </div>

            </div>
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                material={selectedMaterial}
                finalProducts={finalProducts}
                logs={logs}
                handleDeleteLog={handleDeleteLog}
            />
            
            </div>
        </Layout>
    );
}

export default MaterialList;