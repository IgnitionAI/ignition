import * as THREE from 'three';
import type { CombatEvent } from './combat';

/** One contact event drives light, particles, camera impulse and sound. */
export class CombatEffects {
    private geometry = new THREE.BufferGeometry();
    private positions = new Float32Array(96 * 6);
    private velocities = Array.from({length:96},()=>new THREE.Vector3());
    private lives = new Float32Array(96);
    private lines: THREE.LineSegments;
    private light = new THREE.PointLight(0xffb44f,0,5);
    private cursor = 0;
    private impulse = 0;
    private age = 0;
    constructor(scene: THREE.Scene) {
        this.geometry.setAttribute('position',new THREE.BufferAttribute(this.positions,3).setUsage(THREE.DynamicDrawUsage));
        this.lines = new THREE.LineSegments(this.geometry,new THREE.LineBasicMaterial({color:0xffce77,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false}));
        this.lines.frustumCulled = false; scene.add(this.lines,this.light);
    }
    contact(event: CombatEvent, point: THREE.Vector3): void {
        const parry = event.kind === 'parry';
        this.light.position.copy(point); this.light.color.set(parry ? 0xffdf9f : 0xff8a32); this.light.intensity = parry ? 9 : 5;
        this.impulse = parry ? .065 : event.attack === 'heavy' ? .085 : .035;
        this.age = 0;
        const count = parry ? 38 : event.kind === 'block' ? 22 : 16;
        for(let n=0;n<count;n++) {
            const i=this.cursor++%96, offset=i*6;
            this.positions.set([point.x,point.y,point.z,point.x,point.y,point.z],offset);
            this.velocities[i].set((Math.random()-.5)*5,Math.random()*3+.4,(Math.random()-.5)*5);
            this.lives[i]=.16+Math.random()*.3;
        }
        this.update(.012);
    }
    update(dt: number): void {
        this.age+=dt; this.light.intensity*=Math.exp(-19*dt); this.impulse*=Math.exp(-13*dt);
        for(let i=0;i<96;i++) {
            const offset=i*6;
            if(this.lives[i]<=0) { this.positions.fill(0,offset,offset+6); continue; }
            this.lives[i]-=dt; const v=this.velocities[i]; v.y-=8*dt;
            for(let axis=0;axis<3;axis++) {
                this.positions[offset+axis]+=v.getComponent(axis)*dt;
                this.positions[offset+axis+3]=this.positions[offset+axis]-v.getComponent(axis)*.024;
            }
        }
        this.geometry.attributes.position.needsUpdate=true;
    }
    cameraOffset(): THREE.Vector3 { return new THREE.Vector3(Math.sin(this.age*87),Math.sin(this.age*63)*.6,0).multiplyScalar(this.impulse); }
    reset(): void { this.lives.fill(0); this.positions.fill(0); this.impulse=0; this.light.intensity=0; this.geometry.attributes.position.needsUpdate=true; }
}

/** Locally synthesized layers: chain motor, blade air, steel ring and armour thump. */
export class CombatAudio {
    private context?: AudioContext;
    private master?: GainNode;
    private motor?: OscillatorNode;
    private motorGain?: GainNode;
    private noise?: AudioBuffer;
    private recording?: MediaStreamAudioDestinationNode;
    get stream():MediaStream|undefined{return this.recording?.stream;}
    private voices = new Set<AudioScheduledSourceNode>();
    muted=false;
    async start(): Promise<void> {
        if(!this.context) {
            const context=this.context=new AudioContext();
            this.master=context.createGain(); this.master.gain.value=this.muted ? 0 : .35;
            const compressor=context.createDynamicsCompressor(); this.master.connect(compressor); compressor.connect(context.destination);
            this.recording=context.createMediaStreamDestination();compressor.connect(this.recording);
            this.motor=context.createOscillator(); this.motor.type='sawtooth'; this.motor.frequency.value=48;
            const filter=context.createBiquadFilter(); filter.type='lowpass'; filter.frequency.value=320;
            this.motorGain=context.createGain(); this.motorGain.gain.value=0;
            this.motor.connect(filter); filter.connect(this.motorGain); this.motorGain.connect(this.master); this.motor.start();
            this.noise=context.createBuffer(1,context.sampleRate,context.sampleRate);
            const data=this.noise.getChannelData(0); for(let i=0;i<data.length;i++) data[i]=Math.random()*2-1;
        }
        await this.context.resume();
    }
    setMuted(value:boolean):void { this.muted=value; if(this.context&&this.master) this.master.gain.setTargetAtTime(value?0:.35,this.context.currentTime,.025); }
    reset():void {
        for(const voice of this.voices) {voice.stop();voice.disconnect();}this.voices.clear();
        if(this.context&&this.motor&&this.motorGain){const t=this.context.currentTime;this.motor.frequency.cancelScheduledValues(t);this.motor.frequency.setValueAtTime(48,t);this.motorGain.gain.cancelScheduledValues(t);this.motorGain.gain.setValueAtTime(0,t);}
        this.pause();
    }
    pause():void { void this.context?.suspend(); }
    motorLoad(load:number):void {
        if(!this.context||!this.motor||!this.motorGain) return;
        const t=this.context.currentTime;
        this.motor.frequency.setTargetAtTime(48+load*95,t,.08); this.motorGain.gain.setTargetAtTime(.025+load*.075,t,.05);
    }
    private tone(frequency:number,end:number,duration:number,gain:number):void {
        const c=this.context, master=this.master; if(!c||!master||c.state!=='running') return;
        const o=c.createOscillator(), g=c.createGain(); o.type='sine'; o.frequency.setValueAtTime(frequency,c.currentTime); o.frequency.exponentialRampToValueAtTime(end,c.currentTime+duration);
        g.gain.setValueAtTime(gain,c.currentTime); g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+duration);
        o.connect(g); g.connect(master); this.voices.add(o); o.start(); o.stop(c.currentTime+duration); o.onended=()=>{this.voices.delete(o);o.disconnect();g.disconnect();};
    }
    private burst(duration:number,frequency:number,gain:number):void {
        const c=this.context, master=this.master; if(!c||!master||!this.noise||c.state!=='running') return;
        const s=c.createBufferSource(), f=c.createBiquadFilter(), g=c.createGain(); s.buffer=this.noise;
        f.type='bandpass'; f.frequency.value=frequency; f.Q.value=.6;
        g.gain.setValueAtTime(gain,c.currentTime); g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+duration);
        s.connect(f); f.connect(g); g.connect(master); this.voices.add(s); s.start(); s.stop(c.currentTime+duration);
        s.onended=()=>{this.voices.delete(s);s.disconnect();f.disconnect();g.disconnect();};
    }
    swing():void { this.burst(.22,850,.27); }
    contact(e:CombatEvent):void {
        if(e.kind==='parry'||e.kind==='block') {
            this.burst(.12,3400,.7);
            for(const frequency of [740,1190,1930,2870]) this.tone(frequency,frequency*.91,e.kind==='parry'?.55:.24,.14);
            this.tone(150,45,.16,.45);
        } else { this.burst(.16,950,.65); this.tone(e.attack==='heavy'?95:135,35,.22,.8); this.tone(420,220,.13,.15); }
    }
}
