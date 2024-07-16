function ThePromise(executor) {
  // 2.1 Promise 的状态必须为 pendihng | fulfilled | rejected
  this.state = "pending";
  // 2.2.6.1 如果 promise 处于 fulfilled 状态,
  // 所有相应的 onFulfilled 回调必须按照它们对应的 then 的原始调用顺序来执行
  this.onFulfilledCallback = [];
  // 2.2.6.2 如果 promise 处于 rejected 状态,
  // 所有相应的 onRejected 回调必须按照它们对应的  then 的原始调用顺序来执行
  this.onRejectedCallback = [];

  const self = this;

  function resolve(value) {
    // *2.2.4 在执行上下文堆栈仅包含平台代码之前, 不得调用 onFulfilled 或 onRejected
    // * ChatGPT: onFulfilled 或 onRejected 必须在执行上下文堆栈仅包含平台代码时才被调用。
    // *3.1 “平台代码”指的是引擎、环境和 Promise 实现代码.
    // * 此要求确保 onFulfilled 和 onRejected 在调用 then 的事件循环轮次之后异步执行, 并使用新的堆栈
    // * 这可以通过“宏任务”(setTimeout, setImmediate) 或”微任务“机制(MutationObserver, process.nextTick)
    setTimeout(function () {
      // 2.1.1 当 Promise 处于 pending 状态时:
      // 2.1.1.1 可以转换到 fulfilled 或 rejected 状态
      // 2.1.2 当 Promise 处于 fulfilled 状态时:
      // 2.1.2.1 不得过渡到其他状态
      // 2.1.2.2 必须有一个不能改变的值
      if (self.state === "pending") {
        self.state = "fulfilled";
        self.data = value;
        // 2.2.6.1 如果 promise 处于 fulfilled 状态,
        // 所有相应的 onFulfilled 回调必须按照它们对应的 then 的原始调用顺序来执行
        for (let i = 0; i < self.onFulfilledCallback.length; i++) {
          self.onFulfilledCallback[i](value);
        }
      }
    });
  }

  function reject(reason) {
    // *2.2.4 在执行上下文堆栈仅包含平台代码之前, 不得调用 onFulfilled 或 onRejected
    // *3.1 “平台代码”指的是引擎、环境和 Promise 实现代码.
    // * 此要求确保 onFulfilled 和 onRejected 在调用 then 的事件循环轮次之后异步执行, 并使用新的堆栈
    // * 这可以通过“宏任务”(setTimeout, setImmediate) 或”微任务“机制(MutationObserver, process.nextTick)
    setTimeout(function () {
      // 2.1.1 当 Promise 处于 pending 状态时:
      // 2.1.1.1 可以转换到 fulfilled 或 rejected 状态
      // 2.1.2 当 Promise 处于 fulfilled 状态时:
      // 2.1.2.1 不得过渡到其他状态
      // 2.1.2.2 必须有一个不能改变的值
      if (self.state === "pending") {
        self.state = "rejected";
        self.data = reason;
        // 2.2.6.2 如果 promise 处于 rejected 状态,
        // 所有相应的 onRejected 回调必须按照它们对应的  then 的原始调用顺序来执行
        for (let i = 0; i < self.onRejectedCallback.length; i++) {
          self.onRejectedCallback[i](reason);
        }
      }
    });
  }

  // 用户传入的函数也可能会执行异常
  try {
    executor(resolve, reject);
  } catch (reason) {
    reject(reason);
  }
}

