$(document).ready(() => {
  var socket = io()
  const CANVAS_ROWS = 1000
  const CANVAS_COLS = 1000

  var step = 1

  var canvas = $('#place')[0]
  var cartCnt = 0
  var cartList = ''
  var tempPixel = []
  var ctx = canvas.getContext('2d')
  var widthCanvas
  var heightCanvas
  var canvasData = []
  var canvasImg = []

  window.oldPixels = []//public it

  var gridToggle = $('#grid-toggle')
  var gridShow = false

  var dragEnable = false
  var coordsShow = true

  var colorExpanded = false

  var currentColor = '#000000'

  // View parameters
  var xleftView = 0
  var ytopView = 0

  var countDownDate = 0

  function setCanvasColor(x, y, cr) {
    idx = (y * widthCanvas + x) * 4
    canvasImg.data[idx] = (cr & 0xff0000) >> 16
    canvasImg.data[idx + 1] = (cr & 0xff00) >> 8
    canvasImg.data[idx + 2] = cr & 0xff
    canvasImg.data[idx + 3] = 255
  }

  $(window).resize(function () {
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    widthCanvas = canvas.clientWidth
    heightCanvas = canvas.clientHeight

    draw()
  })

  function counter() {
    setInterval(() => {
      var date = new Date().toLocaleString("en-US", {timeZone: "Europe/London"})
     countDownDate = new Date(date)
    //  countDownDate
      var i = 60;
      var h = 23 - countDownDate.getHours();
      if(h<10){
        h = '0'+h;
      }
      var m =  59 - countDownDate.getMinutes();
       if(m<10){
        m = '0'+m;
      }
      var s =   countDownDate.getSeconds();
      s = i-s
      if(s<10){
        s = '0'+s;
      }
      str = h + ':' + m + ':' + s
      i++;
      $('div.time').html(str)
      $('#dividendCountDown').html(str)
    }, 1000)
  }

  function initialize() {
    
   // countDownDate = new Date().getTime()
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    widthCanvas = canvas.clientWidth
    heightCanvas = canvas.clientHeight

    xleftView = Math.round((widthCanvas - CANVAS_COLS) / 2)
    ytopView = Math.round((heightCanvas - CANVAS_ROWS) / 2)

    canvas.addEventListener('mousedown', handleMouseDown, false)
    canvas.addEventListener('mousemove', handleMouseMove, false)
    canvas.addEventListener('mouseup', handleMouseUp, false)
    canvas.addEventListener('mouseout', handleMouseOut, false)
    canvas.addEventListener('click', handleMouseClick, false)

    gridToggle.click(function () {
      gridShow = gridShow ? false : true
      if (gridShow) $(this).addClass('active')
      else $(this).removeClass('active')
      draw()
    })

    socket.on('canvas', data => {
      canvasData = data
      draw()
    })

    socket.on('canvasDot', data => {
      canvasData[data.row - 1][data.col - 1] = data.color
      draw()
    })

    $('#submit').click(() => {
      socket.emit('color', {
        col: parseInt($('#x-coord').val()),
        row: parseInt($('#y-coord').val()),
        color: $('#color').val()
      })
    })

    $('#shopping_cart').click(() => {
      if ($('.cart_list').css('display') == 'none') {
        $('.cart_list').show('slow')
        // $('.cart_list').css("display","block")
      } else if ($('.cart_list').css('display') == 'block') {
        $('.cart_list').hide('slow')
        // $('.cart_list').css("display","none")
      }
    })

    $('#arrow-up').click(() => {
      $('.cart_list').css('display', 'none')
    })

    $('#trash').click(() => {
      oldPixels.forEach((pixel, index) => {
        var x = pixel.x
        var y = pixel.y
        var color = pixel.color
        canvasData[y][x] = color
        socket.emit('color', {
          row: y + 1,
          col: x + 1,
          color: color
        })
      })
      oldPixels = []
      cartCnt = 0
      draw()
      $('.pixel_list').html('')
      $('.count').html(cartCnt)
      $('.pixelCnt').html(cartCnt)
      $('.trxCnt').html(cartCnt)
      cart=[]
    })

    $('#download').click(() => {
      downloadImage()
    })

    $('#zoom-in').click(() => {
      if (step < 80) {
        nCenterDotX = parseInt((widthCanvas / 2 - xleftView) / step + 1)
        nCenterDotY = parseInt((heightCanvas / 2 - ytopView) / step + 1)

        xleftView -= nCenterDotX
        ytopView -= nCenterDotY

        step += 1
      }
      draw()
    })

    $('#zoom-out').click(() => {
      if (step <= 2) {
        step = 1

        xleftView = Math.round((widthCanvas - CANVAS_COLS) / 2)
        ytopView = Math.round((heightCanvas - CANVAS_ROWS) / 2)
      } else if (step > 2) {
        nCenterDotX = parseInt((widthCanvas / 2 - xleftView) / step + 1)
        nCenterDotY = parseInt((heightCanvas / 2 - ytopView) / step + 1)

        xleftView += nCenterDotX
        ytopView += nCenterDotY

        step -= 1
      }
      draw()
    })

    $('#drag').click(() => {
      dragEnable = dragEnable ? false : true
      if (dragEnable) {
        coordsShow = false
        $('#drag').addClass('active')
        $('#place')
          .on('mouseover', function () {
            $(this).css('cursor', 'grab')
          })
          .mouseout(function () {
            $(this).css('cursor', 'auto')
          })
      } else {
        coordsShow = false
        $('#drag').removeClass('active')
        $('#place')
          .on('mouseover', function () {
            $(this).css(
              'cursor',
              'url(data:image/x-icon;base64,AAACAAEAICAQAAAAAADoAgAAFgAAACgAAAAgAAAAQAAAAAEABAAAAAAAAAIAAAAAAAAAAAAAEAAAAAAAAAAAAAAAhYWFAPqv6ADgm4sASkpKAJ/l7QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACIAAAAAAAAAAAAAAAAAAAEiIAAAAAAAAAAAAAAAAAAxEiIAAAAAAAAAAAAAAAADMxEgAAAAAAAAAAAAAAAAMzMxAAAAAAAAAAAAAAAAAzMzMAAAAAAAAAAAAAAAADMzMwAAAAAAAAAAAAAAAAMzMzAAAAAAAAAAAAAAAAAzMzMAAAAAAAAAAAAAAAADMzMwAAAAAAAAAAAAAAAABTMzAAAAAAAAAAAAAAAAAFVTMAAAAAAAAAAAAAAAAABFVQAAAAAAAAAAAAAAAAAARAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///////////////////////////////////////////////////////////////////////////////////////P////h////wP///4H///8D///+B////A////gf///wP///4H///+D////B////w////8///////////////w==), auto'
            )
          })
          .mouseout(function () {
            $(this).css('cursor', 'auto')
          })
      }
    })

    $('#color-picker').click(() => {
      if (colorExpanded) {
        $('.color-items').hide('slow')
        colorExpanded = false
      } else {
        $('.color-items').show('slow')
        colorExpanded = true
      }
    })

    $('.color-item').click(function () {
      var newColor = $(this).css('background-color')
      $('.color-pan').css('background-color', newColor)

      if (dragEnable) $('#drag').click()
      currentColor = newColor
    })

    $('.color-items').hide()
    $('#place')
      .on('mouseover', function () {
        $(this).css(
          'cursor',
          'url(data:image/x-icon;base64,AAACAAEAICAQAAAAAADoAgAAFgAAACgAAAAgAAAAQAAAAAEABAAAAAAAAAIAAAAAAAAAAAAAEAAAAAAAAAAAAAAAhYWFAPqv6ADgm4sASkpKAJ/l7QAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACIAAAAAAAAAAAAAAAAAAAEiIAAAAAAAAAAAAAAAAAAxEiIAAAAAAAAAAAAAAAADMxEgAAAAAAAAAAAAAAAAMzMxAAAAAAAAAAAAAAAAAzMzMAAAAAAAAAAAAAAAADMzMwAAAAAAAAAAAAAAAAMzMzAAAAAAAAAAAAAAAAAzMzMAAAAAAAAAAAAAAAADMzMwAAAAAAAAAAAAAAAABTMzAAAAAAAAAAAAAAAAAFVTMAAAAAAAAAAAAAAAAABFVQAAAAAAAAAAAAAAAAAARAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD///////////////////////////////////////////////////////////////////////////////////////P////h////wP///4H///8D///+B////A////gf///wP///4H///+D////B////w////8///////////////w==), auto'
        )
      })
      .mouseout(function () {
        $(this).css('cursor', 'auto')
      })
  }

  var mouseDown = false
  var mouseDrag = false

  function handleMouseDown(event) {
    mouseDown = true
  }

  function handleMouseUp(event) {
    mouseDown = false
  }

  function handleMouseOut(event) {
    mouseDown = false
    mouseDrag = false
    isMouseIn = false
    $('.coord').css('display', 'none')
  }

  function handleMouseClick(event) {
    $('.cart_list').hide()
    if (dragEnable) return
    var mousePos = getMousePos(canvas, event)
    xPos = Math.floor((mousePos.x - xleftView) / step)
    yPos = Math.floor((mousePos.y - ytopView) / step)
    $('#x-coord').val(xPos + 1)
    $('#y-coord').val(yPos + 1)
    if (mouseDrag) {
      mouseDrag = false
      return
    }

    var row = parseInt((mousePos.x - xleftView) / step)
    var col = parseInt((mousePos.y - ytopView) / step)
    if (row >= 0 && row < CANVAS_ROWS && col >= 0 && col < CANVAS_COLS) {
      if (cartCnt < 10) $('.count').css('width', '10px')
      else $('.count').css('width', '')
      iscount = false
      if (tempPixel.length > 1) {
        for (i = 0; i < tempPixel.length; i++) {
          row1 = tempPixel[i * 2 + 1]
          col1 = tempPixel[i * 2 + 2]
          if (row1 == NaN || col1 == NaN) {
          } else if (row1 == row && col1 == col) {
            iscount = true
          }
        }
      }
    }

    ///////
    var pixelIndex = -1
    oldPixels.forEach((pixel, index) => {
      if (pixel.x == xPos && pixel.y == yPos) pixelIndex = index
    })

    if (pixelIndex < 0) {
 
      var newItem =
        "<tr id='item-" +
        oldPixels.length +
        "'><td>" +
        (xPos + 1) +
        ' , ' +
        (yPos + 1) +
        "</td><td>10</td><td><span class='btn btn-default clr'><i class='fa fa-close close' id='del-item-" +
        oldPixels.length +
        "'></i></span></td></tr>"
      $('.pixel_list').append(newItem)
      $('#del-item-' + oldPixels.length).on('click', function (event) {
        event.preventDefault()
        var id = parseInt(
          $(this)
            .attr('id')
            .substr(9)
        )
       //console.log(oldPixels);
        
        var x = oldPixels[id -1].x
        var y = oldPixels[id -1].y
        var color = oldPixels[id -1].color
        canvasData[y][x] = color
        draw()
        oldPixels.splice(id,1)
        socket.emit(
          'color',
          {
            row: y + 1,
            col: x + 1,
            color: color
          },
          false
        )
        cartCnt--
        $('#item-' + id).remove()

        if (cartCnt < 0) {
          cartCnt = 0
        }
        $('.pixelCnt').html(cartCnt)
        $('.trxCnt').html(cartCnt * 10)
        $('.count').html(cartCnt)

      //   $('.pixel_list').html('')
      //    oldPixels.forEach((pixel, index) => {
      //   var newItem =
      //   "<tr id='item-" +
      //   index +
      //   "'><td>" +
      //   (oldPixels[index].x + 1) +
      //   ' , ' +
      //   (oldPixels[index].y + 1) +
      //   "</td><td>10</td><td><span class='btn btn-default clr'><i class='fa fa-close close' id='del-item-" +
      //   index +
      //   "'></i></span></td></tr>"
        
      //   $('.pixel_list').append(newItem)
      // })

      })
      cartCnt++
      $('.count').html(cartCnt)
      $('.trxCnt').html(cartCnt * 10)
      $('.pixelCnt').html(cartCnt)
    }
    ///////
    canvasData[yPos][xPos] = currentColor
    draw()
    oldPixels.push({ x: parseInt($('#x-coord').val()), y: parseInt($('#y-coord').val()), color: currentColor})
    socket.emit('color', {
      col: parseInt($('#x-coord').val()),
      row: parseInt($('#y-coord').val()),
      color: currentColor
    })
  }
  function deleteItem(event) {
   
    event.preventDefault()
    var id = parseInt(
      $(this)
        .attr('id')
        .substr(9)
    )
    var x = oldPixels[id - 1].x
    var y = oldPixels[id - 1].y
    var color = oldPixels[id - 1].color
    canvasData[y][x] = color
    draw()
    socket.emit('color', {
      row: y + 1,
      col: x + 1,
      color: color
    })
    cartCnt--
    $('#item-' + id).remove()

    if (cartCnt < 0) {
      cartCnt = 0
    }
    $('.pixelCnt').html(cartCnt)
    $('.trxCnt').html(cartCnt * 10)
    $('.count').html(cartCnt)
  }

  var isMouseIn = false
  var lastX = 0
  var lastY = 0
  var curX = 0
  var curY = 0

  function handleMouseMove(event) {
    isMouseIn = true
    var X = event.clientX - this.offsetLeft - this.clientLeft + this.scrollLeft
    var Y = event.clientY - this.offsetTop - this.clientTop + this.scrollTop

    oldX = X
    oldY = Y
    if (X == oldX && Y == oldY && isMouseIn) {
      var mousePos = getMousePos(canvas, event)
      var row = parseInt((mousePos.x - xleftView) / step)
      var col = parseInt((mousePos.y - ytopView) / step)
      if (row >= 0 && row < CANVAS_ROWS && col >= 0 && col < CANVAS_COLS) {
        str_coord = '(' + (row + 1) + ',' + (col + 1) + ')'
        $('.coord_show').css('display', 'block')
        $('.txt').html(str_coord)
      } else {
        $('.coord_show').css('display', 'none')
      }
    }

    if (!dragEnable) {
      oldX = X
      oldY = Y
      $('.coord').css('display', 'none')

       setTimeout(async() => {
        if (X == oldX && Y == oldY && isMouseIn) {
          var mousePos = getMousePos(canvas, event)
          var row = parseInt((mousePos.x - xleftView) / step)
          var col = parseInt((mousePos.y - ytopView) / step)
          var pixelX = row + 1;
          var pixelY = col + 1;
          // pixelX = pixelX.toString();
          // pixelY = pixelY.toString();
          // var pixelXY = StringToBytes('575,256');
          // let result = await TRON.viewPixelOwner('429,229');
          // console.log(pixelXY);
          // console.log(result);

          $('.coord-x').text(row + 1)
          $('.coord-y').text(col + 1)
console.log(tronWeb.address.toHex("TBBnsH1UJMMyjAKWQj3cKtfSmQzsDK78aN"))

           let tempPosition=new Uint16Array(2);
           tempPosition.set([pixelX,pixelY]);
           let position= new Uint8Array(tempPosition.buffer);
           let results = await TRON.viewPixelOwner(position)
           console.log(results);
           if(results!=410000000000000000000000000000000000000000) {
              $('.coords-user').html('<i class="fa fa-user"></i><span class="userAddress">'+tronWeb.address.fromHex(results)+'</span>')
            }else{
              $('.coords-user').html('')
            }



          //const results = await tronWeb.getEventResult('TDcpi7VfV4mLgfkMvgkbK2ZwDLA3WHAfX8', '1544498532000','PixelPurchased');
                       //sinceTimestamp = 1544498532000, 
                       //eventName = 'PixelPurchased', 
                       //blockNumber = 6540, 
                       //size = 20, page = 1);
      //  results.forEach(item=>{
        //  console.log(item)
       //   let buyer = item.result.buyer
       //   let colorArray = item.result.colorArray
       //   let pixelPositionArray = item.result.pixelPositionArray
       //   let communityName = item.result.communityName
       //   console.log(tronWeb.toUtf8(pixelPositionArray))
       //   console.log(tronWeb.defaultAddress.hex)
         // console.log(tronWeb.defaultAddress.hex)
          //console.log(tronWeb.toUtf8(pixelPositionArray))
          //console.log(tronWeb.fromUtf8(pixelPositionArray))
          //console.log(tronWeb.toAscii(pixelPositionArray))
          //console.log(tronWeb.toDecimal(pixelPositionArray))
       // })

         // var t = await TRON.PixelPurchased();
         // console.log(StringToBytes('576,256'));
          if (row >= 0 && row < CANVAS_ROWS && col >= 0 && col < CANVAS_COLS) {
            $('.coord').css('display', 'block')
            $('.coord-color').css('background-color', canvasData[col][row])

            var top = mousePos.y + 15
            var left = mousePos.x + 35
            if (mousePos.x > widthCanvas / 2) left = mousePos.x - 150
            if (mousePos.y > heightCanvas / 2) top = mousePos.y - 15 - 50
            $('.coord').css('top', top)
            $('.coord').css('left', left)
          }
        }
      }, 2000)
      return
    }

    if (mouseDown) {
      $('.coord').css('display', 'none')

      var dx = X - lastX
      var dy = Y - lastY
      if (dx != 0 || dy != 0) mouseDrag = true

      if (xleftView + dx > widthCanvas / 2) {
      } else if (xleftView + dx < -CANVAS_ROWS * step + widthCanvas / 2) {
      } else {
        xleftView += dx
      }

      if (ytopView + dy > heightCanvas / 2) {
      } else if (ytopView + dy < -CANVAS_COLS * step + heightCanvas / 2) {
      } else {
        ytopView += dy
      }

      draw()
    }
    lastX = X
    lastY = Y
  }

  function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect()
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    }
  }

  function draw() {

    canvasImg = ctx.createImageData(widthCanvas, heightCanvas)

    xMax = CANVAS_COLS * step
    yMax = CANVAS_ROWS * step

    gridcr = getColor('#DDD')
    xPos = xleftView
    for (var i = 0; i < CANVAS_COLS; i++) {
      yPos = ytopView
      if (xPos + step >= 0 && xPos < widthCanvas) {
        for (var j = 0; j < CANVAS_ROWS; j++) {
          if (yPos + step >= 0 && yPos < heightCanvas) {
            cr = getColor(canvasData[j][i])
            nGrid = 0
            if (gridShow == true && step >= 3) {
              nGrid = 1
            }
            for (k = 0; k < step; k++) {
              if (xPos + k >= 0 && xPos + k < widthCanvas) {
                for (m = 0; m < step; m++) {
                  if (yPos + m >= 0 && yPos + m < heightCanvas) {
                    if (nGrid == 1 && (k == 0 || m == 0))
                      setCanvasColor(xPos + k, yPos + m, gridcr)
                    else setCanvasColor(xPos + k, yPos + m, cr)
                  }
                }
              }
            }
          }
          yPos += step
        }
      }
      xPos += step
    }

    ctx.putImageData(canvasImg, 0, 0)
  }

  function downloadImage() {
    var image = canvas.toDataURL()

    var a = $('<a>')
      .attr('href', image)
      .attr('download', 'img.png')
      .appendTo('body')

    a[0].click()

    a.remove()
  }

  var tableIndex = 1
  $('#pay').click(async function (event) {
    event.preventDefault()
    var name = $('#add_community').val()
  
    if (name == '') {
       $('.alert').removeClass('hide')
       $('.alert').html('Insert your name.')
       hidealert()
    }else if(hasWhiteSpace(name)==true){
       $('.alert').html('Community name without Space')
        $('.alert').removeClass('hide')
        hidealert()
    } else {
      $('.alert').addClass('hide')
      var check1 = await TRON.viewCommunityExist(name);
      if(check1==true)
      {
        $('.alert').html('Community name already exists')
         $('.alert').removeClass('hide')
         hidealert()
      }else{
       var result = await TRON.createNewCommunicty(name);  
      $('.alert').addClass('hide')
      hidealert()
      $('.modal').modal('hide');
       $('#new_community').hide();
        showModal('Success', 'Community ' + name + ' created. check transaction here <a target="_blank" href="https://shasta.tronscan.org/#/transaction/'+ result +'">tronscan.org</a> ','')
         return false;

      }
      
    }
  })
  $('#buy_tokens').click( async function (event) {
    event.preventDefault()
      var value = $('#tokens_value').val()
      var test = await TRON.usertoCommunity();   

    if(isEmpty(test) || hex2a(test)==""){
      //alert('You must be Join 1 Community to Buy Pixels.'); 
      $('.alert').removeClass('hide')
      $('.alert').html('You must Join 1 Community to Buy Tokens.')
      hidealert()
      return false;
    }else{   
      if(value<100){
        $('.alert').removeClass('hide')
        $('.alert').html('You cant buy less then 100 tokens.')
       hidealert()
      }else{
        var result = await TRON.buyTokens(value)
        $('.modal').modal('hide')
        showModal('Success', 'You Bought Tokens. check transaction here <a target="_blank" href="https://shasta.tronscan.org/#/transaction/'+ result +'">tronscan.org</a> ',showAccountInfo)
      }
    }
  })  
  $('.btn_buy').click(async function(event){
    var test = await TRON.usertoCommunity();   
    if(isEmpty(test) || hex2a(test)==""){
      //alert('You must be Join 1 Community to Buy Pixels.'); 
       showModal('Error', 'You must Join 1 Community to Buy Pixels','')
      return false;
    }else{
      console.log(oldPixels)
     var result = await TRON.buyPixels(oldPixels);  
     if(result){
      EmptyCart();
     $('.cart_list').hide();
     showModal('Success', 'You Bought Pixel. check transaction here <a target="_blank" href="https://shasta.tronscan.org/#/transaction/'+ result +'">tronscan.org</a> ',showAccountInfo)
   }
    }
    
  })
