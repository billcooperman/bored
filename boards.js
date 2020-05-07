var board_div = document.getElementById('main-board-div');
var boards = [];
function add_board() {
    var new_board = document.createElement('canvas');
    new_board.width = document.body.clientWidth;
    new_board.height = new_board.width * size_ratio;
    var spacer = document.createElement('div');
    var board_name = document.createElement('p');
    board_name.innerHTML = "board #" + boards.length;
    spacer.appendChild(board_name);
    board_div.appendChild(spacer);
    board_div.appendChild(new_board);
    boards.push(new_board);
    return boards.length-1;
}
var cur_board;
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
        context.fillStyle = draw_events[i].color;
        for (var j=0; j<draw_events[i].rects.length;  j++) {
            var R = draw_events[i].rects[j];
            context.fillRect(R[0]/size_ratio, R[1]/size_ratio, R[2]/size_ratio, R[3]/size_ratio);
        }
    }
}

var size_ratio = 9/16;  // height / width
var color = 'black', line_width = 1;
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
            drawing = false;
            redo_events = [];
            if (cur_draw_event.length > 0) {
                draw_events.push({'board': new_board,
                                  'color': color,
                                  'rects': cur_draw_event});
                cur_draw_event = [];
            }
        }
        boards[new_board].addEventListener('mouseup', end_draw_event);
        boards[new_board].addEventListener('mouseout',  end_draw_event);
        boards[new_board].addEventListener('mousedown', function(e) {
            drawing = true;
            cur_x = e.offsetX * size_ratio;
            cur_y = e.offsetY * size_ratio;
            draw(e);
        });
        function draw(e) {
            if (drawing) {
                var context = boards[new_board].getContext('2d');
                context.fillStyle = color;
                var new_x = e.offsetX*size_ratio;
                var new_y = e.offsetY*size_ratio;
                var lw = line_width*size_ratio;
                var distance = Math.abs(cur_x-new_x) + Math.abs(cur_y-new_y);
                var x_weight = (new_x-cur_x)/distance;
                var y_weight = (new_y-cur_y)/distance;
                var backup = 0;
                while (distance > lw) {
                    backup++;
                    if (backup == 1000) {
                        console.log('drawing error');
                        break;
                    }
                    context.fillRect(cur_x/size_ratio, cur_y/size_ratio, line_width, line_width);
                    cur_draw_event.push([cur_x, cur_y, lw, lw]);
                    cur_x += lw*x_weight;
                    cur_y += lw*y_weight;
                    distance = Math.abs(cur_x-new_x) + Math.abs(cur_y-new_y);
                }
                context.fillRect(cur_x/size_ratio, cur_y/size_ratio, line_width, line_width);
                cur_draw_event.push([cur_x, cur_y, lw, lw]);
                cur_x = new_x;
                cur_y = new_y;
            }
        }
        boards[new_board].addEventListener('mousemove', draw);
    }
}
