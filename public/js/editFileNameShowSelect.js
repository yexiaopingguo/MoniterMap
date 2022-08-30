var jsonData = {};
//取得本地json檔資料
fetch('maps/maplist.json').
    then((res) => {
        if (!res.ok) {
            console.log('failed')
        }
        return res.json();    //執行完後執行下個then 
    })
    .then((data) => {
        jsonData = data; //將讀取到的資料存入jsonData
        mapNameOption(); //執行自訂之main function
    })
    .catch(err => {
        console.log(err)
    })

function mapNameOption(){
    for(var key in jsonData){
        $('#mapNameListSelectId').append('<option value="'+ key + '" >' + key + '</option>');
    }
}