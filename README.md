# 版本説明
如果想看歷史版本，可以在靠右上的commits上傳記錄裏面找

# 2022/10/18 版本説明
## 添加後台管理系統系統

新增的部分：  
1、用戶刪除和編輯  
2、瀏覽用戶登入登出記錄  

# 2022/10/5 版本説明
## 添加Login登入注冊系統

新增的部分：  
1、登入、注冊、後台管理系統使用ejs模板，主頁index不變，仍然沿用html檔案。  
2、當進入“/”主頁，如果沒有登入者的cookie時，强制導向login界面。  
3、登入后記入cookie，除非瀏覽器重啓session清空，下次登入免輸入賬號密碼。  
  
## 跟主頁做連接的部分：
1、進入主頁後，產生一個user_json的物件變量(var宣告)，儲存用戶的信息和權限  
具體的格式麻煩看word檔案或者map.js第62行登入系統開始載入的注釋  
2、用戶的登入信息、登入/登出記錄放在USER文件夾中  
3、主頁當中右上角有登出賬戶的按鈕，這個按鈕到時候會刪掉，放在那個有用戶圖標按鈕的表單裏面（已經寫好，但之後會更完善）  

## 目前還沒有做的内容
1、主頁表單内容的完善  
2、css美化  
3、根據甲方爸爸的要求修正完善   