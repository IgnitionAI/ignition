import { expect,it } from 'vitest';
import { promoteDemos } from '../scripts/promote-demos.mjs';
it('restores the previous public demos when staging promotion fails',()=> {
  const files=new Map([['public','previous'],['staging','new']]);
  const io={existsSync:(path:string)=>files.has(path),renameSync:(from:string,to:string)=>{
    if(from==='staging')throw new Error('injected promotion failure');
    files.set(to,files.get(from)!);files.delete(from);
  }};
  expect(()=>promoteDemos('staging','public','backup',io)).toThrow('promotion failure');
  expect(files.get('public')).toBe('previous');expect(files.get('staging')).toBe('new');
});
