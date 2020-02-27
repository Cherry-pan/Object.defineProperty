const compileUtil = {
  getVal(expr, vm) {
    return expr.split(".").reduce((data, currentVal) => {
      return data[currentVal];
    }, vm.$data);
  },
  setVal(expr, vm, inputvalue) {
    return expr.split(".").reduce((data, currentVal) => {
      data[currentVal] = inputvalue;
    }, vm.$data);
  },
  getContentVal(expr, vm) {
    return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
      return this.getVal(args[1], vm);
    });
  },
  text(node, expr, vm) {
    console.log(vm)
    let value;
    if (expr.indexOf("{{") !== -1) {
      value = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
        new Watcher(vm, args[1], newval => {
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
    new Watcher(vm, expr, newval => {
      this.updater.htmlUpdater(node, newval);
    });
    this.updater.htmlUpdater(node, value);
  },
  model(node, expr, vm) {
    const value = this.getVal(expr, vm);
    new Watcher(vm, expr, newval => {
      this.updater.modelUpdater(node, newval);
    });
    node.addEventListener("input", e => {
      // 设置值
      this.setVal(expr, vm, e.target.value);
    });
    this.updater.modelUpdater(node, value);
  },
  on(node, expr, vm, eventName) {
    let fn = vm.$opation.methods && vm.$opation.methods[expr];
    node.addEventListener(eventName, fn.bind(vm), false);
  },
  updater: {
    modelUpdater(node, value) {
      node.value = value;
    },
    htmlUpdater(node, value) {
      node.innerHTML = value;
    },
    textUpdater(node, value) {
      node.textContent = value;
    }
  }
};
class Compile {
  constructor(el, vm) {
    //   判断是否为元素节点，如果为属性节点就去寻找对应属性节点
    //   元素节点为html自带的标签元素，这里主要是怕把body直接当节点传入
    this.el = this.isElementNode(el) ? el : document.querySelector(el);
    this.vm = vm;
    const fragment = this.node2Fragement(this.el);
    // 编译模板
    this.compile(fragment);
    // 追加子元素到根元素
    this.el.appendChild(fragment);
    // 此时页面出现
  }
  compile(fragment) {
    //   获取子节点
    const childNodes = fragment.childNodes;
    [...childNodes].forEach(e => {
      if (this.isElementNode(e)) {
        //   是元素节点
        //   编译元素节点
        // 如果是元素节点用元素编译器
        this.compileElement(e);
      } else {
        //   文本节点
        //   编译文本节点
        // 如果是文本用文本编译器
        this.compileText(e);
      }
      //如果当前节点还有子节点，把当前节点传入继续编译
      if (e.childNodes && e.childNodes.length) {
        this.compile(e);
      }
    });
  }
  compileElement(node) {
    //<div v-text = "mes">
    const attributes = node.attributes;
    [...attributes].forEach(attr => {
      console.log(attr);
      const { name, value } = attr;
      console.log(name);
      if (this.isDirective(name)) {
        const [, directive] = name.split("-");
        const [direName, eventName] = directive.split(":");
        console.log(compileUtil, direName);
        compileUtil[direName](node, value, this.vm, eventName);
        // 更新数据
        node.removeAttribute("v-" + directive);
        // 删除标签上的指令
      } else if (this.isEventName(name)) {
        let [, eventName] = name.split("@");
        compileUtil["on"](node, value, this.vm, eventName);
      }
    });
  }
  compileText(node) {
    const content = node.textContent;
    if (/\{\{(.+?)\}/.test(content)) {
      console.log(content);
      compileUtil["text"](node, content, this.vm);
    }
  }
  isEventName(attrName) {
    return attrName.startsWith("@");
  }
  isDirective(arrtName) {
    return arrtName.startsWith("v-");
  }
  node2Fragement(el) {
    //   创建文档碎片对象
    const f = document.createDocumentFragment();
    let firstChild;
    // 把所有元素节点放入文档碎片对象，此时页面没有东西
    while ((firstChild = el.firstChild)) {
      f.appendChild(firstChild);
    }
    return f;
  }
  isElementNode(node) {
    // 判断是否为元素节点这里nodeType判断如果是元素节点返回1，如果不是返回2
    return node.nodeType === 1;
  }
}

class MVue {
  constructor(opation) {
    //  实例化我们的Vue实例对象
    this.$el = opation.el;
    // 外部传的参数给当前的$属性
    this.$data = opation.data;
    this.$opation = opation;
    if (this.$el) {
      // 如果存在
      //1.实现观察者
      new Observer(this.$data);
      //2.实现编译器
      // 实现编译器 传入根节点和当前所有的东西
      new Compile(this.$el, this);
    }
  }
}
