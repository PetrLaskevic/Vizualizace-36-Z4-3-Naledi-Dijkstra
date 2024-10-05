function markOkolniPole(row_zastaveni, column_zastaveni, maze, pocet_rows, pocet_columns) {
    // Assuming maze is a global variable
    let mozna_policka = [
        [row_zastaveni - 1, column_zastaveni, '|'],
        [row_zastaveni + 1, column_zastaveni, '|'],
        [row_zastaveni, column_zastaveni + 1, '-'],
        [row_zastaveni, column_zastaveni - 1, '-']
    ];

    mozna_policka.forEach(([x1, y1, znak]) => {
        if (0 <= x1 && x1 < pocet_rows && 0 <= y1 && y1 < pocet_columns) {
            if (!['#', 'C', 'S', 'a'].includes(maze[x1][y1])) { // pokud je okolni pole krizek, tak ho samozrejme prenastavovat nebudeme
                if ((maze[x1][y1] === '|' && znak === '-') || (maze[x1][y1] === '-' && znak === '|')) {
                    maze[x1][y1] = 'a';
                } else {
                    maze[x1][y1] = znak;
                }
            }
        }
    });
}

function lineEnding(source) {
	var temp = source.indexOf('\n');
	if (source[temp - 1] === '\r')
		return "\r\n" //CRLF, Windows
	return "\n" //LF, Linux
}


function markEdgeStartsAndEnds(maze){
    /*Marks nodes int the text maze where edges start and end, right before an obstacle ('#') or an edge of the map (where the person stops on the icy pavement).
    It replaces '.' characters with one of three possible characters:
        - with '-' for edges starting up and down from left and right sides of '#' like so:  '-#-'
        - with '|' for edges starting left and right from top and bottom sides of '#' like so: |
                                                                                               #
                                                                                               |
        - or 'a' for nodes where both | and - would be put (for better printing and memory efficiency) 
    */

    // Convert the maze string into a 2D array
    // in maze[x][y], x is the line number, y is the column number
    maze = maze.trim().split(lineEnding(maze)).map(row => row.split(''));
    if(!maze.map(i => i.length).every((val,i, arr) => val == arr[0])){
        throw Error("Make sure all maze lines are the same length.");
    }
    // Setting corners to 'a'
    // as corners are both horizontally and vertically next to the edge of the map
    if (maze[0][0] == '.') { //!['#', 'S', 'C'].includes(maze[0][0])
        maze[0][0] = 'a';
    }

    if (maze[0][maze[0].length - 1] == '.') {
        maze[0][maze[0].length - 1] = 'a';
    }

    if (maze[maze.length - 1][0] == '.') {
        maze[maze.length - 1][0] = 'a';
    }

    if (maze[maze.length - 1][maze[0].length - 1] == '.') {
        maze[maze.length - 1][maze[0].length - 1] = 'a';
    }

    // As borders (=edges of the map) are stops, setting them as such (as though the entire maze was surrounded by '#'):

    // Setting the top edge with | to simplify graph generation code
    maze[0].forEach((znak, index) => {
        if (znak === '.') {
            maze[0][index] = '|';
        }
    });

    // Setting the bottom edge with | to simplify graph generation code
    maze[maze.length - 1].forEach((znak, index) => {
        if (znak === '.') {
            maze[maze.length - 1][index] = '|';
        }
    });

    //Mark the surrounding squares (políčka) of '#' with the '-', '|', 'a' characters
    maze.forEach((radka, indexRadky) => {;
        radka.forEach((znak, indexZnaku) => {
            if (znak === '#') {
                markOkolniPole(indexRadky, indexZnaku, maze, maze.length, maze[0].length);
            }
        });
        // Setting left and right edges to - to simplify graph generation code
        if (radka[radka.length - 1] === '.') {
            maze[indexRadky][radka.length - 1] = '-';
        }
        if (radka[0] === '.') {
            maze[indexRadky][0] = '-';
        }
    });
    return maze;
}


class Graf {
    constructor() {
        this.graf = {};
        this.startCoordinates = [];
        this.endCoordinates = [];
    }

