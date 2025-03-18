export function throttle<TFn extends (...args: any[]) => void>(
  fn: TFn,
  delay: number
) {
  let lastCallTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: Parameters<TFn>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;
    
    if (timeSinceLastCall >= delay) {
      // 可以立即执行
      lastCallTime = now;
      fn.apply(this, args);
    } else if (!timeoutId) {
      // 设置一个延迟执行
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        timeoutId = null;
        fn.apply(this, args);
      }, delay - timeSinceLastCall);
    }
  } as TFn;
}
