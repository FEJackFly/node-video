// express资源
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
// jsmpeg moment child_process脚本所需
const Stream = require('node-rtsp-stream-jsmpeg');
const moment = require('moment');
const callfile = require('child_process');
moment.locale('zh-cn');

// 静态服务器
app.use(express.static(path.join(__dirname, 'resource')));
app.listen(8088, () => {
  console.log(`App listening at port 8088`);
});
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);

// 设置允许跨域访问该服务.
app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  //Access-Control-Allow-Headers ,可根据浏览器的F12查看,把对应的粘贴在这里就行
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Content-Type', 'application/json;charset=utf-8');
  next();
});

// 接口
// 获取摄像头列表
app.post('/ipcList', function(req, res) {
  console.log(JSON.stringify(req.body.rtsp));

  res.send(ipcList);
});

// 历史播放接口
var hisPlay = null;
// var hisRtsp = 'rtsp://admin:jidian123@172.16.151.230:554/Streaming/tracks/1001?starttime=20190917t221010z&endtime=20190917t221030z&playType=his'
// const options = {
//     name: 'streamNameHis' + Date.parse(new Date()),
//     url: hisRtsp,
//     wsPort: 9999
// }

// hisPlay = new Stream(options);
// hisPlay.start();
app.post('/getHis', function(req, res) {
  console.log(JSON.stringify(req.body.channel));
  var channel = req.body.channel;

  var hisRtsp =
    'rtsp://admin:jidian123@172.16.151.230:554/Streaming/tracks/' +
    channel +
    '01?starttime=20190917t221010z&endtime=20190917t221030z?transportmode=multicast&playType=his';
  console.log(hisRtsp);
  if (hisPlay != null) {
    hisPlay.stop();
  }
  callfile.exec('sh stopHis.sh', null, function(err, stdout, stderr) {
    setTimeout(() => {
      const options = {
        name: 'streamNameHis' + Date.parse(new Date()),
        url: hisRtsp,
        wsPort: 9999
      };

      hisPlay = new Stream(options);
      hisPlay.start();
    }, 100);
  });
  console.log(JSON.stringify(req.body.rtsp));

  res.send(ipcList);
});

// 初始化加载
var restart = true; //防视频流断开，建议先测试断流时间
var restartTime = 10 * 60000; //防崩溃时间

var subtype = 1; //大华码流设置 主码流0，子码流1
var sub = 'main'; //海康码流设置 主码流main ，子码流 sub
var dhNVR = 'admin:jd123456@172.16.154.62:554'; //大华nvr
var hkNVR1 = 'admin:jidian123@172.16.151.230:554'; //海康NVR
var hkNVR = 'admin:Admin123@172.16.152.37:554'; //海康NVR

var playList = [];
var ipcList = [];

function HkIpcInit(nvr, num) {
  for (let i = 1; i <= num; i++) {
    let data = {
      rtsp:
        'rtsp://' +
        nvr +
        '/h264/ch' +
        parseInt(i + 32) +
        '/' +
        sub +
        '/av_stream',
      name: '通道' + i,
      channel: i,
      type: '海康NVR',
      coverSrc: 'https://www.jlrbjb.com/uploads/20180818065b77fc008e5b5.jpg',
      port: i
    };
    console.log(data);
    ipcList.push(data);
  }
}

function DhIpcInit(nvr, num) {
  for (let i = 1; i <= num; i++) {
    let data = {
      rtsp:
        'rtsp://' +
        nvr +
        '/cam/realmonitor?channel=' +
        i +
        '&subtype=' +
        subtype,
      name: '通道' + i,
      channel: i,
      type: '大华NVR',
      coverSrc: 'https://www.jlrbjb.com/uploads/20180818065b77fc008e5b5.jpg',
      port: i
    };
    console.log(data);
    ipcList.push(data);
  }
}
HkIpcInit(hkNVR1, 15);
HkIpcInit(hkNVR, 4);
DhIpcInit(dhNVR, 10);

// 启动实时播放任务
for (var i = 0; i < ipcList.length; i++) {
  var num = i + 1;
  const options = {
    name: 'streamName' + i,
    url: ipcList[i].rtsp,
    wsPort: num + '277'
  };

  playList[i] = new Stream(options);
  playList[i].start();
  ipcList[i].port = num + '277';
}
// 实时播放任务轮询
if (restart == true) {
  setInterval(() => {
    // 定时kill ffmpeg

    callfile.exec('sh stop.sh', null, function(err, stdout, stderr) {
      console.log(stdout);
      // 关闭websocker端口
      for (var i = 0; i < ipcList.length; i++) {
        playList[i].stop();
      }
      // 重启
      for (var i = 0; i < ipcList.length; i++) {
        const options = {
          name: 'streamName' + i,
          url: ipcList[i].rtsp,
          wsPort: i + '277'
        };

        playList[i] = new Stream(options);
        playList[i].start();
      }
    });
    console.log(moment().format('MMMM Do YYYY, h:mm:ss a'));
    console.log(restartTime + '执行了');
  }, restartTime);
}