    add(coordsFrom, coordsTo, weight, orientation) {
        // Eliminate meaningless edges:
        // Edges of length 0 when ### (cross between crosses)
        // Edges of length 1 when #.# (dot between crosses) = deadend = path ends there, not useful
        if (weight <= 1) {
            return;
        }

        // Two oppositely directed edges = one undirected edge
        if (orientation === 'undirected') {
            // First edge
            if (this.graf[coordsFrom]) {
                // Avoid duplicates
                /* maze = """
                    # |- .
                    . #  .
                    # .  .
                    . .  ."""
                (0, 1): [((0, 2), 2), ((0, 2), 2)],
                => one edge | to right wall
                => one edge - to right wall
                One node can only have 3 edges maximum so O(N) check is ok */
                if (!this.graf[coordsFrom].some(edge => String(edge[0]) === String(coordsTo) && edge[1] === weight)) { //like this in Python: if (coordsTo, weight) not in self.graf[coordsFrom]:
                    this.graf[coordsFrom].push([coordsTo, weight]);
                }
            } else {
                this.graf[coordsFrom] = [[coordsTo, weight]];
            }

            // Second edge
            if (this.graf[coordsTo]) {
                if (!this.graf[coordsTo].some(edge => String(edge[0]) === String(coordsFrom) && edge[1] === weight)) { //if (coordsFrom, weight) not in self.graf[coordsTo]:
                    this.graf[coordsTo].push([coordsFrom, weight]);
                }
            } else {
                this.graf[coordsTo] = [[coordsFrom, weight]];
            }

        } else if (orientation === 'directed') {
            if (this.graf[coordsFrom]) {
                if (!this.graf[coordsFrom].some(edge => String(edge[0]) === String(coordsTo) && edge[1] === weight)) { //!this.graf[coordsFrom].some(edge => String(edge[0]) === String(coordsTo) && edge[1] === weight //if (coordsTo, weight) not in self.graf[coordsFrom]:
                    this.graf[coordsFrom].push([coordsTo, weight]);
                }
            } else {
                this.graf[coordsFrom] = [[coordsTo, weight]];
            }
        }
    }
}


class TwoItems {
    /*
	Computes distance between two '#' characters in a line / column. \n
	Example: `#...#` => `self.numDots == 3`

	:param mode: horizontal (for lines) / vertical (for columns)

	Use `pushO(value: coordinates)` to add a character.

	When two characters have been added, self.readyToOutput is True, and a graph edge is returned.
	
	Use coordinates of a character next to a '#': \n
	- horizontally (a '-' character) \n
	- or vertically (a '|' character) \n
	- or both (a 'a' character) \n
	Do not push coordinates of a '#' character, as the calculation will be wrong.
	*/
    constructor(mode) {
        this.lis = [];
        this.prevItem = null;
        this.numDots = 0;
        this.mode = mode;
        this.readyToOutput = false;
        this.setInitialValue = false;
    }

    pushO(value) {
        /*
		Computes the distance (self.numDots) to a previously added character and removes it from memory. 
		Saves the character you added for the next call. \n
		Used when adding edges between two '#' characters on the same line / column, makes an undirected edge between them.
		*/
        this.setInitialValue = true;
        const [radka, znak] = value;
        this.lis.push(value);

        if (this.lis.length === 2) {
            this.readyToOutput = true;
        } else if (this.lis.length === 1) {
            /*previous action was reset(), so the item we added now is the only value
			=> so we WILL NOT pop it out and say radka, znak == previousRadka, previousZnak*/
            this.readyToOutput = false;
            return;
        }

        const [previousRadka, previousZnak] = this.lis.shift();

        if (this.mode === "horizontal") {
            this.prevItem = [previousRadka, previousZnak];
            this.numDots = znak - previousZnak + 1;
        } else if (this.mode === "vertical") {
            this.prevItem = [previousRadka, previousZnak];
            this.numDots = radka - previousRadka + 1;
        }
    }

    peekO(value) {
        /*
		Computes the distance (self.numDots) to a previously added character without removing the character. \n
		Used when adding: \n
		- leftward (in the direction of decreasing indexZnaku) edges \n
		- upward (in the direction of decreasing indexRakdy) edges \n
		*/

        /*example ['#', '|', '|', '#'], 
        on second character there is no previous character to show
        so readyToOuput is used here so:
        - leftward (in the direction of decreasing indexZnaku) edges
        - upward (in the direction of decreasing indexRakdy) edges
        are only added to the graph when there is a character for them to stem from*/
        if (this.lis.length === 0) {
            this.readyToOutput = false;
            return;
        } else {
            this.readyToOutput = true;
        }

        const [radka, znak] = value;
        const [previousRadka, previousZnak] = this.lis[0];
        this.prevItem = [previousRadka, previousZnak];

        if (this.mode === "horizontal") {
            this.numDots = znak - previousZnak + 1;
        } else if (this.mode === "vertical") {
            this.numDots = radka - previousRadka + 1;
        }
    }

