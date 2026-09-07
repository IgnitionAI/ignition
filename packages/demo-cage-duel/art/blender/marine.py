"""Second authored asset: a modular Space Marine fan-art base, facing -Y."""
marine_scene=new_scene('02 · MARINE BASE');current=collection('MARINE · export geometry');marine_collection=current
root=empty('MarineRoot')
# Named rigid pivots, ready for an animation/rig pass.
hips=empty('Hips',(0,0,1.7),root);torso=empty('Torso',(0,0,2.02),hips)
head=empty('Head',(0,0,2.93),torso)

def armour_volume(name,levels,mat,parent):
    # Chamfered rectangular cross-sections keep a designed silhouette.
    verts=[]
    for z,w,d,cy in levels:
        c=.24
        verts.extend([(x,cy+y,z) for x,y in [(-w*(1-c),-d),(w*(1-c),-d),(w,-d*(1-c)),(w,d*(1-c)),(w*(1-c),d),(-w*(1-c),d),(-w,d*(1-c)),(-w,-d*(1-c))]])
    n=len(levels);faces=[tuple(reversed(range(8))),tuple(range((n-1)*8,n*8))]
    for j in range(n-1):
        for i in range(8):faces.append((j*8+i,j*8+(i+1)%8,(j+1)*8+(i+1)%8,(j+1)*8+i))
    o=mesh(name,verts,faces,mat,.035)
    world=o.matrix_world.copy();o.parent=parent;o.matrix_world=world
    return o

armour_volume('Cuirass · sculpted breastplate',[(2.0,.40,.29,0),(2.35,.65,.39,0),(2.64,.61,.32,0),(2.78,.35,.26,0)],red,torso)
# Layered collar and neck guard.
for z,r in ((2.72,.35),(2.78,.32),(2.83,.28)):ring('Gorget collar',(0,0,z),r,.042,brass,parent=torso)
cylinder('Neck seal',(0,0,2.86),.19,.23,rubber,parent=head)
# Helmet: narrowing brow, inset faceplate, external respirator and flared cheek guards.
armour_volume('Helmet · angular shell',[(2.91,.23,.23,0),(3.08,.29,.28,.015),(3.34,.27,.25,.045),(3.46,.16,.16,.07)],red,head)
plate('Visor recess',[(-.265,3.22),(.265,3.22),(.22,3.13),(-.22,3.13)],-.265,.075,iron,head,.012)
for side in (-1,1):
    plate('Eye lens',[(side*.025,3.205),(side*.227,3.21),(side*.20,3.172),(side*.06,3.165)],-.312,.02,cyan,head,.005)
    plate('Cheek guard',[(side*.10,3.11),(side*.27,3.15),(side*.26,2.98),(side*.13,2.93)],-.25,.11,red,head,.017)
    cylinder('Helmet temple vent',(side*.285,.005,3.18),.087,.055,brass,16,head,(0,math.pi/2,0))
    beam('Breathing conduit',(side*.17,-.24,3.01),(side*.26,.07,2.94),.032,edge,head,12)
box('Brow armour',(0,-.273,3.245),(.54,.10,.075),brass,.018,head)
box('Respirator block',(0,-.325,3.06),(.22,.17,.20),iron,.035,head)
for x in (-.065,0,.065):box('Respirator slot',(x,-.415,3.06),(.019,.016,.12),edge,.005,head)
box('Helmet crest',(0,.035,3.42),(.105,.38,.065),cream,.024,head)
# Chest relief, actual modelled wing motif and central skull.
for side in (-1,1):
    for j in range(5):
        x=side*(.15+j*.075);z=2.48-j*.029
        plate('Pectoral wing feather',[(x, z+.07),(x+side*.14,z+.065),(x+side*.105,z-.025),(x,z-.075)],-.405,.038,brass,torso,.009)
sphere('Chest skull',(0,-.448,2.48),(.095,.041,.097),cream,torso)
for x in (-.037,.037):sphere('Chest skull eye',(x,-.481,2.49),(.020,.012,.021),iron,torso)
box('Chest skull jaw',(0,-.46,2.404),(.10,.055,.045),cream,.01,torso)
for side in (-1,1):
    for z in (2.10,2.18,2.26):
        beam('Abdominal rib',(side*.11,-.315,z),(side*.39,-.27,z+.045),.037,edge,torso,8)
# Pelvis and segmented fauld.
sphere('Abdominal flex',(0,0,1.94),(.38,.27,.26),rubber,hips)
box('Belt',(0,-.015,1.84),(.98,.62,.17),iron,.035,hips)
box('Belt buckle',(0,-.355,1.84),(.25,.10,.22),brass,.024,hips)
for side in (-1,1):
    plate('Fauld plate',[(side*.08,1.76),(side*.43,1.79),(side*.50,1.43),(side*.17,1.42)],-.29,.15,red,hips,.03)
    box('Belt pouch',(side*.46,.05,1.76),(.20,.34,.31),rubber,.025,hips)
