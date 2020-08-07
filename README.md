# timerAxis
时间轴选取控件

### 长这样子
![explan img](https://github.com/xuqighub/timerAxis/blob/master/demo/demo.jpg?raw=true)


### 引用方式
将对应的css,js引入html页面中

### 调用方式
```
var t1 = timerAxis.createAxis({
    //目标盒子，只要一个盒子就行，但是需要知道盒子的宽度
    box:document.querySelector('.box2'),
    //mousemove的callback 这里可以对时间进行限定，比如移动距离必须是30分钟的间隔，
    //返回时间数组，需要return对时间的处理
    timeCallback:function(arr){
        let gap = 30;
        return [Math.round(arr[0]/gap)*gap,Math.round(arr[1]/gap)*gap];
    },
    //鼠标抬起的回调，返回时间的数组
    mouseupCallback:function(timeArr){
        console.log(timeArr,'timeArr')
    },
    //设置时间的后的回调，比如通过时间的controler设置时间，成功返回true 否则返回false
    setTimeCallback:function(res){
        console.log('set time callback:',res);

    }
});
```
### 同一个box里面装载多个控件（多次调用）
```
var t1 = timerAxis.createAxis({
    box:document.querySelector('.box2')
});
var t2 = timerAxis.createAxis({
    box:document.querySelector('.box2')
});
var t3 = timerAxis.createAxis({
    box:document.querySelector('.box2')
});
```
#### 参数说明
- box：必须，目标盒子，只要一个盒子就行，但是需要知道盒子的宽度，用来装载timerAxis的盒子
- timeCallback：可选，mousemove的callback 这里可以对时间进行限定，比如移动距离必须是30分钟的间隔，返回时间数组，需要return对时间的处理
- mouseupCallback：可选，鼠标抬起的回调，返回时间的数组
- setTimeCallback：可选，设置时间的后的回调，比如通过时间的controler设置时间，成功返回一个包含status和msg的对象,表示设置是否成功及对应信息

### 获取各种事件模块的信息
- getSliderMap：获取所有slider的map px，没有顺序
- getSliderArr： 获取所有slider对应的arr px,从小到大的排序
- getSliderArrTime：//获取所有slider对应的arr,并且是转换成时间 08:09 格式,从小到大的排序
- setTime：根据给定的时间生成对应的时间轴，如果成功（在范围内）返回true,否则返回false，参数 timeArr,时间数组[08:00,14:30]
- deleteTime：删除某一个时间值，从pubData里面删除，并且删除对应的slider,传入要删除的slider,参数时要删除的slider,即dom 元素