    reset() {
        this.lis = [];
        this.readyToOutput = false;
    }
}


class HranyDoprava {
    /*
	:param mode: horizontal (for lines) / vertical (for columns) 
	
	**Line mode:**
	
	Computes distances from '|' nodes on the top and bottom sides of '#' on the line \n
	to a '-' node on the left of the next '#' or to the right end of line and generates the respective edges.

	**Column mode:**

	Computes distances from '-' nodes on the left and right sides of '#' on the line \n
	to a '|' node on the top side of next '#' or to the bottom end of column and generates the respective edges.

	Examples:

	Line mode:

	.. code-block:: plaintext

		||.-# 
		##...

	Directed edges from both '|' to the right to the '-'

	Column mode:

	.. code-block:: plaintext

		-####
		.....
		|
		#....

	Directed edge from '-' to '|'


	Directed edges from '|' to the LEFT (to '-' or left border) are handled by TwoItems.pushO on the '-' or border and by TwoItems.peekO on the '|'
	Directed edges from '-' to the TOP (to '|' or top border) are handled same (but vertical mode on TwoItems)

	*/

    // (holt proste misto ready to output je cast pridavani grafu tady)
    constructor(mode) {
        this.lis = [];  //for "normal" nodes from a left '-' character to a to the right stop
        this.lis2 = []; //for nodes discovered on the right or on the bottom to the 'C' (depends on mode), which are oppositely oriented (opačně orientované) to the nodes generated from this.lis
        this.mode = mode;
        this.setInitialValue = false;
    }

    addHranaOdsud(coordinates) {
        // Add edge from this node (edge going to node specified when calling getEdgeData)
        this.setInitialValue = true;
        this.lis.push(coordinates);
    }

    addHranaSem(coordinates){
        //Add edge to this node (to a node which will be discovered later)
        //For the 'C' (end) node  => to make directed edges from the node discovered on the right to the 'C'
        this.setInitialValue = true;
        this.lis2.push(coordinates);
    }

    getEdgeData(stopNode) {
        // stop node = character, kde se to zastavilo = - pred # nebo okraj
        // kazdopadne je vcetne
        const [stopX, stopY] = stopNode;
        const returnList = []; // ((x,y), (stopX, stopY), numDots, 'directed')
        for (const [x, y] of this.lis) {
            let numDots = 0;
            if (this.mode === "horizontal") {
                numDots = stopY - y + 1;
            } else if (this.mode === "vertical") {
                numDots = stopX - x + 1;
            }
            returnList.push([[x, y], [stopX, stopY], numDots, 'directed']);
        }
        //same for lis2, for edges going to 'C':
        for (const [x, y] of this.lis2) {
            let numDots = 0;
            if (this.mode === "horizontal") {
                numDots = stopY - y + 1;
            } else if (this.mode === "vertical") {
                numDots = stopX - x + 1;
            }
            returnList.push([[stopX, stopY], [x, y], numDots, 'directed']);
        }
        return returnList;
    }

