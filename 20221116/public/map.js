
var jsonData={};//存放json檔資料之變數
var cur_map=''; //代表當前畫面上的地圖名稱

var tab_len = 0; 

var backimg=$('.backgroundimg')[0] //html中的背景圖片img
var show=$('.showmaplabel')[0] //html中的顯示當前地圖名稱label

var icondict={"monitor":"../icon/imac.png","lamp":"../icon/lamp-post.png"}//各icon對應的檔案路徑
       
var leftdiv=$('.leftcontainer')[0] //左側欄div
var btntitle=$('.buttontitle')[0]  //說明icon按鈕之標題(label)
var container = document.getElementById("container"); //背景圖和icon的父層div
var rmenu=$('.rmenu')[0];              //右鍵選單div

var inputfile=document.getElementById('inputid')//上傳檔案之input

var iconform=$('.iconform')[0]//傳送icon資料之表單
var mapnameinput=document.getElementById("mapname") //icon表單之地圖名稱欄位
var iconlistinput=document.getElementById("iconlist") //icon表單之iconlist欄位
var iconcounts=1; //存放當前icon數量

//Icon資訊表單
var deviceInfoDiv=$('.deviceInfoContainer')[0]
var deviceSubmit=$('.device_submitbtn')[0]
var deviceCancel=$('.device_cancelbtn')[0]
var deviceReset=$('.device_resetbtn')[0]
var devicename=document.getElementById('devicename');
var url=document.getElementById('deviceURL');

//顯示螢幕以及其功能按鈕
var screen=$('.screen')[0]
var zoomscreen=$('.Zoomscreen')[0]
var closescreen=$('.Closescreen')[0]
var mainscreen=$('.mainscreen')[0]
var screen_PosX,screen_PosY
var zoom=false


var refreshbtn=document.getElementById("refresh-btn")//刷新設備狀態按鈕
var restartserverbtn=document.getElementById("restartserver-btn")//重新啟動server按鈕

var devicedict={} //存放串流URL以及其對應的WebSocket port之dictionary
var player //串流撥放器

var iconlistshowing=false//是否顯示設備列表
var lastclick=''//紀錄按下的地圖名稱

var ipstatusdict={}//存放ip以及其最新狀態的dict
var serverdead=false//紀錄server是否斷線

var waitingIconArea=$('#WatingArea')[0]//待定位設備顯示區域

var addmapbtn=$('#AddMapBtn')[0]//新增地圖按鈕
var editmapbtn=$('#EditMapBtn')[0]//編輯地圖按鈕
var adddevicebtn=$('#AddDeviceBtn')[0]//新增設備按鈕

var user_name = document.getElementById("user_name")    // 頁面上用戶的姓名
var user_email = document.getElementById("user_email")    // 頁面上用戶的郵箱
var user_permission = document.getElementById("user_permission")     // 頁面上用戶的權限

var permissionbtn=$('#permission_manage')[0]//權限管理按鈕

//變更密碼按鈕
var changePwdBtn=$('#ChangePasswordBtn')[0]
//變更密碼表單之元素
var username=$('#user_name_for_changepwd')[0]//使用者名稱
var userEmail=$('#email_for_changepwd')[0]//使用者email

// ----------------------------------------------------------------------------------------
// 登入

// user_json變量儲存當前登入用戶的物件，儲存的内容格式請看users.json，格式如下
// 姓名：name
// 郵箱：email
// 密碼：password
// 地圖編輯權限(新增、刪除、修改地圖)：map_edit
// 設備編輯(新增、刪除、修改設備)：device_edit
// 設備移動：device_move
// 觀看權限：view_page

var user_json = {}


