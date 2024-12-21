class ResponsiveGrid extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.rows = parseInt(this.getAttribute('rows'));
        this.columns = parseInt(this.getAttribute('columns'));
        this.maxLength = parseInt(this.getAttribute('max-length'));

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
                .cell {
                    /*flexbox used to center text here*/
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    border: 1px solid #ccc;
                    box-sizing: border-box; /* Include border in dimensions */
                    overflow: hidden; /* Ensure text does not overflow */
                }
                @media (prefers-color-scheme: dark) {
                    :root{
                        color-scheme: dark;
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
        this.createGrid();
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    disconnectedCallback() {
        window.removeEventListener('resize', this.handleResize.bind(this));
    }


    //public function
    renderMaze(){
        //renders a maze from a 2D array of characters
        //(2D Array of characters, abych nemusel tady po 3. rozhodovat whichLineEnding)
        console.log("hello");
        alert("hi");
    }

    handleResize() {
        //Calculates widths of cells 
        this.grid = this.shadowRoot.getElementById('grid');
        const { clientWidth, clientHeight } = this.shadowRoot.host.parentElement;
        console.log(this.shadowRoot.host); //<responsive-grid rows="15" columns="20" max-length="3"></responsive-grid>
        console.log(this.shadowRoot)

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

        for (let cell of cells) {
            let fontSize = cellSize / 2; // Initial font size guess
            cell.style.fontSize = fontSize + 'px';
            cell.style.lineHeight = 1;
            
            //The font size ends up to be the same for all cells (nice) even when the length of text differs: i.e is 1 or 2
            //(demo in component7.js with random numbers)
            // => So, there could be a speed up when resizing the grid, by only computing the font size for the first cell
            // Decrease font size until it fits within the cell's dimensions
            while (fontSize > 0 && (cell.scrollWidth > cell.clientWidth || cell.scrollHeight > cell.clientHeight)) {
                fontSize--;
                cell.style.fontSize = fontSize + 'px';
            }
        }
    }
}

customElements.define('responsive-grid', ResponsiveGrid);
