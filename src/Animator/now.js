
export default
    (typeof window === 'object' && window.performance) ? window.performance.now.bind(window.performance) :
    (typeof global === 'object' && global.nativePerformanceNow) ? global.nativePerformanceNow :
    Date.now
