//Copyright (c) 2014 Alex Gulakov, MIT License http://mit-license.org 

var  z, zColor, dY, dX, size=5, delay=0, gen=0,
	color, multiplayer, playing, patterns = [], survive = [2, 3], born = [3];

var suppressRuleDoubleClick = 0;

//z is 01 array in [y][x] corresponding to canvas in [x][y], dX and dY are its dimensions
//size of cells in pixels on screen, delay in ms between gens, gen tracks current gen,
//color true if setting is on, multiplayer true if setting on
//patterns array of predefined lifeforms, survive & born arrays of custom rule sets

$(document).ready(function(){




	//create the canvas & array
	function reset(){
        dX=Math.floor($(window).width()/size);
        dY=Math.floor(($(window).height()-$("#info-container").height()-size)/size);

        z = Array.apply(null, new Array(dY)).map(Number.prototype.valueOf,0);
        for (var i = 0; i < dY; i++)
            z[i] = Array.apply(null, new Array(dX)).map(Number.prototype.valueOf,0);


        zColor = Array.apply(null, new Array(dY)).map(Number.prototype.valueOf,0);
        for (var i = 0; i < dY; i++)
            zColor[i] = Array.apply(null, new Array(dX)).map(Number.prototype.valueOf,0);



        var g=$("#gol")[0];
        g.width=dX*size;
        g.height=dY*size;
        g.width = g.width-0;
        var x=g.getContext("2d");
        x.fillStyle = "white";
        x.fillRect(0,0,dX*size,dY*size);

        gen=0;

    }
	
	reset();
	//predefined patterns
	patterns.push({name:"Point On/Off"});
	patterns.push({name:"Glider", array: [[0,2],[1,0],[1,2],[2,1],[2,2]]});
	patterns.push({name:"Spaceship", array: [[1,0],[4,0],[0,1],[0,2],[4,2],[0,3],[1,3],[2,3],[3,3]]});
	patterns.push({name:"Pulsar", array:  [[0,0],[2,0],[4,0],[0,1],[4,1],[0,2],[4,2],[0,3],[4,3],[0,4],[2,4],[4,4]]});
	patterns.push({name:"Glider Gun", array: [[25,0],[22,1],[23,1],[24,1],[25,1],[30,1],
					[13,2],[21,2],[22,2],[23,2],[24,2],[30,2],[12,3],[14,3],[21,3],[24,3],[34,3],[35,3],
					[11,4],[15,4],[16,4],[21,4],[22,4],[23,4],[24,4],[34,4],[35,4],
					[0,5],[1,5],[11,5],[15,5],[16,5],[22,5],[23,5],[24,5],[25,5],[0,6],
					[1,6],[11,6],[15,6],[16,6],[25,6],[12,7],[14,7],[13,8]]});
	patterns.push({name:"Goose", array: [[0,0],[0,1],[0,2],[1,0],[1,10],[1,11],[2,1],[2,8],[2,9],[2,10],
					[2,12],[3,3],[3,4],[3,7],[3,8],[4,4],[5,8],[6,4],[6,5],[6,9],[7,3],[7,5],
					[7,7],[7,8],[8,3],[8,5],[8,8],[8,10],[8,11],[9,2],[9,7],[9,8],[10,2],[10,3],[11,2],[11,3]]});
	patterns.push({name:"Bar", array: [[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0]]});
	patterns.push({name:"R-pentomino", array: [[0,1],[1,0],[1,1],[1,2],[2,0]]});
	patterns.push({name:"Beehive", array: [[0,0],[0,6],[1,0],[1,6],[2,1],[2,5],[3,2],[3,3],[3,4]]});
	patterns.push({name:"Tumbler", array: [[0,1],[0,2],[1,0],[2,1],[2,3],[2,4],[3,2],[3,4],[5,2],
					[5,4],[6,1],[6,3],[6,4],[7,0],[8,1],[8,2]]});
	patterns.push({name:"Octagon", array: [[0,6],[0,7],[1,5],[1,8],[2,4],[2,9],[3,3],[3,10],[4,3],
					[4,10],[5,4],[5,9],[6,5],[6,8],[7,6],[7,7]]});
	patterns.push({name:"Pinwheel", array: [[0,4],[0,5],[1,4],[1,5],[3,4],[3,5],[3,6],[3,7],[4,3],[4,8],
					[4,10],[4,11],[5,3],[5,7],[5,8],[5,10],[5,11],[6,0],[6,1],[6,3],[6,5],
					[6,8],[7,0],[7,1],[7,3],[7,6],[7,8],[8,4],[8,5],[8,6],[8,7],[10,6],[10,7],[11,6],[11,7]]});
	patterns.push({name:"Unix", array: [[0,4],[0,5],[1,0],[1,1],[1,3],[2,0],[2,1],[2,4],[2,7],[3,5],[3,7],
		[4,6],[6,5],[6,6],[7,5],[7,6]]});
	patterns.push({name:"Lightsaber", array: [[1,0],[1,1],[2,0],[2,2],[3,1],[3,2],[4,3],[4,4],[5,3],
		[6,4],[6,6],[8,6],[8,8],[9,9],[10,8],[10,9]]});


    for (var i in patterns)
        $("#pattern").append($('<option>' + patterns[i].name + '</option>'));

    $("#pattern").append($('<option>ConwayLife.com</option>'));


    $('#pattern').selectpicker({style: 'btn-default btn-group-sm', width: '120px' });

    $("#pattern").change(function () {
        if ($("#pattern")[0].selectedIndex == $("#pattern").children().length - 1)
            window.open("http://conwaylife.com/w/index.php?title=Special:PopularPages&amp;limit=100&amp;offset=0");
    });


    //insert on click on canvas
    $("#gol").click(function (e) {
        var x = e.offsetX ? e.offsetX : e.clientX;
        var y = e.offsetY ? e.offsetY : e.clientY - 20;

        var x = Math.floor(x / size);
        var y = Math.floor(y / size);

        if ($("#pattern")[0].selectedIndex == 0) {
            if (z[y][x] == 1)
                off(x, y);
            else
                on(x, y);
        } else {
            var pattern = patterns[$("#pattern")[0].selectedIndex].array;
            for (var i in pattern)
                on(pattern[i][0] + x, pattern[i][1] + y);

        }


        if(multiplayer){
            var onlist =[];
            for (var y = 0; y < z.length; y++)
                for (var x = 0; x < z[0].length; x++)
                    if (z[y][x] == 1)
                        onlist.push([x, y]);


            $.post("http://hkrnews.com/game/update", {data: JSON.stringify(onlist), fromsocketid: socketid});

        }

    })

    //basic controls for play, speed, colors, multiplayer
    $("button").tooltip();

    $("#play").click(function () {

        $("#play").toggleClass("glyphicon-play")
            .toggleClass("glyphicon-pause");

        if ($("#play").hasClass('glyphicon-pause')){

            playing = setInterval(function(){
                $("#gen").html(++gen);
                run();
            }, delay * 20);
        } else{
            clearInterval(playing);
        }

    });

    $("#backward").click(function () {
        delay++;
        $("#forward").removeClass('disabled');
    });

    $("#forward").click(function () {
        if ($("#play").hasClass('glyphicon-play')) {
            run();
        }

        if (delay != 0)
            delay--;

    });

    $("#clear").click(function () {
        reset();
    });


    $("#color").click(function () {
        $("#color").toggleClass("btn-default").toggleClass("btn-primary");
        color = !color;

    });

    $("#multiplayer").click(function () {

        $("#multiplayer").toggleClass("btn-default").toggleClass("btn-primary");
        multiplayer = !multiplayer;

        reset();

        $.get("http://hkrnews.com/game/read", function(r) {
            var z2 = eval(r);

            for (var y = 0; y < z2.length; y++)
                on(z2[y][0], z2[y][1]);
        });

    });

    $("#download").click(function () {
        var imgURL = $("#gol")[0].toDataURL();

      //  window.open(imgURL, '_target');

        var imgLink = $("<a href='" + imgURL + "' download target='_system'></a>")[0];
        imgLink.click();
    });


    //custom rule setting

    var divSettings =  $("<div>");
    var divBorn = $("<div>").attr("id", "settings-born").addClass("btn-group btn-group-xs");
    var divSurvive = $("<div>").attr("id", "settings-survive").addClass("btn-group btn-group-xs");

   
    for (var i = 0; i <= 8; i++) {
        divSurvive.append($('<button class="btn btn-default">' + i + '</button>'));
        divBorn.append($('<button class="btn btn-default">' + i + '</button>'));
    }
    divBorn.prepend($(' <span class="label label-default">Born</span> '));
    divSurvive.prepend($(' <span class="label label-default">Survive</span> '));


    divSettings.append(divBorn).append("<br>").append(divSurvive);
    $("#settings-button").popover({html: true, content: divSettings.html()  });

    $("#settings-button").click(function () {

        $("#settings-button").popover("show")
    });


    $("#settings-button").on("shown.bs.popover", function () {

            $("#settings-survive button").each(function () {
                if (survive.indexOf(parseInt($(this).text())) != -1)
                    $(this).removeClass("btn-default").addClass("btn-primary");
            })
            $("#settings-born button").each(function () {
                if (born.indexOf(parseInt($(this).text())) != -1)
                    $(this).removeClass("btn-default").addClass("btn-primary");
            })







       $("#settings-survive button, #settings-born button").bind("click", function () {
 

            if ( new Date().getTime() - suppressRuleDoubleClick < 500)
                return;

            suppressRuleDoubleClick = new Date().getTime();


            if ($(this).hasClass("btn-primary"))
                $(this).removeClass("btn-primary").addClass("btn-default");
            else
                $(this).removeClass("btn-default").addClass("btn-primary");

            setTimeout(function () {
                survive = [];
                born = [];
                $("#settings-survive button").each(function () {
                    if ($(this).hasClass("btn-primary"))
                        survive.push(parseInt($(this).text()));
                });

                $("#settings-born button").each(function () {
                    if ($(this).hasClass("btn-primary"))
                        born.push(parseInt($(this).text()));
                });
            }, 10);
        });





       
    });



});

