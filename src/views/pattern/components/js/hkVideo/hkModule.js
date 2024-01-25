import {ref, watch} from "vue";
import slideMenu from "@/views/mainLayout/js/slideMenu";

/**
 *  海康威视模块内容
 */
const hkModule = ()=>{
  const {isCollapse} = slideMenu();
  const divPlugin = ref(null);
  const iWndowType = ref(3);
  const gIWndIndex = ref(0);
  const videoInitPlugin = (cbComplete)=>{
    let iRet = WebVideoCtrl.I_CheckPluginInstall();
    if (iRet === -1) {
      alert("您还未安装过插件，请安装WebComponentsKit.exe插件！");
      return;
    }
    initPlugin(cbComplete);
  }

  const initPlugin = (cbComplete)=>{
    WebVideoCtrl.I_InitPlugin({
      bWndFull: true, //是否支持单窗口双击全屏
      iWndowType: iWndowType.value,
      bDebugMode:true,
      cbSelWnd: function (xmlDoc){
        gIWndIndex.value = parseInt($(xmlDoc).find("SelectWnd").eq(0).text(), 10);
      },
      cbInitPluginComplete: function() {
        console.log("初始化插件完成");
        WebVideoCtrl.I_InsertOBJECTPlugin("divPlugin");
        if(cbComplete && typeof cbComplete === "function") {
          setTimeout(()=>{
            cbComplete();
          }, 500);
        }
      }
    });
  }

  const clickLogin = (data, iWndIndex)=>{
    WebVideoCtrl.I_GetDevicePort(data.ip).then(res=>{
      console.log(res);
    }).catch(error=>{
      if(error.errorCode == 2000) {
        login(data, iWndIndex);
      }
      console.log(error);
    });
  }

  const login = (data, iWndIndex)=>{
    WebVideoCtrl.I_Login(data.ip, 1, data.port, data.username, data.password, {
      timeout: 3000,
      success: function () {
        console.log("开始预览");  //不能删除
        const szId = data.ip+"_"+data.port;

        // 模拟通道
        const getAnalog = WebVideoCtrl.I_GetAnalogChannelInfo(szId, {
          timeout: 3000,
          success: function (xmlDoc) {
            console.log("模拟通道成功");
          },
          error: function (oError) {
            console.log("模拟通道失败");
          }
        });

        Promise.all([getAnalog]).then(res=>{
          console.log("数据成功");
          setTimeout(()=>{
            initPlay(data.ip, data.port, iWndIndex);
          }, 3000);
        }).catch(error=>{
          console.log("数据失败");
          setTimeout(()=>{
            initPlay(data.ip, data.port, iWndIndex);
          }, 3000);
        });
      },
      error: function () {
        console.log("login error");
      }
    });
  }

  const changeWndNum = (num)=>{
    let value = parseInt(num, 10);
    WebVideoCtrl.I_ChangeWndNum(value).then(() => {
      console.log("窗口分割成功！");
    }, (oError) => {
      console.log("窗口分割失败！");
    });
  };

  const initPlay = (ip, port, iWndIndex)=>{
    let oWndInfo = WebVideoCtrl.I_GetWindowStatus(iWndIndex);
    if (oWndInfo != null) {// 已经在播放了，先停止
      WebVideoCtrl.I_Stop({
        iWndIndex,
        success: function () {
          setTimeout(()=>{
            startRealPlay(ip, port, iWndIndex);
          }, 2000);
        },
        error: function() {
          setTimeout(()=>{
            startRealPlay(ip, port, iWndIndex);
          }, 2000);
        }
      });
    } else {
      startRealPlay(ip, port, iWndIndex);
    }

  }

  const startRealPlay = (ip, port, iWndIndex)=>{
    WebVideoCtrl.I_StartRealPlay(ip, {
      iStreamType: 1,
      iChannelID: 1,
      iWndIndex,
      bZeroChannel: false,
      success: function () {
        console.log("开始预览成功！");
      },
      error: function (oError) {
        setTimeout(()=>{
          initPlay(ip, port, iWndIndex);
        }, 3000);
        console.log("开始预览失败！");
        console.log(oError);
      }
    });
  }

  watch(
    iWndowType,
    (newVal)=>{
      changeWndNum(newVal[0]);
    },
  );
  watch(
    isCollapse,
    (newVal)=>{
      setTimeout(()=>{
        WebVideoCtrl.I_My_Resize();
      }, 300);

    },
  );

  return {
    divPlugin, iWndowType, gIWndIndex,
    videoInitPlugin, clickLogin, changeWndNum, initPlay
  };
}
export default hkModule;