plate('Central tabard',[(-.12,1.70),(.12,1.70),(.16,1.18),(0,1.09),(-.16,1.18)],-.32,.045,cream,hips,.012)
for side in (-1,1):
    thigh=empty('Thigh.'+('L' if side<0 else 'R'),(side*.41,0,1.59),hips)
    shin=empty('Shin.'+('L' if side<0 else 'R'),(side*.44,0,1.10),thigh)
    foot=empty('Foot.'+('L' if side<0 else 'R'),(side*.46,0,.35),shin)
    x=side*.44
    # Volume helper centred then translate mesh in world before parenting.
    def limb_volume(name,levels,mat,parent):
        o=armour_volume(name,levels,mat,parent)
        for v in o.data.vertices:v.co.x+=x
        return o
    sphere('Hip articulation',(x,0,1.59),(.23,.25,.24),rubber,thigh)
    limb_volume('Thigh plate',[(1.14,.23,.22,0),(1.45,.28,.26,0),(1.66,.25,.23,0)],red,thigh)
    cylinder('Knee articulation',(x,0,1.08),.22,.46,rubber,20,shin,(0,math.pi/2,0))
    plate('Knee shield',[(x-.22,1.21),(x+.22,1.21),(x+.24,.98),(x,.88),(x-.24,.98)],-.25,.19,brass,shin,.026)
    plate('Knee inset',[(x-.155,1.16),(x+.155,1.16),(x+.17,1.01),(x,.94),(x-.17,1.01)],-.356,.028,red,shin,.012)
    limb_volume('Greave armoured shin',[(.33,.28,.24,.02),(.55,.28,.29,0),(.93,.215,.235,0)],red,shin)
    box('Greave centre ridge',(x,-.283,.62),(.08,.07,.5),brass,.015,shin)
    for z in (.4,.84):box('Greave trim',(x,-.252,z),(.42,.08,.06),brass,.015,shin)
    for dx in (-.20,.20):
        for z in (.43,.8):sphere('Greave rivet',(x+dx,-.276,z),(.023,.015,.023),edge,shin)
    # Toe extends forward; layered sole and reinforced heel.
    box('Sabatons sole',(x,-.13,.095),(.60,.90,.17),rubber,.045,foot)
    box('Armoured boot',(x,-.15,.23),(.57,.85,.25),red,.085,foot)
    box('Toe cap',(x,-.49,.21),(.56,.16,.22),brass,.037,foot)
    for y in (-.32,-.15,.02):box('Boot articulation band',(x,y,.365),(.47,.055,.028),steel,.01,foot)
    # Shoulder cap wraps the upper arm; layered sculpted silhouette.
    shoulder=empty('Shoulder.'+('L' if side<0 else 'R'),(side*.70,0,2.61),torso)
    upper=empty('UpperArm.'+('L' if side<0 else 'R'),(side*.91,0,2.40),shoulder)
    forearm=empty('Forearm.'+('L' if side<0 else 'R'),(side*1.02,-.015,1.99),upper)
    hand=empty('Hand.'+('L' if side<0 else 'R'),(side*1.06,-.025,1.55),forearm)
    sphere('Shoulder flexible joint',(side*.75,0,2.55),(.28,.3,.28),rubber,shoulder)
    shell=sphere('Pauldron shell',(side*.87,.015,2.68),(.51,.49,.385),brass,shoulder)
    shell.data.materials.append(red)
    for face in shell.data.polygons: face.material_index=1 if face.center.z>-.45 else 0
    # Front-facing pauldron engraved field.
    px=side*.9
    plate('Pauldron faceplate',[(px-.32,2.76),(px-.21,2.95),(px+.21,2.95),(px+.32,2.76),(px+.24,2.48),(px-.24,2.48)],-.416,.065,brass,shoulder,.02)
    plate('Pauldron heraldic field',[(px-.27,2.76),(px-.18,2.9),(px+.18,2.9),(px+.27,2.76),(px+.20,2.53),(px-.20,2.53)],-.458,.028,red if side<0 else cream,shoulder,.016)
    for dx in (-.2,.2):
        for z in (2.60,2.79):sphere('Pauldron stud',(px+dx,-.495,z),(.035,.018,.035),edge,shoulder)
    if side<0:
        for j in range(3):box('Squad heraldry',(px-.085+j*.085,-.481,2.73),(.038,.012,.20),cream,.004,shoulder)
    else:
        plate('Chapter lightning',[(px-.05,2.87),(px+.08,2.87),(px+.01,2.76),(px+.09,2.76),(px-.08,2.60),(px-.035,2.74),(px-.12,2.74)],-.485,.022,red,shoulder,.004)
    sphere('Bicep seal',(side*.94,0,2.29),(.23,.235,.27),rubber,upper)
    box('Bicep armour',(side*.96,-.01,2.26),(.42,.43,.46),red,.08,upper)
    cylinder('Elbow axis',(side*1.015,0,1.99),.19,.47,edge,20,forearm,(0,math.pi/2,0))
    box('Vambrace',(side*1.05,-.015,1.78),(.46,.49,.47),red,.075,forearm)
    box('Vambrace cuff',(side*1.06,-.015,1.57),(.48,.51,.08),brass,.028,forearm)
    for z in (1.68,1.77,1.86):box('Forearm vent',(side*1.05,-.271,z),(.26,.025,.035),iron,.006,forearm)
    sphere('Glove',(side*1.06,-.025,1.43),(.21,.21,.20),rubber,hand)
    for j in range(4):box('Finger armour',(side*1.06-.135+j*.09,-.19,1.40),(.075,.11,.16),steel,.019,hand)
    # Side-mounted purity seal; parchment is geometrical and separate.
    if side<0:
        sphere('Wax seal',(px,-.505,2.50),(.09,.035,.09),red,shoulder)
        plate('Oath parchment',[(px-.045,2.45),(px+.045,2.45),(px+.09,2.16),(px,2.20),(px-.075,2.14)],-.498,.018,cream,shoulder,.004)
    if side>0: axe_hand=hand