// 呼叫後端，以物件方式從後端回傳參數到前端，然後做權限比對
fetch('/get_user_data', {
    method:'POST',
    body: "test",
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
    }
})
.then(res=>res.text())
.then(data=>{
    user_json = JSON.parse(data);
    console.log(data)    // 把當前登入的賬號印在開發者工具F12中
    console.log(username)
    username.value=user_json.name//將變更密碼表單中「user_name」欄位的值設定為目前的使用者名稱
    userEmail.value=user_json.email//將變更密碼表單中「user_email」欄位的值設定為目前的使用者email

    // 讀取用戶資訊動態寫入主頁的用戶對話框中
    if (user_json.name == 'tourist') {
        user_name.innerHTML = "用戶：游客模式"
        user_email.innerHTML = ""
        user_permission.innerHTML = "使用權限：<br>● 僅瀏覽"
        changePwdBtn.disabled=true//遊客模式下，取消變更密碼按鈕
    } else {
        user_name.innerHTML = `用戶：${user_json.name}`
        user_email.innerHTML = `郵箱：${user_json.email}`
        user_permission.innerHTML = "使用權限：<br>"
        if (user_json.permission.map_edit == 1) {
            user_permission.innerHTML += "● 地圖編輯<br>"
        }
        if (user_json.permission.device_edit == 1) {
            user_permission.innerHTML += "● 設備編輯<br>"
        }
        if (user_json.permission.device_move == 1) {
            user_permission.innerHTML += "● 設備移動<br>"
        }
        if (user_json.permission.view_page == 1) {
            user_permission.innerHTML += "● 僅瀏覽<br>"
        }
    }
})

// ----------------------------------------------------------------------------------------

//取得本地json檔資料

//儲存map以及其對應的icon資料的json檔
fetch('maps/maplist.json').
    then((res)=>{
        if(!res.ok){
            console.log('failed')
        }
        return res.json();    //執行完後執行下個then 
    })
    .then((data)=>{
        jsonData=data; //將讀取到的資料存入jsonData
        main(); //執行自訂之main function
    })
    .catch(err=>{
        console.log(err)
    })

//儲存設備ip以及其對應WebSocket Server埠號的json檔
fetch('device_and_port.json').
    then((res)=>{
        if(!res.ok){
            console.log('failed')
        }
        return res.json();    //執行完後執行下個then 
    })
    .then((data)=>{
        devicedict=data; //將讀取到的資料存入devicedict
        
    })
    .catch(err=>{
        console.log(err)
    })

// 延遲函數
function delay(n){
    return new Promise(function(resolve){
        setTimeout(resolve,n*1000);
    });
}

