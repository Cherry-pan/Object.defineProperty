class Watcher {
  constructor(vm, expr, callback) {
    this.vm = vm;
    this.expr = expr;
    this.callback = callback;
    this.oldVal = this.getOldVal();
  }
  update() {
    const NWEVAL = compileUtil.getVal(this.expr, this.vm);
    if (NWEVAL !== this.OLDVAL) {
      this.callback(NWEVAL);
    }
  }
  getOldVal() {
    Dep.target = this;
    const OLDVAL = compileUtil.getVal(this.expr, this.vm);
    Dep.target = null;
    return OLDVAL;
  }
}

class Dep {
  constructor() {
    this.subs = [];
  }
  //收集观察者
  addSub(watcher) {
    this.subs.push(watcher);
  }
  //通知观察者更新视图
  notify() {
    console.log(this.subs);
    this.subs.forEach(w => {
      w.update();
    });
  }
}

class Observer {
  constructor(data) {
    this.observer(data);
  }
  observer(data) {
    if (data && typeof data === "object") {
      Object.keys(data).forEach(key => {
        this.defineReactive(data, key, data[key]);
      });
    }
  }
  defineReactive(data, key, value) {
    this.observer(value);
    const dep = new Dep();
    Object.defineProperty(data, key, {
      enumerable: true,
      configurable: false,
      get() {
        if (Dep.target) {
          dep.addSub(Dep.target);
        }
        return value;
      },
      set: newVal => {
        this.observer(newVal);
        if (newVal !== value) {
          value = newVal;
        }
        // 通知Dep数据已经发生变化
        dep.notify();
      }
    });
  }
}
