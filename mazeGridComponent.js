class ResponsiveGrid extends HTMLElement {
    static get observedAttributes() { return ['rows', 'columns', 'max-length', 'cell-styles']; 
    }
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        //Both if the element is created statically and dynamically, these parameters are all undefined now

        //In case of static creation, like so: <responsive-grid rows="15" columns="50" max-length="3" cellStyles="visualisation.css"></responsive-grid>
            //These JS properties are undefined before assignment from HTML attributes from this.getAttribute
        
        /*In case of dynamic creation, these JS properties are undefined because this constructor runs BEFORE their assignment, like so:  
    
            let grid = document.createElement("responsive-grid");              <-constructor called here

            //properties set
            [grid.rows, grid.columns] = text[0].split(' ').map(Number);                                          
            grid.cellStyles = "./visualisation.css";

            document.querySelector("main").appendChild(grid);                  <- connectedCallback called here, after the element got inserted to the DOM by appendChild

        
        So the correct usage is to check for these variables in connectedCallback

        Right now, I also hooked up attributeChangedCallback (which needs observedAttributes to be defined ),
        which when hooked up, gets called three times WHEN CREATING statically <responsive-grid rows="15" columns="50" max-length="3" cellStyles="visualisation.css"></responsive-grid> 
        For dynamic creation, it WOULD NOT be called in the above code because that sets JS properties
        To trigger attributeChangedCallback, I would need to run grid.setAttribute("cell-styles", "./visualisations.css");
            => potentially could be used to reset - redraw the widget (if I decide to design the widget to allow these to be changed)
                (right now the expected usage is to set this once, then delete the widget after a different maze gets selected, and draw a new ones)
        */


        console.log("from constructor:", this.rows, this.columns, this.maxLength, this.cellStyles);
        this.rows = parseInt(this.getAttribute('rows'));
        this.columns = parseInt(this.getAttribute('columns'));
        this.maxLength = parseInt(this.getAttribute('max-length'));
        this.cellStyles = this.getAttribute("cellStyles");

        //and now they're                                        NaN        NaN             NaN             null
        console.log("from constructor after this.getAttribute:", this.rows, this.columns, this.maxLength, this.cellStyles);

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
        // let style = document.createElement('style');

        // The issue (to null a 6) stems from the difference between accessing attributes and properties on a custom element.
        // Understanding Attributes and Properties
        // Attributes: Attributes are part of the HTML and are accessed using methods like getAttribute. They are always strings.
        // Properties: Properties are part of the JavaScript object and can hold various types of data. Properties are accessed directly on the element (e.g., this.rows).

        // When using this.getAttribute("rows"), you're attempting to retrieve the attribute from the element. 
        //However, if the attribute hasn't been set yet (for instance, when the element is dynamically created), it will return null.
        // Because of the difference of HTML attributes and JS properties (HTML attributes are strings for example),
        //there is this code in the constructor:  this.rows = parseInt(this.getAttribute('rows'));
        //If there was not, it would not have been synced. 
        //When creating the element dynamically, like I did in my code:
                // let grid = document.createElement("responsive-grid");
                // [grid.rows, grid.columns] = text[0].split(' ').map(Number);
        //I did not set row or columns as HTML attributes (like: <responsive-grid rows="15" columns="50" max-length="3">)
        //instead I set the JS properties (AND THUS NEVER SET THE HTML ATTRIBUTE)
        //so it makes perfect sense, why this.rows was 6 = because I defined it
        // and why this.getAttribute("rows") was 0, because I didn't define it

        //dalsi priklad tohoto je:
        // element.className v JS vs class attribute v HTML
        //(tam to ma ruzne jmeno kvuli naming collision s js class)
        // (ale hezky to ukazuje, ze ty JS properties a HTML attributes are not the same)
        // (ikdyz tak casto mohou pusobit, protoze se jmenujou stejne)
        console.log(this.getAttribute("rows"), this.rows) //null a 6
        // style.textContent = `@import url("${this.cellStyles}")}");`
        // this.shadowRoot.appendChild(style);

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
        if(row == this.rows || column == this.columns){
            throw Error(`IndexError, ${row}, ${column}, while size is ${this.rows}, ${this.columns}`)
        }
        //row coordinate * length of row 
        return this.grid.children[row * this.columns + column]
    }

    addClassToCell(coordinates, className){
        let row, column;
        [row, column] = coordinates;
        this.at(row, column).classList.add(className);
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
        // console.log(this.shadowRoot.host); //<responsive-grid rows="15" columns="20" max-length="3"></responsive-grid>
        // console.log(this.shadowRoot)

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