async function main() {

    // 等待1秒，讓資料能夠加載完畢
    await delay(0.5);

    // 判斷是不是超級系統管理員
    if(user_json.supervisor == 0) {
        document.getElementById("manage").style.display = "none";
    } else {
        document.getElementById("manage").style.display = "block";
    }

    //檢查權限，若不能編輯地圖則隱藏新增和編輯地圖按鈕
    if(user_json.permission.map_edit!=1){
        addmapbtn.disabled=true
        editmapbtn.disabled=true
    }
    //檢查權限，若不能編輯設備則隱藏新增設備按鈕
    if(user_json.permission.device_edit!=1){
        adddevicebtn.disabled=true
    }
    //每隔2秒檢查一次server狀態和更新設備狀態
    setInterval(() => {

        ShowDeivceStatus()//更新設備狀態
        //如果server沒斷線，則執行檢查
        if(!serverdead){
            checkserver('http://localhost:3000')
        }
    }, 2000);

    Addmaps();//使用讀取到的資料來創建map
    DirectToMap()//開啟網址get參數所選定的地圖

    container.oncontextmenu=function(e){return false;};//在container範圍內，取消瀏覽器預設之右鍵選單
    document.onclick=()=>{
        HideRmenu()
    }; //點擊網頁任何地方即隱藏自訂右鍵選單

    
    zoomscreen.onclick=()=>{
        zoom=!zoom
        if(zoom){
            ScreenZoomIn()
        }
        else{
            ScreenZoomOut()
        }        
    }
    closescreen.onclick=()=>{
        screen.style.display='none'
        zoom=false
        ScreenZoomOut()
    } 
    refreshbtn.onclick=()=>{
        ShowDeivceStatus()
    }   
    restartserverbtn.onclick=(e)=>{
        $.getJSON('http://localhost/restart')
        restartserverbtn.style.display='none'
        setTimeout(() => {
            restartserverbtn.style.display='block'
        }, 2000);
    }
    //當使用者上傳檔案時觸發事件
    inputfile.addEventListener('change',function(e){
        var file=e.target.files[0]
        $('.showfilename')[0].innerHTML=file.name; //顯示使用者上傳的檔案名稱
    });
    
};
function Addmaps(){ //功能為:使用讀取到的json檔案資料創建地圖
   
    //console.log(jsonData)
    for(let mapname in jsonData){ //迭代jsonData所有key(key代表地圖名稱)
        
        //創建map之下的icon清單之div
        let iconlistdiv=document.createElement('div')
        //創建包含map和delete的div
        let mapdiv=document.createElement('div')
        //創建map ,delete button
        var map=document.createElement("button")
        var deletebtn=document.createElement("img")

        //設定mapdiv屬性值
        mapdiv.className="btn_wide_standard"
        mapdiv.style.display='flex'
        mapdiv.id=mapname+'_div'

        //設定map屬性值與click事件
        map.className="btn btn-link button_slide slide_left btn_wide_standard active" //使用bootstrap的btn模板
        map.textContent= mapname //button的顯示名稱(innerText)
        map.id=mapname  //設定button id
        map.addEventListener('click',(e)=>{ //將button綁定click事件

            //判斷當前為展開or摺疊狀態

            //當按下任一map按鈕時，將lastclick設為按下之按鈕之名稱
            //當下一次按下map按紐時，即可利用lastclick判斷當前按下之按鈕是否為上次按下之按鈕
            //如果是，則將展開/摺疊狀態反轉
            //如果不是，則直接設定為展開狀態
            if(e.target.id==lastclick){
                iconlistshowing=!iconlistshowing
            }
            else{
                iconlistshowing=true
            }
            lastclick=mapname

            cur_map=mapname //當按下button，cur_map更改為當前地圖名稱
            show.innerHTML=mapname //顯示當前地圖名稱
            backimg.src=`./maps/${mapname}/${jsonData[mapname].mapname}` //改變背景圖片之src

            ClearIconList()//清除所有顯示的iconlist

            if(iconlistshowing){
                AddIcons() //根據jsonData的資料創建該地圖的Icons          

                ShowClassList();
                // 這裡可能要改成秀出當前地圖的class 在點擊class出現設備 2022 08 22
            }
            

            ShowDeivceStatus()
            ShowWaitingDevice()
            screen.style.display='none';
            
        })
        //設定刪除按鈕之屬性與click事件
        deletebtn.src='../icon/delete.png'
        deletebtn.className='MapDeleteBtn button_slide slide_left'
        deletebtn.id=mapname+'_delete'
        deletebtn.addEventListener('click',(e)=>{
            //取得當前按下之刪除按鈕之id，並利用split 取得對應mapname
            let targetid=e.target.id
            let targetmap=targetid.split('_')[0]

            //設定刪除確認表單之確認按鈕click事件
            $('#deletemap_confirm')[0].onclick=()=>{

                //移除當前地圖div，並傳送request到後端(server.js)，後端做刪除json檔案資料
                document.getElementById(targetmap+'_div').remove();
                $.getJSON(`/DeleteMap?mapname=${targetmap}`)

                //完成後觸發取消按鍵，關閉表單
                $('#deletemap_cancel')[0].click()
                window.location.reload()//刷新頁面
            }

            //開啟刪除確認表單(按下隱藏的呼叫表單按鈕)
            $('#deletemapbtn')[0].click()
            
            
        })
        
        iconlistdiv.className=mapname+' div' //設定iconlistdiv之class
        //將map,delebtn加入mapdiv
        mapdiv.appendChild(map)

        //檢查權限，能編輯地圖才會看到刪除地圖按鈕
        if(user_json.permission.map_edit==1){
            mapdiv.appendChild(deletebtn)
        }
        //插入map iconlistdiv在btntitle上方
        leftdiv.insertBefore(mapdiv,btntitle) 
        leftdiv.insertBefore(iconlistdiv,btntitle)
        
    }
    
}
function DirectToMap(){//開啟網址get參數所選定的地圖

    //讀取網址url，取出target參數
    let getUrlString = location.href;
    let url = new URL(getUrlString);
    let targetmap=url.searchParams.get('target'); // 取得 target 參數
    //如果target參數不為無，則觸發指定地圖按鈕的click事件
    if(targetmap!=undefined){
        console.log(targetmap)
        document.getElementById(targetmap).click()
    }
    

}
function ShowWaitingDevice(){  //顯示當前地圖的未定位設備清單
    //清空待定位設備區
    waitingIconArea.innerHTML=''
    //如果存在當前地圖
    if(cur_map!=''){
        //取得jsonData內當前地圖的icon清單
        let iconlist=jsonData[cur_map].icons
        //走訪清單內Icon
        for(let i=0;i<iconlist.length;i++){

            let icon=iconlist[i]
            //如果icon的x欄位為空字串，則代表未定位
            if(icon.x==''){

                //創建未定位設備之label和功能選項
                let waitingicondiv=document.createElement('div')
                let iconlabel=document.createElement('label')
                let putinBtn=document.createElement('img')

                //水平排列區塊元素並靠右對齊
                waitingicondiv.style.display='flex'
                waitingicondiv.style.justifyContent='flex-end';
                waitingicondiv.id=icon.name+'_waitingdiv'

                //指定label樣式及顯示內容
                iconlabel.className='icon_neme_label'
                iconlabel.innerHTML=icon.name
                iconlabel.id=icon.name+'_label'

                //設定功能按鈕之樣式、來源圖片
                putinBtn.className='btn btn-outline-secondary'
                putinBtn.src='../icon/plus.png'
                putinBtn.style.height='34px'
                putinBtn.style.padding='5px'
                //設定click事件
                putinBtn.onclick=()=>{

                    //更換顏色提醒使用者當前移動的Icon
                    $(`#${icon.name}_label`)[0].style.backgroundColor='blue'
                    //創建icon
                    CreateIcon(icon.class,icon.x,icon.y,iconcounts,icon.name,icon.url)
                    //將該icon設為不可見
                    let targeticon=$(`#${icon.name}`)[0]
                    targeticon.style.display='none'
                    //觸發移動icon事件
                    MoveElement(targeticon)//在MoveElement有為未定位設備新增動作
                }

                //將創建完的物件加入待定位區域
                waitingicondiv.appendChild(iconlabel)

                //檢查權限，如果可以移動設備才會顯示定位(+)按鈕
                if(user_json.permission.device_move==1){
                    waitingicondiv.appendChild(putinBtn)
                }
                waitingIconArea.appendChild(waitingicondiv)
            }
        }

    }
        
    
    
}
//根據jsonData內容中Icon資訊創建Icon
function AddIcons(){
   
    let allicons=$('.element') //選取所有class含有'element'之物件
    //移除所有選取物件
    for(let i=0;i<allicons.length;i++){
        allicons[i].remove()
    }

    iconcounts=1//icon數量設為初始值

    //取得指定地圖之value之icons欄位值
    let mapdata=jsonData[cur_map]
    let icons=mapdata.icons

    for(let i=0;i<icons.length;i++){
        //如果當前icon之x為空字串，代表未定位，則不創建
        if(icons[i].x!=''){
            CreateIcon(icons[i].class,icons[i].x,icons[i].y,iconcounts,icons[i].name,icons[i].url)//根據icons各欄位資料創建Icon
        }
        iconcounts+=1 //創建後iconcounts+1
    }
}
function CreateIcon(iconclass,x,y,iconcounts,devicename,url){
    let iconsrc=icondict[iconclass] //根據icon名稱取得img的src
    var element=document.createElement("img");
    element.className=`element ${iconclass}`; //設定class為'element (icon名稱)'
    element.id=devicename; //設定id
    element.src=iconsrc; //指定src
    element.alt=url;
    
    //將x,y值設定給element
    element.style.marginLeft = x;
    element.style.marginTop = y;

    //當設備類別為Monitor時，加入雙擊開啟鏡頭畫面事件
    if(iconclass=='monitor'){
        element.addEventListener('dblclick',(e)=>{
            var e=window.event;
            //console.log(url)
            //console.log(devicedict)

            //暫停播放，以避免瀏覽器過載
            if(player!=undefined){
                player.pause()
            }

            //重新建立撥放器物件
            mainscreen.remove()
            let newscreen=document.createElement('canvas')
            newscreen.className='mainscreen'
            newscreen.id='canvas_5000'
            screen.appendChild(newscreen)
            mainscreen=$('.mainscreen')[0]
            //依據url不同，連接不同的串流路徑
            player = new JSMpeg.Player(`ws://localhost:${devicedict[url]}`, {
                canvas: document.getElementById('canvas_5000'),
                autoplay:true,//是否自动播放
            });

            //使撥放器出現於滑鼠位置
            screen.style.left = e.clientX + 'px';
            screen.style.top = e.clientY + 'px';
            screen.style.display = 'flex';
        })
    }

    //設定右鍵觸發事件
    element.addEventListener('contextmenu', 
    function(e){
        e.preventDefault(); //取消瀏覽器預設事件
        showrightmenu();    //顯示移動編輯刪除選單
        AddRmenuEvent(this); //設定選單之事件，傳入當前element當作參數
        return false;});

    element.style.zIndex=iconcounts; //z-index為圖層，數字越大越高層，設定為iconcounts
    container.appendChild(element);  //加入element於container中
    

} 
function showrightmenu(){ //顯示移動刪除選單
    var e=window.event;
    //將選單位置設為滑鼠右鍵點擊icon時位置，並顯示
    rmenu.style.left = e.clientX + 'px';
    rmenu.style.top = e.clientY + 'px';
    rmenu.style.display = 'flex';
}
function AddRmenuEvent(icon){

    //設定'移動','刪除'之物件事件
    var movebtn=$('.movebtn')[0];
    var deletebtn=$('.deletebtn')[0];
    var edit_btn = $('.editbtn')[0];
   
    // editBTN=========================================================!
    movebtn.onclick=function(e){MoveElement(icon);}
    deletebtn.onclick=function(){
        icon.remove();

        //更新json檔與左側欄iconlist
        UpdateIconList()
        ClearIconList()
        ShowClassList()
    };

    //在設備上用滑鼠右鍵可以開啟有這個選項的manu 選擇編輯可觸發
    edit_btn.onclick = function(){
        //找到編輯設備的modal 顯示設備基本資料的區域(div)
        let showThisDevicDataDiv = document.getElementById('showThisDevicDataDiv');
        //資料先清掉不然會有上次紀錄
        showThisDevicDataDiv.innerHTML = "";
        //取得當前地圖名稱 變數cur_map全域
        let map = document.createElement('div');
        //取得當前設備種類 變數 icon.classList[1] ps: 因為這個物件只有class看得出設備種類(覺得容易出事)
        //icon.classList[1] 位置請參照 function CreateIcon(icon,x,y,iconcounts,devicename,url)
        //element.className=`element ${icon}`; //設定class為'element (icon名稱)'
        let kind = document.createElement('div');
        //取得當前設備名稱 利用傳入參數的id獲得value icon.id
        let name = document.createElement('div');
        //取得當前設備URL(IP)
        let ip = document.createElement('div');

        let formPost = document.getElementById('editOldDevicForm');
        let postData = "/editOldDevicPost?map="+ cur_map +"&deviceName=" + icon.id +"&deviceKind=" + icon.classList[1]
        formPost.setAttribute("action",postData)
        //設定req.query資料

        map.innerHTML =     "目標設備所在地圖名稱 : " + cur_map;
        map.setAttribute("id","edit_device_map_modal");
        kind.innerHTML =    "目標設備種類 : " + icon.classList[1] ;
        kind.setAttribute("id","edit_device_kind_modal");      
        name.innerHTML =    "目標設備名稱 : " + icon.id ;
        name.setAttribute("id","edit_device_name_modal");

        for(let i = 0 ; i < jsonData[cur_map]['icons'].length ; i++){
            if(jsonData[cur_map]['icons'][i].name == icon.id){
                ip.innerHTML = "目標設備IP : " + jsonData[cur_map]['icons'][i].url;
                ip.setAttribute("id","edit_device_ip_modal");
            }
        }
        showThisDevicDataDiv.appendChild(map);
        showThisDevicDataDiv.appendChild(kind);
        showThisDevicDataDiv.appendChild(name);
        showThisDevicDataDiv.appendChild(ip);
    }
     //檢查權限
     
     if(user_json.permission.device_move!=1){//如果沒有移動設備權限，則無效化移動按鈕
        console.log('move disabled')
        movebtn.remove()
        
    }
    if(user_json.permission.device_edit!=1){//如果沒有移動設備權限，則無效化編輯、刪除按鈕
        console.log('edit disabled')
        deletebtn.remove()
        edit_btn.remove()
    }
    //
}

