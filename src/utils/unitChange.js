//  px <-> mm  单位互相转换

/**
 * 获取DPI 每英寸像素点
 * @returns {Array}
 */
const conversion_getDPI = function() {
  var DPI = 0
  if (window.screen.deviceXDPI) {
    DPI = window.screen.deviceXDPI
  } else {
    var tmpNode = document.createElement('DIV')
    tmpNode.style.cssText =
        'width:1in;height:1in;position:absolute;left:0px;top:0px;z-index:99;visibility:hidden'
    document.body.appendChild(tmpNode)
    DPI = parseInt(tmpNode.offsetWidth)
    tmpNode.parentNode.removeChild(tmpNode)
  }
  return DPI
}

// 1 英寸=25.4 毫米

/**
   * px转换为mm
   * @param value
   * @returns {number}
   */
const px2mm = function(value) {
  var inch = value / conversion_getDPI()
  var c_value = inch * 25.4
  //      console.log(c_value);
  return c_value
}

/**
   * mm转换为px
   * @param value
   * @returns {number}
   */
const mm2px = function(value) {
  var inch = value / 25.4
  var c_value = inch * conversion_getDPI()
  //      console.log(c_value);
  return c_value
}
export default {
  mm2px,
  px2mm
}

