"""Matte the user-supplied white-background turntable into portable RGB/alpha H.264."""
import sys,json,shutil,subprocess
from pathlib import Path
sys.path.insert(0,'/tmp/codex-craft-video-deps')
import cv2
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
SOURCE=Path("/Users/lucas/Downloads/aespa 에스파 'Whiplash' ae-WINTER _ Whiplash Universe.mp4")
OUT=ROOT/'public/assets/craft/hologram';ARCHIVE=ROOT/'asset-sources/craft/hologram'
OUT.mkdir(parents=True,exist_ok=True);ARCHIVE.mkdir(parents=True,exist_ok=True)
shutil.copy2(SOURCE,ARCHIVE/'original.mp4')
capture=cv2.VideoCapture(str(SOURCE));fps=capture.get(cv2.CAP_PROP_FPS)
# The floor reflection begins below the shoes. Crop to the contact line.
X0,X1,Y0,Y1=68,292,86,578;W,H=X1-X0,Y1-Y0
output=OUT/'winter-rgb-alpha.mp4'
encoder=subprocess.Popen(['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','bgr24','-s',f'{W*2}x{H}','-r',str(fps),'-i','pipe:0','-an','-c:v','libx264','-crf','18','-preset','medium','-pix_fmt','yuv420p','-movflags','+faststart',str(output)],stdin=subprocess.PIPE)
frames=0;union=[W,H,0,0];diagnostics=[];last_alpha=None
while True:
 ok,frame=capture.read()
 if not ok:break
 # Exclude the black title/end card, rather than displaying a black rectangle.
 if frame[:60,:40].mean()<180:break
 background=np.median(np.concatenate([frame[:,:40],frame[:,-40:]],axis=1),axis=1)[:,None,:]
 difference=np.max(np.abs(frame.astype(np.float32)-background),axis=2)
 fg=(difference[Y0:Y1,X0:X1]>18).astype(np.uint8)
 fg=cv2.morphologyEx(fg,cv2.MORPH_CLOSE,np.ones((3,3),np.uint8))
 count,labels,stats,_=cv2.connectedComponentsWithStats(fg,8)
 fg=np.isin(labels,[i for i in range(1,count) if stats[i,cv2.CC_STAT_AREA]>18]).astype(np.uint8)
 # Keep silver highlights enclosed by the silhouette, while leaving large arm gaps clear.
 inv=1-fg;count,labels,stats,_=cv2.connectedComponentsWithStats(inv,8)
 for i in range(1,count):
  x,y,w,h,area=stats[i]
  row=np.flatnonzero(fg[min(H-1,y+h//2)])
  central=len(row)>0 and abs(x+w/2-np.median(row))<(row[-1]-row[0])*.24
  if x>0 and y>0 and x+w<W and y+h<H and (area<320 or central and area<2400):fg[labels==i]=1
 alpha=cv2.GaussianBlur(fg.astype(np.float32),(3,3),.55)
 alpha=np.clip((alpha-.08)/.84,0,1)
 alpha[:2]*=np.arange(2)[:,None]/2
 ys,xs=np.nonzero(alpha>.5)
 if len(xs):union=[min(union[0],int(xs.min())),min(union[1],int(ys.min())),max(union[2],int(xs.max())),max(union[3],int(ys.max()))]
 rgb=frame[Y0:Y1,X0:X1].copy()
 # Remove white fringing at partially covered edge pixels.
 a=np.maximum(alpha[:,:,None],.02);rgb=np.clip((rgb.astype(float)-(1-a)*background[Y0:Y1])/a,0,255).astype(np.uint8)
 packed=np.concatenate([rgb,np.repeat((alpha*255).astype(np.uint8)[:,:,None],3,axis=2)],axis=1)
 encoder.stdin.write(packed.tobytes())
 if frames in [0,180,360,540]:
  dark=np.empty_like(rgb);dark[:]=[51,28,20]
  composite=(rgb*alpha[:,:,None]+dark*(1-alpha[:,:,None])).astype(np.uint8)
  diagnostics.append(composite)
 if frames==0:cv2.imwrite(str(OUT/'poster-rgb-alpha.png'),packed)
 last_alpha=alpha;frames+=1
 if frames%150==0:print('MATTED_FRAMES',frames,flush=True)
encoder.stdin.close();assert encoder.wait()==0;capture.release()
cv2.imwrite(str(ROOT/'artifacts/craft-hologram-matte-contact.png'),np.concatenate(diagnostics,axis=1))
report={'source':SOURCE.name,'sourceDuration':23.067528,'duration':frames/fps,'frames':frames,'fps':fps,'crop':[X0,Y0,W,H],'foregroundBounds':union,'packedSize':[W*2,H],'packing':'RGB left / alpha right, same frame','audio':False,'floorReflectionRemoved':True,'blackEndCardRemoved':True,'bytes':output.stat().st_size}
for folder in [OUT,ARCHIVE]:(folder/'video.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('HOLOGRAM_VIDEO',json.dumps(report),flush=True)
