import { info, LuckyNumber } from "./decorators.js"
import "reflect-metadata";
import { showAllMetadata } from "./show-all-metadata.js";

/**
 * ? - Class & property decorators are running before the instance of class will be created
 * ? - Class decorator has access only to constructor (f.e Settings)
 * ? - Property decorator has access to constructor & instance (f.e Settings, and settings)
 */
class Secret {
  secret = 'secret_key'
}

@LuckyNumber()
@Reflect.metadata('some-key', 42)
export class Settings extends Secret {
  lucky?: number
  isInit: boolean
  name: string

  constructor(name: string){
    super()
    this.isInit = true
    this.name = name
  }

  @info
  @Reflect.metadata('some-prop', 111)
  mount(num: number){
    console.log('original mount', num)
  }
  
  unmount(){
  }
}
  

const settings = new Settings('Skippia')
/** All data within `showAllMetadata` will be the same in all decorators */
// showAllMetadata(Settings, 'Settings')

settings.mount(1)

console.dir({
  settings, // { isInit: true, name: 'Skippia', secret: 'secret_key' },
  'Settings.prototype': Settings.prototype, // Secret {}
  'Settings.prototype === settings.constructor.prototype === Object.getPrototypeOf(settings)': 
    Settings.prototype === settings.constructor.prototype 
    && Settings.prototype === Object.getPrototypeOf(settings), // true
  'Object.getPrototypeOf(settings).constructor': Object.getPrototypeOf(settings).constructor, 
    // [class Settings extends Secret]
})
