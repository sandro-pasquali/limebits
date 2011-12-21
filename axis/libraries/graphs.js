// watch:i,j,smallest,from,to,found,done
// Prim's Minimum Spanning Tree Algorithm see <a href='#' onclick='window.open("http://en.wikipedia.org/wiki/Prim%27s_algorithm");return false;'>Wikipedia</a>
var inf=100000
var names=new Array('A','B','C','D','E','F')
var m=new Array(6)

function weight(a,b){
return m[a][b]
}
function findSmallest(V,all,done){
// all=true: find smallest of all edges
// all=false: find smallest with one vertex not done
var smallest=inf
var from,to
var i,j
for (i=0;i<V;i++){
for (j=i+1;j<V;j++){
if (all || (done[i]!=done[j])){
var w = weight(i,j);
if (w<smallest){
smallest=w
from=i; to=j
}
}
}
}
return new Array(from,to,smallest)
}

function Prim(V){
var i
var done = new Array(V)
var ret=new Array()

// init
for(i=0; i<V; i++) done[i]=false

// now we search V-1 times the smallest edge:
for(i=0; i<V-1; i++){
var found=findSmallest(V,i==0,done)
ret.push(found)
done[found[0]]=true
done[found[1]]=true
}
return ret
}

function init(){
var x=inf
m[0]=new Array(0,2,3,x,x,x)
m[1]=new Array(2,0,3,6,x,x)
m[2]=new Array(3,3,0,3,5,x)
m[3]=new Array(x,6,3,0,1,3)
m[4]=new Array(x,x,5,1,0,1)
m[5]=new Array(x,x,x,3,1,0)
var s='<pre>'
s +='A--2-B--6-D--3-F'+nl
s +=' \\ | /| / '+nl
s +=' 3 3 3 1 1 '+nl
s +=' \\ | / | / '+nl
s +=' C--5-E '+nl
s +='</pre>'
message(s.replace(/(\d)+/g, '<font color="red">$1</font>'));
}

init()
var i,p=Prim(m.length)
var total=0
message('Minimum Spanning Tree:'+nl)
for (i=0;i<p.length;i++){
message('('+names[p[i][0]]+','+names[p[i][1]] + ') ')
total += p[i][2]
}
message('Length:'+total)


// watch:G,M,i,j,k
// Floyd's All pair shortest Path Algorithm see <a href='#' onclick='window.open("http://en.wikipedia.org/wiki/Floyd%27s_algorithm");return false;'>Wikipedia</a>
var inf=10000
var undef=-1
var names=new Array('A','B','C','D','E','F')
var m=new Array(6)

function Floyd(G){
var M = new Array(G.length)
var i, j, k
for(i=0; i < M.length; i++){
M[i]=new Array(M.length)
for(j=0; j < M.length; j++){
M[i][j]=G[i][j]
}
}
for(k=0; k < M.length; k++){
for(i=0; i < M.length; i++){
for(j=0; j < M.length; j++){
M[i][j]= Math.min( M[i][j], M[i][k] + M[k][j])
}
}
}
return M
}

function init(){
var x=inf
m[0]=new Array(0,2,3,x,x,x)
m[1]=new Array(2,0,3,6,x,x)
m[2]=new Array(3,3,0,3,5,x)
m[3]=new Array(x,6,3,0,1,3)
m[4]=new Array(x,x,5,1,0,1)
m[5]=new Array(x,x,x,3,1,0)
var s='<pre>'
s +='A--2-B--6-D--3-F'+nl
s +=' \\ | /| / '+nl
s +=' 3 3 3 1 1 '+nl
s +=' \\ | / | / '+nl
s +=' C--5-E '+nl
s +='</pre>'
message(s.replace(/(\d)+/g, '<font color="red">$1</font>'));
}
init()
var fromNode= 0 // A
var toNode = 5 // F
var res=Floyd(m)
message('Distance ' +names[fromNode] + ' --> ' + names[toNode] + ': ' + res[fromNode][toNode])

// watch:done,pred,P,i,v
// Dijkstra's Shortest Path Algorithm see <a href='#' onclick='window.open("http://en.wikipedia.org/wiki/Dijkstra%27s_algorithm");return false;'>Wikipedia</a>
var inf=10000
var undef=-1
var names=new Array('A','B','C','D','E','F')
var m=new Array(6)

function weight(a,b){
return m[a][b]
}

