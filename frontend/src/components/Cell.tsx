import "./Cell.css";
interface CellProps {
  mine: boolean;
  revealed: boolean;
  adjacentMines: number;
  flagged: boolean;
  hinted: boolean;
  onReveal: () => void;
  onFlagged: () => void;
}

function Cell(props: CellProps) {
  function getText(): string {
    if (props.flagged) {
      return "🚩";
    } else if (!props.revealed) {
      return "";
    } else if (props.mine) {
      return "💥";
    } else if (props.adjacentMines == 0) {
      return "";
    } else {
      return props.adjacentMines.toString();
    }
  }

  const mine = props.mine && props.revealed ? "mine" : "";
  const revealed = props.revealed ? "revealed" : "";
  const flagged = props.flagged ? "flagged" : "";
  const hinted = props.hinted ? "hinted" : "";
  const classString = `cell ${mine} ${revealed} ${flagged} ${hinted}`;
  return (
    <button
      className={classString}
      onMouseDown={(event) => {
        if (event.buttons == 1) {
          props.onReveal();
        } else if (event.buttons == 2) {
          props.onFlagged();
        }
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {getText()}
    </button>
  );
}

export default Cell;
