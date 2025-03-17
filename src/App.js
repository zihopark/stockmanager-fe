import './resources/css/App.css';
import {  BrowserRouter, Routes, Route } from 'react-router-dom';

import TokenRequestForm from './component/TokenRequestForm';
import OrderList from './component/OrderList';
import AutoOrderList from './component/AutoOrderList';
import ProductList from './component/ProductList';
import Settings from './component/Settings';
import { DateProvider } from './component/DateContext'; // DateProvider 임포트
import { TimeProvider } from "./component/TimeContext";
import ProductDetailList from './component/ProductDetailList';
import MaterialList from './component/MaterialList';
import MaterialLog from './component/MaterialLog';
import Login from './component/Login';
import Signup from './component/Signup';
import SearchId from './component/SearchId';
import SearchPassword from './component/SearchPassword';
import ModifyMemberPassword from './component/ModifyMemberPassword';
import MasterPage from './component/MasterPage';
import InfoForUser from './component/InfoForUser';

function App() {
  return (
    <BrowserRouter>
      <DateProvider>
        <TimeProvider>
          <div>
            <Routes>
              <Route path='/' element={<Login />}/>
              <Route path='/Login' element={<Login />}/>
              <Route path='/SearchId' element={<SearchId />}/>
              <Route path='/SearchPassword' element={<SearchPassword />}/>
              <Route path='/Signup' element={<Signup />}/>
              <Route path='/InfoForUser' element={<InfoForUser />}/>
              <Route path='/ModifyMemberPassword' element={<ModifyMemberPassword />}/>
              <Route path='/MasterPage' element={<MasterPage />}/>
              <Route path="/TokenRequestForm" element={<TokenRequestForm />} />
              <Route path="/OrderList" element={<OrderList />} />
              <Route path="/ProductDetailList" element={<ProductDetailList />} />
              <Route path="/MaterialList" element={<MaterialList />} />
              <Route path="/MaterialLog" element={<MaterialLog />} />
              <Route path="/Settings" element={<Settings />} />
              <Route path="/ProductList" element={<ProductList />} />
              <Route path="/AutoOrderList" element={<AutoOrderList />} />
            </Routes>
          </div>
        </TimeProvider>
      </DateProvider>
    </BrowserRouter>
  );
}

export default App;