function on(x, y) {
    if (x < 0 || y < 0 || x > dX || y > dY)
        return;

    z[y][x] = 1;
    var g = document.getElementById("gol").getContext("2d");

    //mix neighboor colors
    if (color) {
        var nColors = [], resultColor ="",
            nCells = [[x - 1, y - 1],[x - 1, y],[x - 1, y + 1],[x, y - 1],
            [x, y + 1],[x + 1, y - 1],[x + 1, y],[x + 1, y + 1]];

        for (var i in nCells) {
            var nX = nCells[i][0], nY = nCells[i][1];
            if (nX > 0 && nY > 0 && nX < dX && nY < dY && z[nY][nX] == 1){
                var c = zColor[nY][nX];

                if (c!=null && c != 0 && c != "000" && c != "FFF"){
                    c =  c.length == 1 ? "00" +c : c.length == 2 ? "0" +c : c;

                    nColors.push(c.replace("#",""));
                }
            }
        }


        if (nColors.length){
            resultColor = nColors.reduce(function (previousValue, currentValue) {
                return currentValue.match(/.{3}/g)
                    .map(function (value, index) {
                        return previousValue[index] + parseInt(value, 16);
                    });
            }, [0, 0, 0]).reduce(function (previousValue, currentValue) {
                return previousValue + Math.floor(currentValue / nColors.length).toString(16);
            }, '#');


        } else {

            var n2Cells = [[x-2,y-2], [x-2,y-1], [x-2,y], [x-2,y+1], [x-2,y+2],
                [x+2,y-2], [x+2,y-1], [x+2,y], [x+2,y+1], [x+2,y+2],
                [x-1,y+2], [x+1,y+2], [x-1,y-2], [x+1,y-2], [x,y+2], [x,y-2]];

            for(var i in n2Cells){
                var nX = n2Cells[i][0], nY = n2Cells[i][1];

                if (nX > 0 && nY > 0 && nX < dX && nY < dY && z[nY][nX] == 1)
                    var c = zColor[nY][nX];

                if (c!=null && c != 0 && c != "FFF"){
                    resultColor = c;
                    break;
                }

            }
        }

        if (resultColor=="" || resultColor.toUpperCase() == "#FFF") {
            resultColor = '#';
            for (var i = 0; i < 3; i++)
                resultColor += '0123456789ABCDEF'.split('')[Math.floor(Math.random() * 16)];

        }

        if (resultColor == "#FFF")
            resultColor="#FC4";

        resultColor = resultColor.length == 3 ? "#0" +resultColor.substring(1): resultColor;

        g.fillStyle = resultColor;

        zColor[y][x] = resultColor.toUpperCase().substring(1);
    } else {
        g.fillStyle = "#000";
    }
    g.fillRect(x * size, y * size, size, size);
}

