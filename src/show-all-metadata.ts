export const showAllMetadata = (constructor: Function, prefix: string) =>{
  const metadataSomeKeyClass = Reflect.getMetadata('some-key', constructor) // 42
  const metadataOwnSomeKeyClass = Reflect.getOwnMetadata('some-key', constructor) // 42
  
  const metadataSomeKeyProp = Reflect.getMetadata('some-prop', constructor.prototype, 'mount') // 111
  // const metadataSomeKeyProp2 = Reflect.getMetadata('some-prop', settings, 'mount') // 111
  
  const metadataKeysClass = Reflect.getMetadataKeys(constructor) // ['design:paramtypes', 'some-key']
  const metadataOwnKeysClass = Reflect.getOwnMetadataKeys(constructor) // ['design:paramtypes', 'some-key']
  
  
  // Useless in 99% cases to me
  // const metadataKeysProp = Reflect.getMetadataKeys(settings, 'mount') // ['design:...', ..., 'some-prop']
  const metadataKeysProp = Reflect.getMetadataKeys(constructor.prototype, 'mount') // ['design:...', ..., 'some-prop']
  const metadataOwnKeysProp = Reflect.getOwnMetadataKeys(constructor.prototype, 'mount') // ['design:...', ..., 'some-prop'] 
  
  console.log(`[${prefix}]:`)
  console.dir({
    metadataSomeKeyClass,
    metadataOwnSomeKeyClass,
    metadataSomeKeyProp,
    metadataKeysClass,
    metadataOwnKeysClass,
    metadataKeysProp,
    metadataOwnKeysProp,
  })  
  console.log('-----------------------')
}
