// watch:x,y,error,ystep,deltax
// Bresenham's Line drawing algorithm see <a href='#' onclick='window.open("http://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm");return false;'>Wikipedia</a>
var cv1=createCanvas(10,20,10,10,'gray')
var cv2=createCanvas(10,20,1,1,'white')

function plot(x,y,col){
setPixel(cv1,x,y,col);
setPixel(cv2,x,y,col);
}

function Bresenham(x0, x1, y0, y1,col){
var steep = Math.abs(y1 - y0) > Math.abs(x1 - x0)
if (steep){
// swap
var tmp=x0;x0=y0;y0=tmp
tmp=x1;x1=y1;y1=tmp
}
if (x0 > x1){
// swap
var tmp=x0;x0=x1;x1=tmp;
tmp=y0;y0=y1;y1=tmp;
}

var deltax = x1 - x0
var deltay = Math.abs(y1 - y0)
var error = 0
var ystep
var y = y0
if (y0<y1) ystep = 1; else ystep = -1
for (x=x0;x<=x1;x++){
if (steep) plot(y,x,col); else plot(x,y,col)
error = error + deltay
if (2*error >= deltax){
y = y + ystep
error = error - deltax
}
}
}

Bresenham(3,7,1,9,'red')
Bresenham(8,1,2,16,'blue')

// Xiaolin Wu's line algorithm is an algorithm for line antialiasing.
// The basis of the algorithm is to draw pairs of pixels straddling
// the line, coloured according to proximity. Pixels at the line ends
// are handled separately, see <a href='#' onclick='window.open("http://en.wikipedia.org/wiki/Xiaolin_Wu%27s_line_algorithm");return false;'>Wikipedia</a>
// watch:x,y,dx,dy,gradient,xend,yend,xgap,ypxl1

var cv1=createCanvas(10,20,10,10,'#ffeeff')
var cv2=createCanvas(10,20,1,1,'#ffffee')

// Create a gray HEX color from 0 <= c <= 1
function col(c){
var st='0123456789abcdef'.charAt(round(15-15*c) )
return "#"+st+st+st+st+st+st;
}

// plot the pixel at (x, y) with brightness c (where 0 <= c <= 1)
function plot(x, y, c) {
setPixel(cv1,y,x,col(c));
setPixel(cv2,y,x,col(c));
}

function ipart(x){ return Math.floor(x)}
function round(x){ return ipart(x + 0.5)}
function fpart(x){ return x-ipart(x);}
function rfpart(x){ return 1 - fpart(x)}

function drawLine(x0, y0, x1, y1){
var dx = x1 - x0
var dy = y1 - y0
var gradient = dy / dx

// handle first endpoint
var xend = round(x0)
var yend = y0 + gradient * (xend - x0)
var xgap = rfpart(x0 + 0.5)
var xpxl1 = xend // this will be used in the main loop
var ypxl1 = ipart(yend)
plot(xpxl1, ypxl1, rfpart(yend) * xgap)
plot(xpxl1, ypxl1 +1 , fpart(yend) * xgap)
intery = yend + gradient // first y-intersection for the main loop

// handle second endpoint
xend = round(x1)
yend = y1 + gradient * (xend - x1)
xgap = fpart(x1 + 0.5)
xpxl2 = xend // this will be used in the main loop
ypxl2 = ipart(yend)
plot(xpxl2, ypxl2, rfpart(yend) * xgap)
plot(xpxl2, ypxl2 +1 , fpart(yend) * xgap)

// main loop
for (var x=xpxl1 + 1; x< xpxl2; x++) {
plot(x, ipart(intery), rfpart(intery))
plot(x , ipart(intery)+1 , fpart(intery))
intery = intery + gradient
}
}

drawLine(0,0,16,7)

