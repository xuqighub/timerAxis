(function(){
    //拖拽类和创建slider类共用的数据操作
    class TimeArrData{
        constructor(){
            this.min = 0;
            this.max = Number.MAX_SAFE_INTEGER;
            this.headTimeArr = []; // 起始位置的left 数组
            this.endTimeArr = []; // 起始位置+width 的数组
            this.timeMap = new Map(); // 存储每队位置数组
            this.zIndex = 0;
        }
        getMin = ()=>{
            return this.min;
        }
        getMax = ()=>{
            return this.max;
        }
        setMax= (value)=>{
            this.max = value;
        }
        getHeadArr = ()=>{
            return [...this.headTimeArr];
        }
        setHeadArr = (arr)=>{
            this.headTimeArr = arr;
        }
        getEndArr = ()=>{
            return [...this.endTimeArr];
        }
        setEndArr = (arr)=>{
            this.endTimeArr = arr;
        }
        getMap =  (key)=>{
            return (key ? this.timeMap.get(key) : this.timeMap);
        }
        setMap = (key,value)=>{
            this.timeMap.set(key,value);
        }
        deleteMap = (key)=>{
            this.timeMap.delete(key);
        }
        getzIndex = ()=>{
            return this.zIndex;
        }
        setzIndex = ()=>{
            this.zIndex+=10;
        }
        
    }
    
    //创建slider的类
    class CreateSlider{
        constructor(parentNode,pubData,callback,mouseupCallback){
            this.pubData = pubData;
            //创建slider 的轨道
            this.pEl = parentNode;
            //执行move改变过程中的回调，这个回调是对移动工程中位置的矫正（比如必须30分钟的整数倍）
            this.callback = callback;
            //鼠标抬起回调
            this.mouseupCallback = mouseupCallback;
            //当前会创建的元素
            this.el = null;
            //是否是创建过程做，即拖拽过程中
            this.isMouseDown = false;
            //当前创建的slider 的left 和 width
            this.currentPostion = [];
            //元素的位置left,startX
            this.position = {};
            //当前插入元素的位置（相对于endTimeArr）
            this.insertIndex = -2;
            //父元素位置
            this.pElPosition = this.pEl.getBoundingClientRect();
            //设置max值，即box的值,-2是因为有左右的border
            this.pubData.setMax(this.pElPosition.width-2);
            //时间监听
            let _this = this;
            this.pEl.addEventListener('mousedown',function(ev){
                _this.mousedown(ev);
                document.addEventListener('mousemove',_this.mousemove);
                document.addEventListener('mouseup',_this.mouseup);

                //隐藏掉时间控件
                let controlBox = document.querySelector('.ui-timerAxis-control-box');
                controlBox && (controlBox.style.display='none');
            });
            
        }
        //鼠标按下
        mousedown = (ev) =>{
            this.isMouseDown = true;
            if(!ev.target.classList.contains('ui-timerAxis-track')){
                this.isMouseDown = false;
                return false;
            }
            this.currentPostion = [];;
            this.position = {
                left:ev.pageX-this.pElPosition.left,
                startX:ev.pageX
            }

            let slider = document.createElement('div');
            slider.className = 'ui-timerAxis-slider ui-timerAxis-slider-active';
            //slider里面的结构，用于显示时间和拉伸作用
            let innerHTML = `
                <i class="ui-timerAxis-e-resize"></i>
                <i class="ui-timerAxis-w-resize"></i>
                <i class="ui-timerAxis-slider-showL-time">00:00</i>
                <i class="ui-timerAxis-slider-showR-time">00:00</i>
            `;
            slider.innerHTML = innerHTML;

            this.el = slider;
            let left = this.position.left;
            this.el.style.left = left + 'px';
            //设置zindex提高层级
            this.el.style.zIndex = this.pubData.getzIndex()+10;
            
            //判断起始位置是否正确
            if(!this._isCorrectStartPosition(left)){
                this.isMouseDown = false;
                this.currentPostion = [];
                return false;
            }
            //记录当前位置
            this.currentPostion[0] = left;

            //移除已有元素的 激活类
            [...this.pEl.children].forEach(el=>el.classList.remove('ui-timerAxis-slider-active'));

            //将当前节点放入盒子
            this.pEl.appendChild(this.el);
            //将两端的时间显示出来
            showLRTime(this.el,[left,left],this.pubData);
        }
        //鼠标移动
        mousemove = (ev) =>{
            if(!this.isMouseDown){
                return false;
            }
            let width = ev.pageX - this.position.startX;
            //获取正确的width
            width = this._correctWidth(width);
            if(+width<0){
                //向左滑动的
                this.currentPostion[1] = this.position.startX - this.pElPosition.left;
                this.currentPostion[0] = this.currentPostion[1] + width;
                
            }else{
                //向右滑动的
                this.currentPostion[1] = this.currentPostion[0] + width;
            }

            //执行move改变过程中的回调，这个回调是对移动工程中位置的矫正（比如必须30分钟的整数倍）
            let callback = this.callback?.(this.currentPostion);
            this.currentPostion = callback ? callback : this.currentPostion;
            //将两端的时间显示出来
            showLRTime(this.el,this.currentPostion,this.pubData);
            //更新dom位置
            width = this.currentPostion[1] - this.currentPostion[0];
            if(+width<0){
                //向左滑动的
                this.el.style.left = 'auto';
                //不论box的width多少，因为我们是把max分成了时间的等分，
                //所以，只要减去的是时间等分的倍数，那么剩下的一定是时间等分的距离
                this.el.style.right = this.pubData.getMax() - this.currentPostion[1] + 'px';
            }else{
                //向右滑动的
                this.el.style.left = this.currentPostion[0] + 'px';
            }
            this.el.style.width = Math.abs(width) + 'px';
        }
        //鼠标抬起
        mouseup = () =>{
            if(!this.isMouseDown){
                return false;
            }
            //取消事件监听
            this.isMouseDown = false;
            document.removeEventListener('mousemove',this.mousemove);
            document.removeEventListener('mouseup',this.mouseup);
            //如果当前位置的 left 或者 width 不存在则不继续，或者width小于一个值得时候不继续执行,并且mousedown添加进来的元素
            if(this.currentPostion?.[0] === undefined || !this.currentPostion?.[1] || this.currentPostion[1]-this.currentPostion[0]<10){
                this.el.remove();
                return false;
            }
            //给每个 slider 一个symbol值
            let symbol = Date.now() + '';
            this.el.dataset.symbol = symbol;
            let headTimeArr = this.pubData.getHeadArr(),
                endTimeArr = this.pubData.getEndArr();

            this.pubData.setHeadArr([...headTimeArr,this.currentPostion[0]].sort((a,b)=>a-b));
            this.pubData.setEndArr([...endTimeArr,this.currentPostion[1]].sort((a,b)=>a-b));
            this.pubData.setMap(symbol,[...this.currentPostion]);
            this.pubData.setzIndex();
            //鼠标抬起回调
            this.mouseupCallback?.(this.currentPostion);
            //console.log(this.pubData);
        }
        //判断起始位置需要在没有条目的空隙中
        _isCorrectStartPosition = (left)=>{
            let min = this.pubData.getMin(),
                max = this.pubData.getMax(),
                headTimeArr = this.pubData.getHeadArr(),
                endTimeArr = this.pubData.getEndArr();
            //重置当前插入元素的位置
            this.insertIndex = -2;
            //位置需要在区间内
            if(left<min || left >= max){
                return false;
            }
            //判断起始位置需要在没有条目的空隙中
            if(headTimeArr.length>0){
                //找到可以插入的位置
                let index = 0;
                //如果在第一个位置则是在（所有元素）最前面添加
                if(left<headTimeArr[0]){
                    this.insertIndex  = -1;
                    return true;
                }
                
                //如果大于endArr则是最后的位置（在所有元素后面添加），则不需要校验了
                if(left>=endTimeArr[endTimeArr.length-1]){
                    this.insertIndex = endTimeArr.length-1;
                    return true;
                }
                //如果起始点在已经存在的元素上面，即区间内返回false
                for(let i=0;i<headTimeArr.length;i++){
                    if(left>=headTimeArr[i] && left<=endTimeArr[i]){
                        return false;
                    }
                }

                //找到可以插入的位置
                for(let i=0;i<headTimeArr.length;i++){
                    if(left>=endTimeArr[i] && left<=endTimeArr[i+1]){
                        index = i;
                        this.insertIndex  = i;
                        break;
                    }
                }
                //表明这个新起点大于等于下一个存在元素的起始位置
                if(left>=headTimeArr[index+1]){
                    return false;
                }

            }
            return true;
        }
        //mousemove 时返回正确的width
        _correctWidth = (width) =>{
            let {left} = this.position;
            let min = this.pubData.getMin(),
                max = this.pubData.getMax(),
                headTimeArr = this.pubData.getHeadArr(),
                endTimeArr = this.pubData.getEndArr(),
                timeMap = this.pubData.getMap();
            let {insertIndex:index} = this;
            //从左到右的left 值应该是 left +  width
            let nowLeft = left + width;
            
            //console.log(nowLeft,left,width,index,'nowLeft left width index');
            
            //有元素的时候
            if(index>-2){
                //向右滑动
                if(width>0){
                    console.log('>>right',headTimeArr[index+1],index);
                    if(nowLeft>=headTimeArr[index+1]){
                        //console.log('now is = right item,width is:',headTimeArr[index+1] - left,left);
                        return headTimeArr[index+1] - left;
                    }
                }else{//向左滑动
                    console.log('<<left',endTimeArr[index],index);
                    //index是起始点大于当前下标的endTimeArr,由于向左滑动，其实他的nowLeft应该不小于该index对应的left
                    if(nowLeft<=endTimeArr[index]){
                        return endTimeArr[index] - left;
                    }
                } 
            }
            //如果超出左边界
            if(nowLeft<=0){
                return -left;
            }
            //如果现在值要超出右边界
            if(nowLeft>=max){
                return max - left;
            }
            return width;
        }
    }
    
    //创建拖拽类
    class DragSlider{
        constructor(parentNode,pubData,callback,mouseupCallback){
            //顶层元素
            this.pEl = parentNode;
            //共用数据
            this.pubData = pubData;
            //执行move改变过程中的回调，这个回调是对移动工程中位置的矫正（比如必须30分钟的整数倍）
            this.callback = callback;
            //鼠标抬起回调
            this.mouseupCallback = mouseupCallback;
            //是否是创建过程做，即拖拽过程中
            this.isMouseDown = false;
            //当前拖拽的元素
            this.slider = null;
            //当前位置信息，disX
            this.position={
                disX:0,
                index:0,//当前slider
                symbol:'',//每个slider唯一的symbol
                leftWidth:null,//symbol对应的left width
            };
            //事件处理
            this.pEl.addEventListener('mousedown',(ev)=>{
                this.mousedown(ev);
                document.addEventListener('mousemove',this.mousemove);
                document.addEventListener('mouseup',this.mouseup);
            })
        }
        //鼠标按下
        mousedown = (ev)=>{
            this.isMouseDown = true;
            ev.preventDefault();
            //找到slider元素
            let target = ev.target;
            //找不到则不进行下一步操作
            if(!target.classList.contains('ui-timerAxis-slider')){
                this.isMouseDown = false;
                return false;
            }
            //找到了
            this.slider = target;
            //添加当前激活类
            target.classList.add('ui-timerAxis-slider-active');
            //设置zIndex提高层级
            target.style.zIndex = this.pubData.getzIndex()+10;
            //移除兄弟节点的激活类
            [].filter.call(target.parentNode.children,el=>el !== target)
            .forEach(el=>el.classList.remove('ui-timerAxis-slider-active'));

            let headTimeArr = this.pubData.getHeadArr(),
                timeMap = this.pubData.getMap();

            
            //有多个元素的时候找到index的值,由于headTimeArr排好序了，并且值是惟一的，所以找到对应的索引就可以了
            let index = 0//index是相对于 headTimeArr 的
            let leftWidth = timeMap.get(target.dataset.symbol)
            for(let i=0;i<headTimeArr.length;i++){
                if(leftWidth[0] === headTimeArr[i]){
                    index = i;
                    break;
                }
            }

            //计算当前位置值
            this.position = {
                index,
                disX:ev.pageX - target.offsetLeft,
                symbol:target.dataset.symbol,
                leftWidth
            }


        }
        //鼠标移动
        mousemove = (ev)=>{
            if(!this.isMouseDown){
                return false;
            }
            ev.preventDefault();
            //拖动过程
            let left = ev.pageX - this.position.disX;
            //当前元素的width值
            let width = this.position.leftWidth[1]-this.position.leftWidth[0];
            //校验并返回正确的left
            left = this._correctLeft(left,width);
            //保存当前的left，width
            this.position.leftWidth = [left,left+width];
            //执行move改变过程中的回调，这个回调是对移动工程中位置的矫正（比如必须30分钟的整数倍）
            let callback = this.callback?.(this.position.leftWidth);
            this.position.leftWidth = callback ? callback : this.position.leftWidth;
            //将两端的时间显示出来
            showLRTime(this.slider,this.position.leftWidth,this.pubData);
            //设置left
            this.slider.style.left = this.position.leftWidth[0] + 'px';
        }
        //鼠标抬起
        mouseup = (ev)=>{
            if(!this.isMouseDown){
                return false;
            }
            ev.preventDefault();
            this.isMouseDown = false;
            this.slider = null;
            //移除事件处理函数
            document.removeEventListener('mousemove',this.mousemove);
            document.removeEventListener('mouseup',this.mouseup);

            //将数据更新到timeArr中
            let headTimeArr = this.pubData.getHeadArr(),
                endTimeArr = this.pubData.getEndArr(),
                timeMap = this.pubData.getMap();
            let {index,leftWidth,symbol} = this.position;
            //只是点击了并没有拖动,没有进入mousemove方法，index不是准确的值
            if(timeMap.get(symbol)[0] === leftWidth[0]){
                return false;
            }
            //更新数据pubData
            headTimeArr.splice(index,1,leftWidth[0]);
            endTimeArr.splice(index,1,leftWidth[1]);
            this.pubData.setHeadArr(headTimeArr);
            this.pubData.setEndArr(endTimeArr);
            this.pubData.setMap(symbol,leftWidth);
            this.pubData.setzIndex();

            //鼠标抬起回调
            this.mouseupCallback?.(leftWidth);
            //console.log(this.pubData);
        }
        //返回正确的left 值
        _correctLeft = (left,width)=>{
            let min = this.pubData.getMin(),
                max = this.pubData.getMax(),
                headTimeArr = this.pubData.getHeadArr(),
                endTimeArr = this.pubData.getEndArr();
            //left + width 的值
            let rectRight = left + width;
            //index是相对于 headTimeArr 的
            let {index} = this.position;
            //向左移动,左边有元素
            if(left<=endTimeArr[index-1]){
                return endTimeArr[index-1];
            }

            //向右移动，右边有元素
            if(rectRight>=headTimeArr[index+1]){
                return headTimeArr[index+1]-width;
            }

            if(left<=min){
                return min;
            }
            if(rectRight>=max){
                return max-width;
            }

            return left;

        }
    }

    //拉伸类
    class StretchSlider{
        constructor(parentNode,pubData,callback,mouseupCallback){
            //父元素
            this.pEl = parentNode;
            //当前拉伸的slider
            this.slider = null;
            //公共数据
            this.pubData = pubData;
            //执行move改变过程中的回调，这个回调是对移动工程中位置的矫正（比如必须30分钟的整数倍）
            this.callback = callback;
            //鼠标抬起的回调
            this.mouseupCallback = mouseupCallback;
            //是否是拖动状态
            this.isOnStretch = false;
            //记录当前位置信息
            this.position = {};
            //监听事件
            this.pEl.addEventListener('mousedown',(ev)=>{
                ev.stopPropagation();
                this.mousedown(ev);
                document.addEventListener('mousemove',this.mousemove);
                document.addEventListener('mouseup',this.mouseup);
            });
        }
        //鼠标按下
        mousedown = (ev)=>{
            ev.stopPropagation();
            this.isOnStretch = true;
            ev.preventDefault();
            let target = ev.target;
           
            //没有目标节点
            if(!target.classList.contains('ui-timerAxis-e-resize') && 
                !target.classList.contains('ui-timerAxis-w-resize')){
                this.isOnStretch = false;
                return false;
            }
            this.slider = target.parentNode;
            //添加当前激活类和设置zIndex
            this.slider.classList.add('ui-timerAxis-slider-active');
            this.slider.zIndex = this.pubData.getzIndex() + 10;
            //移除兄弟节点的激活类
            [].filter.call(this.slider.parentNode.children,el=>el !== this.slider)
            .forEach(el=>el.classList.remove('ui-timerAxis-slider-active'));
            //找到index,相对于 headArr 的index
            let index = 0;
            let headTimeArr = this.pubData.getHeadArr();
            let timeMap = this.pubData.getMap(target.parentNode.dataset.symbol);
            for(let i=0;i<headTimeArr.length;i++){
                if(timeMap[0] === headTimeArr[i]){
                    index = i;
                    break;
                }
            }
            //记录鼠标移动的是哪一边的拉伸
            let direction = 'left';
            if(target.classList.contains('ui-timerAxis-e-resize')){
                direction = 'right';
            }else{
                direction = 'left';
            }
            //记录当前位置信息
            this.position = {
                startX: ev.pageX,
                symbol: target.parentNode.dataset.symbol,
                index:index,
                direction,
                leftWidth:timeMap//当前slider 对应的left 和 left+width的值
            }
        }
        //鼠标移动
        mousemove = (ev)=>{
            if(!this.isOnStretch){
                return false;
            }
            ev.preventDefault();
            let {startX,index,direction,leftWidth} = this.position;
            
            let headTimeArr = this.pubData.getHeadArr(),
                endTimeArr = this.pubData.getEndArr();
            let disX = ev.pageX - startX;
            let width = endTimeArr[index] - headTimeArr[index];

            
            //拉伸的左边
            if(direction === 'left'){
                width -= disX;
                //拉伸过程中width 不能小于20
                if(width <= 20){
                    width = 20;
                }
                //向左拉伸不能大于左边元素的右边界
                if(leftWidth[1]-width<=endTimeArr[index-1]){
                    width = leftWidth[1] - endTimeArr[index-1];
                }
                //不能超出左边界
                if(leftWidth[1]-width<=this.pubData.getMin()){
                    width = leftWidth[1] - this.pubData.getMin();
                }
                //记录位置
                this.position.leftWidth = [leftWidth[1]-width,leftWidth[1]];
                
            }
            //拉伸的右边
            if(direction === 'right'){
                width += disX;
                //拉伸过程中width 不能小于20
                if(width <= 20){
                    width = 20;
                }
                //向右不能大于右边元素的左边界，或者盒子右边界
                if(leftWidth[0]+width>=headTimeArr[index+1]){
                    width = headTimeArr[index+1] - leftWidth[0];
                }
                //超出右边界
                if(leftWidth[0]+width>=this.pubData.getMax()){
                    width = this.pubData.getMax() - leftWidth[0];
                }
                //记录下该slider的位置
                this.position.leftWidth = [leftWidth[0],leftWidth[0]+width];
                
            }
            
            //执行move改变过程中的回调，这个回调是对移动工程中位置的矫正（比如必须30分钟的整数倍）
            let callback = this.callback?.(this.position.leftWidth);
            this.position.leftWidth = callback ? callback : this.position.leftWidth;
            //将两端的时间显示出来
            showLRTime(this.slider,this.position.leftWidth,this.pubData);
            if(direction === 'left'){
                //修改位置
                this.slider.style.left = 'auto';
                this.slider.style.right = this.pubData.getMax() - leftWidth[1] + 'px';
                this.slider.style.width = this.position.leftWidth[1] - this.position.leftWidth[0] + 'px';
            }
            if(direction === 'right'){
                //修改其位置
                this.slider.style.left = leftWidth[0] + 'px';
                this.slider.style.width = this.position.leftWidth[1] - this.position.leftWidth[0] + 'px';
            }
        }
        //鼠标抬起
        mouseup = (ev)=>{
            if(!this.isOnStretch){
                return false;
            }
            ev.preventDefault();
            this.isOnStretch = false;
            document.removeEventListener('mousemove',this.mousemove);
            document.removeEventListener('mouseup',this.mouseup);

            let {index,symbol,leftWidth} = this.position;
            let headTimeArr = this.pubData.getHeadArr(),
                endTimeArr = this.pubData.getEndArr();
            headTimeArr.splice(index,1,leftWidth[0]);
            endTimeArr.splice(index,1,leftWidth[1]);
            this.pubData.setHeadArr(headTimeArr);
            this.pubData.setEndArr(endTimeArr);
            this.pubData.setMap(symbol,leftWidth);
            this.pubData.setzIndex();

            //鼠标抬起的回调
            this.mouseupCallback?.(leftWidth);
        }
        
    }
    
    //生成刻度
    const createTimerScaleLine = function(parentNode,scale=30,hourScale=120){
        let num = 24*60/scale;
        let width = parentNode.offsetWidth;
        let gap = width/num;
        let res = '';
        for(let i=0;i<num;i++){
            if(scale*i%hourScale===0){
                res += `<i style="left:${gap*i}px" class="ui-timerAxis-scale-hours"></i>`;
                
            }else if(i===num-1){
                res += `<i style="left:${gap*i}px" class="ui-timerAxis-scale-minutes"></i>`;

                //最后一个24:00,由于width有1px 所以如果要和右端对齐则需要 -1 
                res += `<i style="left:${gap*(i+1)-1}px" class="ui-timerAxis-scale-hours"></i>`;
            }else{
                res += `<i style="left:${gap*i}px" class="ui-timerAxis-scale-minutes"></i>`;
            }
            
        }
        parentNode.innerHTML = res;
    }
    
    //生成刻度对应的时间数字码
    const createTimerScaleNum = function(parentNode){
        let res = '';
        let width = parentNode.offsetWidth;
        let gap = width/24;
        for(let i=0;i<=24;i++){
            if(i%2!==0) continue;
            switch(i){
                case 24:res += `<i style="right:0" class="ui-timerAxis-scale-num-item">${String(i).padStart(2,'0')}</i>`;
                break;
                default:res += `<i style="left:${gap*i+1}px" class="ui-timerAxis-scale-num-item">${String(i).padStart(2,'0')}</i>`;
            }
            
        }
        parentNode.innerHTML = res;
    }
 
    //单例
    function getSingle(fn){
        let result = null;
        return function(){
            return result || (result = fn.apply(this,arguments));
        }
    }

    //生成timerAxisControl
    function createAxisControl(timeArr){
        let temp = `
            <div class="ui-timerAxis-control-box">
                <div class="ui-timerAxis-control-timeSet">
                    <input class="ui-timerAxis-control-inputL" value="${timeArr[0].split(':').join(' : ')}" />
                    <span>-</span>
                    <input class="ui-timerAxis-control-inputR" value="${timeArr[1].split(':').join(' : ')}" />
                </div>
                <div class="ui-timerAxis-control-operate">
                    <button class="ui-timerAxis-control-delete">删除</button>
                    <button class="ui-timerAxis-control-comfirm">确定</button>
                </div>
                <span class="ui-timerAxis-control-close">x</span>
            </div>
        `;
        let div = document.createElement('div');
        div.innerHTML = temp;
        document.body.appendChild(div.firstElementChild);
        
        return true;
    }

    //关于事件控件controler 的事件处理,timerAxisObj是timerAxis对象
    function controlEvent(timerAxisObj){
        //阻止时间冒泡到track 或document上
        let controlBox = document.querySelector('.ui-timerAxis-control-box');
        //关闭按钮
        let btnClose = document.querySelector('.ui-timerAxis-control-close');
        //删除按钮
        let btndel = document.querySelector('.ui-timerAxis-control-delete');
        //确认按钮
        let btnComf = document.querySelector('.ui-timerAxis-control-comfirm');
        
        //阻止冒泡
        controlBox.addEventListener('click',ev=>{
            ev.stopPropagation();
        });
        //关闭弹出层
        btnClose.onclick = function(){
            controlBox.style.display = 'none';
        }
        //点击删除按钮
        btndel.onclick = function(){
            let target = timerAxisObj.track.querySelector('.ui-timerAxis-slider-active');
            target && timerAxisObj.deleteTime(target);
            controlBox.style.display = 'none';
        }
        //点击确定按钮
        btnComf.onclick = function(){
            let timeArr = [
                controlBox.querySelector('.ui-timerAxis-control-inputL').value,
                controlBox.querySelector('.ui-timerAxis-control-inputR').value,
            ];
            //当有一个时间为空则不做任何处理
            if(!timeArr[0] || !timeArr[1]){
                return false;
            }

            //时间是否设置成功返回
            if(timerAxisObj.setTime(timeArr).status){
                //设置成功就关闭时间控件
                controlBox.style.display = 'none';
            }
            
        }

        //如果ladate存在则使用ladate
        try{
            if(laydate){
                //时间轴控制组件中的时间选择左边
                laydate.render({
                    elem: '.ui-timerAxis-control-inputL',
                    type: 'time',
                    format: 'HH : mm',
                    btns: ['clear','confirm']
                });
                //时间轴控制组件中的时间选择右边
                laydate.render({
                    elem: '.ui-timerAxis-control-inputR',
                    type: 'time',
                    format: 'HH : mm',
                    btns: ['clear','confirm'],
                });
            }
        }catch(e){
            console.warn(e.message);
        }
    }

    //创建生成时间控件的单例
    let singleControl = getSingle(createAxisControl);

    //两端显示时间标识
    const showLRTime = function(slider,pxArr,pubData){
        let showLTime = slider.querySelector('.ui-timerAxis-slider-showL-time');
        let showRTime = slider.querySelector('.ui-timerAxis-slider-showR-time');
        let max = pubData.getMax();
        let LTime = pxToTime(pxArr[0],max);
        let RTime = pxToTime(pxArr[1],max);;
        showLTime.textContent = LTime;
        showRTime.textContent = RTime;
    }

    //将时间格式 12:30转为对应的px
    function timeToPx(time,boxWidth){
        let timeArr = time.split(':');
        time = +timeArr[0]*60 + +timeArr[1];
        return time/(24*60/boxWidth);
    }

    //把对应的px转为时间 12:08 格式
    function pxToTime(px,boxWidth){
        let total = Math.round(24/boxWidth*px*100)/100 + '';
        let hour = total.split('.')[0];
        let minutes = Math.round(('0.' + total.split('.')[1])*60);
        minutes = minutes ? minutes+'' : '0';
        return hour.padStart(2,'0') + ':' + minutes.padStart(2,'0');
    }

    //显示时间设置的controler
    function showtimeControl(slider,pxArr,timeArr,timerAxisObj){
        //创建单例
        singleControl(timeArr);
        //关于timerControl的事件，删除和设置时间
        controlEvent(timerAxisObj);
        //给控件定位
        let timerAxisEl = slider.parentNode;
        let controlBox = document.querySelector('.ui-timerAxis-control-box');
            controlBox &&  (controlBox.style.display = 'block');
        let timerAxisElPosition = timerAxisEl.getBoundingClientRect();
        controlBox.style.left = timerAxisElPosition.left + pxArr[0] + (pxArr[1]-pxArr[0])/2 - 88 + 'px';
        controlBox.style.top = timerAxisElPosition.top - 110 - 20 + 'px';
        controlBox.querySelector('.ui-timerAxis-control-inputL').value = timeArr[0].split(':').join(' : ');
        controlBox.querySelector('.ui-timerAxis-control-inputR').value = timeArr[1].split(':').join(' : ');
    }

    //timerAxis类
    class TimerAxis{
        constructor({box,timeCallback:callback,mouseupCallback,setTimeCallback}){
            //生成时间轴的结构
            this.track = this.createAxisStruct(box);
            let track = this.track;

            //这是mousemoving过程中对时间进行处理在callback上再封装一层
            callback = callback ? this._callback(box.offsetWidth-2,callback) : undefined;
            //鼠标抬起的回调
            mouseupCallback = mouseupCallback ? this._mouseupCallback(box.offsetWidth-2,mouseupCallback) : undefined;
            //设置时间的回调
            this.setTimeCallback = setTimeCallback;

            //记录公共数据
            this.pubData = new TimeArrData();
            //创建 创建slider的对象
            new CreateSlider(track,this.pubData,callback,mouseupCallback);
            //创建拖拽对象
            new DragSlider(track,this.pubData,callback,mouseupCallback);
            //创建拉伸对象
            new StretchSlider(track,this.pubData,callback,mouseupCallback);

            //点击track外面取消掉slider 的active 状态
            track.addEventListener('click',(ev)=>ev.stopPropagation());
            document.addEventListener('click',function(ev){
                [...track.children].forEach(el=>el.classList.remove('ui-timerAxis-slider-active'));
                let controlBox = document.querySelector('.ui-timerAxis-control-box');
                controlBox &&  (controlBox.style.display = 'none');
            });

            //双击slider 显示时间控件
            track.addEventListener('dblclick',ev=>{
                let target = ev.target;
                if(!target.classList.contains('ui-timerAxis-slider')){
                    return false;
                }
                let symbol = target.dataset.symbol;
                let pxArr = this.pubData.getMap(symbol);
                let max = this.pubData.getMax();
                let timeArr = [pxToTime(pxArr[0],max),pxToTime(pxArr[1],max)];
                //显示时间控件
                showtimeControl(target,pxArr,timeArr,this);
            });
        }

        //生成时间轴的结构
        createAxisStruct = (box)=>{
            //每个条目
            let item = document.createElement('div');
            item.className = 'ui-timerAxis-item';
            item.style.width = box.offsetWidth  + 'px';
            //刻度尺
            let scale = document.createElement('div');
            scale.className = 'ui-timerAxis-scale';
            scale.style.width = box.offsetWidth + 'px';
            //时间轴轨道
            let track = document.createElement('div');
            track.className = 'ui-timerAxis-track';
            //刻度尺线条
            let scaleLine = document.createElement('div');
            scaleLine.className = 'ui-timerAxis-scale-line';
            //刻度尺数值
            let scaleNum = document.createElement('div');
            scaleNum.className = 'ui-timerAxis-scale-num';
            //轨道中加入刻度尺线条和数值
            scale.appendChild(scaleLine);
            scale.appendChild(scaleNum);
            //将轨道和刻度尺放入条目中
            item.appendChild(scale);
            item.appendChild(track);
            //将生成的item机构放入目标盒子中
            box.appendChild(item);

            //创建时间刻度和时间数字刻度
            createTimerScaleLine(scaleLine);
            createTimerScaleNum(scaleNum);

            //返回track
            return track;
        }

        //获取所有slider的map px，没有顺序
        getSliderMap = () =>{
            return this.pubData.getMap();
        }

        //获取所有slider对应的arr px,从小到大的排序
        getSliderArr = () =>{
            let endArr = this.pubData.getEndArr();
            return this.pubData.getHeadArr().map((item,index)=>{
                return [item,endArr[index]];
            })
        }

        //获取所有slider对应的arr,并且是转换成时间 08:09 格式,从小到大的排序
        getSliderArrTime = () =>{
            let endArr = this.pubData.getEndArr();
            return this.pubData.getHeadArr().map((item,index)=>{
                return [pxToTime(item,this.pubData.getMax()),pxToTime(endArr[index],this.pubData.getMax())];
            })
        }

        //这是mousemoving过程中对时间进行处理在callback上再封装一层
        _callback = (boxWidth,callback)=>{
            return function(pxArr){
                let pxToMinutesArr = [(24*60/boxWidth)*pxArr[0],(24*60/boxWidth)*pxArr[1]];
                let minutesArr = callback(pxToMinutesArr);
                let minutesToPxArr = Array.isArray(minutesArr) ? [minutesArr[0]/(24*60/boxWidth),minutesArr[1]/(24*60/boxWidth)] : undefined;
                //console.log(minutesToPxArr,'mmmm');
                return minutesToPxArr;
            }
        }

        //鼠标抬起的时候做的操作，返回给callback 时间数组
        _mouseupCallback = (boxWidth,mouseupCallback)=>{
            let _this = this;
            return function(arr){
                //console.log(boxWidth,'boxW');
                let timeArr = [pxToTime(arr[0],boxWidth),pxToTime(arr[1],boxWidth)];
                //showtimeControl(arr,timeArr,_this.trackBox);
                mouseupCallback(timeArr);
            }
        }

        //根据给定的时间生成对应的时间轴，如果成功（在范围内）返回true,否则返回false
        setTime = (timeArr)=>{
            let {pubData} = this;
            let max = pubData.getMax();
            let pxArr = [timeToPx(timeArr[0],max),timeToPx(timeArr[1],max)];
            //先删除之前的active slider之后再创建一个slider
            let activeSlider = this.track.querySelector('.ui-timerAxis-slider-active');
            //如果时间不正确返回false
            let res = isCorrectSlider(pubData,pxArr,activeSlider);
            if(!res.status){
                //设置时间失败的回调
                this.setTimeCallback && this.setTimeCallback(res);

                //设置失败返回false
                return res;
            }
            //先删除之前的active slider之后再创建一个slider
            activeSlider && this.deleteTime(activeSlider);
            
            //创建slider以及记录数据
            createSlider(this.track,pxArr,pubData);

            //设置时间成功的回调
            this.setTimeCallback && this.setTimeCallback(res);

            //设置成功返回true
            return res;

            //创建slider以及记录数据
            function createSlider(box,pxArr,pubData){
                let slider = document.createElement('div');
                slider.className = 'ui-timerAxis-slider ui-timerAxis-slider-active';
                //slider里面的结构，用于显示时间和拉伸作用
                let innerHTML = `
                    <i class="ui-timerAxis-e-resize"></i>
                    <i class="ui-timerAxis-w-resize"></i>
                    <i class="ui-timerAxis-slider-showL-time">00:00</i>
                    <i class="ui-timerAxis-slider-showR-time">00:00</i>
                `;
                slider.innerHTML = innerHTML;

                slider.style.left = pxArr[0] + 'px';
                slider.style.width = pxArr[1] - pxArr[0] + 'px';
                slider.style.zIndex = pubData.getzIndex() + 10;
                //移除已有元素的 激活类
                [...box.children].forEach(el=>el.classList.remove('ui-timerAxis-slider-active'));
                //插入元素
                box.appendChild(slider);

                showLRTime(slider,pxArr,pubData);

                //给每个 slider 一个symbol值
                let symbol = Date.now() + '';
                slider.dataset.symbol = symbol;
                let headTimeArr = pubData.getHeadArr(),
                    endTimeArr = pubData.getEndArr();
                //记录数据
                pubData.setHeadArr([...headTimeArr,pxArr[0]].sort((a,b)=>a-b));
                pubData.setEndArr([...endTimeArr,pxArr[1]].sort((a,b)=>a-b));
                pubData.setMap(symbol,[...pxArr]);
                pubData.setzIndex();
            }

            //判断这个时间是否合法
            function isCorrectSlider(pubData,pxArr,activeSlider){
                let max = pubData.getMax();
                let min = pubData.getMin();
                if(pxArr[0] < min || pxArr[1] > max || pxArr[0] >= pxArr[1] || pxArr[1]-pxArr[0]<=20){
                    console.log('111111111',pxArr,headTimeArr,endTimeArr);
                    return {status:false,msg:'非法时间段'};
                }
                let headTimeArr = pubData.getHeadArr();
                let endTimeArr = pubData.getEndArr();
                //active slider 存在时，需要先将包含这个slider的时间pxArr从判断数组中去除
                if(activeSlider){
                    let index = 0;
                    let symbol = activeSlider.dataset.symbol;
                    let sliderPxArr = pubData.getMap(symbol);
                    //设置的值和之前的值没变化则不继续进行
                    if(pxArr[0]===sliderPxArr[0] && pxArr[1]===sliderPxArr[1]){
                        console.log('2222222222',pxArr,headTimeArr,endTimeArr);
                        return {status:false,msg:'该时间已存在，请勿重复创建！'};
                    }
                    //找到对应的位置
                    for(let i=0;i<headTimeArr.length;i++){
                        if(sliderPxArr[0] === headTimeArr[i]){
                            index = i;
                            break;
                        }
                        
                    }
                    headTimeArr.splice(index,1);
                    endTimeArr.splice(index,1);
                }
                //没有的时候，可以随意创建
                if(headTimeArr.length === 0){
                    console.log('3333333333',pxArr,headTimeArr,endTimeArr);
                    return {status:true,msg:'创建成功'};
                }
                //在所有元素前面
                if(pxArr[1]<=headTimeArr[0] && pxArr[0]>=min){
                    console.log('444444444444',pxArr,headTimeArr,endTimeArr);
                    return {status:true,msg:'创建成功'};
                }
                //在所有元素后面
                if(pxArr[0]>=endTimeArr[endTimeArr.length-1] && pxArr[1]<=max){
                    console.log('55555555555',pxArr,headTimeArr,endTimeArr);
                    return {status:true,msg:'创建成功'};
                }

                //如果在中间则需要两个都在间隙中
                for(let i=0;i<headTimeArr.length;i++){
                    if(pxArr[0]>=endTimeArr[i] && pxArr[1]<=headTimeArr[i+1]){
                        console.log('66666666666',pxArr,headTimeArr,endTimeArr,i);
                        return {status:true,msg:'创建成功'};
                    }
                }
                console.log('77777777777',pxArr,headTimeArr,endTimeArr);
                return {status:false,msg:'非法时间段'};
            }

        }

        //删除某一个时间值，从pubData里面删除，并且删除对应的slider,传入要删除的slider
        deleteTime = (slider)=>{
            let symbol = slider.dataset.symbol;
            let pubData = this.pubData;
            let pxArr = pubData.getMap(symbol);
            let headArr = pubData.getHeadArr();
            let endArr = pubData.getEndArr();
            let index = 0;
            //找到要删除的位置
            for(let i=0;i<headArr.length;i++){
                if(pxArr[0]===headArr[i]){
                    index = i;
                    break;
                }
            }
            //删除headArr中的对应数据
            headArr.splice(index,1);
            //删除endArr中的对应数据
            endArr.splice(index,1)
            //存入记录数据
            pubData.setHeadArr(headArr);
            //存入记录数据
            pubData.setEndArr(endArr);
            //删除map中的数据
            pubData.deleteMap(symbol);

            //删除对应的slider
            slider.remove();
        }
    }

    //timerAxis对象,用于对外提供调用方法
    var timerAxis = {};
    timerAxis.createAxis = function({box,timeCallback:callback,mouseupCallback,setTimeCallback}){
        return new TimerAxis({box,timeCallback:callback,mouseupCallback,setTimeCallback});
    }

    //将对象暴露到全局作用于下面
    window.timerAxis = timerAxis;
})()