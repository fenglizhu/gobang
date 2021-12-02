<template>
  <div class="game-title"><h2>噢！是五子棋</h2></div>
  <div class="main">
    <div v-show="!toggle" class="dom">
      <div class="main-container"></div>
    </div>
    <canvas v-show="toggle" ref="canvas" id="canvas" class="canvas-container" width="480" height="480"></canvas>
  </div>
  <div class="button-group">
    <button class="hq" @click="regret()">悔棋</button>
    <button class="cxhq" @click="undo()">撤销悔棋</button>
    <button class="cxks" @click="restart()">重新开始</button>
    <button class="chhb" @click="toggleHandle()">{{ toggle === true ? '使用DOM' : '使用画布' }}</button>
  </div>
  <div class="dialog" v-if="tipsDialog">
    <div class="dialog-content">
      <div class="text">{{tips}}</div>
      <div class="dialog-footer">
        <button @click="tipsDialog = false">确定</button>
      </div>
    </div>
  </div>
</template>
<script lang="ts">

import { defineComponent, onMounted, reactive, Ref, ref  } from 'vue';

interface Chess {
  black: number;
  white: number;
}

export default defineComponent({
  name: 'App',
  setup() {
    let step = ref(0);
    let colorArr: string[] = ['black','white'];
    let scoreArr: any[] = [];
    let history: any[] = [];
    let historySave: any[] = [];
    let domRecord: any[] = []
    let modes: any[] = [
      [1, 0],   // 水平方向
      [0, 1],   // 垂直方向
      [1, 1],   // 左斜方向
      [-1, 1]   // 右斜方向
    ];
    let finish: Ref = ref(false);
    let toggle: Ref = ref(true);
    let tips: Ref = ref('');
    let tipsDialog: Ref = ref(false);

    // 黑白悔棋合集
    let chessMap: any = reactive<Chess>({
      black: 0,
      white: 0,
    });

    // 创建一个DOM引用，名称必须与元素的ref属性名相同，并且 return 出去
    const canvas = ref<any>(null);

    onMounted(()=>{
      
      // 初始化画布
      initDrawCanvas();

     
      canvas.value.addEventListener('click', (e: MouseEvent)=>{
        if(finish.value) {
          tips.value = '游戏结束，请重新开始！';
          tipsDialog.value = true;
          return
        }
        
        if (e.offsetX < 15 || e.offsetX > 495 || e.offsetY < 15 || e.offsetY > 495) {
          return
        }
        let centerX = Math.floor((e.offsetX + 15)  / 30) * 30;
        let centerY = Math.floor((e.offsetY + 15)  / 30) * 30;
        let x = centerX/30 -1;
        let y = centerY/30 -1;
        if (!scoreArr[x][y]) {
          let color = colorArr[step.value % 2];

          // 画棋子，是个圆，需要确定中心点
          drawPiece(centerX, centerY, color);

          scoreArr[x][y] = color;
          // 当悔棋之后不撤销悔棋，那么historySave会一直叠加
          historySave = [...history];
          history.push({
            x,
            y,
            color
          })
          historySave.push({
            x,
            y,
            color
          })
          // 判断胜负
          for (let i = 0; i < modes.length; i++) {
            checkWiner(x , y, color, modes[i]);
          }
          step.value ++ ;

        } else {
          tips.value = '请落在没有棋子的位置';
          tipsDialog.value = true;
        }
      })
    })

    

    /**
     * 初始化画布
     */
    let initDrawDom = () =>{

      // 初始化落子数组
      initChess()
      
      let main = ref<any>(document.getElementsByClassName('main-container')[0]);

      let boxLine = document.createElement('div');
      boxLine.setAttribute('id','box-line');
      boxLine.setAttribute('class','line-content');
      main.value?.appendChild(boxLine)

      let spaceLine = document.createElement('div');
      spaceLine.setAttribute('id','box-space');
      spaceLine.setAttribute('class','space-content');
      main.value?.appendChild(spaceLine);

      // 画线
      let lineArr: HTMLElement[] = []
      for (let i = 0; i < 14*14; i++) {
        lineArr[i] = document.createElement('div');
        lineArr[i].setAttribute('class','line');
        boxLine.appendChild(lineArr[i]);
      }

      // 画框
      let spaceArr: any[] = domRecord
      for (let i = 0; i < 15; i++) {
        spaceArr[i] = []
        for (let j = 0; j < 15; j++) {
          spaceArr[i][j] = document.createElement('div');
          spaceArr[i][j].setAttribute('class','space');
          spaceLine.appendChild(spaceArr[i][j]);
        }
      }
      
      // 填充颜色点击事件
      drawColor(spaceArr)
    }
    let initDrawCanvas = () => {

      initPaint();

      // 初始化落子数组
      initChess()

      let context = canvas.value.getContext('2d');
      // 绘制棋盘
      for (let i = 0; i < 14; i++) {
        context.beginPath();
        context.strokeStyle = '#ccc';
        context.lineWidth = 1;
        context.fillRect(30, 30 * (i + 1), 30, 30);
        context.strokeRect(30, 30 * (i + 1), 30, 30);
        context.closePath();
        for (let j = 0; j < 14; j++) {
          context.beginPath();
          context.strokeStyle = '#ccc';
          context.lineWidth = 1;
          context.fillRect(30*i + 30, 30*j + 30, 30, 30);
          context.strokeRect(30*i + 30, 30*j + 30, 30, 30);
          context.closePath();
          
        }
      }

    }

    /**
     * 绘制canvas
     */
    let initPaint = () => {

      let context = canvas.value.getContext('2d');
      
      // 先清空在绘制，一面重新开始的时候重复绘制,
      //  两种方式清空画布
      canvas.value.width = 482;
      canvas.value.height = 482;

      // 方式二  这种方式清不了边缘，跟画布的大小有关，因为绘制的时候减掉了60px
      context.clearRect(30, 30, 482, 482);

      context.beginPath();
      context.fillStyle = 'rgba(18, 255, 255, 0)';
      context.fillRect(30, 30, canvas.value.width - 60, canvas.value.height - 60);
      context.closePath();
    }
    
    
    /**
     * dom 绘制棋子颜色
     */
    let drawColor = (spaceArr: any[] ) =>{
      for (let x = 0; x < 15; x++) {
        for (let y = 0; y < 15; y++) {
          spaceArr[x][y].onclick = () =>{
            if(finish.value) {
              tips.value = '游戏结束，请重新开始！';
              tipsDialog.value = true;
              return
            }
            // 记录所有的落子情况
            if (!spaceArr[x][y].style.background) {
              let color = colorArr[step.value % 2];
              spaceArr[x][y].style.background = color;
              scoreArr[x][y] = color;
              historySave = [...history];
              history.push({
                x,
                y,
                color
              })
              historySave.push({
                x,
                y,
                color
              })

              // 判断胜负
              for (let i = 0; i < modes.length; i++) {
                checkWiner(x , y, color, modes[i]);
              }

              // 步骤加1
              step.value ++;

            }else {
              tips.value = '请落在没有棋子的位置';
              tipsDialog.value = true;
            }

          }
        }
      }
    }

    /**
     * canvas 绘制棋子颜色
     */
    let drawPiece = (x:number, y:number, color: string) => {
      let context = canvas.value.getContext('2d');
      context.beginPath();
      context.arc(x,y,15,0,2*Math.PI);
      context.closePath();
      // 填充颜色
      context.fillStyle = color;
      context.fill()
    }

    /**
     * 初始化棋子颜色
     */
    let initChess = () =>{
      for (let i = 0; i < 15; i++) {
        scoreArr[i] = [];
        for (let j = 0; j < 15; j++) {
          scoreArr[i][j] = 0;
        }
      }
    }

    /**
     * canvas悔棋和撤销悔棋共同步骤
     */
    let canvasRegretUndo = () => {
      // 重新记录
      initChess();

      // 重画画布
      initPaint();

      // 绘制网格
      initDrawCanvas();

      for (let i = 0; i < history.length; i++) {
        let item = history[i]
        drawPiece((item.x+1) * 30, (item.y + 1) * 30, item.color);
        scoreArr[item.x][item.y] = item.color;
      }
    }

    /**
     * dom悔棋和撤销悔棋共同步骤
     */
    let domRegretUndo = () =>{
      // 重新记录
      initChess();

      // 清掉样式
      domRecord.forEach(son => {
        son.forEach((gson:any) => {
          gson.style.background = '';
        });
      });

      // 重新绘制样式 和 给记录赋值
      history.forEach(ele => {
        domRecord[ele.x][ele.y].style.background = ele.color;
        scoreArr[ele.x][ele.y] = ele.color;
      });
    }


    /**
     * 悔棋
     */
    let regret = () =>{
      
      // 判断有落子记录才可以悔棋
      if (history.length ) {
        // 判断是否能再次悔棋
        let lastChess = history[history.length - 1];
        if(chessMap[lastChess.color] > 2) {
          tips.value = '黑白棋各自最多只能悔棋三步';
          tipsDialog.value = true;
          return
        }

        // 记录悔棋次数
        chessMap[lastChess.color] += 1;

        // 删掉最后一个
        history.pop();

        // 画布悔棋
        if (toggle.value == true) {
          canvasRegretUndo();

        // dom悔棋
        } else {
          domRegretUndo();
        }

        // 步骤减1
        step.value --;

      } else {
        tips.value = '不能悔棋';
        tipsDialog.value = true;
      }
    }

    /**
     * 撤销悔棋
     */
    let undo = () =>{
      
      if(historySave.length > history.length) {
        // 把撤销的记录增加回来
        history.push(historySave[step.value]);

        // 画布撤销悔棋
        if (toggle.value == true) {
          canvasRegretUndo();

        // dom撤销悔棋
        } else {
          domRegretUndo();
        }
        // 步骤加1
        step.value ++;

      } else {
        tips.value = '不能撤销悔棋';
        tipsDialog.value = true;
      }
    }

    /**
     * 重新开始
     */
    let restart = ()=>{

      if (toggle.value == true) {
        initDrawCanvas();
      } else  {
        // 重新开始要去掉之前的内容和数据
        let boxLine = ref<HTMLElement | null>(document.getElementById('box-line'));
        let spaceLine = ref<HTMLElement | null>(document.getElementById('box-space'));
        if(boxLine.value) {
          boxLine.value.parentNode?.removeChild(boxLine.value)
        }
        if(spaceLine.value) {
          spaceLine.value.parentNode?.removeChild(spaceLine.value)
        }
        initDrawDom();
      }

      // 重置数据
      finish.value = false;
      step.value = 0;
      history = [];
      historySave = [];
      chessMap.black = 0;
      chessMap.white = 0;
    }
    
    /**
     * 检查输赢
     */
    let checkWiner = (x:number, y:number, color: string, mode:Array<number>) =>{
      let count = 1;
      for (let i = 1; i < 5; i++) {
        if(scoreArr[x + i * mode[0]]) {
          if (scoreArr[x + i * mode[0]][y + i * mode[1]] == color) {
            count++
          } else {
            break
          }
        }
      }

      for (let i = 1; i < 5; i++) {
        if(scoreArr[x - i * mode[0]]) {
          if (scoreArr[x - i * mode[0]][y - i * mode[1]] == color) {
            count++
          } else {
            break
          }
        }
      }
      
      if(count>= 5 ) {
        if (color == 'black') {
          tips.value = '黑棋胜';
        } else {
          tips.value = '白棋胜';
        }
        setTimeout(() => {
          tipsDialog.value = true;
        }, 0);
        
        finish.value = true;
      }
      
    }

    let toggleHandle = () =>{
      toggle.value = !toggle.value;
      restart();
    } 

    return {
      step,
      regret,
      undo,
      restart,
      toggleHandle,
      toggle,
      tips,
      tipsDialog,
      canvas
    }
  }
})
</script>
<style>
  * {
    margin: 0;
    padding: 0;
  }
  .game-title{
    text-align: center;
    padding: 20px 0;
  }
  .main{
    width: 482px;
    margin: 0 auto;
    background: rgba(255, 152, 18, 0.103);
  }
  .main .main-container{
    position: relative;
    width: 420px;
    height: 420px;
    border: 1px solid #ccc;
  }
  .main .canvas-container{
    display: block;
  }
  
  .main .dom{
    padding: 30px;
  }
  .line-content{
    display: flex;
    flex-wrap: wrap;
  }
  .line-content .line{
    width: 30px;
    height: 30px;
    border: 1px solid #ccc;
    box-sizing: border-box;
  }
  .space-content{
    display: flex;
    flex-wrap: wrap;
    position: absolute;
    top: -15px;
    left: -15px;
    width: 450px;
    height: 450px;
  }
  .space-content .space{
    width: 30px;
    height: 30px;
    box-sizing: border-box;
    border-radius: 50%;
  }
  .space-content .space:hover{
    background: rgb(81, 93, 94);
  }

  /* 操作区 */
  .button-group{
    width: 526px;
    padding: 39px 0;
    margin: 0 auto;
    text-align: center;
  }
  .button-group button{
    padding: 10px 20px;
    margin-right: 10px;
    border: none;
    outline: 0;
    cursor: pointer;
    color: white;
  }
  .button-group .hq{
    background: rgb(35, 81, 142);
  }
  .button-group .cxhq{
    background: rgb(35, 142, 119);
  }
  .button-group .cxks{
    background: rgb(81, 35, 142);
  }
  .button-group .chhb{
    background: rgb(78, 142, 35);
  }

  /* 弹框 */
  .dialog{
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
  }
  .dialog .dialog-content{
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    right: 0;
    width: 300px;
    height: 180px;
    margin: auto;
    background: white;
  }
  .dialog .dialog-content button {
    padding: 10px 40px;
    border: none;
    outline: 0;
    cursor: pointer;
    color: white;
    background: rgb(35, 81, 142);
  }
  .dialog .dialog-content .text{
    font-size: 20px;
    font-weight: bold;
    text-align: center;
    height: 120px;
    line-height: 100px;
  }
  .dialog .dialog-footer {
    text-align: center;
  }
</style>