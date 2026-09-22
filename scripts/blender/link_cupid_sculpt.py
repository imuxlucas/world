"""Local porcelain cherub sculpture with editable feathers, curls, bow and fingers."""
import bpy, math
from mathutils import Vector
import build_asset_parts as b

def build(parent):
    b.M['cupid_ivory']=b.material('Cupid warm ivory porcelain',(.97,.935,.89),.025,.31)
    b.M['cupid_hair']=b.material('Cupid carved ivory curls',(.92,.875,.82),.035,.33)
    b.M['cupid_detail']=b.material('Cupid subtle sculpt recess',(.58,.49,.44),.0,.48)
    b.M['cupid_iris']=b.material('Cupid stone iris',(.40,.43,.48),.02,.35)
    skin='cupid_ivory'
    solids=[]
    def egg(name,loc,scale,mat=skin,body=False,axis=None):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=20,radius=1,location=loc)
        o=bpy.context.object;o.scale=scale
        if axis is not None:o.rotation_euler=Vector(axis).to_track_quat('Z','Y').to_euler()
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        b.finish(o,'Cupid '+name,mat,parent)
        if body:solids.append(o)
        return o
    def limb(name,a,c,r0,r1,body=True):
        a,c=Vector(a),Vector(c)
        o=egg(name,(a+c)/2,(r0,r1,(c-a).length/2+r0*.52),body=body,axis=c-a)
        return o
    # A continuous, posed silhouette; voxel-union only the anatomical porcelain surface.
    egg('torso',(-.16,-.52,2.46),(.115,.095,.173),body=True)
    egg('belly',(-.125,-.552,2.42),(.115,.10,.125),body=True)
    limb('neck',(-.15,-.50,2.59),(-.11,-.51,2.67),.055,.051)
    egg('head',(-.12,-.53,2.73),(.124,.110,.149),body=True)
    egg('chin',(-.10,-.569,2.652),(.075,.066,.052),body=True)
    for x in [-.175,-.071]:egg('cheek',(x,-.609,2.703),(.046,.035,.039),body=True)
    egg('nose bridge',(-.102,-.629,2.725),(.019,.027,.033),body=True)
    egg('nose tip',(-.098,-.649,2.708),(.023,.022,.019),body=True)
    egg('left ear',(-.243,-.52,2.724),(.021,.023,.037),body=True)
    egg('right ear',(.002,-.52,2.724),(.021,.023,.037),body=True)
    # Right arm extends to bow; left elbow is drawn back before the pulling hand.
    limb('extended upper arm',(-.065,-.52,2.555),(.055,-.58,2.532),.045,.042)
    limb('extended forearm',(.055,-.58,2.532),(.267,-.598,2.545),.035,.031)
    egg('bow hand',(.278,-.600,2.544),(.043,.034,.036),body=True)
    limb('drawn upper arm',(-.226,-.515,2.546),(-.282,-.64,2.486),.047,.042)
    limb('drawn forearm',(-.282,-.64,2.486),(-.057,-.651,2.542),.036,.032)
    egg('string hand',(-.039,-.653,2.548),(.040,.025,.031),body=True)
    # Flying pose with bent knees and soft infant proportions.
    limb('near thigh',(-.16,-.54,2.332),(-.241,-.584,2.228),.070,.061)
    egg('near knee',(-.243,-.579,2.238),(.062,.058,.064),body=True)
    limb('near calf',(-.243,-.577,2.23),(-.350,-.56,2.284),.043,.041)
    egg('near foot',(-.378,-.568,2.278),(.053,.044,.032),body=True)
    limb('far thigh',(-.13,-.467,2.327),(-.052,-.443,2.207),.059,.055)
    limb('far calf',(-.052,-.443,2.207),(-.142,-.433,2.118),.040,.038)
    egg('far foot',(-.167,-.457,2.104),(.053,.038,.027),body=True)
    bpy.ops.object.select_all(action='DESELECT')
    for o in solids:o.select_set(True)
    bpy.context.view_layer.objects.active=solids[0]
    bpy.ops.object.join();body=solids[0];body.name='Cupid continuous porcelain figure'
    b.ASSET_OBJECTS[:]=[o for o in b.ASSET_OBJECTS if o not in solids[1:]]
    rem=body.modifiers.new('Sculpt surface union','REMESH');rem.mode='VOXEL';rem.voxel_size=.0042
    bpy.ops.object.modifier_apply(modifier=rem.name)
    sm=body.modifiers.new('Sculpt smoothing','SMOOTH');sm.factor=.7;sm.iterations=4
    bpy.ops.object.modifier_apply(modifier=sm.name)
    for p in body.data.polygons:p.use_smooth=True
    # Modest cloth drape with raised overlapping folds.
    egg('waist drapery',(-.14,-.519,2.335),(.112,.105,.068),'white')
    for j in range(5):
        x=-.22+j*.039
        b.tube('Cupid drapery fold',[(x,-.620,2.365),(x+.01,-.632,2.34),(x+.027,-.615,2.302)],.004,skin,parent,res=3)
    # Almond eyes: ivory sclera, tiny gray iris, eyelids sculpted over their edges.
    for x in [-.167,-.056]:
        egg('eye white',(x,-.628,2.744),(.027,.010,.014),skin)
        egg('iris',(x+.006,-.638,2.744),(.009,.003,.010),'cupid_iris')
        egg('eye glint',(x+.004,-.641,2.747),(.002,.001,.002),'white')
        upper=[(x+.028*math.cos(t),-.637,2.743+.015*math.sin(t)) for t in [math.pi*j/16 for j in range(17)]]
        lower=[(x+.027*math.cos(t),-.634,2.744-.012*math.sin(t)) for t in [math.pi*j/16 for j in range(17)]]
        b.tube('Cupid upper eyelid',upper,.0045,skin,parent,res=3)
        b.tube('Cupid lower eyelid',lower,.0032,skin,parent,res=3)
        b.tube('Cupid eyebrow',[(x-.026,-.626,2.778),(x,-.635,2.783),(x+.024,-.626,2.777)],.005,'cupid_hair',parent,res=3)
    b.tube('Cupid mouth recess',[(-.127,-.632,2.675),(-.111,-.640,2.671),(-.09,-.639,2.674),(-.078,-.631,2.680)],.0023,'cupid_detail',parent,res=3)
    egg('lower lip',(-.102,-.633,2.667),(.024,.009,.006),skin)
    for x in [-.110,-.086]:egg('nostril',(x,-.655,2.698),(.004,.002,.003),'cupid_detail')
    # Hand creases and individually curled fingers around string and bow grip.
    for j in range(4):
        z=2.525+j*.012
        b.tube('Cupid bow fingers',[(.264,-.624,z),(.285,-.636,z),(.299,-.621,z)],.007,skin,parent,res=3)
        b.tube('Cupid draw fingers',[(-.056,-.671,z+.012),(-.031,-.677,z+.010),(-.025,-.660,z+.008)],.006,skin,parent,res=3)
    # Individually carved curls follow the scalp; keep the face open.
    for row,(zrad,r,ct) in enumerate([(.110,.077,9),(.064,.112,12),(.015,.122,12)]):
        for j in range(ct):
            a=math.tau*j/ct
            if row==2 and math.sin(a)<-.15:continue
            c=Vector((-.12+r*math.cos(a),-.53+r*.88*math.sin(a),2.73+zrad))
            normal=Vector((math.cos(a)*.65,math.sin(a)*.65,.8 if row==0 else .45)).normalized()
            u=normal.cross(Vector((0,0,1)))
            if u.length<.01:u=Vector((1,0,0))
            u.normalize();v=normal.cross(u)
            pts=[]
            for k in range(40):
                t=k/39;theta=t*math.pi*3.1
                rad=.023*(1-.72*t)
                pts.append(tuple(c+u*math.cos(theta)*rad+v*math.sin(theta)*rad+normal*.008*t))
            b.tube('Cupid carved spiral curl',pts,.008,'cupid_hair',parent,res=3)
    egg('scalp crown',(-.12,-.51,2.856),(.077,.070,.036),'cupid_hair')
    # Feathered wings fan behind the shoulders. Each feather has a tapered volume and quill.
    def feather(a,c,width):
        a,c=Vector(a),Vector(c);d=c-a
        u=Vector((d.z,0,-d.x)).normalized();v=d.normalized().cross(u).normalized()
        verts=[];faces=[];rings=14;sides=12
        for i in range(rings+1):
            t=i/rings
            w=width*(math.sin(math.pi*t)**.65)*(.9-.25*t)+.0008
            center=a+d*t+Vector((0,-.012*math.sin(math.pi*t),0))
            for j in range(sides):
                ang=math.tau*j/sides
                verts.append(tuple(center+u*(w*math.cos(ang))+v*(w*.28*math.sin(ang))))
        for i in range(rings):
            for j in range(sides):faces.append((i*sides+j,i*sides+(j+1)%sides,(i+1)*sides+(j+1)%sides,(i+1)*sides+j))
        faces += [tuple(range(sides-1,-1,-1)),tuple(rings*sides+j for j in range(sides))]
        me=bpy.data.meshes.new('Carved feather');me.from_pydata(verts,[],faces);me.update()
        ob=bpy.data.objects.new('Cupid layered wing feather',me);bpy.context.collection.objects.link(ob);b.finish(ob,ob.name,skin,parent)
        b.tube('Cupid feather quill',[tuple(a+d*t+Vector((0,-.012,0))) for t in [.05,.25,.5,.75,.92]],.002,skin,parent,res=2)
    for side in [-1,1]:
        root=Vector((-.16+side*.075,-.435,2.56))
        for j in range(9):
            a=root+Vector((side*.016*j,.014, -.007*j))
            c=root+Vector((side*(.34-.022*j),.045, .19-.033*j))
            feather(a,c,.029)
        for j in range(7):
            a=root+Vector((side*.009*j,-.018,-.008*j))
            c=root+Vector((side*(.19-.015*j),-.012,.10-.025*j))
            feather(a,c,.024)
    # Bowstring is drawn to the left hand; a heart-tipped arrow aims right.
    bow=[(.28+.103*math.sin(math.pi*t),-.604,2.315+.47*t) for t in [i/48 for i in range(49)]]
    b.tube('Cupid golden bow',bow,.012,'gold',parent,res=4)
    for p in [bow[0],bow[-1]]:b.sphere('Cupid bow terminal',p,.018,'gold',parent)
    b.tube('Cupid drawn bowstring',[bow[0],(-.034,-.664,2.548),bow[-1]],.0025,'gold',parent,res=2)
    b.beam('Cupid love arrow shaft',(-.047,-.663,2.548),(.558,-.663,2.548),.006,'gold',parent,16)
    # Heart arrow head, built from an unambiguous closed triangulated shape.
    pts=b.heart_points(.095/32,.095/32,64)
    vs=[(.568,-.663,2.548)]+[(.568-z,-.663,2.548+x) for x,z in pts]
    fs=[(0,1+i,1+(i+1)%64) for i in range(64)]
    me=bpy.data.meshes.new('Heart arrow head');me.from_pydata(vs,[],fs);me.update()
    ob=bpy.data.objects.new('Cupid heart arrowhead',me);bpy.context.collection.objects.link(ob);b.finish(ob,ob.name,'pink',parent)
    so=ob.modifiers.new('Arrowhead thickness','SOLIDIFY');so.thickness=.024
    be=ob.modifiers.new('Arrowhead soft edge','BEVEL');be.width=.005;be.segments=3
    # Clearly visible physical clamp under the shoulder attaches to the hub beam cantilever.
    b.box('Cupid concealed mounting shoe',(-.13,-.416,2.58),(.13,.095,.09),'white',parent,.018)
    return parent
