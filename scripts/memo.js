var note = document.getElementById('notifications');

var db;

var newItem = [
      { createTime: "", taskTitle: "", taskContent:"", hours: 0, minutes: 0, day: 0, month: "", year: 0, notified: "no" }
    ];

var memoSearch = document.getElementById('memo-search')
var addMemo = document.getElementById('add-memo');
var taskList = document.getElementById('task-list');
var taskContent = document.getElementById('task-content');
var taskForm = document.getElementById('task-form');
var title = document.getElementById('title');
var setTimeCheckbox = document.getElementById('set-time-for-memo');

var hours = document.getElementById('deadline-hours');
var minutes = document.getElementById('deadline-minutes');
var day = document.getElementById('deadline-day');
var month = document.getElementById('deadline-month');
var year = document.getElementById('deadline-year');

var submit = document.getElementById('submit');

window.onload = function() {
  note.innerHTML += '<li>App initialised.</li>';
  window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
  window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

  var DBOpenRequest = window.indexedDB.open("memoList", 4);
   
  DBOpenRequest.onerror = function(event) {
    note.innerHTML += '<li>Error loading database.</li>';
  };
  
  DBOpenRequest.onsuccess = function(event) {
    note.innerHTML += '<li>Database initialised.</li>';
    
    db = DBOpenRequest.result;
    
    displayData();
  };
  
  DBOpenRequest.onupgradeneeded = function(event) {
    var db = event.target.result;
    
    db.onerror = function(event) {
      note.innerHTML += '<li>Error loading database.</li>';
    };

    var objectStore = db.createObjectStore("memoList", { keyPath: "createTime" });

    objectStore.createIndex("taskTitle", "taskTitle", { unique: false });
    objectStore.createIndex("taskContent", "taskContent", { unique: false });
    objectStore.createIndex("hours", "hours", { unique: false });
    objectStore.createIndex("minutes", "minutes", { unique: false });
    objectStore.createIndex("day", "day", { unique: false });
    objectStore.createIndex("month", "month", { unique: false });
    objectStore.createIndex("year", "year", { unique: false });

    objectStore.createIndex("notified", "notified", { unique: false });
    
    note.innerHTML += '<li>Object store created.</li>';
  };
    
  function displayData(searchKey) {
    taskList.innerHTML = "";
    var objectStore = db.transaction('memoList').objectStore('memoList');
    objectStore.openCursor().onsuccess = function(event) {
      var cursor = event.target.result;
        if(cursor) {
          if(searchKey === undefined)
          {
            createElement(cursor)
          }else{
            if (cursor.value.taskTitle.indexOf(searchKey) !== -1 || cursor.value.taskContent.indexOf(searchKey) !== -1
              || cursor.value.year.indexOf(searchKey) !== -1 || cursor.value.month.indexOf(searchKey) !== -1
              || cursor.value.day.indexOf(searchKey) !== -1){
              createElement(cursor)
            }
          }
          cursor.continue();
        } else {
          note.innerHTML += '<li>Entries all displayed.</li>';
        }
      }
    }

  function createElement(cursor){
    var listItem = document.createElement('li');
    if(cursor.value.day == 1 || cursor.value.day == 21 || cursor.value.day == 31) {
      daySuffix = "st";
    } else if(cursor.value.day == 2 || cursor.value.day == 22) {
      daySuffix = "nd";
    } else if(cursor.value.day == 3 || cursor.value.day == 23) {
      daySuffix = "rd";
    } else {
      daySuffix = "th";
    }
    var contentList = document.createElement('span')
    contentList.innerHTML = cursor.value.taskTitle + '-'+cursor.value.taskContent + cursor.value.hours + ':' + cursor.value.minutes + ', ' + cursor.value.month + ' ' + cursor.value.day + daySuffix + ' ' + cursor.value.year + '.';
    listItem.appendChild(contentList)
    contentList.setAttribute('data-task', cursor.value.createTime);
    contentList.onclick = function(event){
      modifyItem(event);
    }

    if(cursor.value.notified == "yes") {
//      listItem.style.textDecoration = "line-through";
      listItem.style.color = "rgba(255,0,0,0.5)";
    }

    taskList.appendChild(listItem);

    var deleteButton = document.createElement('button');
    listItem.appendChild(deleteButton);
    deleteButton.innerHTML = 'X';
    deleteButton.setAttribute('data-task', cursor.value.createTime);
    deleteButton.onclick = function(event) {
      deleteItem(event);
    }
  }

  setTime();

  function setTime(){
    var date = new Date();
    year.value = date.getFullYear()
    month.value = formatMonth(date.getMonth())
    day.value = date.getDate()
    hours.value = date.getHours()
    minutes.value = date.getMinutes()
  }

  function formatMonth(monthIndex){
    var monthList = ['January','February','March','April','May','June','July','August','September','October','November','December']
    return monthList[monthIndex]
  }

  addMemo.onclick = function(e){
    submit.value = 'Add Task'
    resetItem(e)
  };

  memoSearch.onkeyup = function(evt) {
    displayData(memoSearch.value)
  };

  setTimeCheckbox.onclick = function(e){
    var status = !setTimeCheckbox.checked;
    year.disabled = status;
    month.disabled = status;
    day.disabled = status;
    hours.disabled = status;
    minutes.disabled = status;
  }

  taskForm.addEventListener('submit',addData, false);

  function addData(e) {
    e.preventDefault();
    
    if(title.value == '' || hours.value == null || minutes.value == null || day.value == '' || month.value == '' || year.value == null) {
      note.innerHTML += '<li>Data not submitted — form incomplete.</li>';
      return;
    } else {
      if(submit.value == 'Add Task'){
        var date = new Date()
        var notified = setTimeCheckbox.checked?"no":"yes";
        var newItem = [
          { createTime: date.getTime().toString(),taskTitle: title.value, taskContent: taskContent.value, hours: hours.value, minutes: minutes.value, day: day.value, month: month.value, year: year.value, notified: notified }
        ];
        var transaction = db.transaction(["memoList"], "readwrite");

        transaction.oncomplete = function() {
          note.innerHTML += '<li>Transaction completed: database modification finished.</li>';

          displayData();
        };

        transaction.onerror = function() {
          note.innerHTML += '<li>Transaction not opened due to error: ' + transaction.error + '</li>';
        };

        var objectStore = transaction.objectStore("memoList");
        var objectStoreRequest = objectStore.add(newItem[0]);
        objectStoreRequest.onsuccess = function(event) {
          note.innerHTML += '<li>New item added to database.</li>';
          resetItem(event)
        };
      }else{
        var transaction=db.transaction('memoList','readwrite');
        var store=transaction.objectStore('memoList');
        var request=store.get(submit.getAttribute('data-task'));
        request.onsuccess=function(e){
          var modifyList = e.target.result;
          modifyList.taskTitle=title.value;
          modifyList.taskContent = taskContent.value;
          modifyList.hours = hours.value;
          modifyList.minutes = minutes.value;
          modifyList.day = day.value;
          modifyList.month = month.value;
          modifyList.year = year.value;
          modifyList.notified = 'no'
          store.put(modifyList);
          displayData();
          resetItem(e);
        };
      }
      };
    };

  function resetItem(event){
    title.value = '';
    taskContent.value = '';
    setTime()
  }

  function modifyItem(event){
    var dataTask = event.target.getAttribute('data-task');
    var transaction=db.transaction('memoList','readwrite');
    var store=transaction.objectStore('memoList');
    var request=store.get(dataTask);
    request.onsuccess=function(e){
      var list=e.target.result;
      title.value = list.taskTitle;
      taskContent.value = list.taskContent;
      hours.value = list.hours;
      minutes.value = list.minutes;
      day.value = list.day;
      month.value = list.month;
      year.value = list.year;
      submit.value = 'Modify';
      submit.setAttribute('data-task', dataTask);
    };
  };
  
  function deleteItem(event) {
    var dataTask = event.target.getAttribute('data-task');

    var transaction = db.transaction(["memoList"], "readwrite");
    var request = transaction.objectStore("memoList").delete(dataTask);

    transaction.oncomplete = function() {
      event.target.parentNode.parentNode.removeChild(event.target.parentNode);
      note.innerHTML += '<li>Task \"' + dataTask + '\" deleted.</li>';
    };
  };

  function checkDeadlines() {
    var now = new Date();
    
    var minuteCheck = now.getMinutes();
    var hourCheck = now.getHours();
    var dayCheck = now.getDate();
    var monthCheck = now.getMonth();
    var yearCheck = now.getFullYear();
     
    var objectStore = db.transaction(['memoList'], "readwrite").objectStore('memoList');
    objectStore.openCursor().onsuccess = function(event) {
      var cursor = event.target.result;
        if(cursor) {
        switch(cursor.value.month) {
          case "January":
            var monthNumber = 0;
            break;
          case "February":
            var monthNumber = 1;
            break;
          case "March":
            var monthNumber = 2;
            break;
          case "April":
            var monthNumber = 3;
            break;
          case "May":
            var monthNumber = 4;
            break;
          case "June":
            var monthNumber = 5;
            break;
          case "July":
            var monthNumber = 6;
            break;
          case "August":
            var monthNumber = 7;
            break;
          case "September":
            var monthNumber = 8;
            break;
          case "October":
            var monthNumber = 9;
            break;
          case "November":
            var monthNumber = 10;
            break;
          case "December":
            var monthNumber = 11;
            break;
          default:
          alert('Incorrect month entered in database.');
        }

          if(+(cursor.value.hours) == hourCheck && +(cursor.value.minutes) == minuteCheck && +(cursor.value.day) == dayCheck && monthNumber == monthCheck && cursor.value.year == yearCheck && cursor.value.notified == "no") {
            createNotification(cursor.value.taskTitle, cursor.value.createTime);
          }
          cursor.continue();
        }
    }
  }
  
  function createNotification(title, time) {
    if (!"Notification" in window) {
      console.log("This browser does not support notifications.");
    }
    else if (Notification.permission === "granted") {
      var img = '/memoTest/img/memo.png';
      var text = 'HEY! Your task "' + title + '" is now overdue.';
      var notification = new Notification('Memo', { body: text, icon: img });
      
      window.navigator.vibrate(500);
    }

    else if (Notification.permission !== 'denied') {
      Notification.requestPermission(function (permission) {
        if(!('permission' in Notification)) {
          Notification.permission = permission;
        }
        if (permission === "granted") {
          var img = '/memoTest/img/memo.png';
          var text = 'HEY! Your task "' + title + '" is now overdue.';
          var notification = new Notification('Memo', { body: text, icon: img });
          
          window.navigator.vibrate(500);
        }
      });
    }

    var objectStore = db.transaction(['memoList'], "readwrite").objectStore('memoList');

    var objectStoreTitleRequest = objectStore.get(time);

    objectStoreTitleRequest.onsuccess = function() {
      var data = objectStoreTitleRequest.result;
      data.notified = "yes";
      var updateTitleRequest = objectStore.put(data);
      updateTitleRequest.onsuccess = function() {
        displayData();
      }
    }
  }
  
  setInterval(checkDeadlines, 1000);
}