function MoveElement(icon){ //點擊'移動'之function

    //將滑鼠改變為與icon一樣的圖示
    container.style.cursor=
    `url(${icon.currentSrc}),pointer`;

    

    //設定點擊container將觸發的事件
    container.onmousedown=function(e){   
        //改變icon的x,y座標，變成滑鼠當下的座標
        icon.style.marginTop=(e.offsetY+15)+'px';
        icon.style.marginLeft=e.offsetX+'px';

        
        container.onmousedown=null; //移除事件
        container.style.cursor='default'; //將滑鼠變為預設

        //更新json檔與左側欄iconlist
        UpdateIconList()
        ClearIconList()
        ShowClassList()

        //將未定位的設備定位完成後的動作
        if(icon.style.display=='none'){//判斷是否原先是未定位設備
            icon.style.display='block'//顯示設備
            $(`#${icon.id}_waitingdiv`)[0].remove()//移除原先在未定位區域的label,btn
        }
    }
        
}
function HideRmenu(){ //隱藏右鍵選單，點擊網頁任意地方觸發(在main中設定)
    rmenu.style.display='none';
}

//放大螢幕
function ScreenZoomIn(){

    //先將螢幕目前的x,y軸數值記錄下來，縮小時依照這個數字放置螢幕位置即可
    screen_PosX=screen.style.left
    screen_PosY=screen.style.top

    //改變螢幕的x,y軸數值、大小以及邊框大小
    screen.style.left="17%"
    screen.style.top="19%"
    mainscreen.style.width="640px"
    mainscreen.style.height="480px"
    mainscreen.style.padding="32px"

    //改變功能按鈕的大小以及x,y軸數值

    //縮放按鈕
    zoomscreen.style.width="32px"
    zoomscreen.style.height="32px"
    zoomscreen.style.top="448px"
    zoomscreen.style.left="608px"

    //關閉按鈕
    closescreen.style.width="32px"
    closescreen.style.height="32px"
    closescreen.style.left="608px"
}

