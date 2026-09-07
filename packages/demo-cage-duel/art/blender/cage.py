"""First authored asset: an octagonal industrial duelling cage."""
cage_scene=new_scene('01 · THE CAGE'); current=collection('CAGE · export geometry')
cage_collection=current
cylinder('Foundation',(0,0,-.35),6.45,.7,iron,64)
cylinder('Armoured deck',(0,0,-.08),6.2,.25,steel,64)
for r in (2.1,5.7,6.15):ring('Deck concentric seam',(0,0,.061),r,.025,brass)
# Eight segmented deck wedges, grating channels, tie-downs.
for k in range(8):
    a=k*math.tau/8
    for radius in (3.1,4.6):
        box('Radial deck plate',(radius*math.cos(a),radius*math.sin(a),.065),(1.35,2.1,.10),steel,.028,rot=(0,0,a))
    for j in range(12):
        r=2.55+j*.25
        box('Drain grille',(r*math.cos(a),r*math.sin(a),.129),(.055,.75,.028),iron,.005,rot=(0,0,a))
    for radius in (2.35,5.4):
        cylinder('Deck fastening',(radius*math.cos(a),radius*math.sin(a),.15),.055,.05,brass,8)
# Physical steel lattice and arch buttresses. South facet is an open gate.
for k in range(8):
    a=math.pi/8+k*math.tau/8; b=a+math.tau/8
    A=Vector((6*math.cos(a),6*math.sin(a),0));B=Vector((6*math.cos(b),6*math.sin(b),0))
    box('Cage pillar',(*A[:2],2.1),(.22,.28,4.3),steel,.035,rot=(0,0,a))
    box('Pillar foot',(*A[:2],.23),(.52,.57,.43),iron,.05,rot=(0,0,a))
    for z in ((3.8,4.2) if k==5 else (.45,3.8,4.2)):beam('Octagonal perimeter rail',A+Vector((0,0,z)),B+Vector((0,0,z)),.08,edge,vertices=8)
    box('Pillar lumen',(A.x*.99,A.y*.99,2.5),(.065,.10,1.1),amber,.012,rot=(0,0,a))
    # Skip south-facing panel for gateway.
    if k==5:continue
    for j in range(1,20):
        P=A.lerp(B,j/20);beam('Cage vertical bar',P+Vector((0,0,.55)),P+Vector((0,0,3.72)),.022,iron,vertices=6)
    for j in range(1,14):
        z=.55+j*.225;beam('Cage horizontal wire',A+Vector((0,0,z)),B+Vector((0,0,z)),.016,steel,vertices=6)
    beam('Panel diagonal brace',A+Vector((0,0,.6)),B+Vector((0,0,3.7)),.033,edge,vertices=8)
# Gate framing and threshold on the south facet.
box('Gate lintel',(0,-5.55,4.18),(4.3,.38,.58),iron,.06)
text_obj('Gate signage','THE CRUCIBLE',(0,-5.755,4.1),.24,cream)
box('Gate threshold',(0,-6.15,.04),(3.8,1.15,.15),iron,.04)
for i in range(9):box('Threshold hazard stripe',(-1.6+i*.4,-6.2,.127),(.20,.85,.018),brass,.005,rot=(0,0,-.4))
# Ship structure is separate and not included in cage.glb.
current=collection('SHIP · presentation architecture')
ship_collection=current
box('Ship floor',(0,0,-.77),(30,30,.18),iron,.03)
for x in (-10,10):
    box('Hull wall',(x,2,4),(1,25,10),iron,.08)
    for y in (-6,0,6,12):
        beam('Ship rib',(x,y,-.5),(x*.88,y,8),.32,steel,vertices=8)
        beam('Vault support',(x*.88,y,8),(x*.35,y,10),.27,steel,vertices=8)
        box('Hull light',(x*.95,y,4),(.16,.4,3),cyan,.025)
box('Rear bulkhead',(0,11,4),(20,.5,10),iron,.04)
for x in (-7,-3.5,0,3.5,7):box('Rear bulkhead rib',(x,10.6,4),(.2,.22,9),steel,.03)
ring('Reactor housing',(0,10.15,4.8),2.6,.20,steel,rot=(math.pi/2,0,0))
ring('Reactor cold rim',(0,10.05,4.8),2.4,.055,cyan,rot=(math.pi/2,0,0))
for i in range(16):
    a=i*math.tau/16
    beam('Reactor radial blade',(0,10.08,4.8),(2.3*math.cos(a),10.08,4.8+2.3*math.sin(a)),.055,edge)
for x in (-7,7):
    box('Service console',(x,4,.7),(.85,1.5,1.5),steel,.1)
    box('Console lamp',(x,3.23,1.1),(.5,.04,.22),cyan,.015)
area('Cold overhead',(0,1,9),2600,(.55,.77,1),7,(0,0,0))
area('Entrance key',(3,-10,7),2200,(1,.72,.48),6,(0,0,1))
area('Reactor spill',(0,9,5),1800,(.16,.52,1),4,(0,0,2))
area('Red rim',(-8,0,5),1600,(1,.16,.035),4,(0,0,1))
camera('Cage overview',(8,-13,10),(0,0,1.5),38)
print('Cage complete:',len(cage_collection.objects),'objects')
