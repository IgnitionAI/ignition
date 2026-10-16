import * as THREE from 'three';
import type { Fighter, Attack } from './combat';

const v = (x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
const smooth = (x:number)=>THREE.MathUtils.smoothstep(x,0,1);
/** Contact correction layered over the retargeted Mixamo body motion. No root translation. */
export class ExchangePose {
    private upper: THREE.Object3D;
    private fore: THREE.Object3D;
    private hand: THREE.Object3D;
    private root: THREE.Object3D;
    private feet: THREE.Object3D[];
    private soleOffset: number;
    constructor(private model:THREE.Object3D) {
        const bone=(name:string)=>{const b=model.getObjectByName(name)||model.getObjectByName(name.replace('.',''));if(!b)throw new Error('Os absent : '+name);return b;};
        this.root=bone('Root');this.feet=['Foot.L','Foot.R','Toe.L','Toe.R'].map(bone);
        model.updateMatrixWorld(true);this.soleOffset=Math.min(...this.feet.map(f=>f.getWorldPosition(v(0,0,0)).y))-model.position.y;
        this.upper=bone('UpperArm.R');this.fore=bone('Forearm.R');this.hand=bone('Hand.R');
    }
    private aim(bone:THREE.Object3D,child:THREE.Object3D,target:THREE.Vector3):void {
        this.model.updateMatrixWorld(true);
        const origin=bone.getWorldPosition(v(0,0,0));
        const from=child.getWorldPosition(v(0,0,0)).sub(origin).normalize(),to=target.clone().sub(origin).normalize();
        const world=bone.getWorldQuaternion(new THREE.Quaternion()).premultiply(new THREE.Quaternion().setFromUnitVectors(from,to));
        const parent=bone.parent!.getWorldQuaternion(new THREE.Quaternion());bone.quaternion.copy(parent.invert().multiply(world));
    }
    private arm(point:THREE.Vector3,blade:THREE.Vector3,weight:number):void {
        this.model.updateMatrixWorld(true);
        const original=[this.upper,this.fore,this.hand].map(b=>b.quaternion.clone());
        const shoulder=this.upper.getWorldPosition(v(0,0,0)),elbow=this.fore.getWorldPosition(v(0,0,0)),wrist=this.hand.getWorldPosition(v(0,0,0));
        const target=this.model.localToWorld(point.clone());
        const a=shoulder.distanceTo(elbow),b=elbow.distanceTo(wrist),direction=target.clone().sub(shoulder),distance=THREE.MathUtils.clamp(direction.length(),.05,a+b-.001);direction.normalize();target.copy(shoulder).addScaledVector(direction,distance);
        // Keep the elbow outside the breastplate, using a stable character-local pole.
        const pole=this.model.localToWorld(v(-1.5,1.4,.2)).sub(shoulder);pole.addScaledVector(direction,-pole.dot(direction)).normalize();
        const along=(a*a-b*b+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,a*a-along*along));
        const joint=shoulder.clone().addScaledVector(direction,along).addScaledVector(pole,height);
        this.aim(this.upper,this.fore,joint);this.aim(this.fore,this.hand,target);this.model.updateMatrixWorld(true);
        const handWorld=this.hand.getWorldQuaternion(new THREE.Quaternion());
        const current=v(-1,0,0).applyQuaternion(handWorld),desired=blade.clone().transformDirection(this.model.matrixWorld);
        handWorld.premultiply(new THREE.Quaternion().setFromUnitVectors(current,desired));
        this.hand.quaternion.copy(this.hand.parent!.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(handWorld));
        [this.upper,this.fore,this.hand].forEach((bone,i)=>bone.quaternion.copy(original[i].slerp(bone.quaternion.clone(),weight)));
        this.model.updateMatrixWorld(true);
    }
    ground():void {
        this.model.updateMatrixWorld(true);
        const lowest=Math.min(...this.feet.map(f=>f.getWorldPosition(v(0,0,0)).y));
        const delta=this.model.position.y+this.soleOffset-lowest;
        const world=this.root.getWorldPosition(v(0,0,0));world.y+=delta;
        this.root.position.copy(this.root.parent!.worldToLocal(world));this.model.updateMatrixWorld(true);
    }
    apply(f:Fighter):void {
        if(f.guarding) this.arm(v(-.45,1.8,.7),v(.95,.32,0),1);
        if(f.attack==='light'&&f.phase==='windup') {
            const t=smooth(f.elapsed/.46);
            this.arm(v(-.85,1.9,.1).lerp(v(-.4,1.65,.8),t*t),v(-.4,.1,-1).lerp(v(.5,0,.86),t*t),smooth(t/.15));
        } else if(f.attack==='light'&&f.phase==='active') {
            const t=smooth(f.elapsed/.12);
            this.arm(v(-.4,1.65,.8).lerp(v(.25,1.55,.65),t),v(.5,0,.86).lerp(v(.95,0,.3),t),1);
        } else if(f.attack==='light'&&f.phase==='recover') {
            this.arm(v(.25,1.55,.65),v(.95,0,.3),1-smooth(f.elapsed/.2));
        }
        if(f.phase==='windup'&&f.attack==='heavy') {
            const t=f.elapsed/.9;
            const drop=smooth((t-.65)/.35);
            this.arm(v(-.4,2.35,.05).lerp(v(-.25,1.55,.7),drop),v(.15,1,-.3).lerp(v(.15,.2,.95),drop),smooth(t/.18));
        } else if(f.phase==='active'&&f.attack==='heavy') {
            const t=smooth(f.elapsed/.2);
            this.arm(v(-.25,1.55,.7).lerp(v(-.2,1.1,.85),t),v(.15,.2,.95).lerp(v(.1,-.8,.6),t),1);
        } else if(f.phase==='recover'&&f.attack==='heavy'&&f.chain!==0) {
            this.arm(v(-.2,1.1,.85),v(.1,-.8,.6),1-smooth(f.elapsed/.2));
        }
    }
    /** Hold the actual meeting pose during the short impact stop. */
    contact(attacker:boolean,attack:Attack='heavy'):void {
        if(attacker&&attack==='light') this.arm(v(-.4,1.65,.8),v(.5,0,.86),1);
        else if(attacker)this.arm(v(-.25,1.55,.7),v(.15,.2,.95),1);
        else this.arm(v(-.45,1.8,.7),v(.95,.32,0),1);
    }
    bladePoint(fraction=.6):THREE.Vector3 {
        this.model.updateMatrixWorld(true);
        // Points along the prepared sword's blade, transformed from its glTF axes.
        const sword=this.model.getObjectByName('EquippedChainsword');
        return sword ? sword.localToWorld(v(-.1-fraction,-.13,.046)) : this.hand.getWorldPosition(v(0,0,0));
    }
}