function off(x, y) {
    if (x < 0 || y < 0 || x > dX || y > dY)
        return;
    z[y][x] = 0;
    var g = $("#gol")[0].getContext("2d");
    g.fillStyle = "#FFF";
    g.fillRect(x * size, y * size, size, size);
}

function run() {

    var n, w = Array.apply(null, new Array(dY)).map(Number.prototype.valueOf, 0);
    for (var i = 0; i < dY; i++)
        w[i] = Array.apply(null, new Array(dX)).map(Number.prototype.valueOf, 0);

    for (var y = 0; y < dY; y++)
        for (var x = 0; x < dX; x++)
            if (z[y][x])
                 w[y][x]=1;

    for (var y = 0; y < dY; y++) {
        for (var x = 0; x < dX; x++) {

            if (y > 0 && y < dY - 1 && w[y - 1].indexOf(1) == -1 &&
                w[y].indexOf(1) == -1 && w[y + 1].indexOf(1) == -1)
                break;

            n = 0;
            if (x > 0) {
                if (y > 0)
                    n += w[y - 1][x - 1];

                n += w[y][x - 1];
                if (y < dY - 1)
                    n += w[y + 1][x - 1];
            }
            if (y > 0)
                n += w[y - 1][x];
            if (y < dY - 1)
                n += w[y + 1][x];
            if (x < dX - 1) {
                if (y > 0)
                    n += w[y - 1][x + 1];
                n += w[y][x + 1];
                if (y < dY - 1)
                    n += w[y + 1][x + 1];
            }

            //rules
            if ((w[y][x] == 0 && born.indexOf(n) > -1)
                || w[y][x]==1 && ( survive.indexOf(n)>-1 || born.indexOf(n)>-1 ) )
                on(x, y);

            if (w[y][x] == 1 && born.indexOf(n) == -1 && survive.indexOf(n) == -1)
                off(x, y);
        }
    }
}
