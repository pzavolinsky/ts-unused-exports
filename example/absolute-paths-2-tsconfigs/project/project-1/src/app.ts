import { MyComponent1 } from 'components/MyComponent';
import { fromIndex } from 'components/index';

const comp1: MyComponent1 = new MyComponent1();

export class UnusedComponent {}

console.log(fromIndex);
