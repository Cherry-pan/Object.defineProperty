// 编译类型方法
const compileUtil = {
  getVal(expr, vm) {
    // <div>{{person.name}} -- {{person.age}}</div>
    return expr.split(".").reduce((data, currentVal) => {
      return data[currentVal];
    }, vm.$data);
  },
  setVal(expr, vm, inputVal) {
    // inputVal输入的新值
    return expr.split(".").reduce((data, currentVal) => {
      data[currentVal] = inputVal;
    }, vm.$data);
  },
  getContentVal(expr, vm) {
    return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
      return this.getVal(args[1], vm);
    });
  },

  // <div v-text="msg"></div>  msg:"xZ like xp"
  // expr是value也就是msg,vm这个是实例
  text(node, expr, vm) {
    // value 指的是xZ like xp
    let value;
    if (expr.indexOf("{{") !== -1) {
      // {{person.name}} -- {{personalbar.age}}
      value = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
        // 绑定观察者，将来数据发生变化 触发这里的回调 进行更新
        new Watcher(vm, args[1], () => {
          this.updater.textUpdater(node, this.getContentVal(expr, vm));
        });
        return this.getVal(args[1], vm);
      });
    } else {
      value = this.getVal(expr, vm);
    }
    this.updater.textUpdater(node, value);
  },

  html(node, expr, vm) {
    const value = this.getVal(expr, vm);
    new Watcher(vm, expr, newVal => {
      this.updater.htmlUpdater(node, newVal);
    });
    this.updater.htmlUpdater(node, value);
  },

  model(node, expr, vm) {
    const value = this.getVal(expr, vm);
    // 绑定更新函数 数据=>视图
    new Watcher(vm, expr, newVal => {
      this.updater.modelUpdater(node, newVal);
    });

    // 视图=>数据=>视图
    node.addEventListener("input", e => {
      // 设置值
      this.setVal(expr, vm, e.target.value);
    });
    this.updater.modelUpdater(node, value);
  },

  // 事件
  on(node, expr, vm, eventName) {
    // expr指的是 handlerClick
    let fn = vm.$options.methods && vm.$options.methods[expr];
    node.addEventListener(eventName, fn.bind(vm), false);
  },

  // src
  bind(node, expr, vm, srcName) {},

  // 更新的函数
  updater: {
    textUpdater(node, value) {
      node.textContent = value;
    },
    htmlUpdater(node, value) {
      node.innerHTML = value;
    },
    modelUpdater(node, value) {
      node.value = value;
    }
  }
};

class Compile {
  constructor(el, vm) {
    // 判断el是否是元素节点,如果不是就获取el
    this.el = this.isElementNode(el) ? el : document.querySelector(el);

    this.vm = vm;

    // 1.获取文档碎片对象，放入内存中，会减少页面的回流和重绘
    const fragment = this.node2Fragement(this.el);

    // 2.编译模板
    this.compile(fragment);

    // 3.追加子元素到根元素
    this.el.appendChild(fragment);
  }

  node2Fragement(el) {
    // 1.创建文档碎片对象
    const file = document.createDocumentFragment(el);
    let firstChild;
    while ((firstChild = el.firstChild)) {
      file.appendChild(firstChild);
    }
    return file;
  }

  compile(fragment) {
    // 1.获取子节点
    const childNodes = fragment.childNodes; //childNodes数组   ...childNodes

    [...childNodes].forEach(child => {
      if (this.isElementNode(child)) {
        // 是元素节点，编译元素节点
        this.compileElement(child);
      } else {
        // 是文本节点，编译文本节点
        this.compileText(child);
      }
      // 如果子节点下面还有元素节点，就继续编译
      if (child.childNodes && child.childNodes.length) {
        this.compile(child);
      }
    });
  }

  // 编译元素也就是标签
  compileElement(node) {
    const attributes = node.attributes;
    // 强制转成数组，解析标签上的属性
    [...attributes].forEach(attr => {
      // attr 包含两个属性 name和value
      const { name, value } = attr;
      if (this.isDirective(name)) {
        //是一个指令 v-text v-html v-model v-on:click v-bind:src
        const [, dirctive] = name.split("-"); //text html model on:click
        const [dirName, eventName] = dirctive.split(":"); //text html model on
        console.log(dirName, eventName);

        // 更新数据 数据驱动视图
        compileUtil[dirName](node, value, this.vm, eventName);

        // 删除有指令的标签的属性
        node.removeAttribute("v-" + dirctive);
      } else if (this.isEventName(name)) {
        //@click
        let [, eventName] = name.split("@");
        compileUtil["on"](node, value, this.vm, eventName);
      }
    });
  }

  // 编译文本
  compileText(node) {
    // {{}} v-text
    const content = node.textContent;
    if (/\{\{(.+?)\}\}/.test(content)) {
      compileUtil["text"](node, content, this.vm);
    }
  }

  // 判断变量名是否是以v-开头的
  isDirective(attrName) {
    return attrName.startsWith("v-");
  }

  // 判断事件名@click
  isEventName(attrName) {
    return attrName.startsWith("@");
  }

  // 是否是元素节点
  isElementNode(node) {
    return node.nodeType === 1; //nodeType等于1就是元素节点对象
  }
}

class Myvue {
  constructor(options) {
    this.$el = options.el;
    this.$data = options.data;
    this.$options = options;
    /**
     *如果存在值
     */
    if (this.$el) {
      // 1.实现一个数据观察者
      new Observer(this.$data);
      // 2.实现一个指令解析器
      new Compile(this.$el, this);
      // 设置代理
      this.proxyData(this.$data);
    }
  }

  // 代理的方法
  proxyData(data) {
    for (const key in data) {
      Object.defineProperty(this, key, {
        get() {
          return data[key];
        },
        set(newVal) {
          data[key] = newVal;
        }
      });
    }
  }
}