# Backpack with twin exhausts, radiator fins and hydraulic conduits.
backpack=empty('PowerPack',(0,.39,2.45),torso)
box('Reactor backpack',(0,.51,2.42),(.77,.46,.78),steel,.105,backpack)
box('Backpack centre armour',(0,.76,2.43),(.41,.18,.59),red,.055,backpack)
for side in (-1,1):
    cylinder('Exhaust stack',(side*.42,.49,2.83),.175,.58,steel,24,backpack)
    ring('Exhaust brass lip',(side*.42,.49,3.12),.157,.031,brass,parent=backpack)
    cylinder('Exhaust dark bore',(side*.42,.49,3.115),.123,.014,iron,24,backpack)
    for z in (2.31,2.40,2.49,2.58):box('Heat exchanger fin',(side*.36,.765,z),(.20,.15,.035),edge,.008,backpack)
    beam('Reactor conduit',(side*.28,.5,2.09),(side*.38,.15,1.79),.058,rubber,hips,12)
# Chain axe: separate pivot and layered silhouette, downward held.
axe=empty('Weapon · ChainAxe',(1.06,-.025,1.43),axe_hand)
beam('Axe haft',(1.06,-.025,.38),(1.06,-.025,2.0),.056,steel,axe,16)
for z in [1.08+i*.07 for i in range(7)]:ring('Grip wrap',(1.06,-.025,z),.057,.012,rubber,parent=axe)
cylinder('Pommel',(1.06,-.025,.39),.09,.11,brass,16,axe)
plate('Chainaxe chassis',[(1.0,1.93),(1.32,2.19),(1.73,2.12),(1.98,1.79),(1.87,1.45),(1.53,1.31),(1.10,1.49)],-.025,.20,steel,axe,.025)
plate('Axe inset',[(1.18,1.88),(1.38,2.06),(1.66,2.00),(1.81,1.76),(1.72,1.52),(1.49,1.44),(1.22,1.57)],-.142,.026,red,axe,.015)
for j in range(10):
    a=math.radians(70-j*15);cx=1.48+.49*math.cos(a);cz=1.75+.49*math.sin(a)
    plate('Chain tooth',[(cx-.055,cz-.06),(cx+.065,cz-.015),(cx+.11,cz+.10),(cx-.025,cz+.055)],-.025,.24,edge,axe,.009)
sphere('Axe drive housing',(1.19,-.165,1.74),(.16,.08,.16),brass,axe)
cylinder('Drive spindle',(1.19,-.25,1.74),.07,.035,iron,12,axe,(math.pi/2,0,0))
# Studio stage is excluded from GLB export.
current=collection('STUDIO · presentation only')
cylinder('Display plinth',(0,0,-.12),2.35,.21,iron,64)
ring('Plinth trim',(0,0,-.015),2.26,.026,brass)
box('Studio floor',(0,0,-.27),(200,200,.20),iron,.02)
area('Warm key',(3,-5,7),1250,(1,.81,.65),4,(0,0,1.7))
area('Cool fill',(-4,-2,3.5),1000,(.38,.65,1),3,(0,0,1.8))
area('Shoulder rim',(2,4,5.5),1900,(.5,.75,1),3,(0,0,2.3))
area('Eye level softbox',(0,-5,2.5),180,(1,.95,.9),2,(0,0,2.2))
camera('Marine three-quarter',(5,-9,4.4),(0,0,1.75),65)
marine_scene.render.resolution_x=1400;marine_scene.render.resolution_y=1600
print('Marine complete:',len(marine_collection.objects),'objects')
