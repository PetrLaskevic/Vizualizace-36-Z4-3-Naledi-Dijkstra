class ResponsiveGrid extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.rows = parseInt(this.getAttribute('rows'));
        this.columns = parseInt(this.getAttribute('columns'));
        this.cellStyles = this.getAttribute("cellStyles");

        this.maximumTextLengthSetSoFar = 0;
        
        const style = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                }
                #grid {
                    display: grid;
                    width: 100%;
                    height: 100%;
                    /*padding here would create an overflow*/
                    /*padding: 5px;*/
                }
                /*Remove border from cell, because borders are not the same width on the outer cells
                (becomes apparent when setting border: 5px solid #0a0a0d;)
                TODO: So, better use grid gap
                */
                .cell {
                    /*flexbox used to center text here*/
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    box-sizing: border-box; /* Include border in dimensions */
                    overflow: hidden; /* Ensure text does not overflow */
                    font-size: var(--fsize);
                    line-height: 1;
                }
                @media (prefers-color-scheme: dark) {
                    :root{
                        color-scheme: dark;
                    }
                    .cell{
                        background: #0a0a0d;
                    }
                }
            </style>
        `;

        this.shadowRoot.innerHTML = `
            ${style}
            <div id="grid"></div>
        `;
    }

    connectedCallback() {
        console.log("connected callback called");

        let link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = this.cellStyles;
        this.shadowRoot.appendChild(link);

        this.createGrid();
        //to fix window.removeEventListener in disconnectedCallback
        //when this.handleResize.bind(this) was called there, 
        // it did not remove the event listener due to Function References Not Matching
        // Binding the function or using an anonymous function can create a new reference, causing removeEventListener to fail.
        //src: https://medium.com/@aleksej.gudkov/lwc-removeeventlistener-not-working-1f8dcb417e30
        //=> Storing the function reference with this.resizeCallback fixes the issue
        this.resizeCallback = this.handleResize.bind(this);
        window.addEventListener('resize', this.resizeCallback);
    }

    disconnectedCallback() {
        console.log("disconnected callback ran");
        window.removeEventListener('resize', this.resizeCallback);
    }

    //public function, returns the cell at the specified index
    at(row, column){
        if(!Number.isInteger(row) || !Number.isInteger(column)){
            throw Error("Arguments must be numbers");
        }
        if(row == this.rows || column == this.columns){
            throw Error(`IndexError, ${row}, ${column}, while size is ${this.rows}, ${this.columns}`);
        }
        //row coordinate * length of row 
        return this.grid.children[row * this.columns + column];
    }

    addClassToCell(coordinates, className){
        let row, column;
        [row, column] = coordinates;
        this.at(row, column).classList.add(className);
    }

    removeClassFromCell(coordinates, className){
        let row, column;
        [row, column] = coordinates;
        this.at(row, column).classList.remove(className);
    }

    setTextToCell(coordinates, text){
        text = String(text);
        let row, column;
        [row, column] = coordinates;
        //Right now under the assumption that shorter text than already is there cannot be assigned to a cell
        //(here it is like so, for other algorithms I will need to implement an ordered map, a tree)
        //needed to have a cell with longest text for tracking font size for adjustFontSize
        this.at(row, column).textContent = text;

        if(text.length > this.maximumTextLengthSetSoFar){
            this.maximumTextLengthSetSoFar = text.length;
            console.log("hleda se nova velikost", text.length, text);
            this.maximumTextLengthElement  =  this.at(row, column);

            const { clientWidth, clientHeight } = this.shadowRoot.host.parentElement;
            this.cellSize = Math.min(clientWidth / this.columns, clientHeight / this.rows);

            this.findFontSizeForCell(this.maximumTextLengthElement, this.cellSize);
        }
        
    }

    //public function
    //renders a maze from a 2D array of characters
    renderMaze(mazeArray){
        //(2D Array of characters, abych nemusel tady po 3. rozhodovat whichLineEnding)
        
        //odebrani prazdneho radku na konci
	    if(mazeArray[mazeArray.length - 1].trim() == ""){
	    	mazeArray.pop();
	    }

		this.dbgMazeText = mazeArray.slice(1).map(row => row.split('')); //for debugging dbgMazeText console.table(this.dbgMazeText)
		// console.log(mazeArray);

        //empty grid was created from the constructor, 
        //so now assign proper classes to the existing cells

        //First row is maze size info (this.pocetRows,this.pocetColumns), so skipping it
        //actual maze starts on second row
        for(let x = 1; x < mazeArray.length; x++){ //mazeArray.length == this.rows
            let row = mazeArray[x].split("");

            for(let y = 0; y < mazeArray[1].length; y++){
                let character = row[y];
                if(character == "#"){
                    //first row are maze dimensions, so x - 1 to get correct index
                    this.at(x - 1 ,y).classList.add("green");
                    // console.log("ww")
                }else if(character == "S"){

                }else if(character == "E"){

                }
            }
        }

    }

    handleResize() {
        //Calculates widths of cells 
        this.grid = this.shadowRoot.getElementById('grid');
        const { clientWidth, clientHeight } = this.shadowRoot.host.parentElement;

        // Determine the smallest dimension to ensure square cells
        this.cellSize = Math.min(clientWidth / this.columns, clientHeight / this.rows);

        // Set the grid template with fixed cell size
        this.grid.style.gridTemplateColumns = `repeat(${this.columns}, ${this.cellSize}px)`;
        this.grid.style.gridTemplateRows = `repeat(${this.rows}, ${this.cellSize}px)`;

        this.adjustFontSize(this.grid, this.cellSize);
    }

    createGrid() {
        //Creates HTML fot the cells when the widget is constructed
        this.handleResize();
        let divString = `<div class="cell"></div>`.repeat(this.rows * this.columns);
        this.grid.innerHTML = divString;
        // console.time("handleResize of empty grid");
        // this.handleResize();
        // console.timeEnd("handleResize of empty grid");
        // console.time("createGrid");
        // for (let i = 0; i < this.rows * this.columns; i++) {
        //     const cell = document.createElement('div');
        //     cell.className = 'cell';
        //     this.grid.appendChild(cell);
        // }
        // // this.adjustFontSize(this.grid, this.cellSize); //this call is unnecesary here because it will essentially be called when first content will be inserted
        // console.timeEnd("createGrid");
    }

    //finds optimal font size for the longest text cell
    //which will be the font size for all other cells
    findFontSizeForCell(cell, cellSize){
        let fontSize = cellSize / 2; // Initial font size guess
        cell.style.fontSize = fontSize + 'px';
        cell.style.lineHeight = 1; //in the base style, optional here

        // Decrease font size until it fits within the cell's dimensions
        while (fontSize > 0 && (cell.scrollWidth > cell.clientWidth || cell.scrollHeight > cell.clientHeight)) {
            fontSize--;
            cell.style.fontSize = fontSize + 'px';
        }
        cell.style = ""; //to not mix fsize and inline style
        this.grid.style.setProperty("--fsize", fontSize + "px");
        console.log("new font size", fontSize);
    }

    adjustFontSize(grid, cellSize) {
        // Sets the maximum possible font size to cells, 
        // so that the text of maximum length in "this.maximumTextLengthElement" of length "this.maximumTextLengthSetSoFar" fits without overflow
        if(this.maximumTextLengthElement == undefined){
            //first time when the function is called from handleResize, the grid doesn't have any items
            //in such case, return (the previous for loop wouldnt't have done anything anyway )
            return;
        }
        this.findFontSizeForCell(this.maximumTextLengthElement, cellSize);
    }
}

customElements.define('responsive-grid', ResponsiveGrid);