function hidealert(){
  setTimeout(function() {
     $('.alert').addClass('hide');
}, 4000);
}
 function EmptyCart(){
  oldPixels.forEach((pixel, index) => {
        var x = pixel.x
        var y = pixel.y
        var color = pixel.color
        canvasData[y][x] = color
        socket.emit('color', {
          row: y + 1,
          col: x + 1,
          color: color
        })
      })
      oldPixels = []
      cartCnt = 0
      draw()
      $('.pixel_list').html('')
      $('.count').html(cartCnt)
      $('.pixelCnt').html(cartCnt)
      $('.trxCnt').html(cartCnt)
      cart=[]
 }
  
  
  $('#btn_join').click(async function(event){
    var name = $('#listCommunity').val()
    var joinCommunityResult = await TRON.joinCommunity(name);
    $('.modal').modal('hide');
    showModal('Success', 'You Have successfully Joined Community',showAccountInfo);
    $('#LeaveCommunityDiv').show();
    $('.communityData').show();
    $('#JoinCommunityDiv').hide();

          return false;
  })
  $('#btn_leave').click(async function(event){
    var result = await TRON.leaveCommunity();
    $('.modal').modal('hide');
    showModal('Success', 'You Left Community. check transaction here <a target="_blank" href="https://shasta.tronscan.org/#/transaction/'+ result +'">tronscan.org</a> ',showAccountInfo)
    $('#LeaveCommunityDiv').hide();
    $('.communityData').hide();
    $('#JoinCommunityDiv').show();
    showAccountInfo();
  })
  initialize()
  counter()
  setTimeout(tronLoginCheck, 2000);
  //Try to set handle address change event
  let intervalID = setInterval(function () {
    if (typeof window.tronWeb == 'object') {
      window.tronWeb.on("addressChanged", showAccountInfo)
      clearInterval(intervalID);
    }
  }, 10)
  //Try to get realtime balance
  setInterval(function () {
    if (typeof window.tronWeb == 'object') {
      showAccountInfo();
      
    }
  }, 1000)
  async function tronLoginCheck() {
    try {
      if (!window.tronWeb) throw 'You must install tronlink';
      if (!(window.tronWeb && window.tronWeb.ready)) throw 'You must login Tronlink to interact with contract';
      showAccountInfo();
    }
    catch (e) {
      showModal('Stop', e, tronLoginCheck)
    }
  }
  async function showAccountInfo() {
    $('#account-address').val(tronWeb.defaultAddress.base58);
    $('#account-balance').val((await tronWeb.trx.getBalance(tronWeb.defaultAddress.hex)).toLocaleString("en-us"));
     var test = await TRON.usertoCommunity();  

      if(isEmpty(test) || hex2a(test)==""){
        $('#LeaveCommunityDiv').hide();
        $('.communityData').hide();
      }else{
        $('#currentCommunity').val(hex2a(test));
        $('#JoinCommunityDiv').hide();
      }
  }
  function showModal(title, content, callback) {
    $('#alert-title').text(title);
    $('#alert-content').html(content);
    $('#alert-modal').modal('show');
    $('#alert-modal').on('hidden.bs.modal', function (e) {
      callback();
    })
  }
})
