<script>
	class GameCell {
		constructor() {
			this.isMine = false;
			this.isRevealed = false;
			this.flagged = false;
			this.hinted = false;
		}
	}

	/**
	 * @param {number} height
	 * @param {number} width
	 * @param {number} mines
	 */
	function generateBoard(height, width, mines) {
		let board = Array.from({ length: height }, () =>
			Array.from({ length: width }, () => new GameCell())
		);
		let minesRemaining = mines;
		while (minesRemaining > 0) {
			let row = Math.floor(Math.random() * height);
			let col = Math.floor(Math.random() * width);
			if (board[row][col].isMine) {
				continue;
			}
			board[row][col].isMine = true;
			minesRemaining--;
		}
		return board;
	}

	/**
	 * @param {GameCell[][]} board
	 */
	function calculateNumbers(board) {
		/**
		 * @param {number} row
		 * @param {number} col
		 */
		let height = board.length;
		let width = height > 0 ? board[0].length : 0;
		/**
		 * @param {number} row
		 * @param {number} col
		 */
		function isMine(row, col) {
			if (0 > row || row >= height || 0 > col || col >= width) {
				return 0;
			}
			if (board[row][col].isMine) {
				return 1;
			}
			return 0;
		}
		/**
		 * @param {number} row
		 * @param {number} col
		 */
		function countMines(row, col) {
			let res = 0;
			for (let i = row - 1; i <= row + 1; i++) {
				for (let j = col - 1; j <= col + 1; j++) {
					if (i == row && j == col) {
						continue;
					}
					res += isMine(i, j);
				}
			}
			return res;
		}
		let res = Array.from({ length: height }, () => Array.from({ length: width }, () => 0));
		for (let row = 0; row < height; row++) {
			for (let col = 0; col < width; col++) {
				res[row][col] = countMines(row, col);
			}
		}
		return res;
	}

	/**
	 * @param {GameCell[][]} board
	 */
	function checkFinished(board) {
		let height = board.length;
		let width = height > 0 ? board[0].length : 0;
		let wonFlag = true;
		for (let row = 0; row < height; row++) {
			for (let col = 0; col < width; col++) {
				const cell = board[row][col];
				if (cell.isRevealed && cell.isMine) {
					return true;
				}
				if (!cell.isRevealed && !cell.isMine) {
					wonFlag = false;
				}
			}
		}
		return wonFlag;
	}

	import Cell from '$lib/Cell.svelte';
	/**
	 * @type {number}
	 */
	export let height;
	/**
	 * @type {number}
	 */
	export let width;
	/**
	 * @type {number}
	 */
	export let mines;
	let board = generateBoard(height, width, mines);
	let adjNumbers = calculateNumbers(board);
	let firstClick = true;
	function resetGame() {
		board = generateBoard(height, width, mines);
		adjNumbers = calculateNumbers(board);
		firstClick = true;
	}
	resetGame();
	$: finished = checkFinished(board);
	/**
	 * @param {number} row
	 * @param {number} col
	 */
	function revealCell(row, col) {
		if (row < 0 || row >= height || col < 0 || col >= width) {
			return;
		}
		if (firstClick) {
			while (board[row][col].isMine) {
				resetGame();
			}
			firstClick = false;
		}
		if (finished || board[row][col].isRevealed || board[row][col].flagged) {
			return;
		}
		board[row][col].isRevealed = true;
		if (adjNumbers[row][col] == 0 && !board[row][col].isMine) {
			for (let i = row - 1; i < row + 2; i++) {
				for (let j = col - 1; j < col + 2; j++) {
					revealCell(i, j);
				}
			}
		}
	}
	/**
	 * @param {number} row
	 * @param {number} col
	 */
	function flagCell(row, col) {
		if (finished || board[row][col].isRevealed) {
			return;
		}
		board[row][col].flagged = !board[row][col].flagged;
	}

	async function getLeastLikelyCell() {
		class ApiCell {
			/**
			 * @param {boolean} revealed
			 * @param {number} adjacent
			 */
			constructor(revealed, adjacent) {
				this.isRevealed = revealed;
				this.adjacentMines = adjacent;
			}
		}
		let apiBoard = Array.from({ length: height }, () =>
			Array.from({ length: width }, () => new ApiCell(false, 0))
		);
		for (let row = 0; row < height; row++) {
			for (let col = 0; col < width; col++) {
				apiBoard[row][col].adjacentMines = adjNumbers[row][col];
				apiBoard[row][col].isRevealed = board[row][col].isRevealed;
			}
		}
		let requestBody = {
			height: height,
			width: width,
			board: apiBoard
		};
		let response = await fetch('http://localhost:8090/leastLikelyCell', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(requestBody)
		});
		/**
		 * @type {number[]}
		 */
		let result = await response.json();
		return result;
	}
	async function hint() {
		if (finished) {
			return;
		}
		/**
		 * @type {number[]}
		 */
		let coords = await getLeastLikelyCell();
		for (let row = 0; row < height; row++) {
			for (let col = 0; col < width; col++) {
				board[row][col].hinted = false;
			}
		}
		board[coords[0]][coords[1]].hinted = true;
	}

	async function aiReveal() {
		if (finished) {
			return;
		}
		/**
		 * @type {number[]}
		 */
		let coords = await getLeastLikelyCell();
		revealCell(coords[0], coords[1]);
	}

	async function aiPlay() {
		while (!finished) {
			await aiReveal();
			await new Promise((r) => setTimeout(r, 20));
		}
	}
</script>

<div id="container">
	<div id="board">
		{#each Array.from({ length: height }, (_, row) => row) as row}
			<div class="row">
				{#each Array.from({ length: width }, (_, col) => col) as col}
					<Cell
						adjacentMines={adjNumbers[row][col]}
						mine={board[row][col].isMine && finished}
						revealed={board[row][col].isRevealed}
						flagged={board[row][col].flagged}
						hinted={board[row][col].hinted}
						on:reveal={() => revealCell(row, col)}
						on:flagged={() => flagCell(row, col)}
					/>
				{/each}
			</div>
		{/each}
	</div>
	<div id="controls">
		<button on:click={resetGame}>⟳</button>
		<button on:click={hint}>💡</button>
		<button on:click={aiReveal}>AI</button>
		<button on:click={aiPlay}>▶</button>
	</div>
</div>

<style>
	#container {
		display: flex;
		flex-direction: column;
		width: fit-content;
	}
	#controls {
		display: flex;
		justify-content: center;
	}
	#board {
		display: flex;
		flex-direction: column;
		background-color: var(--board-color);
		border: var(--border-size);
	}
	.row {
		display: flex;
		flex-direction: row;
	}
	button {
		background-color: inherit;
		color: var(--text-color);
		border: none;
		font-family: 'Fira Code';
		font-size: 100pt;
		width: 100%;
		transition: 100ms;
	}
	button:hover {
		background-color: var(--button-hover-color);
	}
</style>