//縮小螢幕
function ScreenZoomOut(){
    
    //還原成先前記錄下來的x,y軸位置
    screen.style.left=screen_PosX
    screen.style.top=screen_PosY

     //還原大小以及邊框大小
    mainscreen.style.width="320px"
    mainscreen.style.height="240px"
    mainscreen.style.padding="16px"

    //還原功能按鈕的大小以及x,y軸數值
    zoomscreen.style.width="16px"
    zoomscreen.style.height="16px"
    zoomscreen.style.top="222px"
    zoomscreen.style.left="302px"

    closescreen.style.width="16px"
    closescreen.style.height="16px"
    closescreen.style.left="302px"
}

function ClearIconList(){ //清除所有顯示的iconlist
    let allicondiv=$('.div') //選取所有class含有'div'之物件
    //清空所有選取物件的innerHTML
    for(let i=0;i<allicondiv.length;i++){
        allicondiv[i].innerHTML=''
    }
}


function ShowIconList(){ //掃描當前所有icon，並顯示於iconlist
    
    let targetdiv=$(`.${cur_map}`)[0] //目標div 假如當前map=first,則找到'first div'

    //icondict為dictionary型台物件，key,value分別對應 設備類別 、對應圖示之路徑
    //對icondict的key做循序走訪，即可分別處理每個設備類別
    for(let iconclass in icondict){

        let icons=$(`.${iconclass}`)//找到當前地圖中，class屬性屬於當前走訪的類別之所有設備，儲存成list

        //如果該list無內容，則代表當前地圖沒有指定類別的設備
        if(icons.length==0){
            continue;
        }

        //將當前設備類別名稱以label顯示
        let classTitle=document.createElement('label')
        classTitle.id=`classTitle ${iconclass}`
        classTitle.innerHTML=iconclass
        classTitle.className='classTitle'

        //將所有找到的設備名稱製作成label，加入一個div中
        let icondiv=document.createElement('div')
        for(let i=0;i<icons.length;i++){
            let icon=icons[i]
            let iconlabel=document.createElement('label')
            iconlabel.innerHTML=icon.id
            iconlabel.className='iconlabel' 
            let br =document.createElement('br')
            //將創建的label加入目標div並換行
            icondiv.appendChild(iconlabel)
            icondiv.appendChild(br)
        }
        //將創建好的類別名稱label以及設備列表div加入對應地圖之下
        targetdiv.appendChild(classTitle)
        targetdiv.appendChild(icondiv)

    }
}


