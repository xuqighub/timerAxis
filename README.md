# timerAxis
时间轴选取控件

### 引用方式
将对应的css,js引入html页面中

### 调用方式
```
timerAxis.createAxis({
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
    //设置时间的后的回调，比如通过时间的controler设置时间，成功返回一个包含status和msg的对象,表示设置是否成功及对应信息
    setTimeCallback:function(res){
        console.log('set time callback:',res);
    }
});
```
### 同一个box里面装载多个控件（多次调用）
```
timerAxis.createAxis({
    box:document.querySelector('.box2')
});
timerAxis.createAxis({
    box:document.querySelector('.box2')
});
timerAxis.createAxis({
    box:document.querySelector('.box2')
});
```
#### 参数说明
- box：必须，目标盒子，只要一个盒子就行，但是需要知道盒子的宽度，用来装载timerAxis的盒子
- timeCallback：可选，mousemove的callback 这里可以对时间进行限定，比如移动距离必须是30分钟的间隔，返回时间数组，需要return对时间的处理
- mouseupCallback：可选，鼠标抬起的回调，返回时间的数组
- setTimeCallback：可选，设置时间的后的回调，比如通过时间的controler设置时间，成功返回一个包含status和msg的对象,表示设置是否成功及对应信息
