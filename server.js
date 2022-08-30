// 引入套件
const express = require('express');
const multer = require('multer');
const path = require('path');
const uuid = require('uuid').v4;
const app = express();
const fs = require('fs');
const bodyParser=require('body-parser')
const Stream = require('node-rtsp-stream')

// 讀取本地json檔案
var jsonData = require('./public/maps/maplist.json');
var devicedict=require('./public/device_and_port.json')

var fileoriname;    // 用於儲存上傳檔案之檔名

// server物件(app)之參數設定
app.use(express.static('public'))    // host於public資料夾，可讀取public資料夾下的檔案

// 使server可解析html form所傳送的值(標準寫法)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.listen(3000);    // server使用的port

// 設定上傳檔案之存放位置
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public')    // 預設存放於Public資料夾下
    },
    filename: (req, file, cb) => {
        const { originalname } = file;    // 取得上傳檔案之原始名稱
        
        fileoriname=originalname;    // 以fileoriname儲存
        cb(null, originalname);    // 存放的filename設為上傳檔案之原始名稱
    }
})

var upload = multer({ storage });    // 使用設定好的檔案存放方式

// 設定router(對應上傳檔案之form)
app.post('/addFilePost', upload.array('addMapImgFile'), (req, res) => {    // 在執行下面區段前，會先將檔案以上面設定的方式存放

    // 首先修改存放的檔案之路徑
    // 創建一個資料夾，名稱為client端輸入的地圖名稱
    console.log(req.body.newAddMapImgName)
    var foldername=`public/maps/${req.body.newAddMapImgName}`;
    fs.mkdir(path.join(__dirname, foldername), (err) => {
        if (err) {
            return console.error(err);
        }
        console.log('Directory created successfully!');
    });

    // 將存放於public下的檔案移置剛創建的資料夾下
    fs.rename(`public/${fileoriname}`,`${foldername}/${fileoriname}`,(err)=>{
        if(!err){
            console.log('Move Success')
        }
        else{
            return console.error(err)
        }
        
    })

    // jsonData是讀取到的json檔案
    jsonData[req.body.newAddMapImgName]={'mapname':fileoriname};    // 設定地圖名與對應的檔案
    // key值是地圖名稱,value則是object形式，先指定mapname=檔案原始名稱
    var jsonarr=JSON.stringify(jsonData);    // 轉成json格式
    // console.log(jsonarr)
    fs.writeFileSync('public/maps/maplist.json',jsonarr)    // 寫入本地json檔案
    return res.redirect('back')    // 刷新頁面
});

// 設定router(對應更新icon之form)
app.post('/iconform',(req,res)=>{
    //取得表單各欄位之value
    let mapname=req.body.mapname_v    // 目標地圖
    let iconlist=req.body.iconlist_v    // icon陣列，此時為字串
    if(iconlist==''){
        jsonData[mapname]['icons']=[];
        let jsonarr=JSON.stringify(jsonData);
        fs.writeFileSync('public/maps/maplist.json',jsonarr)
        return res.sendStatus(204);
    }
    let newiconlist=[]    // 用於存放轉成json格式的iconlist
    
    iconlist=iconlist.split("},")    // 將字串分割成list
    for(let i =0;i<iconlist.length;i++){
        let icon=iconlist[i]
        if(iconlist.length>1 && i<iconlist.length-1){    // 當陣列長度>1和當前位置不是最後一位時
            icon=icon+"}"    // 將icon末端+}(因上述的split)
        }
        
        icon=JSON.parse(icon)    // 轉json格式
        newiconlist.push(icon)    // 加入陣列中
    }
    
    jsonData[mapname]['icons']=newiconlist    // 設定指定地圖的value之icons欄位值為icon陣列

    // 寫入本地json檔
    let jsonarr=JSON.stringify(jsonData);
    //console.log(jsonarr)
    fs.writeFileSync('public/maps/maplist.json',jsonarr)
    
    res.sendStatus(204)    // 回應204狀態碼(OK,但不回傳任何東西)
    
});


// 建立串流物件
var streamlist={}   // 用於存放stream物件的dict，key:url,value:Stream物件

for(let url in devicedict){     // devicedict等同於device_and_port.json的內容

    streamlist[url]=new Stream({
        name: 'socket',
        streamUrl: url,
        wsPort: devicedict[url],    // 將WebSocket Port指定為devicedict中，該url對應的port號
        ffmpegOptions:{
            '-stats': '',
            '-r': 20,
            '-s': '1920 1080'
        }
    })
   
}
////////////

// 取得對應url之串流狀態，並傳送對應response(需改進取得狀態的方式)

app.get('/getStatus',(req,res)=>{
    
    let url=req.query.url// request傳送過來的url參數
    let havestream=false // 用於判斷串流狀態的bool

    // 重新拉，推流
    streamlist[url].wsServer.close();       // 先將該url對應的Stream物件中的wsServer關閉
    streamlist[url]=new Stream({    // 在建立一樣的Stream物件
            name: 'socket',
            streamUrl: url,
            wsPort: devicedict[url],
            ffmpegOptions:{
                '-stats': '',
                '-r': 20,
                '-s': '1920 1080'
            }
    })
    //////

    // 使用Stream物件中的stream.exitCode屬性判斷串流狀態(可能需要改)

    if(streamlist[url].stream.exitCode==null){
        console.log('true')
        //console.log('streaming in')
        havestream=true
    }

    // 傳送response，狀態碼200,內容類型為json檔

    res.writeHead(200,{
        'Content-Type' : 'application/json'
    })
    let jsondata=[{'status':havestream}]    // 建立json檔內容
    res.end(JSON.stringify(jsondata))   // 回傳response
    /////
})

// 顯示警告訊息套件 npm install alert
const alert = require('alert'); 

// 在主頁面的選單有編輯地圖名稱的按鈕，打開表單可以選擇地圖的名稱以及要更改的名稱
// 輸入完送出則會啟用action "/editFilePost" 連結到這裡做處理
app.post("/editFilePost", (req,res)=>{
    
    // 檢查名稱是否重複
    for(var key in jsonData){
        if(key == req.body.editNewFileName){
            alert("新的地圖名稱不能和舊的重複")
            console.log("Rename fale");
            return res.redirect('back');
        }
    }

    try{
        // 資料夾名稱更改
        fs.renameSync(`./public/maps/${req.body.selectMapName}/` , `./public/maps/${req.body.editNewFileName}/`);

        // json 檔案處理
        // 新增 新的地圖(資料夾 req.body.editNewFileName) 名稱後 把舊的地圖資料給新的地圖名稱
        jsonData[req.body.editNewFileName] = jsonData[req.body.selectMapName];
        // 刪除舊的資料
        delete jsonData[req.body.selectMapName];
        // 轉成json格式
        var jsonarr=JSON.stringify(jsonData);
        // 寫入本地json檔案
        fs.writeFileSync('public/maps/maplist.json',jsonarr)       
   
    }catch(err){
        console.log(err);
        return res.redirect('back')     // 刷新頁面 
    }
    
    console.log("Rename Successful!");
    return res.redirect('back')     // 刷新頁面  
})