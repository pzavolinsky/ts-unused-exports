import * as React from 'react';
import { thisOneIsUsed } from './util';

const Comp = ({ a }: { a: string }) => <div>{thisOneIsUsed}{a}</div>;

console.log(Comp);