import React, { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import getCookie from './GetCookie';


const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';


const logoutButtonStyle = {
  padding: "8px 15px",
  backgroundColor: "white",
  color: "black",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "bold",
};

const linkStyle = {
  color: "#fff",
  textDecoration: "none",
  marginBottom: "15px",
  fontSize: "15px",
  fontWeight: "700",
};

const masterlinkStyle = {
  color: "#ffde00",
  textDecoration: "none",
  marginBottom: "15px",
  fontSize: "15px",
  fontWeight: "700",
};

const Sidebar = ({ role }) => (
  <div
    style={{
      width: "155px",
      height: "100vh",
      backgroundColor: "#9e9e9e",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "20px",
      position: "fixed",
      top: 0,
      left: 0,
    }}
  >
    <h3 style={{ marginBottom: "30px" }}>MENU</h3>
    <Link to="/AutoOrderList" style={linkStyle}>자동 주문 목록</Link>
    <Link to="/ProductList" style={linkStyle}>상품 목록</Link>
    <Link to="/ProductDetailList" style={linkStyle}>상품 상세목록</Link>
    <Link to="/MaterialList" style={linkStyle}>재료 목록</Link>
    <Link to="/MaterialLog" style={linkStyle}>재료 입출고 내역</Link>
    <Link to="/Settings" style={linkStyle}>설정</Link>
    {role === 'MASTER' && (
      <Link to="/MasterPage" style={masterlinkStyle}>관리자 페이지</Link>
    )}
  </div>
);

const Topbar = ({ username, role }) => {
  const navigate = useNavigate();

  const logout = () => {
    const cookies = ['authkey', 'userid', 'password', 'email', 'accessToken'];
    cookies.forEach(cookie => {
      document.cookie = `${cookie}=; path=/; max-age=0`;
    });
    navigate('/Login');
  };

  return (
    <div
      style={{
        width: "calc(100% - 155px)",
        height: "60px",
        backgroundColor: "#ffde00",
        color: "black",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        position: "fixed",
        top: 0,
        left: "155px",
        zIndex: 1000,
        boxSizing: "border-box",
      }}
    >
      <div><h3>네이버 스마트스토어 원재료 재고관리 시스템</h3></div>
      <div>
        {username && role ? (
          <span>{username} ({role}) </span>
        ) : (
          <span> </span>
        )}
        <button onClick={logout} style={logoutButtonStyle}>로그아웃</button>
      </div>
    </div>
  );
};

const Layout = ({ children }) => {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');

  const emailCookie = getCookie('email');
  const accessTokenCookie = getCookie('accessToken');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/member/memberInfo?&email=${emailCookie}`, {
          method: 'GET',
          headers: { "Authorization": "Bearer " + accessTokenCookie }
        });
        const data = await response.json();
        setUsername(data.username);
        setRole(data.role);
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, [accessTokenCookie, emailCookie]);

  return (
    <div style={{ display: "flex" }}>
      <Sidebar role={role} />
      <div style={{ flexGrow: 1, marginLeft: "155px" }}>
        <Topbar username={username} role={role} />
        <div
          style={{
            paddingTop: "80px", // Topbar의 높이 + 20px와 일치하도록 조정
            paddingLeft: "20px",
            paddingRight: "20px",
            boxSizing: "border-box",
          }}
        >
          {children}
        </div>
    </div>
  </div>
  );
};

export default Layout;
