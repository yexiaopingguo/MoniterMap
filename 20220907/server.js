//引入套件
const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();
const fs = require('fs');
const bodyParser = require('body-parser')
var ping = require('ping');

//讀取本地json檔案
var jsonData = require('./public/maps/maplist.json');
var devicedict = require('./public/device_and_port.json')
var fileoriname; //用於儲存上傳檔案之檔名


//server物件(app)之參數設定
app.use(express.static('public')) //host於public資料夾，可讀取public資料夾下的檔案

//使server可解析html form所傳送的值(標準寫法)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.listen(3000);//server使用的port

//設定上傳檔案之存放位置
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public')//預設存放於Public資料夾下
    },
    filename: (req, file, cb) => {
        const { originalname } = file; //取得上傳檔案之原始名稱

        fileoriname = originalname; //以fileoriname儲存
        cb(null, originalname); //存放的filename設為上傳檔案之原始名稱
    }
})

var upload = multer({ storage }); //使用設定好的檔案存放方式

//設定router(對應上傳檔案之form)
app.post('/addFilePost', upload.array('addMapImgFile'), (req, res) => {//在執行下面區段前，會先將檔案以上面設定的方式存放

    //首先修改存放的檔案之路徑

    if (jsonData[req.body.newAddMapImgName] != undefined) {
        return res.sendStatus(204)
    }
    //創建一個資料夾，名稱為client端輸入的地圖名稱
    console.log(req.body.newAddMapImgName)
    var foldername = `public/maps/${req.body.newAddMapImgName}`;
    fs.mkdir(path.join(__dirname, foldername), (err) => {
        if (err) {
            return console.error(err);
        }
        console.log('Directory created successfully!');
    });
    //將存放於public下的檔案移置剛創建的資料夾下
    fs.rename(`public/${fileoriname}`, `${foldername}/${fileoriname}`, (err) => {
        if (!err) {
            console.log('Move Success')
        }
        else {
            return console.error(err)
        }

    })

    //jsonData是讀取到的json檔案
    jsonData[req.body.newAddMapImgName] = { 'mapname': fileoriname };//設定地圖名與對應的檔案
    //key值是地圖名稱,value則是object形式，先指定mapname=檔案原始名稱
    var jsonarr = JSON.stringify(jsonData);//轉成json格式
    //console.log(jsonarr)
    fs.writeFileSync('public/maps/maplist.json', jsonarr)//寫入本地json檔案
    return res.redirect('back')//刷新頁面
});
//設定router(對應更新icon之form)
app.post('/iconform', (req, res) => {

    //取得表單各欄位之value
    let mapname = req.body.mapname_v//目標地圖
    let iconlist = req.body.iconlist_v//icon陣列，此時為字串
    if (iconlist == '') {
        jsonData[mapname]['icons'] = [];
        let jsonarr = JSON.stringify(jsonData);
        fs.writeFileSync('public/maps/maplist.json', jsonarr)
        return res.sendStatus(204);
    }
    let newiconlist = []//用於存放轉成json格式的iconlist

    iconlist = iconlist.split("},")//將字串分割成list
    for (let i = 0; i < iconlist.length; i++) {
        let icon = iconlist[i]
        if (iconlist.length > 1 && i < iconlist.length - 1) {//當陣列長度>1和當前位置不是最後一位時
            icon = icon + "}" //將icon末端+}(因上述的split)
        }

        icon = JSON.parse(icon)//轉json格式
        newiconlist.push(icon)//加入陣列中
    }

    jsonData[mapname]['icons'] = newiconlist//設定指定地圖的value之icons欄位值為icon陣列

    //寫入本地json檔
    let jsonarr = JSON.stringify(jsonData);
    //console.log(jsonarr)
    fs.writeFileSync('public/maps/maplist.json', jsonarr)

    res.sendStatus(204)//回應204狀態碼(OK,但不回傳任何東西)

});

var Stream = require('node-rtsp-stream');
const { json } = require('body-parser');
var streamlist = {}
for (let url in devicedict) {
    streamlist[url] = new Stream({
        name: 'socket',
        streamUrl: url,
        wsPort: devicedict[url],
        ffmpegOptions: {
            '-stats': '',
            '-r': 20,
            '-s': '1920 1080'
        }
    })
}

