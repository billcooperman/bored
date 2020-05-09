var color, line_width;
function update_line_width(w) {
    line_width = w;
    document.getElementById('line-width').innerHTML = ''+w;
}
update_line_width(2);
function update_color(c) {
    color = c;
    document.getElementById('color').innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
    document.getElementById('color').style.backgroundColor = c;
}
update_color('black');
var search_params = new URLSearchParams(window.location.search);
var sesh = search_params.get('room');

var id_request = new XMLHttpRequest();
id_request.open("POST", "./cgi-bin/give_id.py");
id_request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
id_request.onreadystatechange = function() {
    if (id_request.readyState == 4 && id_request.status == 200) {
        var server_id = id_request.responseText.trim();
        var size_ratio = 9/16;  // height / width
        var cur_x = 0, cur_y = 0;
        var drawing = false;
        var draw_events = [];
        var redo_events = [];
        var cur_draw_event = []
        var board_div = document.getElementById('main-board-div');
        var boards = [];
        var resize_timeout = window.setTimeout(function() {}, 10);
        var has_lock = false;
        var lock_button = document.getElementById('lock-button');
        var lock_span = document.getElementById('lock-span');

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
        function resize_boards(e) {
            for (var i=0; i<boards.length; i++) {
                boards[i].width = document.body.clientWidth;
                boards[i].height = boards[i].width * size_ratio;
                boards[i].getContext('2d').clearRect(0, 0, boards[i].width, boards[i].height);
            }
            // only try to redraw if we haven't resized in 100ms
            window.clearTimeout(resize_timeout);
            resize_timeout = window.setTimeout(redraw_everything, 100);
        }
        window.addEventListener('resize', resize_boards);

        function redraw_everything(only = -1, last = 0, undo = false) {
            if (undo) {
                var context = boards[only].getContext('2d');
                context.clearRect(0, 0, boards[only].width, boards[only].height);
            }
            for (var i=last; i<draw_events.length; i++) {
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


        // TODO: send these actions to the server
        document.addEventListener('keydown', function(e) {
            if (has_lock) {
                if (e.code == 'KeyU') { // undo
                    handle_undo();
                    put_action('UNDO');
                } else if (e.code == 'KeyR') { // redo
                    handle_redo();
                    put_action('REDO');
                }
            }
        });

        function handle_undo() {
            if (draw_events.length > 0) {
                redo_events.push(draw_events.pop());
                redraw_everything(redo_events[redo_events.length-1].board, 0, true);
            }
        }
        function handle_redo() {
            if (redo_events.length > 0) {
                draw_events.push(redo_events.pop());
                redraw_everything(-1, draw_events.length-1, false);
            }
        }

        window.addEventListener('scroll', scroll_hit_bottom);
        function scroll_hit_bottom(e, force=false) {
            // if you're scrolled to the bottom of the page, automatically add another board
            if (force || window.innerHeight + window.pageYOffset >= document.body.offsetHeight) {
                var new_board = add_board();

                function end_draw_event(e) {
                    // TODO: send this to server
                    if (e.pointerType !== "touch" && drawing && has_lock) {
                        draw(e);
                        boards[new_board].getContext('2d').stroke();
                        drawing = false;
                        var event_obj = {'board': new_board,
                                          'color': color,
                                          'points': cur_draw_event,
                                          'lw': line_width/boards[new_board].width};
                        draw_events.push(event_obj);
                        put_action(event_obj);
                        cur_draw_event = [];
                    }
                }
                boards[new_board].addEventListener('pointerup', end_draw_event);
                boards[new_board].addEventListener('pointerout',  end_draw_event);
                boards[new_board].addEventListener('pointerdown', function(e) {
                    if (e.pointerType !== "touch" && has_lock) {
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
                    }
                });
                function draw(e) {
                    if (e.pointerType != "touch" && drawing && has_lock) {
                        var context = boards[new_board].getContext('2d');
                        var W = boards[new_board].width;
                        context.lineTo(e.offsetX, e.offsetY);
                        context.stroke();
                        cur_draw_event.push([cur_x, cur_y]);
                        cur_x = e.offsetX/boards[new_board].width;
                        cur_y = e.offsetY/boards[new_board].width;
                    }
                }
                boards[new_board].addEventListener('pointermove', draw);
            }
        }

        scroll_hit_bottom();
        scroll_hit_bottom();
        scroll_hit_bottom();


        function get_deltas() {
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.onreadystatechange = function() {
                if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                    var response = xmlHttp.responseText.trim();
                    var new_events = JSON.parse(response);
                    for (var i=0; i<new_events.length; i++) {
                        if (new_events[i] == 'UNDO') {
                            handle_undo();
                        } else if (new_events[i] == 'REDO') {
                            handle_redo();
                        } else {
                            while (boards.length <= new_events[i].board)
                                scroll_hit_bottom({}, true); // force add new boards
                            draw_events.push(new_events[i]);
                            redraw_everything(-1, draw_events.length-1);
                        }
                    }
                }
            }
            xmlHttp.open( "POST", './cgi-bin/give_deltas.py', true); // true for asynchronous
            xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xmlHttp.send("sesh=" + sesh + '&id=' + server_id);
        }

        function put_action(action) {
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.open( "POST", './cgi-bin/take_action.py', true); // true for asynchronous
            xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xmlHttp.send("sesh=" + sesh + "&id=" + server_id + "&action=" + encodeURIComponent(JSON.stringify(action)));
        }

        function get_lock() {
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.onreadystatechange = function() {
                if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                    if (xmlHttp.responseText.trim().startsWith('OK')) {
                        has_lock = true;
                        lock_button.innerHTML = "release";
                        lock_span.innerHTML = "currently editing &nbsp; &nbsp;";
                    } else {
                        lock_span.innerHTML = "someone else is editing now &nbsp; &nbsp;";
                    }
                }
            };
            xmlHttp.open( "POST", './cgi-bin/give_lock.py', true); // true for asynchronous
            xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xmlHttp.send("sesh=" + sesh + "&id=" + server_id);
        }
        function release_lock() {
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.onreadystatechange = function() {
                if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                    if (xmlHttp.responseText.trim().startsWith('OK')) {
                        has_lock = false;
                        lock_button.innerHTML = "edit";
                        lock_span.innerHTML = "lock released &nbsp; &nbsp;";
                    }
                }
            };
            xmlHttp.open( "POST", './cgi-bin/release_lock.py', true); // true for asynchronous
            xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xmlHttp.send("sesh=" + sesh + "&id=" + server_id);
        }
        lock_button.addEventListener('click', function() {
            if (has_lock) {
                release_lock();
            } else {
                get_lock();
            }
        });
        window.addEventListener("beforeunload", function(e){
            if (has_lock) {
                release_lock();
                e.returnValue = 'releasing the lock...';
            }
        });

        setInterval(get_deltas, 1000); // ask for updates every second
    }
};
id_request.send('sesh=' + sesh);
