import { type Settings } from "./main.js";
import { showAllMetadata } from "./show-all-metadata.js";

export function info(this: void, target: Object, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function(this: Settings, ...args: any[]) {  
    console.log('Within info decorator:');
    console.dir({
      this: this,
      target,
      propertyKey,
      args,
    })

    console.log('intercepted mount before', args[0])
    const result = originalMethod.apply(this, args);    
    console.log('intercepted mount after', args[0])
    // showAllMetadata(this.constructor, 'mount property')
    return result;
  };

  return descriptor;
}

export function LuckyNumber(this: void) { 
  return function (this: void, constructor: Function) { 
    // showAllMetadata(constructor, 'class decorator')
    
    const originalMethod: Function = constructor.prototype.mount;

    constructor.prototype.mount = function (...args: any[]) {
      console.log('intercepted mount before', args[0])
      const result = originalMethod.apply(this, args);
      console.log('intercepted mount after', args[0])
      return result;
    }
  }
}
