/** *** iframe打印
 * @param dom            打印区域的class, id
 * @param options.margin  控制页眉页脚, 默认 4mm
 * @param options.padding 打印边距, 默认 '0 0'
 * @method options.afterprint 打印结束后回调
 * @method options.cancel 取消打印后回调
 *
 * **/

const Print = function(dom, options) {
  if (!(this instanceof Print)) return new Print(dom, options)

  this.options = this.extend(
    {
      noPrint: '.no-print'
    },
    options
  )

  if (typeof dom === 'string') {
    this.dom = document.querySelector(dom)
  } else {
    this.isDOM(dom)
    this.dom = this.isDOM(dom) ? dom : dom.$el
  }

  this.init()
}
Print.prototype = {
  init: function() {
    var content = this.getStyle() + this.getHtml()
    this.writeIframe(content)
  },
  extend: function(obj, obj2) {
    for (var k in obj2) {
      obj[k] = obj2[k]
    }
    return obj
  },

  getStyle: function() {
    var str = ''
    var styles = document.querySelectorAll('style,link')
    for (var i = 0; i < styles.length; i++) {
      str += styles[i].outerHTML
    }

    str +=
      '<style>' +
      (this.options.noPrint ? this.options.noPrint : '.no-print') +
      '{display:none;}</style>'

    str += `<style>
      @media print { 
        @page { margin: ${this.options.margin || '4mm'}; padding: ${this.options.padding || '0 0'}; width:210mm;height:290mm} 
        body {  
          -webkit-print-color-adjust:exact;-moz-print-color-adjust:exact;-ms-print-color-adjust:exact;print-color-adjust:exact; 
        } 
      }
      </style>`

    return str
  },

  getHtml: function() {
    var inputs = document.querySelectorAll('input')
    var textareas = document.querySelectorAll('textarea')
    var selects = document.querySelectorAll('select')

    for (var k = 0; k < inputs.length; k++) {
      if (inputs[k].type == 'checkbox' || inputs[k].type == 'radio') {
        if (inputs[k].checked == true) {
          inputs[k].setAttribute('checked', 'checked')
        } else {
          inputs[k].removeAttribute('checked')
        }
      } else if (inputs[k].type == 'text') {
        inputs[k].setAttribute('value', inputs[k].value)
      } else {
        inputs[k].setAttribute('value', inputs[k].value)
      }
    }

    for (var k2 = 0; k2 < textareas.length; k2++) {
      if (textareas[k2].type == 'textarea') {
        textareas[k2].innerHTML = textareas[k2].value
      }
    }

    for (var k3 = 0; k3 < selects.length; k3++) {
      if (selects[k3].type == 'select-one') {
        var child = selects[k3].children
        for (var i in child) {
          if (child[i].tagName == 'OPTION') {
            if (child[i].selected == true) {
              child[i].setAttribute('selected', 'selected')
            } else {
              child[i].removeAttribute('selected')
            }
          }
        }
      }
    }

    return this.dom.outerHTML
  },

  writeIframe: function(content) {
    var w
    var doc
    var iframe = document.createElement('iframe')
    var f = document.body.appendChild(iframe)
    iframe.id = 'myIframe'
    iframe.setAttribute(
      'style',
      'position:absolute;width:0;height:0;top:-10px;left:-10px;'
    )

    w = f.contentWindow || f.contentDocument
    doc = f.contentDocument || f.contentWindow.document
    doc.open()
    doc.write(content)
    doc.close()
    var _this = this

    iframe.onload = function() {
      w.onbeforeprint = _this.options.beforeprint
      w.onafterprint = _this.options.afterprint
      // iframe.contentWindow.print();
      _this.toPrint(w)
      setTimeout(function() {
        document.body.removeChild(iframe)
      }, 100)
    }
  },

  toPrint: function(frameWindow) {
    var _t = this
    try {
      setTimeout(function() {
        frameWindow.focus()
        try {
          if (!frameWindow.document.execCommand('print', false, null)) {
            frameWindow.print()
          }
        } catch (e) {
          frameWindow.print()
        }
        frameWindow.close()
        typeof _t.options.cancel === 'function' && _t.options.cancel()
        frameWindow.onbeforeprint = null
        frameWindow.onafterprint = null
      }, 10)
    } catch (err) {
      console.log('err', err)
    }
  },

  isDOM:
      typeof HTMLElement === 'object'
        ? function(obj) {
          return obj instanceof HTMLElement
        }
        : function(obj) {
          return (
            obj &&
              typeof obj === 'object' &&
              obj.nodeType === 1 &&
              typeof obj.nodeName === 'string'
          )
        }
}
export default Print

