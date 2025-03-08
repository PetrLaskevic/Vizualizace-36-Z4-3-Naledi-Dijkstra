import {mazeTextToGraph, prettyPrintGraf} from "./graphGen.js";
import {DijkstraMazeApp} from "./render.js";

let mazePicker = document.getElementById("mazePicker");
let mazeAppClassHolderVariable; //the instance of the maze app

function whichLineEnding(source) {
	var temp = source.indexOf('\n');
	if (source[temp - 1] === '\r')
		return 'CRLF' //Windows
	return 'LF' //Linux
}

function makePopup(heading, text, id){
	//For trusted input only (no input sanitisation here)
	//I use it for exceptions my program generates, and never any user input
	let div = document.createElement("div");
	div.className = "popup";
	//TODO: Add code to actually destroy the popup and not hide it when Ok is pressed
	div.innerHTML = `
	<p class="heading"><b>${heading}</b></p>
	<p>${text}</p>
	<div style="text-align: right;">
	<button id="${id}" class="ok" onclick="this.parentElement.parentElement.classList.add('hidden')">OK</button>
	</div>
	`;
	document.body.appendChild(div);
}

function start(unsplitMazeText){
	try{
		let text = "";
		let lineEnding = whichLineEnding(unsplitMazeText);
		if(lineEnding == "CRLF"){
			text = unsplitMazeText.split("\r\n");
		}else if(lineEnding == "LF"){
			text = unsplitMazeText.split("\n");
		}

		let graf = mazeTextToGraph(unsplitMazeText);
		prettyPrintGraf(graf);

		if(mazeAppClassHolderVariable != undefined){
			mazeAppClassHolderVariable.zcelaHotovo = true;
			mazeAppClassHolderVariable.hideMaze();
		}
		
		mazeAppClassHolderVariable = new DijkstraMazeApp(graf);
		mazeAppClassHolderVariable.renderMaze(text);
		mazeAppClassHolderVariable.startDijkstra(); //entry point to our actual program
	}catch(error){
		console.error(error);
		//Show the user errors thrown by mazeTextToGraph for example
		makePopup(error.message, "", "error");
	}

}

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
			mazeUrl = "inputs/"  + mazeSelected;
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
			start(t);
		});
	}
});


//reading and parsing the input into a table to display as well as the correspoding 2D Array
document.getElementById('inputfile').addEventListener('change', function(event) {
    var fr = new FileReader();
    fr.onload = function(){
		start(fr.result);
        // let grid = document.createElement("responsive-grid");
        // [grid.rows, grid.columns] = text[0].split(' ').map(Number);
        // document.querySelector("main").appendChild(grid);
    }
    fr.readAsText(this.files[0]);
    document.getElementById("selectedFileLabel").textContent = this.files[0].name;
});


console.log("yes");