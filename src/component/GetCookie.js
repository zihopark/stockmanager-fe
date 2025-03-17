//쿠키 읽어 오기
const getCookie = (name) => {
    
    const cookies = document.cookie.split(`; `).map((el) => el.split('='));
        let getItem = [];

    for (let i = 0; i < cookies.length; i++) {		    
        if (cookies[i][0] === name) {
            getItem.push(cookies[i][1]);
            break;
        }
    }
    if (getItem.length > 0) {
        //console.log(getItem[0]);
        return decodeURIComponent(getItem[0]);
    }		
}

export default getCookie;