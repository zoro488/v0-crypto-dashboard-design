// Disable React DevTools globally to prevent __reactContextDevtoolDebugId errors
if (typeof window !== 'undefined') {
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    inject: function() {},
    onCommitFiberRoot: function() {},
    onCommitFiberUnmount: function() {},
    isDisabled: true
  };
}