function Dijkstra(V,s,d){
var P = new Array(V)
var i
var done = new Array(V)
var pred = new Array(V)

for(i=0; i<V; i++){
P[i] = inf
pred[i]=undef
done[i]=false
}
P[s]=0

var v;
for(v=0; v<V; v++){
var minDist = inf, closest = -1
for (i=0; i<V; i++){
if(!done[i]){
if(P[i] <= minDist){
minDist = P[i]; closest = i;
}
}
}
done[closest] = true

for (i=0; i<V; i++){
if (!done[i]){
var w = weight(closest, i);
if (P[closest]+w < P[i]){
P[i] = P[closest] + w;
pred[i] = closest;
}
}
}
}
//done, now print
i=d
if (P[i] < inf) {
var thePath = names[i];
var v = i;
while (v>0){
v = pred[v];
if (v>=0) thePath = names[v] + '->' + thePath;
}
message("Distance:" + P[i]+' ('+thePath+')'+nl);
} else {
message("no path")
}
}

function init(){
var x=inf
m[0]=new Array(0,2,3,x,x,x)
m[1]=new Array(2,0,3,6,x,x)
m[2]=new Array(3,3,0,3,5,x)
m[3]=new Array(x,6,3,0,1,3)
m[4]=new Array(x,x,5,1,0,1)
m[5]=new Array(x,x,x,3,1,0)
var s='<pre>'
s = s + 'A--2-B--6-D--3-F'+nl
s = s + ' \\ | /| / '+nl
s = s + ' 3 3 3 1 1 '+nl
s = s + ' \\ | / | / '+nl
s = s + ' C--5-E '+nl
s = s +'</pre>'
message(s.replace(/(\d)+/g, '<font color="red">$1</font>'));
}
init()
var from=0 // A
var to =5 // F
Dijkstra(m.length,from,to)

// The <a href="http://en.wikipedia.org/wiki/Bellman-Ford_algorithm">Bellman-Ford algorithm</a> computes single-source shortest
// paths in a weighted digraph.
// watch:nodeCount,edgeCount,i,j,distance,edges[j].source

var INFINITY =10000;
var names=new Array('A','B','C','D','E','F')

function Edge(s,d,w) {
this.source=s;
this.dest=d;
this.weight=w;
}


function BellmanFord(edges, edgeCount, nodeCount, source) {
var distance = new Array(nodeCount);
var i, j;
for (i=0; i < nodeCount; i++)
distance[i] = INFINITY;

// The source node distance is set to zero.
distance[source] = 0;

for (i=0; i < nodeCount; i++) {
for (j=0; j < edgeCount; j++) {
if (distance[edges[j].source] != INFINITY) {
var new_distance = distance[edges[j].source] + edges[j].weight;
if (new_distance < distance[edges[j].dest])
distance[edges[j].dest] = new_distance;
}
}
}
for (i=0; i < edgeCount; i++) {
if (distance[edges[i].dest] > distance[edges[i].source] + edges[i].weight) {
message("Negative edge weight cycles detected!");
return;
}
}

for (i=0; i < nodeCount; i++) {
message("The shortest distance between nodes " + names[source] + " "+ names[i]+" " + distance[i]+"<br>");
}
return;
}

function init(){
var edges = new Array(17);
var i=0;
var A=0;var B=1;var C=2;var D=3;var E=4;var F=5;
edges[i++]=new Edge(A,B,2)
edges[i++]=new Edge(A,C,3)
edges[i++]=new Edge(B,A,2)
edges[i++]=new Edge(B,C,3)
edges[i++]=new Edge(B,D,6)
edges[i++]=new Edge(C,A,3)
edges[i++]=new Edge(C,B,3)
edges[i++]=new Edge(C,D,3)
edges[i++]=new Edge(C,E,5)
edges[i++]=new Edge(D,B,6)
edges[i++]=new Edge(D,C,3)
edges[i++]=new Edge(D,E,1)
edges[i++]=new Edge(D,F,3)
edges[i++]=new Edge(E,C,5)
edges[i++]=new Edge(E,D,1)
edges[i++]=new Edge(E,F,1)
edges[i++]=new Edge(F,D,3)
edges[i++]=new Edge(F,E,1)

var s='<pre>'
s = s + 'A--2-B--6-D--3-F'+nl
s = s + ' \\ | /| / '+nl
s = s + ' 3 3 3 1 1 '+nl
s = s + ' \\ | / | / '+nl
s = s + ' C--5-E '+nl
s = s +'</pre>'
message(s.replace(/(\d)+/g, '<font color="red">$1</font>'));
return edges
}

var edges=init();
BellmanFord(edges, 17, 6, 0);