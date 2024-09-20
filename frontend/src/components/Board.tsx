import Cell from "./Cell";
import "./Board.css";
import { ReactNode, useState } from "react";
interface BoardProps {
  height: number;
  width: number;
  mines: number;
}

class GameCell {
  isMine: boolean;
  isRevealed: boolean;
  flagged: boolean;
  hinted: boolean;
  constructor() {
    this.isMine = false;
    this.isRevealed = false;
    this.flagged = false;
    this.hinted = false;
  }
}

function Board(props: BoardProps) {
  function generateBoard(
    height: number,
    width: number,
    mines: number,
  ): GameCell[][] {
    let genBoard = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => new GameCell()),
    );
    let minesRemaining = mines;
    while (minesRemaining > 0) {
      let row = Math.floor(Math.random() * height);
      let col = Math.floor(Math.random() * width);
      if (genBoard[row][col].isMine) {
        continue;
      }
      genBoard[row][col].isMine = true;
      minesRemaining--;
    }
    return genBoard;
  }
  function calculateNumbers(board: GameCell[][]): number[][] {
    let height = board.length;
    let width = height > 0 ? board[0].length : 0;
    function isMine(row: number, col: number) {
      if (0 > row || row >= height || 0 > col || col >= width) {
        return 0;
      }
      if (board[row][col].isMine) {
        return 1;
      }
      return 0;
    }
    function countMines(row: number, col: number): number {
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
    let res = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => 0),
    );
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        res[row][col] = countMines(row, col);
      }
    }
    return res;
  }

  function checkFinished(board: GameCell[][]): boolean {
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

  const [board, setBoard] = useState<GameCell[][]>([]);
  const [adjNumbers, setAdjNumbers] = useState<number[][]>([]);
  const [firstClick, setFirstClick] = useState<boolean>(true);
  const [finished, setFinished] = useState<boolean>(false);

  function updateBoard(newBoard: GameCell[][]) {
    console.log(`Setting board:`);
    console.log(setBoard);
    console.log(newBoard);
    setBoard(newBoard);
    console.log(`Set board:`);
    console.log(board);
    setAdjNumbers(calculateNumbers(board));
    setFinished(checkFinished(board));
  }

  function revealCell(row: number, col: number) {
    console.log(`Revealing ${row}, ${col}`)
    let boardCopy = structuredClone(board);
    if (row < 0 || row >= props.height || col < 0 || col >= props.width) {
      return;
    }
    if (firstClick) {
      while (board[row][col].isMine) {
        reset();
      }
      setFirstClick(false);
    }
    if (finished || board[row][col].isRevealed || board[row][col].flagged) {
      return;
    }
    boardCopy[row][col].isRevealed = true;
    if (adjNumbers[row][col] == 0 && !board[row][col].isMine) {
      for (let i = row - 1; i < row + 2; i++) {
        for (let j = col - 1; j < col + 2; j++) {
          revealCell(i, j);
        }
      }
    }
    updateBoard(boardCopy);
  }

  function reset() {
    updateBoard(generateBoard(props.height, props.width, props.mines));
  }

  function flagCell(row: number, col: number) {
    let newBoard = structuredClone(board);
    if (finished || board[row][col].isRevealed) {
      return;
    }
    newBoard[row][col].flagged = !newBoard[row][col].flagged;
    updateBoard(newBoard);
  }

  async function getLeastLikelyCell() {
    // TODO use API library
    class ApiCell {
      isRevealed: boolean;
      adjacentMines: number;
      constructor(revealed: boolean, adjacent: number) {
        this.isRevealed = revealed;
        this.adjacentMines = adjacent;
      }
    }
    let apiBoard = Array.from({ length: props.height }, () =>
      Array.from({ length: props.width }, () => new ApiCell(false, 0)),
    );
    for (let row = 0; row < props.height; row++) {
      for (let col = 0; col < props.width; col++) {
        apiBoard[row][col].adjacentMines = adjNumbers[row][col];
        apiBoard[row][col].isRevealed = board[row][col].isRevealed;
      }
    }
    let requestBody = {
      height: props.height,
      width: props.width,
      board: apiBoard,
    };
    let response = await fetch("/api/leastLikelyCell", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    let result = await response.json();
    return result;
  }

  async function hint() {
    if (finished) {
      return;
    }
    let newBoard = structuredClone(board);
    let coords = await getLeastLikelyCell();
    for (let row = 0; row < props.height; row++) {
      for (let col = 0; col < props.width; col++) {
        newBoard[row][col].hinted = false;
      }
    }
    newBoard[coords[0]][coords[1]].hinted = true;
    updateBoard(newBoard);
  }

  async function aiReveal() {
    if (finished) {
      return;
    }
    let coords = await getLeastLikelyCell();
    revealCell(coords[0], coords[1]);
  }

  async function play() {
    while (!finished) {
      await aiReveal();
      await new Promise((r) => setTimeout(r, 20));
    }
  }

  const [rendered, setRendered] = useState(false);
  const [renderedCells, setRenderedCells] = useState<ReactNode[]>([]);
  function renderCells() {
    if (rendered) {
      return;
    }
    setRendered(true);
    console.log("rendering")
    reset();
    let cells = [];
    for (let row = 0; row < props.height; row++) {
      let rowArray = [];
      for (let col = 0; col < props.width; col++) {
        rowArray.push(
          <Cell
            mine={false}
            revealed={false}
            flagged={false}
            hinted={false}
            adjacentMines={0}
            onReveal={() => revealCell(row, col)}
            onFlagged={() => flagCell(row, col)}
            key={`${row}|${col}`}
          />,
        );
      }
      cells.push(
        <div className="row" key={`${row}`}>
          {rowArray}
        </div>,
      );
    }
    setRenderedCells(cells);
  }
  renderCells();
  return (
    <>
      <div id="container">
        <div id="board">{renderedCells}</div>
        <div id="controls">
          <button className="board" onClick={reset}>
            ⟳
          </button>
          <button className="board" onClick={hint}>
            💡
          </button>
          <button className="board" onClick={play}>
            ▶
          </button>
        </div>
      </div>
    </>
  );
}

export default Board;