    reset() {
        this.lis = [];
    }
}
function mazeTextToGraph(maze){
    console.log(maze)
    //accepts text as a maze, returns a Graf instance
    maze = maze.substring(maze.indexOf('\n') + 1); //+1 to not include the first \n character //first line are dimensions of maze. not needed here
    console.log(maze)
    maze = markEdgeStartsAndEnds(maze);
    console.table(maze)
    let graf = new Graf();
    let hranyNahoru = [];
    let hranyDolu = [];
    for (let x = 0; x < maze[0].length; x++){
        hranyNahoru.push(new TwoItems("vertical"));
        hranyDolu.push(new HranyDoprava("vertical"));
    }

    maze.forEach((radka, indexRadky) => {
        let hranyDoleva = new TwoItems("horizontal");
        let hranyDoprava = new HranyDoprava("horizontal");

        radka.forEach((znak, indexZnaku) => {
            if(znak !== '#'){ //(podle mě toto ne: !['#', 'S', 'C'].includes(znak), protože na startu se může inicializovat)
                //initialize all 4 directions of edges
                if(!hranyDoleva.setInitialValue){
                    hranyDoleva.pushO([indexRadky, indexZnaku]);
                }
                if(!hranyDoprava.setInitialValue){
                    hranyDoprava.addHranaOdsud([indexRadky, indexZnaku]);
                }
                if(!hranyNahoru[indexZnaku].setInitialValue){
                    hranyNahoru[indexZnaku].pushO([indexRadky, indexZnaku]);
                }
                if(!hranyDolu[indexZnaku].setInitialValue){
                    hranyDolu[indexZnaku].addHranaOdsud([indexRadky, indexZnaku]);
                }
            }
            if(znak == 'S'){
                graf.startCoordinates = [indexRadky, indexZnaku];

                //directed edge from S to right
                hranyDoprava.addHranaOdsud([indexRadky, indexZnaku]);

                //directed edge from S to left
                hranyDoleva.peekO([indexRadky, indexZnaku]);
                if (hranyDoleva.readyToOutput) {
                    graf.add([indexRadky, indexZnaku], hranyDoleva.prevItem, hranyDoleva.numDots, 'directed');
                }

                //directed edge from S to up
                hranyNahoru[indexZnaku].peekO([indexRadky, indexZnaku]);
                if(hranyNahoru[indexZnaku].readyToOutput){
                    graf.add([indexRadky, indexZnaku], hranyNahoru[indexZnaku].prevItem, hranyNahoru[indexZnaku].numDots, 'directed');
                }
                //directed edge from S to down
                //hrana odsud dolu (do dolniho zastaveni)
                hranyDolu[indexZnaku].addHranaOdsud([indexRadky, indexZnaku]);

            }else if(znak == 'C'){
                graf.endCoordinates = [indexRadky, indexZnaku];

                //directed edge from right to C
                hranyDoprava.addHranaSem([indexRadky, indexZnaku]);
                //directed edge from left to C
                hranyDoleva.peekO([indexRadky, indexZnaku]);
                if (hranyDoleva.readyToOutput) {
                    graf.add(hranyDoleva.prevItem,[indexRadky, indexZnaku], hranyDoleva.numDots, 'directed');
                }
                //directed edge from top to C
                hranyNahoru[indexZnaku].peekO([indexRadky, indexZnaku]);
                if(hranyNahoru[indexZnaku].readyToOutput){
                    graf.add(hranyNahoru[indexZnaku].prevItem, [indexRadky, indexZnaku],  hranyNahoru[indexZnaku].numDots, 'directed');
                }
                //directed edge from bottom to C
                //vypada to, ze na to je treba pridat do HranyDoprava addHranaSem
                //=> stejne jako na directed edge from right to C
                    //(addHrana odsud by pridalo hranu s opacnou orientaci)
                    //ohnout hranyNahoru taky nejde, protoze ta vec vyzaduje, aby se nejdriv zavolalo addHranaOdsud a az pak harvest
                        //=> a my chceme jet jednou odshora nahoru => (A ZEJO addHranaOdsud se musi zavolat na to dolni policko, co objevime potom, a harvest na tohle 'C')
                //=> TLDR: potreba pridat novou funkci
                //nebo HOLT pridat 'undirected' hranu do cile (i z cile)
                //=> s tim, ze kdyz se dorazi do cile, tak se program ukonci
                //jinak bud muzu pridat do hranyDoprava tridy => a pridat addHranaSem a this.lis2 na tu hranu,
                //a nebo (imho asi lepsi = udelat na to dalsi tridu)
                // => to ale znamena ve vsech dalsich mistech ji dalsi tridu trackovat => lepsi to pridat do hranyDoprava
                //(NO UNDIRECTED EDGES)
                hranyDolu[indexZnaku].addHranaSem([indexRadky, indexZnaku]);



                hranyDoprava.getEdgeData([indexRadky, indexZnaku]).forEach(hrana => {
                    graf.add(...hrana);
                    //pridani resetu sem pr na uk.txt udela z "2,1" hranu do [2,2],2], ale uz ne do [[2,4],4], (predtim oboji)
                    // => nekonzistentni s jinymi smery (pr nahoru, nebo doleva kde jsou obe hrany)
                    //pr doleva: "2,4": "[[[2,0],5],[[2,2],3],[[0,4],3],[[4,4],3]]", (ze to je krome [[2,2],3] i [[2,0],5])
                    //pr nahoru: "5,2": "[[[5,1],2],[[0,2],6],[[2,2],4],[[5,3],2]]", (ze to je krome [[2,2],4] i [[0,2],6])
                    hranyDoprava.reset();
                });

                hranyDolu[indexZnaku].getEdgeData([indexRadky, indexZnaku]).forEach(hrana => {
                    graf.add(...hrana);
                    //pridani resetu sem pr na uk.txt udela z "1,2": hranu do [2,2],2], ale uz ne do [5,2],5] (predtim oboji)
                    // => nekonzistentni s jinymi smery (pr nahoru, kde jsou obe hrany)
                    hranyDolu[indexZnaku].reset();
                });

            }
            if(['-', 'a'].includes(znak)){
                hranyDoleva.pushO([indexRadky, indexZnaku]);
                if(hranyDoleva.readyToOutput){
                    graf.add(hranyDoleva.prevItem, [indexRadky, indexZnaku], hranyDoleva.numDots, 'undirected');
                }
                //from | to -#.
                //     #.......
                hranyDoprava.getEdgeData([indexRadky, indexZnaku]).forEach(hrana => {
                    graf.add(...hrana);
                    hranyDoprava.reset();
                });

                //vertical handling
                hranyNahoru[indexZnaku].peekO([indexRadky, indexZnaku]);
                if(hranyNahoru[indexZnaku].readyToOutput){
                    graf.add([indexRadky, indexZnaku], hranyNahoru[indexZnaku].prevItem, hranyNahoru[indexZnaku].numDots, 'directed');
                }
                //hrana odsud dolu (do dolniho zastaveni)
                hranyDolu[indexZnaku].addHranaOdsud([indexRadky, indexZnaku]);
            }
            if(['|', 'a'].includes(znak)){
                //prida orientovanou hranu z nejvic leveho volneho znaku do naseho znaku |
                // JavaScript code
                hranyDoleva.peekO([indexRadky, indexZnaku]);
                if (hranyDoleva.readyToOutput) {
                    graf.add([indexRadky, indexZnaku], hranyDoleva.prevItem, hranyDoleva.numDots, 'directed');
                }

                hranyDoprava.addHranaOdsud([indexRadky, indexZnaku]);

                // vertical handling
                hranyNahoru[indexZnaku].pushO([indexRadky, indexZnaku]);
                if (hranyNahoru[indexZnaku].readyToOutput) {
                    graf.add(hranyNahoru[indexZnaku].prevItem, [indexRadky, indexZnaku], hranyNahoru[indexZnaku].numDots, 'undirected');
                }

                // from - to |
                // ...-#...
                // ....|...
                // ...|....
                // ...#....
                hranyDolu[indexZnaku].getEdgeData([indexRadky, indexZnaku]).forEach(hrana => {
                    graf.add(...hrana);
                    hranyDolu[indexZnaku].reset();
                });
            }else if(znak == '#'){ //pres krizky cesta z o do o nikdy nevede
                hranyDoleva.reset();
                hranyNahoru[indexZnaku].reset();
                hranyNahoru[indexZnaku].reset();
                hranyDoprava.reset();
            }

        });
    });


    //test no nodes are #
    Object.keys(graf.graf).forEach(function(key,index) {
        const [x,y] = key.split(",").map(x => parseInt(x));
        if(maze[x][y] == '#'){
            alert("Graph parsing error",x,y);
        }
    });


    return graf;
}

function prettyPrintGraf(graf){
        /*Accepts a Graf object*/

        //https://stackoverflow.com/questions/6937863/json-stringify-so-that-arrays-are-on-one-line
        console.log("Number of items in graph:", Object.keys(graf.graf).length, "start:", graf.startCoordinates, "end:", graf.endCoordinates);
        console.log(JSON.stringify(graf,function(k,v){
            if(v instanceof Array)
            return JSON.stringify(v);
            return v;
        },2));
}

export {mazeTextToGraph, prettyPrintGraf};
