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

    handleResize() {
        this.createGrid();
    }

    createGrid() {
        const grid = this.shadowRoot.getElementById('grid');
        const { clientWidth, clientHeight } = this.shadowRoot.host.parentElement;
        console.log(this.shadowRoot.host); //<responsive-grid rows="15" columns="20" max-length="3"></responsive-grid>
        console.log(this.shadowRoot)

        // Determine the smallest dimension to ensure square cells
        const cellSize = Math.min(clientWidth / this.columns, clientHeight / this.rows);

        // Set the grid template with fixed cell size
        grid.style.gridTemplateColumns = `repeat(${this.columns}, ${cellSize}px)`;
        grid.style.gridTemplateRows = `repeat(${this.rows}, ${cellSize}px)`;

        // Clear previous content
        grid.innerHTML = '';

        // Create grid cells
        for (let i = 0; i < this.rows * this.columns; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.textContent = Math.floor(Math.random() * Math.pow(10, this.maxLength)).toString();
            grid.appendChild(cell);
        }

        // Adjust font size to fit cells
        this.adjustFontSize(grid, cellSize);
    }

    adjustFontSize(grid, cellSize) {
        const cells = grid.getElementsByClassName('cell');

        for (let cell of cells) {
            let fontSize = cellSize / 2; // Initial font size guess
            cell.style.fontSize = fontSize + 'px';
            cell.style.lineHeight = 1;

            // Decrease font size until it fits within the cell's dimensions
            while (fontSize > 0 && (cell.scrollWidth > cell.clientWidth || cell.scrollHeight > cell.clientHeight)) {
                fontSize--;
                cell.style.fontSize = fontSize + 'px';
            }
        }
    }
}

customElements.define('responsive-grid', ResponsiveGrid);
