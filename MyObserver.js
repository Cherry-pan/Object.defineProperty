// 观察者的类 cb回调callback
class Watcher {
  constructor(vm, expr, cb) {
    this.vm = vm;
    this.expr = expr;
    this.cb = cb; //callback
    // 先把旧值保存起来
    this.oldVal = this.getOldVal();
  }
  // 新值和旧值有什么变化
  getOldVal() {
    // 挂载到Dep实例上
    Dep.target = this;
    const oldVal = compileUtil.getVal(this.expr, this.vm);
    Dep.target = null; //删除掉之前的观察者
    return oldVal;
  }

  update() {
    const newVal = compileUtil.getVal(this.expr, this.vm);
    if (newVal !== this.oldVal) {
      this.cb(newVal);
    }
  }
}

// 订阅器的类
class Dep {
  constructor() {
    this.subs = [];
  }

  
  // 收集观察者【数组】
  addSub(watcher) {
    this.subs.push(watcher);
  }
  // 通知观察者去更新
  notify() {
  console.log("观察者",this.subs);
  
    this.subs.forEach(w => w.update());
  }
}

// 监听的类
class Observer {
  constructor(data) {
    this.observe(data);
  }
  observe(data) {
    /**
     * {
     *  person:{
     *         name:"xz",
     *          fav:{
     *          a:"钓鱼"
     *          }
     *      }
     * }
     */
    if (data && typeof data === "object") {
      //   循环遍历数组
      Object.keys(data).forEach(key => {
        this.defineReactive(data, key, data[key]);
        console.log(data[key]);
      });
    }
  }

  defineReactive(obj, key, value) {
    // 递归遍历里面的许多层
    this.observe(value);
    const dep = new Dep();
    // 劫持并监听所有的属性
    Object.defineProperty(obj, key, {
      enumerable: true, //是否是可遍历的
      configurable: false, //是否是可执行的
      // 获取值
      get() {
        // 初始化
        //   订阅数据变化时，往Dep添加观察者
        Dep.target && dep.addSub(Dep.target);
        return value;
      },
      set: newVal => {
        this.observe(newVal);
        if (newVal !== value) {
          value = newVal;
        }
        // 告知Dep通知变化
        dep.notify()
      }


    });
  }
}
