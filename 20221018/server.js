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

// 在伺服器剛剛開啓的時候就刷新用戶文檔的json，當作緩衝區
var users = require('./USER/users.json')
var records = require('./USER/records.json')
// console.log(users)


// server物件(app)之參數設定
// app.use(express.static('public')) // host於public資料夾，可讀取public資料夾下的檔案
// 給一個不存在的默認主頁，這樣下面我們才能使用動態的方式，根據用戶登入者傳入主頁的變數
app.use(express.static(__dirname+"/public",{index:"CowPussy.html"}));    

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


// -----------------------------------------------------------------------------------------------------------------
// 登入系統
// -----------------------------------------------------------------------------------------------------------------

// 使用express-session框架儲存用戶上傳信息，并且在下次登入的時候可以記住本機已經登入的用戶
// express-session是一個middleware，需要把它寫在路由之前
const session = require('express-session');

// 使用客戶端的Cookie和服務器端口的Session來儲存客戶登入的信息
app.use(session({
  secret: 'mySecret',
  name: 'user',    // 設定用戶的登入條件為session.user，默認的話為connect.sid
  saveUninitialized: false,    // 使用者沒登入時候，不寫入session
  resave: true,    // 永久保存session
}))


// 讀取 users.json檔案
function Read_Users () {
    /*
    // 異步方式讀取文檔，效率較高，但可能導致錯誤
    fs.readFile('./USER/users.json', 'utf-8', (err, jsonString) => {
        if(err) {
            console.log(err);
        } else {
            try {
                users = JSON.parse(jsonString)
            } catch (err) {
                console.log('Error parsing JSON', err)
            }
        }
    })*/
    
    // 同步方式讀取文檔，刷新 users 物件變量
    try {
        let jsonString = fs.readFileSync('./USER/users.json', 'utf-8')
        users = JSON.parse(jsonString)
        // console.log(users)
    } catch (err) {
        console.log(err)
    }
}


// 將新資訊寫入 users.json 檔案
function Write_Users () {
    
    // 寫入 users 物件變量
    fs.writeFile('./USER/users.json', JSON.stringify(users, null, "\t"), err => {
        if(err) {
            console.log(err);
        } else {
            // console.log('User successfully created!')
        }
    })
}


// 讀取 records.json 檔案
function Read_Records () {
    
    // 讀取文檔
    try {
        let jsonString = fs.readFileSync('./USER/records.json', 'utf-8')
        records = JSON.parse(jsonString)
        // console.log(users)
    } catch (err) {
        console.log(err)
    }
}


// 將新資訊寫入 records.json 檔案
function Write_Records () {
    
    // 寫入記錄json文件
    fs.writeFile('./USER/records.json', JSON.stringify(records, null, "\t"), err => {
        if(err) {
            console.log(err);
        } else {
            // console.log('records update!')
        }
    })
}

