function update_line_width(w) {
    line_width = w;
    document.getElementById('line-width').innerHTML = ''+w;
}
function update_color(c) {
    color = c;
    document.getElementById('color').innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
    document.getElementById('color').style.backgroundColor = c;
}
update_line_width(2);
update_color('black');
var board_div = document.getElementById('main-board-div');
var boards = [];
function add_board() {
    var new_board = document.createElement('canvas');
    new_board.width = document.body.clientWidth;
    new_board.height = new_board.width * size_ratio;
    var spacer = document.createElement('div');
    spacer.style.backgroundColor = '#99FFFF';
    spacer.innerHTML = "board #" + boards.length + " ^";
    board_div.appendChild(new_board);
    board_div.appendChild(spacer);
    boards.push(new_board);
    return boards.length-1;
}
var resize_timeout = window.setTimeout(function() {}, 10);
function resize_boards(e) {
    for (var i=0; i<boards.length; i++) {
        boards[i].width = document.body.clientWidth;
        boards[i].height = boards[i].width * size_ratio;
    }
    // only try to redraw if we haven't resized in 100ms
    window.clearTimeout(resize_timeout);
    resize_timeout = window.setTimeout(redraw_everything, 100);
}
document.addEventListener('DOMContentLoaded', scroll_hit_bottom);
window.addEventListener('resize', resize_boards);

function redraw_everything(only = -1) {
    console.log('redrawing');
    console.log(draw_events);
    for (var i=0; i<boards.length; i++) {
        if (only !== -1 && i != only) continue;
        var context = boards[i].getContext('2d');
        context.clearRect(0, 0, boards[i].width, boards[i].height);
    }
    for (var i=0; i<draw_events.length; i++) {
        if (only !== -1 && draw_events[i].board != only) continue;
        var context = boards[draw_events[i].board].getContext('2d');
        var W = boards[draw_events[i].board].width;
        context.strokeStyle = draw_events[i].color;
        context.lineWidth = draw_events[i].lw*W;
        context.beginPath();
        context.moveTo(draw_events[i].points[0]*W, draw_events[i].points[1]*W);
        for (var j=1; j<draw_events[i].points.length;  j++) {
            var R = draw_events[i].points[j];
            context.lineTo(R[0]*W, R[1]*W);
        }
        context.stroke();
    }
}

var size_ratio = 9/16;  // height / width
var color, line_width;
var cur_x = 0, cur_y = 0;
var drawing = false;
var draw_events = [];
var redo_events = [];
var cur_draw_event = []

document.addEventListener('keydown', function(e) {
    if (e.code == 'KeyU') { // undo
        if (draw_events.length > 0) {
            redo_events.push(draw_events.pop());
            redraw_everything(redo_events[redo_events.length-1].board);
        }
    } else if (e.code == 'KeyR') { // redo
        if (redo_events.length > 0) {
            draw_events.push(redo_events.pop());
            redraw_everything(draw_events[draw_events.length-1].board);
        }
    }
});

window.addEventListener('scroll', scroll_hit_bottom);
function scroll_hit_bottom(e) {
    // if you're scrolled to the bottom of the page, automatically add another board
    console.log(window.innerHeight);
    console.log(window.scrollTop);
    console.log(document.body.offsetHeight);
    if (window.innerHeight + window.pageYOffset >= document.body.offsetHeight) {
        var new_board = add_board();

        function end_draw_event(e) {
            draw(e);
            boards[new_board].getContext('2d').stroke();
            drawing = false;
            if (cur_draw_event.length > 0) {
                draw_events.push({'board': new_board,
                                  'color': color,
                                  'points': cur_draw_event,
                                  'lw': line_width/boards[new_board].width});
                cur_draw_event = [];
            }
        }
        boards[new_board].addEventListener('mouseup', end_draw_event);
        boards[new_board].addEventListener('mouseout',  end_draw_event);
        boards[new_board].addEventListener('mousedown', function(e) {
            drawing = true;
            cur_x = e.offsetX / boards[new_board].width;
            cur_y = e.offsetY / boards[new_board].width;
            var lw = line_width / boards[new_board].width;
            cur_draw_event.push([cur_x, cur_y]);
            var context = boards[new_board].getContext('2d');
            context.beginPath();
            context.moveTo(e.offsetX, e.offsetY);
            context.strokeStyle = color;
            context.lineWidth = lw*boards[new_board].width;
        });
        function draw(e) {
            if (drawing) {
                var context = boards[new_board].getContext('2d');
                var W = boards[new_board].width;
                context.lineTo(e.offsetX, e.offsetY);
                context.stroke();
                cur_draw_event.push([cur_x, cur_y]);
                cur_x = e.offsetX/boards[new_board].width;
                cur_y = e.offsetY/boards[new_board].width;
            }
        }
        boards[new_board].addEventListener('mousemove', draw);
    }
}

scroll_hit_bottom();
scroll_hit_bottom();
scroll_hit_bottom();
