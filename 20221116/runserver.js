const {spawn}=require('child_process')
const { Console } = require('console')
const express=require('express')
const app=express()
const cors=require('cors')

app.use(express.static('public'))
app.use(cors())
app.listen(80)
var cp=spawn('node', ['server.js'])

cp.on('close',(code)=>{
    console.log('exit')
})

//接收來自用戶端的刷新server請求，重新啟動server程式
//cp物件為子進程(child_process)，指定為開啟server的指令
//對cp物件做kill和spawn即可達成重新啟動server的任務
app.get('/restart',(req,res)=>{
    cp.kill();
    cp=spawn('node', ['server.js'])
    console.log('res')
    setTimeout(()=>{res.sendStatus(204)},1000)
})