var portcount = 1
app.get('/getStatus', (req, res) => {

    let url = req.query.url
    let cur_status = req.query.cur_status
    console.log(cur_status)
    let havestream = false
    /*
    //重新拉，推流
    streamlist[url].wsServer.close();//先將該url對應的Stream物件中的wsServer關閉
    streamlist[url]=new Stream({//在建立一樣的Stream物件
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
    */
    let ip = url.split('@')[1]
    ip = ip.split(':')[0]
    console.log(ip)

    ping.sys.probe(ip, function (isAlive) {
        var msg = isAlive ? 'host ' + ip + ' is alive' : 'host ' + ip + ' is dead';
        console.log(msg);
        if (isAlive) {
            havestream = true
        }

    });
    /*
    console.log(streamlist[url].wsServer)
    
    if(streamlist[url].stream.exitCode==null){
        //console.log('streaming in')
        havestream=true
    }*/
    setTimeout(() => {
        res.writeHead(200, {
            'Content-Type': 'application/json'
        })
        console.log('s')
        let jsondata = [{ 'status': havestream }]
        res.end(JSON.stringify(jsondata))
    }, 500);

})



// 在主頁面的選單有編輯地圖名稱的按鈕，打開表單可以選擇地圖的名稱以及要更改的名稱
// 輸入完送出則會啟用action "/editFilePost" 連結到這裡做處理
app.post("/editFilePost", (req, res) => {

    //檢查名稱是否重複
    if (jsonData[req.body.editNewFileName] != undefined) {


        return res.sendStatus(204)
    }

    try {
        //資料夾名稱更改
        fs.renameSync(`./public/maps/${req.body.selectMapName}/`, `./public/maps/${req.body.editNewFileName}/`);

        //json 檔案處理
        //新增 新的地圖(資料夾 req.body.editNewFileName) 名稱後 把舊的地圖資料給新的地圖名稱
        jsonData[req.body.editNewFileName] = jsonData[req.body.selectMapName];
        //刪除舊的資料
        delete jsonData[req.body.selectMapName];
        //轉成json格式
        var jsonarr = JSON.stringify(jsonData);
        //寫入本地json檔案
        fs.writeFileSync('public/maps/maplist.json', jsonarr)

    } catch (err) {
        console.log(err);
        return res.redirect('back')//刷新頁面 
    }

    console.log("Rename Successful!");
    return res.redirect('back')//刷新頁面  
})
//刪除地圖
app.get('/DeleteMap', (req, res) => {
    let TargetMap = req.query.mapname//取得req傳送之mapname參數
    delete jsonData[TargetMap]//刪除對應地圖資料
    //寫入json檔案
    var jsonarr = JSON.stringify(jsonData)
    fs.writeFileSync('public/maps/maplist.json', jsonarr)
    //回傳204狀態碼
    res.sendStatus(204)
})

//新增設備表單ip
app.post('/addItemLinkPost', (req, res) => {
    try {
        let mapName = req.body.selectMapName;
        //取得地圖名稱
        let deviceClass = req.body.selectItemClass;
        //取得設備類別
        let deviceName = req.body.selectItemName;
        //取得設備名稱
        let deviceIp = req.body.addItemIpName;
        //取得設備IP

        console.log('/addItemLinkPost work !')
        // console.log(mapName)
        // console.log(deviceClass)
        // console.log(deviceName)
        // console.log(deviceIp)

        //依照地圖內設備數量為範圍 找到該選取設備
        for (let i = 0; i < jsonData[mapName]['icons'].length; i++) {
            if ((jsonData[mapName]['icons'][i].class == deviceClass)
                && (jsonData[mapName]['icons'][i].name == deviceName)) {
                jsonData[mapName]['icons'][i].url = deviceIp;
                //ip 存放進資料
                console.log(jsonData[mapName]['icons'][i] + "url新增成功");
            }
        }

        //轉成json格式
        let jsonarr = JSON.stringify(jsonData);
        //寫入本地json檔案
        fs.writeFileSync('public/maps/maplist.json', jsonarr)

    } catch (e) {
        console.log(e + "happen in '/addItemLinkPost'");
         
    }
    return res.redirect('back')//刷新頁面 
})


//主頁面表單 新增設備資料 
app.post('/addNewDevicPost', (req, res) => {
    try{
        
        let map = req.body.selectNewDeviceMapName;
        //地圖名稱
        let kind = req.body.selectDeviceKind;
        //設備種類
        let name = req.body.new_device_name_input;
        //名稱

        //檢查設備名稱重複
        for(let i = 0 ; i < jsonData[map]['icons'].length ; i++){
            if(jsonData[map]['icons'][i].name == name){
                console.log(name + " has been existed in file")               
                return res.status(204)                               
            }
        }

        //設備資料寫入
        let device = { "class" : kind , 
                        "x": "",
                        "y": "",
                        "name": name,
                        "url": ""}

        jsonData[map]['icons'].push(device)
        // console.log(jsonData[map]['icons'])
        var jsonarr = JSON.stringify(jsonData)
        fs.writeFileSync('public/maps/maplist.json', jsonarr)

    }catch(e){
        console.log(e + " happen in /addNewDevicPost ")
    }
    return res.redirect('back')//刷新頁面 
})

