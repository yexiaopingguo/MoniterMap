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

var counter=0;

app.get('/restart',(req,res)=>{
    console.log('restart'+counter)
    counter=counter+1
    cp.kill();
    cp=spawn('node', ['server.js'])
    console.log('res')
    setTimeout(()=>{res.sendStatus(204)},1000)
})