// 取得登入用戶的IP地址
function getIPAdress() {
    var interfaces = require('os').networkInterfaces();
    for (var devName in interfaces) {
        var iface = interfaces[devName];
        for (var i = 0; i < iface.length; i++) {
            var alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
}


// 主頁頁面
app.get('/', (req, res) => {
    
    // 印出當前客戶端的session信息
    // console.log(req.session)
    // console.log(req.sessionID)
    
    // 如果有用戶session，代表已經登入即進入主頁，否則强制導向注冊頁面
    if (req.session.user) {

        // 主頁
        return res.sendFile(__dirname + '/public/index.html')

    } else {

        // Login頁面
        return res.redirect('/login')
    }
})


// 主頁在刷新時，通過物件方式從這裏取得當前登入用戶的基本資料
app.post('/get_user_data', (req, res) => {
    
    // 假設是以賬號方式登入
    if (req.session.user && req.session.user != 'tourist') {
        for (let get_user of users) {
            if (get_user.name == req.session.user) {
                return res.end(JSON.stringify(get_user))
            }
        }

    // 假設是以游客方式登入
    } else if (req.session.user == 'tourist') {
        
        // 游客的資料結構，僅具有觀看的權限
        let tourist_user = {
            "name": "tourist",
            "email": "",
            "password": "",
            "permission": {
                "map_edit": 0,
                "device_edit": 0,
                "device_move": 0,
                "view_page": 1
            }
        }

        return res.end(JSON.stringify(tourist_user))

    } else {
        // 如果出現這種情況，代表主頁功能出錯
        return res.end("Account_Err")
    }
})


// 登入初始頁面
app.get('/login', (req, res) => {

    // 如果有登入過一次(非游客)，本地留有cookie時候，下次登入自動寫入賬戶信息
    if(req.session.user && req.session.user != 'tourist') {
        
        // 先做刷新用戶列表的動作
        Read_Users()

        // 從緩衝區裏面讀取，找到對應的賬戶信息
        for (let get_user of users) {
            if (req.session.user == get_user.name) {
                res.locals.email = get_user.email
            }
        }
    }
    
    return res.render('login.ejs')
})


// 登入按鈕POST表單事件
app.post('/login', (req, res) => {

    // 先做刷新用戶列表的動作
    Read_Users()
    
    // 取得post過來的資訊
    let user = {
        "email": req.body.email,
        "password": req.body.password
    }

    // Filter過濾器，目前寫的比較簡單，主要還是看甲方有什麽需求再改
    // 首先判斷是不是空值 
    if (user.email.trim() == '' || user.password.trim() == '') {
        
        // 回報一次性的錯誤
        res.locals.err = "郵箱或密碼輸入為空值"

        return res.render('login.ejs')
    } else {

        // 判斷賬號和密碼是否對應正確
        for (let get_user of users) {
            if (get_user.email == user.email && get_user.password == user.password) {
                
                // 成功登入，寫入客戶端cookie
                req.session.user = get_user.name

                // 并且寫入記錄
                // 并留下records登入記錄
                let record = {
                    "name": get_user.name,
                    "email": get_user.email,
                    "login_time": new Date().toLocaleString(),
                    "IP": getIPAdress(),
                    "behavior":"log in"    // 登入
                }
                
                // 先讀取刷新記錄
                Read_Records ()

                // 寫入緩衝區
                records.push(record)

                // 然後再寫入json文件
                Write_Records()

                return res.redirect('/')
            }
        }
    }
    
    // 如果找不到對應的用戶資料就重新回到登入頁面，并回報錯誤
    res.locals.err = "找不到對應的賬戶和密碼，可能是密碼輸入錯誤?"
    return res.render('login.ejs')
})


// 游客模式訪問
app.get('/tourist_visit', (req, res) => {
    
    // session-cookie設置為"游客"
    req.session.user = 'tourist'

    let record = {
        "name": 'Anonymous_tourist',
        "email": 'none',
        "login_time": new Date().toLocaleString(),
        "IP": getIPAdress(),
        "behavior":"log in"    // 登入
    }

    // 先刷新記錄信息
    Read_Records ()

    // 寫入緩衝區
    records.push(record)

    // 然後再寫入記錄的json文件
    Write_Records()
    
    return res.redirect('/')
})


// 注冊初始頁面
app.get('/register', (req, res) => {
    return res.render('register.ejs')
})


// 注冊按鈕POST表單事件
app.post('/register', (req, res) => {

    // 用戶的資料結構
    let user = {

        // 用戶的基本信息，姓名/郵箱/密碼
        "name": req.body.name,
        "email": req.body.email,
        "password": req.body.password,
        
        // 四個權限，采用bool值的方式
        // 1代表具有該項權限，0代表無
        // 預設只有觀看權限
        
        "permission": {

            // 地圖編輯權限(新增、刪除、修改地圖)
            "map_edit": 0,

            // 設備編輯(新增、刪除、修改設備)
            "device_edit": 0,

            // 設備移動
            "device_move": 0,

            // 觀看權限
            "view_page": 1
        }
    }

    // 更新Users用戶信息
    Read_Users()

    // Filter過濾器
    // 這裏先作判斷會不會同時注冊兩個一模一樣的用戶名
    // 然後回傳是否有err
    // 更多的過濾信息再看甲方的需求

    // 使用正則表達式判斷是不是數字開頭
    var number_head = /^[0-9]+[\s\S]*$/;
    
    if (user.email.trim() == '' || user.password.trim() == '' || user.name.trim() == '' || req.body.password_second.trim() == '') {
        
        // 回報一次性的錯誤
        res.locals.err = "不能輸入空值"

        return res.render('register.ejs')
    } else if (user.password != req.body.password_second) {
        
        res.locals.err = "第一次與第二次輸入的密碼不同"
        return res.render('register.ejs')

    } else if (number_head.test(user.name)) {

        res.locals.err = "用戶名不能以數字開頭"
        return res.render('register.ejs')

    } else {

        for (let get_user of users) {

            // 和資料庫比對是否注冊過該賬戶
            if (get_user.name == user.name) {
                res.locals.err = "該用戶名已經被注冊過"
                return res.render('register.ejs')
            }
            if (get_user.email == user.email) {
                res.locals.err = "該郵箱已經被注冊過"
                return res.render('register.ejs')
            }
        }

        // 過濾成功後開始注冊賬戶，先對緩衝區操作
        users.push(user)

        // 注冊本地private私人文件夾空間
        // 目前甲方沒有這個需求，所以這裏沒寫，先預留空間
        // fs.mkdir('./USER/`user.name`')

        // 然後再寫入json文件
        Write_Users()

        // 設置session，進入login界面時就可以自動填入剛才注冊的賬號
        // 但是會遇到一個bug，就是注冊以後不需要login，就可以直接進入主頁
        req.session.user = user.name

        return res.redirect('/login')
    }  
})


// 登出功能，回到login登入頁面并且留下記錄
app.post('/logout', (req, res) => {
    
    if (req.session.user) {
        
        // 刷新當前用戶
        Read_Users()
        let record = {}

        // 根據不同身份的用戶寫入記錄
        if (req.session.user == 'tourist') {
            
            // 游客的登出記錄
            record = {
                "name": 'Anonymous_tourist',
                "email": 'none',
                "login_time": new Date().toLocaleString(),
                "IP": getIPAdress(),
                "behavior":"log out"
            }

        } else {

            for (let get_user of users) {

                // 比對用戶
                if (get_user.name == req.session.user) {
    
                    // 一般用戶的登出記錄
                    record = {
                        "name": get_user.name,
                        "email": get_user.email,
                        "login_time": new Date().toLocaleString(),
                        "IP": getIPAdress(),
                        "behavior":"log out"
                    }
                }
            }
        }

        // 先刷新記錄信息
        Read_Records ()
      
        // 寫入緩衝區
        records.push(record)

        // 然後再寫入記錄的json文件
        Write_Records()
    }

    // 清除已經登入用戶的session
    req.session.destroy()
    
    return res.redirect('/login')
})


// 後台管理頁面
app.get('/manage', (req, res) => {

    // 先做刷新动作
    Read_Users()
    Read_Records()

    // 向前端傳入數據
    return res.render('management.ejs', {
        users: JSON.stringify(users),
        records: JSON.stringify(records)
    });
})


// 後台管理-用戶管理刪除功能
app.post('/user_delete', (req, res) => {
    
    // 先做刷新动作
    Read_Users()

    let index = 0
    for (let user of users) {
        if (req.body.name == user.name) {
            users.splice(index, 1)
            break
        }
        index = index + 1
    }

    // 然後再寫入json文件
    Write_Users()
    
    return res.send(req.body.name);
})


// 後台管理-用戶管理編輯功能
app.post('/PermissionEdit', (req, res) => {
    
    // 先做刷新动作
    Read_Users()
    
    // 根據傳入的數據修改資料庫用戶權限
    var user_permission = JSON.parse(req.body.permission)
    for (let user of users) {
        if (user.name == req.body.name) {
            user.permission.map_edit = parseInt(user_permission.map_edit)
            user.permission.device_edit = parseInt(user_permission.device_edit)
            user.permission.device_move = parseInt(user_permission.device_move)
            user.permission.view_page = parseInt(user_permission.view_page)
            break
        }
    }

    // 然後再寫入json文件
    Write_Users()

    return res.send(req.body.name);
})


// -----------------------------------------------------------------------------------------------------------------
// 登入系統 以及 後台管理結束
// -----------------------------------------------------------------------------------------------------------------


//設定router(對應上傳檔案之form)
app.post('/addFilePost', upload.array('addMapImgFile'), (req, res) => {//在執行下面區段前，會先將檔案以上面設定的方式存放

    //首先修改存放的檔案之路徑

    if (jsonData[req.body.newAddMapImgName] != undefined) {
        return res.sendStatus(204)
    }
    //創建一個資料夾，名稱為使用者輸入的地圖名稱
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
    fs.writeFileSync('public/maps/maplist.json', jsonarr)//寫入本地json檔案
    return res.redirect('http://localhost:3000')//刷新頁面
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
var portcount=0//紀錄當前存在的port數量

//根據原先的ip與port對照表生成stream物件
for (let url in devicedict) {
    console.log(`rtsp://admin:123456@${url}:554/stream0`)
    streamlist[url] = new Stream({
        name: 'socket',
        streamUrl: `rtsp://admin:123456@${url}:554/stream0`,
        wsPort: devicedict[url],//指定使用的Wsport通道
        ffmpegOptions: {
            '-stats': '',
            '-r': 20,
            '-s': '1920 1080'
        }
    })
    portcount+=1//port數量+1
}

app.get('/getStatus', (req, res) => {

    let url = req.query.url
    let cur_status = req.query.cur_status
    console.log(cur_status)
    let havestream = false
    let newport=0
    if(streamlist[url]==undefined){

        //產生新的url對應的新port Number
        portcount+=1
        newport=5000+portcount//5000+當前port數量，即為新的port Number
        devicedict[url]=newport
        
        //複寫ip與port對照表檔案
        let jsonarr = JSON.stringify(devicedict);
        fs.writeFileSync('./public/device_and_port.json', jsonarr)

        //將新的url的stream指定給新的port Number
        streamlist[url]=new Stream({
            name: 'socket',
            streamUrl: `rtsp://admin:123456@${url}:554/stream0`,
            wsPort: devicedict[url],
            ffmpegOptions:{
                '-stats': '',
                '-r': 20,
                '-s': '1920 1080'
            }
        })

    }
    
    //ping指定的url
    ping.sys.probe(url, function (isAlive) {
        var msg = isAlive ? 'host ' + url + ' is alive' : 'host ' + url + ' is dead';
        console.log(msg);
        //如果該url有回應，將havestream設為true
        if (isAlive) {
            havestream = true
        }

    });
    setTimeout(() => {
        res.writeHead(200, {
            'Content-Type': 'application/json'
        })
        console.log('s')
        let jsondata = [{ 'status': havestream ,'newport':newport}]
        res.end(JSON.stringify(jsondata))
    }, 200);

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
        return res.redirect('http://localhost:3000')//刷新頁面 
    }

    console.log("Rename Successful!");
    return res.redirect('http://localhost:3000')//刷新頁面  
})
//刪除地圖
app.get('/DeleteMap', (req, res) => {
    let TargetMap = req.query.mapname//取得req傳送之mapname參數
    delete jsonData[TargetMap]//刪除對應地圖資料
    //寫入json檔案
    var jsonarr = JSON.stringify(jsonData)
    fs.writeFileSync('public/maps/maplist.json', jsonarr)
    //刪除該地圖資料夾
    fs.rmdir(`public/maps/${TargetMap}` ,{ recursive: true },()=>{
        console.log('delete'+TargetMap+'success')
    })
    //回傳204狀態碼
    return res.sendStatus(204)
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
    return res.redirect('http://localhost:3000')//刷新頁面 
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
        let ip=req.body.new_device_ip_input
        //檢查設備名稱重複
        if(jsonData[map]['icons']!=undefined){
            for(let i = 0 ; i < jsonData[map]['icons'].length ; i++){
                if(jsonData[map]['icons'][i].name == name){
                    console.log(name + " has been existed in file")               
                    return res.status(204)                               
                }
            }
        }
        else{
            jsonData[map]['icons']=[]
        }

        //設備資料寫入
        let device = { "class" : kind , 
                        "x": "",
                        "y": "",
                        "name": name,
                        "url": ip}

        jsonData[map]['icons'].push(device)
        // console.log(jsonData[map]['icons'])
        var jsonarr = JSON.stringify(jsonData)
        fs.writeFileSync('public/maps/maplist.json', jsonarr)

    }catch(e){
        console.log(e + " happen in /addNewDevicPost ")
    }
    return res.redirect('http://localhost:3000')//刷新頁面 
})

app.post('/editOldDevicPost', (req,res)=>{
    console.log('/editOldDevicPost work')
    var tarMap
    try{
        //取得表單資料
        let newName = req.body.edit_device_name_input;
        let newIP = req.body.edit_device_ip_input;
        //2022/09/16 BUG 明天再說 
        //(label 不能用req.body 所以用 query action資料透過 edit_btn.onclick建立 )
        //由動態新增的資料來取得目標資訊
        tarMap = req.query.map;
        let tarName = req.query.deviceName;
        let tarKind = req.query.deviceKind;

        for(let j = 0 ; j < jsonData[tarMap]['icons'].length ; j++){
            if(jsonData[tarMap]['icons'][j].name == newName){
                console.log("名稱不能存在或與舊的相同")  
                res.status(204)             
                return res.end()  
                //名稱不能存在或與舊的相同
            }
        }

        for(let i = 0 ; i < jsonData[tarMap]['icons'].length ; i++){
            if(jsonData[tarMap]['icons'][i].name == tarName && jsonData[tarMap]['icons'][i].class == tarKind){
                //有資料就蓋過去
                //undefine and null and empty can't check value NOTE QQ
                if(newName.length > 0){
                    console.log(newName + "HOHOHOHOHOHOHOHOHOHOHOHOHO")
                    jsonData[tarMap]['icons'][i].name = newName;
                }
                //有資料就蓋過去
                //undefine and null and empty can't check value NOTE QQ
                if(newIP.length > 0){
                    jsonData[tarMap]['icons'][i].url= newIP;
                }
            }
        }
        var jsonarr = JSON.stringify(jsonData)
        fs.writeFileSync('public/maps/maplist.json', jsonarr)

    }catch(e){
        console.log(e + "happen in /editOldDevicPost")
    }
    return res.redirect(`http://localhost:3000?target=${tarMap}`)
    //刷新頁面並指定當前地圖為目標地圖(讓使用者能接續操作)
})