var ClassShowingDict = {};//紀錄每個Class(設備類別)之下的設備清單的顯示狀態
//左方樹狀地圖的選單點擊後會先出現這個地圖的設備種類
//where happen: 
//event: when "map btn" OnClick
//active: show "icon kinds" on left side
function ShowClassList(){
    //目標div 假如當前map=first,則找到'first div'
    var target_map_div =$(`.${cur_map}`)[0];
    //jsonData資料icons種類
    var res_map = jsonData[cur_map]['icons'];
    //icons種類資料集設定
    const set = new Set();
    const icon_class = res_map.filter(item => !set.has(item.class) ?
    set.add(item.class): false);

    //div for class title (kinds) where can put button in here
    let classTitle_div = document.createElement("div");
    classTitle_div.className = `classTitle_div container`;
    classTitle_div.id = `classTitle_div_${cur_map}`;

    for(let i = 0 ; i < icon_class.length ; i++){
        let tar_class = icon_class[i].class;
        let classTitle = document.createElement("button");
        classTitle.id = `classTitle_${cur_map}_${tar_class}`;
        classTitle.innerHTML=tar_class;
        classTitle.className='button_slide slide_diagonal btn_wide_standard btn_wide_second classbtn'

        let classTitle_inner_div = document.createElement("div");
        classTitle_inner_div.className = `classTitle_inner_div`;
        classTitle_inner_div.id = `${cur_map}_${tar_class}_inner_div`
        
        ClassShowingDict[tar_class]=false//預設當前Class的設備清單顯示狀態為false

        classTitle.addEventListener('click', (e) => {//按下Class按鈕觸發
            
            ClassShowingDict[tar_class]=!ClassShowingDict[tar_class]//將顯示狀態反轉

            ClearClassIconList(tar_class)  //先清除當前class之下的清單         
            if(ClassShowingDict[tar_class]){//如果顯示狀態為true，則顯示清單
                showClassIcons(tar_class);
            }
            
        })

        //classTitle_div.parentElement.querySelector(`#${cur_map}`).classList.toggle("active");

        let br =document.createElement('br')
        //put btn in classTitle <div>
        classTitle_div.appendChild(classTitle)
        classTitle_div.appendChild(classTitle_inner_div)
        classTitle_div.appendChild(br)
    }

    target_map_div.appendChild(classTitle_div)

    //觸發所有Class按鈕之click，達到顯示所有設備清單效果
    let classbtns=$('.classbtn')
    for(let i=0;i<classbtns.length;i++){

        classbtns[i].click()
    }
}

