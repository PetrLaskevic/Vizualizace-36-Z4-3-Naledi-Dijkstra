import {mazeTextToGraph, prettyPrintGraf} from "./graphGen.js";
import {DijkstraMazeApp} from "./render.js";


function whichLineEnding(source) {
	var temp = source.indexOf('\n');
	if (source[temp - 1] === '\r')
		return 'CRLF' //Windows
	return 'LF' //Linux
}

let mazePicker = document.getElementById("mazePicker");
let mazeAppClassHolderVariable; //the instance of the maze app

mazePicker.addEventListener("change", function(e){
	let mazeSelected = mazePicker.value;
	if(mazeSelected != ""){
		let mazeUrl = ""

		if(window.location.protocol == "file:"){
			//Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at file:///C:/Users/Andrey/Documents/ksp/84.txt. (Reason: CORS request not http).
			//=> that is on purpose: 
			//	https://amp.thehackernews.com/thn/2019/07/firefox-same-origin-policy-hacking.html 
			//	https://bugzilla.mozilla.org/show_bug.cgi?id=1558299
			//so show user an alert
			document.getElementById("loadOnLocalServer").classList.remove("hidden");
			document.getElementById("loadOnLocalServerOK").focus();
			return;
		}else{
			mazeUrl = "./"  + mazeSelected;
		}
		
		fetch(mazeUrl)
		.catch(err => {
			document.getElementById("offline").classList.remove("hidden");
			document.getElementById("offlineOK").focus();
			throw Error(err);
		})
		.then( r => {
			if(r.status != 200){
				//maybe add a function for making popups to main.js so I can add the name of the maze and a more helpful status message there
				document.getElementById("errorLoading").classList.remove("hidden");
				document.getElementById("errorLoadingOK").focus();
				throw new Error(`File at "${mazeUrl}" not found`);
			}else{
				return r.text();
			}
		})
   		.then( t => {
			let text = "";
			let lineEnding = whichLineEnding(t);
			if(lineEnding == "CRLF"){
				text = t.split("\r\n");
			}else if(lineEnding == "LF"){
				text = t.split("\n");
			}

			let graf = mazeTextToGraph(t);
			prettyPrintGraf(graf);

			//TODO
			if(mazeAppClassHolderVariable != undefined){
				mazeAppClassHolderVariable.zcelaHotovo = true;
				mazeAppClassHolderVariable.hideMaze();
			}
			
            mazeAppClassHolderVariable = new DijkstraMazeApp(graf);
            mazeAppClassHolderVariable.renderMaze(text);
            mazeAppClassHolderVariable.startDijkstra(); //entry point to our actual program

            // let grid = document.createElement("responsive-grid");
            // [grid.rows, grid.columns] = text[0].split(' ').map(Number);
           
            // grid.cellStyles = "./visualisation.css";
            // document.querySelector("main").appendChild(grid);
            // grid.renderMaze(text);

		});
	}
});


//reading and parsing the input into a table to display as well as the correspoding 2D Array
document.getElementById('inputfile').addEventListener('change', function(event) {
	console.log(event);
	let text = "";
    var fr=new FileReader();
    fr.onload=function(){
		let lineEnding = whichLineEnding(fr.result);
		if(lineEnding == "CRLF"){
			text = fr.result.split("\r\n");
		}else if(lineEnding == "LF"){
			text = fr.result.split("\n");
		}

		// let graf = mazeTextToGraph(fr.result);
		// prettyPrintGraf(graf);

		//TODO
        let grid = document.createElement("responsive-grid");
        [grid.rows, grid.columns] = text[0].split(' ').map(Number);
        document.querySelector("main").appendChild(grid);
    }
    fr.readAsText(this.files[0]);
    document.getElementById("selectedFileLabel").textContent = this.files[0].name;
});


console.log("yes");