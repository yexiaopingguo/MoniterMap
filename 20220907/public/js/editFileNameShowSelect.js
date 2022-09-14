//此js主要處理表單顯示

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
        mapNameOption(); //表單顯示地圖選項
        deviceClassShowOption();//表單顯示類別選項
        deviceNameShowOption();//表單顯示名稱選項

    })
    .catch(err => {
        console.log(err)
    })

function mapNameOption(){
    for(var key in jsonData){
        $('#mapNameListSelectId').append('<option value="'+ key + '" >' + key + '</option>');
        $('#devic_map_name').append('<option value="'+ key + '" >' + key + '</option>');
        $('#addNewDevice_MapName').append('<option value="'+ key + '" >' + key + '</option>');

    }
}


//當設備連節表單的地圖名稱選項更動(onChange)時會觸發這個function
//目的在於能夠將選擇地圖的icons種類讀取出來顯示
function deviceClassShowOption(){  
    try{
        var select = document.getElementById('devic_map_name');
        //取得設備表單所選的地圖名稱物件位置

        var classSelect = document.getElementById('devic_class_name');
        //class 選項放置位置

        var itemSelect = document.getElementById('devic_item_name');
        //item neme 選項放置位置

        removeOptions(itemSelect)
        //清空設備名稱資料

        removeOptions(classSelect);
        //清空設備種類資料

        var tar = select.options[select.selectedIndex].value;
        //取出所選的地圖名稱

        console.log(jsonData[tar]["icons"]);
        //從所選的地圖名稱jsonData資料找尋所有icons資料

        var res_map = jsonData[tar]['icons'];
        //目標地圖icons種類資料集設定

        const set = new Set();
        //創建容器為了取得icon種類

        const icon_class = res_map.filter(item => !set.has(item.class) ?
        set.add(item.class): false);
        //icon種類擷取

        for(let i = 0 ; i < icon_class.length ; i++){

            var optionClass = document.createElement("option");
            optionClass.value = icon_class[i].class;
            optionClass.innerHTML = icon_class[i].class;
            //建立icon種類 option 物件給表單

            classSelect.append(optionClass);
        }
        
        deviceNameShowOption()

    }catch(e){
        console.log(e + "表單設備連結錯誤");
    }
   

}

function deviceNameShowOption(){
    try{
        var mapSelect = document.getElementById('devic_map_name');
        //取得設備表單所選的地圖名稱物件位置
        var maptar = mapSelect.options[mapSelect.selectedIndex].value;
        //取得目標地圖名稱
    
        var classSelect = document.getElementById('devic_class_name');
        //class 選項放置位置
        var classtar = classSelect.options[classSelect.selectedIndex].value;
        //取得目標class名稱
    
        var itemSelect = document.getElementById('devic_item_name');
        //item neme 選項放置位置

        removeOptions(itemSelect)
        //清空設備名稱資料
    
        var res_map = jsonData[maptar]['icons'];
        //目標地圖icons種類資料集設定
    
        console.log(maptar);
        for(let i =0 ; i < res_map.length ; i++){
    
    
            if(res_map[i].class == classtar){
                var optionName = document.createElement("option");
                optionName.value = res_map[i].name;
                optionName.innerHTML = res_map[i].name;
                itemSelect.append(optionName);
            }
        }
    }catch(e){
        console.log(e + "錯誤於deviceNameShowOption()");
    }
    

    
}


//清除選項
function removeOptions(selectElement) {
    var i, L = selectElement.options.length - 1;
    for(i = L; i >= 0; i--) {
       selectElement.remove(i);
    }
 }