function ClearClassIconList(tar_class){ //清除指定的iconlist
    let classdiv=$(`#${cur_map}_${tar_class}_inner_div`)[0] //選取指定class之設備清單div
    classdiv.innerHTML=''//清除內容
        
}

function showClassIcons(tar_class){
    let tar_btn_class = document.getElementById(`${cur_map}_${tar_class}_inner_div`);
    //find the target div (put icons in here)
    var res_map = jsonData[cur_map]['icons'];
    //get "icons" list which contain icon's information

    for(let i = 0 ; i < res_map.length ; i++){

        //如果當前設備類別等於指定的類別，以及非未定位設備
        if((tar_class == res_map[i].class) && (res_map[i].x!='')){
            //To descide what kind class it is and create element
            let icon_item = document.createElement('label');
            let br =document.createElement('br')
            icon_item.innerHTML = res_map[i].name;
            icon_item.classList = `icon_neme_label`;

            tar_btn_class.appendChild(icon_item)
            tar_btn_class.appendChild(br)
        }
    }
}

function UpdateIconList(){ //以送出表單至server的方式更新json

    mapnameinput.value=cur_map;//將表單的mapname欄位值設為當前map

    let iconlist=[] //以陣列存放各icon資料
    let icons=$('.element') //選取所有icon
    for(let i=0;i<icons.length;i++){
        let icon=icons[i]

        let iconclass=icon.className.split(' ')[1] 
        //icon的className是'element (icon名稱)' 所以用空格分割，取第二個值

        iconlist.push(`{"class":"${iconclass}","x":"${icon.style.marginLeft}","y":"${icon.style.marginTop}",
    "name":"${icon.id}","url":"${icon.alt}"}`)
        //以object形式包裝icon資料，class是icon類型,x是icon的x軸(marginLeft)值,y是icon的y軸(marginTop)值
        //並存入iconlist陣列
    }
    
    iconlistinput.value=iconlist; //設定表單的iconlist欄位值
    
    //將iconlist中的值轉成object存入新的陣列
    let iconlist_obj=[]
    for(let i=0;i<iconlist.length;i++){
        let obj=JSON.parse(iconlist[i])
        iconlist_obj.push(obj)

    }

    //將新的陣列值賦予給jsonData中當前地圖的icons欄位
    jsonData[cur_map].icons=iconlist_obj;
    console.log( mapnameinput.value,iconlistinput.value)
    //送出表單
    console.log(iconform)
    iconform.submit();
    
}

