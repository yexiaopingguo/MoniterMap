
var jsonData={};//存放json檔資料之變數
var cur_map=''; //代表當前畫面上的地圖名稱

var tab_len = 0; 

var backimg=$('.backgroundimg')[0] //html中的背景圖片img
var show=$('.show')[0] //html中的顯示當前地圖名稱label

var icondict={"monitor":"../icon/imac.png","lamp":"../icon/lamp-post.png"}//各icon對應的檔案路徑
       
var leftdiv=$('.leftcontainer')[0] //左側欄div
var btntitle=$('.buttontitle')[0]  //說明icon按鈕之標題(label)
var monitorbtn=$('.monitorButton')[0]; //monitor icon之按鈕
var lampbtn=$('.lampButton')[0];       //lamp 按鈕
var cancel=$('.cancel')[0];            //取消按鈕
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

//展開與摺疊縮放設備列表功能所使用的變數

var iconlistshowing=false//是否顯示設備列表
var lastclick=''//紀錄按下的地圖名稱

var ipstatusdict={}//存放ip以及其最新狀態的dict

var serverdead=false//紀錄server是否斷線

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

function main() {

    //每隔1秒檢查一次server狀態
    setInterval(() => {

        //如果server沒斷線，則執行檢查
        if(!serverdead){
            checkserver('http://localhost:3000')
        }
    }, 1000);

    Addmaps();//使用讀取到的資料來創建map
    
    //設置icon按鈕之事件
    monitorbtn.addEventListener("click", function(e){SelectIcon("monitor");});
    lampbtn.addEventListener("click", function(e){SelectIcon("lamp");});

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
        map.id=mapname //設定button id
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
            }

            //開啟刪除確認表單(按下隱藏的呼叫表單按鈕)
            $('#deletemapbtn')[0].click()
            
        })
        
        iconlistdiv.className=mapname+' div' //設定iconlistdiv之class
        //將map,delebtn加入mapdiv
        mapdiv.appendChild(map)
        mapdiv.appendChild(deletebtn)
        //插入map iconlistdiv在btntitle上方
        leftdiv.insertBefore(mapdiv,btntitle) 
        leftdiv.insertBefore(iconlistdiv,btntitle)
        
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
        CreateIcon(icons[i].class,icons[i].x,icons[i].y,iconcounts,icons[i].name,icons[i].url)//根據icons各欄位資料創建Icon
        iconcounts+=1 //創建後iconcounts+1
    }
}
function CreateIcon(icon,x,y,iconcounts,devicename,url){
    let iconsrc=icondict[icon] //根據icon名稱取得img的src
    var element=document.createElement("img");
    element.className=`element ${icon}`; //設定class為'element (icon名稱)'
    element.id=devicename; //設定id
    element.src=iconsrc; //指定src
    element.alt=url;
    
    //將x,y值設定給element
    element.style.marginLeft = x;
    element.style.marginTop = y;

    element.addEventListener('dblclick',(e)=>{
        var e=window.event;
        console.log(devicedict[url])
        //將選單位置設為滑鼠右鍵點擊icon時位置，並顯示

        mainscreen.remove()
        let newscreen=document.createElement('canvas')
        newscreen.className='mainscreen'
        newscreen.id='canvas_5000'
        screen.appendChild(newscreen)
        mainscreen=$('.mainscreen')[0]

        player = new JSMpeg.Player(`ws://localhost:${devicedict[url]}`, {
			canvas: document.getElementById('canvas_5000'),
			autoplay:true,//是否自动播放
			loop:true,
		});
        console.log(player)
        
        screen.style.left = e.clientX + 'px';
        screen.style.top = e.clientY + 'px';
        screen.style.display = 'flex';
    })
    //設定右鍵觸發事件
    element.addEventListener('contextmenu', 
    function(e){
        e.preventDefault(); //取消瀏覽器預設事件
        showrightmenu();    //顯示移動刪除選單
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
        let map = document.createElement('lable');
        //取得當前設備種類 變數 icon.classList[1] ps: 因為這個物件只有class看得出設備種類(覺得容易出事)
        //icon.classList[1] 位置請參照 function CreateIcon(icon,x,y,iconcounts,devicename,url)
        //element.className=`element ${icon}`; //設定class為'element (icon名稱)'
        let kind = document.createElement('lable');
        //取得當前設備名稱 利用傳入參數的id獲得value icon.id
        let name = document.createElement('lable');
        //取得當前設備URL(IP)
        let ip = document.createElement('lable');

        map.innerHTML =     "目標設備所在地圖名稱 : " + cur_map + "<br/>";
        map.setAttribute("id","edit_device_map_modal");
        kind.innerHTML =    "目標設備種類 : " + icon.classList[1] + "<br/>" ;
        kind.setAttribute("id","edit_device_kind_modal");      
        name.innerHTML =    "目標設備名稱 : " + icon.id + "<br/>" ;
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
}

function MoveElement(icon){ //點擊'移動'之function

    //將滑鼠改變為與icon一樣的圖示
    container.style.cursor=
    `url(${icon.currentSrc}),pointer`;

    //將當前icon套上灰色濾鏡
    icon.style.filter='grayscale(100%)';

    //設定點擊container將觸發的事件
    container.onmousedown=function(e){   
        //改變icon的x,y座標，變成滑鼠當下的座標
        icon.style.marginTop=(e.offsetY+15)+'px';
        icon.style.marginLeft=e.offsetX+'px';

        icon.style.filter=null;//移除濾鏡
        container.onmousedown=null; //移除事件
        container.style.cursor='default'; //將滑鼠變為預設

        //更新json檔與左側欄iconlist
        UpdateIconList()
        ClearIconList()
        ShowClassList()
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

function SelectIcon(icon)//icon button被按下時觸發 icon是按下的按鈕名稱
{
        iconsrc=icondict[icon];//根據icon名稱取得img的src

        //顯示cancel按鈕並綁定事件
        cancel.style.display='inline';
        cancel.addEventListener("click", Cancel);

        //將滑鼠改變為與icon一樣的圖示
        container.style.cursor=
    	`url(${iconsrc}),pointer`;

        //設定container之點擊事件
        container.onmousedown = function(e)
        {SetIconbyMouse(e,icon);};

}

function Cancel()
{
    	cancel.style.display="none";
        container.style.cursor="default";
        container.onmousedown = null;
}

function SetIconbyMouse(e,icon)
{
        
        var PosX = 0;
        var PosY = 0;

        if (!e) var e = window.event;
        if (e.offsetX || e.offsetY)
        {
            PosX = e.offsetX;//offsetX可以取得e的x值,(0,0)在左上角
            PosY = e.offsetY;//同理
        }
        //值的尾端加上px
        PosX=PosX+"px"
        PosY=(PosY+15)+"px"
        console.log(PosX);
        console.log(PosY);

        //將表單位置設為滑鼠右鍵點擊icon時位置，並顯示
        deviceInfoDiv.style.left = e.clientX + 'px';
        deviceInfoDiv.style.top = e.clientY + 'px';
        deviceInfoDiv.style.display = 'flex';
        
        deviceCancel.onclick=()=>{
            deviceInfoDiv.style.display='none'
        }
        deviceReset.onclick=()=>{
            devicename.value=''
            url.value=''

        }
        //20220811 note:不需要使用form(在送出表單過程中不可送出另一表單，另一表單不會正常送出)
        deviceSubmit.onclick=()=>{

            deviceInfoDiv.style.display = 'none';
            CreateIcon(icon,PosX,PosY,iconcounts,devicename.value,url.value)//創建Icon
            console.log('after create')

            //更新json檔與左側欄iconlist
            ClearIconList()
            UpdateIconList()
            console.log('after update')
            ShowClassList()

            //創建並更新後完成執行Cancel
            Cancel() 

            iconcounts+=1//icon數+1  
        }
        
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
    
    for(let iconclass in icondict){
        let icons=$(`.${iconclass}`)
        if(icons.length==0){
            continue;
        }
        let classTitle=document.createElement('label')
        classTitle.id=`classTitle ${iconclass}`
        classTitle.innerHTML=iconclass
        classTitle.className='classTitle'
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
        targetdiv.appendChild(classTitle)
        targetdiv.appendChild(icondiv)

    }
}


var iconShow = false;
var tar_classTitle_id
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
        classTitle.className='button_slide slide_diagonal btn_wide_standard btn_wide_second'

        let classTitle_inner_div = document.createElement("div");
        classTitle_inner_div.className = `classTitle_inner_div`;
        classTitle_inner_div.id = `${cur_map}_${tar_class}_inner_div`
        

        classTitle.addEventListener('click', (e) => {
            
            if(e.target.id == tar_classTitle_id){
                iconShow = !iconShow
            }else{
                iconShow = true;
            }

            ClearClassIconList()           
            if(iconShow){
                showClassIcons(tar_class);
            }

            tar_classTitle_id = `classTitle_${cur_map}_${tar_class}`;
            
        })

        //classTitle_div.parentElement.querySelector(`#${cur_map}`).classList.toggle("active");

        let br =document.createElement('br')
        //put btn in classTitle <div>
        classTitle_div.appendChild(classTitle)
        classTitle_div.appendChild(classTitle_inner_div)
        classTitle_div.appendChild(br)
    }

    target_map_div.appendChild(classTitle_div)
}

function ClearClassIconList(){ //清除所有顯示的iconlist
    let allicondiv=$('.classTitle_inner_div') //選取所有class含有'div'之物件
    //清空所有選取物件的innerHTML
    for(let i=0;i<allicondiv.length;i++){
        allicondiv[i].innerHTML=''
    }
}

function showClassIcons(tar_class){
    let tar_btn_class = document.getElementById(`${cur_map}_${tar_class}_inner_div`);
    //find the target div (put icons in here)
    var res_map = jsonData[cur_map]['icons'];
    //get "icons" list which contain icon's information

    for(let i = 0 ; i < res_map.length ; i++){
        if(tar_class == res_map[i].class){
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
    //$.getJSON('localhost/restart')
    for(let i=0;i<icons.length;i++){
        let icon=icons[i]
        let deviceurl=icon.alt
        console.log(deviceurl)
        if(devicedict[deviceurl]!=undefined){
            $.getJSON(`/getStatus?url=${deviceurl}&cur_status=${ipstatusdict[deviceurl]}`,(data)=>{
                console.log(data[0].status)
                if(data[0].status){
                    console.log('in')
                    icon.style.filter='hue-rotate(90deg)';
                    if(ipstatusdict[deviceurl]==false){
                        $.getJSON('http://localhost/restart')
                    }
                    ipstatusdict[deviceurl]=true;
                }
                else{
                    icon.style.filter='hue-rotate(0deg)';
                    ipstatusdict[deviceurl]=false;
                }
            })
        }
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
    let map = document.getElementById('edit_device_map_input').value;
    let name = document.getElementById('edit_device_name_input').value;

    for(let i = 0 ; i < jsonData[map]['icons'].length ; i++){
        if( jsonData[map]['icons'][i].name == name){
            alert('在該區域新的設備名稱不能與該區域既有的設備名稱重複')
        }
    }
}

function MapExist(){
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