// 2.2 then 方法
// 一个 promise 必须提供一个 then 方法来访问[其当前值]或[最终值]或[rejected的原因]
// 一个 promise 的 then 方法接受两个参数
// promise.then(onFulfilled, onRejected)
ThePromise.prototype.then = function (onFulfilled, onRejected) {
  const self = this;
  let promise2 = new ThePromise(function (resolve, reject) {
    // 2.2.2 如果 onFulfilled 是一个函数:
    // 2.2.2.1 它必须在 promise 的状态变为 fulfilled 后被调用, 并将 promise 的值作为它的第一个参数
    // 2.2.2.2 它一定不能在 promise 的状态变为 fulfilled 前被调用
    // 2.2.2.3 它最多只能被调用一次
    if (self.state === "fulfilled") {
      // 2.2.4 onFulfilled 或 onRejected 在执行上下文堆栈仅包含平台代码之前不得调用
      // 3.1 这可以通过“宏任务”或“微任务”机制来实现
      setTimeout(function () {
        // 2.2.1 onFulfilled 和 onRejected 都是可选参数:
        // 2.2.1.1 如果 onFulfilled 不是一个函数,它必须被忽略
        if (typeof onFulfilled === "function") {
          try {
            // 2.2.2.1 2.2.2.1 它必须在 promise 的状态变为 fulfilled 后被调用, 并将 promise 的值作为它的第一个参数
            // 2.2.5 onFulfilled 和 onRejected 必须作为函数调用
            const x = onFulfilled(self.data);
            // *2.2.7.1 如果 onFulfilled 或 onRejected 返回了一个值 x, 则运行 Promise 处理程序 [[Resolve]](promise2, x)
            promiseResolutionProcedure(promise2, x, resolve, reject);
          } catch (e) {
            // 2.2.7.2 如果 onFulfilled 或 onRejected 抛出了一个异常, promise2 必须用 e 作为 reason 来变为 rejected 状态
            reject(e);
          }
        } else {
          // 2.2.7.3 如果 onFulfilled 不是一个函数并且 promise1 为 fulfilled 状态, promise2 必须用和 promise1 一样的值来变为 fulfilled 状态
          resolve(self.data);
        }
      });
    }
    // 2.2.3 如果 onRekected 是一个函数
    // 2.2.3.1 它必须在 promise 的状态变为 rejected 后被调用, 并将 promise 的 reason 作为它的第一个参数
    // 2.2.3.2 它一定不能在 promise 的状态变为 rejected 前被调用
    // 2.2.3.3 它最多只能被调用一次
    else if (self.state === "rejected") {
      // 2.2.4. onFulfilled 或 onRejected 在执行上下文堆栈仅包含平台代码之前不得调用
      // 3.1 这可以通过“宏任务”或“微任务”机制来实现
      setTimeout(function () {
        // 2.2.1. onFulfilled 和 onRejected 都是可选参数：
        // 2.2.1.2. 如果 onRejected 不是一个函数，它必须被忽略
        if (typeof onRejected === "function") {
          try {
            // 2.2.3.1. 它必须在 promise 的状态变为 rejected 后被调用，并将 promise 的 reason 作为它的第一个参数
            // 2.2.5. onFulfilled 和 onRejected 必须作为函数调用
            const x = onRejected(self.data);
            // 2.2.7.1. 如果 onFulfilled 或 onRejected 返回了一个值 x，则运行 Promise 处理程序 [[Resolve]](promise2, x)
            promiseResolutionProcedure(promise2, x, resolve, reject);
          } catch (e) {
            // 2.2.7.2. 如果 onFulfilled 或 onRejected 抛出了一个异常，promise2 必须用 e 作为 reason 来变为 rejected 状态
            reject(e);
          }
        }
        // 2.2.7.4. 如果 onRejected 不是一个函数且 promise1 为 rejected 状态，promise2 必须用和 promise1 一样的 reason 来变为 rejected 状态
        else {
          reject(self.data);
        }
      });
    } else if (self.state === "pending") {
      // 2.2.6 then 可能会被同一个 promise 多次调用
      // 2.2.6.1 如果 promise 处于 fulfilled 状态,所有相应的 onFulfilled 回调必须按照它们对应的 then 的原始调用顺序来执行
      self.onFulfilledCallback.push(function (promise1Value) {
        if (typeof onFulfilled === "function") {
          try {
            // 2.2.2.1 它必须在 promise 的状态变为 fulfilled 后被调用, 并将 promise 的值作为它的第一个参数
            // 2.2.5 onFulfilled 和 onRejected 必须作为函数调用
            const x = onFulfilled(self.data);
            // 2.2.7.1 如果 onFulfilled 或 onRejected 返回了一个值 x, 则运行 Promise 处理程序 [[Resolve]](promise2, x)
            promiseResolutionProcedure(promise2, x, resolve, reject);
          } catch (e) {
            // 2.2.7.2. 如果 onFulfilled 或 onRejected 抛出了一个异常，promise2 必须用 e 作为 reason 来变为 rejected 状态
            reject(e);
          }
        } else {
          resolve(promise1Value);
        }
      });

      // 2.2.6.2. 如果 promise 处于 rejected 状态，所有相应的 onRejected 回调必须按照它们对应的 then 的原始调用顺序来执行
      self.onRejectedCallback.push(function (promise1Reason) {
        if (typeof onRejected === "function") {
          try {
            // 2.2.3.1. 它必须在 promise 的状态变为 rejected 后被调用，并将 promise 的 reason 作为它的第一个参数
            // 2.2.5. onFulfilled 和 onRejected 必须作为函数调用。
            const x = onRejected(self.data);
            // 2.2.7.1. 如果 onFulfilled 或 onRejected 返回了一个值 x，则运行 Promise 处理程序 [[Resolve]](promise2, x)
            promiseResolutionProcedure(promise2, x, resolve, reject);
          } catch (e) {
            // 2.2.7.2. 如果 onFulfilled 或 onRejected 抛出了一个异常，promise2 必须用 e 作为 reason 来变为 rejected 状态。
            reject(e);
          }
        }
        // 2.2.7.4. 如果 onRejected 不是一个函数且 promise1 为 rejected 状态，promise2 必须用和 promise1 一样的 reason 来变为 rejected 状态。
        else {
          reject(promise1Reason);
        }
      });
    }
  });
  // 2.2.7 then 必须返回一个 promise
  return promise2;
};

