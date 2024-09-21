import Toggle from "react-toggle";
import "react-toggle/style.css";
import "./ThemeToggle.css";

function ThemeToggle() {
  function toggleTheme() {
    document.body.classList.toggle("dark-mode");
  }
  return (
    <>
      <Toggle
        onChange={toggleTheme}
        icons={{
          checked: "☾",
          unchecked: "☼",
        }}
        className="theme-toggle"
      />
    </>
  );
}

export default ThemeToggle;