/* 
透過透明度range物件的操作影響圖片的透明度
當range物件發生改變時便會執行transparency()
透過opacity value change to achive it
*/ 
function transparency(){
    let adjustRate = document.getElementById("customRangeTrans").value;
    let mapImg = document.getElementById("myImgId");
    mapImg.style.opacity = adjustRate/100;  
}

// 把檔名加入對話框內顯示
// form modal (add file map img)
$(".custom-file-input").on("change", function() {
    var fileName = $(this).val().split("\\").pop();
    $(this).siblings(".custom-file-label").addClass("selected").html(fileName);
});



function ShowDeivceStatus(){ 
    console.log()
    let icons=$('.element')
    
    let restartstatus=false
    for(let i=0;i<icons.length;i++){

        let icon=icons[i]//取得設備物件
        let deviceurl=icon.alt//取得設備的url

        //每個設備發一個request到server，server會回傳該設備的狀態
        //如果ip是新的 則server會傳回新的Wsport號
        $.getJSON(`/getStatus?url=${deviceurl}&cur_status=${ipstatusdict[deviceurl]}`,(data)=>{
            if(data[0].status){//狀態為true
                icon.style.filter='hue-rotate(90deg)';//顏色轉換
                if(ipstatusdict[deviceurl]==false){//如果此設備上一個狀態為關閉
                    if(!restartstatus){//避免二次重啟server
                        restartstatus=true//要重啟server
                        $.getJSON('http://localhost/restart')//發出重啟server請求
                    }
                        
                }
                ipstatusdict[deviceurl]=true;//記錄此設備狀態
            }
            else{//狀態為false
                icon.style.filter='hue-rotate(0deg)';//顏色轉回原始
                ipstatusdict[deviceurl]=false;//記錄此設備狀態
            }
            //console.log('newport',data[0].newport)
            //傳回的newport不為0，代表有新的Wsport產生
            if(data[0].newport!=0){
                devicedict[deviceurl]=data[0].newport
            }
        })
    }    
    
    
}

$(function () {
    $('[data-toggle="tooltip"]').tooltip()
})

function MapnameOverlap(){
    let inputmapname=document.getElementById('editNewFileNameId').value
    if(jsonData[inputmapname]!=undefined){
        alert('新的地圖名稱不能與舊的重複')
    }
}

function deviceNameOverlap(){
    let map = document.getElementById('addNewDevice_MapName').value;
    // let kind = document.getElementById('new_device_kind').value;
    let name = document.getElementById('new_device_name_input').value;
 
    for(let i = 0 ; i < jsonData[map]['icons'].length ; i++){
        if( jsonData[map]['icons'][i].name == name){
            alert('在該區域新的設備名稱不能與該區域既有的設備名稱重複')
        }
    }
}

function editDeviceNameOverlap(){
    let map = cur_map;
    let name = document.getElementById('edit_device_name_input').value;

    for(let i = 0 ; i < jsonData[map]['icons'].length ; i++){
        if( jsonData[map]['icons'][i].name == name){
            alert('在該區域新的設備名稱不能與該區域既有的設備名稱重複')
        }
    }
}

function MapExist() {
    let inputmapname=document.getElementById('map-Name').value
    if(jsonData[inputmapname]!=undefined){
        alert('地圖已存在')
    }
}

function checkserver(url) {
    // 定義 Http request
    var req = new XMLHttpRequest()
    //發送get請求至url
    req.open('GET', url)

    //當請求失敗時觸發事件
    req.onerror=()=>{
        console.log('error')
        $('#serverdeadbtn')[0].click();
        serverdead=true
    }
    /////////

    req.send()//發送請求
}

function CheckOrdinaryPassword(){
    //取得使用者原始密碼
    let ordinary_password=user_json.password

    //取得使用者輸入的原始密碼、新密碼
    let entered_ordinary_password=$('#ordinary_password')[0].value
    let entered_new_password=$('#new_password')[0].value

    //確認使用者輸入的原始密碼是否為真正的原始密碼
    if(entered_ordinary_password!=ordinary_password){//輸入錯誤
        //跳出警告
        alert('原密碼輸入錯誤')
        return
    }
    else if(entered_new_password==entered_ordinary_password){//如果新密碼=舊密碼
        alert('新密碼不可與舊密碼相同')
        return
    }
    else{//輸入正確

        //變更記憶體中user_json的密碼資料
        user_json.password=entered_new_password
        //觸發變更密碼按鈕的click事件，關閉視窗
        $('#ChangePasswordBtn')[0].click()
    }
    
}