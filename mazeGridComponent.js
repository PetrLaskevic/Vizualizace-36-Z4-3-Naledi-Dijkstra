class ResponsiveGrid extends HTMLElement {
    static get observedAttributes() { return ['rows', 'columns', 'max-length', 'cell-styles']; 
    }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.rows = parseInt(this.getAttribute('rows'));
        this.columns = parseInt(this.getAttribute('columns'));
        this.maxLength = parseInt(this.getAttribute('max-length'));
        this.cellStyles = this.getAttribute("cellStyles");
        
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
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    disconnectedCallback() {
        window.removeEventListener('resize', this.handleResize.bind(this));
    }

    attributeChangedCallback(name, oldValue, newValue){
        console.log("atribute changed called", name, oldValue, newValue);
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

    setTextToCell(coordinates, text){
        if(text.length > this.maxLength){
            throw Error(`Inserted text ${text} of length ${text.length} must not be longer than maxLength ${this.maxLength}`);
        }
        let row, column;
        [row, column] = coordinates;
        this.at(row, column).textContent = text;
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
		console.log(mazeArray);

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
        for (let i = 0; i < this.rows * this.columns; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.textContent = " ".repeat(this.maxLength);
            this.grid.appendChild(cell);
        }
        this.adjustFontSize(this.grid, this.cellSize);
    }

    adjustFontSize(grid, cellSize) {
        //Sets the maximum possible font size to cells, 
        //so that the text of maximum length this.maxLength fits without overflow
        const cells = grid.getElementsByClassName('cell');
        let loopRan = false;
        for (let cell of cells) {
            let fontSize = cellSize / 2; // Initial font size guess
            cell.style.fontSize = fontSize + 'px';
            cell.style.lineHeight = 1;
            
            /*The font size ends up to be the same for all cells (nice) even when the length of text differs: i.e is 1 or 2
            (demo in component7.js with random numbers)
             => So, there is be a speed up when resizing the grid, by only computing the font size for the first cell*/
            if (loopRan){
                continue;
            }
            // Decrease font size until it fits within the cell's dimensions
            while (fontSize > 0 && (cell.scrollWidth > cell.clientWidth || cell.scrollHeight > cell.clientHeight)) {
                fontSize--;
                cell.style.fontSize = fontSize + 'px';
            }
            loopRan = true;
        }
    }
}

customElements.define('responsive-grid', ResponsiveGrid);
