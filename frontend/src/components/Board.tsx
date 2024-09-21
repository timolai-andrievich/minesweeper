import Cell from "./Cell";
import "./Board.css";
import { ReactNode, useEffect, useState } from "react";
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

function cloneBoard(board: GameCell[][]): GameCell[][] {
  return JSON.parse(JSON.stringify(board));
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

  const [board, setBoard] = useState<GameCell[][]>(
    generateBoard(props.height, props.width, props.mines),
  );
  const [adjNumbers, setAdjNumbers] = useState<number[][]>(
    calculateNumbers(board),
  );
  const [firstClick, setFirstClick] = useState<boolean>(true);
  const [finished, setFinished] = useState<boolean>(checkFinished(board));

  function updateBoard(newBoard: GameCell[][]) {
    setBoard(newBoard);
    setAdjNumbers(calculateNumbers(newBoard));
    setFinished(checkFinished(newBoard));
  }

  function revealCell(
    board: GameCell[][],
    row: number,
    col: number,
  ): GameCell[][] {
    // TODO do not clone the board so much
    let boardCopy = cloneBoard(board);
    if (row < 0 || row >= props.height || col < 0 || col >= props.width) {
      return boardCopy;
    }
    if (
      finished ||
      boardCopy[row][col].isRevealed ||
      boardCopy[row][col].flagged
    ) {
      return boardCopy;
    }
    boardCopy[row][col].isRevealed = true;
    if (adjNumbers[row][col] == 0 && !boardCopy[row][col].isMine) {
      for (let i = row - 1; i < row + 2; i++) {
        for (let j = col - 1; j < col + 2; j++) {
          if (i == row && j == col) {
            continue;
          }
          boardCopy = revealCell(boardCopy, i, j);
        }
      }
    }
    return boardCopy;
  }

  function revealCellWrapper(row: number, col: number) {
    let newBoard = cloneBoard(board);
    if (firstClick) {
      while (newBoard[row][col].isMine) {
        newBoard = generateBoard(props.height, props.width, props.mines);
      }
      setFirstClick(false);
    }
    newBoard = revealCell(newBoard, row, col);
    updateBoard(newBoard);
  }

  function reset() {
    updateBoard(generateBoard(props.height, props.width, props.mines));
  }

  function flagCell(row: number, col: number) {
    let newBoard = cloneBoard(board);
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
    let newBoard = cloneBoard(board);
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
    revealCellWrapper(coords[0], coords[1]);
  }

  const [renderedCells, setRenderedCells] = useState<ReactNode[]>([]);
  function renderCells() {
    let cells = [];
    for (let row = 0; row < props.height; row++) {
      let rowArray = [];
      for (let col = 0; col < props.width; col++) {
        rowArray.push(
          <Cell
            mine={board[row][col].isMine}
            revealed={board[row][col].isRevealed}
            flagged={board[row][col].flagged}
            hinted={board[row][col].hinted}
            adjacentMines={adjNumbers[row][col]}
            onReveal={() => revealCellWrapper(row, col)}
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
  useEffect(renderCells, [board]);
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
          <button className="board" onClick={aiReveal}>
            ▶
          </button>
        </div>
      </div>
    </>
  );
}

export default Board;
