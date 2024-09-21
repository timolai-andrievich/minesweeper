import Board from "./components/Board";
import ThemeToggle from "./components/ThemeToggle";
import "./App.css";

function App() {
  return (
    <>
      <div className="container">
        <Board height={10} width={10} mines={10} />
      </div>

      <div id="theme-toggle">
        <ThemeToggle />
      </div>
    </>
  );
}

export default App;