// 2.3. Promise 处理程序
// Promise 处理程序是一个将 promise 和 value 作为输入的抽象操作，我们将其表示为 [[Resolve]](promise, x)
// 补充说明：这里我们将 resolve 和 reject 也传入进来，因为后续要根据不同的逻辑对 promise 执行 fulfill 或 reject 操作
function promiseResolutionProcedure(promise2, x, resolve, reject) {
  // 2.3.1. 如果 promise 和 x 引用的是同一个对象，promise 将以一个 TypeError 作为 reason 来进行 reject
  // * 例:const promise = new Promise((resolve) => resolve());
  // *  const thenPromise = promise.then(() => thenPromise);
  if (promise2 === x) {
    return reject(new TypeError("Chaining cycle detected for promise"));
  }

  // 2.3.2 如果 x 是一个 promise, 根据它的状态
  if (x instanceof ThePromise) {
    // 2.3.2.1. 如果 x 的状态为 pending，promise 必须保持 pending 状态直到 x 的状态变为 fulfilled 或 rejected
    /**
     * *ChatGPT
     * *当我们在 x 上调用 then 方法时，实际上是注册了两个回调函数，这些回调函数只有在 x 的状态从 pending 变为 fulfilled 或 rejected 时才会被执行。
     * *在 x 处于 pending 状态时，这些回调函数不会被调用，当前 Promise (promise2) 也不会被解决或拒绝，从而保持 pending 状态
     */
    if (x.state === "pending") {
      x.then(function (value) {
        promiseResolutionProcedure(promise2, value, resolve, reject);
      }, reject);
    }
    // 2.3.2.2. 如果 x 的状态为 fulfilled，那么 promise 也用同样的值来执行 fulfill 操作
    else if (x.state === "fulfilled") {
      resolve(x.data);
    }
    // 2.3.2.3. 如果 x 的状态为 rejected，那么 promise 也用同样的 reason 来执行 reject 操作
    else if (x.state === "rejected") {
      reject(x.data);
    }
    return;
  }

  // 2.3.3. 除此之外，如果 x 是一个对象或者函数
  if (x && (typeof x === "object" || typeof x === "function")) {
    // 2.3.3.3.3. 如果 resolvePromise 和 rejectPromise 都被调用，或者多次调用同样的参数，则第一次调用优先，任何之后的调用都将被忽略。
    let isCalled = false;
    try {
      // 2.3.3.1. 声明一个 then 变量来保存 then
      let then = x.then;
      // 2.3.3.3. 如果 then 是一个函数，将 x 作为 this 来调用它，第一个参数为 resolvePromise，第二个参数为 rejectPromise，其中：
      // *如果 then 是一个函数，说明 x 是一个 "thenable" 对象
      if (typeof then === "function") {
        then.call(
          x,
          // 2.3.3.3.1. 假设 resolvePromise 使用一个名为 y 的值来调用，运行 promise 处理程序 [[Resolve]](promise, y)
          function resolvePromise(y) {
            // 2.3.3.3.3. 如果 resolvePromise 和 rejectPromise 都被调用，或者多次调用同样的参数，则第一次调用优先，任何之后的调用都将被忽略
            if (isCalled) return;
            isCalled = true;
            return promiseResolutionProcedure(promise2, y, resolve, reject);
          },
          // 2.3.3.3.2. 假设 rejectPromise 使用一个名为 r 的 reason 来调用，则用 r 作为 reason 对 promise 执行 reject 操作
          function rejectPromise(r) {
            // 2.3.3.3.3. 如果 resolvePromise 和 rejectPromise 都被调用，或者多次调用同样的参数，则第一次调用优先，任何之后的调用都将被忽略
            if (isCalled) return;
            isCalled = true;
            return reject(r);
          }
        );
      }
      // 2.3.3.4. 如果 then 不是一个函数，使用 x 作为值对 promise 执行 fulfill 操作。
      else {
        resolve(x);
      }
    } catch (e) {
      // 2.3.3.2. 如果检索 x.then 的结果抛出异常 e，使用 e 作为 reason 对 promise 执行 reject 操作
      // 2.3.3.3.4. 如果调用 then 时抛出一个异常 e，
      // 2.3.3.3.4.1. 如果 resolvePromise 或 rejectPromise 已经被调用过了，则忽略异常
      if (isCalled) return;
      isCalled = true;
      // 2.3.3.3.4.2. 否则，使用 e 作为 reason 对 promise 执行 reject 操作
      reject(e);
    }
  }
  // 2.3.4. 如果 x 不是一个对象或者函数，使用 x 作为值对 promise 执行 fulfill 操作。
  else {
    resolve(x);
  }
}

module.exports = ThePromise;